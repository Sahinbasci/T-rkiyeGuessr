"use client";

/**
 * useBeforeUnload — Fire-and-forget status update on tab close.
 *
 * Extracted from useRoom.ts Effect 3.
 *
 * Primary protection is onDisconnect (handled by usePresence).
 * This is a secondary best-effort signal.
 */

import { useEffect } from "react";
import { database, ref, update } from "@/config/firebase";
import type { PlayerStatus } from "@/types";

export interface UseBeforeUnloadParams {
  roomId: string | null;
  playerId: string;
}

export function useBeforeUnload({ roomId, playerId }: UseBeforeUnloadParams): void {
  useEffect(() => {
    if (!roomId || !playerId) return;

    const handleBeforeUnload = () => {
      const playerRef = ref(database, `rooms/${roomId}/players/${playerId}`);
      update(playerRef, {
        status: "disconnected" as PlayerStatus,
      }).catch(() => {
        /* tab closing, ignore */
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [roomId, playerId]);
}
