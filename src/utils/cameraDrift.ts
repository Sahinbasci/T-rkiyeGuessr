/**
 * cameraDrift.ts — Pure functions for Street View camera pitch drift prevention
 *
 * ROOT CAUSE:
 * Google Maps Street View SDK's internal touch handler on mobile accumulates
 * floating-point errors in pitch during horizontal-only drag rotations.
 * Over 30-60 seconds of continuous rotation, pitch drifts upward (toward sky).
 *
 * The custom code in useStreetView.ts does NOT touch pitch during rotation —
 * rotation (drag-to-look) is 100% handled by the SDK internally.
 * The pano_changed handler's same-pano early-return (line 554-558) only
 * updates heading, never pitch.
 *
 * FIX STRATEGY:
 * 1. Clamp pitch to safe bounds on every pov_changed event
 * 2. Detect horizontal-only rotation and correct accumulated drift
 * 3. All logic is pure functions — testable without Google Maps SDK
 */

// ==================== CONSTANTS ====================

/** Maximum allowed pitch in degrees (looking up). Google SV max is 90. */
export const PITCH_MAX = 80;

/** Minimum allowed pitch in degrees (looking down). Google SV min is -90. */
export const PITCH_MIN = -80;

/**
 * Drift threshold in degrees.
 * If pitch changes more than this between pov_changed events WITHOUT
 * the user actively dragging vertically, it's considered drift.
 */
export const DRIFT_THRESHOLD_DEG = 0.1;

/**
 * Maximum accumulated drift before correction kicks in (non-drag / momentum).
 * Small drifts are tolerated. Correction fires when total > this.
 */
export const DRIFT_CORRECTION_THRESHOLD_DEG = 0.8;

/**
 * Max pitch deviation allowed during a horizontal-only drag.
 * If pitch changes less than this during a drag where heading changed
 * significantly, the pitch change is considered drift and gets reverted.
 * Needs to be generous enough to not revert intentional diagonal drags.
 */
export const MAX_DRAG_DRIFT_DEG = 3.0;

/**
 * Minimum heading change to consider a drag "horizontal rotation".
 * If heading changes less than this, we can't determine direction → no correction.
 */
export const MIN_HEADING_CHANGE_FOR_DRAG_CORRECTION = 5.0;

/**
 * How many samples to keep for drift detection.
 * At ~60fps pov_changed rate, 60 samples = ~1 second window.
 */
export const DRIFT_WINDOW_SIZE = 60;


// ==================== PURE FUNCTIONS ====================

/**
 * Clamp a pitch value to safe bounds.
 * Returns the clamped value. Pure function.
 */
export function clampPitch(pitch: number): number {
  if (!Number.isFinite(pitch)) return 0;
  return Math.max(PITCH_MIN, Math.min(PITCH_MAX, pitch));
}

/**
 * Determine if a pitch value needs clamping.
 */
export function needsClamp(pitch: number): boolean {
  if (!Number.isFinite(pitch)) return true;
  return pitch > PITCH_MAX || pitch < PITCH_MIN;
}

/**
 * Compute heading delta (handles 0/360 wraparound).
 * Returns smallest angle between two headings.
 */
export function headingDelta(h1: number, h2: number): number {
  let d = Math.abs(h1 - h2) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

/**
 * Compute pitch delta (simple difference, no wraparound).
 */
export function pitchDelta(p1: number, p2: number): number {
  return Math.abs(p1 - p2);
}


// ==================== DRIFT TRACKER STATE ====================

export interface DriftSample {
  pitch: number;
  heading: number;
  timestamp: number;
}

export interface DriftTrackerState {
  /** Ring buffer of recent POV samples */
  samples: DriftSample[];
  /** Index for next write in ring buffer */
  writeIndex: number;
  /** Pitch value the user last intentionally set (drag end, or correction) */
  anchorPitch: number;
  /** Accumulated drift since last anchor */
  accumulatedDrift: number;
  /** Total corrections applied */
  correctionCount: number;
  /** Whether user is currently dragging (touch down) */
  isDragging: boolean;
  /** Pitch before the current drag started (for drag-end correction) */
  preDragPitch: number;
  /** Heading before the current drag started (for horizontal detection) */
  preDragHeading: number;
}

/**
 * Create a fresh drift tracker state.
 */
export function createDriftTracker(initialPitch: number = 0): DriftTrackerState {
  return {
    samples: [],
    writeIndex: 0,
    anchorPitch: initialPitch,
    accumulatedDrift: 0,
    correctionCount: 0,
    isDragging: false,
    preDragPitch: initialPitch,
    preDragHeading: 0,
  };
}

/**
 * Record a new POV sample and detect drift.
 *
 * Returns: { correctedPitch: number | null, driftDetected: boolean }
 * - correctedPitch: non-null if pitch needs correction (apply via setPov)
 * - driftDetected: true if drift accumulation exceeded threshold
 *
 * Pure function — takes state in, returns new state + result.
 */
export function processPovChange(
  state: DriftTrackerState,
  currentPitch: number,
  currentHeading: number,
  now: number = Date.now()
): {
  newState: DriftTrackerState;
  correctedPitch: number | null;
  driftDetected: boolean;
} {
  const sample: DriftSample = {
    pitch: currentPitch,
    heading: currentHeading,
    timestamp: now,
  };

  // Add to ring buffer
  const newSamples = [...state.samples];
  if (newSamples.length < DRIFT_WINDOW_SIZE) {
    newSamples.push(sample);
  } else {
    newSamples[state.writeIndex] = sample;
  }
  const newWriteIndex = (state.writeIndex + 1) % DRIFT_WINDOW_SIZE;

  // If user is actively dragging, don't correct — just track samples
  // IMPORTANT: Do NOT update anchorPitch here. Drift during drag would be
  // absorbed into anchor, making it invisible to post-drag correction.
  // The drag-end handler decides whether to keep or revert the pitch.
  if (state.isDragging) {
    return {
      newState: {
        ...state,
        samples: newSamples,
        writeIndex: newWriteIndex,
      },
      correctedPitch: null,
      driftDetected: false,
    };
  }

  // Hard clamp: always enforce bounds regardless of drift detection
  if (needsClamp(currentPitch)) {
    const clamped = clampPitch(currentPitch);
    return {
      newState: {
        ...state,
        samples: newSamples,
        writeIndex: newWriteIndex,
        anchorPitch: clamped,
        accumulatedDrift: 0,
        correctionCount: state.correctionCount + 1,
      },
      correctedPitch: clamped,
      driftDetected: true,
    };
  }

  // Check drift: pitch changed significantly but heading also changed
  // (horizontal rotation should NOT change pitch)
  const prevSample = newSamples.length > 1
    ? newSamples[(newWriteIndex - 2 + newSamples.length) % newSamples.length]
    : null;

  if (prevSample) {
    const hDelta = headingDelta(currentHeading, prevSample.heading);
    const pDelta = pitchDelta(currentPitch, prevSample.pitch);

    // Horizontal rotation detected (heading changed) with pitch creep
    // Threshold 0.3° covers real-device pov_changed rates (15-60fps, 30-60°/sec rotation)
    if (hDelta > 0.3 && pDelta > 0 && pDelta < DRIFT_THRESHOLD_DEG) {
      // Small pitch change during horizontal rotation = likely drift
      // Use direct deviation from anchor (not cumulative sum, which would grow O(n²))
      const newAccumulated = currentPitch - state.anchorPitch;

      if (Math.abs(newAccumulated) >= DRIFT_CORRECTION_THRESHOLD_DEG) {
        // Drift exceeded threshold — snap back to anchor pitch
        // Update the current sample in the ring buffer to reflect corrected pitch,
        // so the next frame's pDelta comparison doesn't see a false "intentional drag" jump
        const correctedSamples = [...newSamples];
        const currentIdx = correctedSamples.length < DRIFT_WINDOW_SIZE
          ? correctedSamples.length - 1
          : (newWriteIndex - 1 + DRIFT_WINDOW_SIZE) % DRIFT_WINDOW_SIZE;
        correctedSamples[currentIdx] = { ...correctedSamples[currentIdx], pitch: state.anchorPitch };

        return {
          newState: {
            ...state,
            samples: correctedSamples,
            writeIndex: newWriteIndex,
            accumulatedDrift: 0,
            correctionCount: state.correctionCount + 1,
          },
          correctedPitch: state.anchorPitch,
          driftDetected: true,
        };
      }

      return {
        newState: {
          ...state,
          samples: newSamples,
          writeIndex: newWriteIndex,
          accumulatedDrift: newAccumulated,
        },
        correctedPitch: null,
        driftDetected: false,
      };
    }

    // Significant pitch change (user intentionally looked up/down)
    if (pDelta > DRIFT_THRESHOLD_DEG * 3) {
      return {
        newState: {
          ...state,
          samples: newSamples,
          writeIndex: newWriteIndex,
          anchorPitch: currentPitch,
          accumulatedDrift: 0,
        },
        correctedPitch: null,
        driftDetected: false,
      };
    }
  }

  // No significant change
  return {
    newState: {
      ...state,
      samples: newSamples,
      writeIndex: newWriteIndex,
    },
    correctedPitch: null,
    driftDetected: false,
  };
}

/**
 * Mark drag start — saves pre-drag pitch/heading and suppresses drift correction.
 */
export function markDragStart(
  state: DriftTrackerState,
  currentPitch: number,
  currentHeading: number
): DriftTrackerState {
  return {
    ...state,
    isDragging: true,
    preDragPitch: state.anchorPitch, // Save the anchor BEFORE drag (not current drifted value)
    preDragHeading: currentHeading,
  };
}

/**
 * Mark drag end — detects horizontal-only rotation and reverts drift.
 *
 * If the drag was primarily horizontal (heading changed a lot, pitch changed little),
 * the pitch change is considered SDK drift and gets reverted to pre-drag value.
 * If pitch changed significantly, it was an intentional vertical look.
 *
 * Returns new state AND optional correctedPitch for the caller to apply via setPov.
 */
export function markDragEnd(
  state: DriftTrackerState,
  currentPitch: number,
  currentHeading: number
): { newState: DriftTrackerState; correctedPitch: number | null } {
  const hChange = headingDelta(currentHeading, state.preDragHeading);
  const pChange = pitchDelta(currentPitch, state.preDragPitch);

  // Was this a horizontal-only rotation? (heading changed a lot, pitch changed little)
  const isHorizontalRotation =
    hChange >= MIN_HEADING_CHANGE_FOR_DRAG_CORRECTION &&
    pChange <= MAX_DRAG_DRIFT_DEG;

  if (isHorizontalRotation && pChange > 0) {
    // Pitch drifted during horizontal rotation → revert to pre-drag anchor
    return {
      newState: {
        ...state,
        isDragging: false,
        anchorPitch: state.preDragPitch,
        accumulatedDrift: 0,
        correctionCount: state.correctionCount + 1,
      },
      correctedPitch: state.preDragPitch,
    };
  }

  // Intentional pitch change or insignificant drag → update anchor
  return {
    newState: {
      ...state,
      isDragging: false,
      anchorPitch: currentPitch,
      accumulatedDrift: 0,
    },
    correctedPitch: null,
  };
}

/**
 * Reset tracker (new round, new pano).
 */
export function resetDriftTracker(
  state: DriftTrackerState,
  newPitch: number = 0
): DriftTrackerState {
  return createDriftTracker(newPitch);
}
