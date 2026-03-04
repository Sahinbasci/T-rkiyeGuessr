"use client";

/**
 * useClientResync — Non-host stuck snapshot recovery.
 *
 * Extracted from useRoom.ts Effect 7.
 *
 * Responsibilities:
 * - After a non-host client has guessed, polls Firebase every 2s
 * - Detects: status changed, round changed, roundResults appeared
 * - Forces local state update if Firebase diverged from onValue snapshot
 * - Safety timeout after 15s to prevent infinite Firebase reads
 */

import { useEffect, useRef } from "react";
import { database, ref, get } from "@/config/firebase";
import type { Room } from "@/types";
import { logger } from "@/utils/logger";
import { trackEvent } from "@/utils/telemetry";

export interface UseClientResyncParams {
  roomId: string | null;
  playerId: string;
  hostId: string | null;
  roomStatus: string | null;
  currentRound: number | null;
  hasGuessed: boolean;
  /** Reset local locks/guards so UI can rebuild from fresh room state. */
  hardResync: () => void;
  /** Force-set the room state. */
  setRoom: (room: Room) => void;
}

export function useClientResync({
  roomId,
  playerId,
  hostId,
  roomStatus,
  currentRound,
  hasGuessed,
  hardResync,
  setRoom,
}: UseClientResyncParams): void {
  const clientResyncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const clientResyncDelayRef = useRef<NodeJS.Timeout | null>(null);
  const clientResyncSafetyRef = useRef<NodeJS.Timeout | null>(null);
  const clientGuessTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!roomId || !playerId) return;
    // Host has its own watchdog — skip
    if (playerId === hostId) return;
    // Only active during playing
    if (roomStatus !== "playing") {
      clientGuessTimestampRef.current = null;
      return;
    }
    // Only active after this client has guessed
    if (!hasGuessed) return;

    // Record when we first detected hasGuessed
    if (!clientGuessTimestampRef.current) {
      clientGuessTimestampRef.current = Date.now();
    }

    const expectedRound = currentRound!;
    const roomRefLocal = ref(database, `rooms/${roomId}`);

    // BUG-9 FIX: Track mounted state
    let isMounted = true;

    // Start polling with 2s delay, then every 2s
    clientResyncDelayRef.current = setTimeout(() => {
      if (!isMounted) return;
      clientResyncDelayRef.current = null;

      clientResyncIntervalRef.current = setInterval(async () => {
        if (!isMounted) return;
        try {
          const freshSnap = await get(roomRefLocal);
          const freshRoom = freshSnap.val() as Room | null;

          if (!freshRoom) return;

          // Case 1: Status changed
          if (freshRoom.status !== "playing") {
            logger.debug(`[MP] ClientResync: status=${freshRoom.status} (was playing), forcing local update`);
            trackEvent("resync_applied", { trigger: "status_change", newStatus: freshRoom.status, round: expectedRound });
            hardResync();
            setRoom(freshRoom);
            return;
          }

          // Case 2: Round changed
          if (freshRoom.currentRound !== expectedRound) {
            logger.debug(`[MP] ClientResync: round=${freshRoom.currentRound} (expected ${expectedRound}), forcing local update`);
            trackEvent("resync_applied", { trigger: "round_mismatch", dbRound: freshRoom.currentRound, expected: expectedRound });
            hardResync();
            setRoom(freshRoom);
            return;
          }

          // Case 3: roundResults appeared but status still "playing"
          if (freshRoom.roundResults && Array.isArray(freshRoom.roundResults) && freshRoom.roundResults.length > 0) {
            logger.debug(`[MP] ClientResync: roundResults present but status still playing, forcing local update`);
            trackEvent("resync_applied", { trigger: "roundResults_leak", round: expectedRound });
            hardResync();
            setRoom(freshRoom);
            return;
          }
        } catch (err) {
          logger.warn("[MP] ClientResync poll failed:", err);
        }
      }, 2000);
    }, 2000);

    // Safety: stop polling after 15s max
    clientResyncSafetyRef.current = setTimeout(() => {
      clientResyncSafetyRef.current = null;
      if (clientResyncIntervalRef.current) {
        clearInterval(clientResyncIntervalRef.current);
        clientResyncIntervalRef.current = null;
        logger.debug("[MP] ClientResync: safety timeout (15s), stopping polling");
      }
    }, 15000);

    return () => {
      isMounted = false;
      if (clientResyncDelayRef.current) {
        clearTimeout(clientResyncDelayRef.current);
        clientResyncDelayRef.current = null;
      }
      if (clientResyncIntervalRef.current) {
        clearInterval(clientResyncIntervalRef.current);
        clientResyncIntervalRef.current = null;
      }
      if (clientResyncSafetyRef.current) {
        clearTimeout(clientResyncSafetyRef.current);
        clientResyncSafetyRef.current = null;
      }
      clientGuessTimestampRef.current = null;
    };
  }, [roomId, roomStatus, hostId, currentRound, hasGuessed, playerId, hardResync, setRoom]);
}
