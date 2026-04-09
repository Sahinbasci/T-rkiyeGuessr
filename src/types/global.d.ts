/**
 * Global type augmentations for TurkiyeGuessr
 *
 * Eliminates `as any` casts on window and performance objects.
 */

/** Multiplayer debug counters — exposed on window in CHAOS_MODE */
interface MpCounters {
  listenerFireCount: number;
  statusWriteCount: number;
  roundEndLockAcquireAttempts: number;
  roundEndLockAcquired: number;
  roundEndWrites: number;
  ghostRemovedCount: number;
  notificationFiredCount: number;
  hostMigrationCount: number;
  watchdogFiredCount: number;
  watchdogFailureCount: number;
  roundEndLatencyMs: number;
  maxRoundEndLatencyMs: number;
  unhandledRejectionCount: number;
  firebaseInternalAbortCount: number;
  roundEndLatencies: number[];
  earlyFinishLatencies: number[];
}

/** Chrome-only Performance.memory API (non-standard) */
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

declare global {
  interface Window {
    __mpCounters?: MpCounters;
    __ga4Ready?: boolean;
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
  interface Performance {
    memory?: PerformanceMemory;
  }
}

export {};
