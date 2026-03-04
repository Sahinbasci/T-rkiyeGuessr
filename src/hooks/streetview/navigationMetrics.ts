/**
 * navigationMetrics.ts — Module-level navigation metrics singleton.
 *
 * Extracted from useStreetView.ts. Pure module with no React dependencies.
 * Provides get/reset/log functions for production observability.
 */

import { FEATURE_FLAGS } from "@/config/production";
import { logger } from "@/utils/logger";
import { type NavigationMetrics, createEmptyMetrics } from "./types";

// Re-export the type so existing imports from useStreetView still work
export type { NavigationMetrics };

// Module-level singleton
let navigationMetrics: NavigationMetrics = createEmptyMetrics();

/**
 * Get a snapshot of current navigation metrics.
 */
export function getNavigationMetrics(): NavigationMetrics {
  return { ...navigationMetrics };
}

/**
 * Reset all navigation metrics to zero.
 */
export function resetNavigationMetrics(): void {
  navigationMetrics = createEmptyMetrics();
}

/**
 * Direct mutable reference to the metrics singleton.
 * Used by sub-hooks that need to increment counters in hot paths
 * (event handlers, pano_changed, etc.) without function call overhead.
 *
 * WARNING: Only modify via known increment patterns. Never reassign fields
 * to arbitrary values outside of resetNavigationMetrics().
 */
export function getMetricsRef(): NavigationMetrics {
  return navigationMetrics;
}

/**
 * Log cost metrics in consistent format for production observability.
 */
export function logCostMetrics(event: string, extra: Record<string, string | number> = {}): void {
  if (!FEATURE_FLAGS.ENABLE_DEBUG_LOGS) return;
  const parts = [`[COST] event=${event}`];
  parts.push(`resolveFromCoords=${navigationMetrics.resolveFromCoordsCallCountPerRound}`);
  parts.push(`resolveOnRevisit=${navigationMetrics.resolveFromCoordsCallCountOnRevisit}`);
  parts.push(`googleInternal\u2248${navigationMetrics.googleInternalMetadataEstimate}`);
  parts.push(`constructorPerRound=${navigationMetrics.panoramaConstructorCountPerRound}`);
  parts.push(`setPanoCalls=${navigationMetrics.setPanoCallCount}`);
  parts.push(`revertCalls=${navigationMetrics.revertPanoCallCount}`);
  parts.push(`fallbackCalls=${navigationMetrics.fallbackMetadataCallCount}`);
  for (const [k, v] of Object.entries(extra)) {
    parts.push(`${k}=${v}`);
  }
  logger.debug(parts.join(" "));
}
