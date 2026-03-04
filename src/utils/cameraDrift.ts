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
 * Lowered from 0.8 → 0.3 to correct before visible creep (BUG-001 fix).
 */
export const DRIFT_CORRECTION_THRESHOLD_DEG = 0.3;

/**
 * Max pitch deviation allowed during a horizontal-only drag.
 * If pitch changes less than this during a drag where heading changed
 * significantly, the pitch change is considered drift and gets reverted.
 * Must be high enough to catch real-world drift (5-15° over 30s rotation)
 * but not so high that intentional diagonal drags get reverted.
 */
export const MAX_DRAG_DRIFT_DEG = 8.0;

/**
 * Minimum heading change to consider a drag "horizontal rotation".
 * If heading changes less than this, we can't determine direction → no correction.
 */
export const MIN_HEADING_CHANGE_FOR_DRAG_CORRECTION = 10.0;

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
  /** Timestamp of last correction (for time-based suppression) */
  lastCorrectionTime: number;
  /** Flag: next pov_changed is self-induced by our setPov call — skip drift detection */
  isSelfInducedChange: boolean;
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
    lastCorrectionTime: 0,
    isSelfInducedChange: false,
  };
}

/**
 * Mark next pov_changed as self-induced (our setPov correction).
 * Caller should set this BEFORE calling setPov.
 */
export function markSelfInducedChange(state: DriftTrackerState): DriftTrackerState {
  return { ...state, isSelfInducedChange: true };
}

/** Time window (ms) to suppress drift detection after a correction */
const CORRECTION_SUPPRESSION_MS = 150;

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

  // Self-induced suppression: skip drift detection for our own setPov corrections
  if (state.isSelfInducedChange) {
    return {
      newState: {
        ...state,
        samples: newSamples,
        writeIndex: newWriteIndex,
        isSelfInducedChange: false, // Consume the flag
      },
      correctedPitch: null,
      driftDetected: false,
    };
  }

  // Time-based suppression: skip drift detection shortly after a correction
  if (state.lastCorrectionTime > 0 && (now - state.lastCorrectionTime) < CORRECTION_SUPPRESSION_MS) {
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
        lastCorrectionTime: now,
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
            lastCorrectionTime: now,
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
 * Sanitize a POV from a potentially corrupted state.
 * Returns a safe POV with pitch clamped and NaN/Infinity handled.
 * Pure function — safe for use in lifecycle resume handlers.
 */
export function sanitizePov(pov: { heading: number; pitch: number }): { heading: number; pitch: number } {
  let heading = pov.heading;
  let pitch = pov.pitch;

  // Handle NaN/Infinity
  if (!Number.isFinite(heading)) heading = 0;
  if (!Number.isFinite(pitch)) pitch = 0;

  // Normalize heading to [0, 360)
  heading = ((heading % 360) + 360) % 360;

  // Clamp pitch
  pitch = clampPitch(pitch);

  return { heading, pitch };
}

/**
 * Detect if a POV appears to be in a drifted/corrupted state.
 * Returns true if the POV needs correction.
 */
export function isPovCorrupted(pov: { heading: number; pitch: number }): boolean {
  if (!Number.isFinite(pov.heading) || !Number.isFinite(pov.pitch)) return true;
  if (pov.pitch > PITCH_MAX || pov.pitch < PITCH_MIN) return true;
  return false;
}

// ==================== LAST-KNOWN-GOOD POV TRACKING ====================

/**
 * State for tracking the last known valid/stable POV.
 * Updated only when POV is stable (not during corruption or rapid changes).
 */
export interface LastKnownGoodPOV {
  heading: number;
  pitch: number;
  timestamp: number;
  /** Number of consecutive stable samples seen before accepting this POV */
  stabilityCount: number;
}

/** Minimum consecutive stable samples before accepting a POV as "good" */
const STABILITY_REQUIRED_SAMPLES = 3;

/** Maximum pitch jump in a single frame that's considered stable (not corruption) */
export const MAX_STABLE_PITCH_JUMP = 15;

/** Maximum heading jump in a single frame that's considered stable */
export const MAX_STABLE_HEADING_JUMP = 45;

/**
 * Create initial last-known-good POV.
 */
export function createLastKnownGoodPOV(heading: number = 0, pitch: number = 0): LastKnownGoodPOV {
  return { heading, pitch, timestamp: Date.now(), stabilityCount: 0 };
}

/**
 * Update last-known-good POV with a new sample.
 * Only accepts the sample as "good" if it's been stable for STABILITY_REQUIRED_SAMPLES frames.
 * Returns updated state (may or may not have changed the stored POV).
 */
export function updateLastKnownGoodPOV(
  state: LastKnownGoodPOV,
  currentHeading: number,
  currentPitch: number,
  now: number = Date.now(),
): LastKnownGoodPOV {
  // Reject if corrupt values
  if (!Number.isFinite(currentHeading) || !Number.isFinite(currentPitch)) {
    return { ...state, stabilityCount: 0 };
  }
  if (currentPitch > PITCH_MAX || currentPitch < PITCH_MIN) {
    return { ...state, stabilityCount: 0 };
  }

  // Check for sudden large jumps (potential corruption)
  const hJump = headingDelta(currentHeading, state.heading);
  const pJump = pitchDelta(currentPitch, state.pitch);

  if (pJump > MAX_STABLE_PITCH_JUMP || (hJump > MAX_STABLE_HEADING_JUMP && pJump > 1)) {
    // Large unexpected jump — reset stability counter, don't update stored POV
    return { ...state, stabilityCount: 0 };
  }

  // Stable sample — increment counter
  const newCount = state.stabilityCount + 1;
  if (newCount >= STABILITY_REQUIRED_SAMPLES) {
    // Enough stable samples — accept as new "good" POV
    return {
      heading: currentHeading,
      pitch: currentPitch,
      timestamp: now,
      stabilityCount: newCount,
    };
  }

  return { ...state, stabilityCount: newCount };
}

// ==================== CORRUPTION DETECTION ====================

/** Threshold: N consecutive corrupted events triggers reinit */
export const CORRUPTION_REINIT_THRESHOLD = 5;

/** Threshold: events per second that constitutes a "storm" */
export const EVENT_STORM_THRESHOLD = 120;

/** Window (ms) over which to measure event storm */
export const EVENT_STORM_WINDOW_MS = 1000;

/**
 * State for advanced corruption detection.
 * Tracks consecutive corruption events, event storms, and repeated drift.
 */
export interface CorruptionDetectorState {
  /** Consecutive corrupted POV events (NaN, Infinity, out-of-range) */
  consecutiveCorrupted: number;
  /** Consecutive drift corrections applied */
  consecutiveDriftCorrections: number;
  /** pov_changed event timestamps for storm detection (ring buffer) */
  eventTimestamps: number[];
  /** Write index for event timestamps */
  eventWriteIndex: number;
  /** Whether a reinit has been requested (consumer should act on this) */
  reinitRequested: boolean;
}

/**
 * Create initial corruption detector state.
 */
export function createCorruptionDetector(): CorruptionDetectorState {
  return {
    consecutiveCorrupted: 0,
    consecutiveDriftCorrections: 0,
    eventTimestamps: [],
    eventWriteIndex: 0,
    reinitRequested: false,
  };
}

/**
 * Record a pov_changed event and check for corruption patterns.
 *
 * Returns: { newState, needsReinit, isEventStorm }
 * - needsReinit: true if consecutive corruption or drift exceeds threshold
 * - isEventStorm: true if event frequency exceeds storm threshold
 */
export function detectCorruption(
  state: CorruptionDetectorState,
  pov: { heading: number; pitch: number },
  wasDriftCorrected: boolean,
  now: number = Date.now(),
): {
  newState: CorruptionDetectorState;
  needsReinit: boolean;
  isEventStorm: boolean;
} {
  // Track event timestamp
  const newTimestamps = [...state.eventTimestamps];
  if (newTimestamps.length < EVENT_STORM_THRESHOLD * 2) {
    newTimestamps.push(now);
  } else {
    newTimestamps[state.eventWriteIndex] = now;
  }
  const newWriteIndex = (state.eventWriteIndex + 1) % (EVENT_STORM_THRESHOLD * 2);

  // Detect event storm
  const cutoff = now - EVENT_STORM_WINDOW_MS;
  const recentEvents = newTimestamps.filter(t => t > cutoff).length;
  const isEventStorm = recentEvents > EVENT_STORM_THRESHOLD;

  // Track corruption
  const isCorrupted = isPovCorrupted(pov);
  const newConsecutiveCorrupted = isCorrupted ? state.consecutiveCorrupted + 1 : 0;
  const newConsecutiveDrift = wasDriftCorrected ? state.consecutiveDriftCorrections + 1 : 0;

  // Determine if reinit needed
  const needsReinit =
    newConsecutiveCorrupted >= CORRUPTION_REINIT_THRESHOLD ||
    newConsecutiveDrift >= CORRUPTION_REINIT_THRESHOLD * 2 ||
    isEventStorm;

  return {
    newState: {
      consecutiveCorrupted: newConsecutiveCorrupted,
      consecutiveDriftCorrections: newConsecutiveDrift,
      eventTimestamps: newTimestamps,
      eventWriteIndex: newWriteIndex,
      reinitRequested: needsReinit,
    },
    needsReinit,
    isEventStorm,
  };
}

/**
 * Reset corruption detector (after reinit or new round).
 */
export function resetCorruptionDetector(): CorruptionDetectorState {
  return createCorruptionDetector();
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
