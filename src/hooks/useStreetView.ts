"use client";

/**
 * useStreetView Hook
 * Street View yonetimi - Hareket limiti ve PANO CACHING ile maliyet kontrolu
 *
 * API MALIYET AZALTMA STRATEJISI:
 * 1. Ziyaret edilen pano'lar cache'lenir (visitedPanosRef)
 * 2. Ayni pano'ya tekrar gidildiginde hareket butcesi TUKETMEZ
 * 3. Hareket butcesi sadece YENI (daha once gorulmemis) pano ziyaretinde azalir
 * 4. Baslangica donus her zaman serbesttir ve butce tuketmez
 * 5. Pano ID ile dogrudan gosterim API cagrisi yapmaz (setPano)
 *
 * NAVIGATION ENGINE v4 - COST ROOT CAUSE FIX:
 * - Panorama object REUSED across rounds (constructor count = 1 per session)
 * - panoId validation REMOVED (skip -> direct setPano, fallback only on load error)
 * - Move rejection blocks BEFORE setPano (not after via revert)
 * - "Expected pano" flag prevents revert cascades in pano_changed
 * - [COST] instrumentation: resolveFromCoordsCallCount tracks ONLY real getPanorama calls
 *
 * DECOMPOSITION NOTE (v5):
 * This file is now an orchestrator that delegates to focused sub-hooks:
 * - streetview/navigationMetrics.ts — metrics singleton
 * - streetview/useGoogleMapsLoader.ts — Google Maps API loading
 * - streetview/useCameraDrift.ts — pitch drift prevention
 * - streetview/useNavigationEngine.ts — click heading & link resolution
 * - streetview/usePanoLifecycle.ts — panorama creation/destruction/integrity
 * The external API is UNCHANGED.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Coordinates, PanoPackage } from "@/types";
import { generateRandomCoordinates, isLikelyInTurkey, getLocationName } from "@/utils";
import { database, ref, runTransaction } from "@/config/firebase";
import rateLimiter from "@/utils/rateLimiter";
import { RATE_LIMITS } from "@/config/production";
import { logger } from "@/utils/logger";
import { trackEvent } from "@/utils/telemetry";

// Sub-hooks
import { useGoogleMapsLoader } from "./streetview/useGoogleMapsLoader";
import { useCameraDrift } from "./streetview/useCameraDrift";
import { useNavigationEngine, calculateClickHeading as calcClickHeading, findNearestLink as findLink } from "./streetview/useNavigationEngine";
import { usePanoLifecycle } from "./streetview/usePanoLifecycle";
import {
  getMetricsRef,
  logCostMetrics,
} from "./streetview/navigationMetrics";
import {
  MAX_ATTEMPTS,
  BUDGET_WARNING_THRESHOLD,
  DRAG_THRESHOLD_PX,
  CLICK_COOLDOWN_MS,
} from "./streetview/types";

// ==================== RE-EXPORTS ====================
// These re-exports maintain backward compatibility for existing imports
// from '@/hooks/useStreetView' (used by tests, barrel exports, etc.)
export {
  getNavigationMetrics,
  resetNavigationMetrics,
} from "./streetview/navigationMetrics";
export type { NavigationMetrics } from "./streetview/types";

export function useStreetView(roomId?: string, playerId?: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navigationError, setNavigationError] = useState<string | null>(null);

  // Hareket limiti sistemi
  const [movesUsed, setMovesUsed] = useState(0);
  const [moveLimit, setMoveLimitState] = useState(3);
  const [isMovementLocked, setIsMovementLocked] = useState(false);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);

  // Ref'ler - ALL navigation state uses refs to avoid stale closures
  const movesUsedRef = useRef(0);
  const moveLimitRef = useRef(3);
  const isMovementLockedRef = useRef(false); // FIX: ref for closure safety

  // Pozisyon tracking
  const startPanoIdRef = useRef<string | null>(null);
  const startHeadingRef = useRef<number>(0);
  const lastPanoIdRef = useRef<string | null>(null);
  const lastHeadingRef = useRef<number>(0);

  // Pano cache
  const visitedPanosRef = useRef<Set<string>>(new Set());

  // Custom navigation icin ref'ler
  const pendingPitchRef = useRef<number>(0);
  const lastClickTimeRef = useRef<number>(0);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  // FIX: Event listener cleanup tracking
  const cleanupFnRef = useRef<(() => void) | null>(null);

  // v3 COST FIX: Expected pano tracking to prevent revert cascades
  const expectedPanoRef = useRef<string | null>(null);

  // BUG-2 FIX: Navigation error dismiss timer tracking
  const navErrorTimerRef = useRef<NodeJS.Timeout | null>(null);

  // BUG-2 FIX: setPano timeout guard
  const panoLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [panoLoadFailed, setPanoLoadFailed] = useState(false);

  // Server-side move enforcement: blocks concurrent transactions
  const isPendingMoveRef = useRef(false);
  // Track roomId/playerId in refs for closure safety
  const roomIdRef = useRef(roomId);
  const playerIdRef = useRef(playerId);

  // ==================== SUB-HOOKS ====================
  const { initializeGoogleMaps, streetViewServiceRef } = useGoogleMapsLoader();
  const cameraDrift = useCameraDrift();
  const navEngine = useNavigationEngine();
  const panoLifecycle = usePanoLifecycle();

  // B1-FIX v2: Wire lifecycle resume to drift tracker reset + corruption detector reset
  useEffect(() => {
    panoLifecycle.onResumeRef.current = () => {
      const panorama = panoLifecycle.panoramaRef.current;
      if (panorama) {
        const pov = panorama.getPov();
        cameraDrift.resetDrift(pov.pitch || 0);
        logger.debug("[Nav] B1-FIX: Drift tracker reset on lifecycle resume, anchor=" + (pov.pitch || 0).toFixed(1));
      }
    };
    return () => {
      panoLifecycle.onResumeRef.current = null;
    };
  }, [panoLifecycle, cameraDrift]);

  // Expose streetViewRef from panoLifecycle
  const streetViewRef = panoLifecycle.streetViewRef;

  // Keep roomId/playerId refs in sync
  useEffect(() => {
    roomIdRef.current = roomId;
    playerIdRef.current = playerId;
  }, [roomId, playerId]);

  // Keep isMovementLockedRef in sync with state
  useEffect(() => {
    isMovementLockedRef.current = isMovementLocked;
  }, [isMovementLocked]);

  const setMoves = useCallback((limit: number) => {
    setMoveLimitState(limit);
    moveLimitRef.current = limit;
    setMovesUsed(0);
    movesUsedRef.current = 0;
    setIsMovementLocked(false);
    isMovementLockedRef.current = false;
    setShowBudgetWarning(false);
  }, []);

  const resetMoves = useCallback(() => {
    setMovesUsed(0);
    movesUsedRef.current = 0;
    setIsMovementLocked(false);
    isMovementLockedRef.current = false;
    setShowBudgetWarning(false);
    startPanoIdRef.current = null;
    lastPanoIdRef.current = null;
    visitedPanosRef.current.clear();
  }, []);

  // STABILITY FIX: Sync movesUsed from Firebase on page refresh / rejoin.
  const syncMovesUsed = useCallback((serverMovesUsed: number) => {
    if (serverMovesUsed > 0 && serverMovesUsed > movesUsedRef.current) {
      trackEvent("moves_sync_from_server", { serverMovesUsed, localMovesUsed: movesUsedRef.current });
      movesUsedRef.current = serverMovesUsed;
      setMovesUsed(serverMovesUsed);
      const limit = moveLimitRef.current;
      if (serverMovesUsed >= limit) {
        setIsMovementLocked(true);
        isMovementLockedRef.current = true;
      } else if (limit - serverMovesUsed <= 1) {
        setShowBudgetWarning(true);
      }
    }
  }, []);

  const returnToStart = useCallback(() => {
    const panorama = panoLifecycle.panoramaRef.current;
    if (panorama && startPanoIdRef.current) {
      const navigationMetrics = getMetricsRef();
      // DUPLICATE GUARD: Zaten baslangictaysa sadece POV restore et
      if (panorama.getPano() === startPanoIdRef.current) {
        panorama.setPov({
          heading: startHeadingRef.current,
          pitch: 0,
        });
        navigationMetrics.duplicatePanoPrevented++;
        lastHeadingRef.current = startHeadingRef.current;
        return;
      }
      // v4: HARD GUARD -- returnToStart uses setPano(startPanoId) ONLY.
      expectedPanoRef.current = startPanoIdRef.current;
      panorama.setPano(startPanoIdRef.current);
      navigationMetrics.panoLoadCount++;
      navigationMetrics.setPanoCallCount++;
      navigationMetrics.googleInternalMetadataEstimate++;
      panorama.setPov({
        heading: startHeadingRef.current,
        pitch: 0,
      });
      lastPanoIdRef.current = startPanoIdRef.current;
      lastHeadingRef.current = startHeadingRef.current;
      logCostMetrics("returnToStart", { pano: startPanoIdRef.current.substring(0, 12) });
    }
  }, [panoLifecycle.panoramaRef]);

  /**
   * Street View'i goster - v5 delegated to sub-hooks
   *
   * v3 COST FIXES preserved:
   * 1. Panorama object REUSED
   * 2. expectedPanoRef tracks intentional setPano calls
   * 3. Revert logic uses expectedPano to avoid cascading setPano calls
   * 4. Move budget enforced BEFORE setPano in click handler (not after via revert)
   * 5. [COST] instrumentation on every metadata-triggering operation
   */
  const showStreetView = useCallback(
    async (panoId: string, heading: number = 0) => {
      await initializeGoogleMaps();

      if (!streetViewRef.current) {
        logger.warn("[Nav] streetViewRef is null");
        return;
      }

      const navigationMetrics = getMetricsRef();

      // ============================================
      // FIX #1: Clean up previous event listeners
      // ============================================
      if (cleanupFnRef.current) {
        cleanupFnRef.current();
        cleanupFnRef.current = null;
        navigationMetrics.listenerDetachCount++;
      }

      // Baslangic pozisyonunu kaydet
      startPanoIdRef.current = panoId;
      startHeadingRef.current = heading;
      lastPanoIdRef.current = panoId;
      lastHeadingRef.current = heading;
      pendingPitchRef.current = 0;

      // v3: Set expected pano for the initial load
      expectedPanoRef.current = panoId;

      // Reset drift tracker for new pano
      cameraDrift.resetDrift(0);

      // Baslangic pano'sunu cache'e ekle
      visitedPanosRef.current.add(panoId);

      // v4: Reset per-round cost metrics
      navigationMetrics.resolveFromCoordsCallCountPerRound = 0;
      navigationMetrics.resolveFromCoordsCallCountOnRevisit = 0;
      navigationMetrics.googleInternalMetadataEstimate = 0;
      navigationMetrics.setPanoCallCount = 0;
      navigationMetrics.revertPanoCallCount = 0;
      navigationMetrics.fallbackMetadataCallCount = 0;

      // Mobil cihaz tespiti
      const isMobile = window.matchMedia("(pointer: coarse)").matches ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // ============================================
      // PANORAMA LIFECYCLE — delegate to sub-hook
      // ============================================
      const panorama = panoLifecycle.ensurePanorama(panoId, heading, isMobile);
      if (!panorama) return;

      // ============================================
      // PANO_CHANGED EVENT - Hareket limiti + Pitch restore
      // v4: NO metadata counters here. This handler NEVER calls getPanorama().
      // ============================================
      panorama.addListener("pano_changed", () => {
        if (!panoLifecycle.panoramaRef.current) return;

        const currentPanoId = panoLifecycle.panoramaRef.current.getPano();
        const currentPov = panoLifecycle.panoramaRef.current.getPov();

        // Ayni panoda kalinmissa
        if (currentPanoId === lastPanoIdRef.current) {
          lastHeadingRef.current = currentPov.heading || 0;
          navigationMetrics.rotateCount++;
          return;
        }

        // Check if this is an expected pano change (we initiated it)
        const wasExpected = expectedPanoRef.current === currentPanoId;
        expectedPanoRef.current = null;

        // KRITIK: Pitch'i RESTORE ET
        const targetHeading = currentPov.heading || lastHeadingRef.current || 0;
        const targetPitch = pendingPitchRef.current;

        requestAnimationFrame(() => {
          if (panoLifecycle.panoramaRef.current) {
            panoLifecycle.panoramaRef.current.setPov({
              heading: targetHeading,
              pitch: targetPitch,
            });
          }
        });

        // Baslangica donus kontrolu
        if (currentPanoId === startPanoIdRef.current) {
          lastPanoIdRef.current = currentPanoId;
          lastHeadingRef.current = targetHeading;
          return;
        }

        // Cache kontrolu
        const isPanoVisited = visitedPanosRef.current.has(currentPanoId);
        if (isPanoVisited) {
          lastPanoIdRef.current = currentPanoId;
          lastHeadingRef.current = targetHeading;
          return;
        }

        // Hareket limiti kontrolu (client-side fast check)
        const currentMoves = movesUsedRef.current;
        const limit = moveLimitRef.current;

        if (currentMoves >= limit) {
          if (!wasExpected) {
            logger.debug("[Nav] Move limit reached - reverting pano");
            navigationMetrics.moveRejectedCount++;
            const revertPanoId = lastPanoIdRef.current || startPanoIdRef.current;
            expectedPanoRef.current = revertPanoId;
            if (panoLifecycle.panoramaRef.current && revertPanoId) {
              panoLifecycle.panoramaRef.current.setPano(revertPanoId);
              navigationMetrics.revertPanoCallCount++;
              navigationMetrics.setPanoCallCount++;
              navigationMetrics.googleInternalMetadataEstimate++;
              panoLifecycle.panoramaRef.current.setPov({
                heading: lastHeadingRef.current,
                pitch: targetPitch,
              });
            }
          }
          setIsMovementLocked(true);
          isMovementLockedRef.current = true;
          return;
        }

        // CONCURRENT MOVE GUARD: Bekleyen transaction varsa revert
        if (isPendingMoveRef.current) {
          const revertId = lastPanoIdRef.current || startPanoIdRef.current;
          if (!wasExpected && panoLifecycle.panoramaRef.current && revertId) {
            expectedPanoRef.current = revertId;
            panoLifecycle.panoramaRef.current.setPano(revertId);
            navigationMetrics.revertPanoCallCount++;
            navigationMetrics.setPanoCallCount++;
            navigationMetrics.googleInternalMetadataEstimate++;
          }
          return;
        }

        // RATE LIMIT CHECK (client-side defense-in-depth)
        const rlRoom = roomIdRef.current || "solo";
        const rlPlayer = playerIdRef.current || "local";
        const moveRateKey1s = `move_${rlRoom}_${rlPlayer}_1s`;
        const moveRateKey10s = `move_${rlRoom}_${rlPlayer}_10s`;

        if (!rateLimiter.check(moveRateKey1s, RATE_LIMITS.MOVE_PER_SECOND, 1000) ||
            !rateLimiter.check(moveRateKey10s, RATE_LIMITS.MOVE_PER_10_SECONDS, 10000)) {
          navigationMetrics.rateLimitTriggered++;
          const rlRevertId = lastPanoIdRef.current || startPanoIdRef.current;
          if (!wasExpected && panoLifecycle.panoramaRef.current && rlRevertId) {
            expectedPanoRef.current = rlRevertId;
            panoLifecycle.panoramaRef.current.setPano(rlRevertId);
            navigationMetrics.revertPanoCallCount++;
            navigationMetrics.setPanoCallCount++;
            navigationMetrics.googleInternalMetadataEstimate++;
          }
          return;
        }

        // ============================================
        // SERVER-SIDE MOVE ENFORCEMENT via Firebase Transaction
        // ============================================
        const currentRoomId = roomIdRef.current;
        const currentPlayerId = playerIdRef.current;

        if (currentRoomId && currentPlayerId) {
          // Multiplayer: Server-enforced move
          isPendingMoveRef.current = true;
          const playerMovesRef = ref(database, `rooms/${currentRoomId}/players/${currentPlayerId}/movesUsed`);

          runTransaction(playerMovesRef, (currentVal: number | null) => {
            const current = currentVal || 0;
            if (current >= limit) {
              return; // Abort transaction -- server rejects
            }
            return current + 1;
          }).then((result) => {
            if (result.committed) {
              // Server approved move
              const newMoveCount = result.snapshot.val() as number;
              movesUsedRef.current = newMoveCount;
              setMovesUsed(newMoveCount);
              visitedPanosRef.current.add(currentPanoId);
              lastPanoIdRef.current = currentPanoId;
              lastHeadingRef.current = targetHeading;
              navigationMetrics.moveCount++;
              navigationMetrics.serverMoveAccepted++;

              if (limit - newMoveCount <= BUDGET_WARNING_THRESHOLD) {
                setShowBudgetWarning(true);
              }

              if (newMoveCount >= limit) {
                setIsMovementLocked(true);
                isMovementLockedRef.current = true;
              }

              logger.debug(`[Nav] Move: ${newMoveCount}/${limit} | pano=${currentPanoId.substring(0, 8)}... (server-approved)`);
              logCostMetrics("moveAccepted", { move: newMoveCount, limit });
            } else {
              // Server rejected move -- revert pano
              logger.debug("[Nav] Server rejected move — reverting");
              navigationMetrics.serverMoveRejected++;
              if (panoLifecycle.panoramaRef.current && lastPanoIdRef.current) {
                expectedPanoRef.current = lastPanoIdRef.current;
                panoLifecycle.panoramaRef.current.setPano(lastPanoIdRef.current);
                navigationMetrics.revertPanoCallCount++;
                navigationMetrics.setPanoCallCount++;
                navigationMetrics.googleInternalMetadataEstimate++;
                panoLifecycle.panoramaRef.current.setPov({
                  heading: lastHeadingRef.current,
                  pitch: targetPitch,
                });
              }
              setIsMovementLocked(true);
              isMovementLockedRef.current = true;
            }
          }).catch((err) => {
            // Network error -- revert pano, log
            logger.warn("[Nav] Move transaction failed:", err);
            navigationMetrics.serverMoveRejected++;
            if (panoLifecycle.panoramaRef.current && lastPanoIdRef.current) {
              expectedPanoRef.current = lastPanoIdRef.current;
              panoLifecycle.panoramaRef.current.setPano(lastPanoIdRef.current);
              navigationMetrics.revertPanoCallCount++;
              navigationMetrics.setPanoCallCount++;
              navigationMetrics.googleInternalMetadataEstimate++;
            }
          }).finally(() => {
            isPendingMoveRef.current = false;
          });
        } else {
          // Solo/test mode: client-only fallback (backward compat)
          const newMoveCount = currentMoves + 1;
          movesUsedRef.current = newMoveCount;
          setMovesUsed(newMoveCount);
          visitedPanosRef.current.add(currentPanoId);
          lastPanoIdRef.current = currentPanoId;
          lastHeadingRef.current = targetHeading;
          navigationMetrics.moveCount++;

          if (limit - newMoveCount <= BUDGET_WARNING_THRESHOLD) {
            setShowBudgetWarning(true);
          }

          if (newMoveCount >= limit) {
            setIsMovementLocked(true);
            isMovementLockedRef.current = true;
          }

          logger.debug(`[Nav] Move: ${newMoveCount}/${limit} | pano=${currentPanoId.substring(0, 8)}... (client-only)`);
          logCostMetrics("moveAccepted", { move: newMoveCount, limit });
        }
      });

      // ============================================
      // CAMERA DRIFT PREVENTION — delegate to sub-hook
      // B1-FIX v2: Pass generation guard and corruption reinit callback
      // ============================================
      const currentGen = panoLifecycle.listenerGenerationRef.current;
      const removeDriftListener = cameraDrift.attachDriftCorrection(
        panorama,
        () => {
          // Corruption reinit callback — hard recreate panorama
          logger.warn("[Nav] B1-FIX v2: Corruption detector triggered reinit");
          panoLifecycle.hardRecreatePanorama();
        },
        panoLifecycle.lastKnownGoodPOVRef,
        currentGen,
        panoLifecycle.listenerGenerationRef,
      );

      // ============================================
      // CUSTOM CLICK NAVIGATION
      // ============================================
      const container = streetViewRef.current!;

      const handlePointerDown = (e: PointerEvent) => {
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
        cameraDrift.handleDragStart(panoLifecycle.panoramaRef.current);
      };

      const handlePointerUp = (e: PointerEvent) => {
        // Drift correction on drag end
        cameraDrift.handleDragEnd(panoLifecycle.panoramaRef.current);

        // FIX #3: STRICT null guard - no pointerdown = no navigation
        if (!pointerStartRef.current) {
          navigationMetrics.missingPointerDownCount++;
          return;
        }

        // Drag threshold kontrolu
        const dx = Math.abs(e.clientX - pointerStartRef.current.x);
        const dy = Math.abs(e.clientY - pointerStartRef.current.y);
        const moved = Math.sqrt(dx * dx + dy * dy);
        pointerStartRef.current = null;

        if (moved > DRAG_THRESHOLD_PX) {
          navigationMetrics.dragDetectedCount++;
          lastClickTimeRef.current = Date.now();
          return;
        }

        // Cooldown: blocks rapid double-clicks AND post-drag ghost taps
        const now = Date.now();
        if (now - lastClickTimeRef.current < CLICK_COOLDOWN_MS) {
          navigationMetrics.cooldownRejectedCount++;
          navigationMetrics.postDragSuppressedCount++;
          return;
        }
        lastClickTimeRef.current = now;

        if (!panoLifecycle.panoramaRef.current) return;

        const currentPov = panoLifecycle.panoramaRef.current.getPov();
        const links = panoLifecycle.panoramaRef.current.getLinks();

        // Helper: set nav error with tracked auto-dismiss timeout
        const showNavError = (msg: string) => {
          setNavigationError(msg);
          if (navErrorTimerRef.current) clearTimeout(navErrorTimerRef.current);
          navErrorTimerRef.current = setTimeout(() => {
            navErrorTimerRef.current = null;
            setNavigationError(null);
          }, 2000);
        };

        if (!links || links.length === 0) {
          showNavError("Bu yonde gidilebilecek yol yok");
          return;
        }

        const clickHeading = calcClickHeading(
          e.clientX,
          e.clientY,
          container,
          currentPov.heading || 0
        );

        const nearestLink = findLink(clickHeading, links);

        if (!nearestLink) {
          showNavError("Bu yonde gidilebilecek yol yok");
          return;
        }

        // NAV-001 FIX: Movement lock check AFTER link resolution.
        if (isMovementLockedRef.current) {
          const targetPanoId = nearestLink.pano;
          const isTargetCached = targetPanoId &&
            (visitedPanosRef.current.has(targetPanoId) || targetPanoId === startPanoIdRef.current);

          if (!isTargetCached) {
            navigationMetrics.moveRejectedCount++;
            showNavError("Hareket hakkin bitti!");
            return;
          }
        }

        logger.debug(`[Nav] Click navigate: heading=${nearestLink.heading?.toFixed(0)}, pano=${nearestLink.pano?.substring(0, 8)}...`);
        navEngine.navigateToLink(nearestLink, panoLifecycle.panoramaRef.current, pendingPitchRef, expectedPanoRef);
        setNavigationError(null);
      };

      // Prevent context menu on long press (mobile)
      const handleContextMenu = (e: Event) => {
        e.preventDefault();
      };

      // pointercancel: touch interrupted
      const handlePointerCancel = () => {
        cameraDrift.handleDragEnd(panoLifecycle.panoramaRef.current);
        pointerStartRef.current = null;
      };

      // Attach listeners in capture phase so Google internal handlers cannot swallow
      // pointer events before our custom move-budget/navigation logic sees them.
      container.addEventListener("pointerdown", handlePointerDown, true);
      container.addEventListener("pointerup", handlePointerUp, true);
      container.addEventListener("pointercancel", handlePointerCancel, true);
      container.addEventListener("contextmenu", handleContextMenu, true);
      navigationMetrics.listenerAttachCount++;

      // ============================================
      // BUG-001 DEFENSE: MutationObserver
      // ============================================
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          const addedNodes = Array.from(mutation.addedNodes);
          addedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            const links = node.matches?.('a[href*="google.com/maps"]')
              ? [node]
              : Array.from(node.querySelectorAll?.('a[href*="google.com/maps"]') ?? []);
            links.forEach((link) => {
              const el = link as HTMLElement;
              el.style.pointerEvents = 'none';
              el.style.opacity = '0';
              el.style.position = 'absolute';
              el.style.width = '1px';
              el.style.height = '1px';
              el.style.overflow = 'hidden';
              el.style.clip = 'rect(0,0,0,0)';
            });
          });
        });
      });
      observer.observe(container, { childList: true, subtree: true });

      // FIX #1 continued: Store cleanup function
      cleanupFnRef.current = () => {
        container.removeEventListener("pointerdown", handlePointerDown, true);
        container.removeEventListener("pointerup", handlePointerUp, true);
        container.removeEventListener("pointercancel", handlePointerCancel, true);
        container.removeEventListener("contextmenu", handleContextMenu, true);
        pointerStartRef.current = null;
        observer.disconnect();
        removeDriftListener();
      };
    },
    [initializeGoogleMaps, cameraDrift, navEngine, panoLifecycle]
  );

  // Stable ref for panoLifecycle to avoid cleanup re-runs on every render.
  // usePanoLifecycle() returns a new object reference each render, but its
  // internal refs (panoramaRef, etc.) are stable. Without this ref, the
  // cleanup effect below would fire on every re-render, removing all
  // pointer event listeners and destroying the panorama.
  const panoLifecycleRef = useRef(panoLifecycle);
  panoLifecycleRef.current = panoLifecycle;

  // Cleanup on unmount only (empty deps)
  useEffect(() => {
    return () => {
      if (cleanupFnRef.current) {
        cleanupFnRef.current();
        cleanupFnRef.current = null;
      }
      panoLifecycleRef.current.destroyPanorama();
      if (panoLoadTimeoutRef.current) {
        clearTimeout(panoLoadTimeoutRef.current);
        panoLoadTimeoutRef.current = null;
      }
      if (navErrorTimerRef.current) {
        clearTimeout(navErrorTimerRef.current);
        navErrorTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Show a pano package in the Street View panorama.
   *
   * v3 COST FIX: REMOVED the panoId validation call.
   * BEFORE: getPanorama({pano: id}) -> validate -> if invalid -> getPanorama({location}) -> showStreetView
   *   = 2-3 GetMetadata calls per round start
   * AFTER: showStreetView(id) directly -> if status_changed reports error -> THEN fallback
   *   = 1 GetMetadata call per round start (the setPano itself)
   */
  const showPanoPackage = useCallback(
    async (panoPackage: PanoPackage) => {
      setIsLoading(true);
      try {
        await initializeGoogleMaps();
        resetMoves();

        const navigationMetrics = getMetricsRef();
        const panoId = panoPackage.pano0.panoId;
        const heading = panoPackage.pano0.heading;

        if (!streetViewServiceRef.current) {
          streetViewServiceRef.current = new google.maps.StreetViewService();
        }

        setPanoLoadFailed(false);

        if (panoLoadTimeoutRef.current) {
          clearTimeout(panoLoadTimeoutRef.current);
          panoLoadTimeoutRef.current = null;
        }

        await showStreetView(panoId, heading);

        if (panoLifecycle.panoramaRef.current) {
          let fallbackTriggered = false;
          let loadSucceeded = false;

          const clearTimeoutGuard = () => {
            if (panoLoadTimeoutRef.current) {
              clearTimeout(panoLoadTimeoutRef.current);
              panoLoadTimeoutRef.current = null;
            }
          };

          const triggerFallback = (status: string) => {
            if (fallbackTriggered) return;
            fallbackTriggered = true;
            clearTimeoutGuard();

            logger.warn(`[Nav] Pano ID expired (status=${status}), resolving from coords: [REDACTED]`);
            navigationMetrics.resolveFromCoordsCallCountPerRound++;
            navigationMetrics.fallbackMetadataCallCount++;
            logCostMetrics("fallbackResolve", { reason: "panoExpired", status });

            streetViewServiceRef.current!.getPanorama(
              {
                location: { lat: panoPackage.pano0.lat, lng: panoPackage.pano0.lng },
                radius: 1000,
                preference: google.maps.StreetViewPreference.NEAREST,
                source: google.maps.StreetViewSource.OUTDOOR,
              },
              (data, freshStatus) => {
                if (freshStatus === google.maps.StreetViewStatus.OK && data?.location?.pano) {
                  const freshPanoId = data.location.pano;
                  logger.debug(`[Nav] Fresh pano resolved: ${freshPanoId.substring(0, 20)}...`);

                  startPanoIdRef.current = freshPanoId;
                  lastPanoIdRef.current = freshPanoId;
                  visitedPanosRef.current.add(freshPanoId);
                  expectedPanoRef.current = freshPanoId;

                  if (panoLifecycle.panoramaRef.current) {
                    panoLifecycle.panoramaRef.current.setPano(freshPanoId);
                    panoLifecycle.panoramaRef.current.setPov({ heading, pitch: 0 });
                    navigationMetrics.setPanoCallCount++;
                    navigationMetrics.googleInternalMetadataEstimate++;
                  }

                  loadSucceeded = true;
                  logCostMetrics("fallbackSuccess", { pano: freshPanoId.substring(0, 12) });
                } else {
                  logger.error(`[Nav] Could not resolve pano from coords for [REDACTED]`);
                  setPanoLoadFailed(true);
                  setError("Street View yuklenemedi");
                }
              }
            );
          };

          const statusListener = panoLifecycle.panoramaRef.current.addListener("status_changed", () => {
            if (!panoLifecycle.panoramaRef.current) return;
            const status = panoLifecycle.panoramaRef.current.getStatus();

            if (status === google.maps.StreetViewStatus.OK) {
              loadSucceeded = true;
              clearTimeoutGuard();
            } else {
              triggerFallback(String(status));
            }

            google.maps.event.removeListener(statusListener);
          });

          // P1.2 FIX: Close race window
          const immediateStatus = panoLifecycle.panoramaRef.current.getStatus();
          if (immediateStatus && immediateStatus !== google.maps.StreetViewStatus.OK) {
            triggerFallback(String(immediateStatus));
            google.maps.event.removeListener(statusListener);
          } else if (immediateStatus === google.maps.StreetViewStatus.OK) {
            loadSucceeded = true;
          }

          // BUG-2 FIX: setPano timeout guard
          if (!loadSucceeded && !fallbackTriggered) {
            panoLoadTimeoutRef.current = setTimeout(() => {
              panoLoadTimeoutRef.current = null;
              if (!loadSucceeded && !fallbackTriggered) {
                logger.warn(`[Nav] setPano timeout (10s) -- triggering fallback for [REDACTED]`);
                trackEvent("blackScreenDetected", { reason: "setPanoTimeout", pano: panoId.substring(0, 12) });
                triggerFallback("TIMEOUT");
              }
            }, 10000);
          }

          // BUG-007 FIX: Post-load integrity check
          setTimeout(() => {
            if (loadSucceeded && !fallbackTriggered && !panoLifecycle.checkPanoramaIntegrity()) {
              logger.warn("[Nav] BUG-007: Post-load integrity check FAILED -- tiles missing");
              trackEvent("blackScreenDetected", { reason: "postLoadIntegrityFailed", pano: panoId.substring(0, 12) });
              panoLifecycle.hardRecreatePanorama();
            }
          }, 3000);
        }

        setIsLoading(false);
        logCostMetrics("roundStart", { pano: panoId.substring(0, 12) });
      } catch (err) {
        setError("Konum yuklenemedi");
        setIsLoading(false);
      }
    },
    [initializeGoogleMaps, showStreetView, resetMoves, panoLifecycle, streetViewServiceRef]
  );

  const showStreetViewFromCoords = useCallback(
    async (coords: Coordinates) => {
      await initializeGoogleMaps();

      if (!streetViewServiceRef.current) {
        streetViewServiceRef.current = new google.maps.StreetViewService();
      }

      const navigationMetrics = getMetricsRef();
      navigationMetrics.resolveFromCoordsCallCountPerRound++;
      logCostMetrics("showStreetViewFromCoords");

      return new Promise<string | null>((resolve) => {
        streetViewServiceRef.current!.getPanorama(
          {
            location: { lat: coords.lat, lng: coords.lng },
            radius: 500,
            preference: google.maps.StreetViewPreference.NEAREST,
            source: google.maps.StreetViewSource.OUTDOOR,
          },
          async (data, status) => {
            if (status === google.maps.StreetViewStatus.OK && data?.location?.pano) {
              await showStreetView(data.location.pano);
              resolve(data.location.pano);
            } else {
              resolve(null);
            }
          }
        );
      });
    },
    [initializeGoogleMaps, showStreetView, streetViewServiceRef]
  );

  const findRandomLocation = useCallback(async (): Promise<{
    coordinates: Coordinates;
    panoId: string;
    locationName: string;
  } | null> => {
    await initializeGoogleMaps();

    if (!streetViewServiceRef.current) {
      streetViewServiceRef.current = new google.maps.StreetViewService();
    }

    const navigationMetrics = getMetricsRef();

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const randomCoord = generateRandomCoordinates();

      if (!isLikelyInTurkey(randomCoord)) continue;

      try {
        navigationMetrics.resolveFromCoordsCallCountPerRound++;

        const result = await new Promise<google.maps.StreetViewPanoramaData | null>(
          (resolve) => {
            streetViewServiceRef.current!.getPanorama(
              {
                location: { lat: randomCoord.lat, lng: randomCoord.lng },
                radius: 5000,
                preference: google.maps.StreetViewPreference.BEST,
                source: google.maps.StreetViewSource.OUTDOOR,
              },
              (data, status) => {
                if (status === google.maps.StreetViewStatus.OK && data) {
                  resolve(data);
                } else {
                  resolve(null);
                }
              }
            );
          }
        );

        if (result?.location?.latLng) {
          const coords = {
            lat: result.location.latLng.lat(),
            lng: result.location.latLng.lng(),
          };

          if (isLikelyInTurkey(coords)) {
            const locationName = await getLocationName(coords);
            return {
              coordinates: coords,
              panoId: result.location.pano || "",
              locationName,
            };
          }
        }
      } catch (err) {
        logger.debug(`[Nav] Location search attempt ${attempt + 1} failed`);
      }
    }

    return null;
  }, [initializeGoogleMaps, streetViewServiceRef]);

  const loadNewLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const location = await findRandomLocation();

      if (location) {
        resetMoves();
        await showStreetView(location.panoId);
        setIsLoading(false);
        return location;
      } else {
        setError("Konum bulunamadi");
        setIsLoading(false);
        return null;
      }
    } catch (err) {
      setError("Bir hata olustu");
      setIsLoading(false);
      return null;
    }
  }, [findRandomLocation, showStreetView, resetMoves]);

  const movesRemaining = moveLimit - movesUsed;

  // Read-only accessors
  const getCurrentPanoId = useCallback((): string | null => {
    return panoLifecycle.panoramaRef.current?.getPano() || null;
  }, [panoLifecycle.panoramaRef]);

  const getCurrentPov = useCallback((): { heading: number; pitch: number } | null => {
    if (!panoLifecycle.panoramaRef.current) return null;
    const pov = panoLifecycle.panoramaRef.current.getPov();
    return { heading: pov.heading || 0, pitch: pov.pitch || 0 };
  }, [panoLifecycle.panoramaRef]);

  return {
    isLoading,
    error,
    navigationError,
    streetViewRef,
    // SECURITY: panoramaRef REMOVED -- console'dan setPano spam engellendi
    // Yerine read-only accessor'lar:
    getCurrentPanoId,
    getCurrentPov,
    loadNewLocation,
    showStreetView,
    showPanoPackage,
    showStreetViewFromCoords,
    initializeGoogleMaps,
    // Hareket sistemi
    movesUsed,
    movesRemaining,
    moveLimit,
    isMovementLocked,
    showBudgetWarning,
    setMoves,
    resetMoves,
    syncMovesUsed,
    returnToStart,
    // Cache bilgisi
    visitedPanoCount: visitedPanosRef.current.size,
    // BUG-2 FIX: Expose load failure state for UI fallback overlay
    panoLoadFailed,
  };
}
