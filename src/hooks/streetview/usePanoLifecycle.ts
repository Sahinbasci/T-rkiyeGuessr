"use client";

/**
 * usePanoLifecycle — Panorama creation, destruction, reuse, and integrity checks.
 *
 * Extracted from useStreetView.ts. Manages the StreetViewPanorama instance
 * lifecycle including:
 * - First creation vs. reuse across rounds
 * - Container staleness detection (orphaned panorama after screen transitions)
 * - BUG-007: Integrity checks (black screen detection)
 * - BUG-007: Visibility/pageshow/focus/online handlers for bfcache recovery
 * - B1-FIX v2: Listener deduplication tracking via listenerGeneration counter
 * - B1-FIX v2: lastKnownGoodPOV tracking for safe resume
 */

import { useRef, useCallback, useEffect } from "react";
import { logger } from "@/utils/logger";
import { trackEvent } from "@/utils/telemetry";
import { sanitizePov } from "@/utils/cameraDrift";
import { getMetricsRef, logCostMetrics } from "./navigationMetrics";
import { BASE_STREET_VIEW_OPTIONS } from "./types";

export interface PanoLifecycleResult {
  /** Ref to the panorama container div. */
  streetViewRef: React.RefObject<HTMLDivElement | null>;
  /** Ref to the StreetViewPanorama instance (or null). */
  panoramaRef: React.MutableRefObject<google.maps.StreetViewPanorama | null>;
  /** Whether panorama has been constructed this session. */
  panoramaConstructedRef: React.MutableRefObject<boolean>;
  /**
   * Ensure panorama exists and is showing the given pano.
   * Creates a new panorama if none exists, or reuses the existing one.
   * Returns the panorama instance.
   */
  ensurePanorama: (
    panoId: string,
    heading: number,
    isMobile: boolean,
  ) => google.maps.StreetViewPanorama | null;
  /** BUG-007: Check if panorama has visible tiles. */
  checkPanoramaIntegrity: () => boolean;
  /** BUG-007: Destroy and recreate panorama from scratch. */
  hardRecreatePanorama: () => void;
  /** Clean up panorama and all listeners. Call on unmount. */
  destroyPanorama: () => void;
  /** Callback invoked on lifecycle resume (visibility/pageshow/focus). Consumer should reset drift state. */
  onResumeRef: React.MutableRefObject<(() => void) | null>;
  /** B1-FIX v2: Listener generation counter — incremented on each new listener set to prevent stale handlers. */
  listenerGenerationRef: React.MutableRefObject<number>;
  /** B1-FIX v2: Last known good POV — used for safe resume after corruption. */
  lastKnownGoodPOVRef: React.MutableRefObject<{ heading: number; pitch: number }>;
}

/**
 * Hook managing the StreetViewPanorama instance lifecycle.
 *
 * Handles:
 * - Panorama creation (first time) vs. reuse (subsequent rounds)
 * - Container staleness detection after screen transitions
 * - BUG-001: Same panoId visual refresh
 * - BUG-007: Integrity checks and hard recreate
 * - Visibility/pageshow/focus/online handlers for iOS bfcache + reconnect recovery
 * - B1-FIX v2: Listener deduplication via generation counter
 * - B1-FIX v2: lastKnownGoodPOV for safe resume to a known-good state
 */
export function usePanoLifecycle(): PanoLifecycleResult {
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const panoramaConstructedRef = useRef(false);
  const startPanoIdRef = useRef<string | null>(null);
  const startHeadingRef = useRef<number>(0);
  const onResumeRef = useRef<(() => void) | null>(null);

  // B1-FIX v2: Listener generation counter — prevents stale handlers from acting
  const listenerGenerationRef = useRef<number>(0);

  // B1-FIX v2: Last known good POV — updated only when POV is stable
  const lastKnownGoodPOVRef = useRef<{ heading: number; pitch: number }>({ heading: 0, pitch: 0 });

  // B1-FIX v2: Track pending resume timeouts so we can cancel on destroy
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkPanoramaIntegrity = useCallback((): boolean => {
    if (!streetViewRef.current || !panoramaRef.current) return false;
    if (streetViewRef.current.children.length === 0) return false;
    const hasCanvas = streetViewRef.current.querySelector("canvas") !== null;
    const hasImg = streetViewRef.current.querySelector("img") !== null;
    if (!hasCanvas && !hasImg) return false;
    const rect = streetViewRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    return true;
  }, []);

  const hardRecreatePanorama = useCallback(() => {
    const panoId = startPanoIdRef.current;
    const heading = startHeadingRef.current;
    if (!panoId || !streetViewRef.current) return;

    logger.debug("[Nav] BUG-007: Hard recreating panorama after integrity check failure");
    trackEvent("blackScreenRecovery", { panoId: panoId.substring(0, 12), trigger: "integrityCheck" });

    // Clean up old instance completely
    if (panoramaRef.current) {
      google.maps.event.clearInstanceListeners(panoramaRef.current);
    }
    panoramaRef.current = null;
    panoramaConstructedRef.current = false;

    // B1-FIX v2: Increment generation so any stale listeners from previous instance no-op
    listenerGenerationRef.current++;

    panoramaRef.current = new google.maps.StreetViewPanorama(
      streetViewRef.current,
      {
        ...BASE_STREET_VIEW_OPTIONS,
        pano: panoId,
        pov: { heading, pitch: 0 },
        zoom: 0,
      }
    );
    panoramaConstructedRef.current = true;

    // Reset lastKnownGoodPOV to initial state after recreate
    lastKnownGoodPOVRef.current = { heading, pitch: 0 };
  }, []);

  const ensurePanorama = useCallback((
    panoId: string,
    heading: number,
    isMobile: boolean,
  ): google.maps.StreetViewPanorama | null => {
    if (!streetViewRef.current) {
      logger.warn("[Nav] streetViewRef is null");
      return null;
    }

    const metrics = getMetricsRef();

    // Track start pano for integrity checks and hard recreate
    startPanoIdRef.current = panoId;
    startHeadingRef.current = heading;

    // B1-FIX v2: Reset lastKnownGoodPOV when starting new pano
    lastKnownGoodPOVRef.current = { heading, pitch: 0 };

    // B1-FIX v2: Increment listener generation — invalidates all previous handlers
    listenerGenerationRef.current++;

    // ============================================
    // Container staleness detection
    // ============================================
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const panoAny = panoramaRef.current as any;
    const hasGetDiv = panoAny && typeof panoAny.getDiv === 'function';
    const panoDiv = hasGetDiv ? panoAny.getDiv() : null;
    const containerChanged = hasGetDiv && streetViewRef.current &&
      panoDiv !== streetViewRef.current;
    const containerDetached = hasGetDiv &&
      panoDiv &&
      !document.body.contains(panoDiv);
    const containerEmpty = streetViewRef.current &&
      panoramaRef.current &&
      streetViewRef.current.children.length === 0;

    if (containerChanged || containerDetached || containerEmpty) {
      logger.debug(`[Nav] Panorama container stale (changed=${!!containerChanged}, detached=${!!containerDetached}, empty=${!!containerEmpty}), hard recreate`);
      if (panoramaRef.current) {
        google.maps.event.clearInstanceListeners(panoramaRef.current);
      }
      panoramaRef.current = null;
      panoramaConstructedRef.current = false;
    }

    // ============================================
    // Create or reuse panorama
    // ============================================
    if (!panoramaRef.current || !panoramaConstructedRef.current) {
      if (panoramaRef.current) {
        google.maps.event.clearInstanceListeners(panoramaRef.current);
      }

      panoramaRef.current = new google.maps.StreetViewPanorama(
        streetViewRef.current,
        {
          ...BASE_STREET_VIEW_OPTIONS,
          pano: panoId,
          pov: { heading, pitch: 0 },
          panControl: isMobile,
        }
      );
      panoramaConstructedRef.current = true;
      metrics.panoramaConstructorCountPerRound++;
      metrics.googleInternalMetadataEstimate++;
      metrics.setPanoCallCount++;
      logCostMetrics("panoramaConstructor", { pano: panoId.substring(0, 12) });
    } else {
      // REUSE existing panorama
      google.maps.event.clearInstanceListeners(panoramaRef.current);

      // BUG-001 FIX: Same panoId visual refresh
      const currentPano = panoramaRef.current.getPano();
      if (currentPano === panoId) {
        logger.debug(`[Nav] BUG-001: Same panoId detected (${panoId.substring(0, 12)}), forcing visual reset`);
        panoramaRef.current.setPosition({ lat: 0, lng: 0 });
      }

      panoramaRef.current.setPano(panoId);
      panoramaRef.current.setPov({ heading, pitch: 0 });
      panoramaRef.current.setZoom(0);
      metrics.googleInternalMetadataEstimate++;
      metrics.setPanoCallCount++;
      logCostMetrics("reuseSetPano", { pano: panoId.substring(0, 12) });
    }

    metrics.panoLoadCount++;
    return panoramaRef.current;
  }, []);

  const destroyPanorama = useCallback(() => {
    if (panoramaRef.current) {
      google.maps.event.clearInstanceListeners(panoramaRef.current);
    }
    panoramaRef.current = null;
    panoramaConstructedRef.current = false;
    // B1-FIX v2: Increment generation to invalidate any lingering handlers
    listenerGenerationRef.current++;
    // Cancel any pending resume timers
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  /**
   * B1-FIX v2: Centralized resume handler used by ALL lifecycle events.
   * - Validates panorama still exists and container is mounted
   * - Sanitizes POV using sanitizePov() (NaN/Infinity/range)
   * - Falls back to lastKnownGoodPOV if current POV is corrupted
   * - Notifies consumer to reset drift state
   * - Schedules integrity check
   * - Uses generation guard to prevent stale handler execution
   */
  const handleResume = useCallback((trigger: string) => {
    // Capture generation at call time
    const gen = listenerGenerationRef.current;

    if (!panoramaRef.current || !streetViewRef.current) return;

    if (streetViewRef.current.children.length === 0) {
      logger.debug(`[Nav] ${trigger} resume: panorama container empty, marking for recreate`);
      trackEvent("blackScreenDetected", { reason: "containerEmpty", trigger });
      google.maps.event.clearInstanceListeners(panoramaRef.current);
      panoramaRef.current = null;
      panoramaConstructedRef.current = false;
      return;
    }

    if (!startPanoIdRef.current) return;

    const currentPano = panoramaRef.current.getPano();
    if (!currentPano) return;

    logger.debug(`[Nav] ${trigger} resume: refreshing panorama tiles`);
    panoramaRef.current.setPano(currentPano);

    // Sanitize POV — use sanitizePov() for proper NaN/Infinity/range handling
    const rawPov = panoramaRef.current.getPov();
    const safePov = sanitizePov(rawPov);

    // If current POV was corrupted, fall back to lastKnownGoodPOV
    const wasPovCorrupted = !Number.isFinite(rawPov.heading) || !Number.isFinite(rawPov.pitch) ||
      rawPov.pitch > 80 || rawPov.pitch < -80;

    if (wasPovCorrupted) {
      logger.debug(`[Nav] ${trigger}: POV corrupted (h=${rawPov.heading}, p=${rawPov.pitch}), restoring lastKnownGood`);
      trackEvent("povCorruptionRecovery", { trigger, rawPitch: String(rawPov.pitch) });
      panoramaRef.current.setPov(lastKnownGoodPOVRef.current);
    } else {
      panoramaRef.current.setPov(safePov);
    }

    // Notify consumer to reset drift tracker
    if (onResumeRef.current) onResumeRef.current();

    // Schedule integrity check (with generation guard)
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      resumeTimerRef.current = null;
      // Stale guard: skip if generation has changed (panorama was recreated/destroyed)
      if (listenerGenerationRef.current !== gen) return;
      if (!checkPanoramaIntegrity()) {
        logger.warn(`[Nav] BUG-007: Post-${trigger} integrity check FAILED -- hard recreating`);
        trackEvent("blackScreenDetected", { reason: "integrityFailed", trigger });
        hardRecreatePanorama();
      }
    }, 2000);
  }, [checkPanoramaIntegrity, hardRecreatePanorama]);

  // BUG-007 + B1-FIX v2: Lifecycle event handlers
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleResume("visibilityChange");
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        handleResume("bfcache");
      }
    };

    // B1-FIX: Focus handler for iOS Safari (doesn't always fire visibilitychange)
    const handleFocus = () => {
      if (panoramaRef.current && streetViewRef.current && startPanoIdRef.current) {
        // Lightweight: only sanitize if drift detected, no full refresh
        const pov = panoramaRef.current.getPov();
        const safePov = sanitizePov(pov);
        if (Math.abs((pov.pitch || 0) - safePov.pitch) > 0.1) {
          panoramaRef.current.setPov(safePov);
        }
        if (onResumeRef.current) onResumeRef.current();
      }
    };

    // B1-FIX v2: Online handler — network reconnection can leave panorama in bad state
    const handleOnline = () => {
      if (panoramaRef.current && startPanoIdRef.current) {
        logger.debug("[Nav] Online resume: refreshing panorama after network reconnect");
        handleResume("online");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("online", handleOnline);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
      if (resumeTimerRef.current) {
        clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };
  }, [handleResume]);

  return {
    streetViewRef,
    panoramaRef,
    panoramaConstructedRef,
    ensurePanorama,
    checkPanoramaIntegrity,
    hardRecreatePanorama,
    destroyPanorama,
    onResumeRef,
    listenerGenerationRef,
    lastKnownGoodPOVRef,
  };
}
