/**
 * Street View hooks -- Focused modules extracted from the monolithic useStreetView.ts.
 *
 * Each module handles a single responsibility with clean interfaces:
 * - types.ts: Shared types, constants, factory functions
 * - navigationMetrics.ts: Module-level metrics singleton (get/reset/log)
 * - useGoogleMapsLoader.ts: Google Maps JS API script loading
 * - useCameraDrift.ts: Camera pitch drift prevention
 * - useNavigationEngine.ts: Click heading calculation and link resolution
 * - usePanoLifecycle.ts: Panorama creation, destruction, integrity checks
 */

// Types and constants
export {
  MAX_ATTEMPTS,
  BUDGET_WARNING_THRESHOLD,
  DRAG_THRESHOLD_PX,
  CLICK_COOLDOWN_MS,
  HEADING_CONFIDENCE_THRESHOLD,
  BASE_STREET_VIEW_OPTIONS,
  createEmptyMetrics,
} from "./types";
export type { NavigationMetrics } from "./types";

// Navigation metrics (pure module)
export {
  getNavigationMetrics,
  resetNavigationMetrics,
  getMetricsRef,
  logCostMetrics,
} from "./navigationMetrics";

// Hooks
export { useGoogleMapsLoader, _resetLoaderForTest } from "./useGoogleMapsLoader";
export type { GoogleMapsLoaderResult } from "./useGoogleMapsLoader";

export { useCameraDrift } from "./useCameraDrift";
export type { CameraDriftControls } from "./useCameraDrift";

export { useNavigationEngine, calculateClickHeading, findNearestLink } from "./useNavigationEngine";
export type { NavigationEngineResult } from "./useNavigationEngine";

export { usePanoLifecycle } from "./usePanoLifecycle";
export type { PanoLifecycleResult } from "./usePanoLifecycle";
