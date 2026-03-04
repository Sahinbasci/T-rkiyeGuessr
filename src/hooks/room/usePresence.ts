"use client";

/**
 * usePresence — Heartbeat and onDisconnect management.
 *
 * Extracted from useRoom.ts Effect 1.
 *
 * Responsibilities:
 * - Register onDisconnect handler (marks player as disconnected server-side)
 * - Heartbeat interval (updates lastSeen + status every 5s)
 * - Host-only: writes meta/serverNow during "playing" status
 * - Connection state tracking (online/reconnecting/lost)
 */

import { useEffect, useRef, useState } from "react";
import {
  database,
  ref,
  update,
  onDisconnect,
  serverTimestamp,
} from "@/config/firebase";
import type { PlayerStatus } from "@/types";
import { HEARTBEAT_FAIL_THRESHOLD } from "@/utils/roomLogic";
import { ROOM_CONSTANTS } from "./types";

const { HEARTBEAT_INTERVAL } = ROOM_CONSTANTS;

export interface UsePresenceParams {
  roomId: string | null;
  playerId: string;
  /** Mirror refs to avoid stale closure. Updated externally by the parent hook. */
  roomStatusRef: React.MutableRefObject<string | null>;
  roomHostIdRef: React.MutableRefObject<string | null>;
  roomIdRef: React.MutableRefObject<string | null>;
}

export interface UsePresenceReturn {
  connectionState: "online" | "reconnecting" | "lost";
}

export function usePresence({
  roomId,
  playerId,
  roomStatusRef,
  roomHostIdRef,
  roomIdRef,
}: UsePresenceParams): UsePresenceReturn {
  const [connectionState, setConnectionState] = useState<"online" | "reconnecting" | "lost">("online");
  const consecutiveHeartbeatFailsRef = useRef<number>(0);
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!roomId || !playerId) return;

    const playerRef = ref(database, `rooms/${roomId}/players/${playerId}`);

    // Register onDisconnect ONCE
    const disconnectRef = onDisconnect(playerRef);
    disconnectRef.update({
      status: "disconnected" as PlayerStatus,
    });

    // Heartbeat: update lastSeen every HEARTBEAT_INTERVAL
    const updatePresence = async () => {
      try {
        await update(playerRef, {
          lastSeen: Date.now(),
          status: "online" as PlayerStatus,
        });
        // FLOOD CONTROL: Only write serverNow while room is "playing"
        if (
          playerId === roomHostIdRef.current &&
          roomStatusRef.current === "playing" &&
          roomIdRef.current
        ) {
          await update(ref(database, `rooms/${roomIdRef.current}/meta`), {
            serverNow: serverTimestamp(),
          });
        }
        consecutiveHeartbeatFailsRef.current = 0;
        setConnectionState("online");
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || "";
        const message = (err as { message?: string })?.message || "";
        if (code === "PERMISSION_DENIED" || code === "permission-denied") {
          setConnectionState("lost");
        } else if (message.includes("not found") || message.includes("deleted")) {
          setConnectionState("lost");
        } else {
          consecutiveHeartbeatFailsRef.current++;
          if (consecutiveHeartbeatFailsRef.current >= HEARTBEAT_FAIL_THRESHOLD) {
            setConnectionState("lost");
          } else if (consecutiveHeartbeatFailsRef.current >= 2) {
            setConnectionState("reconnecting");
          }
        }
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
      disconnectRef.cancel();
    };
  }, [roomId, playerId, roomStatusRef, roomHostIdRef, roomIdRef]);

  return { connectionState };
}
