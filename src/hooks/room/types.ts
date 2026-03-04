/**
 * Shared types for room hook modules.
 *
 * These types define the interfaces between the decomposed hooks,
 * ensuring clean, typed communication without tight coupling.
 */

// Room, Player types referenced indirectly via re-exported GameNotification

// Re-export GameNotification from the canonical location
export type { GameNotification } from "@/utils/roomLogic";

/**
 * RoundEndLock — tracks who is processing the round end transition.
 * Written to Firebase as `rooms/{id}/roundEndLock`.
 */
export interface RoundEndLock {
  lockedBy: string;   // uid of lock owner
  roundId: number;    // which round this lock is for
  lockedAt: number;   // timestamp when acquired
}

/**
 * Server time context passed during round end latency measurement.
 */
export interface RoundEndTimingContext {
  serverNow?: number;
}

/**
 * Processing guard state — centralized management of isProcessingRound.
 * Prevents double-start, ensures consistent cleanup, adds debug tracing.
 */
export interface ProcessingGuard {
  /** Attempt to start processing. Returns true if acquired, false if already active. */
  startProcessing: (reason: string, roundId?: number) => boolean;
  /** Mark processing as complete. */
  stopProcessing: (reason: string) => void;
  /** Force reset all processing state (emergency escape hatch). */
  forceResetProcessing: (reason: string) => void;
  /** Whether round processing is currently active. */
  isProcessingRef: React.MutableRefObject<boolean>;
  /** The round ID being processed, or null. */
  processingRoundIdRef: React.MutableRefObject<number | null>;
  /** Timestamp when processing started, for stuck detection. */
  processingStartTimeRef: React.MutableRefObject<number | null>;
}

/**
 * Notification controls returned by useNotifications.
 */
export interface NotificationControls {
  notifications: import("@/utils/roomLogic").GameNotification[];
  addNotification: (type: import("@/utils/roomLogic").GameNotification["type"], message: string, playerName?: string) => void;
  dismissNotification: (id: string) => void;
  /** Cleanup all pending notification timers (call on unmount). */
  cleanupTimers: () => void;
  /** Clear all notifications and their timers. */
  clearAll: () => void;
}

/**
 * Constants shared across room hooks.
 * Extracted from useRoom.ts to avoid duplication.
 */
export const ROOM_CONSTANTS = {
  DISCONNECT_GRACE_PERIOD: 15000,   // 15s before removing disconnected player
  STALE_HEARTBEAT_THRESHOLD: 30000, // 30s no heartbeat -> mark disconnected
  HEARTBEAT_INTERVAL: 5000,         // 5s heartbeat
  CLEANUP_INTERVAL: 10000,          // 10s cleanup cycle
  ROUND_END_RECOVERY_BUFFER: 3,     // seconds past time limit before recovery kicks in
  WATCHDOG_INTERVAL: 5000,          // 5s watchdog tick
  WATCHDOG_BUFFER: 5,               // seconds past timeLimit before watchdog acts
  WATCHDOG_MAX_ATTEMPTS: 8,         // BUG-008 FIX: raised from 3 -> 8
  WATCHDOG_LOCK_STALE_THRESHOLD: 10000, // 10s
  PROCESSING_STUCK_THRESHOLD: 15000,    // 15s
  GUESS_GRACE_PERIOD_MS: 3000,
} as const;
