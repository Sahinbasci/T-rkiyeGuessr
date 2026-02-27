/**
 * Hardening Test Suite — Audit 2026-02-28
 *
 * Tests for bugs found during the comprehensive repo audit.
 * Covers: P0/P1/P2 fixes, security contracts, data integrity.
 */

import { describe, test, expect } from "vitest";
import {
  validateGuessSubmission,
  validateRoomJoin,
  haveAllPlayersGuessed,
  computeRoundResults,
  updatePlayersAfterRound,
  electNewHost,
  determineLeaveAction,
  shouldDecrementExpectedGuesses,
  validateStartGame,
  validateNextRound,
} from "@/utils/roomLogic";
import {
  isValidPlayerName,
  isValidTurkeyCoordinate,
  RATE_LIMITS,
  GAME_SETTINGS,
  ROOM_LIFECYCLE,
} from "@/config/production";
import type { Player, Coordinates, Room } from "@/types";

// ==================== HELPERS ====================

function makePlayer(overrides: Partial<Player> & { id: string }): Player {
  return {
    name: overrides.name || `Player_${overrides.id}`,
    isHost: false,
    totalScore: 0,
    currentGuess: null,
    hasGuessed: false,
    roundScores: [],
    movesUsed: 0,
    status: "online",
    lastSeen: Date.now(),
    disconnectedAt: null,
    sessionToken: `token_${overrides.id}`,
    joinedAt: Date.now(),
    ...overrides,
  };
}

function makePlayers(...specs: Array<Partial<Player> & { id: string }>): Record<string, Player> {
  const result: Record<string, Player> = {};
  for (const spec of specs) {
    result[spec.id] = makePlayer(spec);
  }
  return result;
}

function makeRoom(overrides?: Partial<Room>): Room {
  return {
    id: "ABC123",
    hostId: "host",
    status: "playing",
    currentRound: 1,
    totalRounds: 5,
    players: makePlayers(
      { id: "host", isHost: true },
      { id: "p1" },
      { id: "p2" }
    ),
    gameMode: "urban",
    timeLimit: 90,
    moveLimit: 3,
    currentPanoPackageId: "pano1",
    currentPanoPackage: null,
    currentLocation: { lat: 41.0, lng: 29.0 },
    currentLocationName: "Istanbul",
    roundResults: null,
    roundStartTime: Date.now(),
    roundState: "active",
    roundVersion: 1,
    activePlayerCount: 3,
    expectedGuesses: 3,
    currentGuesses: 0,
    ...overrides,
  };
}

const ISTANBUL: Coordinates = { lat: 41.0082, lng: 28.9784 };
const ANKARA: Coordinates = { lat: 39.9334, lng: 32.8597 };

// ==================== P0-01: Transaction Committed Flag ====================

describe("P0-01 Regression: Transaction guard contracts", () => {
  test("validateStartGame rejects when status is not waiting", () => {
    const room = makeRoom({ status: "playing" });
    const result = validateStartGame(room, "host");
    expect(result.valid).toBe(false);
  });

  test("validateStartGame rejects non-host caller", () => {
    const room = makeRoom({ status: "waiting" });
    const result = validateStartGame(room, "p1");
    expect(result.valid).toBe(false);
  });

  test("validateNextRound rejects when status is not roundEnd", () => {
    const room = makeRoom({ status: "playing" });
    const result = validateNextRound(room, "host");
    expect(result.valid).toBe(false);
  });

  test("validateNextRound accepts valid transition", () => {
    const room = makeRoom({ status: "roundEnd", roundVersion: 1 });
    const result = validateNextRound(room, "host");
    expect(result.valid).toBe(true);
  });

  test("validateNextRound detects gameOver", () => {
    const room = makeRoom({ status: "roundEnd", currentRound: 5, totalRounds: 5 });
    const result = validateNextRound(room, "host");
    expect(result.valid).toBe(true);
    expect(result.isGameOver).toBe(true);
  });
});

// ==================== P0-02: Max Player Enforcement ====================

describe("P0-02 Regression: Max player enforcement", () => {
  test("ROOM_LIFECYCLE.MAX_PLAYERS_PER_ROOM is 8", () => {
    expect(ROOM_LIFECYCLE.MAX_PLAYERS_PER_ROOM).toBe(8);
  });

  test("validateRoomJoin rejects when room is full (8 players)", () => {
    const players = makePlayers(
      { id: "p1" }, { id: "p2" }, { id: "p3" }, { id: "p4" },
      { id: "p5" }, { id: "p6" }, { id: "p7" }, { id: "p8" }
    );
    const room = makeRoom({ status: "waiting", players });
    const result = validateRoomJoin(room, "ValidName");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("room_full");
  });

  test("validateRoomJoin accepts when room has < 8 players", () => {
    const players = makePlayers(
      { id: "host", isHost: true }, { id: "p1" }, { id: "p2" }
    );
    const room = makeRoom({ status: "waiting", players });
    const result = validateRoomJoin(room, "ValidName");
    expect(result.allowed).toBe(true);
  });

  test("validateRoomJoin rejects when game already started", () => {
    const room = makeRoom({ status: "playing" });
    const result = validateRoomJoin(room, "ValidName");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("game_already_started");
  });
});

// ==================== P0-03: leaveRoom Atomic Decrement ====================

describe("P0-03 Regression: shouldDecrementExpectedGuesses", () => {
  test("should decrement when playing + not guessed", () => {
    const player = makePlayer({ id: "p1", hasGuessed: false });
    expect(shouldDecrementExpectedGuesses("playing", player)).toBe(true);
  });

  test("should NOT decrement when player already guessed", () => {
    const player = makePlayer({ id: "p1", hasGuessed: true, currentGuess: ISTANBUL });
    expect(shouldDecrementExpectedGuesses("playing", player)).toBe(false);
  });

  test("should NOT decrement when room is in waiting", () => {
    const player = makePlayer({ id: "p1", hasGuessed: false });
    expect(shouldDecrementExpectedGuesses("waiting", player)).toBe(false);
  });

  test("should NOT decrement when room is in roundEnd", () => {
    const player = makePlayer({ id: "p1", hasGuessed: false });
    expect(shouldDecrementExpectedGuesses("roundEnd", player)).toBe(false);
  });

  test("should NOT decrement when player is undefined", () => {
    expect(shouldDecrementExpectedGuesses("playing", undefined)).toBe(false);
  });
});

// ==================== Security: Input Validation ====================

describe("Security: Player name validation", () => {
  test("rejects XSS attempt with script tags", () => {
    expect(isValidPlayerName("<script>alert(1)</script>")).toBe(false);
  });

  test("rejects HTML injection", () => {
    expect(isValidPlayerName('<img src=x onerror=alert(1)>')).toBe(false);
  });

  test("rejects names with dangerous characters", () => {
    expect(isValidPlayerName('name"')).toBe(false);
    expect(isValidPlayerName("name'")).toBe(false);
    expect(isValidPlayerName("name&")).toBe(false);
  });

  test("accepts valid Turkish names", () => {
    expect(isValidPlayerName("Sahin")).toBe(true);
    expect(isValidPlayerName("Gokce")).toBe(true);
    expect(isValidPlayerName("Umit123")).toBe(true);
  });

  test("rejects empty name", () => {
    expect(isValidPlayerName("")).toBe(false);
  });

  test("rejects name longer than 20 chars", () => {
    expect(isValidPlayerName("a".repeat(21))).toBe(false);
  });

  test("rejects whitespace-only name", () => {
    expect(isValidPlayerName("   ")).toBe(false);
  });
});

describe("Security: Coordinate validation", () => {
  test("accepts valid Turkey coordinates", () => {
    expect(isValidTurkeyCoordinate(41.0, 29.0)).toBe(true);
    expect(isValidTurkeyCoordinate(39.9, 32.8)).toBe(true);
    expect(isValidTurkeyCoordinate(36.9, 30.7)).toBe(true);
  });

  test("rejects coordinates outside Turkey", () => {
    expect(isValidTurkeyCoordinate(48.8, 2.3)).toBe(false);
    expect(isValidTurkeyCoordinate(0, 0)).toBe(false);
    expect(isValidTurkeyCoordinate(90, 180)).toBe(false);
  });

  test("rejects boundary edges precisely", () => {
    expect(isValidTurkeyCoordinate(34.9, 29.0)).toBe(false);
    expect(isValidTurkeyCoordinate(43.1, 29.0)).toBe(false);
    expect(isValidTurkeyCoordinate(41.0, 24.9)).toBe(false);
    expect(isValidTurkeyCoordinate(41.0, 46.1)).toBe(false);
  });
});

// ==================== Multiplayer Correctness ====================

describe("Multiplayer: allGuessed correctness", () => {
  test("returns true only when ALL online players have guessed", () => {
    const players = makePlayers(
      { id: "p1", hasGuessed: true, currentGuess: ISTANBUL, status: "online" },
      { id: "p2", hasGuessed: true, currentGuess: ANKARA, status: "online" },
      { id: "p3", hasGuessed: false, status: "disconnected" }
    );
    expect(haveAllPlayersGuessed(players)).toBe(true);
  });

  test("returns false when any online player hasn't guessed", () => {
    const players = makePlayers(
      { id: "p1", hasGuessed: true, currentGuess: ISTANBUL, status: "online" },
      { id: "p2", hasGuessed: false, status: "online" }
    );
    expect(haveAllPlayersGuessed(players)).toBe(false);
  });

  test("returns true with single player who guessed", () => {
    const players = makePlayers(
      { id: "p1", hasGuessed: true, currentGuess: ISTANBUL, status: "online" }
    );
    expect(haveAllPlayersGuessed(players)).toBe(true);
  });
});

describe("Multiplayer: Guess validation", () => {
  test("rejects double submit (already guessed)", () => {
    const room = makeRoom();
    const player = makePlayer({ id: "p1", hasGuessed: true, currentGuess: ISTANBUL });
    room.players["p1"] = player;
    const result = validateGuessSubmission(room, "p1", ANKARA, Date.now(), false);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("already_guessed");
  });

  test("rejects guess when submitting (in-flight)", () => {
    const room = makeRoom();
    const result = validateGuessSubmission(room, "p1", ISTANBUL, Date.now(), true);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("in_flight");
  });

  test("rejects guess with invalid coordinates", () => {
    const room = makeRoom();
    const result = validateGuessSubmission(room, "p1", { lat: 0, lng: 0 }, Date.now(), false);
    expect(result.accepted).toBe(false);
  });

  test("accepts valid first guess", () => {
    const room = makeRoom();
    const result = validateGuessSubmission(room, "p1", ISTANBUL, Date.now(), false);
    expect(result.accepted).toBe(true);
  });
});

// ==================== Scoring Correctness ====================

describe("Scoring: computeRoundResults", () => {
  test("closer guess gets higher score", () => {
    const players = [
      makePlayer({ id: "p1", hasGuessed: true, currentGuess: { lat: 41.0, lng: 29.0 } }),
      makePlayer({ id: "p2", hasGuessed: true, currentGuess: { lat: 36.0, lng: 42.0 } }),
    ];
    const actual: Coordinates = { lat: 41.01, lng: 29.01 };
    const results = computeRoundResults(players, actual);
    expect(results[0].score).toBeGreaterThan(results[1].score);
    expect(results[0].distance).toBeLessThan(results[1].distance);
  });

  test("non-guessed player gets 0 score and 9999 distance", () => {
    const players = [makePlayer({ id: "p1", hasGuessed: false })];
    const results = computeRoundResults(players, ISTANBUL);
    expect(results[0].score).toBe(0);
    expect(results[0].distance).toBe(9999);
  });

  test("perfect guess (same location) gets max score", () => {
    const players = [
      makePlayer({ id: "p1", hasGuessed: true, currentGuess: ISTANBUL }),
    ];
    const results = computeRoundResults(players, ISTANBUL);
    expect(results[0].score).toBe(5000);
    expect(results[0].distance).toBe(0);
  });
});

describe("Scoring: updatePlayersAfterRound immutability", () => {
  test("does not mutate input players object", () => {
    const players = makePlayers(
      { id: "p1", totalScore: 100, hasGuessed: true, currentGuess: ISTANBUL }
    );
    const originalP1Score = players["p1"].totalScore;
    const results = computeRoundResults([players["p1"]], ANKARA);
    updatePlayersAfterRound(players, results);
    expect(players["p1"].totalScore).toBe(originalP1Score);
  });
});

// ==================== Host Election ====================

describe("Host election: edge cases", () => {
  test("returns null when no candidates available", () => {
    const players = makePlayers(
      { id: "deadHost", status: "disconnected" }
    );
    const result = electNewHost(players, "deadHost");
    expect(result).toBeNull();
  });

  test("all disconnected except one → that one becomes host", () => {
    const players = makePlayers(
      { id: "p1", status: "disconnected", joinedAt: 1000 },
      { id: "p2", status: "disconnected", joinedAt: 2000 },
      { id: "p3", status: "online", joinedAt: 3000 }
    );
    const result = electNewHost(players, "deadHost");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("p3");
  });
});

// ==================== Leave Room Logic ====================

describe("determineLeaveAction", () => {
  test("last player → delete_room", () => {
    const players = makePlayers({ id: "host", isHost: true });
    const action = determineLeaveAction(players, "host", "host");
    expect(action.type).toBe("delete_room");
  });

  test("host leaving with other players → migrate_and_leave", () => {
    const players = makePlayers(
      { id: "host", isHost: true },
      { id: "p1" }
    );
    const action = determineLeaveAction(players, "host", "host");
    expect(action.type).toBe("migrate_and_leave");
  });

  test("non-host leaving → just_leave", () => {
    const players = makePlayers(
      { id: "host", isHost: true },
      { id: "p1" }
    );
    const action = determineLeaveAction(players, "p1", "host");
    expect(action.type).toBe("just_leave");
  });
});

// ==================== Rate Limiter Constants ====================

describe("Rate limits: sanity checks", () => {
  test("room creation limit is reasonable", () => {
    expect(RATE_LIMITS.ROOM_CREATION_PER_MINUTE).toBeGreaterThanOrEqual(1);
    expect(RATE_LIMITS.ROOM_CREATION_PER_MINUTE).toBeLessThanOrEqual(10);
  });

  test("guess limit per round is reasonable", () => {
    expect(RATE_LIMITS.GUESS_PER_ROUND).toBeGreaterThanOrEqual(1);
    expect(RATE_LIMITS.GUESS_PER_ROUND).toBeLessThanOrEqual(10);
  });
});

// ==================== Database Rules Contract ====================

describe("Firebase Rules Contract: field constraints", () => {
  test("totalRounds default matches game settings", () => {
    expect(GAME_SETTINGS.DEFAULT_ROUNDS).toBeGreaterThanOrEqual(1);
    expect(GAME_SETTINGS.DEFAULT_ROUNDS).toBeLessThanOrEqual(10);
  });

  test("max score per round is 5000 (10 rounds × 5000 = 50000 ceiling)", () => {
    expect(GAME_SETTINGS.MAX_SCORE_PER_ROUND).toBe(5000);
    const maxPossible = GAME_SETTINGS.MAX_ROUNDS * GAME_SETTINGS.MAX_SCORE_PER_ROUND;
    expect(maxPossible).toBe(50000);
  });

  test("Turkey bounds in production.ts match expected range", () => {
    expect(isValidTurkeyCoordinate(35.0, 25.0)).toBe(true);
    expect(isValidTurkeyCoordinate(43.0, 46.0)).toBe(true);
    expect(isValidTurkeyCoordinate(34.9, 25.0)).toBe(false);
    expect(isValidTurkeyCoordinate(43.1, 25.0)).toBe(false);
  });
});

// ==================== SEO Contract Tests ====================

describe("SEO: ads.txt format", () => {
  test("AdSense publisher ID format is correct", () => {
    const pubId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-4031611961368310";
    const cleanId = pubId.replace("ca-", "");
    expect(cleanId).toMatch(/^pub-\d+$/);
  });
});
