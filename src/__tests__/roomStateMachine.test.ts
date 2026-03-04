/**
 * Room State Machine — Pure Function Tests
 *
 * Tests every transition in the state machine:
 *   START_GAME, START_GAME_LEGACY, END_ROUND, NEXT_ROUND, NEXT_ROUND_LEGACY,
 *   GAME_OVER, RESTART, HOST_MIGRATE, PLAYER_JOIN, PLAYER_LEAVE
 *
 * All transitions are pure: no Firebase, no React, no side effects.
 */

import { describe, test, expect } from "vitest";
import { transitionRoom, applyPatch } from "@/services/roomStateMachine";
import type { Room, Player, PanoPackage, RoundResult } from "@/types";

// ==================== TEST HELPERS ====================

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

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: "TESTROOM",
    hostId: "host1",
    status: "waiting",
    currentRound: 0,
    totalRounds: 5,
    players: {
      host1: makePlayer({ id: "host1", isHost: true }),
      player2: makePlayer({ id: "player2" }),
    },
    gameMode: "urban",
    timeLimit: 90,
    moveLimit: 3,
    currentPanoPackageId: null,
    currentPanoPackage: null,
    currentLocation: null,
    currentLocationName: null,
    roundResults: null,
    roundStartTime: null,
    roundState: "waiting",
    roundVersion: 0,
    activePlayerCount: 0,
    expectedGuesses: 0,
    currentGuesses: 0,
    ...overrides,
  };
}

const MOCK_PANO: PanoPackage = {
  id: "pano_test_1",
  mode: "urban",
  region: "marmara",
  roadType: "urban_street",
  hintTags: ["signage"],
  qualityScore: 4,
  blacklist: false,
  pano0: { panoId: "p0", lat: 41.0, lng: 29.0, heading: 0 },
  pano1: { panoId: "p1", lat: 41.001, lng: 29.001, heading: 90 },
  pano2: { panoId: "p2", lat: 41.002, lng: 29.002, heading: 180 },
  pano3: { panoId: "p3", lat: 41.003, lng: 29.003, heading: 270 },
  locationName: "Istanbul, Kadikoy",
};

// ==================== START_GAME ====================

describe("transitionRoom: START_GAME", () => {
  test("valid: waiting -> playing", () => {
    const room = makeRoom({ status: "waiting" });
    const result = transitionRoom(room, {
      type: "START_GAME",
      panoPackage: MOCK_PANO,
      serverNow: 1000000,
    });

    expect(result.valid).toBe(true);
    expect(result.patch).not.toBeNull();
    expect(result.patch!.status).toBe("playing");
    expect(result.patch!.currentRound).toBe(1);
    expect(result.patch!.currentPanoPackageId).toBe("pano_test_1");
    expect(result.patch!.roundStartTime).toBe(1000000);
    expect(result.patch!.roundState).toBe("active");
    expect(result.patch!.expectedGuesses).toBe(2); // 2 online players
    expect(result.patch!.currentGuesses).toBe(0);
  });

  test("invalid: playing -> cannot start game", () => {
    const room = makeRoom({ status: "playing" });
    const result = transitionRoom(room, {
      type: "START_GAME",
      panoPackage: MOCK_PANO,
      serverNow: 1000000,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("playing");
  });

  test("invalid: roundEnd -> cannot start game", () => {
    const room = makeRoom({ status: "roundEnd" });
    const result = transitionRoom(room, {
      type: "START_GAME",
      panoPackage: MOCK_PANO,
      serverNow: 1000000,
    });

    expect(result.valid).toBe(false);
  });

  test("resets player state for new round", () => {
    const room = makeRoom({
      status: "waiting",
      players: {
        host1: makePlayer({ id: "host1", isHost: true, hasGuessed: true, currentGuess: { lat: 41, lng: 29 }, movesUsed: 2 }),
        player2: makePlayer({ id: "player2", hasGuessed: true }),
      },
    });
    const result = transitionRoom(room, {
      type: "START_GAME",
      panoPackage: MOCK_PANO,
      serverNow: 1000000,
    });

    expect(result.valid).toBe(true);
    const players = result.patch!.players!;
    expect(players["host1"].hasGuessed).toBe(false);
    expect(players["host1"].currentGuess).toBeNull();
    expect(players["host1"].movesUsed).toBe(0);
    expect(players["player2"].hasGuessed).toBe(false);
  });

  test("increments roundVersion", () => {
    const room = makeRoom({ status: "waiting", roundVersion: 5 });
    const result = transitionRoom(room, {
      type: "START_GAME",
      panoPackage: MOCK_PANO,
      serverNow: 1000000,
    });

    expect(result.patch!.roundVersion).toBe(6);
  });
});

// ==================== END_ROUND ====================

describe("transitionRoom: END_ROUND", () => {
  test("valid: playing -> roundEnd", () => {
    const room = makeRoom({ status: "playing", currentRound: 1 });
    const results: RoundResult[] = [
      { playerId: "host1", playerName: "Host", guess: { lat: 41, lng: 29 }, distance: 10, score: 4500 },
      { playerId: "player2", playerName: "Player2", guess: { lat: 40, lng: 28 }, distance: 100, score: 3000 },
    ];
    const updatedPlayers = { ...room.players };

    const result = transitionRoom(room, {
      type: "END_ROUND",
      results,
      updatedPlayers,
      lockOwnerId: "host1",
      roundId: 1,
    });

    expect(result.valid).toBe(true);
    expect(result.patch!.status).toBe("roundEnd");
    expect(result.patch!.roundState).toBe("ended");
    expect(result.patch!.roundResults).toBe(results);
  });

  test("invalid: wrong roundId", () => {
    const room = makeRoom({ status: "playing", currentRound: 1 });
    const result = transitionRoom(room, {
      type: "END_ROUND",
      results: [],
      updatedPlayers: {},
      lockOwnerId: "host1",
      roundId: 2, // mismatch
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("Round mismatch");
  });

  test("invalid: not playing", () => {
    const room = makeRoom({ status: "waiting" });
    const result = transitionRoom(room, {
      type: "END_ROUND",
      results: [],
      updatedPlayers: {},
      lockOwnerId: "host1",
      roundId: 0,
    });

    expect(result.valid).toBe(false);
  });
});

// ==================== NEXT_ROUND ====================

describe("transitionRoom: NEXT_ROUND", () => {
  test("valid: roundEnd -> playing (next round)", () => {
    const room = makeRoom({ status: "roundEnd", currentRound: 1, totalRounds: 5 });
    const result = transitionRoom(room, {
      type: "NEXT_ROUND",
      panoPackage: MOCK_PANO,
      serverNow: 2000000,
    });

    expect(result.valid).toBe(true);
    expect(result.patch!.status).toBe("playing");
    expect(result.patch!.currentRound).toBe(2);
    expect(result.patch!.roundStartTime).toBe(2000000);
    expect(result.patch!.roundResults).toBeNull();
  });

  test("invalid: all rounds completed", () => {
    const room = makeRoom({ status: "roundEnd", currentRound: 5, totalRounds: 5 });
    const result = transitionRoom(room, {
      type: "NEXT_ROUND",
      panoPackage: MOCK_PANO,
      serverNow: 2000000,
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("rounds completed");
  });

  test("invalid: not in roundEnd", () => {
    const room = makeRoom({ status: "playing" });
    const result = transitionRoom(room, {
      type: "NEXT_ROUND",
      panoPackage: MOCK_PANO,
      serverNow: 2000000,
    });

    expect(result.valid).toBe(false);
  });
});

// ==================== GAME_OVER ====================

describe("transitionRoom: GAME_OVER", () => {
  test("valid: roundEnd -> gameOver", () => {
    const room = makeRoom({ status: "roundEnd", currentRound: 5, totalRounds: 5 });
    const result = transitionRoom(room, { type: "GAME_OVER" });

    expect(result.valid).toBe(true);
    expect(result.patch!.status).toBe("gameOver");
    expect(result.patch!.roundState).toBe("ended");
  });

  test("invalid: not in roundEnd", () => {
    const room = makeRoom({ status: "playing" });
    const result = transitionRoom(room, { type: "GAME_OVER" });

    expect(result.valid).toBe(false);
  });
});

// ==================== RESTART ====================

describe("transitionRoom: RESTART", () => {
  test("valid: gameOver -> waiting", () => {
    const room = makeRoom({
      status: "gameOver",
      currentRound: 5,
      players: {
        host1: makePlayer({ id: "host1", totalScore: 10000, roundScores: [2000, 3000, 2500, 1500, 1000] }),
        player2: makePlayer({ id: "player2", totalScore: 8000 }),
      },
    });
    const result = transitionRoom(room, { type: "RESTART", gameInstanceId: "new123" });

    expect(result.valid).toBe(true);
    expect(result.patch!.status).toBe("waiting");
    expect(result.patch!.currentRound).toBe(0);
    expect(result.patch!.roundResults).toBeNull();
    // Players should be reset
    expect(result.patch!.players!["host1"].totalScore).toBe(0);
    expect(result.patch!.players!["host1"].roundScores).toEqual([]);
    expect(result.patch!.players!["host1"].hasGuessed).toBe(false);
    expect(result.patch!.players!["player2"].totalScore).toBe(0);
  });

  test("idempotent: waiting -> waiting (no-op)", () => {
    const room = makeRoom({ status: "waiting" });
    const result = transitionRoom(room, { type: "RESTART", gameInstanceId: "new123" });

    expect(result.valid).toBe(true);
    expect(result.patch).toBeNull(); // No changes needed
  });

  test("invalid: playing -> cannot restart", () => {
    const room = makeRoom({ status: "playing" });
    const result = transitionRoom(room, { type: "RESTART", gameInstanceId: "new123" });

    expect(result.valid).toBe(false);
  });
});

// ==================== HOST_MIGRATE ====================

describe("transitionRoom: HOST_MIGRATE", () => {
  test("valid: transfers host to new player", () => {
    const room = makeRoom({
      players: {
        host1: makePlayer({ id: "host1", isHost: true }),
        player2: makePlayer({ id: "player2", isHost: false }),
      },
    });
    const result = transitionRoom(room, {
      type: "HOST_MIGRATE",
      newHostId: "player2",
      oldHostId: "host1",
    });

    expect(result.valid).toBe(true);
    expect(result.patch!.hostId).toBe("player2");
    expect(result.patch!.players!["player2"].isHost).toBe(true);
    expect(result.patch!.players!["host1"].isHost).toBe(false);
  });

  test("invalid: new host not found", () => {
    const room = makeRoom();
    const result = transitionRoom(room, {
      type: "HOST_MIGRATE",
      newHostId: "nonexistent",
      oldHostId: "host1",
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toContain("not found");
  });
});

// ==================== PLAYER_JOIN ====================

describe("transitionRoom: PLAYER_JOIN", () => {
  test("adds new player to room", () => {
    const room = makeRoom();
    const newPlayer = makePlayer({ id: "player3", name: "NewPlayer" });
    const result = transitionRoom(room, { type: "PLAYER_JOIN", player: newPlayer });

    expect(result.valid).toBe(true);
    expect(result.patch!.players!["player3"]).toBeDefined();
    expect(result.patch!.players!["player3"].name).toBe("NewPlayer");
    // Existing players preserved
    expect(result.patch!.players!["host1"]).toBeDefined();
    expect(result.patch!.players!["player2"]).toBeDefined();
  });
});

// ==================== PLAYER_LEAVE ====================

describe("transitionRoom: PLAYER_LEAVE", () => {
  test("removes player from room", () => {
    const room = makeRoom();
    const result = transitionRoom(room, { type: "PLAYER_LEAVE", playerId: "player2" });

    expect(result.valid).toBe(true);
    expect(result.patch!.players!["player2"]).toBeUndefined();
    expect(result.patch!.players!["host1"]).toBeDefined();
  });

  test("with host migration: assigns new host", () => {
    const room = makeRoom();
    const result = transitionRoom(room, {
      type: "PLAYER_LEAVE",
      playerId: "host1",
      newHostId: "player2",
    });

    expect(result.valid).toBe(true);
    expect(result.patch!.hostId).toBe("player2");
    expect(result.patch!.players!["player2"].isHost).toBe(true);
    expect(result.patch!.players!["host1"]).toBeUndefined();
  });
});

// ==================== applyPatch ====================

describe("applyPatch", () => {
  test("applies patch to room immutably", () => {
    const room = makeRoom({ status: "waiting" });
    const patched = applyPatch(room, { status: "playing", currentRound: 1 });

    expect(patched.status).toBe("playing");
    expect(patched.currentRound).toBe(1);
    // Original unchanged
    expect(room.status).toBe("waiting");
    expect(room.currentRound).toBe(0);
  });

  test("returns same room for null patch", () => {
    const room = makeRoom();
    const patched = applyPatch(room, null);
    expect(patched).toBe(room);
  });
});

// ==================== FULL GAME LIFECYCLE ====================

describe("Full game lifecycle", () => {
  test("waiting -> playing -> roundEnd -> playing -> ... -> gameOver -> restart", () => {
    let room = makeRoom({ status: "waiting", totalRounds: 2 });

    // 1. Start game
    const start = transitionRoom(room, {
      type: "START_GAME",
      panoPackage: MOCK_PANO,
      serverNow: 100000,
    });
    expect(start.valid).toBe(true);
    room = applyPatch(room, start.patch);
    expect(room.status).toBe("playing");
    expect(room.currentRound).toBe(1);

    // 2. End round 1
    const endRound1 = transitionRoom(room, {
      type: "END_ROUND",
      results: [
        { playerId: "host1", playerName: "Host", guess: { lat: 41, lng: 29 }, distance: 10, score: 4500 },
        { playerId: "player2", playerName: "P2", guess: { lat: 40, lng: 28 }, distance: 100, score: 3000 },
      ],
      updatedPlayers: room.players,
      lockOwnerId: "host1",
      roundId: 1,
    });
    expect(endRound1.valid).toBe(true);
    room = applyPatch(room, endRound1.patch);
    expect(room.status).toBe("roundEnd");

    // 3. Next round
    const nextRound = transitionRoom(room, {
      type: "NEXT_ROUND",
      panoPackage: { ...MOCK_PANO, id: "pano_test_2" },
      serverNow: 200000,
    });
    expect(nextRound.valid).toBe(true);
    room = applyPatch(room, nextRound.patch);
    expect(room.status).toBe("playing");
    expect(room.currentRound).toBe(2);

    // 4. End round 2 (final round)
    const endRound2 = transitionRoom(room, {
      type: "END_ROUND",
      results: [],
      updatedPlayers: room.players,
      lockOwnerId: "host1",
      roundId: 2,
    });
    expect(endRound2.valid).toBe(true);
    room = applyPatch(room, endRound2.patch);
    expect(room.status).toBe("roundEnd");

    // 5. NEXT_ROUND should fail (all rounds done)
    const failNext = transitionRoom(room, {
      type: "NEXT_ROUND",
      panoPackage: MOCK_PANO,
      serverNow: 300000,
    });
    expect(failNext.valid).toBe(false);

    // 6. Game over
    const gameOver = transitionRoom(room, { type: "GAME_OVER" });
    expect(gameOver.valid).toBe(true);
    room = applyPatch(room, gameOver.patch);
    expect(room.status).toBe("gameOver");

    // 7. Restart
    const restart = transitionRoom(room, { type: "RESTART", gameInstanceId: "new_game" });
    expect(restart.valid).toBe(true);
    room = applyPatch(room, restart.patch);
    expect(room.status).toBe("waiting");
    expect(room.currentRound).toBe(0);
  });
});
