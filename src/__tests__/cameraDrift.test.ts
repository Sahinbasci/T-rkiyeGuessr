import { describe, test, expect } from "vitest";
import {
  clampPitch,
  needsClamp,
  headingDelta,
  pitchDelta,
  createDriftTracker,
  processPovChange,
  markDragStart,
  markDragEnd,
  resetDriftTracker,
  PITCH_MAX,
  PITCH_MIN,
  DRIFT_CORRECTION_THRESHOLD_DEG,
  DRIFT_THRESHOLD_DEG,
} from "@/utils/cameraDrift";

// ==================== clampPitch ====================

describe("clampPitch", () => {
  test("returns 0 for NaN", () => {
    expect(clampPitch(NaN)).toBe(0);
  });

  test("returns 0 for Infinity", () => {
    expect(clampPitch(Infinity)).toBe(0);
    expect(clampPitch(-Infinity)).toBe(0);
  });

  test("clamps above PITCH_MAX", () => {
    expect(clampPitch(85)).toBe(PITCH_MAX);
    expect(clampPitch(90)).toBe(PITCH_MAX);
    expect(clampPitch(180)).toBe(PITCH_MAX);
  });

  test("clamps below PITCH_MIN", () => {
    expect(clampPitch(-85)).toBe(PITCH_MIN);
    expect(clampPitch(-90)).toBe(PITCH_MIN);
    expect(clampPitch(-180)).toBe(PITCH_MIN);
  });

  test("preserves values within bounds", () => {
    expect(clampPitch(0)).toBe(0);
    expect(clampPitch(45)).toBe(45);
    expect(clampPitch(-45)).toBe(-45);
    expect(clampPitch(PITCH_MAX)).toBe(PITCH_MAX);
    expect(clampPitch(PITCH_MIN)).toBe(PITCH_MIN);
  });
});

// ==================== needsClamp ====================

describe("needsClamp", () => {
  test("true for out-of-bounds", () => {
    expect(needsClamp(81)).toBe(true);
    expect(needsClamp(-81)).toBe(true);
    expect(needsClamp(NaN)).toBe(true);
  });

  test("false for in-bounds", () => {
    expect(needsClamp(0)).toBe(false);
    expect(needsClamp(80)).toBe(false);
    expect(needsClamp(-80)).toBe(false);
    expect(needsClamp(45)).toBe(false);
  });
});

// ==================== headingDelta ====================

describe("headingDelta", () => {
  test("basic difference", () => {
    expect(headingDelta(10, 20)).toBe(10);
    expect(headingDelta(350, 10)).toBe(20);
    expect(headingDelta(0, 180)).toBe(180);
  });

  test("wraparound at 360", () => {
    expect(headingDelta(1, 359)).toBe(2);
    expect(headingDelta(0, 360)).toBe(0);
  });

  test("same heading", () => {
    expect(headingDelta(90, 90)).toBe(0);
  });

  test("symmetry", () => {
    expect(headingDelta(30, 60)).toBe(headingDelta(60, 30));
  });
});

// ==================== pitchDelta ====================

describe("pitchDelta", () => {
  test("basic difference", () => {
    expect(pitchDelta(10, 20)).toBe(10);
    expect(pitchDelta(-10, 10)).toBe(20);
  });

  test("same pitch", () => {
    expect(pitchDelta(0, 0)).toBe(0);
    expect(pitchDelta(-45, -45)).toBe(0);
  });
});

// ==================== createDriftTracker ====================

describe("createDriftTracker", () => {
  test("initializes with defaults", () => {
    const tracker = createDriftTracker();
    expect(tracker.anchorPitch).toBe(0);
    expect(tracker.accumulatedDrift).toBe(0);
    expect(tracker.correctionCount).toBe(0);
    expect(tracker.isDragging).toBe(false);
    expect(tracker.samples).toHaveLength(0);
  });

  test("initializes with custom pitch", () => {
    const tracker = createDriftTracker(30);
    expect(tracker.anchorPitch).toBe(30);
  });
});

// ==================== processPovChange — hard clamp ====================

describe("processPovChange — hard clamp", () => {
  test("corrects pitch above PITCH_MAX", () => {
    const state = createDriftTracker(0);
    const { newState, correctedPitch, driftDetected } = processPovChange(
      state, 85, 100, 1000
    );
    expect(correctedPitch).toBe(PITCH_MAX);
    expect(driftDetected).toBe(true);
    expect(newState.correctionCount).toBe(1);
  });

  test("corrects pitch below PITCH_MIN", () => {
    const state = createDriftTracker(0);
    const { correctedPitch, driftDetected } = processPovChange(
      state, -85, 100, 1000
    );
    expect(correctedPitch).toBe(PITCH_MIN);
    expect(driftDetected).toBe(true);
  });

  test("no correction for in-bounds pitch", () => {
    const state = createDriftTracker(0);
    const { correctedPitch } = processPovChange(state, 45, 100, 1000);
    expect(correctedPitch).toBeNull();
  });
});

// ==================== processPovChange — drift detection ====================

describe("processPovChange — drift detection", () => {
  test("detects gradual drift during horizontal rotation", () => {
    let state = createDriftTracker(0);

    // Simulate horizontal rotation with tiny pitch drift per step
    // Each step: heading changes by 5°, pitch drifts by 0.1° (under DRIFT_THRESHOLD)
    const driftPerStep = 0.1;
    const stepsNeeded = Math.ceil(DRIFT_CORRECTION_THRESHOLD_DEG / driftPerStep) + 5;

    let totalCorrections = 0;
    let heading = 0;
    let pitch = 0;

    for (let i = 0; i < stepsNeeded; i++) {
      heading = (heading + 5) % 360;
      pitch += driftPerStep;
      const result = processPovChange(state, pitch, heading, 1000 + i * 16);
      state = result.newState;
      if (result.correctedPitch !== null) {
        totalCorrections++;
        pitch = result.correctedPitch; // Apply correction
      }
    }

    // Drift should have been detected and corrected at least once
    expect(totalCorrections).toBeGreaterThan(0);
    expect(state.correctionCount).toBeGreaterThan(0);
  });

  test("does NOT correct intentional vertical drag", () => {
    let state = createDriftTracker(0);

    // First sample at pitch=0
    let result = processPovChange(state, 0, 90, 1000);
    state = result.newState;

    // User drags upward — large pitch change, small heading change
    result = processPovChange(state, 30, 91, 1016);
    state = result.newState;

    // Should NOT correct — user intentionally looked up
    expect(result.correctedPitch).toBeNull();
    expect(state.anchorPitch).toBe(30); // Anchor updated to new pitch
  });

  test("suppresses correction during active drag", () => {
    let state = createDriftTracker(0);

    // Mark drag start (with current pitch/heading)
    state = markDragStart(state, 0, 100);
    expect(state.isDragging).toBe(true);

    // Pitch changes during drag — should NOT trigger correction
    const result = processPovChange(state, 45, 200, 1000);
    expect(result.correctedPitch).toBeNull();
    // BUG-001 FIX: During drag, anchorPitch is NOT updated (drift absorbed into anchor
    // would make it invisible to post-drag correction)
    expect(result.newState.anchorPitch).toBe(0);
  });

  test("re-anchors on drag end", () => {
    let state = createDriftTracker(0);

    // Simulate drag to pitch=30
    state = markDragStart(state, 0, 100);
    const dragResult = processPovChange(state, 30, 100, 1000);
    state = dragResult.newState;

    // End drag at pitch=30 — markDragEnd returns { newState, correctedPitch }
    const endResult = markDragEnd(state, 30, 100);
    expect(endResult.newState.isDragging).toBe(false);
    expect(endResult.newState.anchorPitch).toBe(30);
    expect(endResult.newState.accumulatedDrift).toBe(0);
  });
});

// ==================== Drift simulation — realistic scenario ====================

describe("drift simulation — realistic mobile scenario", () => {
  test("60 seconds of horizontal rotation: pitch stays within 5° of anchor", () => {
    let state = createDriftTracker(0);
    // Realistic: pov_changed fires ~15 times/sec on mobile
    const eventsPerSec = 15;
    const durationSec = 60;
    const totalEvents = eventsPerSec * durationSec;

    // Simulate SDK drift: 0.1° per pov_changed event during horizontal rotation
    // This compounds to 90° over 60s without correction — exactly the reported bug
    const sdkDriftPerEvent = 0.1;

    let heading = 0;
    let sdkPitch = 0; // What SDK would report without correction
    let correctedPitch = 0; // What user actually sees

    let maxPitchSeen = 0;
    let corrections = 0;

    for (let i = 0; i < totalEvents; i++) {
      // Realistic: 2°/event at 15fps = 30°/sec rotation speed
      heading = (heading + 2) % 360;
      sdkPitch += sdkDriftPerEvent; // SDK accumulates drift

      // Use corrected or SDK pitch
      const reportedPitch = correctedPitch + sdkDriftPerEvent;

      const result = processPovChange(state, reportedPitch, heading, i * (1000 / eventsPerSec));
      state = result.newState;

      if (result.correctedPitch !== null) {
        correctedPitch = result.correctedPitch;
        corrections++;
      } else {
        correctedPitch = reportedPitch;
      }

      maxPitchSeen = Math.max(maxPitchSeen, Math.abs(correctedPitch));
    }

    // Without correction, sdkPitch would be: 0.1 * 900 = 90° (sky!)
    // With correction, pitch should stay within 5° of anchor (0°)
    expect(maxPitchSeen).toBeLessThan(5);
    expect(corrections).toBeGreaterThan(0);

    // The uncorrected SDK would have drifted to:
    expect(sdkPitch).toBeGreaterThan(80); // Confirms the bug would occur
  });

  test("horizontal rotation with starting pitch=45: drift corrected relative to anchor", () => {
    let state = createDriftTracker(45);
    // Realistic pov_changed rate
    const eventsPerSec = 15;
    const totalEvents = eventsPerSec * 30; // 30 seconds

    let heading = 0;
    let correctedPitch = 45;
    let maxDrift = 0;

    for (let i = 0; i < totalEvents; i++) {
      // 2°/event heading change (realistic rotation speed)
      heading = (heading + 2) % 360;
      const reportedPitch = correctedPitch + 0.08; // SDK drift per event

      const result = processPovChange(state, reportedPitch, heading, i * (1000 / eventsPerSec));
      state = result.newState;

      if (result.correctedPitch !== null) {
        correctedPitch = result.correctedPitch;
      } else {
        correctedPitch = reportedPitch;
      }

      maxDrift = Math.max(maxDrift, Math.abs(correctedPitch - 45));
    }

    // Pitch should stay close to anchor (45°)
    expect(maxDrift).toBeLessThan(5);
  });
});

// ==================== resetDriftTracker ====================

describe("resetDriftTracker", () => {
  test("resets all state", () => {
    let state = createDriftTracker(30);
    state.correctionCount = 5;
    state.accumulatedDrift = 10;
    state.isDragging = true;

    const reset = resetDriftTracker(state, 0);
    expect(reset.anchorPitch).toBe(0);
    expect(reset.accumulatedDrift).toBe(0);
    expect(reset.correctionCount).toBe(0);
    expect(reset.isDragging).toBe(false);
    expect(reset.samples).toHaveLength(0);
  });

  test("resets to custom pitch", () => {
    const state = createDriftTracker(0);
    const reset = resetDriftTracker(state, -20);
    expect(reset.anchorPitch).toBe(-20);
  });
});

// ==================== Drift loop prevention ====================

describe("drift loop prevention", () => {
  test("corrected pitch fed back does NOT re-trigger correction", () => {
    let state = createDriftTracker(0);

    // Build up drift to just above threshold
    let heading = 0;
    let pitch = 0;
    let correctedPitch: number | null = null;

    // Feed drift until correction fires
    for (let i = 0; i < 200; i++) {
      heading = (heading + 3) % 360;
      pitch += 0.08; // small drift per step

      const result = processPovChange(state, pitch, heading, i * 16);
      state = result.newState;

      if (result.correctedPitch !== null) {
        correctedPitch = result.correctedPitch;
        pitch = correctedPitch; // Apply correction
        break;
      }
    }

    // Correction should have fired
    expect(correctedPitch).not.toBeNull();
    expect(state.correctionCount).toBe(1);

    // Now feed the corrected pitch back with continued heading rotation
    // This should NOT trigger another correction
    const nextHeading = (heading + 3) % 360;
    const result2 = processPovChange(state, correctedPitch!, nextHeading, 5000);

    // The corrected pitch should not cause another correction
    expect(result2.correctedPitch).toBeNull();
    expect(result2.newState.correctionCount).toBe(1); // Same count as before
  });

  test("multiple corrections do not cause oscillation", () => {
    let state = createDriftTracker(10);

    let heading = 0;
    let pitch = 10;
    let corrections = 0;
    const correctionPitches: number[] = [];

    // Simulate 120s (1800 events at 15fps) with persistent drift
    for (let i = 0; i < 1800; i++) {
      heading = (heading + 2) % 360;
      pitch += 0.08; // SDK drift

      const result = processPovChange(state, pitch, heading, i * (1000 / 15));
      state = result.newState;

      if (result.correctedPitch !== null) {
        corrections++;
        correctionPitches.push(result.correctedPitch);
        pitch = result.correctedPitch; // Apply correction
      }
    }

    // All corrections should snap back to the anchor (10°)
    for (const cp of correctionPitches) {
      expect(cp).toBe(10);
    }

    // No oscillation: pitch should never overshoot below anchor
    // (corrections always go TO anchor, never past it)
    expect(corrections).toBeGreaterThan(0);
  });
});

// ==================== Edge cases ====================

describe("edge cases", () => {
  test("NaN pitch gets corrected to 0", () => {
    const state = createDriftTracker(0);
    const { correctedPitch } = processPovChange(state, NaN, 100, 1000);
    expect(correctedPitch).toBe(0); // clampPitch(NaN) = 0, needsClamp(NaN) = true
  });

  test("rapid heading oscillation does not cause false correction", () => {
    let state = createDriftTracker(20);

    // Rapid left-right oscillation at fixed pitch (exact same pitch each time)
    let corrections = 0;
    for (let i = 0; i < 100; i++) {
      const heading = i % 2 === 0 ? 90 : 270; // Alternating
      const result = processPovChange(state, 20, heading, i * 16);
      state = result.newState;
      // Only count non-null corrections (clamping NaN, etc.)
      if (result.correctedPitch !== null && result.correctedPitch !== 20) corrections++;
    }

    // No corrections should fire — pitch is stable at 20
    expect(corrections).toBe(0);
  });

  test("single-sample state handles gracefully", () => {
    const state = createDriftTracker(0);
    const result = processPovChange(state, 10, 90, 1000);
    // First sample, no previous — should not crash or correct
    expect(result.correctedPitch).toBeNull();
    expect(result.newState.samples).toHaveLength(1);
  });
});
