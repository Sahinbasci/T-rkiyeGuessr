/**
 * Shared types and constants for streetview hook modules.
 *
 * Extracted from useStreetView.ts to enable decomposition into
 * focused, testable sub-hooks without circular dependencies.
 */

// ==================== CONSTANTS ====================

/** Maximum pano search attempts for findRandomLocation. */
export const MAX_ATTEMPTS = 50;

/** When remaining budget <= this threshold, show warning. */
export const BUDGET_WARNING_THRESHOLD = 1;

// Custom Navigation Constants
export const DRAG_THRESHOLD_PX = 20;
export const CLICK_COOLDOWN_MS = 250;
export const HEADING_CONFIDENCE_THRESHOLD = 90;

// ==================== TYPES ====================

/**
 * Production observability: counters for monitoring navigation health.
 */
export interface NavigationMetrics {
  rotateCount: number;
  moveCount: number;
  ghostClickSuppressedCount: number;
  dragDetectedCount: number;
  moveRejectedCount: number;
  cooldownRejectedCount: number;
  postDragSuppressedCount: number;
  missingPointerDownCount: number;
  linkClickBypassCount: number;
  listenerAttachCount: number;
  listenerDetachCount: number;
  // Cost defense metrics
  panoLoadCount: number;
  serverMoveAccepted: number;
  serverMoveRejected: number;
  duplicatePanoPrevented: number;
  rateLimitTriggered: number;
  // [COST] v4 instrumentation
  resolveFromCoordsCallCountPerRound: number;
  resolveFromCoordsCallCountOnRevisit: number;
  googleInternalMetadataEstimate: number;
  panoramaConstructorCountPerRound: number;
  setPanoCallCount: number;
  revertPanoCallCount: number;
  fallbackMetadataCallCount: number;
}

/**
 * Factory: create a zeroed-out NavigationMetrics object.
 */
export function createEmptyMetrics(): NavigationMetrics {
  return {
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
 * Default Street View panorama options.
 * Mobile-specific options (panControl) are applied at call site.
 */
export const BASE_STREET_VIEW_OPTIONS: google.maps.StreetViewPanoramaOptions = {
  addressControl: false,
  fullscreenControl: false,
  enableCloseButton: false,
  showRoadLabels: false,
  zoomControl: true,
  linksControl: false,
  motionTracking: false,
  motionTrackingControl: false,
  clickToGo: false,
  disableDefaultUI: false,
  scrollwheel: true,
};
