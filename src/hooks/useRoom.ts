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
import { database, ref, set, get, onValue, update, remove, onDisconnect, runTransaction, serverTimestamp, getAuthUid } from "@/config/firebase";
import {
  Room,
  Player,
  PlayerStatus,
  Coordinates,
  GameMode,
  PanoPackage,
  GAME_MODE_CONFIG,
} from "@/types";
import {
  generateRoomCode,
  calculateDistance,
  calculateScore,
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
  isValidTurkeyCoordinate,
  isValidPlayerName,
  ERROR_MESSAGES,
} from "@/config/production";

// ==================== TYPES ====================

export interface GameNotification {
  id: string;
  type: "player_left" | "player_joined" | "host_changed" | "error";
  message: string;
  playerName?: string;
  timestamp: number;
}

export interface RoundEndLock {
  lockedBy: string;   // uid of lock owner
  roundId: number;    // which round this lock is for
  lockedAt: number;   // timestamp when acquired
}

// ==================== CONSTANTS ====================

const DISCONNECT_GRACE_PERIOD = 15000;   // 15s before removing disconnected player
const STALE_HEARTBEAT_THRESHOLD = 30000; // 30s no heartbeat → mark disconnected
const HEARTBEAT_INTERVAL = 5000;         // 5s heartbeat
const CLEANUP_INTERVAL = 10000;          // 10s cleanup cycle
const ROUND_END_RECOVERY_BUFFER = 3;     // seconds past time limit before recovery kicks in

// ==================== INSTRUMENTATION ====================

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
};

function roomStateDigest(room: Room, trigger: string, clientId: string): void {
  const players = Object.values(room.players || {});
  const playerSummary = players.map(p => ({
    id: p.id.substring(0, 8),
    name: p.name,
    status: p.status || 'online',
    lastSeen: p.lastSeen ? `${Math.round((Date.now() - p.lastSeen) / 1000)}s ago` : 'n/a',
    hasGuessed: p.hasGuessed,
    guessPresent: !!p.currentGuess,
  }));

  console.log(`[MP] ===== ROOM DIGEST (${trigger}) =====`);
  console.log(`[MP] room=${room.id} client=${clientId.substring(0, 8)} status=${room.status} round=${room.currentRound}`);
  console.log(`[MP] hostId=${room.hostId.substring(0, 8)} roundStartTime=${room.roundStartTime}`);
  console.log(`[MP] expected=${room.expectedGuesses} current=${room.currentGuesses} active=${room.activePlayerCount}`);
  console.log(`[MP] players=`, JSON.stringify(playerSummary));
  console.log(`[MP] counters=`, JSON.stringify(mpCounters));
  console.log(`[MP] ===================================`);
}

// ==================== HOOK ====================

export function useRoom() {
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Notification system
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const previousPlayersRef = useRef<string[]>([]);
  const previousHostIdRef = useRef<string | null>(null);
  const notifiedJoinedRef = useRef<Set<string>>(new Set());
  const notifiedLeftRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);
  // Name cache: stores player names from PREVIOUS snapshot for reliable left-notification
  const previousPlayerNamesRef = useRef<Map<string, string>>(new Map());

  // Round processing guards
  const isProcessingRoundRef = useRef<boolean>(false);
  const processingRoundIdRef = useRef<number | null>(null);
  const lastStatusRef = useRef<string | null>(null);

  // Double-submit guard (synchronous, not React state)
  const isSubmittingGuessRef = useRef<boolean>(false);

  // Stuck-client recovery ref
  const stuckRecoveryTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Presence refs
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Host migration guard: prevent duplicate migration attempts
  const isMigratingHostRef = useRef<string | null>(null); // old hostId being migrated away from

  // ==================== NOTIFICATION HELPERS ====================

  const addNotification = useCallback((
    type: GameNotification["type"],
    message: string,
    pName?: string
  ) => {
    mpCounters.notificationFiredCount++;
    const notification: GameNotification = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      playerName: pName,
      timestamp: Date.now(),
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-dismiss after 5s
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // ==================== EFFECT 1: PRESENCE (heartbeat + onDisconnect) ====================
  // Single onDisconnect registration per mount. Heartbeat updates lastSeen only.

  useEffect(() => {
    if (!room?.id || !playerId) return;

    const playerRef = ref(database, `rooms/${room.id}/players/${playerId}`);

    // Register onDisconnect ONCE — marks player as disconnected on server-side
    const disconnectRef = onDisconnect(playerRef);
    disconnectRef.update({
      status: 'disconnected' as PlayerStatus,
    });

    // Heartbeat: update lastSeen every HEARTBEAT_INTERVAL
    const updatePresence = async () => {
      try {
        await update(playerRef, {
          lastSeen: Date.now(),
          status: 'online' as PlayerStatus,
        });
      } catch (err) {
        // Player may have been removed — ignore
      }
    };

    // Immediate first heartbeat
    updatePresence();
    presenceIntervalRef.current = setInterval(updatePresence, HEARTBEAT_INTERVAL);

    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
        presenceIntervalRef.current = null;
      }
      // Cancel onDisconnect on clean unmount (leaveRoom handles explicit removal)
      disconnectRef.cancel();
    };
  }, [room?.id, playerId]);

  // ==================== EFFECT 2: HOST-ONLY CLEANUP ====================
  // Runs in ALL statuses including "waiting". Single authority: host only.
  // Detects: (a) status='disconnected' + grace exceeded, (b) stale heartbeat (online but no update).
  // Transaction-based, idempotent.

  useEffect(() => {
    if (!room?.id || !playerId) return;
    // Only host runs cleanup
    if (playerId !== room.hostId) return;

    const roomId = room.id;

    const checkOfflinePlayers = async () => {
      // READ FRESH DATA from Firebase instead of relying on stale closure.
      // This prevents the race where a player reconnects between React renders
      // but the closure still sees old lastSeen values.
      let freshRoom: Room | null;
      try {
        const freshSnap = await get(ref(database, `rooms/${roomId}`));
        freshRoom = freshSnap.val() as Room | null;
      } catch {
        return; // Firebase read failed — skip this cycle
      }

      if (!freshRoom?.players) return;

      const now = Date.now();

      for (const player of Object.values(freshRoom.players)) {
        if (player.id === playerId) continue; // Never remove self

        const lastSeen = player.lastSeen || now;
        const timeSinceLastSeen = now - lastSeen;
        const playerStatus = player.status || 'online';

        // Case A: Explicitly 'disconnected' AND grace period exceeded → remove
        if (playerStatus === 'disconnected' && timeSinceLastSeen > DISCONNECT_GRACE_PERIOD) {
          mpCounters.ghostRemovedCount++;
          console.log(`[MP] Ghost cleanup: removing ${player.name} (status=disconnected, ${timeSinceLastSeen}ms stale) [total: ${mpCounters.ghostRemovedCount}]`);

          try {
            // Remove player node
            await remove(ref(database, `rooms/${roomId}/players/${player.id}`));

            // If game is playing and player hadn't guessed, decrement expectedGuesses
            if (freshRoom.status === "playing" && !player.hasGuessed) {
              const roomRef = ref(database, `rooms/${roomId}`);
              await runTransaction(roomRef, (currentRoom) => {
                if (!currentRoom || currentRoom.status !== "playing") return currentRoom;
                return {
                  ...currentRoom,
                  expectedGuesses: Math.max(0, (currentRoom.expectedGuesses || 0) - 1),
                };
              });
            }

            roomStateDigest(freshRoom, `ghostRemoved:${player.name}`, playerId);
          } catch (err) {
            console.warn("[MP] Ghost cleanup failed:", err);
          }
        }

        // Case B: Still 'online' but stale heartbeat → mark as disconnected (triggers Case A next cycle)
        else if (playerStatus === 'online' && timeSinceLastSeen > STALE_HEARTBEAT_THRESHOLD) {
          console.log(`[MP] Stale heartbeat: ${player.name} (${timeSinceLastSeen}ms, still 'online')`);
          try {
            await update(ref(database, `rooms/${roomId}/players/${player.id}`), {
              status: 'disconnected' as PlayerStatus,
            });
          } catch (err) {
            console.warn("[MP] Failed to mark stale player:", err);
          }
        }
      }
    };

    // Run immediately + every CLEANUP_INTERVAL
    checkOfflinePlayers();
    cleanupIntervalRef.current = setInterval(checkOfflinePlayers, CLEANUP_INTERVAL);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    };
  }, [room?.id, room?.hostId, playerId]);

  // ==================== EFFECT 3: BEFOREUNLOAD ====================
  // Fire-and-forget status update. Primary protection is onDisconnect.

  useEffect(() => {
    if (!room?.id || !playerId) return;

    const handleBeforeUnload = () => {
      const playerRef = ref(database, `rooms/${room.id}/players/${playerId}`);
      // Fire-and-forget — browser may close before this completes, that's OK.
      // onDisconnect server-side handler is the primary mechanism.
      update(playerRef, {
        status: 'disconnected' as PlayerStatus,
      }).catch(() => { /* tab closing, ignore */ });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [room?.id, playerId]);

  // ==================== EFFECT 4: TELEMETRY INIT ====================

  useEffect(() => {
    initTelemetry();
    return () => cleanupTelemetry();
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
              notifiedLeftRef.current.add(leftPlayerId);
              setTimeout(() => notifiedLeftRef.current.delete(leftPlayerId), 10000);
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
              notifiedJoinedRef.current.add(joinedPlayerId);
              setTimeout(() => notifiedJoinedRef.current.delete(joinedPlayerId), 10000);
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
          // Deterministic election: lowest joinedAt among online players (excluding dead host)
          const onlineCandidates = Object.values(roomData.players || {})
            .filter((p) => (p.status === 'online' || !p.status) && p.id !== roomData.hostId)
            .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

          const newHost = onlineCandidates[0];

          // Only the elected candidate writes migration (prevents race)
          if (newHost && newHost.id === playerId) {
            // Set migration guard SYNCHRONOUSLY before any async work
            isMigratingHostRef.current = roomData.hostId;
            mpCounters.hostMigrationCount++;
            console.log(`[MP] Host migration: ${roomData.hostId.substring(0, 8)} → ${newHost.id.substring(0, 8)}`);

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
              console.log(`[MP] Host migration committed: ${newHost.id.substring(0, 8)} is now host`);
            } catch (err) {
              console.error("[MP] Host migration failed:", err);
            }

            // POST-MIGRATION RECOVERY: After becoming host, start a periodic
            // check that runs every 5s until roundEnd is resolved. This is needed
            // because the onValue listener may not fire again if no other Firebase
            // updates happen (e.g., timer expires but nothing writes to Firebase).
            if (migrationCommitted && roomData.status === "playing") {
              const migrationRoomId = roomData.id;
              const migrationRound = roomData.currentRound;
              console.log(`[MP] Post-migration recovery interval starting for room=${migrationRoomId} round=${migrationRound}`);

              const recoveryCheck = async () => {
                if (isProcessingRoundRef.current) return false; // busy, try again next tick
                try {
                  const freshSnap = await get(ref(database, `rooms/${migrationRoomId}`));
                  const freshRoom = freshSnap.val() as Room | null;
                  if (!freshRoom || freshRoom.status !== "playing" || freshRoom.currentRound !== migrationRound) {
                    console.log(`[MP] Post-migration recovery: room state changed, stopping`);
                    return true; // done, stop interval
                  }
                  if (freshRoom.hostId !== playerId) {
                    console.log(`[MP] Post-migration recovery: no longer host, stopping`);
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
                    console.log(`[MP] Post-migration recovery: triggering roundEnd (${trigger}, elapsed=${elapsed.toFixed(1)}s, online=${freshOnline.length})`);
                    isProcessingRoundRef.current = true;
                    try {
                      await acquireAndWriteRoundEnd(migrationRoomId, migrationRound, null, freshRoom.currentLocation, playerId, trigger);
                    } finally {
                      isProcessingRoundRef.current = false;
                    }
                    return true; // done
                  }
                  console.log(`[MP] Post-migration recovery: waiting (allGuessed=${allGuessedNow}, elapsed=${elapsed.toFixed(0)}s/${tLimit}s, online=${freshOnline.length})`);
                  return false; // keep checking
                } catch (err) {
                  console.error("[MP] Post-migration recovery error:", err);
                  return false; // keep trying
                }
              };

              // First check after 3s (wait for onDisconnect to propagate)
              setTimeout(async () => {
                const done = await recoveryCheck();
                if (done) return;
                // Continue checking every 5s until resolved
                const interval = setInterval(async () => {
                  const isDone = await recoveryCheck();
                  if (isDone) clearInterval(interval);
                }, 5000);
                // Safety: clear after 3 minutes max
                setTimeout(() => clearInterval(interval), 180000);
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
            // Explicitly disconnected → not online
            if (p.status === 'disconnected') return false;
            // Stale heartbeat (no update for 30s) → treat as disconnected
            if (p.lastSeen && (now - p.lastSeen) > STALE_HEARTBEAT_THRESHOLD) return false;
            // Online or no status set yet
            return true;
          });

          // --- Trigger (a): allGuessed ---
          const allGuessed = onlinePlayers.length > 0 && onlinePlayers.every((p) => p.hasGuessed);

          if (allGuessed && roomData.currentLocation && !isProcessingRoundRef.current) {
            isProcessingRoundRef.current = true;
            const currentRoundId = roomData.currentRound;
            processingRoundIdRef.current = currentRoundId;

            const snapshotPlayerIds = Object.keys(roomData.players);
            const snapshotLocation = { ...roomData.currentLocation };

            setTimeout(async () => {
              try {
                if (processingRoundIdRef.current !== currentRoundId) return;

                await acquireAndWriteRoundEnd(roomData.id, currentRoundId, snapshotPlayerIds, snapshotLocation, playerId, "allGuessed");
              } catch (err) {
                console.error("[MP] allGuessed roundEnd error:", err);
                trackError(err instanceof Error ? err : String(err), "autoRoundEnd");
              } finally {
                isProcessingRoundRef.current = false;
                processingRoundIdRef.current = null;
              }
            }, 100);
          }

          // --- Trigger (b): timeExpired recovery ---
          if (roomData.roundStartTime && !isProcessingRoundRef.current) {
            const elapsed = (Date.now() - roomData.roundStartTime) / 1000;
            const timeLimit = roomData.timeLimit || 90;

            if (elapsed > timeLimit + ROUND_END_RECOVERY_BUFFER) {
              console.log(`[MP] RoundEnd recovery: elapsed=${elapsed.toFixed(1)}s > limit=${timeLimit}s`);
              isProcessingRoundRef.current = true;
              const recoveryRoundId = roomData.currentRound;

              setTimeout(async () => {
                try {
                  await acquireAndWriteRoundEnd(roomData.id, recoveryRoundId, null, roomData.currentLocation, playerId, "recovery");
                } catch (err) {
                  console.error("[MP] RoundEnd recovery error:", err);
                } finally {
                  isProcessingRoundRef.current = false;
                }
              }, 200);
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
          if (elapsed > timeLimit + 10) {
            if (!stuckRecoveryTimerRef.current) {
              console.log(`[MP] Stuck recovery: client guessed but still playing after ${elapsed.toFixed(0)}s — scheduling fresh read`);
              stuckRecoveryTimerRef.current = setTimeout(async () => {
                stuckRecoveryTimerRef.current = null;
                try {
                  const freshSnap = await get(roomRef);
                  const freshData = freshSnap.val() as Room | null;
                  if (freshData && freshData.status !== "playing") {
                    console.log(`[MP] Stuck recovery: Firebase shows status=${freshData.status}, forcing local update`);
                    setRoom(freshData);
                  } else if (freshData) {
                    console.log(`[MP] Stuck recovery: Firebase still shows playing (round=${freshData.currentRound})`);
                    // If we're host and room is truly stuck, try to trigger roundEnd
                    if (playerId === freshData.hostId && !isProcessingRoundRef.current) {
                      console.log(`[MP] Stuck recovery: host forcing roundEnd for round ${freshData.currentRound}`);
                      isProcessingRoundRef.current = true;
                      try {
                        await acquireAndWriteRoundEnd(
                          freshData.id,
                          freshData.currentRound,
                          null,
                          freshData.currentLocation,
                          playerId,
                          "stuckRecovery"
                        );
                      } finally {
                        isProcessingRoundRef.current = false;
                      }
                    }
                  }
                } catch (err) {
                  console.warn("[MP] Stuck recovery read failed:", err);
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
        setError("Oda silindi veya bulunamadı");
      }
    });

    return () => {
      unsubscribe();
      trackListener("unsubscribe");
      if (stuckRecoveryTimerRef.current) {
        clearTimeout(stuckRecoveryTimerRef.current);
        stuckRecoveryTimerRef.current = null;
      }
    };
  }, [room?.id, playerId, playerName, addNotification]);

  // ==================== ROUND END LOCK + WRITE ====================
  // Acquires roundEndLock via transaction, then writes roundEnd atomically.
  // Idempotent: if lock already acquired for this round, or status != playing, aborts.

  async function acquireAndWriteRoundEnd(
    roomId: string,
    roundId: number,
    snapshotPlayerIds: string[] | null, // null = use all current players (recovery mode)
    snapshotLocation: Coordinates | null,
    ownerId: string,
    trigger: string
  ) {
    mpCounters.roundEndLockAcquireAttempts++;
    console.log(`[MP] acquireAndWriteRoundEnd: ENTER trigger=${trigger} roundId=${roundId} owner=${ownerId.substring(0, 8)} attempt=#${mpCounters.roundEndLockAcquireAttempts}`);

    const roomRef = ref(database, `rooms/${roomId}`);
    const freshSnap = await get(roomRef);
    const freshRoom = freshSnap.val() as Room | null;

    if (!freshRoom || freshRoom.status !== "playing" || freshRoom.currentRound !== roundId) {
      console.log(`[MP] roundEnd abort: stale state (status=${freshRoom?.status}, round=${freshRoom?.currentRound}, expected=${roundId}) trigger=${trigger}`);
      return;
    }

    // Check lock — if already locked for this round, abort
    const existingLock = (freshRoom as any).roundEndLock as RoundEndLock | undefined;
    if (existingLock && existingLock.roundId === roundId) {
      console.log(`[MP] roundEnd abort: lock already held by ${existingLock.lockedBy.substring(0, 8)} for round ${roundId} trigger=${trigger}`);
      return;
    }

    // Acquire lock + write roundEnd in single transaction
    const playerIdsToProcess = snapshotPlayerIds || Object.keys(freshRoom.players || {});
    const location = snapshotLocation || freshRoom.currentLocation;

    const playersToProcess = playerIdsToProcess
      .map(id => freshRoom.players?.[id])
      .filter((p): p is Player => p !== undefined && p !== null);

    const results = playersToProcess
      .filter(p => p.id && p.name)
      .map((player) => {
        const distance = player.currentGuess && location
          ? calculateDistance(location, player.currentGuess)
          : 9999;
        const score = player.hasGuessed ? calculateScore(distance) : 0;
        return {
          odlayerId: player.id,
          playerName: player.name || "Oyuncu",
          guess: player.currentGuess || { lat: 0, lng: 0 },
          distance: player.hasGuessed ? distance : 9999,
          score,
        };
      });

    // Build updated players
    const updatedPlayers: { [key: string]: Player } = {};
    Object.values(freshRoom.players || {}).forEach((player) => {
      updatedPlayers[player.id] = player;
    });
    playersToProcess.forEach((player) => {
      const result = results.find((r) => r.odlayerId === player.id);
      const currentRoundScores = player.roundScores || [];
      updatedPlayers[player.id] = {
        ...player,
        totalScore: (player.totalScore || 0) + (result?.score || 0),
        roundScores: [...currentRoundScores, result?.score || 0],
        hasGuessed: true,
      };
    });

    // Atomic: acquire lock + transition to roundEnd
    let transactionCommitted = false;
    await runTransaction(roomRef, (currentRoom) => {
      if (!currentRoom) return currentRoom;
      if (currentRoom.status !== "playing") {
        console.log(`[MP] roundEnd TX abort: status=${currentRoom.status} (expected playing) trigger=${trigger}`);
        return; // abort
      }
      if (currentRoom.currentRound !== roundId) {
        console.log(`[MP] roundEnd TX abort: round=${currentRoom.currentRound} (expected ${roundId}) trigger=${trigger}`);
        return; // abort
      }

      // Check lock inside transaction
      const lock = currentRoom.roundEndLock as RoundEndLock | undefined;
      if (lock && lock.roundId === roundId) {
        console.log(`[MP] roundEnd TX abort: lock already held trigger=${trigger}`);
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
      trackEvent("roundEnd", { roundId, trigger });
      console.log(`[MP] RoundEnd COMMITTED: round=${roundId} trigger=${trigger} by=${ownerId.substring(0, 8)}`);
      console.table({
        "Round": roundId,
        "Trigger": trigger,
        "Lock Attempts": mpCounters.roundEndLockAcquireAttempts,
        "Lock Acquired": mpCounters.roundEndLockAcquired,
        "RoundEnd Writes": mpCounters.roundEndWrites,
        "Ghosts Removed": mpCounters.ghostRemovedCount,
        "Players": Object.keys(freshRoom.players || {}).length,
      });
      roomStateDigest({ ...freshRoom, status: "roundEnd" } as Room, `roundEnd:${trigger}`, ownerId);
    } else {
      console.log(`[MP] RoundEnd NOT committed: round=${roundId} trigger=${trigger} — transaction aborted`);
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
      const odlayerId = await getAuthUid();
      const sessionToken = generateSessionToken();
      const modeConfig = GAME_MODE_CONFIG[gameMode];
      const now = Date.now();

      const newPlayer: Player = {
        id: odlayerId,
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
        hostId: odlayerId,
        status: "waiting",
        currentRound: 0,
        totalRounds: 5,
        players: { [odlayerId]: newPlayer },
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

      setPlayerId(odlayerId);
      setPlayerName(name.trim());
      setRoom(newRoom);

      saveSessionToken(roomCode, sessionToken);

      setTelemetryContext({
        roomId: roomCode,
        playerId: odlayerId,
        playerName: name.trim(),
      });
      trackEvent("join", { action: "create", gameMode });

      previousPlayersRef.current = [odlayerId];
      previousHostIdRef.current = odlayerId;
      isFirstLoadRef.current = true;
      notifiedJoinedRef.current.clear();
      notifiedLeftRef.current.clear();

      setupRoomCleanup(newRoom);

      return roomCode;
    } catch (err) {
      console.error("Oda oluşturma hatası:", err);
      trackError(err instanceof Error ? err : String(err), "createRoom");
      setError("Oda oluşturulamadı. Lütfen tekrar deneyin.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Join Room ---
  const joinRoom = useCallback(async (roomCode: string, name: string) => {
    setIsLoading(true);
    setError(null);

    if (!canJoinRoom()) {
      setError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
      setIsLoading(false);
      return false;
    }

    if (!isValidPlayerName(name)) {
      setError("Geçersiz oyuncu adı (1-20 karakter)");
      setIsLoading(false);
      return false;
    }

    try {
      const normalizedRoomCode = roomCode.toUpperCase();
      const roomRef = ref(database, `rooms/${normalizedRoomCode}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        setError(ERROR_MESSAGES.ROOM_NOT_FOUND);
        return false;
      }

      const roomData = snapshot.val() as Room;

      // --- REJOIN CHECK ---
      const existingSessionToken = getSessionToken(normalizedRoomCode);

      if (existingSessionToken && roomData.players) {
        const matchingPlayer = Object.values(roomData.players).find(
          (p) => p.sessionToken === existingSessionToken
        );

        if (matchingPlayer) {
          console.log(`[MP] Rejoin: ${matchingPlayer.name} reconnected`);

          const now = Date.now();
          await update(ref(database, `rooms/${normalizedRoomCode}/players/${matchingPlayer.id}`), {
            status: 'online' as PlayerStatus,
            lastSeen: now,
            disconnectedAt: null,
            name: name.trim(),
          });

          setPlayerId(matchingPlayer.id);
          setPlayerName(name.trim());
          setRoom({ ...roomData, id: normalizedRoomCode });

          setTelemetryContext({
            roomId: normalizedRoomCode,
            playerId: matchingPlayer.id,
            playerName: name.trim(),
          });
          trackEvent("join", { action: "rejoin" });

          previousPlayersRef.current = Object.keys(roomData.players || {});
          previousHostIdRef.current = roomData.hostId;
          isFirstLoadRef.current = true;
          notifiedJoinedRef.current.clear();
          notifiedLeftRef.current.clear();

          recordPlayerActivity(normalizedRoomCode, matchingPlayer.id);

          setIsLoading(false);
          return true;
        }
      }

      // --- NEW PLAYER JOIN ---
      if (roomData.status !== "waiting") {
        setError(ERROR_MESSAGES.GAME_ALREADY_STARTED);
        return false;
      }

      const playerCount = Object.keys(roomData.players || {}).length;
      if (playerCount >= 8) {
        setError(ERROR_MESSAGES.ROOM_FULL);
        return false;
      }

      const odlayerId = await getAuthUid();
      const sessionToken = generateSessionToken();
      const now = Date.now();

      const newPlayer: Player = {
        id: odlayerId,
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
      await set(ref(database, `rooms/${normalizedRoomCode}/players/${odlayerId}`), newPlayer);

      // lastActivityAt update: use player-level lastActiveAt instead
      // (room-level write requires host or existing player — we are now a player after the set above)
      await update(ref(database, `rooms/${normalizedRoomCode}`), {
        lastActivityAt: now,
      });

      saveSessionToken(normalizedRoomCode, sessionToken);

      setPlayerId(odlayerId);
      setPlayerName(name.trim());
      setRoom({ ...roomData, id: normalizedRoomCode });

      setTelemetryContext({
        roomId: normalizedRoomCode,
        playerId: odlayerId,
        playerName: name.trim(),
      });
      trackEvent("join", { action: "join" });

      previousPlayersRef.current = [...Object.keys(roomData.players || {}), odlayerId];
      previousHostIdRef.current = roomData.hostId;
      isFirstLoadRef.current = true;
      notifiedJoinedRef.current.clear();
      notifiedLeftRef.current.clear();

      recordPlayerActivity(normalizedRoomCode, odlayerId);

      return true;
    } catch (err) {
      console.error("Odaya katılma hatası:", err);
      trackError(err instanceof Error ? err : String(err), "joinRoom");
      setError("Odaya katılınamadı. Lütfen tekrar deneyin.");
      return false;
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

  // --- Start Game with PanoPackage ---
  const startGameWithPanoPackage = useCallback(
    async (panoPackage: PanoPackage) => {
      if (!room || playerId !== room.hostId) return;

      const onlinePlayers = Object.values(room.players || {}).filter(
        (p) => !p.status || p.status === 'online'
      );
      const onlinePlayerCount = onlinePlayers.length;

      const updatedPlayers: { [key: string]: Player } = {};
      Object.values(room.players || {}).forEach((player) => {
        updatedPlayers[player.id] = {
          ...player,
          currentGuess: null,
          hasGuessed: false,
          movesUsed: 0,
        };
      });

      const now = Date.now();

      await update(ref(database, `rooms/${room.id}`), {
        status: "playing",
        currentRound: 1,
        currentPanoPackageId: panoPackage.id,
        currentPanoPackage: panoPackage,
        currentLocation: { lat: panoPackage.pano0.lat, lng: panoPackage.pano0.lng },
        currentLocationName: panoPackage.locationName,
        players: updatedPlayers,
        roundResults: null,
        roundStartTime: now,
        roundState: 'active',
        roundVersion: (room.roundVersion || 0) + 1,
        activePlayerCount: onlinePlayerCount,
        expectedGuesses: onlinePlayerCount,
        currentGuesses: 0,
        roundEndLock: null, // Clear lock for new round
      });

      trackEvent("roundStart", { roundId: 1, panoPackageId: panoPackage.id });
    },
    [room, playerId]
  );

  // --- Start Game (legacy) ---
  const startGame = useCallback(
    async (location: Coordinates, panoId: string, locationName?: string) => {
      if (!room || playerId !== room.hostId) return;

      const onlinePlayers = Object.values(room.players || {}).filter(
        (p) => !p.status || p.status === 'online'
      );
      const onlinePlayerCount = onlinePlayers.length;

      const updatedPlayers: { [key: string]: Player } = {};
      Object.values(room.players || {}).forEach((player) => {
        updatedPlayers[player.id] = {
          ...player,
          currentGuess: null,
          hasGuessed: false,
          movesUsed: 0,
        };
      });

      const now = Date.now();

      await update(ref(database, `rooms/${room.id}`), {
        status: "playing",
        currentRound: 1,
        currentLocation: location,
        currentPanoPackageId: panoId,
        currentLocationName: locationName || null,
        players: updatedPlayers,
        roundResults: null,
        roundStartTime: now,
        roundState: 'active',
        roundVersion: (room.roundVersion || 0) + 1,
        activePlayerCount: onlinePlayerCount,
        expectedGuesses: onlinePlayerCount,
        currentGuesses: 0,
        roundEndLock: null,
      });
    },
    [room, playerId]
  );

  // --- Submit Guess ---
  const submitGuess = useCallback(
    async (guess: Coordinates) => {
      if (!room || !playerId) return;

      // SYNCHRONOUS double-submit guard (not React state — immune to stale closures)
      if (isSubmittingGuessRef.current) {
        console.log("[MP] submitGuess: submission in-flight, skipping");
        return;
      }

      const currentPlayer = room.players?.[playerId];
      if (currentPlayer?.hasGuessed) {
        console.log("[MP] submitGuess: already guessed, skipping");
        return;
      }

      if (!canSubmitGuess(playerId, room.currentRound)) {
        setError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
        return;
      }

      if (!isValidTurkeyCoordinate(guess.lat, guess.lng)) {
        setError(ERROR_MESSAGES.INVALID_COORDINATES);
        return;
      }

      isSubmittingGuessRef.current = true;

      try {
        recordPlayerActivity(room.id, playerId);

        await update(ref(database, `rooms/${room.id}/players/${playerId}`), {
          currentGuess: guess,
          hasGuessed: true,
          lastActiveAt: Date.now(),
        });

        // Atomic increment with hasGuessed pre-check to prevent counter drift
        const roomRef = ref(database, `rooms/${room.id}`);
        await runTransaction(roomRef, (currentRoom) => {
          if (!currentRoom) return currentRoom;
          // Double-check: if this player already has hasGuessed=true in Firebase, don't increment
          const playerInDb = currentRoom.players?.[playerId];
          if (playerInDb?.hasGuessed && playerInDb?.currentGuess) {
            // Player already submitted — this is a duplicate; return unchanged
            return currentRoom;
          }
          return {
            ...currentRoom,
            currentGuesses: (currentRoom.currentGuesses || 0) + 1,
          };
        });

        trackEvent("submitGuess", { roundId: room.currentRound, lat: guess.lat, lng: guess.lng });
      } finally {
        isSubmittingGuessRef.current = false;
      }
    },
    [room, playerId]
  );

  // --- Check All Guessed (explicit call) ---
  const checkAllGuessed = useCallback(async () => {
    if (!room || playerId !== room.hostId) return;

    const latestSnap = await get(ref(database, `rooms/${room.id}`));
    const latestRoom = latestSnap.val() as Room | null;

    if (!latestRoom?.players || latestRoom.status !== "playing") return;

    const playerList = Object.values(latestRoom.players);
    const onlinePlayers = playerList.filter((p) => !p.status || p.status === 'online');
    const allGuessed = onlinePlayers.length > 0 && onlinePlayers.every((p) => p.hasGuessed);

    if (allGuessed && latestRoom.currentLocation) {
      await acquireAndWriteRoundEnd(
        latestRoom.id,
        latestRoom.currentRound,
        Object.keys(latestRoom.players),
        latestRoom.currentLocation,
        playerId,
        "checkAllGuessed"
      );
    }
  }, [room, playerId]);

  // --- Handle Time Up ---
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

    mpCounters.roundEndLockAcquireAttempts++;
    console.log(`[MP] handleTimeUp: round=${room.currentRound}`);

    isProcessingRoundRef.current = true;
    hasHandledTimeUpRef.current = room.currentRound;

    try {
      await acquireAndWriteRoundEnd(
        room.id,
        room.currentRound,
        null, // use all current players
        room.currentLocation,
        playerId,
        "timeUp"
      );
    } catch (err) {
      console.error("[MP] handleTimeUp error:", err);
      trackError(err instanceof Error ? err : String(err), "handleTimeUp");
    } finally {
      isProcessingRoundRef.current = false;
    }
  }, [room, playerId]);

  // --- Next Round with PanoPackage ---
  const nextRoundWithPanoPackage = useCallback(
    async (panoPackage: PanoPackage) => {
      if (!room || playerId !== room.hostId) return;

      const isGameOver = room.currentRound >= room.totalRounds;

      if (isGameOver) {
        await update(ref(database, `rooms/${room.id}`), {
          status: "gameOver",
          roundState: 'ended',
        });
        trackEvent("gameEnd", { totalRounds: room.totalRounds });
      } else {
        const onlinePlayers = Object.values(room.players || {}).filter(
          (p) => !p.status || p.status === 'online'
        );
        const onlinePlayerCount = onlinePlayers.length;

        const updatedPlayers: { [key: string]: Player } = {};
        Object.values(room.players || {}).forEach((player) => {
          updatedPlayers[player.id] = {
            ...player,
            currentGuess: null,
            hasGuessed: false,
            movesUsed: 0,
          };
        });

        const now = Date.now();

        await update(ref(database, `rooms/${room.id}`), {
          status: "playing",
          currentRound: room.currentRound + 1,
          currentPanoPackageId: panoPackage.id,
          currentPanoPackage: panoPackage,
          currentLocation: { lat: panoPackage.pano0.lat, lng: panoPackage.pano0.lng },
          currentLocationName: panoPackage.locationName,
          players: updatedPlayers,
          roundResults: null,
          roundStartTime: now,
          roundState: 'active',
          roundVersion: (room.roundVersion || 0) + 1,
          activePlayerCount: onlinePlayerCount,
          expectedGuesses: onlinePlayerCount,
          currentGuesses: 0,
          roundEndLock: null, // Clear lock for new round
        });

        trackEvent("roundStart", { roundId: room.currentRound + 1, panoPackageId: panoPackage.id });
      }
    },
    [room, playerId]
  );

  // --- Next Round (legacy) ---
  const nextRound = useCallback(
    async (location: Coordinates, panoId: string, locationName?: string) => {
      if (!room || playerId !== room.hostId) return;

      const isGameOver = room.currentRound >= room.totalRounds;

      if (isGameOver) {
        await update(ref(database, `rooms/${room.id}`), {
          status: "gameOver",
          roundState: 'ended',
        });
      } else {
        const onlinePlayers = Object.values(room.players || {}).filter(
          (p) => !p.status || p.status === 'online'
        );
        const onlinePlayerCount = onlinePlayers.length;

        const updatedPlayers: { [key: string]: Player } = {};
        Object.values(room.players || {}).forEach((player) => {
          updatedPlayers[player.id] = {
            ...player,
            currentGuess: null,
            hasGuessed: false,
            movesUsed: 0,
          };
        });

        const now = Date.now();

        await update(ref(database, `rooms/${room.id}`), {
          status: "playing",
          currentRound: room.currentRound + 1,
          currentLocation: location,
          currentPanoPackageId: panoId,
          currentLocationName: locationName || null,
          players: updatedPlayers,
          roundResults: null,
          roundStartTime: now,
          roundState: 'active',
          roundVersion: (room.roundVersion || 0) + 1,
          activePlayerCount: onlinePlayerCount,
          expectedGuesses: onlinePlayerCount,
          currentGuesses: 0,
          roundEndLock: null,
        });
      }
    },
    [room, playerId]
  );

  // --- Leave Room ---
  // Only removes self. If host, atomically assigns new host first.
  // NO roundEnd computation. The remaining host's onValue listener handles that.
  const leaveRoom = useCallback(async () => {
    if (!room || !playerId) return;

    const playerList = Object.values(room.players || {});
    const roomId = room.id;

    if (playerList.length === 1) {
      // Last player — delete room
      await remove(ref(database, `rooms/${roomId}`));
    } else {
      // If we're host, atomically migrate host before leaving
      if (playerId === room.hostId) {
        const candidates = playerList
          .filter((p) => p.id !== playerId && (!p.status || p.status === 'online'))
          .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));
        const newHost = candidates[0] || playerList.find((p) => p.id !== playerId);

        if (newHost) {
          const roomRef = ref(database, `rooms/${roomId}`);
          await runTransaction(roomRef, (currentRoom) => {
            if (!currentRoom) return currentRoom;
            if (currentRoom.hostId !== playerId) return; // abort — already migrated
            return {
              ...currentRoom,
              hostId: newHost.id,
              players: {
                ...currentRoom.players,
                [newHost.id]: { ...currentRoom.players[newHost.id], isHost: true },
                [playerId]: { ...currentRoom.players[playerId], isHost: false },
              },
            };
          });
        }
      }

      // Remove ourselves
      await remove(ref(database, `rooms/${roomId}/players/${playerId}`));

      // If playing and we hadn't guessed, decrement expectedGuesses
      if (room.status === "playing") {
        const myPlayer = room.players?.[playerId];
        if (myPlayer && !myPlayer.hasGuessed) {
          const roomRef = ref(database, `rooms/${roomId}`);
          await runTransaction(roomRef, (currentRoom) => {
            if (!currentRoom || currentRoom.status !== "playing") return currentRoom;
            return {
              ...currentRoom,
              expectedGuesses: Math.max(0, (currentRoom.expectedGuesses || 0) - 1),
            };
          }).catch(() => {
            // May fail if we lost host — OK, new host's onValue handles it
          });
        }
      }
    }

    // Local cleanup
    cleanupRoomData(roomId);
    clearSessionToken(roomId);
    trackEvent("leave", { roomId });

    setRoom(null);
    setPlayerId("");
    setNotifications([]);
    previousPlayersRef.current = [];
    previousHostIdRef.current = null;
    previousPlayerNamesRef.current = new Map();
    isFirstLoadRef.current = true;
    notifiedJoinedRef.current.clear();
    notifiedLeftRef.current.clear();
  }, [room, playerId]);

  // --- Restart Game ---
  const restartGame = useCallback(async () => {
    if (!room || playerId !== room.hostId) return;

    const updatedPlayers: { [key: string]: Player } = {};
    Object.values(room.players || {}).forEach((player) => {
      updatedPlayers[player.id] = {
        ...player,
        totalScore: 0,
        currentGuess: null,
        hasGuessed: false,
        movesUsed: 0,
        roundScores: [],
      };
      resetGuessLimit(player.id);
    });

    await update(ref(database, `rooms/${room.id}`), {
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
      roundVersion: 0,
      activePlayerCount: 0,
      expectedGuesses: 0,
      currentGuesses: 0,
      roundEndLock: null,
    });

    setupRoomCleanup({ ...room, status: "waiting" });
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
  };
}
