"use client";

/**
 * useRoom Hook — MULTIPLAYER ZERO-BUG v2
 *
 * Architecture invariants:
 * 1. Presence: Single onDisconnect (once per mount). Heartbeat updates lastSeen only.
 * 2. Cleanup: HOST-ONLY, runs in ALL statuses, transaction-based, idempotent.
 * 3. RoundEnd: roundEndLock elector — host acquires lock, writes roundEnd exactly once.
 *    If host is dead, host migration promotes new host who then acquires lock.
 * 4. leaveRoom: Only removes self (+ atomic host migration if needed). No roundEnd computation.
 * 5. Notifications: Snapshot diff with previousPlayerNamesRef. Never suppressed.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { database, ref, set, get, onValue, update, remove, runTransaction, getAuthUid } from "@/config/firebase";
import {
  Room,
  Player,
  PlayerStatus,
  Coordinates,
  GameMode,
  PanoPackage,
  GAME_MODE_CONFIG,
} from "@/types";

// ==================== SERVER TIME OFFSET ====================
// Firebase exposes `.info/serverTimeOffset` — the estimated delta between
// client clock and server clock (ms). serverNow ≈ Date.now() + offset.
let _serverTimeOffset = 0;
let _offsetListenerAttached = false;

function attachServerTimeOffsetListener() {
  if (_offsetListenerAttached) return;
  _offsetListenerAttached = true;
  const offsetRef = ref(database, ".info/serverTimeOffset");
  onValue(offsetRef, (snap) => {
    _serverTimeOffset = snap.val() || 0;
  });
}

/** Returns best-estimate of server time (ms since epoch). */
function getServerNowMs(): number {
  return Date.now() + _serverTimeOffset;
}
import {
  generateRoomCode,
  canCreateRoom,
  canJoinRoom,
  canSubmitGuess,
  resetGuessLimit,
  getRoomCreateCooldown,
  generateSessionToken,
  saveSessionToken,
  getSessionToken,
  clearSessionToken,
} from "@/utils";
import {
  initTelemetry,
  setTelemetryContext,
  trackEvent,
  trackDuplicateAttempt,
  trackListener,
  trackError,
  cleanupTelemetry,
} from "@/utils/telemetry";
import {
  setupRoomCleanup,
  cleanupRoomData,
  recordPlayerActivity,
} from "@/services/roomLifecycle";
import {
  trackRoomCreated,
  trackRoomJoined,
} from "@/services/analytics";
import {
  isValidTurkeyCoordinate,
  isValidPlayerName,
  ERROR_MESSAGES,
  FEATURE_FLAGS,
} from "@/config/production";
import { logger } from "@/utils/logger";
import {
  electNewHost,
  computeRoundResults,
  updatePlayersAfterRound,
} from "@/utils/roomLogic";

// ==================== EXTRACTED HOOKS ====================
import { useProcessingGuard } from "@/hooks/room/useProcessingGuard";
import { useNotifications } from "@/hooks/room/useNotifications";
import { usePresence } from "@/hooks/room/usePresence";
import { useHostCleanup } from "@/hooks/room/useHostCleanup";
import { useBeforeUnload } from "@/hooks/room/useBeforeUnload";
import { useHostWatchdog } from "@/hooks/room/useHostWatchdog";
import { useClientResync } from "@/hooks/room/useClientResync";
import { ROOM_CONSTANTS } from "@/hooks/room/types";

// ==================== TYPES ====================

// Re-export GameNotification for backward compatibility
export type { GameNotification } from "@/hooks/room/useNotifications";

export interface RoundEndLock {
  lockedBy: string;   // uid of lock owner
  roundId: number;    // which round this lock is for
  lockedAt: number;   // timestamp when acquired
}

// ==================== CONSTANTS ====================
// Now imported from ROOM_CONSTANTS (src/hooks/room/types.ts) — single source of truth.

const {
  DISCONNECT_GRACE_PERIOD,
  STALE_HEARTBEAT_THRESHOLD,
  ROUND_END_RECOVERY_BUFFER,
  GUESS_GRACE_PERIOD_MS,
} = ROOM_CONSTANTS;

// ==================== INSTRUMENTATION ====================

interface RoundEndTimingContext {
  serverNow?: number;  // from meta/serverNow, passed by caller
}

// CHAOS_MODE: enable via localStorage.setItem('CHAOS_MODE', '1') or env var
const CHAOS_MODE = typeof window !== 'undefined'
  ? localStorage.getItem('CHAOS_MODE') === '1'
  : process.env.NEXT_PUBLIC_CHAOS_MODE === '1';

// Per-session counters (reset on page reload)
const mpCounters = {
  listenerFireCount: 0,
  statusWriteCount: 0,
  roundEndLockAcquireAttempts: 0,
  roundEndLockAcquired: 0,
  roundEndWrites: 0,
  ghostRemovedCount: 0,
  notificationFiredCount: 0,
  hostMigrationCount: 0,
  watchdogFiredCount: 0,
  watchdogFailureCount: 0,
  roundEndLatencyMs: 0,
  maxRoundEndLatencyMs: 0,
  unhandledRejectionCount: 0,
  firebaseInternalAbortCount: 0,  // Firebase SDK repoAbortTransactionsOnNode (not our bug)
  roundEndLatencies: [] as number[],       // timeUp/watchdog/recovery latencies only
  earlyFinishLatencies: [] as number[],    // allGuessed early-finish times (positive = ms before timer expiry)
};

// Expose mpCounters on window for CHAOS validation (console access)
if (CHAOS_MODE && typeof window !== 'undefined') {
  window.__mpCounters = mpCounters;
}

function roomStateDigest(room: Room, trigger: string, clientId: string): void {
  if (!FEATURE_FLAGS.ENABLE_DEBUG_LOGS) return;
  const players = Object.values(room.players || {});
  const playerSummary = players.map(p => ({
    id: p.id.substring(0, 8),
    name: p.name,
    status: p.status || 'online',
    lastSeen: p.lastSeen ? `${Math.round((Date.now() - p.lastSeen) / 1000)}s ago` : 'n/a',
    hasGuessed: p.hasGuessed,
    guessPresent: !!p.currentGuess,
  }));

  logger.debug(`[MP] ===== ROOM DIGEST (${trigger}) =====`);
  logger.debug(`[MP] room=${room.id} client=${clientId.substring(0, 8)} status=${room.status} round=${room.currentRound}`);
  logger.debug(`[MP] hostId=${room.hostId.substring(0, 8)} roundStartTime=${room.roundStartTime}`);
  logger.debug(`[MP] expected=${room.expectedGuesses} current=${room.currentGuesses} active=${room.activePlayerCount}`);
  logger.debug(`[MP] players=`, JSON.stringify(playerSummary));
  logger.debug(`[MP] counters=`, JSON.stringify(mpCounters));
  logger.debug(`[MP] ===================================`);
}

// ==================== HOOK ====================

export function useRoom() {
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Attach server time offset listener once
  useEffect(() => { attachServerTimeOffsetListener(); }, []);

  // ==================== EXTRACTED HOOKS ====================

  // Notification system (extracted to useNotifications)
  const {
    notifications,
    addNotification,
    dismissNotification,
    cleanupTimers: _cleanupNotificationTimers,
    clearAll: clearAllNotifications,
  } = useNotifications();

  // Processing guard (extracted to useProcessingGuard)
  const processingGuard = useProcessingGuard();
  const {
    startProcessing,
    stopProcessing,
    forceResetProcessing,
    isProcessingRef: isProcessingRoundRef,
    processingRoundIdRef,
    processingStartTimeRef,
  } = processingGuard;

  // Notification tracking refs (still needed for Effect 5 snapshot diff)
  const previousPlayersRef = useRef<string[]>([]);
  const previousHostIdRef = useRef<string | null>(null);
  const notifiedJoinedRef = useRef<Set<string>>(new Set());
  const notifiedLeftRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);
  const previousPlayerNamesRef = useRef<Map<string, string>>(new Map());
  // Track notification auto-dismiss timeouts for cleanup on unmount (used by Effect 5 inline timers)
  const notificationTimerIdsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  // Round processing guards (remaining)
  const lastStatusRef = useRef<string | null>(null);

  // Double-submit guard (synchronous, not React state)
  const isSubmittingGuessRef = useRef<boolean>(false);

  // Stuck-client recovery ref
  const stuckRecoveryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // BUG-13 FIX: Track time-expired recovery setTimeout for cleanup on effect teardown
  const timeExpiredRecoveryRef = useRef<NodeJS.Timeout | null>(null);

  // Post-migration recovery refs (track leaked timeout/interval)
  const postMigrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const postMigrationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const postMigrationSafetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Host migration guard: prevent duplicate migration attempts
  const isMigratingHostRef = useRef<string | null>(null); // old hostId being migrated away from
  // BUG-006 FIX: gameInstanceId guard — detects restart and resets stale in-flight state
  const localGameInstanceIdRef = useRef<string | null>(null);

  // BUG-A FIX: Suppress "Oda silindi" toast when player intentionally leaves
  const isLeavingRef = useRef<boolean>(false);

  // HARDENING: Track allGuessed setTimeout for cleanup on effect teardown (RC-3 fix)
  const allGuessedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mirror refs for heartbeat (avoids stale closure in usePresence)
  const roomStatusRef = useRef<string | null>(null);
  const roomHostIdRef = useRef<string | null>(null);
  const roomIdRef = useRef<string | null>(null);

  // Keep mirror refs in sync with room state
  useEffect(() => {
    roomStatusRef.current = room?.status || null;
    roomHostIdRef.current = room?.hostId || null;
    roomIdRef.current = room?.id || null;
  }, [room?.status, room?.hostId, room?.id]);

  // Processing helpers are now provided by useProcessingGuard (see above).
  // startProcessing, stopProcessing, forceResetProcessing are destructured from processingGuard.
  //
  // Notification helpers are now provided by useNotifications (see above).
  // addNotification, dismissNotification are destructured from useNotifications.

  // ==================== EFFECT 1: PRESENCE (extracted to usePresence) ====================
  const { connectionState } = usePresence({
    roomId: room?.id || null,
    playerId,
    roomStatusRef,
    roomHostIdRef,
    roomIdRef,
  });

  // ==================== EFFECT 2: HOST-ONLY CLEANUP (extracted to useHostCleanup) ====================
  useHostCleanup({
    roomId: room?.id || null,
    hostId: room?.hostId || null,
    playerId,
  });

  // ==================== EFFECT 3: BEFOREUNLOAD (extracted to useBeforeUnload) ====================
  useBeforeUnload({
    roomId: room?.id || null,
    playerId,
  });

  // ==================== EFFECT 4: TELEMETRY INIT ====================

  useEffect(() => {
    initTelemetry();
    return () => cleanupTelemetry();
  }, []);

  // ==================== EFFECT 4b: CHAOS_MODE LOGGING ====================

  useEffect(() => {
    if (!CHAOS_MODE) return;
    logger.debug("[CHAOS] CHAOS_MODE enabled — logging every 30s");

    const chaosInterval = setInterval(() => {
      logger.debug("[CHAOS] mpCounters:", JSON.stringify(mpCounters));
      // Note: presence, cleanup, watchdog intervals are now managed by extracted hooks
      logger.debug("[CHAOS] Intervals:", JSON.stringify({
        postMigrationTimeout: !!postMigrationTimeoutRef.current,
        postMigrationInterval: !!postMigrationIntervalRef.current,
      }));
      if (typeof performance !== 'undefined' && performance.memory) {
        const mem = performance.memory;
        logger.debug(`[CHAOS] Heap: used=${(mem.usedJSHeapSize / 1048576).toFixed(1)}MB total=${(mem.totalJSHeapSize / 1048576).toFixed(1)}MB`);
      }
      // Latency percentile (timer-expiry rounds only)
      const latencies = mpCounters.roundEndLatencies;
      if (latencies.length > 0) {
        const under3s = latencies.filter(l => l <= 3000).length;
        logger.debug(`[CHAOS] RoundEndLatency (timeUp): ${under3s}/${latencies.length} under 3s (${((under3s / latencies.length) * 100).toFixed(1)}%) max=${Math.max(...latencies)}ms`);
      }
      const earlyFinishes = mpCounters.earlyFinishLatencies;
      if (earlyFinishes.length > 0) {
        logger.debug(`[CHAOS] EarlyFinish (allGuessed): ${earlyFinishes.length} rounds, avg=${Math.round(earlyFinishes.reduce((a, b) => a + b, 0) / earlyFinishes.length)}ms early`);
      }
      if (mpCounters.firebaseInternalAbortCount > 0) {
        logger.debug(`[CHAOS] FirebaseInternalAborts: ${mpCounters.firebaseInternalAbortCount} (SDK-level, not app errors)`);
      }
    }, 30000);

    return () => clearInterval(chaosInterval);
  }, []);

  // ==================== EFFECT 5: ROOM LISTENER + ROUND END ELECTOR ====================
  // Main onValue listener. Handles:
  // - Notification diffs (player join/leave)
  // - Host migration detection
  // - allGuessed detection (host-only)
  // - RoundEnd recovery elector (host-only, transaction-based)

  useEffect(() => {
    if (!room?.id) return;

    trackListener("subscribe");

    const roomRef = ref(database, `rooms/${room.id}`);
    const unsubscribe = onValue(roomRef, async (snapshot) => {
      const data = snapshot.val();
      mpCounters.listenerFireCount++;

      if (data) {
        const roomData = data as Room;
        const currentPlayerIds = Object.keys(roomData.players || {});
        const currentPlayerNames: Record<string, string> = {};
        Object.values(roomData.players || {}).forEach(p => { currentPlayerNames[p.id] = p.name; });

        // --- BUG-006 FIX: gameInstanceId change detection → reset stale in-flight state ---
        const incomingGid = roomData.gameInstanceId || null;
        if (incomingGid && localGameInstanceIdRef.current && incomingGid !== localGameInstanceIdRef.current) {
          logger.debug(`[MP] gameInstanceId changed: ${localGameInstanceIdRef.current} → ${incomingGid} — resetting in-flight state`);
          forceResetProcessing("gameInstanceId_change");
          // Note: watchdog attempts reset is handled by useHostWatchdog effect remount
          isMigratingHostRef.current = null;
          // RC-6 FIX: Reset handleTimeUp guard so same roundId in new game doesn't skip
          hasHandledTimeUpRef.current = null;
        }
        if (incomingGid) localGameInstanceIdRef.current = incomingGid;

        // --- Status change logging ---
        if (lastStatusRef.current !== null && lastStatusRef.current !== roomData.status) {
          mpCounters.statusWriteCount++;
          roomStateDigest(roomData, `status:${lastStatusRef.current}->${roomData.status}`, playerId);
        }
        lastStatusRef.current = roomData.status;

        // --- NOTIFICATIONS: snapshot diff, NEVER suppressed ---
        if (!isFirstLoadRef.current && previousPlayersRef.current.length > 0) {
          // Players who left
          const leftPlayers = previousPlayersRef.current.filter(
            id => !currentPlayerIds.includes(id)
          );
          leftPlayers.forEach(leftPlayerId => {
            if (leftPlayerId !== playerId && !notifiedLeftRef.current.has(leftPlayerId)) {
              const leftPlayerName = previousPlayerNamesRef.current.get(leftPlayerId) || "Bir oyuncu";
              addNotification("player_left", `${leftPlayerName} oyundan ayrıldı`, leftPlayerName);
              trackEvent("player_disconnected", { disconnectedPlayerId: leftPlayerId, playerName: leftPlayerName });
              notifiedLeftRef.current.add(leftPlayerId);
              const leftTimerId = setTimeout(() => {
                notificationTimerIdsRef.current.delete(leftTimerId);
                notifiedLeftRef.current.delete(leftPlayerId);
              }, 10000);
              notificationTimerIdsRef.current.add(leftTimerId);
            }
          });

          // Players who joined
          const joinedPlayers = currentPlayerIds.filter(
            id => !previousPlayersRef.current.includes(id)
          );
          joinedPlayers.forEach(joinedPlayerId => {
            if (joinedPlayerId !== playerId && !notifiedJoinedRef.current.has(joinedPlayerId)) {
              const joinedPlayerName = currentPlayerNames[joinedPlayerId] || "Bir oyuncu";
              addNotification("player_joined", `${joinedPlayerName} odaya katıldı`, joinedPlayerName);
              trackEvent("player_reconnected", { reconnectedPlayerId: joinedPlayerId, playerName: joinedPlayerName });
              notifiedJoinedRef.current.add(joinedPlayerId);
              const joinTimerId = setTimeout(() => {
                notificationTimerIdsRef.current.delete(joinTimerId);
                notifiedJoinedRef.current.delete(joinedPlayerId);
              }, 10000);
              notificationTimerIdsRef.current.add(joinTimerId);
            }
          });
        }

        if (isFirstLoadRef.current && previousPlayersRef.current.length > 0) {
          isFirstLoadRef.current = false;
        }

        // --- HOST MIGRATION ---
        const currentHost = roomData.players?.[roomData.hostId];
        const hostOnline = currentHost && (currentHost.status === 'online' || !currentHost.status);

        // Reset migration guard if hostId changed (migration succeeded or someone else did it)
        if (isMigratingHostRef.current && isMigratingHostRef.current !== roomData.hostId) {
          isMigratingHostRef.current = null;
        }

        if ((!hostOnline || !currentPlayerIds.includes(roomData.hostId)) && currentPlayerIds.length > 0 && !isMigratingHostRef.current) {
          // Deterministic election via pure function (tested in roomLogic.test.ts)
          const newHost = electNewHost(roomData.players || {}, roomData.hostId);

          // Only the elected candidate writes migration (prevents race)
          if (newHost && newHost.id === playerId) {
            // Set migration guard SYNCHRONOUSLY before any async work
            isMigratingHostRef.current = roomData.hostId;
            mpCounters.hostMigrationCount++;
            logger.debug(`[MP] Host migration: ${roomData.hostId.substring(0, 8)} → ${newHost.id.substring(0, 8)}`);

            // Transaction on whole room for atomicity.
            // Firebase rules now use root.child() (post-write state) instead of
            // data.parent().child() (pre-write state) for host checks, so the new
            // hostId is visible to all validate rules within the same transaction.
            const roomRefForMigration = ref(database, `rooms/${roomData.id}`);
            let migrationCommitted = false;
            try {
              await runTransaction(roomRefForMigration, (currentRoom) => {
                if (!currentRoom) return currentRoom;
                // Abort if host already changed
                if (currentRoom.hostId !== roomData.hostId) return;

                return {
                  ...currentRoom,
                  hostId: newHost.id,
                  players: {
                    ...currentRoom.players,
                    [newHost.id]: { ...currentRoom.players[newHost.id], isHost: true },
                    ...(currentRoom.players[roomData.hostId] ? {
                      [roomData.hostId]: { ...currentRoom.players[roomData.hostId], isHost: false }
                    } : {}),
                  },
                };
              });
              migrationCommitted = true;
              trackEvent("host_migrated", { oldHost: roomData.hostId, newHost: newHost.id, round: roomData.currentRound });
              logger.debug(`[MP] Host migration committed: ${newHost.id.substring(0, 8)} is now host`);
            } catch (err) {
              logger.error("[MP] Host migration failed:", err);
              // RC-2 FIX: Clear migration guard on transaction failure so retry is possible
              isMigratingHostRef.current = null;
            }

            // POST-MIGRATION RECOVERY: After becoming host, start a periodic
            // check that runs every 5s until roundEnd is resolved. This is needed
            // because the onValue listener may not fire again if no other Firebase
            // updates happen (e.g., timer expires but nothing writes to Firebase).
            if (migrationCommitted && roomData.status === "playing") {
              const migrationRoomId = roomData.id;
              const migrationRound = roomData.currentRound;
              logger.debug(`[MP] Post-migration recovery interval starting for room=${migrationRoomId} round=${migrationRound}`);

              const recoveryCheck = async () => {
                if (isProcessingRoundRef.current) return false; // busy, try again next tick
                try {
                  const freshSnap = await get(ref(database, `rooms/${migrationRoomId}`));
                  const freshRoom = freshSnap.val() as Room | null;
                  if (!freshRoom || freshRoom.status !== "playing" || freshRoom.currentRound !== migrationRound) {
                    logger.debug(`[MP] Post-migration recovery: room state changed, stopping`);
                    return true; // done, stop interval
                  }
                  if (freshRoom.hostId !== playerId) {
                    logger.debug(`[MP] Post-migration recovery: no longer host, stopping`);
                    return true; // done
                  }

                  // Check allGuessed (excluding disconnected/stale players)
                  const freshPlayers = Object.values(freshRoom.players || {});
                  const freshOnline = freshPlayers.filter((p) =>
                    p.status === 'online' || (!p.status && p.lastSeen && (Date.now() - p.lastSeen) < STALE_HEARTBEAT_THRESHOLD)
                  );
                  const allGuessedNow = freshOnline.length > 0 && freshOnline.every((p) => p.hasGuessed);

                  const elapsed = freshRoom.roundStartTime ? (Date.now() - freshRoom.roundStartTime) / 1000 : 0;
                  const tLimit = freshRoom.timeLimit || 90;
                  const timeExpired = elapsed > tLimit + ROUND_END_RECOVERY_BUFFER;

                  if (allGuessedNow || timeExpired) {
                    const trigger = allGuessedNow ? "postMigrationAllGuessed" : "postMigrationTimeExpired";
                    logger.debug(`[MP] Post-migration recovery: triggering roundEnd (${trigger}, elapsed=${elapsed.toFixed(1)}s, online=${freshOnline.length})`);
                    isProcessingRoundRef.current = true;
                    processingStartTimeRef.current = Date.now();
                    try {
                      await acquireAndWriteRoundEnd(migrationRoomId, migrationRound, null, freshRoom.currentLocation, playerId, trigger);
                    } finally {
                      isProcessingRoundRef.current = false;
                      processingStartTimeRef.current = null;
                    }
                    return true; // done
                  }
                  logger.debug(`[MP] Post-migration recovery: waiting (allGuessed=${allGuessedNow}, elapsed=${elapsed.toFixed(0)}s/${tLimit}s, online=${freshOnline.length})`);
                  return false; // keep checking
                } catch (err) {
                  logger.error("[MP] Post-migration recovery error:", err);
                  return false; // keep trying
                }
              };

              // Clear any existing post-migration timers before creating new ones
              if (postMigrationTimeoutRef.current) { clearTimeout(postMigrationTimeoutRef.current); postMigrationTimeoutRef.current = null; }
              if (postMigrationIntervalRef.current) { clearInterval(postMigrationIntervalRef.current); postMigrationIntervalRef.current = null; }
              if (postMigrationSafetyTimeoutRef.current) { clearTimeout(postMigrationSafetyTimeoutRef.current); postMigrationSafetyTimeoutRef.current = null; }

              // First check after 3s (wait for onDisconnect to propagate)
              postMigrationTimeoutRef.current = setTimeout(async () => {
                postMigrationTimeoutRef.current = null;
                const done = await recoveryCheck();
                if (done) return;
                // Continue checking every 5s until resolved
                postMigrationIntervalRef.current = setInterval(async () => {
                  const isDone = await recoveryCheck();
                  if (isDone) {
                    if (postMigrationIntervalRef.current) { clearInterval(postMigrationIntervalRef.current); postMigrationIntervalRef.current = null; }
                  }
                }, 5000);
                // Safety: clear after 3 minutes max (tracked in ref for cleanup)
                postMigrationSafetyTimeoutRef.current = setTimeout(() => {
                  postMigrationSafetyTimeoutRef.current = null;
                  if (postMigrationIntervalRef.current) { clearInterval(postMigrationIntervalRef.current); postMigrationIntervalRef.current = null; }
                }, 180000);
              }, 3000);
            }
          }
        }

        // --- HOST CHANGE NOTIFICATION ---
        if (previousHostIdRef.current && previousHostIdRef.current !== roomData.hostId) {
          const newHostName = currentPlayerNames[roomData.hostId] || "Yeni host";
          if (roomData.hostId === playerId) {
            addNotification("host_changed", "Artık sen hostsun!", playerName);
          } else {
            addNotification("host_changed", `${newHostName} yeni host oldu`, newHostName);
          }
        }

        // --- Update refs ---
        previousPlayersRef.current = currentPlayerIds;
        previousHostIdRef.current = roomData.hostId;
        const namesMap = new Map<string, string>();
        Object.values(roomData.players || {}).forEach(p => namesMap.set(p.id, p.name));
        previousPlayerNamesRef.current = namesMap;

        setRoom(roomData);

        // --- ROUND END ELECTOR (HOST-ONLY) ---
        // Two triggers, both host-only, both transaction-guarded:
        // (a) allGuessed: all online players have guessed
        // (b) timeExpired: roundStartTime + timeLimit + BUFFER exceeded

        if (playerId === roomData.hostId && roomData.status === "playing" && roomData.players) {
          const playerList = Object.values(roomData.players);
          const now = Date.now();
          const onlinePlayers = playerList.filter((p) => {
            // Explicitly disconnected
            if (p.status === 'disconnected') {
              // Grace period: recently disconnected player who hasn't guessed yet
              // may be refreshing — don't count them as "done" for allGuessed
              if (!p.hasGuessed && p.lastSeen && (now - p.lastSeen) <= DISCONNECT_GRACE_PERIOD) {
                return true; // keep in allGuessed check (prevents premature roundEnd)
              }
              return false;
            }
            // Stale heartbeat (no update for 30s) → treat as disconnected
            if (p.lastSeen && (now - p.lastSeen) > STALE_HEARTBEAT_THRESHOLD) return false;
            // Online or no status set yet
            return true;
          });

          // --- Trigger (a): allGuessed ---
          const allGuessed = onlinePlayers.length > 0 && onlinePlayers.every((p) => p.hasGuessed);

          if (allGuessed && roomData.currentLocation && !isProcessingRoundRef.current) {
            const currentRoundId = roomData.currentRound;
            trackEvent("all_guessed_detected", { round: currentRoundId, onlineCount: onlinePlayers.length });
            if (!startProcessing("allGuessed", currentRoundId)) return;

            const snapshotPlayerIds = Object.keys(roomData.players);
            const snapshotLocation = { ...roomData.currentLocation };

            // RC-3 FIX: Track timeout in ref for cleanup on effect teardown
            if (allGuessedTimeoutRef.current) clearTimeout(allGuessedTimeoutRef.current);
            allGuessedTimeoutRef.current = setTimeout(async () => {
              allGuessedTimeoutRef.current = null;
              try {
                if (processingRoundIdRef.current !== currentRoundId) return;

                await acquireAndWriteRoundEnd(roomData.id, currentRoundId, snapshotPlayerIds, snapshotLocation, playerId, "allGuessed");
              } catch (err) {
                logger.error("[MP] allGuessed roundEnd error:", err);
                trackError(err instanceof Error ? err : String(err), "autoRoundEnd");
              } finally {
                stopProcessing("allGuessed_complete");
                processingRoundIdRef.current = null;
              }
            }, 100);
          }

          // --- Trigger (b): timeExpired recovery ---
          if (roomData.roundStartTime && !isProcessingRoundRef.current) {
            const elapsed = (Date.now() - roomData.roundStartTime) / 1000;
            const timeLimit = roomData.timeLimit || 90;

            if (elapsed > timeLimit + ROUND_END_RECOVERY_BUFFER) {
              logger.debug(`[MP] RoundEnd recovery: elapsed=${elapsed.toFixed(1)}s > limit=${timeLimit}s`);
              const recoveryRoundId = roomData.currentRound;
              if (startProcessing("recovery", recoveryRoundId)) {
                // BUG-13 FIX: Track setTimeout in ref for cleanup on effect teardown
                if (timeExpiredRecoveryRef.current) clearTimeout(timeExpiredRecoveryRef.current);
                timeExpiredRecoveryRef.current = setTimeout(async () => {
                  timeExpiredRecoveryRef.current = null;
                  try {
                    await acquireAndWriteRoundEnd(roomData.id, recoveryRoundId, null, roomData.currentLocation, playerId, "recovery");
                  } catch (err) {
                    logger.error("[MP] RoundEnd recovery error:", err);
                  } finally {
                    stopProcessing("recovery_complete");
                  }
                }, 200);
              }
            }
          }
        }

        // --- STUCK CLIENT RECOVERY ---
        // If this client has guessed and room is still "playing" for too long,
        // force a fresh re-read from Firebase to see if status actually changed.
        // This catches cases where the onValue snapshot was delayed/missed.
        if (
          roomData.status === "playing" &&
          roomData.players?.[playerId]?.hasGuessed &&
          roomData.roundStartTime
        ) {
          const elapsed = (Date.now() - roomData.roundStartTime) / 1000;
          const timeLimit = roomData.timeLimit || 90;

          // If we've been "playing" for longer than timeLimit + 10s after guessing,
          // something may be stuck. Force a fresh read.
          if (elapsed > timeLimit + 5) {
            if (!stuckRecoveryTimerRef.current) {
              logger.debug(`[MP] Stuck recovery: client guessed but still playing after ${elapsed.toFixed(0)}s — scheduling fresh read`);
              stuckRecoveryTimerRef.current = setTimeout(async () => {
                stuckRecoveryTimerRef.current = null;
                try {
                  const freshSnap = await get(roomRef);
                  const freshData = freshSnap.val() as Room | null;
                  if (freshData && freshData.status !== "playing") {
                    logger.debug(`[MP] Stuck recovery: Firebase shows status=${freshData.status}, forcing local update`);
                    setRoom(freshData);
                  } else if (freshData) {
                    logger.debug(`[MP] Stuck recovery: Firebase still shows playing (round=${freshData.currentRound})`);
                    // If we're host and room is truly stuck, try to trigger roundEnd
                    if (playerId === freshData.hostId) {
                      const stuckRoundId = freshData.currentRound;
                      if (startProcessing("stuckRecovery", stuckRoundId)) {
                        try {
                          await acquireAndWriteRoundEnd(
                            freshData.id,
                            stuckRoundId,
                            null,
                            freshData.currentLocation,
                            playerId,
                            "stuckRecovery"
                          );
                        } finally {
                          stopProcessing("stuckRecovery_complete");
                        }
                      }
                    }
                  }
                } catch (err) {
                  logger.warn("[MP] Stuck recovery read failed:", err);
                }
              }, 3000); // 3s delay to avoid hammering
            }
          }
        } else {
          // Clear stuck recovery timer if conditions no longer apply
          if (stuckRecoveryTimerRef.current) {
            clearTimeout(stuckRecoveryTimerRef.current);
            stuckRecoveryTimerRef.current = null;
          }
        }

      } else {
        setRoom(null);
        // BUG-A FIX: Don't show error toast if player intentionally left (deleted room)
        if (!isLeavingRef.current) {
          setError("Oda silindi veya bulunamadı");
        }
      }
    });

    return () => {
      unsubscribe();
      trackListener("unsubscribe");
      // RC-3 FIX: Clean up allGuessed timeout on effect teardown
      if (allGuessedTimeoutRef.current) {
        clearTimeout(allGuessedTimeoutRef.current);
        allGuessedTimeoutRef.current = null;
      }
      if (stuckRecoveryTimerRef.current) {
        clearTimeout(stuckRecoveryTimerRef.current);
        stuckRecoveryTimerRef.current = null;
      }
      // BUG-13 FIX: Clean up time-expired recovery timeout
      if (timeExpiredRecoveryRef.current) {
        clearTimeout(timeExpiredRecoveryRef.current);
        timeExpiredRecoveryRef.current = null;
      }
      if (postMigrationTimeoutRef.current) {
        clearTimeout(postMigrationTimeoutRef.current);
        postMigrationTimeoutRef.current = null;
      }
      if (postMigrationIntervalRef.current) {
        clearInterval(postMigrationIntervalRef.current);
        postMigrationIntervalRef.current = null;
      }
      if (postMigrationSafetyTimeoutRef.current) {
        clearTimeout(postMigrationSafetyTimeoutRef.current);
        postMigrationSafetyTimeoutRef.current = null;
      }
    };
  }, [room?.id, playerId, playerName, addNotification]);

  // BUG-1 FIX: hardResync — reset local locks/guards so UI can rebuild from fresh room state.
  // Idempotent: safe to call multiple times. Does NOT touch Firebase — only local state.
  const hardResync = useCallback(() => {
    forceResetProcessing("hardResync");
    isSubmittingGuessRef.current = false;
    // RC-6 FIX: Reset handleTimeUp guard so fresh room state can re-trigger
    hasHandledTimeUpRef.current = null;
    if (stuckRecoveryTimerRef.current) {
      clearTimeout(stuckRecoveryTimerRef.current);
      stuckRecoveryTimerRef.current = null;
    }
    // RC-3 FIX: Clean up allGuessed timeout
    if (allGuessedTimeoutRef.current) {
      clearTimeout(allGuessedTimeoutRef.current);
      allGuessedTimeoutRef.current = null;
    }
    // Note: clientGuessTimestamp reset is handled by useClientResync effect remount
    logger.debug("[MP] hardResync: all local locks/guards reset via forceResetProcessing");
  }, []);

  // ==================== EFFECT 7: CLIENT RESYNC WATCHDOG (extracted to useClientResync) ====================
  useClientResync({
    roomId: room?.id || null,
    playerId,
    hostId: room?.hostId || null,
    roomStatus: room?.status || null,
    currentRound: room?.currentRound ?? null,
    hasGuessed: room?.players?.[playerId]?.hasGuessed || false,
    hardResync,
    setRoom,
  });

  // ==================== EFFECT 6: HOST-ONLY WATCHDOG (extracted to useHostWatchdog) ====================
  useHostWatchdog({
    roomId: room?.id || null,
    hostId: room?.hostId || null,
    playerId,
    roomStatus: room?.status || null,
    roundStartTime: room?.roundStartTime || null,
    timeLimit: room?.timeLimit || null,
    currentRound: room?.currentRound ?? null,
    processingGuard,
    acquireAndWriteRoundEnd,
  });

  // ==================== ROUND END LOCK + WRITE ====================
  // Acquires roundEndLock via transaction, then writes roundEnd atomically.
  // Idempotent: if lock already acquired for this round, or status != playing, aborts.
  // forceOverrideStaleLock: when true, skips the lock-exists abort (used by watchdog for stale lock override).

  async function acquireAndWriteRoundEnd(
    roomId: string,
    roundId: number,
    snapshotPlayerIds: string[] | null, // null = use all current players (recovery mode)
    snapshotLocation: Coordinates | null,
    ownerId: string,
    trigger: string,
    timingContext: RoundEndTimingContext = {},
    forceOverrideStaleLock: boolean = false
  ) {
    mpCounters.roundEndLockAcquireAttempts++;
    logger.debug(`[MP] acquireAndWriteRoundEnd: ENTER trigger=${trigger} roundId=${roundId} owner=${ownerId.substring(0, 8)} attempt=#${mpCounters.roundEndLockAcquireAttempts}`);

    const roomRef = ref(database, `rooms/${roomId}`);
    const freshSnap = await get(roomRef);
    const freshRoom = freshSnap.val() as Room | null;

    if (!freshRoom || freshRoom.status !== "playing" || freshRoom.currentRound !== roundId) {
      logger.debug(`[MP] roundEnd abort: stale state (status=${freshRoom?.status}, round=${freshRoom?.currentRound}, expected=${roundId}) trigger=${trigger}`);
      return;
    }

    // Check lock — if already locked for this round, abort (unless forcing stale override)
    const existingLock = (freshRoom as any).roundEndLock as RoundEndLock | undefined;
    if (existingLock && existingLock.roundId === roundId && !forceOverrideStaleLock) {
      logger.debug(`[MP] roundEnd abort: lock already held by ${existingLock.lockedBy.substring(0, 8)} for round ${roundId} trigger=${trigger}`);
      return;
    }
    if (existingLock && existingLock.roundId === roundId && forceOverrideStaleLock) {
      logger.debug(`[MP] roundEnd: OVERRIDING stale lock held by ${existingLock.lockedBy.substring(0, 8)} (age=${Date.now() - existingLock.lockedAt}ms) trigger=${trigger}`);
    }

    // Acquire lock + write roundEnd in single transaction
    const playerIdsToProcess = snapshotPlayerIds || Object.keys(freshRoom.players || {});
    const location = snapshotLocation || freshRoom.currentLocation;

    const playersToProcess = playerIdsToProcess
      .map(id => freshRoom.players?.[id])
      .filter((p): p is Player => p !== undefined && p !== null);

    // Score calculation via pure function (tested in roomLogic.test.ts)
    const results = location
      ? computeRoundResults(playersToProcess, location)
      : playersToProcess.filter(p => p.id && p.name).map(p => ({
          playerId: p.id,
          playerName: p.name || "Oyuncu",
          guess: p.currentGuess || { lat: 0, lng: 0 },
          distance: 9999,
          score: 0,
        }));

    // Build updated players via pure function (tested in roomLogic.test.ts)
    const updatedPlayers = updatePlayersAfterRound(freshRoom.players || {}, results);

    // Atomic: acquire lock + transition to roundEnd
    let transactionCommitted = false;
    await runTransaction(roomRef, (currentRoom) => {
      transactionCommitted = false; // Reset on each retry — Firebase may invoke callback multiple times
      if (!currentRoom) return currentRoom;
      if (currentRoom.status !== "playing") {
        logger.debug(`[MP] roundEnd TX abort: status=${currentRoom.status} (expected playing) trigger=${trigger}`);
        return; // abort
      }
      if (currentRoom.currentRound !== roundId) {
        logger.debug(`[MP] roundEnd TX abort: round=${currentRoom.currentRound} (expected ${roundId}) trigger=${trigger}`);
        return; // abort
      }

      // Check lock inside transaction (skip if forcing stale override)
      const lock = currentRoom.roundEndLock as RoundEndLock | undefined;
      if (lock && lock.roundId === roundId && !forceOverrideStaleLock) {
        logger.debug(`[MP] roundEnd TX abort: lock already held trigger=${trigger}`);
        return; // abort — already locked
      }

      mpCounters.roundEndLockAcquired++;
      mpCounters.roundEndWrites++;
      transactionCommitted = true;

      return {
        ...currentRoom,
        status: "roundEnd",
        roundState: 'ended',
        roundResults: results,
        players: updatedPlayers,
        roundEndLock: {
          lockedBy: ownerId,
          roundId: roundId,
          lockedAt: Date.now(),
        },
      };
    });

    if (transactionCommitted) {
      // Compute roundEnd latency — different metric depending on trigger type
      const now = timingContext.serverNow || Date.now();
      const expectedEnd = freshRoom.roundStartTime
        ? freshRoom.roundStartTime + (freshRoom.timeLimit || 90) * 1000
        : now;
      const timeDelta = now - expectedEnd;
      const timeSource = timingContext.serverNow ? "server" : "client";
      const isTimerTrigger = trigger === "timeUp" || trigger === "watchdog" || trigger === "recovery"
        || trigger === "stuckRecovery" || trigger === "postMigrationTimeExpired";

      if (isTimerTrigger) {
        // Timer-expiry triggers: latency = time AFTER timer expired (should be small positive)
        mpCounters.roundEndLatencyMs = timeDelta;
        mpCounters.maxRoundEndLatencyMs = Math.max(mpCounters.maxRoundEndLatencyMs, timeDelta);
        mpCounters.roundEndLatencies.push(timeDelta);
        logger.debug(`[MP] RoundEndLatency: ${timeDelta}ms (source=${timeSource}, trigger=${trigger})`);
        if (timeDelta > 3000) {
          logger.warn(`[MP] RoundEndLatency SLO breach: ${timeDelta}ms`);
        }
      } else {
        // allGuessed / postMigrationAllGuessed: earlyFinish = time BEFORE timer would expire (positive = early)
        const earlyFinishByMs = -timeDelta; // flip sign: negative delta → positive early finish
        mpCounters.earlyFinishLatencies.push(earlyFinishByMs);
        logger.debug(`[MP] EarlyFinish: ${earlyFinishByMs}ms before timer expiry (source=${timeSource}, trigger=${trigger})`);
      }

      trackEvent("roundEnd", { roundId, trigger, guessCount: results.filter(r => r.distance < 9999).length, gracePeriod: GUESS_GRACE_PERIOD_MS });
      logger.debug(`[MP] RoundEnd COMMITTED: round=${roundId} trigger=${trigger} by=${ownerId.substring(0, 8)}`);
      logger.debug({
        "Round": roundId,
        "Trigger": trigger,
        "Lock Attempts": mpCounters.roundEndLockAcquireAttempts,
        "Lock Acquired": mpCounters.roundEndLockAcquired,
        "RoundEnd Writes": mpCounters.roundEndWrites,
        "Ghosts Removed": mpCounters.ghostRemovedCount,
        "Players": Object.keys(freshRoom.players || {}).length,
        "TimeDelta (ms)": timeDelta,
        "Metric": isTimerTrigger ? `latency=${timeDelta}ms` : `earlyFinish=${-timeDelta}ms`,
      });
      roomStateDigest({ ...freshRoom, status: "roundEnd" } as Room, `roundEnd:${trigger}`, ownerId);
    } else {
      logger.debug(`[MP] RoundEnd NOT committed: round=${roundId} trigger=${trigger} — transaction aborted`);
    }
  }

  // ==================== ACTIONS ====================

  // --- Create Room ---
  const createRoom = useCallback(async (name: string, gameMode: GameMode = "urban") => {
    setIsLoading(true);
    setError(null);

    if (!canCreateRoom()) {
      const cooldown = Math.ceil(getRoomCreateCooldown() / 1000);
      setError(`${ERROR_MESSAGES.RATE_LIMIT_EXCEEDED} (${cooldown}s)`);
      setIsLoading(false);
      return null;
    }

    if (!isValidPlayerName(name)) {
      setError("Geçersiz oyuncu adı (1-20 karakter)");
      setIsLoading(false);
      return null;
    }

    try {
      const roomCode = generateRoomCode();
      const authUid = await getAuthUid();
      const sessionToken = generateSessionToken();
      const modeConfig = GAME_MODE_CONFIG[gameMode];
      const now = Date.now();

      const newPlayer: Player = {
        id: authUid,
        name: name.trim(),
        isHost: true,
        totalScore: 0,
        currentGuess: null,
        hasGuessed: false,
        movesUsed: 0,
        roundScores: [],
        status: 'online' as PlayerStatus,
        lastSeen: now,
        disconnectedAt: null,
        sessionToken: sessionToken,
        joinedAt: now,
      };

      const newRoom: Room = {
        id: roomCode,
        hostId: authUid,
        status: "waiting",
        currentRound: 0,
        totalRounds: 5,
        players: { [authUid]: newPlayer },
        gameMode: gameMode,
        timeLimit: modeConfig.timeLimit,
        moveLimit: modeConfig.moveLimit,
        currentPanoPackageId: null,
        currentPanoPackage: null,
        currentLocation: null,
        currentLocationName: null,
        roundResults: null,
        roundStartTime: null,
        roundState: 'waiting',
        roundVersion: 0,
        activePlayerCount: 0,
        expectedGuesses: 0,
        currentGuesses: 0,
      };

      const roomWithTimestamps = {
        ...newRoom,
        createdAt: now,
        lastActivityAt: now,
      };

      await set(ref(database, `rooms/${roomCode}`), roomWithTimestamps);

      setPlayerId(authUid);
      setPlayerName(name.trim());
      setRoom(newRoom);

      saveSessionToken(roomCode, sessionToken);

      setTelemetryContext({
        roomId: roomCode,
        playerId: authUid,
        playerName: name.trim(),
      });
      trackEvent("join", { action: "create", gameMode });

      previousPlayersRef.current = [authUid];
      previousHostIdRef.current = authUid;
      isFirstLoadRef.current = true;
      notifiedJoinedRef.current.clear();
      notifiedLeftRef.current.clear();

      setupRoomCleanup(newRoom);
      trackRoomCreated({
        roomId: roomCode,
        gameMode,
      });

      return roomCode;
    } catch (err) {
      logger.error("Oda oluşturma hatası:", err);
      trackError(err instanceof Error ? err : String(err), "createRoom");
      setError("Oda oluşturulamadı. Lütfen tekrar deneyin.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Join Room ---
  // BUG-005 FIX: Return type enriched with roomStatus + playerState for derived state restoration
  const joinRoom = useCallback(async (roomCode: string, name: string): Promise<{ success: boolean; roomStatus?: string; playerState?: { hasGuessed: boolean; currentGuess: Coordinates | null } }> => {
    setIsLoading(true);
    setError(null);

    if (!canJoinRoom()) {
      setError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
      setIsLoading(false);
      return { success: false };
    }

    if (!isValidPlayerName(name)) {
      setError("Geçersiz oyuncu adı (1-20 karakter)");
      setIsLoading(false);
      return { success: false };
    }

    try {
      const normalizedRoomCode = roomCode.toUpperCase();
      const roomRef = ref(database, `rooms/${normalizedRoomCode}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        setError(ERROR_MESSAGES.ROOM_NOT_FOUND);
        return { success: false };
      }

      const roomData = snapshot.val() as Room;

      // --- REJOIN CHECK ---
      const existingSessionToken = getSessionToken(normalizedRoomCode);

      if (existingSessionToken && roomData.players) {
        const matchingPlayer = Object.values(roomData.players).find(
          (p) => p.sessionToken === existingSessionToken
        );

        if (matchingPlayer) {
          logger.debug(`[MP] Rejoin: ${matchingPlayer.name} reconnected`);

          const now = Date.now();
          await update(ref(database, `rooms/${normalizedRoomCode}/players/${matchingPlayer.id}`), {
            status: 'online' as PlayerStatus,
            lastSeen: now,
            disconnectedAt: null,
            name: name.trim(),
          });

          // BUG-005 FIX: Fresh read after update to avoid stale state
          const freshSnap = await get(roomRef);
          const freshRoomData = freshSnap.val() as Room | null;
          const finalRoom = freshRoomData || roomData;

          setPlayerId(matchingPlayer.id);
          setPlayerName(name.trim());
          setRoom({ ...finalRoom, id: normalizedRoomCode });

          setTelemetryContext({
            roomId: normalizedRoomCode,
            playerId: matchingPlayer.id,
            playerName: name.trim(),
          });

          // BUG-005 FIX: Derive player state for caller to restore local UI
          const playerInRoom = finalRoom.players?.[matchingPlayer.id];
          trackEvent("rejoin", {
            roomStatus: finalRoom.status,
            hasGuessed: playerInRoom?.hasGuessed,
            round: finalRoom.currentRound,
          });

          previousPlayersRef.current = Object.keys(finalRoom.players || {});
          previousHostIdRef.current = finalRoom.hostId;
          isFirstLoadRef.current = true;
          notifiedJoinedRef.current.clear();
          notifiedLeftRef.current.clear();

          recordPlayerActivity(normalizedRoomCode, matchingPlayer.id);

          setIsLoading(false);
          return {
            success: true,
            roomStatus: finalRoom.status,
            playerState: {
              hasGuessed: playerInRoom?.hasGuessed || false,
              currentGuess: playerInRoom?.currentGuess || null,
            },
          };
        }
      }

      // --- NEW PLAYER JOIN ---
      if (roomData.status !== "waiting") {
        setError(ERROR_MESSAGES.GAME_ALREADY_STARTED);
        return { success: false };
      }

      const playerCount = Object.keys(roomData.players || {}).length;
      if (playerCount >= 8) {
        setError(ERROR_MESSAGES.ROOM_FULL);
        return { success: false };
      }

      const authUid = await getAuthUid();
      const sessionToken = generateSessionToken();
      const now = Date.now();

      const newPlayer: Player = {
        id: authUid,
        name: name.trim(),
        isHost: false,
        totalScore: 0,
        currentGuess: null,
        hasGuessed: false,
        movesUsed: 0,
        roundScores: [],
        status: 'online' as PlayerStatus,
        lastSeen: now,
        disconnectedAt: null,
        sessionToken: sessionToken,
        joinedAt: now,
      };

      // Write to player-level path so $playerId .write rule applies
      // (room-level .write rule requires host or existing player)
      await set(ref(database, `rooms/${normalizedRoomCode}/players/${authUid}`), newPlayer);

      // lastActivityAt update: use player-level lastActiveAt instead
      // (room-level write requires host or existing player — we are now a player after the set above)
      await update(ref(database, `rooms/${normalizedRoomCode}`), {
        lastActivityAt: now,
      });

      saveSessionToken(normalizedRoomCode, sessionToken);

      setPlayerId(authUid);
      setPlayerName(name.trim());
      setRoom({ ...roomData, id: normalizedRoomCode });

      setTelemetryContext({
        roomId: normalizedRoomCode,
        playerId: authUid,
        playerName: name.trim(),
      });
      trackEvent("join", { action: "join" });

      previousPlayersRef.current = [...Object.keys(roomData.players || {}), authUid];
      previousHostIdRef.current = roomData.hostId;
      isFirstLoadRef.current = true;
      notifiedJoinedRef.current.clear();
      notifiedLeftRef.current.clear();

      recordPlayerActivity(normalizedRoomCode, authUid);
      trackRoomJoined({
        roomId: normalizedRoomCode,
        playerCount: playerCount + 1,
      });

      return { success: true, roomStatus: "waiting" };
    } catch (err) {
      logger.error("Odaya katılma hatası:", err);
      trackError(err instanceof Error ? err : String(err), "joinRoom");
      setError("Odaya katılınamadı. Lütfen tekrar deneyin.");
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Set Game Mode ---
  const setGameMode = useCallback(
    async (mode: GameMode) => {
      if (!room || playerId !== room.hostId || room.status !== "waiting") return;

      const modeConfig = GAME_MODE_CONFIG[mode];
      await update(ref(database, `rooms/${room.id}`), {
        gameMode: mode,
        timeLimit: modeConfig.timeLimit,
        moveLimit: modeConfig.moveLimit,
      });
    },
    [room, playerId]
  );

  // --- Start Game with PanoPackage (Transaction-Guarded) ---
  // Uses runTransaction to guarantee exactly-once semantics:
  //   - Aborts if status is not 'waiting' (prevents double-start)
  //   - Reads fresh player list from transaction data (no stale closure)
  //   - Uses server time offset for roundStartTime
  const startGameWithPanoPackage = useCallback(
    async (panoPackage: PanoPackage) => {
      if (!room || playerId !== room.hostId) return;

      const roomId = room.id;
      const roomRef = ref(database, `rooms/${roomId}`);
      const serverNow = getServerNowMs();

      let committed = false;
      await runTransaction(roomRef, (currentRoom) => {
        committed = false; // Reset on each retry — Firebase may invoke callback multiple times
        if (!currentRoom) return currentRoom;

        // Guard: Only transition from 'waiting' to 'playing'
        if (currentRoom.status !== "waiting") {
          logger.debug(`[MP] startGame TX abort: status=${currentRoom.status} (expected waiting)`);
          return; // abort
        }

        // Guard: Caller must be host
        if (currentRoom.hostId !== playerId) {
          logger.debug(`[MP] startGame TX abort: not host`);
          return; // abort
        }

        // Read fresh players from transaction data
        const freshPlayers = currentRoom.players || {};
        const onlineCount = (Object.values(freshPlayers) as Player[]).filter(
          (p) => !p.status || p.status === 'online'
        ).length;

        // Reset all players for new round
        const updatedPlayers: { [key: string]: Player } = {};
        (Object.values(freshPlayers) as Player[]).forEach((player) => {
          updatedPlayers[player.id] = {
            ...player,
            currentGuess: null,
            hasGuessed: false,
            movesUsed: 0,
          };
        });

        committed = true;
        return {
          ...currentRoom,
          status: "playing",
          currentRound: 1,
          currentPanoPackageId: panoPackage.id,
          currentPanoPackage: panoPackage,
          currentLocation: { lat: panoPackage.pano0.lat, lng: panoPackage.pano0.lng },
          currentLocationName: panoPackage.locationName,
          players: updatedPlayers,
          roundResults: null,
          roundStartTime: serverNow,
          roundState: 'active',
          roundVersion: (currentRoom.roundVersion || 0) + 1,
          activePlayerCount: onlineCount,
          expectedGuesses: onlineCount,
          currentGuesses: 0,
          roundEndLock: null,
        };
      });

      if (committed) {
        trackEvent("roundStart", { roundId: 1, panoPackageId: panoPackage.id });
        logger.debug(`[MP] startGame COMMITTED: pano=${panoPackage.id}`);
      } else {
        logger.warn(`[MP] startGame NOT committed — transaction aborted`);
      }

      return committed;
    },
    [room, playerId]
  );

  // --- Start Game (legacy, transaction-guarded) ---
  const startGame = useCallback(
    async (location: Coordinates, panoId: string, locationName?: string) => {
      if (!room || playerId !== room.hostId) return;

      const roomId = room.id;
      const roomRef = ref(database, `rooms/${roomId}`);
      const serverNow = getServerNowMs();

      let committed = false;
      await runTransaction(roomRef, (currentRoom) => {
        committed = false; // Reset on each retry — Firebase may invoke callback multiple times
        if (!currentRoom) return currentRoom;

        if (currentRoom.status !== "waiting") {
          logger.debug(`[MP] startGame(legacy) TX abort: status=${currentRoom.status}`);
          return; // abort
        }
        if (currentRoom.hostId !== playerId) return; // abort

        const freshPlayers = currentRoom.players || {};
        const onlineCount = (Object.values(freshPlayers) as Player[]).filter(
          (p) => !p.status || p.status === 'online'
        ).length;

        const updatedPlayers: { [key: string]: Player } = {};
        (Object.values(freshPlayers) as Player[]).forEach((player) => {
          updatedPlayers[player.id] = {
            ...player,
            currentGuess: null,
            hasGuessed: false,
            movesUsed: 0,
          };
        });

        committed = true;
        return {
          ...currentRoom,
          status: "playing",
          currentRound: 1,
          currentLocation: location,
          currentPanoPackageId: panoId,
          currentLocationName: locationName || null,
          players: updatedPlayers,
          roundResults: null,
          roundStartTime: serverNow,
          roundState: 'active',
          roundVersion: (currentRoom.roundVersion || 0) + 1,
          activePlayerCount: onlineCount,
          expectedGuesses: onlineCount,
          currentGuesses: 0,
          roundEndLock: null,
        };
      });

      if (committed) {
        logger.debug(`[MP] startGame(legacy) COMMITTED`);
      }
    },
    [room, playerId]
  );

  // --- Submit Guess (Two-Phase Atomic) ---
  // BUG-002 FIX: Server-time enforced, transaction-guarded submission.
  //
  // Architecture: RTDB security rules have host-only validation on room-level fields,
  // so non-host players cannot do a room-level transaction. Instead:
  //   Phase 0: Pre-read room state + server time validation (TOCTOU accepted,
  //            mitigated by roundEndLock elector and player-level transaction guard)
  //   Phase 1: runTransaction on player node — atomic write with hasGuessed idempotency
  //   Phase 2: runTransaction on currentGuesses — atomic increment
  //
  // The tiny race window between phases only affects "all guessed" early-detection
  // timing. Actual round-end scoring uses fresh reads via acquireAndWriteRoundEnd.
  const submitGuess = useCallback(
    async (guess: Coordinates): Promise<{ accepted: boolean; reason?: string }> => {
      if (!room || !playerId) return { accepted: false, reason: "no_room" };

      // SYNCHRONOUS double-submit guard (not React state — immune to stale closures)
      if (isSubmittingGuessRef.current) {
        logger.debug("[MP] submitGuess: submission in-flight, skipping");
        return { accepted: false, reason: "in_flight" };
      }

      const currentPlayer = room.players?.[playerId];
      if (currentPlayer?.hasGuessed) {
        logger.debug("[MP] submitGuess: already guessed (local), skipping");
        return { accepted: false, reason: "already_guessed" };
      }

      if (!canSubmitGuess(playerId, room.currentRound)) {
        setError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
        return { accepted: false, reason: "rate_limited" };
      }

      if (!isValidTurkeyCoordinate(guess.lat, guess.lng)) {
        setError(ERROR_MESSAGES.INVALID_COORDINATES);
        return { accepted: false, reason: "invalid_coords" };
      }

      // Capture round context BEFORE lock (avoid stale closure)
      const roomId = room.id;
      const expectedRound = room.currentRound;
      const timeLimit = room.timeLimit || 90;

      isSubmittingGuessRef.current = true;

      try {
        // === Phase 0: Pre-read room state + server time validation ===
        const serverNowMs = getServerNowMs();
        const roomSnap = await get(ref(database, `rooms/${roomId}`));
        const roomData = roomSnap.val() as Room | null;

        if (!roomData || roomData.status !== "playing") {
          logger.warn(`[MP] submitGuess REJECTED: not_playing (status=${roomData?.status})`);
          setError("Bu tur sona erdi.");
          return { accepted: false, reason: "not_playing" };
        }
        if (roomData.currentRound !== expectedRound) {
          logger.warn(`[MP] submitGuess REJECTED: round_mismatch (db=${roomData.currentRound} expected=${expectedRound})`);
          setError("Bu tur sona erdi.");
          return { accepted: false, reason: "round_mismatch" };
        }
        if (roomData.roundState !== 'active' && roomData.roundState !== 'ended') {
          logger.warn(`[MP] submitGuess REJECTED: round_not_active (state=${roomData.roundState})`);
          setError("Bu tur sona erdi.");
          return { accepted: false, reason: "round_not_active" };
        }

        // Server time check: reject if time expired (GUESS_GRACE_PERIOD_MS grace — harmonized with handleTimeUp)
        const roundEndMs = (roomData.roundStartTime || 0) + timeLimit * 1000;
        if (serverNowMs > roundEndMs + GUESS_GRACE_PERIOD_MS) {
          logger.warn(`[MP] submitGuess REJECTED: time_expired (serverNow=${serverNowMs} roundEnd=${roundEndMs})`);
          setError("Süre doldu! Tahmin kabul edilmedi.");
          return { accepted: false, reason: "time_expired" };
        }

        recordPlayerActivity(roomId, playerId);

        // === Phase 1: Targeted field update ===
        // BUG-FIX: Use update() instead of runTransaction() to avoid triggering
        // validate rules on unchanged fields (e.g. totalScore rule blocks non-host
        // players when totalScore > 0 after round 1).
        // update() only validates the fields being written.
        const playerRef = ref(database, `rooms/${roomId}/players/${playerId}`);

        // Pre-read for idempotency guard
        const playerSnap = await get(playerRef);
        const playerData = playerSnap.val();

        if (!playerData) {
          logger.warn(`[MP] submitGuess: player node missing in DB`);
          return { accepted: false, reason: "no_room" };
        }

        if (playerData.hasGuessed) {
          logger.debug(`[MP] submitGuess: already guessed in DB (idempotent)`);
          return { accepted: true, reason: "already_guessed_db" };
        }

        await update(playerRef, {
          currentGuess: guess,
          hasGuessed: true,
          lastActiveAt: Date.now(),
        });

        // === Phase 2: Atomic counter increment (fire-and-forget for lower latency) ===
        // LATENCY FIX: Don't await — the counter is only used for host's allGuessed
        // heuristic. The authoritative allGuessed check uses player.hasGuessed fields.
        const counterRef = ref(database, `rooms/${roomId}/currentGuesses`);
        runTransaction(counterRef, (current) => {
          return (current || 0) + 1;
        }).catch((err) => {
          logger.warn("[MP] submitGuess counter increment failed (non-critical):", err);
        });

        trackEvent("submitGuess", { roundId: expectedRound, lat: guess.lat, lng: guess.lng });
        logger.debug(`[MP] submitGuess ACCEPTED: round=${expectedRound} serverNow=${serverNowMs}`);
        return { accepted: true, reason: "accepted" };
      } catch (err) {
        logger.error("[MP] submitGuess error:", err);
        trackError(err instanceof Error ? err : String(err), "submitGuess");
        setError("Tahmin gönderilemedi. Lütfen tekrar deneyin.");
        return { accepted: false, reason: "error" };
      } finally {
        isSubmittingGuessRef.current = false;
      }
    },
    [room, playerId]
  );

  // --- Check All Guessed (explicit call) ---
  // BUG-14 FIX: Added try/catch + processing guard to prevent overlap with auto-detection
  const checkAllGuessed = useCallback(async () => {
    if (!room || playerId !== room.hostId) return;
    if (isProcessingRoundRef.current) return;

    try {
      const latestSnap = await get(ref(database, `rooms/${room.id}`));
      const latestRoom = latestSnap.val() as Room | null;

      if (!latestRoom?.players || latestRoom.status !== "playing") return;

      const playerList = Object.values(latestRoom.players);
      const onlinePlayers = playerList.filter((p) => !p.status || p.status === 'online');
      const allGuessed = onlinePlayers.length > 0 && onlinePlayers.every((p) => p.hasGuessed);

      if (allGuessed && latestRoom.currentLocation) {
        if (!startProcessing("checkAllGuessed", latestRoom.currentRound)) return;
        try {
          await acquireAndWriteRoundEnd(
            latestRoom.id,
            latestRoom.currentRound,
            Object.keys(latestRoom.players),
            latestRoom.currentLocation,
            playerId,
            "checkAllGuessed"
          );
        } finally {
          stopProcessing("checkAllGuessed_complete");
        }
      }
    } catch (err) {
      logger.error("[MP] checkAllGuessed error:", err);
      trackError(err instanceof Error ? err : String(err), "checkAllGuessed");
    }
  }, [room, playerId]);

  // --- Handle Time Up (Server-Time Enforced) ---
  // BUG-002 FIX: Validates elapsed time via server offset before allowing roundEnd.
  // Prevents premature roundEnd from client clock skew.
  const hasHandledTimeUpRef = useRef<number | null>(null);

  const handleTimeUp = useCallback(async () => {
    if (!room || playerId !== room.hostId) return;

    if (hasHandledTimeUpRef.current === room.currentRound) {
      trackDuplicateAttempt("timeUp", room.currentRound);
      return;
    }

    if (isProcessingRoundRef.current) {
      trackDuplicateAttempt("timeUp", room.currentRound);
      return;
    }

    // Server time enforcement: verify time actually expired
    const serverNow = getServerNowMs();
    const roundStartTime = room.roundStartTime || 0;
    const timeLimit = room.timeLimit || 90;
    const elapsedMs = serverNow - roundStartTime;
    const timeLimitMs = timeLimit * 1000;

    // BUG-004 FIX: Wait until GUESS_GRACE_PERIOD_MS AFTER nominal timer end (harmonized with submitGuess)
    if (elapsedMs < timeLimitMs + GUESS_GRACE_PERIOD_MS) {
      logger.warn(`[MP] handleTimeUp: server time says ${(elapsedMs / 1000).toFixed(1)}s elapsed, limit=${timeLimit}s — grace period (${GUESS_GRACE_PERIOD_MS}ms), skipping`);
      return;
    }

    mpCounters.roundEndLockAcquireAttempts++;
    const timeUpRoundId = room.currentRound;
    logger.debug(`[MP] handleTimeUp: round=${timeUpRoundId} elapsed=${(elapsedMs / 1000).toFixed(1)}s serverNow=${serverNow}`);

    if (!startProcessing("timeUp", timeUpRoundId)) {
      trackDuplicateAttempt("timeUp", timeUpRoundId);
      return;
    }
    hasHandledTimeUpRef.current = timeUpRoundId;

    try {
      await acquireAndWriteRoundEnd(
        room.id,
        timeUpRoundId,
        null, // use all current players
        room.currentLocation,
        playerId,
        "timeUp",
        { serverNow }
      );
    } catch (err) {
      logger.error("[MP] handleTimeUp error:", err);
      trackError(err instanceof Error ? err : String(err), "handleTimeUp");
    } finally {
      stopProcessing("timeUp_complete");
    }
  }, [room, playerId]);

  // --- Next Round with PanoPackage (Transaction-Guarded) ---
  // Uses runTransaction for exactly-once semantics:
  //   - Guards: status must be 'roundEnd', caller must be host, roundVersion must match
  //   - Reads fresh player list from transaction data (no stale closure)
  //   - Uses server time offset for roundStartTime
  const nextRoundWithPanoPackage = useCallback(
    async (panoPackage: PanoPackage) => {
      if (!room || playerId !== room.hostId) return;

      const roomId = room.id;
      const roomRef = ref(database, `rooms/${roomId}`);
      const expectedRoundVersion = room.roundVersion || 0;
      const serverNow = getServerNowMs();

      let committed = false;
      let isGameOver = false;

      await runTransaction(roomRef, (currentRoom) => {
        committed = false; // Reset on each retry — Firebase may invoke callback multiple times
        isGameOver = false;
        if (!currentRoom) return currentRoom;

        // Guard: caller must be host
        if (currentRoom.hostId !== playerId) {
          logger.debug(`[MP] nextRound TX abort: not host`);
          return; // abort
        }

        // Guard: status must be roundEnd
        if (currentRoom.status !== "roundEnd") {
          logger.debug(`[MP] nextRound TX abort: status=${currentRoom.status} (expected roundEnd)`);
          return; // abort
        }

        // Guard: roundVersion must match (prevents double-advance)
        if ((currentRoom.roundVersion || 0) !== expectedRoundVersion) {
          logger.debug(`[MP] nextRound TX abort: roundVersion=${currentRoom.roundVersion} (expected ${expectedRoundVersion})`);
          return; // abort
        }

        committed = true;

        // Check game over
        if (currentRoom.currentRound >= currentRoom.totalRounds) {
          isGameOver = true;
          return {
            ...currentRoom,
            status: "gameOver",
            roundState: 'ended',
          };
        }

        // Read fresh players from transaction data
        const freshPlayers = currentRoom.players || {};
        const onlineCount = (Object.values(freshPlayers) as Player[]).filter(
          (p) => !p.status || p.status === 'online'
        ).length;

        const updatedPlayers: { [key: string]: Player } = {};
        (Object.values(freshPlayers) as Player[]).forEach((player) => {
          updatedPlayers[player.id] = {
            ...player,
            currentGuess: null,
            hasGuessed: false,
            movesUsed: 0,
          };
        });

        return {
          ...currentRoom,
          status: "playing",
          currentRound: currentRoom.currentRound + 1,
          currentPanoPackageId: panoPackage.id,
          currentPanoPackage: panoPackage,
          currentLocation: { lat: panoPackage.pano0.lat, lng: panoPackage.pano0.lng },
          currentLocationName: panoPackage.locationName,
          players: updatedPlayers,
          roundResults: null,
          roundStartTime: serverNow,
          roundState: 'active',
          roundVersion: (currentRoom.roundVersion || 0) + 1,
          activePlayerCount: onlineCount,
          expectedGuesses: onlineCount,
          currentGuesses: 0,
          roundEndLock: null,
        };
      });

      if (committed) {
        if (isGameOver) {
          trackEvent("gameEnd", { totalRounds: room.totalRounds });
          logger.debug(`[MP] nextRound → gameOver COMMITTED`);
        } else {
          trackEvent("roundStart", { roundId: room.currentRound + 1, panoPackageId: panoPackage.id });
          logger.debug(`[MP] nextRound COMMITTED: round=${room.currentRound + 1} pano=${panoPackage.id}`);
        }
      } else {
        logger.warn(`[MP] nextRound NOT committed — transaction aborted`);
      }

      return committed;
    },
    [room, playerId]
  );

  // --- Next Round (legacy, transaction-guarded) ---
  const nextRound = useCallback(
    async (location: Coordinates, panoId: string, locationName?: string) => {
      if (!room || playerId !== room.hostId) return;

      const roomId = room.id;
      const roomRef = ref(database, `rooms/${roomId}`);
      const expectedRoundVersion = room.roundVersion || 0;
      const serverNow = getServerNowMs();

      let committed = false;
      let isGameOver = false;

      await runTransaction(roomRef, (currentRoom) => {
        committed = false; // Reset on each retry — Firebase may invoke callback multiple times
        isGameOver = false;
        if (!currentRoom) return currentRoom;

        if (currentRoom.hostId !== playerId) return; // abort
        if (currentRoom.status !== "roundEnd") return; // abort
        if ((currentRoom.roundVersion || 0) !== expectedRoundVersion) return; // abort

        committed = true;

        if (currentRoom.currentRound >= currentRoom.totalRounds) {
          isGameOver = true;
          return {
            ...currentRoom,
            status: "gameOver",
            roundState: 'ended',
          };
        }

        const freshPlayers = currentRoom.players || {};
        const onlineCount = (Object.values(freshPlayers) as Player[]).filter(
          (p) => !p.status || p.status === 'online'
        ).length;

        const updatedPlayers: { [key: string]: Player } = {};
        (Object.values(freshPlayers) as Player[]).forEach((player) => {
          updatedPlayers[player.id] = {
            ...player,
            currentGuess: null,
            hasGuessed: false,
            movesUsed: 0,
          };
        });

        return {
          ...currentRoom,
          status: "playing",
          currentRound: currentRoom.currentRound + 1,
          currentLocation: location,
          currentPanoPackageId: panoId,
          currentLocationName: locationName || null,
          players: updatedPlayers,
          roundResults: null,
          roundStartTime: serverNow,
          roundState: 'active',
          roundVersion: (currentRoom.roundVersion || 0) + 1,
          activePlayerCount: onlineCount,
          expectedGuesses: onlineCount,
          currentGuesses: 0,
          roundEndLock: null,
        };
      });

      if (committed && isGameOver) {
        trackEvent("gameEnd", { totalRounds: room.totalRounds });
      }
    },
    [room, playerId]
  );

  // --- Leave Room ---
  // Only removes self. If host, atomically assigns new host first.
  // NO roundEnd computation. The remaining host's onValue listener handles that.
  const leaveRoom = useCallback(async () => {
    if (!room || !playerId) return;

    // BUG-A FIX: Mark as intentional leave BEFORE any Firebase ops
    // so Effect 5 won't show "Oda silindi" toast when room is deleted
    isLeavingRef.current = true;

    const playerList = Object.values(room.players || {});
    const roomId = room.id;

    try {
      if (playerList.length === 1) {
        // Last player — delete room
        await remove(ref(database, `rooms/${roomId}`));
      } else {
        // BUG-HOST-LEAVE FIX: Single transaction for host migration + self-removal.
        // Previously two separate transactions could leave ghost state if the second
        // failed after the first succeeded (host migrated but player not removed).
        const isCurrentHost = playerId === room.hostId;
        const roomRef = ref(database, `rooms/${roomId}`);

        await runTransaction(roomRef, (currentRoom) => {
          if (!currentRoom) return currentRoom;

          // Idempotency: if we're already removed, abort cleanly
          if (!currentRoom.players?.[playerId]) return;

          const players = { ...currentRoom.players };

          // Host migration (if we are the current host)
          let newHostId = currentRoom.hostId;
          if (isCurrentHost && currentRoom.hostId === playerId) {
            const candidates = (Object.values(players) as Player[])
              .filter((p) => p.id !== playerId && (!p.status || p.status === 'online'))
              .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
            const newHost = candidates[0] || (Object.values(players) as Player[]).find((p) => p.id !== playerId);

            if (newHost) {
              newHostId = newHost.id;
              players[newHostId] = { ...players[newHostId], isHost: true };
            }
          }

          // Decrement expectedGuesses if player hasn't guessed during active game
          const freshPlayer = players[playerId];
          const shouldDecrement = currentRoom.status === "playing" && freshPlayer && !freshPlayer.hasGuessed;

          // Remove self
          delete players[playerId];

          const updatedRoom: Partial<Room> & Pick<Room, 'hostId' | 'players'> = {
            ...currentRoom,
            hostId: newHostId,
            players,
          };

          if (shouldDecrement) {
            updatedRoom.expectedGuesses = Math.max(0, (currentRoom.expectedGuesses || 0) - 1);
          }

          return updatedRoom;
        }).catch((err) => {
          logger.warn("[MP] leaveRoom transaction failed, fallback remove:", err);
          // Fallback: if transaction fails, do the remove directly
          return remove(ref(database, `rooms/${roomId}/players/${playerId}`)).catch(() => {});
        });
      }
    } catch (err) {
      // BUG-HOST-LEAVE FIX: Catch all Firebase errors to prevent unhandled rejection
      // which triggers the global "Beklenmeyen bir hata oluştu" toast.
      logger.error("[MP] leaveRoom failed:", err);
      // Still proceed with local cleanup below — player should leave UI regardless
    }

    // Local cleanup (always runs, even if Firebase ops fail)
    cleanupRoomData(roomId);
    clearSessionToken(roomId);
    trackEvent("leave", { roomId });

    setRoom(null);
    setPlayerId("");
    clearAllNotifications();
    previousPlayersRef.current = [];
    previousHostIdRef.current = null;
    previousPlayerNamesRef.current = new Map();
    isFirstLoadRef.current = true;
    notifiedJoinedRef.current.clear();
    notifiedLeftRef.current.clear();
  }, [room, playerId]);

  // --- Restart Game ---
  // BUG-006 FIX: Use runTransaction for atomicity + gameInstanceId for stale listener guard
  const restartGame = useCallback(async (): Promise<boolean> => {
    if (!room || playerId !== room.hostId) return false;

    // IDEMPOTENCY: If room is already in "waiting" status, no transaction needed.
    // This prevents double-click errors where the first call succeeds (→ waiting)
    // and the second call aborts because status !== "gameOver".
    if (room.status === "waiting") {
      logger.debug("[MP] restartGame: room already in 'waiting' — idempotent return");
      return true;
    }

    const newGameInstanceId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    // BUG-006 FIX: Update local ref immediately so listener ignores stale events
    localGameInstanceIdRef.current = newGameInstanceId;

    // Reset guess limits for all players
    Object.values(room.players || {}).forEach((player) => {
      resetGuessLimit(player.id);
    });

    let committed = false;

    const buildRestartPayload = (currentRoom: Room | null, includeGameInstanceId: boolean) => {
      // Reset committed on each retry — Firebase may invoke callback multiple times
      committed = false;
      if (!currentRoom) return currentRoom;
      if (currentRoom.hostId !== playerId) return; // abort — not host
      // IDEMPOTENCY: allow if gameOver OR already waiting (concurrent click landed after first succeeded)
      if (currentRoom.status !== "gameOver" && currentRoom.status !== "waiting") return; // abort — unexpected status
      // If already waiting, treat as success — no need to re-write
      if (currentRoom.status === "waiting") {
        committed = true;
        return; // abort transaction (no write needed), but mark committed
      }

      const updatedPlayers: { [key: string]: Player } = {};
      Object.entries(currentRoom.players || {}).forEach(([id, player]: [string, Player]) => {
        updatedPlayers[id] = {
          ...player,
          totalScore: 0,
          currentGuess: null,
          hasGuessed: false,
          movesUsed: 0,
          roundScores: [],
        };
      });

      const payload: Record<string, unknown> = {
        ...currentRoom,
        status: "waiting",
        currentRound: 0,
        currentLocation: null,
        currentPanoPackageId: null,
        currentPanoPackage: null,
        currentLocationName: null,
        roundResults: null,
        roundStartTime: null,
        players: updatedPlayers,
        lastActivityAt: Date.now(),
        roundState: 'waiting',
        // roundVersion: NOT reset — Firebase rule requires monotonic increase.
        activePlayerCount: 0,
        expectedGuesses: 0,
        currentGuesses: 0,
        roundEndLock: null,
      };
      if (includeGameInstanceId) {
        payload.gameInstanceId = newGameInstanceId;
      }
      // Clean any unexpected fields that could trigger $other validation failure
      delete payload.locationHistory;
      committed = true;
      return payload;
    };

    try {
      // Try with gameInstanceId first
      await runTransaction(ref(database, `rooms/${room.id}`), (currentRoom) =>
        buildRestartPayload(currentRoom, true)
      );
    } catch (firstErr) {
      logger.warn("[MP] restartGame with gameInstanceId failed, retrying without:", firstErr);
      committed = false;
      try {
        // Fallback: without gameInstanceId (rules may not be deployed yet)
        await runTransaction(ref(database, `rooms/${room.id}`), (currentRoom) =>
          buildRestartPayload(currentRoom, false)
        );
      } catch (secondErr) {
        logger.error("[MP] restartGame fallback also failed:", secondErr);
        trackError(secondErr instanceof Error ? secondErr : String(secondErr), "restartGame");
        throw secondErr; // Re-throw so caller knows it failed
      }
    }

    if (committed) {
      trackEvent("gameRestart", { newGameInstanceId, previousStatus: room?.status });
      setupRoomCleanup({ ...room, status: "waiting" });
    }
    return committed;
  }, [room, playerId]);

  // ==================== DERIVED STATE ====================

  const currentPlayer = room?.players?.[playerId] || null;
  const isHost = playerId === room?.hostId;
  const playersList = room?.players ? Object.values(room.players) : [];

  return {
    room,
    playerId,
    playerName,
    currentPlayer,
    isHost,
    players: playersList,
    error,
    isLoading,
    connectionState,
    notifications,
    dismissNotification,
    createRoom,
    joinRoom,
    setGameMode,
    startGame,
    startGameWithPanoPackage,
    submitGuess,
    checkAllGuessed,
    handleTimeUp,
    nextRound,
    nextRoundWithPanoPackage,
    leaveRoom,
    restartGame,
    returnToLobby: restartGame, // Canonical alias: idempotent lobby reset
  };
}
