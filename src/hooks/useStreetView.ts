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
 * NAVIGATION ENGINE v4 - COST ROOT CAUSE FIX:
 * - Panorama object REUSED across rounds (constructor count = 1 per session)
 * - panoId validation REMOVED (skip → direct setPano, fallback only on load error)
 * - Move rejection blocks BEFORE setPano (not after via revert)
 * - "Expected pano" flag prevents revert cascades in pano_changed
 * - [COST] instrumentation: resolveFromCoordsCallCount tracks ONLY real getPanorama calls
 *
 * v4 INSTRUMENTATION FIX:
 * - Counters track ONLY application-level StreetViewService.getPanorama() calls
 * - pano_changed handler has ZERO counter increments (it never calls getPanorama)
 * - Google-internal GetMetadata (triggered by every setPano) tracked separately
 *   as googleInternalMetadataEstimate — this is UNAVOIDABLE API behavior
 * - navigateToLink: setPano(link.pano) → ZERO getPanorama calls
 * - returnToStart: setPano(startPanoId) → ZERO getPanorama calls
 *
 * v2 fixes preserved:
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
  // [COST] v4 instrumentation — ONLY real StreetViewService.getPanorama() calls
  resolveFromCoordsCallCountPerRound: number;  // OUR code's getPanorama calls this round (MUST be 0 during navigation)
  resolveFromCoordsCallCountOnRevisit: number; // getPanorama on revisits (MUST always be 0)
  googleInternalMetadataEstimate: number;      // Estimated Google-internal GetMetadata RPCs (= setPanoCallCount, unavoidable)
  panoramaConstructorCountPerRound: number;    // new StreetViewPanorama calls (MUST be 1 per session)
  setPanoCallCount: number;            // Total setPano calls per round
  revertPanoCallCount: number;         // setPano calls that are reverts (should minimize)
  fallbackMetadataCallCount: number;   // Fallback resolution when panoId fails (subset of resolveFromCoords)
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
  resolveFromCoordsCallCountPerRound: 0,
  resolveFromCoordsCallCountOnRevisit: 0,
  googleInternalMetadataEstimate: 0,
  panoramaConstructorCountPerRound: 0,
  setPanoCallCount: 0,
  revertPanoCallCount: 0,
  fallbackMetadataCallCount: 0,
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
    resolveFromCoordsCallCountPerRound: 0,
    resolveFromCoordsCallCountOnRevisit: 0,
    googleInternalMetadataEstimate: 0,
    panoramaConstructorCountPerRound: 0,
    setPanoCallCount: 0,
    revertPanoCallCount: 0,
    fallbackMetadataCallCount: 0,
  };
}

/**
 * Log cost metrics in consistent format.
 */
function logCostMetrics(event: string, extra: Record<string, string | number> = {}): void {
  const parts = [`[COST] event=${event}`];
  // v4: resolveFromCoords = OUR real getPanorama calls (should be 0 during navigation)
  parts.push(`resolveFromCoords=${navigationMetrics.resolveFromCoordsCallCountPerRound}`);
  parts.push(`resolveOnRevisit=${navigationMetrics.resolveFromCoordsCallCountOnRevisit}`);
  // googleInternal = unavoidable GetMetadata RPCs from Google's streetview.js on each setPano
  parts.push(`googleInternal≈${navigationMetrics.googleInternalMetadataEstimate}`);
  parts.push(`constructorPerRound=${navigationMetrics.panoramaConstructorCountPerRound}`);
  parts.push(`setPanoCalls=${navigationMetrics.setPanoCallCount}`);
  parts.push(`revertCalls=${navigationMetrics.revertPanoCallCount}`);
  parts.push(`fallbackCalls=${navigationMetrics.fallbackMetadataCallCount}`);
  for (const [k, v] of Object.entries(extra)) {
    parts.push(`${k}=${v}`);
  }
  console.log(parts.join(" "));
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

  // v3 COST FIX: Expected pano tracking to prevent revert cascades
  // When we call setPano(), we set this to the expected panoId.
  // In pano_changed, if currentPano matches expectedPano, we know it's our call.
  // This prevents the handler from treating our own setPano as an "unexpected" change
  // that needs reverting (which would trigger another setPano → another metadata call).
  const expectedPanoRef = useRef<string | null>(null);

  // v3 COST FIX: Flag to track if panorama has been constructed this session
  const panoramaConstructedRef = useRef(false);

  // BUG-2 FIX: Navigation error dismiss timer tracking (prevents orphan setTimeout)
  const navErrorTimerRef = useRef<NodeJS.Timeout | null>(null);

  // BUG-2 FIX: setPano timeout guard — detects silent black screen
  const panoLoadTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [panoLoadFailed, setPanoLoadFailed] = useState(false);

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
      // v4: HARD GUARD — returnToStart uses setPano(startPanoId) ONLY.
      // It NEVER calls StreetViewService.getPanorama() or resolveFromCoords.
      expectedPanoRef.current = startPanoIdRef.current;
      panoramaRef.current.setPano(startPanoIdRef.current);
      navigationMetrics.panoLoadCount++;
      navigationMetrics.setPanoCallCount++;
      navigationMetrics.googleInternalMetadataEstimate++; // Google-internal, unavoidable
      panoramaRef.current.setPov({
        heading: startHeadingRef.current,
        pitch: 0,
      });
      lastPanoIdRef.current = startPanoIdRef.current;
      lastHeadingRef.current = startHeadingRef.current;
      logCostMetrics("returnToStart", { pano: startPanoIdRef.current.substring(0, 12) });
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
   *
   * v3: Sets expectedPanoRef before setPano to track this as an intentional change.
   * This prevents pano_changed from treating it as an unexpected change requiring revert.
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

    // v4: HARD GUARD — navigateToLink uses setPano(link.pano) ONLY.
    // It NEVER calls StreetViewService.getPanorama() or resolveFromCoords.
    // The only metadata call is Google-internal (unavoidable).
    expectedPanoRef.current = link.pano;
    panoramaRef.current.setPano(link.pano);
    navigationMetrics.panoLoadCount++;
    navigationMetrics.setPanoCallCount++;
    navigationMetrics.googleInternalMetadataEstimate++; // Google-internal, unavoidable
  }, []);

  /**
   * Street View'ı göster
   *
   * v3 COST FIXES:
   * 1. Panorama object REUSED — only constructed once per session
   * 2. expectedPanoRef tracks intentional setPano calls
   * 3. Revert logic uses expectedPano to avoid cascading setPano calls
   * 4. Move budget enforced BEFORE setPano in click handler (not after via revert)
   * 5. [COST] instrumentation on every metadata-triggering operation
   *
   * v2 fixes preserved:
   * - Event listener lifecycle: cleanup on every call
   * - linksControl: false
   * - isMovementLockedRef
   * - pointerStartRef null guard
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

      // v3: Set expected pano for the initial load
      expectedPanoRef.current = panoId;

      // Başlangıç pano'sunu cache'e ekle
      visitedPanosRef.current.add(panoId);

      // v4: Reset per-round cost metrics
      navigationMetrics.resolveFromCoordsCallCountPerRound = 0;
      navigationMetrics.resolveFromCoordsCallCountOnRevisit = 0;
      navigationMetrics.googleInternalMetadataEstimate = 0;
      navigationMetrics.setPanoCallCount = 0;
      navigationMetrics.revertPanoCallCount = 0;
      navigationMetrics.fallbackMetadataCallCount = 0;

      // Mobil cihaz tespiti — UA regex fails on modern iPadOS (reports as Mac).
      // Use pointer:coarse as primary check, fall back to UA for older browsers.
      const isMobile = window.matchMedia("(pointer: coarse)").matches ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // ============================================
      // v3 COST FIX: REUSE panorama object
      // Only create a new panorama if we don't have one yet.
      // On subsequent rounds, just setPano + setPov on the existing one.
      // This avoids the GetMetadata call from the constructor.
      //
      // BUG-2 FIX: Container validation — detect orphaned panorama
      // After screen transitions (game→lobby→game), the container div is
      // removed from DOM but panoramaRef still holds the old instance.
      // Pattern from useGuessMap.ts:83 (getDiv() !== ref check).
      // ============================================
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const panoAny = panoramaRef.current as any;
      const hasGetDiv = panoAny && typeof panoAny.getDiv === 'function';
      const containerChanged = hasGetDiv && streetViewRef.current &&
        panoAny.getDiv() !== streetViewRef.current;
      const containerDetached = hasGetDiv &&
        panoAny.getDiv() &&
        !document.body.contains(panoAny.getDiv());

      if (containerChanged || containerDetached) {
        console.log(`[Nav] Panorama container stale (changed=${!!containerChanged}, detached=${!!containerDetached}), hard recreate`);
        google.maps.event.clearInstanceListeners(panoramaRef.current!);
        panoramaRef.current = null;
        panoramaConstructedRef.current = false;
      }

      if (!panoramaRef.current || !panoramaConstructedRef.current) {
        // Mevcut panorama varsa temizle
        if (panoramaRef.current) {
          google.maps.event.clearInstanceListeners(panoramaRef.current);
        }

        const streetViewOptions: google.maps.StreetViewPanoramaOptions = {
          pano: panoId,
          pov: { heading, pitch: 0 },
          addressControl: false,
          fullscreenControl: false,
          enableCloseButton: false,
          showRoadLabels: false,
          zoomControl: true,
          panControl: isMobile,
          // FIX #2: linksControl kapalı
          linksControl: false,
          motionTracking: false,
          motionTrackingControl: false,
          clickToGo: false,
          disableDefaultUI: false,
          scrollwheel: true,
        };

        panoramaRef.current = new google.maps.StreetViewPanorama(
          streetViewRef.current,
          streetViewOptions
        );
        panoramaConstructedRef.current = true;
        navigationMetrics.panoramaConstructorCountPerRound++;
        // Constructor triggers 1 Google-internal GetMetadata (unavoidable)
        navigationMetrics.googleInternalMetadataEstimate++;
        navigationMetrics.setPanoCallCount++;
        logCostMetrics("panoramaConstructor", { pano: panoId.substring(0, 12) });
      } else {
        // REUSE existing panorama — clear listeners but keep the object
        google.maps.event.clearInstanceListeners(panoramaRef.current);

        // Just change the pano on the existing panorama
        panoramaRef.current.setPano(panoId);
        panoramaRef.current.setPov({ heading, pitch: 0 });
        // setPano triggers 1 Google-internal GetMetadata (unavoidable)
        navigationMetrics.googleInternalMetadataEstimate++;
        navigationMetrics.setPanoCallCount++;
        logCostMetrics("reuseSetPano", { pano: panoId.substring(0, 12) });
      }

      navigationMetrics.panoLoadCount++; // Initial pano load

      // ============================================
      // PANO_CHANGED EVENT - Hareket limiti + Pitch restore
      // v4: NO metadata counters here. This handler NEVER calls getPanorama().
      // Google-internal GetMetadata is tracked via googleInternalMetadataEstimate
      // which increments at setPano() call sites, not here.
      // ============================================
      panoramaRef.current.addListener("pano_changed", () => {
        if (!panoramaRef.current) return;

        const currentPanoId = panoramaRef.current.getPano();
        const currentPov = panoramaRef.current.getPov();

        // Aynı panoda kalınmışsa (POV change only, not real pano change)
        if (currentPanoId === lastPanoIdRef.current) {
          lastHeadingRef.current = currentPov.heading || 0;
          navigationMetrics.rotateCount++;
          return;
        }

        // Check if this is an expected pano change (we initiated it)
        const wasExpected = expectedPanoRef.current === currentPanoId;
        expectedPanoRef.current = null; // Consume the expectation

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
          // v3: Only revert if this was NOT an expected change
          // (Expected changes were already validated before setPano)
          if (!wasExpected) {
            console.log("[Nav] Move limit reached - reverting pano");
            navigationMetrics.moveRejectedCount++;
            expectedPanoRef.current = lastPanoIdRef.current;
            if (panoramaRef.current && lastPanoIdRef.current) {
              panoramaRef.current.setPano(lastPanoIdRef.current);
              navigationMetrics.revertPanoCallCount++;
              navigationMetrics.setPanoCallCount++;
              navigationMetrics.googleInternalMetadataEstimate++;
              panoramaRef.current.setPov({
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
          if (!wasExpected && panoramaRef.current && lastPanoIdRef.current) {
            expectedPanoRef.current = lastPanoIdRef.current;
            panoramaRef.current.setPano(lastPanoIdRef.current);
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
          if (!wasExpected && panoramaRef.current && lastPanoIdRef.current) {
            expectedPanoRef.current = lastPanoIdRef.current;
            panoramaRef.current.setPano(lastPanoIdRef.current);
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
              logCostMetrics("moveAccepted", { move: newMoveCount, limit });
            } else {
              // Server rejected — revert pano
              console.log("[Nav] Server rejected move — reverting");
              navigationMetrics.serverMoveRejected++;
              if (panoramaRef.current && lastPanoIdRef.current) {
                expectedPanoRef.current = lastPanoIdRef.current;
                panoramaRef.current.setPano(lastPanoIdRef.current);
                navigationMetrics.revertPanoCallCount++;
                navigationMetrics.setPanoCallCount++;
                navigationMetrics.googleInternalMetadataEstimate++;
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
              expectedPanoRef.current = lastPanoIdRef.current;
              panoramaRef.current.setPano(lastPanoIdRef.current);
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

          console.log(`[Nav] Move: ${newMoveCount}/${limit} | pano=${currentPanoId.substring(0, 8)}... (client-only)`);
          logCostMetrics("moveAccepted", { move: newMoveCount, limit });
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

        if (!panoramaRef.current) return;

        const currentPov = panoramaRef.current.getPov();
        const links = panoramaRef.current.getLinks();

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
          showNavError("Bu yönde gidilebilecek yol yok");
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
          showNavError("Bu yönde gidilebilecek yol yok");
          return;
        }

        // NAV-001 FIX: Movement lock check AFTER link resolution.
        // When locked, allow navigation ONLY to already-visited panos or start pano.
        // Previously this check was BEFORE link resolution, which blocked ALL navigation
        // including revisits to cached panos — breaking return-to-start backtracking.
        // The pano_changed handler already correctly skips budget consumption for cached panos.
        // No infinite traversal risk: only pre-visited nodes are reachable when locked.
        if (isMovementLockedRef.current) {
          const targetPanoId = nearestLink.pano;
          const isTargetCached = targetPanoId &&
            (visitedPanosRef.current.has(targetPanoId) || targetPanoId === startPanoIdRef.current);

          if (!isTargetCached) {
            navigationMetrics.moveRejectedCount++;
            showNavError("Hareket hakkın bitti!");
            return;
          }
          // Target is cached — allow navigation (no budget consumed, enforced by pano_changed)
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

  // Cleanup on unmount — listeners, panorama instance, timers
  useEffect(() => {
    return () => {
      if (cleanupFnRef.current) {
        cleanupFnRef.current();
        cleanupFnRef.current = null;
      }
      // BUG-2 FIX: Reset panorama state so next mount creates fresh instance
      if (panoramaRef.current) {
        google.maps.event.clearInstanceListeners(panoramaRef.current);
      }
      panoramaRef.current = null;
      panoramaConstructedRef.current = false;
      // Clear timeout guards
      if (panoLoadTimeoutRef.current) {
        clearTimeout(panoLoadTimeoutRef.current);
        panoLoadTimeoutRef.current = null;
      }
      if (navErrorTimerRef.current) {
        clearTimeout(navErrorTimerRef.current);
        navErrorTimerRef.current = null;
      }
    };
  }, []);

  // BUG-2 FIX: Visibility/Pageshow handler — detect iOS Safari bfcache and tab resume
  // When page returns from background, check if panorama container is still valid.
  // If not, set flag so next showStreetView creates fresh instance.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && panoramaRef.current && streetViewRef.current) {
        // Check if container is still in DOM
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pano = panoramaRef.current as any;
        const div = typeof pano.getDiv === 'function' ? pano.getDiv() : null;
        if (div && !document.body.contains(div)) {
          console.log("[Nav] Visibility resume: panorama container detached, marking for recreate");
          google.maps.event.clearInstanceListeners(panoramaRef.current);
          panoramaRef.current = null;
          panoramaConstructedRef.current = false;
        } else if (div && panoramaRef.current && startPanoIdRef.current) {
          // Container exists but tiles may be corrupted after background — re-trigger setPano
          const currentPano = panoramaRef.current.getPano();
          if (currentPano) {
            console.log("[Nav] Visibility resume: refreshing panorama tiles");
            panoramaRef.current.setPano(currentPano);
          }
        }
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted && panoramaRef.current) {
        // Page restored from bfcache — panorama may be corrupted
        console.log("[Nav] Pageshow bfcache restore: refreshing panorama");
        const currentPano = panoramaRef.current.getPano();
        if (currentPano && streetViewRef.current) {
          panoramaRef.current.setPano(currentPano);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  /**
   * Show a pano package in the Street View panorama.
   *
   * v3 COST FIX: REMOVED the panoId validation call.
   * BEFORE: getPanorama({pano: id}) → validate → if invalid → getPanorama({location}) → showStreetView
   *   = 2-3 GetMetadata calls per round start
   * AFTER: showStreetView(id) directly → if status_changed reports error → THEN fallback
   *   = 1 GetMetadata call per round start (the setPano itself)
   *
   * The fallback uses a status_changed listener that fires when the pano fails to load.
   * This is a lazy-evaluation pattern: only pay for fallback when actually needed.
   */
  const showPanoPackage = useCallback(
    async (panoPackage: PanoPackage) => {
      setIsLoading(true);
      try {
        await initializeGoogleMaps();
        resetMoves();

        const panoId = panoPackage.pano0.panoId;
        const heading = panoPackage.pano0.heading;

        if (!streetViewServiceRef.current) {
          streetViewServiceRef.current = new google.maps.StreetViewService();
        }

        // Clear any previous load failure state
        setPanoLoadFailed(false);

        // Clear any previous timeout guard
        if (panoLoadTimeoutRef.current) {
          clearTimeout(panoLoadTimeoutRef.current);
          panoLoadTimeoutRef.current = null;
        }

        // v3: Directly show the pano — NO validation call
        // If the panoId is expired, the panorama will emit a status_changed event
        // with ZERO_RESULTS, and we handle fallback there.
        await showStreetView(panoId, heading);

        // v3: Attach a ONE-TIME status_changed listener for fallback
        // This only fires if the panoId fails to load (expired/invalid)
        if (panoramaRef.current) {
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

            // PanoId is invalid — fallback to coords-based resolution
            console.warn(`[Nav] Pano ID expired (status=${status}), resolving from coords: ${panoPackage.locationName}`);
            // v4: This IS a real getPanorama call — count it
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
                  console.log(`[Nav] Fresh pano resolved: ${freshPanoId.substring(0, 20)}...`);

                  // Update all tracking refs
                  startPanoIdRef.current = freshPanoId;
                  lastPanoIdRef.current = freshPanoId;
                  visitedPanosRef.current.add(freshPanoId);
                  expectedPanoRef.current = freshPanoId;

                  if (panoramaRef.current) {
                    panoramaRef.current.setPano(freshPanoId);
                    panoramaRef.current.setPov({ heading, pitch: 0 });
                    navigationMetrics.setPanoCallCount++;
                    navigationMetrics.googleInternalMetadataEstimate++; // setPano triggers Google-internal
                  }

                  loadSucceeded = true;
                  logCostMetrics("fallbackSuccess", { pano: freshPanoId.substring(0, 12) });
                } else {
                  console.error(`[Nav] Could not resolve pano from coords for ${panoPackage.locationName}`);
                  // BUG-2 FIX: Show user-visible failure state instead of silent black screen
                  setPanoLoadFailed(true);
                  setError("Street View yüklenemedi");
                }
              }
            );
          };

          const statusListener = panoramaRef.current.addListener("status_changed", () => {
            if (!panoramaRef.current) return;
            const status = panoramaRef.current.getStatus();

            if (status === google.maps.StreetViewStatus.OK) {
              loadSucceeded = true;
              clearTimeoutGuard();
            } else {
              triggerFallback(String(status));
            }

            // Remove this one-time listener
            google.maps.event.removeListener(statusListener);
          });

          // P1.2 FIX: Close race window — check status immediately after attaching listener.
          // If the panorama already resolved before listener was attached, status_changed
          // won't fire again. This catches the case where setPano already completed.
          const immediateStatus = panoramaRef.current.getStatus();
          if (immediateStatus && immediateStatus !== google.maps.StreetViewStatus.OK) {
            triggerFallback(String(immediateStatus));
            google.maps.event.removeListener(statusListener);
          } else if (immediateStatus === google.maps.StreetViewStatus.OK) {
            loadSucceeded = true;
          }

          // BUG-2 FIX: setPano timeout guard — if no load success within 10s, trigger fallback
          // This catches silent failures where status_changed never fires (orphaned panorama, etc.)
          if (!loadSucceeded && !fallbackTriggered) {
            panoLoadTimeoutRef.current = setTimeout(() => {
              panoLoadTimeoutRef.current = null;
              if (!loadSucceeded && !fallbackTriggered) {
                console.warn(`[Nav] setPano timeout (10s) — triggering fallback for ${panoPackage.locationName}`);
                triggerFallback("TIMEOUT");
              }
            }, 10000);
          }
        }

        setIsLoading(false);
        logCostMetrics("roundStart", { pano: panoId.substring(0, 12) });
      } catch (err) {
        setError("Konum yüklenemedi");
        setIsLoading(false);
      }
    },
    [initializeGoogleMaps, showStreetView, resetMoves]
  );

  const showStreetViewFromCoords = useCallback(
    async (coords: Coordinates) => {
      await initializeGoogleMaps();

      if (!streetViewServiceRef.current) {
        streetViewServiceRef.current = new google.maps.StreetViewService();
      }

      // v4: This IS a real getPanorama call — count it
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
        // v4: This IS a real getPanorama call — count it
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
    // BUG-2 FIX: Expose load failure state for UI fallback overlay
    panoLoadFailed,
  };
}
