/**
 * Room State Machine — Pure Functions
 *
 * Deterministic state transitions for the multiplayer room lifecycle.
 * NO side effects, NO Firebase, NO React. Fully testable.
 *
 * Valid state transitions:
 *   waiting   -> playing   (START_GAME)
 *   playing   -> roundEnd  (END_ROUND)
 *   roundEnd  -> playing   (NEXT_ROUND)
 *   roundEnd  -> gameOver  (GAME_OVER)
 *   gameOver  -> waiting   (RESTART)
 *
 * Invalid: any other transition returns { valid: false }.
 */

import type { Room, Player, Coordinates, PanoPackage, RoundResult } from "@/types";
import { resetPlayerForNewRound } from "@/utils/roomLogic";

// ==================== ACTION TYPES ====================

export type RoomAction =
  | { type: "START_GAME"; panoPackage: PanoPackage; serverNow: number }
  | { type: "START_GAME_LEGACY"; location: Coordinates; panoId: string; locationName?: string; serverNow: number }
  | { type: "END_ROUND"; results: RoundResult[]; updatedPlayers: Record<string, Player>; lockOwnerId: string; roundId: number }
  | { type: "NEXT_ROUND"; panoPackage: PanoPackage; serverNow: number }
  | { type: "NEXT_ROUND_LEGACY"; location: Coordinates; panoId: string; locationName?: string; serverNow: number }
  | { type: "GAME_OVER" }
  | { type: "RESTART"; gameInstanceId: string }
  | { type: "HOST_MIGRATE"; newHostId: string; oldHostId: string }
  | { type: "PLAYER_JOIN"; player: Player }
  | { type: "PLAYER_LEAVE"; playerId: string; newHostId?: string };

// ==================== TRANSITION RESULT ====================

export interface TransitionResult {
  valid: boolean;
  reason?: string;
  /** The partial room update to apply (only the changed fields). null if invalid. */
  patch: Partial<Room> | null;
}

// ==================== HELPERS ====================

function countOnline(players: Record<string, Player>): number {
  return Object.values(players).filter(
    (p) => !p.status || p.status === "online"
  ).length;
}

function resetPlayersForRound(players: Record<string, Player>): Record<string, Player> {
  const result: Record<string, Player> = {};
  for (const [id, p] of Object.entries(players)) {
    result[id] = resetPlayerForNewRound(p);
  }
  return result;
}

// ==================== STATE MACHINE ====================

/**
 * Pure state transition function.
 *
 * Given the current room state and an action, returns a TransitionResult
 * indicating whether the transition is valid and the resulting state patch.
 *
 * Does NOT mutate the input room. Caller is responsible for applying the patch.
 */
export function transitionRoom(room: Room, action: RoomAction): TransitionResult {
  switch (action.type) {
    case "START_GAME": {
      if (room.status !== "waiting") {
        return { valid: false, reason: `Cannot START_GAME from ${room.status}`, patch: null };
      }
      const onlineCount = countOnline(room.players || {});
      const updatedPlayers = resetPlayersForRound(room.players || {});
      return {
        valid: true,
        patch: {
          status: "playing",
          currentRound: 1,
          currentPanoPackageId: action.panoPackage.id,
          currentPanoPackage: action.panoPackage,
          currentLocation: { lat: action.panoPackage.pano0.lat, lng: action.panoPackage.pano0.lng },
          currentLocationName: action.panoPackage.locationName,
          players: updatedPlayers,
          roundResults: null,
          roundStartTime: action.serverNow,
          roundState: "active",
          roundVersion: (room.roundVersion || 0) + 1,
          activePlayerCount: onlineCount,
          expectedGuesses: onlineCount,
          currentGuesses: 0,
        },
      };
    }

    case "START_GAME_LEGACY": {
      if (room.status !== "waiting") {
        return { valid: false, reason: `Cannot START_GAME_LEGACY from ${room.status}`, patch: null };
      }
      const onlineCount = countOnline(room.players || {});
      const updatedPlayers = resetPlayersForRound(room.players || {});
      return {
        valid: true,
        patch: {
          status: "playing",
          currentRound: 1,
          currentLocation: action.location,
          currentPanoPackageId: action.panoId,
          currentLocationName: action.locationName || null,
          players: updatedPlayers,
          roundResults: null,
          roundStartTime: action.serverNow,
          roundState: "active",
          roundVersion: (room.roundVersion || 0) + 1,
          activePlayerCount: onlineCount,
          expectedGuesses: onlineCount,
          currentGuesses: 0,
        },
      };
    }

    case "END_ROUND": {
      if (room.status !== "playing") {
        return { valid: false, reason: `Cannot END_ROUND from ${room.status}`, patch: null };
      }
      if (room.currentRound !== action.roundId) {
        return { valid: false, reason: `Round mismatch: current=${room.currentRound}, action=${action.roundId}`, patch: null };
      }
      return {
        valid: true,
        patch: {
          status: "roundEnd",
          roundState: "ended",
          roundResults: action.results,
          players: action.updatedPlayers,
        },
      };
    }

    case "NEXT_ROUND": {
      if (room.status !== "roundEnd") {
        return { valid: false, reason: `Cannot NEXT_ROUND from ${room.status}`, patch: null };
      }
      if (room.currentRound >= room.totalRounds) {
        return { valid: false, reason: `All ${room.totalRounds} rounds completed`, patch: null };
      }
      const onlineCount = countOnline(room.players || {});
      const updatedPlayers = resetPlayersForRound(room.players || {});
      return {
        valid: true,
        patch: {
          status: "playing",
          currentRound: room.currentRound + 1,
          currentPanoPackageId: action.panoPackage.id,
          currentPanoPackage: action.panoPackage,
          currentLocation: { lat: action.panoPackage.pano0.lat, lng: action.panoPackage.pano0.lng },
          currentLocationName: action.panoPackage.locationName,
          players: updatedPlayers,
          roundResults: null,
          roundStartTime: action.serverNow,
          roundState: "active",
          roundVersion: (room.roundVersion || 0) + 1,
          activePlayerCount: onlineCount,
          expectedGuesses: onlineCount,
          currentGuesses: 0,
        },
      };
    }

    case "NEXT_ROUND_LEGACY": {
      if (room.status !== "roundEnd") {
        return { valid: false, reason: `Cannot NEXT_ROUND_LEGACY from ${room.status}`, patch: null };
      }
      if (room.currentRound >= room.totalRounds) {
        return { valid: false, reason: `All ${room.totalRounds} rounds completed`, patch: null };
      }
      const onlineCount = countOnline(room.players || {});
      const updatedPlayers = resetPlayersForRound(room.players || {});
      return {
        valid: true,
        patch: {
          status: "playing",
          currentRound: room.currentRound + 1,
          currentLocation: action.location,
          currentPanoPackageId: action.panoId,
          currentLocationName: action.locationName || null,
          players: updatedPlayers,
          roundResults: null,
          roundStartTime: action.serverNow,
          roundState: "active",
          roundVersion: (room.roundVersion || 0) + 1,
          activePlayerCount: onlineCount,
          expectedGuesses: onlineCount,
          currentGuesses: 0,
        },
      };
    }

    case "GAME_OVER": {
      if (room.status !== "roundEnd") {
        return { valid: false, reason: `Cannot GAME_OVER from ${room.status}`, patch: null };
      }
      return {
        valid: true,
        patch: {
          status: "gameOver",
          roundState: "ended",
        },
      };
    }

    case "RESTART": {
      if (room.status !== "gameOver" && room.status !== "waiting") {
        return { valid: false, reason: `Cannot RESTART from ${room.status}`, patch: null };
      }
      if (room.status === "waiting") {
        // Idempotent: already in waiting, no-op
        return { valid: true, patch: null };
      }
      const resetPlayers: Record<string, Player> = {};
      for (const [id, p] of Object.entries(room.players || {})) {
        resetPlayers[id] = {
          ...p,
          totalScore: 0,
          currentGuess: null,
          hasGuessed: false,
          movesUsed: 0,
          roundScores: [],
        };
      }
      return {
        valid: true,
        patch: {
          status: "waiting",
          currentRound: 0,
          currentLocation: null,
          currentPanoPackageId: null,
          currentPanoPackage: null,
          currentLocationName: null,
          roundResults: null,
          roundStartTime: null,
          players: resetPlayers,
          roundState: "waiting",
          activePlayerCount: 0,
          expectedGuesses: 0,
          currentGuesses: 0,
        },
      };
    }

    case "HOST_MIGRATE": {
      const newHostPlayer = room.players?.[action.newHostId];
      const oldHostPlayer = room.players?.[action.oldHostId];
      if (!newHostPlayer) {
        return { valid: false, reason: `New host ${action.newHostId} not found`, patch: null };
      }
      const updatedPlayers = { ...room.players };
      updatedPlayers[action.newHostId] = { ...newHostPlayer, isHost: true };
      if (oldHostPlayer) {
        updatedPlayers[action.oldHostId] = { ...oldHostPlayer, isHost: false };
      }
      return {
        valid: true,
        patch: {
          hostId: action.newHostId,
          players: updatedPlayers,
        },
      };
    }

    case "PLAYER_JOIN": {
      const updatedPlayers = { ...room.players, [action.player.id]: action.player };
      return {
        valid: true,
        patch: {
          players: updatedPlayers,
        },
      };
    }

    case "PLAYER_LEAVE": {
      const updatedPlayers = { ...room.players };
      delete updatedPlayers[action.playerId];
      const patch: Partial<Room> = { players: updatedPlayers };
      if (action.newHostId) {
        patch.hostId = action.newHostId;
        if (updatedPlayers[action.newHostId]) {
          updatedPlayers[action.newHostId] = { ...updatedPlayers[action.newHostId], isHost: true };
        }
      }
      return {
        valid: true,
        patch,
      };
    }

    default:
      return { valid: false, reason: "Unknown action type", patch: null };
  }
}

/**
 * Apply a patch to a room, returning a new Room object (immutable).
 */
export function applyPatch(room: Room, patch: Partial<Room> | null): Room {
  if (!patch) return room;
  return { ...room, ...patch };
}
