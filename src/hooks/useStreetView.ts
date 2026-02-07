"use client";

/**
 * useStreetView Hook
 * Street View yönetimi - Hareket limiti ve PANO CACHING ile maliyet kontrolü
 *
 * API MALİYET AZALTMA STRATEJİSİ:
 * 1. Ziyaret edilen pano'lar cache'lenir (visitedPanosRef)
 * 2. Aynı pano'ya tekrar gidildiğinde hareket bütçesi TÜKETMEZ
 * 3. Hareket bütçesi sadece YENİ (daha önce görülmemiş) pano ziyaretinde azalır
 * 4. Başlangıca dönüş her zaman serbesttir ve bütçe tüketmez
 * 5. Pano ID ile doğrudan gösterim API çağrısı yapmaz (setPano)
 *
 * NAVIGATION ENGINE v2 - ROOT CAUSE FIXES:
 * - Event listener lifecycle: cleanup on every showStreetView call
 * - isMovementLocked uses ref (not stale state closure)
 * - linksControl: false - prevents Google's native arrow click bypass
 * - pointerStartRef null guard: missing pointerdown = no navigation
 * - Ghost click suppression with proper drag threshold
 * - Structured metrics for observability
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Coordinates, PanoPackage } from "@/types";
import { GOOGLE_MAPS_API_KEY } from "@/config/maps";
import { generateRandomCoordinates, isLikelyInTurkey, getLocationName } from "@/utils";
import { database, ref, runTransaction } from "@/config/firebase";
import rateLimiter from "@/utils/rateLimiter";
import { RATE_LIMITS } from "@/config/production";

// Sabitler
const MAX_ATTEMPTS = 50;
const BUDGET_WARNING_THRESHOLD = 1;

// Custom Navigation Sabitleri
const DRAG_THRESHOLD_PX = 12; // Slightly more generous to prevent false clicks on mobile
const CLICK_COOLDOWN_MS = 400; // Cooldown after any click OR drag — blocks post-drag ghost taps
const HEADING_CONFIDENCE_THRESHOLD = 60; // Derece cinsinden - bu açıdan uzak link'lere gitme

let globalLoader: Loader | null = null;
let isLoaded = false;

// ==================== NAVIGATION METRICS ====================
// Production observability: counters for monitoring navigation health
export interface NavigationMetrics {
  rotateCount: number;
  moveCount: number;
  ghostClickSuppressedCount: number;
  dragDetectedCount: number;
  moveRejectedCount: number; // Movement locked rejections
  cooldownRejectedCount: number; // Includes post-drag suppress
  postDragSuppressedCount: number; // Taps suppressed by post-drag cooldown
  missingPointerDownCount: number; // pointerup without pointerdown
  linkClickBypassCount: number; // Google native link clicks caught
  listenerAttachCount: number;
  listenerDetachCount: number;
  // Cost defense metrics
  panoLoadCount: number; // Total setPano calls that actually loaded
  serverMoveAccepted: number; // Firebase transaction succeeded
  serverMoveRejected: number; // Firebase transaction rejected/failed
  duplicatePanoPrevented: number; // setPano skipped (same pano)
  rateLimitTriggered: number; // Move rate limit blocks
}

let navigationMetrics: NavigationMetrics = {
  rotateCount: 0,
  moveCount: 0,
  ghostClickSuppressedCount: 0,
  dragDetectedCount: 0,
  moveRejectedCount: 0,
  cooldownRejectedCount: 0,
  postDragSuppressedCount: 0,
  missingPointerDownCount: 0,
  linkClickBypassCount: 0,
  listenerAttachCount: 0,
  listenerDetachCount: 0,
  panoLoadCount: 0,
  serverMoveAccepted: 0,
  serverMoveRejected: 0,
  duplicatePanoPrevented: 0,
  rateLimitTriggered: 0,
};

export function getNavigationMetrics(): NavigationMetrics {
  return { ...navigationMetrics };
}

export function resetNavigationMetrics(): void {
  navigationMetrics = {
    rotateCount: 0,
    moveCount: 0,
    ghostClickSuppressedCount: 0,
    dragDetectedCount: 0,
    moveRejectedCount: 0,
    cooldownRejectedCount: 0,
    postDragSuppressedCount: 0,
    missingPointerDownCount: 0,
    linkClickBypassCount: 0,
    listenerAttachCount: 0,
    listenerDetachCount: 0,
    panoLoadCount: 0,
    serverMoveAccepted: 0,
    serverMoveRejected: 0,
    duplicatePanoPrevented: 0,
    rateLimitTriggered: 0,
  };
}

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
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const streetViewServiceRef = useRef<google.maps.StreetViewService | null>(null);

  // Pozisyon tracking
  const startPanoIdRef = useRef<string | null>(null);
  const startHeadingRef = useRef<number>(0);
  const lastPanoIdRef = useRef<string | null>(null);
  const lastHeadingRef = useRef<number>(0);

  // Pano cache
  const visitedPanosRef = useRef<Set<string>>(new Set());

  // Custom navigation için ref'ler
  const pendingPitchRef = useRef<number>(0);
  const lastClickTimeRef = useRef<number>(0);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  // FIX: Event listener cleanup tracking
  const cleanupFnRef = useRef<(() => void) | null>(null);

  // Server-side move enforcement: blocks concurrent transactions
  const isPendingMoveRef = useRef(false);
  // Track roomId/playerId in refs for closure safety
  const roomIdRef = useRef(roomId);
  const playerIdRef = useRef(playerId);

  // Keep roomId/playerId refs in sync
  useEffect(() => {
    roomIdRef.current = roomId;
    playerIdRef.current = playerId;
  }, [roomId, playerId]);

  // Keep isMovementLockedRef in sync with state
  useEffect(() => {
    isMovementLockedRef.current = isMovementLocked;
  }, [isMovementLocked]);

  const initializeGoogleMaps = useCallback(async () => {
    if (isLoaded) return;

    if (!globalLoader) {
      globalLoader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["geometry"],
      });
    }

    await globalLoader.load();
    isLoaded = true;
    streetViewServiceRef.current = new google.maps.StreetViewService();
  }, []);

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

  const returnToStart = useCallback(() => {
    if (panoramaRef.current && startPanoIdRef.current) {
      // DUPLICATE GUARD: Zaten başlangıçtaysa sadece POV restore et
      if (panoramaRef.current.getPano() === startPanoIdRef.current) {
        panoramaRef.current.setPov({
          heading: startHeadingRef.current,
          pitch: 0,
        });
        navigationMetrics.duplicatePanoPrevented++;
        lastHeadingRef.current = startHeadingRef.current;
        return;
      }
      panoramaRef.current.setPano(startPanoIdRef.current);
      navigationMetrics.panoLoadCount++;
      panoramaRef.current.setPov({
        heading: startHeadingRef.current,
        pitch: 0,
      });
      lastPanoIdRef.current = startPanoIdRef.current;
      lastHeadingRef.current = startHeadingRef.current;
    }
  }, []);

  /**
   * Tıklama koordinatından heading hesapla
   * Container'ın merkezinden tıklama noktasına olan açıyı hesaplar
   */
  const calculateClickHeading = useCallback((
    clickX: number,
    clickY: number,
    container: HTMLElement,
    currentHeading: number
  ): number => {
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const relX = clickX - rect.left - centerX;

    const horizontalFOV = 90;
    const angleFromCenter = (relX / centerX) * (horizontalFOV / 2);

    let targetHeading = currentHeading + angleFromCenter;

    while (targetHeading < 0) targetHeading += 360;
    while (targetHeading >= 360) targetHeading -= 360;

    return targetHeading;
  }, []);

  /**
   * En yakın navigation link'i bul
   */
  const findNearestLink = useCallback((
    targetHeading: number,
    links: (google.maps.StreetViewLink | null)[] | null
  ): google.maps.StreetViewLink | null => {
    if (!links || links.length === 0) return null;

    let nearestLink: google.maps.StreetViewLink | null = null;
    let minDiff = Infinity;

    for (const link of links) {
      if (!link || link.heading == null) continue;

      let diff = Math.abs(targetHeading - link.heading);
      if (diff > 180) diff = 360 - diff;

      if (diff < minDiff) {
        minDiff = diff;
        nearestLink = link;
      }
    }

    if (minDiff > HEADING_CONFIDENCE_THRESHOLD) {
      return null;
    }

    return nearestLink;
  }, []);

  /**
   * Custom navigation: Tıklama ile ileri gitme
   * PITCH KORUNUYOR - iOS bug fix
   */
  const navigateToLink = useCallback((link: google.maps.StreetViewLink) => {
    if (!panoramaRef.current || !link.pano) return;

    // DUPLICATE GUARD: Aynı pano'ya navigate etme
    if (panoramaRef.current.getPano() === link.pano) {
      navigationMetrics.duplicatePanoPrevented++;
      return;
    }

    const currentPov = panoramaRef.current.getPov();
    pendingPitchRef.current = currentPov.pitch || 0;

    panoramaRef.current.setPano(link.pano);
    navigationMetrics.panoLoadCount++;
  }, []);

  /**
   * Street View'ı göster
   *
   * CRITICAL FIXES in v2:
   * 1. Cleans up previous event listeners before attaching new ones
   * 2. linksControl: false - prevents Google arrow click bypass
   * 3. isMovementLockedRef used instead of stale state
   * 4. pointerStartRef null = NO navigation (strict guard)
   */
  const showStreetView = useCallback(
    async (panoId: string, heading: number = 0) => {
      await initializeGoogleMaps();

      if (!streetViewRef.current) {
        console.warn("[Nav] streetViewRef is null");
        return;
      }

      // ============================================
      // FIX #1: Clean up previous event listeners
      // ============================================
      if (cleanupFnRef.current) {
        cleanupFnRef.current();
        cleanupFnRef.current = null;
        navigationMetrics.listenerDetachCount++;
      }

      // Başlangıç pozisyonunu kaydet
      startPanoIdRef.current = panoId;
      startHeadingRef.current = heading;
      lastPanoIdRef.current = panoId;
      lastHeadingRef.current = heading;
      pendingPitchRef.current = 0;

      // Başlangıç pano'sunu cache'e ekle
      visitedPanosRef.current.add(panoId);

      // Mobil cihaz tespiti
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      const streetViewOptions: google.maps.StreetViewPanoramaOptions = {
        pano: panoId,
        pov: { heading, pitch: 0 },
        addressControl: false,
        fullscreenControl: false,
        enableCloseButton: false,
        showRoadLabels: false,
        zoomControl: true,
        panControl: isMobile,
        // FIX #2: linksControl kapalı - Google'ın ok işaretleri custom sistemi bypass ediyor
        // Navigation artık SADECE custom click handler ile çalışır
        linksControl: false,
        motionTracking: false,
        motionTrackingControl: false,
        clickToGo: false,
        disableDefaultUI: false,
        scrollwheel: true,
      };

      // Mevcut panorama varsa temizle
      if (panoramaRef.current) {
        google.maps.event.clearInstanceListeners(panoramaRef.current);
      }

      panoramaRef.current = new google.maps.StreetViewPanorama(
        streetViewRef.current,
        streetViewOptions
      );
      navigationMetrics.panoLoadCount++; // Initial pano load

      // ============================================
      // PANO_CHANGED EVENT - Hareket limiti + Pitch restore
      // This fires for BOTH custom navigation and any Google bypass
      // ============================================
      panoramaRef.current.addListener("pano_changed", () => {
        if (!panoramaRef.current) return;

        const currentPanoId = panoramaRef.current.getPano();
        const currentPov = panoramaRef.current.getPov();

        // Aynı panoda kalınmışsa
        if (currentPanoId === lastPanoIdRef.current) {
          lastHeadingRef.current = currentPov.heading || 0;
          navigationMetrics.rotateCount++;
          return;
        }

        // KRİTİK: Pitch'i RESTORE ET
        const targetHeading = currentPov.heading || lastHeadingRef.current || 0;
        const targetPitch = pendingPitchRef.current;

        requestAnimationFrame(() => {
          if (panoramaRef.current) {
            panoramaRef.current.setPov({
              heading: targetHeading,
              pitch: targetPitch,
            });
          }
        });

        // Başlangıca dönüş kontrolü
        if (currentPanoId === startPanoIdRef.current) {
          lastPanoIdRef.current = currentPanoId;
          lastHeadingRef.current = targetHeading;
          return;
        }

        // Cache kontrolü
        const isPanoVisited = visitedPanosRef.current.has(currentPanoId);
        if (isPanoVisited) {
          lastPanoIdRef.current = currentPanoId;
          lastHeadingRef.current = targetHeading;
          return;
        }

        // Hareket limiti kontrolü (client-side fast check)
        const currentMoves = movesUsedRef.current;
        const limit = moveLimitRef.current;

        if (currentMoves >= limit) {
          console.log("[Nav] Move limit reached - reverting pano");
          navigationMetrics.moveRejectedCount++;
          if (panoramaRef.current && lastPanoIdRef.current) {
            panoramaRef.current.setPano(lastPanoIdRef.current);
            panoramaRef.current.setPov({
              heading: lastHeadingRef.current,
              pitch: targetPitch,
            });
          }
          setIsMovementLocked(true);
          isMovementLockedRef.current = true;
          return;
        }

        // CONCURRENT MOVE GUARD: Bekleyen transaction varsa revert
        if (isPendingMoveRef.current) {
          if (panoramaRef.current && lastPanoIdRef.current) {
            panoramaRef.current.setPano(lastPanoIdRef.current);
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
          if (panoramaRef.current && lastPanoIdRef.current) {
            panoramaRef.current.setPano(lastPanoIdRef.current);
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
              return; // Abort transaction — server rejects
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

              console.log(`[Nav] Move: ${newMoveCount}/${limit} | pano=${currentPanoId.substring(0, 8)}... (server-approved)`);
            } else {
              // Server rejected — revert pano
              console.log("[Nav] Server rejected move — reverting");
              navigationMetrics.serverMoveRejected++;
              if (panoramaRef.current && lastPanoIdRef.current) {
                panoramaRef.current.setPano(lastPanoIdRef.current);
                panoramaRef.current.setPov({
                  heading: lastHeadingRef.current,
                  pitch: targetPitch,
                });
              }
              setIsMovementLocked(true);
              isMovementLockedRef.current = true;
            }
          }).catch((err) => {
            // Network error — revert pano, log
            console.warn("[Nav] Move transaction failed:", err);
            navigationMetrics.serverMoveRejected++;
            if (panoramaRef.current && lastPanoIdRef.current) {
              panoramaRef.current.setPano(lastPanoIdRef.current);
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

          console.log(`[Nav] Move: ${newMoveCount}/${limit} | pano=${currentPanoId.substring(0, 8)}... (client-only)`);
        }
      });

      // ============================================
      // CUSTOM CLICK NAVIGATION - v2 with proper lifecycle
      // ============================================
      const container = streetViewRef.current;

      const handlePointerDown = (e: PointerEvent) => {
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
      };

      const handlePointerUp = (e: PointerEvent) => {
        // ============================================
        // FIX #3: STRICT null guard - no pointerdown = no navigation
        // This prevents ghost clicks from touch events that didn't register
        // a pointerdown (e.g., started on a Google internal overlay)
        // ============================================
        if (!pointerStartRef.current) {
          navigationMetrics.missingPointerDownCount++;
          return; // HARD RETURN - no pointerdown means no valid click
        }

        // Drag threshold kontrolü
        const dx = Math.abs(e.clientX - pointerStartRef.current.x);
        const dy = Math.abs(e.clientY - pointerStartRef.current.y);
        const moved = Math.sqrt(dx * dx + dy * dy);
        pointerStartRef.current = null;

        if (moved > DRAG_THRESHOLD_PX) {
          navigationMetrics.dragDetectedCount++;
          // POST-DRAG SUPPRESS: Start cooldown window so any tap arriving
          // within CLICK_COOLDOWN_MS after this drag will be rejected.
          // This is the key fix for "drag + immediate ghost tap → move" bug.
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

        // FIX #4: Use ref instead of stale state closure
        if (isMovementLockedRef.current) {
          navigationMetrics.moveRejectedCount++;
          return;
        }

        if (!panoramaRef.current) return;

        const currentPov = panoramaRef.current.getPov();
        const links = panoramaRef.current.getLinks();

        if (!links || links.length === 0) {
          setNavigationError("Bu yönde gidilebilecek yol yok");
          setTimeout(() => setNavigationError(null), 2000);
          return;
        }

        const clickHeading = calculateClickHeading(
          e.clientX,
          e.clientY,
          container,
          currentPov.heading || 0
        );

        const nearestLink = findNearestLink(clickHeading, links);

        if (!nearestLink) {
          setNavigationError("Bu yönde gidilebilecek yol yok");
          setTimeout(() => setNavigationError(null), 2000);
          return;
        }

        console.log(`[Nav] Click navigate: heading=${nearestLink.heading?.toFixed(0)}°, pano=${nearestLink.pano?.substring(0, 8)}...`);
        navigateToLink(nearestLink);
        setNavigationError(null);
      };

      // Prevent context menu on long press (mobile)
      const handleContextMenu = (e: Event) => {
        e.preventDefault();
      };

      // Attach listeners
      container.addEventListener("pointerdown", handlePointerDown);
      container.addEventListener("pointerup", handlePointerUp);
      container.addEventListener("contextmenu", handleContextMenu);
      navigationMetrics.listenerAttachCount++;

      // FIX #1 continued: Store cleanup function
      cleanupFnRef.current = () => {
        container.removeEventListener("pointerdown", handlePointerDown);
        container.removeEventListener("pointerup", handlePointerUp);
        container.removeEventListener("contextmenu", handleContextMenu);
        pointerStartRef.current = null;
      };
    },
    // FIX #5: isMovementLocked REMOVED from dependency array
    // We use isMovementLockedRef instead, so showStreetView doesn't re-create
    // when lock state changes (which was causing listener leaks)
    [initializeGoogleMaps, calculateClickHeading, findNearestLink, navigateToLink]
  );

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      if (cleanupFnRef.current) {
        cleanupFnRef.current();
        cleanupFnRef.current = null;
      }
    };
  }, []);

  const showPanoPackage = useCallback(
    async (panoPackage: PanoPackage) => {
      setIsLoading(true);
      try {
        resetMoves();
        await showStreetView(panoPackage.pano0.panoId, panoPackage.pano0.heading);
        setIsLoading(false);
      } catch (err) {
        setError("Konum yüklenemedi");
        setIsLoading(false);
      }
    },
    [showStreetView, resetMoves]
  );

  const showStreetViewFromCoords = useCallback(
    async (coords: Coordinates) => {
      await initializeGoogleMaps();

      if (!streetViewServiceRef.current) {
        streetViewServiceRef.current = new google.maps.StreetViewService();
      }

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
    [initializeGoogleMaps, showStreetView]
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

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const randomCoord = generateRandomCoordinates();

      if (!isLikelyInTurkey(randomCoord)) continue;

      try {
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
        console.log(`[Nav] Location search attempt ${attempt + 1} failed`);
      }
    }

    return null;
  }, [initializeGoogleMaps]);

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
        setError("Konum bulunamadı");
        setIsLoading(false);
        return null;
      }
    } catch (err) {
      setError("Bir hata oluştu");
      setIsLoading(false);
      return null;
    }
  }, [findRandomLocation, showStreetView, resetMoves]);

  const movesRemaining = moveLimit - movesUsed;

  // Read-only accessors — panoramaRef artık dışa açık DEĞİL (console exploit koruması)
  const getCurrentPanoId = useCallback((): string | null => {
    return panoramaRef.current?.getPano() || null;
  }, []);

  const getCurrentPov = useCallback((): { heading: number; pitch: number } | null => {
    if (!panoramaRef.current) return null;
    const pov = panoramaRef.current.getPov();
    return { heading: pov.heading || 0, pitch: pov.pitch || 0 };
  }, []);

  return {
    isLoading,
    error,
    navigationError,
    streetViewRef,
    // SECURITY: panoramaRef REMOVED — console'dan setPano spam engellendi
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
    returnToStart,
    // Cache bilgisi
    visitedPanoCount: visitedPanosRef.current.size,
  };
}
