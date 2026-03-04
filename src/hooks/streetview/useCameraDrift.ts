"use client";

/**
 * useCameraDrift — Camera pitch drift prevention for Street View.
 *
 * Extracted from useStreetView.ts. Wraps the pure-function cameraDrift
 * utility with React refs for use in panorama event handlers.
 *
 * Google Maps SDK accumulates floating-point pitch errors during
 * horizontal touch rotation on mobile. This module detects and corrects
 * that drift using the pure-function drift tracker from @/utils/cameraDrift.
 *
 * B1-FIX v2: Added corruption detection, lastKnownGoodPOV integration,
 * and listener generation guard to prevent stale handlers.
 */

import { useRef, useCallback } from "react";
import {
  createDriftTracker,
  processPovChange,
  markDragStart,
  markDragEnd,
  markSelfInducedChange,
  resetDriftTracker,
  createCorruptionDetector,
  detectCorruption,
  resetCorruptionDetector,
  updateLastKnownGoodPOV,
  createLastKnownGoodPOV,
  type DriftTrackerState,
  type CorruptionDetectorState,
  type LastKnownGoodPOV,
} from "@/utils/cameraDrift";
import { logger } from "@/utils/logger";

export interface CameraDriftControls {
  /** Ref to the mutable drift tracker state. */
  driftTrackerRef: React.MutableRefObject<DriftTrackerState>;
  /** B1-FIX v2: Ref to the corruption detector state. */
  corruptionDetectorRef: React.MutableRefObject<CorruptionDetectorState>;
  /** B1-FIX v2: Ref to the last-known-good POV tracker. */
  lastKnownGoodPOVTrackerRef: React.MutableRefObject<LastKnownGoodPOV>;
  /** Reset drift tracker for a new pano (call at round start). */
  resetDrift: (initialPitch: number) => void;
  /**
   * Attach the pov_changed drift correction listener to a panorama.
   * Returns a cleanup function that removes the listener.
   *
   * B1-FIX v2: Also takes optional callbacks for corruption reinit and
   * lastKnownGoodPOV update.
   */
  attachDriftCorrection: (
    panorama: google.maps.StreetViewPanorama,
    onCorruptionReinit?: () => void,
    lastKnownGoodPOVRef?: React.MutableRefObject<{ heading: number; pitch: number }>,
    listenerGeneration?: number,
    listenerGenerationRef?: React.MutableRefObject<number>,
  ) => (() => void);
  /** Handle pointer down — save pre-drag pitch/heading. */
  handleDragStart: (panorama: google.maps.StreetViewPanorama | null) => void;
  /**
   * Handle pointer up / pointer cancel — detect horizontal-only drift and correct.
   * Returns the corrected pitch if drift was detected, or null.
   */
  handleDragEnd: (panorama: google.maps.StreetViewPanorama | null) => number | null;
}

/**
 * Hook that manages camera pitch drift prevention.
 *
 * Provides methods to:
 * - Reset drift state at round start
 * - Attach pov_changed drift correction to a panorama
 * - Handle drag start/end for drift detection
 * - B1-FIX v2: Detect corruption patterns and request reinit
 * - B1-FIX v2: Track last-known-good POV for safe resume
 */
export function useCameraDrift(): CameraDriftControls {
  const driftTrackerRef = useRef<DriftTrackerState>(createDriftTracker(0));
  const corruptionDetectorRef = useRef<CorruptionDetectorState>(createCorruptionDetector());
  const lastKnownGoodPOVTrackerRef = useRef<LastKnownGoodPOV>(createLastKnownGoodPOV(0, 0));

  const resetDrift = useCallback((initialPitch: number) => {
    driftTrackerRef.current = resetDriftTracker(driftTrackerRef.current, initialPitch);
    corruptionDetectorRef.current = resetCorruptionDetector();
    lastKnownGoodPOVTrackerRef.current = createLastKnownGoodPOV(0, initialPitch);
  }, []);

  const attachDriftCorrection = useCallback((
    panorama: google.maps.StreetViewPanorama,
    onCorruptionReinit?: () => void,
    lastKnownGoodPOVRef?: React.MutableRefObject<{ heading: number; pitch: number }>,
    listenerGeneration?: number,
    listenerGenerationRef?: React.MutableRefObject<number>,
  ) => {
    const listener = panorama.addListener("pov_changed", () => {
      // B1-FIX v2: Generation guard — if generation has changed, this listener is stale
      if (listenerGeneration !== undefined && listenerGenerationRef &&
          listenerGenerationRef.current !== listenerGeneration) {
        return; // Stale listener — no-op
      }

      const pov = panorama.getPov();
      const now = Date.now();

      // Process drift detection
      const result = processPovChange(
        driftTrackerRef.current,
        pov.pitch,
        pov.heading,
        now,
      );
      driftTrackerRef.current = result.newState;

      if (result.correctedPitch !== null) {
        // Mark self-induced BEFORE setPov to suppress feedback loop
        driftTrackerRef.current = markSelfInducedChange(driftTrackerRef.current);
        panorama.setPov({
          heading: pov.heading,
          pitch: result.correctedPitch,
        });
      }

      // B1-FIX v2: Corruption detection
      const corruptResult = detectCorruption(
        corruptionDetectorRef.current,
        pov,
        result.driftDetected,
        now,
      );
      corruptionDetectorRef.current = corruptResult.newState;

      if (corruptResult.needsReinit) {
        logger.warn(`[Nav] B1: Corruption detected (storm=${corruptResult.isEventStorm}), requesting reinit`);
        corruptionDetectorRef.current = resetCorruptionDetector();
        if (onCorruptionReinit) onCorruptionReinit();
      }

      // B1-FIX v2: Update lastKnownGoodPOV when POV is stable (no drift correction applied)
      if (!result.driftDetected && result.correctedPitch === null) {
        lastKnownGoodPOVTrackerRef.current = updateLastKnownGoodPOV(
          lastKnownGoodPOVTrackerRef.current,
          pov.heading,
          pov.pitch,
          now,
        );
        // Sync to lifecycle ref if provided
        if (lastKnownGoodPOVRef && lastKnownGoodPOVTrackerRef.current.stabilityCount >= 3) {
          lastKnownGoodPOVRef.current = {
            heading: lastKnownGoodPOVTrackerRef.current.heading,
            pitch: lastKnownGoodPOVTrackerRef.current.pitch,
          };
        }
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, []);

  const handleDragStart = useCallback((panorama: google.maps.StreetViewPanorama | null) => {
    if (panorama) {
      const pov = panorama.getPov();
      driftTrackerRef.current = markDragStart(driftTrackerRef.current, pov.pitch, pov.heading);
    } else {
      driftTrackerRef.current = markDragStart(driftTrackerRef.current, 0, 0);
    }
  }, []);

  const handleDragEnd = useCallback((panorama: google.maps.StreetViewPanorama | null): number | null => {
    if (!panorama) return null;

    const currentPov = panorama.getPov();
    const dragResult = markDragEnd(driftTrackerRef.current, currentPov.pitch, currentPov.heading);
    driftTrackerRef.current = dragResult.newState;

    if (dragResult.correctedPitch !== null) {
      // Mark self-induced BEFORE setPov to suppress feedback loop
      driftTrackerRef.current = markSelfInducedChange(driftTrackerRef.current);
      panorama.setPov({
        heading: currentPov.heading,
        pitch: dragResult.correctedPitch,
      });
      return dragResult.correctedPitch;
    }
    return null;
  }, []);

  return {
    driftTrackerRef,
    corruptionDetectorRef,
    lastKnownGoodPOVTrackerRef,
    resetDrift,
    attachDriftCorrection,
    handleDragStart,
    handleDragEnd,
  };
}
