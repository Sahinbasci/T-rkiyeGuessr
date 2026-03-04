"use client";

/**
 * useNavigationEngine — Click-to-navigate heading calculation and link resolution.
 *
 * Extracted from useStreetView.ts. Contains pure geometry functions
 * (calculateClickHeading, findNearestLink) and the navigateToLink action.
 *
 * The pointer event handler orchestration remains in useStreetView.ts
 * because it depends on move budget, drift, and panorama lifecycle state.
 */

import { useCallback } from "react";
import {
  HEADING_CONFIDENCE_THRESHOLD,
} from "./types";
import { getMetricsRef } from "./navigationMetrics";

/**
 * Calculate the target heading from a click position relative to the container center.
 *
 * @param clickX - Client X coordinate of the click
 * @param clickY - Client Y coordinate of the click (unused, kept for API compat)
 * @param container - The Street View container element
 * @param currentHeading - Current camera heading in degrees
 * @returns Target heading in [0, 360) range
 */
export function calculateClickHeading(
  clickX: number,
  clickY: number,
  container: HTMLElement,
  currentHeading: number
): number {
  const rect = container.getBoundingClientRect();
  const centerX = rect.width / 2;

  const relX = clickX - rect.left - centerX;

  const horizontalFOV = 90;
  const angleFromCenter = (relX / centerX) * (horizontalFOV / 2);

  let targetHeading = currentHeading + angleFromCenter;

  while (targetHeading < 0) targetHeading += 360;
  while (targetHeading >= 360) targetHeading -= 360;

  return targetHeading;
}

/**
 * Find the nearest navigation link to a target heading.
 *
 * @param targetHeading - Desired heading in degrees
 * @param links - Available Street View links from panorama.getLinks()
 * @returns The nearest link within HEADING_CONFIDENCE_THRESHOLD, or null
 */
export function findNearestLink(
  targetHeading: number,
  links: (google.maps.StreetViewLink | null)[] | null
): google.maps.StreetViewLink | null {
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
}

export interface NavigationEngineResult {
  /** Calculate heading from click coordinates. */
  calculateClickHeading: typeof calculateClickHeading;
  /** Find the nearest link to a given heading. */
  findNearestLink: typeof findNearestLink;
  /** Navigate to a specific link (setPano + metrics). */
  navigateToLink: (
    link: google.maps.StreetViewLink,
    panorama: google.maps.StreetViewPanorama | null,
    pendingPitchRef: React.MutableRefObject<number>,
    expectedPanoRef: React.MutableRefObject<string | null>,
  ) => void;
}

/**
 * Hook providing navigation calculation utilities.
 *
 * Pure geometry functions are exported directly for testing.
 * The navigateToLink callback handles setPano + metric tracking.
 */
export function useNavigationEngine(): NavigationEngineResult {
  const navigateToLink = useCallback((
    link: google.maps.StreetViewLink,
    panorama: google.maps.StreetViewPanorama | null,
    pendingPitchRef: React.MutableRefObject<number>,
    expectedPanoRef: React.MutableRefObject<string | null>,
  ) => {
    if (!panorama || !link.pano) return;
    const metrics = getMetricsRef();

    // DUPLICATE GUARD: Aynı pano'ya navigate etme
    if (panorama.getPano() === link.pano) {
      metrics.duplicatePanoPrevented++;
      return;
    }

    const currentPov = panorama.getPov();
    pendingPitchRef.current = currentPov.pitch || 0;

    // v4: HARD GUARD -- navigateToLink uses setPano(link.pano) ONLY.
    // It NEVER calls StreetViewService.getPanorama() or resolveFromCoords.
    expectedPanoRef.current = link.pano;
    panorama.setPano(link.pano);
    metrics.panoLoadCount++;
    metrics.setPanoCallCount++;
    metrics.googleInternalMetadataEstimate++;
  }, []);

  return {
    calculateClickHeading,
    findNearestLink,
    navigateToLink,
  };
}
