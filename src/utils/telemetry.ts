/**
 * TürkiyeGuessr Telemetry Module
 * Prod'da hata yakalamak için telemetry/logging sistemi
 */

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
  | "duplicatePanoPrevented";

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

  console.log(`[Telemetry] Session started: ${session!.sessionId}`);

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

  const logStyle = getLogStyle(event);
  console.log(
    `[Telemetry] %c${event}%c | Room: ${session.roomId || "N/A"} | Round: ${metadata?.roundId ?? "N/A"} | Count: ${session.counters[event]}`,
    logStyle,
    "color: inherit",
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

  console.warn(
    `[Telemetry] ⚠️ DUPLICATE ${type} attempt for round ${roundId}! Total attempts: ${session.duplicateAttempts[type].filter((r) => r === roundId).length}`
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
    console.warn(
      `[Telemetry] ⚠️ Listener leak detected! Active listeners: ${balance}`
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

  console.error(
    `[Telemetry] ❌ Error #${session.counters.error}:`,
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

// Print full report to console
export function printTelemetryReport(): void {
  const summary = getTelemetrySummary();
  if (!summary) {
    console.log("[Telemetry] No session data");
    return;
  }

  console.group("📊 TürkiyeGuessr Telemetry Report");
  console.log(`Session ID: ${summary.sessionId}`);
  console.log(`Duration: ${Math.round(summary.duration / 1000)}s`);
  console.log("");

  console.group("📈 Event Counters");
  Object.entries(summary.counters).forEach(([event, count]) => {
    if (count > 0) {
      console.log(`  ${event}: ${count}`);
    }
  });
  console.groupEnd();

  console.group("⚠️ Duplicate Attempts (Bug Detection)");
  console.log(`  roundEnd duplicates: ${summary.duplicateAttempts.roundEnd}`);
  console.log(`  timeUp duplicates: ${summary.duplicateAttempts.timeUp}`);
  console.groupEnd();

  console.group("🔗 Listener Balance");
  console.log(`  Active listeners: ${summary.listenerBalance}`);
  if (summary.listenerBalance > 0) {
    console.warn("  ⚠️ Potential memory leak!");
  }
  console.groupEnd();

  if (summary.errorCount > 0) {
    console.group("❌ Errors");
    console.log(`  Total errors: ${summary.errorCount}`);
    console.log("  Last errors:", summary.lastErrors);
    console.groupEnd();
  }

  console.groupEnd();
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

// Log styling helpers
function getLogStyle(event: TelemetryEvent): string {
  const styles: Record<TelemetryEvent, string> = {
    join: "background: #22c55e; color: white; padding: 2px 6px; border-radius: 3px;",
    leave: "background: #ef4444; color: white; padding: 2px 6px; border-radius: 3px;",
    roundStart: "background: #3b82f6; color: white; padding: 2px 6px; border-radius: 3px;",
    roundEnd: "background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 3px;",
    submitGuess: "background: #f59e0b; color: white; padding: 2px 6px; border-radius: 3px;",
    timeUp: "background: #ec4899; color: white; padding: 2px 6px; border-radius: 3px;",
    gameEnd: "background: #14b8a6; color: white; padding: 2px 6px; border-radius: 3px;",
    error: "background: #dc2626; color: white; padding: 2px 6px; border-radius: 3px;",
    move: "background: #6366f1; color: white; padding: 2px 6px; border-radius: 3px;",
    ghostClickSuppressed: "background: #f97316; color: white; padding: 2px 6px; border-radius: 3px;",
    moveRejected: "background: #ef4444; color: white; padding: 2px 6px; border-radius: 3px;",
    desyncDetected: "background: #dc2626; color: white; padding: 2px 6px; border-radius: 3px;",
    serverMoveAccepted: "background: #22c55e; color: white; padding: 2px 6px; border-radius: 3px;",
    serverMoveRejected: "background: #dc2626; color: white; padding: 2px 6px; border-radius: 3px;",
    rateLimitTriggered: "background: #f97316; color: white; padding: 2px 6px; border-radius: 3px;",
    duplicatePanoPrevented: "background: #a855f7; color: white; padding: 2px 6px; border-radius: 3px;",
  };
  return styles[event];
}

// Export session for debugging
export function getSession(): TelemetrySession | null {
  return session;
}
