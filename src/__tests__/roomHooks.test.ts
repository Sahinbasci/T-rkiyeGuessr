/**
 * Room Hooks — Unit Tests
 *
 * Tests for the extracted hook modules:
 * - useProcessingGuard: lock acquisition, stop, force reset
 * - useNotifications: add, dismiss, clearAll, auto-cleanup
 * - ROOM_CONSTANTS: verify constant values
 *
 * Note: React hook testing uses renderHook from @testing-library/react.
 * Firebase-dependent hooks (usePresence, useHostCleanup, etc.) are tested
 * via the existing gateB-safety-net integration tests and roomLogic tests,
 * since they are thin wrappers around the same Firebase logic.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { ROOM_CONSTANTS } from "@/hooks/room/types";

// ==================== ROOM_CONSTANTS ====================

describe("ROOM_CONSTANTS", () => {
  test("has all expected constants with correct values", () => {
    expect(ROOM_CONSTANTS.DISCONNECT_GRACE_PERIOD).toBe(15000);
    expect(ROOM_CONSTANTS.STALE_HEARTBEAT_THRESHOLD).toBe(30000);
    expect(ROOM_CONSTANTS.HEARTBEAT_INTERVAL).toBe(5000);
    expect(ROOM_CONSTANTS.CLEANUP_INTERVAL).toBe(10000);
    expect(ROOM_CONSTANTS.ROUND_END_RECOVERY_BUFFER).toBe(3);
    expect(ROOM_CONSTANTS.WATCHDOG_INTERVAL).toBe(5000);
    expect(ROOM_CONSTANTS.WATCHDOG_BUFFER).toBe(5);
    expect(ROOM_CONSTANTS.WATCHDOG_MAX_ATTEMPTS).toBe(8);
    expect(ROOM_CONSTANTS.WATCHDOG_LOCK_STALE_THRESHOLD).toBe(10000);
    expect(ROOM_CONSTANTS.PROCESSING_STUCK_THRESHOLD).toBe(15000);
    expect(ROOM_CONSTANTS.GUESS_GRACE_PERIOD_MS).toBe(3000);
  });

  test("all constants are positive numbers", () => {
    // Verify all constants are positive numbers (sanity check)
    for (const [key, value] of Object.entries(ROOM_CONSTANTS)) {
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThan(0);
    }
  });
});

// ==================== useProcessingGuard ====================

// We need to mock telemetry before importing the hook
vi.mock("@/utils/telemetry", () => ({
  trackEvent: vi.fn(),
  trackError: vi.fn(),
  trackDuplicateAttempt: vi.fn(),
  trackListener: vi.fn(),
  initTelemetry: vi.fn(),
  cleanupTelemetry: vi.fn(),
  setTelemetryContext: vi.fn(),
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("useProcessingGuard", () => {
  let useProcessingGuard: typeof import("@/hooks/room/useProcessingGuard").useProcessingGuard;

  beforeEach(async () => {
    const mod = await import("@/hooks/room/useProcessingGuard");
    useProcessingGuard = mod.useProcessingGuard;
  });

  test("startProcessing acquires lock on first call", () => {
    const { result } = renderHook(() => useProcessingGuard());

    const acquired = result.current.startProcessing("test", 1);
    expect(acquired).toBe(true);
    expect(result.current.isProcessingRef.current).toBe(true);
    expect(result.current.processingRoundIdRef.current).toBe(1);
    expect(result.current.processingStartTimeRef.current).not.toBeNull();
  });

  test("startProcessing rejects when already processing", () => {
    const { result } = renderHook(() => useProcessingGuard());

    const first = result.current.startProcessing("first", 1);
    expect(first).toBe(true);

    const second = result.current.startProcessing("second", 2);
    expect(second).toBe(false);
    // Still on first round
    expect(result.current.processingRoundIdRef.current).toBe(1);
  });

  test("stopProcessing releases lock", () => {
    const { result } = renderHook(() => useProcessingGuard());

    result.current.startProcessing("test", 1);
    expect(result.current.isProcessingRef.current).toBe(true);

    result.current.stopProcessing("done");
    expect(result.current.isProcessingRef.current).toBe(false);
    expect(result.current.processingStartTimeRef.current).toBeNull();
  });

  test("forceResetProcessing clears all state", () => {
    const { result } = renderHook(() => useProcessingGuard());

    result.current.startProcessing("test", 3);
    expect(result.current.isProcessingRef.current).toBe(true);
    expect(result.current.processingRoundIdRef.current).toBe(3);

    result.current.forceResetProcessing("emergency");
    expect(result.current.isProcessingRef.current).toBe(false);
    expect(result.current.processingStartTimeRef.current).toBeNull();
    expect(result.current.processingRoundIdRef.current).toBeNull();
  });

  test("after stopProcessing, can acquire again", () => {
    const { result } = renderHook(() => useProcessingGuard());

    result.current.startProcessing("first", 1);
    result.current.stopProcessing("done");

    const acquired = result.current.startProcessing("second", 2);
    expect(acquired).toBe(true);
    expect(result.current.processingRoundIdRef.current).toBe(2);
  });
});

// ==================== useNotifications ====================

describe("useNotifications", () => {
  let useNotifications: typeof import("@/hooks/room/useNotifications").useNotifications;

  beforeEach(async () => {
    vi.useFakeTimers();
    const mod = await import("@/hooks/room/useNotifications");
    useNotifications = mod.useNotifications;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("addNotification creates a notification", () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification("player_joined", "Alice joined", "Alice");
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].type).toBe("player_joined");
    expect(result.current.notifications[0].message).toBe("Alice joined");
    expect(result.current.notifications[0].playerName).toBe("Alice");
  });

  test("notifications auto-dismiss after 5 seconds", () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification("player_left", "Bob left", "Bob");
    });

    expect(result.current.notifications).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(5001);
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  test("dismissNotification removes specific notification", () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification("player_joined", "Alice joined", "Alice");
      result.current.addNotification("player_joined", "Bob joined", "Bob");
    });

    expect(result.current.notifications).toHaveLength(2);

    const firstId = result.current.notifications[0].id;
    act(() => {
      result.current.dismissNotification(firstId);
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].message).toBe("Bob joined");
  });

  test("clearAll removes all notifications", () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification("player_joined", "Alice joined");
      result.current.addNotification("player_left", "Bob left");
      result.current.addNotification("host_changed", "Charlie is host");
    });

    expect(result.current.notifications).toHaveLength(3);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.notifications).toHaveLength(0);
  });

  test("multiple notifications have unique IDs", () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification("player_joined", "A");
      result.current.addNotification("player_joined", "B");
      result.current.addNotification("player_joined", "C");
    });

    const ids = result.current.notifications.map(n => n.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });
});
