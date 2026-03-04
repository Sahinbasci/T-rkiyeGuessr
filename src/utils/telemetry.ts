/**
 * TürkiyeGuessr Telemetry Module
 * Prod'da hata yakalamak için telemetry/logging sistemi
 */

import { logger } from "@/utils/logger";

// Event types
export type TelemetryEvent =
  | "join"
  | "leave"
  | "roundStart"
  | "roundEnd"
  | "submitGuess"
  | "timeUp"
  | "gameEnd"
  | "error"
  | "move"
  | "ghostClickSuppressed"
  | "moveRejected"
  | "desyncDetected"
  | "serverMoveAccepted"
  | "serverMoveRejected"
  | "rateLimitTriggered"
  | "duplicatePanoPrevented"
  // BUG-002: Geofence rejection
  | "guessRejected"
  // BUG-006: Game restart lifecycle
  | "gameRestart"
  // BUG-007: Black screen detection & recovery
  | "blackScreenDetected"
  | "blackScreenRecovery"
  | "bfcacheRestore"
  // B1-FIX v2: POV corruption recovery
  | "povCorruptionRecovery"
  // BUG-008: Watchdog telemetry
  | "watchdogTick"
  | "watchdogForceRecovery"
  | "watchdogRecoverySkipped"
  // BUG-005: Rejoin
  | "rejoin"
  // Ad lifecycle
  | "adRenderAttempt"
  | "adRenderSuccess"
  | "adRenderFailed"
  | "adBlockerDetected"
  | "interstitialShown"
  | "interstitialSkipped"
  // Consent actions
  | "consentAcceptAll"
  | "consentRequiredOnly"
  | "consentModalSaved"
  // Consent Mode v2
  | "consentModeInit"
  | "consentModeUpdate"
  // AdSense script lifecycle
  | "adSenseScriptLoaded"
  | "adSenseScriptFailed"
  // GA4 analytics
  | "ga4ScriptLoaded"
  | "ga4ScriptFailed"
  // Game funnel (GA4 forwarded)
  | "game_start"
  | "round_complete"
  | "game_complete"
  | "room_created"
  | "room_joined"
  | "ad_impression"
  | "premium_cta_click"
  // HARDENING: Multiplayer stabilization events
  | "round_end_stuck_reset"
  | "all_guessed_detected"
  | "processing_start"
  | "processing_stop"
  | "processing_force_reset"
  | "resync_triggered"
  | "resync_applied"
  | "moves_sync_from_server"
  | "host_migrated"
  | "player_disconnected"
  | "player_reconnected"
  | "overlay_escalated";

// Event data structure
interface TelemetryEventData {
  event: TelemetryEvent;
  timestamp: number;
  roomId?: string;
  roundId?: number;
  playerId?: string;
  playerName?: string;
  metadata?: Record<string, unknown>;
}

// Session state
interface TelemetrySession {
  sessionId: string;
  startTime: number;
  roomId: string | null;
  playerId: string | null;
  playerName: string | null;
  events: TelemetryEventData[];
  counters: Record<TelemetryEvent, number>;
  duplicateAttempts: {
    roundEnd: number[];
    timeUp: number[];
  };
  listenerCounts: {
    subscriptions: number;
    unsubscriptions: number;
  };
  errors: Array<{
    timestamp: number;
    message: string;
    stack?: string;
    context?: string;
  }>;
}

// Singleton session
let session: TelemetrySession | null = null;

// Generate unique session ID
function generateSessionId(): string {
  return `ses_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// Initialize telemetry session
export function initTelemetry(): void {
  session = {
    sessionId: generateSessionId(),
    startTime: Date.now(),
    roomId: null,
    playerId: null,
    playerName: null,
    events: [],
    counters: {
      join: 0,
      leave: 0,
      roundStart: 0,
      roundEnd: 0,
      submitGuess: 0,
      timeUp: 0,
      gameEnd: 0,
      error: 0,
      move: 0,
      ghostClickSuppressed: 0,
      moveRejected: 0,
      desyncDetected: 0,
      serverMoveAccepted: 0,
      serverMoveRejected: 0,
      rateLimitTriggered: 0,
      duplicatePanoPrevented: 0,
      guessRejected: 0,
      gameRestart: 0,
      blackScreenDetected: 0,
      blackScreenRecovery: 0,
      bfcacheRestore: 0,
      povCorruptionRecovery: 0,
      watchdogTick: 0,
      watchdogForceRecovery: 0,
      watchdogRecoverySkipped: 0,
      rejoin: 0,
      adRenderAttempt: 0,
      adRenderSuccess: 0,
      adRenderFailed: 0,
      adBlockerDetected: 0,
      interstitialShown: 0,
      interstitialSkipped: 0,
      consentAcceptAll: 0,
      consentRequiredOnly: 0,
      consentModalSaved: 0,
      consentModeInit: 0,
      consentModeUpdate: 0,
      // AdSense script lifecycle
      adSenseScriptLoaded: 0,
      adSenseScriptFailed: 0,
      // GA4 analytics
      ga4ScriptLoaded: 0,
      ga4ScriptFailed: 0,
      // Game funnel (GA4 forwarded)
      game_start: 0,
      round_complete: 0,
      game_complete: 0,
      room_created: 0,
      room_joined: 0,
      ad_impression: 0,
      premium_cta_click: 0,
      // HARDENING: Multiplayer stabilization counters
      round_end_stuck_reset: 0,
      all_guessed_detected: 0,
      processing_start: 0,
      processing_stop: 0,
      processing_force_reset: 0,
      resync_triggered: 0,
      resync_applied: 0,
      moves_sync_from_server: 0,
      host_migrated: 0,
      player_disconnected: 0,
      player_reconnected: 0,
      overlay_escalated: 0,
    },
    duplicateAttempts: {
      roundEnd: [],
      timeUp: [],
    },
    listenerCounts: {
      subscriptions: 0,
      unsubscriptions: 0,
    },
    errors: [],
  };

  logger.debug(`[Telemetry] Session started: ${session!.sessionId}`);

  // Setup global error handler
  if (typeof window !== "undefined") {
    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
  }
}

// Set session context
export function setTelemetryContext(context: {
  roomId?: string;
  playerId?: string;
  playerName?: string;
}): void {
  if (!session) initTelemetry();
  if (session) {
    if (context.roomId) session.roomId = context.roomId;
    if (context.playerId) session.playerId = context.playerId;
    if (context.playerName) session.playerName = context.playerName;
  }
}

// Track event
export function trackEvent(
  event: TelemetryEvent,
  metadata?: Record<string, unknown>
): void {
  if (!session) initTelemetry();
  if (!session) return;

  const eventData: TelemetryEventData = {
    event,
    timestamp: Date.now(),
    roomId: session.roomId || undefined,
    roundId: metadata?.roundId as number | undefined,
    playerId: session.playerId || undefined,
    playerName: session.playerName || undefined,
    metadata,
  };

  session.events.push(eventData);
  session.counters[event]++;

  // Keep only last 100 events to prevent memory issues
  if (session.events.length > 100) {
    session.events = session.events.slice(-100);
  }

  logger.debug(
    `[Telemetry] ${event} | Room: ${session.roomId || "N/A"} | Round: ${metadata?.roundId ?? "N/A"} | Count: ${session.counters[event]}`,
    metadata || ""
  );
}

// Track duplicate attempt (for debugging spam issues)
export function trackDuplicateAttempt(
  type: "roundEnd" | "timeUp",
  roundId: number
): void {
  if (!session) initTelemetry();
  if (!session) return;

  session.duplicateAttempts[type].push(roundId);

  logger.warn(
    `[Telemetry] DUPLICATE ${type} attempt for round ${roundId}! Total attempts: ${session.duplicateAttempts[type].filter((r) => r === roundId).length}`
  );
}

// Track listener subscribe/unsubscribe
export function trackListener(action: "subscribe" | "unsubscribe"): void {
  if (!session) initTelemetry();
  if (!session) return;

  if (action === "subscribe") {
    session.listenerCounts.subscriptions++;
  } else {
    session.listenerCounts.unsubscriptions++;
  }

  const balance =
    session.listenerCounts.subscriptions -
    session.listenerCounts.unsubscriptions;

  if (balance > 3) {
    logger.warn(
      `[Telemetry] Listener leak detected! Active listeners: ${balance}`
    );
  }
}

// Track error
export function trackError(
  error: Error | string,
  context?: string
): void {
  if (!session) initTelemetry();
  if (!session) return;

  const errorData = {
    timestamp: Date.now(),
    message: typeof error === "string" ? error : error.message,
    stack: typeof error === "string" ? undefined : error.stack,
    context,
  };

  session.errors.push(errorData);
  session.counters.error++;

  // Keep only last 50 errors
  if (session.errors.length > 50) {
    session.errors = session.errors.slice(-50);
  }

  logger.error(
    `[Telemetry] Error #${session.counters.error}:`,
    errorData.message,
    context ? `| Context: ${context}` : ""
  );
}

// Global error handler
function handleGlobalError(event: ErrorEvent): void {
  trackError(event.error || event.message, "window.onerror");
}

// Unhandled promise rejection handler
function handleUnhandledRejection(event: PromiseRejectionEvent): void {
  trackError(
    event.reason?.message || String(event.reason),
    "unhandledrejection"
  );
}

// Get session summary
export function getTelemetrySummary(): {
  sessionId: string;
  duration: number;
  counters: Record<TelemetryEvent, number>;
  duplicateAttempts: { roundEnd: number; timeUp: number };
  listenerBalance: number;
  errorCount: number;
  lastErrors: string[];
} | null {
  if (!session) return null;

  return {
    sessionId: session.sessionId,
    duration: Date.now() - session.startTime,
    counters: { ...session.counters },
    duplicateAttempts: {
      roundEnd: session.duplicateAttempts.roundEnd.length,
      timeUp: session.duplicateAttempts.timeUp.length,
    },
    listenerBalance:
      session.listenerCounts.subscriptions -
      session.listenerCounts.unsubscriptions,
    errorCount: session.errors.length,
    lastErrors: session.errors.slice(-5).map((e) => e.message),
  };
}

// Print full report to console (dev only)
export function printTelemetryReport(): void {
  const summary = getTelemetrySummary();
  if (!summary) {
    logger.debug("[Telemetry] No session data");
    return;
  }

  // Entire report is dev-only via logger.debug
  const lines = [
    `--- TürkiyeGuessr Telemetry Report ---`,
    `Session ID: ${summary.sessionId}`,
    `Duration: ${Math.round(summary.duration / 1000)}s`,
    ``,
    `Event Counters:`,
    ...Object.entries(summary.counters)
      .filter(([, count]) => count > 0)
      .map(([event, count]) => `  ${event}: ${count}`),
    ``,
    `Duplicate Attempts:`,
    `  roundEnd: ${summary.duplicateAttempts.roundEnd}`,
    `  timeUp: ${summary.duplicateAttempts.timeUp}`,
    ``,
    `Listener Balance: ${summary.listenerBalance}${summary.listenerBalance > 0 ? " (potential leak!)" : ""}`,
  ];

  if (summary.errorCount > 0) {
    lines.push(``, `Errors: ${summary.errorCount}`, `  Last: ${summary.lastErrors.join(", ")}`);
  }

  lines.push(`--- End Report ---`);
  logger.debug(lines.join("\n"));
}

// Cleanup on unmount
export function cleanupTelemetry(): void {
  if (typeof window !== "undefined") {
    window.removeEventListener("error", handleGlobalError);
    window.removeEventListener("unhandledrejection", handleUnhandledRejection);
  }

  printTelemetryReport();
  session = null;
}

// Export session for debugging
export function getSession(): TelemetrySession | null {
  return session;
}
