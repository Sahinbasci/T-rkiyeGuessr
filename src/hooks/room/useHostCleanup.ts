"use client";

/**
 * useHostCleanup — Host-only ghost player removal.
 *
 * Extracted from useRoom.ts Effect 2.
 *
 * Responsibilities:
 * - Detects disconnected players past grace period -> removes them
 * - Detects stale heartbeat (online but no update) -> marks as disconnected
 * - Decrements expectedGuesses if removed player hadn't guessed during "playing"
 * - Runs in ALL room statuses (waiting, playing, roundEnd, gameOver)
 * - Only the host runs this effect
 */

import { useEffect, useRef } from "react";
import {
  database,
  ref,
  get,
  update,
  remove,
  runTransaction,
} from "@/config/firebase";
import type { Room, PlayerStatus } from "@/types";
import { logger } from "@/utils/logger";
import { ROOM_CONSTANTS } from "./types";

const {
  DISCONNECT_GRACE_PERIOD,
  STALE_HEARTBEAT_THRESHOLD,
  CLEANUP_INTERVAL,
} = ROOM_CONSTANTS;

export interface UseHostCleanupParams {
  roomId: string | null;
  hostId: string | null;
  playerId: string;
}

export function useHostCleanup({
  roomId,
  hostId,
  playerId,
}: UseHostCleanupParams): void {
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!roomId || !playerId) return;
    // Only host runs cleanup
    if (playerId !== hostId) return;

    const checkOfflinePlayers = async () => {
      let freshRoom: Room | null;
      try {
        const freshSnap = await get(ref(database, `rooms/${roomId}`));
        freshRoom = freshSnap.val() as Room | null;
      } catch {
        return;
      }

      if (!freshRoom?.players) return;

      const now = Date.now();

      for (const player of Object.values(freshRoom.players)) {
        if (player.id === playerId) continue; // Never remove self

        const lastSeen = player.lastSeen || now;
        const timeSinceLastSeen = now - lastSeen;
        const playerStatus = player.status || "online";

        // Case A: Explicitly 'disconnected' AND grace period exceeded
        if (playerStatus === "disconnected" && timeSinceLastSeen > DISCONNECT_GRACE_PERIOD) {
          logger.debug(
            `[MP] Ghost cleanup: removing ${player.name} (status=disconnected, ${timeSinceLastSeen}ms stale)`
          );

          try {
            await remove(ref(database, `rooms/${roomId}/players/${player.id}`));

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
          } catch (err) {
            logger.warn("[MP] Ghost cleanup failed:", err);
          }
        }

        // Case B: Still 'online' but stale heartbeat
        else if (playerStatus === "online" && timeSinceLastSeen > STALE_HEARTBEAT_THRESHOLD) {
          logger.debug(`[MP] Stale heartbeat: ${player.name} (${timeSinceLastSeen}ms, still 'online')`);
          try {
            await update(ref(database, `rooms/${roomId}/players/${player.id}`), {
              status: "disconnected" as PlayerStatus,
            });
          } catch (err) {
            logger.warn("[MP] Failed to mark stale player:", err);
          }
        }
      }
    };

    checkOfflinePlayers();
    cleanupIntervalRef.current = setInterval(checkOfflinePlayers, CLEANUP_INTERVAL);

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
        cleanupIntervalRef.current = null;
      }
    };
  }, [roomId, hostId, playerId]);
}
