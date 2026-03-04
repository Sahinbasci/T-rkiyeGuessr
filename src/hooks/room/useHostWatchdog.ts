"use client";

/**
 * useHostWatchdog — Host-only stuck round watchdog.
 *
 * Extracted from useRoom.ts Effect 6.
 *
 * Responsibilities:
 * - Independent interval that guarantees no round stays stuck in "playing" forever
 * - Uses server-authoritative time (serverNow from meta/) for elapsed calculation
 * - Detects stuck processing state and forces reset
 * - Handles stale roundEndLock override
 * - Max attempts with forced recovery fallback
 */

import { useEffect, useRef } from "react";
import {
  database,
  ref,
  get,
  update,
} from "@/config/firebase";
import type { Room } from "@/types";
import { computeRoundResults, updatePlayersAfterRound } from "@/utils/roomLogic";
import { logger } from "@/utils/logger";
import { trackEvent, trackError } from "@/utils/telemetry";
import type { ProcessingGuard, RoundEndLock, RoundEndTimingContext } from "./types";
import { ROOM_CONSTANTS } from "./types";

const {
  WATCHDOG_INTERVAL,
  WATCHDOG_BUFFER,
  WATCHDOG_MAX_ATTEMPTS,
  WATCHDOG_LOCK_STALE_THRESHOLD,
  PROCESSING_STUCK_THRESHOLD,
} = ROOM_CONSTANTS;

// Per-session counters
const watchdogCounters = {
  firedCount: 0,
  failureCount: 0,
};

export interface UseHostWatchdogParams {
  roomId: string | null;
  hostId: string | null;
  playerId: string;
  roomStatus: string | null;
  roundStartTime: number | null;
  timeLimit: number | null;
  currentRound: number | null;
  processingGuard: ProcessingGuard;
  acquireAndWriteRoundEnd: (
    roomId: string,
    roundId: number,
    snapshotPlayerIds: string[] | null,
    snapshotLocation: { lat: number; lng: number } | null,
    ownerId: string,
    trigger: string,
    timingContext?: RoundEndTimingContext,
    forceOverrideStaleLock?: boolean
  ) => Promise<void>;
}

export function useHostWatchdog({
  roomId,
  hostId,
  playerId,
  roomStatus,
  roundStartTime,
  timeLimit: timeLimitProp,
  currentRound,
  processingGuard,
  acquireAndWriteRoundEnd,
}: UseHostWatchdogParams): void {
  const watchdogIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogAttemptsRef = useRef<number>(0);

  useEffect(() => {
    if (!roomId || !playerId) return;
    if (playerId !== hostId) return;
    if (roomStatus !== "playing") return;
    if (!roundStartTime) return;

    const expectedRound = currentRound!;
    const timeLimit = timeLimitProp || 90;
    const capturedRoundStartTime = roundStartTime;

    // Reset attempts for this new effect run
    watchdogAttemptsRef.current = 0;

    watchdogIntervalRef.current = setInterval(async () => {
      // 1. Read FRESH room data
      let freshSnap;
      try {
        freshSnap = await get(ref(database, `rooms/${roomId}`));
      } catch {
        return;
      }

      const freshRoom = freshSnap.val() as Room | null;

      // 2-5. Guard checks
      if (!freshRoom) return;
      if (freshRoom.status !== "playing") return;
      if (freshRoom.currentRound !== expectedRound) return;
      if (freshRoom.hostId !== playerId) return;

      // 6. Compute elapsed using server time
      const meta = freshSnap.child("meta").val() as { serverNow?: number } | null;
      let elapsed: number;
      if (meta?.serverNow) {
        elapsed = (meta.serverNow - capturedRoundStartTime) / 1000;
      } else {
        elapsed = (Date.now() - capturedRoundStartTime) / 1000;
        logger.debug("[MP] Watchdog using client time fallback (serverNow missing)");
      }

      // 7. Timer hasn't expired yet
      if (elapsed <= timeLimit + WATCHDOG_BUFFER) return;

      // 8. Timer expired
      // a. Skip if already processing — BUT detect stuck state
      if (processingGuard.isProcessingRef.current) {
        const stuckDuration = processingGuard.processingStartTimeRef.current
          ? Date.now() - processingGuard.processingStartTimeRef.current
          : 0;
        if (stuckDuration < PROCESSING_STUCK_THRESHOLD) {
          return;
        }
        processingGuard.forceResetProcessing(`watchdog_stuck_${stuckDuration}ms`);
        watchdogCounters.firedCount++;
      }

      // b. Check roundEndLock state
      let staleLockDetected = false;
      const existingLock = (freshRoom as any).roundEndLock as RoundEndLock | undefined;
      if (existingLock && existingLock.roundId === expectedRound) {
        if ((freshRoom.status as string) === "roundEnd") {
          return;
        }
        const lockAge = (meta?.serverNow || Date.now()) - existingLock.lockedAt;
        if (lockAge < WATCHDOG_LOCK_STALE_THRESHOLD) {
          logger.debug(
            `[MP] Watchdog: lock held by ${existingLock.lockedBy.substring(0, 8)}, age=${lockAge}ms — waiting`
          );
          return;
        }
        staleLockDetected = true;
        logger.debug(`[MP] Watchdog: stale lock detected (age=${lockAge}ms), forcing override`);
      }

      // c. Increment attempts
      watchdogAttemptsRef.current++;

      // d. Max attempts exceeded — forced recovery
      if (watchdogAttemptsRef.current > WATCHDOG_MAX_ATTEMPTS) {
        watchdogCounters.failureCount++;
        logger.error(
          `[MP] Watchdog FAILURE: max attempts (${WATCHDOG_MAX_ATTEMPTS}) exceeded — attempting forced recovery`
        );

        try {
          const emergencySnap = await get(ref(database, `rooms/${roomId}`));
          const emergencyRoom = emergencySnap.val() as Room | null;

          if (!emergencyRoom || emergencyRoom.status !== "playing") {
            trackEvent("watchdogRecoverySkipped", { reason: "already_resolved", status: emergencyRoom?.status });
            return;
          }
          if (emergencyRoom.currentRound !== expectedRound) {
            trackEvent("watchdogRecoverySkipped", { reason: "round_mismatch", dbRound: emergencyRoom.currentRound, expected: expectedRound });
            return;
          }

          const emergencyPlayers = Object.values(emergencyRoom.players || {});
          const emergencyLocation = emergencyRoom.currentLocation;
          if (emergencyLocation && emergencyPlayers.length > 0) {
            const results = computeRoundResults(emergencyPlayers, emergencyLocation);
            const updatedPlayers = updatePlayersAfterRound(emergencyRoom.players || {}, results);

            await update(ref(database, `rooms/${roomId}`), {
              status: "roundEnd",
              roundState: "ended",
              roundResults: results,
              players: updatedPlayers,
              roundEndLock: { lockedBy: playerId, roundId: expectedRound, lockedAt: Date.now() },
            });

            trackEvent("watchdogForceRecovery", {
              round: expectedRound,
              attempt: watchdogAttemptsRef.current,
              playerCount: emergencyPlayers.length,
              guessCount: results.filter((r) => r.distance < 9999).length,
            });
            logger.error(`[MP] Watchdog FORCED roundEnd: round=${expectedRound} players=${emergencyPlayers.length}`);
          } else {
            trackEvent("watchdogRecoverySkipped", { reason: "no_location_or_players" });
          }
        } catch (forceErr) {
          logger.error("[MP] Watchdog forced recovery error:", forceErr);
          trackError(forceErr instanceof Error ? forceErr : String(forceErr), "watchdogForceRecovery");
        }
        return;
      }

      // e. Attempt resolution
      trackEvent("watchdogTick", {
        attempt: watchdogAttemptsRef.current,
        elapsed: parseFloat(elapsed.toFixed(1)),
        status: freshRoom.status,
        staleLock: staleLockDetected,
      });
      if (!processingGuard.startProcessing("watchdog", expectedRound)) return;
      try {
        watchdogCounters.firedCount++;
        logger.debug(
          `[MP] Watchdog resolution: round=${expectedRound} elapsed=${elapsed.toFixed(1)}s attempt=${watchdogAttemptsRef.current} staleLock=${staleLockDetected}`
        );
        await acquireAndWriteRoundEnd(
          roomId,
          expectedRound,
          null,
          freshRoom.currentLocation,
          playerId,
          "watchdog",
          { serverNow: meta?.serverNow },
          staleLockDetected
        );
      } catch (err) {
        logger.error("[MP] Watchdog acquireAndWriteRoundEnd error:", err);
        trackError(err instanceof Error ? err : String(err), "watchdogResolution");
      } finally {
        processingGuard.stopProcessing("watchdog_complete");
      }
    }, WATCHDOG_INTERVAL);

    return () => {
      if (watchdogIntervalRef.current) {
        clearInterval(watchdogIntervalRef.current);
        watchdogIntervalRef.current = null;
      }
    };
  }, [roomId, hostId, roomStatus, roundStartTime, timeLimitProp, currentRound, playerId, processingGuard, acquireAndWriteRoundEnd]);
}

/** Expose counters for telemetry. */
export function getWatchdogCounters() {
  return { ...watchdogCounters };
}
