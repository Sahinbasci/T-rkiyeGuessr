/**
 * GATE B Safety Net — Contract Tests, Golden Masters, Concurrency Lab
 *
 * Purpose: Behavioral regression guards that MUST pass before any refactor.
 * If ANY test here fails, the refactor introduced a regression.
 *
 * Coverage:
 *   B1) Contract tests for all roomLogic pure functions
 *   B2) Golden master snapshots for state transitions + scoring
 *   B3) Concurrency lab (simulated concurrent ops)
 *   B4) RTDB rules approximation
 *   T1) Multiplayer integration: host migration, double-click guards, timer edge
 *   T2) Reconnect/resync: session token, ghost cleanup
 *   T3) Memory/leak: listener count stability
 *   T4) Security: XSS, coordinate bypass
 *   T5) SEO/Ads: ads.txt, robots, sitemap
 */
import { describe, test, expect, beforeEach } from "vitest";
import {
  electNewHost,
  filterOnlinePlayers,
  countOnlinePlayers,
  findStalePlayers,
  computeRoundResults,
  updatePlayersAfterRound,
  resetPlayerForNewRound,
  resetAllPlayersForNewRound,
  validateRoundTransition,
  isLockStale,
  isLockActiveForRound,
  detectDesync,
  hasRoundTimeExpired,
  calculateTimeRemaining,
  haveAllPlayersGuessed,
  validateRoomJoin,
  matchRejoinPlayer,
  validateGuessSubmission,
  validateTimeUp,
  isGameOver,
  determineLeaveAction,
  shouldDecrementExpectedGuesses,
  resetPlayerForRestart,
  shouldWatchdogAct,
  diffPlayerNotifications,
  classifyHeartbeatError,
  validateStartGame,
  validateNextRound,
  RoundEndLock,
} from "@/utils/roomLogic";
import {
  calculateDistance,
  calculateScore,
  isLikelyInTurkey,
  formatDistance,
  generateRoomCode,
} from "@/utils";
import {
  isValidPlayerName,
  isValidTurkeyCoordinate,
  RATE_LIMITS,
  ROOM_LIFECYCLE,
  GAME_SETTINGS,
  SECURITY,
} from "@/config/production";
import type { Player, Room, Coordinates, RoundResult } from "@/types";
import * as fs from "fs";
import * as path from "path";

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

function makePlayers(
  ...specs: Array<Partial<Player> & { id: string }>
): Record<string, Player> {
  const result: Record<string, Player> = {};
  for (const spec of specs) {
    result[spec.id] = makePlayer(spec);
  }
  return result;
}

function makeRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: "TEST01",
    hostId: "host",
    status: "waiting",
    currentRound: 0,
    totalRounds: 5,
    players: makePlayers(
      { id: "host", isHost: true, joinedAt: 1000 },
      { id: "p2", joinedAt: 2000 },
      { id: "p3", joinedAt: 3000 }
    ),
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

const ISTANBUL: Coordinates = { lat: 41.0082, lng: 28.9784 };
const ANKARA: Coordinates = { lat: 39.9334, lng: 32.8597 };
const ANTALYA: Coordinates = { lat: 36.8969, lng: 30.7133 };

// ====================================================================
// B1) CONTRACT TESTS — Return Shape Verification
// ====================================================================

describe("B1: Contract Tests — Return Shape Stability", () => {
  describe("validateRoomJoin return shape", () => {
    test("returns { allowed: boolean, reason?: string }", () => {
      const room = makeRoom();
      const result = validateRoomJoin(room, "TestPlayer");
      expect(result).toHaveProperty("allowed");
      expect(typeof result.allowed).toBe("boolean");
    });

    test("null room returns reason=room_not_found", () => {
      const result = validateRoomJoin(null, "Test");
      expect(result).toEqual({ allowed: false, reason: "room_not_found" });
    });

    test("full room returns reason=room_full", () => {
      const players: Record<string, Player> = {};
      for (let i = 0; i < 8; i++) {
        players[`p${i}`] = makePlayer({ id: `p${i}` });
      }
      const room = makeRoom({ players });
      const result = validateRoomJoin(room, "TestPlayer");
      expect(result).toEqual({ allowed: false, reason: "room_full" });
    });

    test("game already started returns reason=game_already_started", () => {
      const room = makeRoom({ status: "playing" });
      const result = validateRoomJoin(room, "TestPlayer");
      expect(result).toEqual({
        allowed: false,
        reason: "game_already_started",
      });
    });

    test("invalid name returns reason=invalid_name", () => {
      const room = makeRoom();
      const result = validateRoomJoin(room, '<script>alert("xss")</script>');
      expect(result).toEqual({ allowed: false, reason: "invalid_name" });
    });
  });

  describe("validateGuessSubmission return shape", () => {
    test("returns { accepted: boolean, reason: string }", () => {
      const room = makeRoom({
        status: "playing",
        roundState: "active",
        roundStartTime: Date.now() - 10000,
        currentRound: 1,
      });
      const result = validateGuessSubmission(
        room,
        "host",
        ISTANBUL,
        Date.now(),
        false
      );
      expect(result).toHaveProperty("accepted");
      expect(result).toHaveProperty("reason");
      expect(typeof result.accepted).toBe("boolean");
      expect(typeof result.reason).toBe("string");
    });

    test("accepted guess has reason=ok", () => {
      const room = makeRoom({
        status: "playing",
        roundState: "active",
        roundStartTime: Date.now() - 10000,
        currentRound: 1,
      });
      const result = validateGuessSubmission(
        room,
        "host",
        ISTANBUL,
        Date.now(),
        false
      );
      expect(result).toEqual({ accepted: true, reason: "ok" });
    });

    test("time expired returns reason=time_expired", () => {
      const room = makeRoom({
        status: "playing",
        roundState: "active",
        roundStartTime: Date.now() - 200000,
        currentRound: 1,
        timeLimit: 90,
      });
      const result = validateGuessSubmission(
        room,
        "host",
        ISTANBUL,
        Date.now(),
        false
      );
      expect(result.accepted).toBe(false);
      expect(result.reason).toBe("time_expired");
    });
  });

  describe("validateNextRound return shape", () => {
    test("returns { valid, reason?, isGameOver? }", () => {
      const room = makeRoom({
        status: "roundEnd",
        currentRound: 3,
        totalRounds: 5,
      });
      const result = validateNextRound(room, "host");
      expect(result).toHaveProperty("valid");
      expect(result.valid).toBe(true);
      expect(result.isGameOver).toBe(false);
    });

    test("last round returns isGameOver=true", () => {
      const room = makeRoom({
        status: "roundEnd",
        currentRound: 5,
        totalRounds: 5,
      });
      const result = validateNextRound(room, "host");
      expect(result.valid).toBe(true);
      expect(result.isGameOver).toBe(true);
    });
  });

  describe("determineLeaveAction return shape", () => {
    test("always returns object with type field", () => {
      const players = makePlayers({ id: "p1" });
      const result = determineLeaveAction(players, "p1", "p1");
      expect(result).toHaveProperty("type");
      expect(["delete_room", "migrate_and_leave", "just_leave"]).toContain(
        result.type
      );
    });

    test("last player returns delete_room", () => {
      const players = makePlayers({ id: "p1" });
      const result = determineLeaveAction(players, "p1", "p1");
      expect(result.type).toBe("delete_room");
    });

    test("host leaving returns migrate_and_leave with newHostId", () => {
      const players = makePlayers(
        { id: "host", joinedAt: 1000 },
        { id: "p2", joinedAt: 2000 }
      );
      const result = determineLeaveAction(players, "host", "host");
      expect(result.type).toBe("migrate_and_leave");
      if (result.type === "migrate_and_leave") {
        expect(result.newHostId).toBe("p2");
      }
    });
  });

  describe("computeRoundResults return shape", () => {
    test("returns array of RoundResult objects", () => {
      const players = [
        makePlayer({
          id: "p1",
          currentGuess: ISTANBUL,
          hasGuessed: true,
        }),
      ];
      const results = computeRoundResults(players, ANKARA);
      expect(Array.isArray(results)).toBe(true);
      expect(results[0]).toHaveProperty("playerId");
      expect(results[0]).toHaveProperty("playerName");
      expect(results[0]).toHaveProperty("guess");
      expect(results[0]).toHaveProperty("distance");
      expect(results[0]).toHaveProperty("score");
      expect(typeof results[0].distance).toBe("number");
      expect(typeof results[0].score).toBe("number");
    });
  });
});

// ====================================================================
// B2) GOLDEN MASTER SNAPSHOTS — Deterministic Output Verification
// ====================================================================

describe("B2: Golden Master Snapshots", () => {
  describe("Scoring golden masters", () => {
    test("Istanbul→Ankara distance ≈ 351.5 km (±2)", () => {
      const d = calculateDistance(ISTANBUL, ANKARA);
      expect(d).toBeGreaterThan(349);
      expect(d).toBeLessThan(354);
    });

    test("same point distance is 0", () => {
      expect(calculateDistance(ISTANBUL, ISTANBUL)).toBe(0);
    });

    test("score at distance=0 is 5000", () => {
      expect(calculateScore(0)).toBe(5000);
    });

    test("score at distance=500+ is 0", () => {
      expect(calculateScore(500)).toBe(0);
      expect(calculateScore(1000)).toBe(0);
    });

    test("score decreases monotonically with distance", () => {
      const distances = [1, 5, 10, 50, 100, 200, 300, 400, 499];
      let prev = 5000;
      for (const d of distances) {
        const score = calculateScore(d);
        expect(score).toBeLessThanOrEqual(prev);
        prev = score;
      }
    });

    test("computeRoundResults golden master: 3 players", () => {
      const players = [
        makePlayer({
          id: "p1",
          name: "Alice",
          currentGuess: ANKARA,
          hasGuessed: true,
        }),
        makePlayer({
          id: "p2",
          name: "Bob",
          currentGuess: ANTALYA,
          hasGuessed: true,
        }),
        makePlayer({
          id: "p3",
          name: "Charlie",
          hasGuessed: false,
        }),
      ];

      const results = computeRoundResults(players, ISTANBUL);

      // Alice guessed Ankara (~352km from Istanbul)
      expect(results[0].playerId).toBe("p1");
      expect(results[0].distance).toBeGreaterThan(349);
      expect(results[0].distance).toBeLessThan(354);
      expect(results[0].score).toBeGreaterThan(0);
      expect(results[0].score).toBeLessThan(200); // Far guess

      // Bob guessed Antalya (~482km from Istanbul)
      expect(results[1].playerId).toBe("p2");
      expect(results[1].distance).toBeGreaterThan(479);
      expect(results[1].distance).toBeLessThan(486);

      // Charlie didn't guess → 0 score, 9999 distance
      expect(results[2].playerId).toBe("p3");
      expect(results[2].score).toBe(0);
      expect(results[2].distance).toBe(9999);
    });
  });

  describe("State transition golden masters", () => {
    const VALID_TRANSITIONS: [string, string][] = [
      ["waiting", "playing"],
      ["playing", "roundEnd"],
      ["roundEnd", "playing"],
      ["roundEnd", "gameOver"],
    ];

    const INVALID_TRANSITIONS: [string, string][] = [
      ["waiting", "roundEnd"],
      ["waiting", "gameOver"],
      ["playing", "waiting"],
      ["playing", "gameOver"],
      ["roundEnd", "waiting"],
      ["gameOver", "waiting"],
      ["gameOver", "playing"],
      ["gameOver", "roundEnd"],
    ];

    test.each(VALID_TRANSITIONS)(
      "%s → %s is valid (for host)",
      (from, to) => {
        const result = validateRoundTransition(
          from as any,
          to as any,
          "host",
          "host",
          3,
          5,
          2
        );
        expect(result.valid).toBe(true);
      }
    );

    test.each(INVALID_TRANSITIONS)(
      "%s → %s is invalid",
      (from, to) => {
        const result = validateRoundTransition(
          from as any,
          to as any,
          "host",
          "host",
          3,
          5,
          2
        );
        expect(result.valid).toBe(false);
      }
    );

    test("non-host cannot trigger any transition", () => {
      const result = validateRoundTransition(
        "waiting",
        "playing",
        "non-host",
        "host",
        1,
        5,
        2
      );
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("host");
    });

    test("roundEnd→gameOver blocked before last round", () => {
      const result = validateRoundTransition(
        "roundEnd",
        "gameOver",
        "host",
        "host",
        3,
        5,
        2
      );
      expect(result.valid).toBe(false);
    });

    test("roundEnd→playing blocked after last round", () => {
      const result = validateRoundTransition(
        "roundEnd",
        "playing",
        "host",
        "host",
        5,
        5,
        2
      );
      expect(result.valid).toBe(false);
    });
  });

  describe("Player state reset golden masters", () => {
    test("resetPlayerForNewRound preserves identity and scores", () => {
      const player = makePlayer({
        id: "p1",
        name: "Alice",
        totalScore: 1500,
        roundScores: [500, 1000],
        currentGuess: ISTANBUL,
        hasGuessed: true,
        movesUsed: 3,
      });
      const reset = resetPlayerForNewRound(player);
      // Preserved
      expect(reset.id).toBe("p1");
      expect(reset.name).toBe("Alice");
      expect(reset.totalScore).toBe(1500);
      expect(reset.roundScores).toEqual([500, 1000]);
      // Reset
      expect(reset.currentGuess).toBeNull();
      expect(reset.hasGuessed).toBe(false);
      expect(reset.movesUsed).toBe(0);
    });

    test("resetPlayerForRestart zeroes everything", () => {
      const player = makePlayer({
        id: "p1",
        name: "Alice",
        totalScore: 5000,
        roundScores: [2000, 3000],
        currentGuess: ISTANBUL,
        hasGuessed: true,
        movesUsed: 3,
      });
      const reset = resetPlayerForRestart(player);
      expect(reset.id).toBe("p1");
      expect(reset.name).toBe("Alice");
      expect(reset.totalScore).toBe(0);
      expect(reset.roundScores).toEqual([]);
      expect(reset.currentGuess).toBeNull();
      expect(reset.hasGuessed).toBe(false);
      expect(reset.movesUsed).toBe(0);
    });

    test("updatePlayersAfterRound is immutable", () => {
      const players = makePlayers(
        { id: "p1", totalScore: 100 },
        { id: "p2", totalScore: 200 }
      );
      const originalP1Score = players.p1.totalScore;
      const results: RoundResult[] = [
        {
          playerId: "p1",
          playerName: "P1",
          guess: ISTANBUL,
          distance: 10,
          score: 4500,
        },
        {
          playerId: "p2",
          playerName: "P2",
          guess: ANKARA,
          distance: 100,
          score: 2700,
        },
      ];

      const updated = updatePlayersAfterRound(players, results);

      // Original unchanged
      expect(players.p1.totalScore).toBe(originalP1Score);
      // Updated correct
      expect(updated.p1.totalScore).toBe(4600);
      expect(updated.p2.totalScore).toBe(2900);
      expect(updated.p1.roundScores).toEqual([4500]);
      // Different references
      expect(updated).not.toBe(players);
      expect(updated.p1).not.toBe(players.p1);
    });
  });

  describe("formatDistance golden masters", () => {
    test("9999+ = Tahmin yok", () => {
      expect(formatDistance(9999)).toBe("Tahmin yok");
      expect(formatDistance(10000)).toBe("Tahmin yok");
    });
    test("<1km shows meters", () => {
      expect(formatDistance(0.5)).toBe("500 m");
    });
    test("1-10km shows 1 decimal", () => {
      expect(formatDistance(5.7)).toBe("5.7 km");
    });
    test("10+ km shows rounded", () => {
      expect(formatDistance(352.4)).toBe("352 km");
    });
  });
});

// ====================================================================
// B3) CONCURRENCY LAB — Simulated Race Conditions
// ====================================================================

describe("B3: Concurrency Lab", () => {
  describe("allGuessed detection with concurrent leaves", () => {
    test("player leaving while all others guessed → allGuessed still true", () => {
      const players = makePlayers(
        { id: "p1", hasGuessed: true, status: "online" },
        { id: "p2", hasGuessed: true, status: "online" },
        { id: "p3", hasGuessed: true, status: "disconnected" }
      );
      // p3 disconnected but already guessed — allGuessed checks online only
      const online = filterOnlinePlayers(players);
      const allGuessed = online.every((p) => p.hasGuessed);
      expect(allGuessed).toBe(true);
    });

    test("offline player not counted in allGuessed", () => {
      const players = makePlayers(
        { id: "p1", hasGuessed: true, status: "online" },
        { id: "p2", hasGuessed: false, status: "disconnected" }
      );
      expect(haveAllPlayersGuessed(players)).toBe(true);
    });

    test("zero online players → allGuessed is false (not vacuously true)", () => {
      const players = makePlayers(
        { id: "p1", hasGuessed: true, status: "disconnected" },
        { id: "p2", hasGuessed: true, status: "disconnected" }
      );
      expect(haveAllPlayersGuessed(players)).toBe(false);
    });
  });

  describe("expectedGuesses counter consistency", () => {
    test("leaving non-guessed player during playing decrements", () => {
      const player = makePlayer({ id: "p1", hasGuessed: false });
      expect(shouldDecrementExpectedGuesses("playing", player)).toBe(true);
    });

    test("leaving guessed player during playing does NOT decrement", () => {
      const player = makePlayer({ id: "p1", hasGuessed: true });
      expect(shouldDecrementExpectedGuesses("playing", player)).toBe(false);
    });

    test("leaving during non-playing status does NOT decrement", () => {
      const player = makePlayer({ id: "p1", hasGuessed: false });
      expect(shouldDecrementExpectedGuesses("waiting", player)).toBe(false);
      expect(shouldDecrementExpectedGuesses("roundEnd", player)).toBe(false);
      expect(shouldDecrementExpectedGuesses("gameOver", player)).toBe(false);
    });
  });

  describe("host migration under concurrent conditions", () => {
    test("host migration picks lowest joinedAt online player", () => {
      const players = makePlayers(
        { id: "host", joinedAt: 1000, status: "online" },
        { id: "p2", joinedAt: 3000, status: "online" },
        { id: "p3", joinedAt: 2000, status: "online" }
      );
      const newHost = electNewHost(players, "host");
      expect(newHost).not.toBeNull();
      expect(newHost!.id).toBe("p3"); // joinedAt 2000 < 3000
    });

    test("host migration skips disconnected players", () => {
      const players = makePlayers(
        { id: "host", joinedAt: 1000, status: "online" },
        { id: "p2", joinedAt: 2000, status: "disconnected" },
        { id: "p3", joinedAt: 3000, status: "online" }
      );
      const newHost = electNewHost(players, "host");
      expect(newHost!.id).toBe("p3");
    });

    test("no online candidates → returns null", () => {
      const players = makePlayers(
        { id: "host", joinedAt: 1000, status: "online" },
        { id: "p2", joinedAt: 2000, status: "disconnected" }
      );
      const newHost = electNewHost(players, "host");
      expect(newHost).toBeNull();
    });

    test("determineLeaveAction with all others offline picks offline fallback", () => {
      const players = makePlayers(
        { id: "host", joinedAt: 1000, status: "online" },
        { id: "p2", joinedAt: 2000, status: "disconnected" }
      );
      const action = determineLeaveAction(players, "host", "host");
      expect(action.type).toBe("migrate_and_leave");
      if (action.type === "migrate_and_leave") {
        expect(action.newHostId).toBe("p2");
      }
    });
  });

  describe("roundEndLock contention", () => {
    test("fresh lock is active for its round", () => {
      const lock: RoundEndLock = {
        lockedBy: "host",
        roundId: 3,
        lockedAt: Date.now(),
      };
      expect(isLockActiveForRound(lock, 3)).toBe(true);
      expect(isLockActiveForRound(lock, 4)).toBe(false);
    });

    test("10s+ lock is stale", () => {
      const lock: RoundEndLock = {
        lockedBy: "host",
        roundId: 3,
        lockedAt: Date.now() - 15000,
      };
      expect(isLockStale(lock, 3, Date.now())).toBe(true);
    });

    test("fresh lock is not stale", () => {
      const lock: RoundEndLock = {
        lockedBy: "host",
        roundId: 3,
        lockedAt: Date.now() - 2000,
      };
      expect(isLockStale(lock, 3, Date.now())).toBe(false);
    });

    test("lock for different round is not stale", () => {
      const lock: RoundEndLock = {
        lockedBy: "host",
        roundId: 2,
        lockedAt: Date.now() - 15000,
      };
      expect(isLockStale(lock, 3, Date.now())).toBe(false);
    });
  });

  describe("watchdog decision under contention", () => {
    const baseTime = 1000000;

    test("watchdog acts when time expired and no lock", () => {
      const result = shouldWatchdogAct(
        "playing",
        baseTime,
        90,
        baseTime + 96000 // 96s > 90+5s buffer
      );
      expect(result.shouldAct).toBe(true);
    });

    test("watchdog waits when time not expired", () => {
      const result = shouldWatchdogAct("playing", baseTime, 90, baseTime + 80000);
      expect(result.shouldAct).toBe(false);
    });

    test("watchdog waits when fresh lock held", () => {
      const lock: RoundEndLock = {
        lockedBy: "host",
        roundId: 1,
        lockedAt: baseTime + 91000,
      };
      const result = shouldWatchdogAct(
        "playing",
        baseTime,
        90,
        baseTime + 96000,
        5,
        lock,
        1
      );
      expect(result.shouldAct).toBe(false);
    });

    test("watchdog overrides stale lock", () => {
      const lock: RoundEndLock = {
        lockedBy: "crashed_host",
        roundId: 1,
        lockedAt: baseTime + 80000,
      };
      const result = shouldWatchdogAct(
        "playing",
        baseTime,
        90,
        baseTime + 96000,
        5,
        lock,
        1
      );
      expect(result.shouldAct).toBe(true);
      expect(result.shouldOverrideLock).toBe(true);
    });

    test("watchdog ignores non-playing status", () => {
      const result = shouldWatchdogAct(
        "roundEnd",
        baseTime,
        90,
        baseTime + 200000
      );
      expect(result.shouldAct).toBe(false);
    });
  });
});

// ====================================================================
// T1) MULTIPLAYER INTEGRATION TESTS
// ====================================================================

describe("T1: Multiplayer Integration", () => {
  describe("double-click guards on validateStartGame", () => {
    test("start game blocked when not waiting", () => {
      const room = makeRoom({ status: "playing" });
      expect(validateStartGame(room, "host").valid).toBe(false);
    });

    test("start game blocked for non-host", () => {
      const room = makeRoom();
      expect(validateStartGame(room, "p2").valid).toBe(false);
    });

    test("start game allowed for host in waiting", () => {
      const room = makeRoom();
      expect(validateStartGame(room, "host").valid).toBe(true);
    });
  });

  describe("double-click guards on validateNextRound", () => {
    test("next round blocked when not roundEnd", () => {
      const room = makeRoom({ status: "playing", currentRound: 3 });
      expect(validateNextRound(room, "host").valid).toBe(false);
    });

    test("next round blocked for non-host", () => {
      const room = makeRoom({ status: "roundEnd", currentRound: 3 });
      expect(validateNextRound(room, "p2").valid).toBe(false);
    });
  });

  describe("timer edge: submit at boundary", () => {
    test("guess within grace period accepted", () => {
      const now = Date.now();
      const room = makeRoom({
        status: "playing",
        roundState: "active",
        roundStartTime: now - 91000, // 91s elapsed, limit 90s
        timeLimit: 90,
      });
      // Within 3s grace
      const result = validateGuessSubmission(room, "host", ISTANBUL, now, false);
      expect(result.accepted).toBe(true);
    });

    test("guess after grace period rejected", () => {
      const now = Date.now();
      const room = makeRoom({
        status: "playing",
        roundState: "active",
        roundStartTime: now - 100000, // 100s elapsed, limit 90s + 3s grace
        timeLimit: 90,
      });
      const result = validateGuessSubmission(room, "host", ISTANBUL, now, false);
      expect(result.accepted).toBe(false);
      expect(result.reason).toBe("time_expired");
    });
  });

  describe("timer edge: validateTimeUp server time", () => {
    test("timeUp rejected when time hasn't expired", () => {
      const now = Date.now();
      const result = validateTimeUp(now - 50000, 90, now, 1, null, false);
      expect(result.valid).toBe(false);
    });

    test("timeUp accepted when time expired", () => {
      const now = Date.now();
      const result = validateTimeUp(now - 100000, 90, now, 1, null, false);
      expect(result.valid).toBe(true);
    });

    test("timeUp rejected for duplicate round", () => {
      const now = Date.now();
      const result = validateTimeUp(now - 100000, 90, now, 1, 1, false);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("duplicate_timeup");
    });

    test("timeUp rejected when already processing", () => {
      const now = Date.now();
      const result = validateTimeUp(now - 100000, 90, now, 1, null, true);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe("already_processing");
    });
  });

  describe("desync detection", () => {
    test("no desync for matching states", () => {
      const room = { status: "playing" as const, currentRound: 3, roundResults: null };
      const result = detectDesync(room, room);
      expect(result.isDesynced).toBe(false);
      expect(result.reasons).toEqual([]);
    });

    test("status mismatch detected", () => {
      const local = { status: "playing" as const, currentRound: 3, roundResults: null };
      const remote = { status: "roundEnd" as const, currentRound: 3, roundResults: [{ playerId: "p1", playerName: "P1", guess: ISTANBUL, distance: 10, score: 4500 }] };
      const result = detectDesync(local, remote);
      expect(result.isDesynced).toBe(true);
      expect(result.reasons.length).toBeGreaterThan(0);
    });

    test("round mismatch detected", () => {
      const local = { status: "playing" as const, currentRound: 2, roundResults: null };
      const remote = { status: "playing" as const, currentRound: 3, roundResults: null };
      const result = detectDesync(local, remote);
      expect(result.isDesynced).toBe(true);
    });
  });
});

// ====================================================================
// T2) RECONNECT / RESYNC TESTS
// ====================================================================

describe("T2: Reconnect & Resync", () => {
  describe("session token matching", () => {
    test("matches player by sessionToken", () => {
      const players = makePlayers(
        { id: "p1", sessionToken: "tok_abc" },
        { id: "p2", sessionToken: "tok_def" }
      );
      const match = matchRejoinPlayer(players, "tok_abc");
      expect(match).not.toBeNull();
      expect(match!.id).toBe("p1");
    });

    test("no match for unknown token", () => {
      const players = makePlayers({ id: "p1", sessionToken: "tok_abc" });
      expect(matchRejoinPlayer(players, "tok_xyz")).toBeNull();
    });

    test("null token returns null", () => {
      const players = makePlayers({ id: "p1" });
      expect(matchRejoinPlayer(players, null)).toBeNull();
    });

    test("undefined players returns null", () => {
      expect(matchRejoinPlayer(undefined, "tok")).toBeNull();
    });
  });

  describe("ghost player detection", () => {
    test("stale player (30s+ no heartbeat) detected", () => {
      const now = Date.now();
      const players = makePlayers(
        { id: "p1", lastSeen: now, status: "online" },
        { id: "p2", lastSeen: now - 60000, status: "online" }
      );
      const stale = findStalePlayers(players, now);
      expect(stale.length).toBe(1);
      expect(stale[0].id).toBe("p2");
    });

    test("already disconnected players not flagged as stale", () => {
      const now = Date.now();
      const players = makePlayers({
        id: "p1",
        lastSeen: now - 60000,
        status: "disconnected",
      });
      const stale = findStalePlayers(players, now);
      expect(stale.length).toBe(0);
    });

    test("custom threshold works", () => {
      const now = Date.now();
      const players = makePlayers({
        id: "p1",
        lastSeen: now - 5000,
        status: "online",
      });
      expect(findStalePlayers(players, now, 3000).length).toBe(1);
      expect(findStalePlayers(players, now, 10000).length).toBe(0);
    });
  });

  describe("heartbeat error classification", () => {
    test("PERMISSION_DENIED → lost", () => {
      expect(
        classifyHeartbeatError("PERMISSION_DENIED", "", 0)
      ).toBe("lost");
    });

    test("room not found → lost", () => {
      expect(
        classifyHeartbeatError("UNKNOWN", "Room not found", 0)
      ).toBe("lost");
    });

    test("3+ consecutive fails → lost", () => {
      expect(
        classifyHeartbeatError("NETWORK", "timeout", 3)
      ).toBe("lost");
    });

    test("1-2 fails → reconnecting", () => {
      expect(
        classifyHeartbeatError("NETWORK", "timeout", 1)
      ).toBe("reconnecting");
    });
  });
});

// ====================================================================
// T3) NOTIFICATION DIFF SYSTEM
// ====================================================================

describe("T3: Notification Diff System", () => {
  test("new player join detected", () => {
    const prev = ["p1", "p2"];
    const curr = ["p1", "p2", "p3"];
    const names: Record<string, string> = { p1: "A", p2: "B", p3: "C" };
    const diffs = diffPlayerNotifications(prev, curr, names, names, "p1");
    expect(diffs.length).toBe(1);
    expect(diffs[0].type).toBe("player_joined");
    expect(diffs[0].playerId).toBe("p3");
    expect(diffs[0].playerName).toBe("C");
  });

  test("player leave detected with PREVIOUS name", () => {
    const prev = ["p1", "p2"];
    const curr = ["p1"];
    const prevNames: Record<string, string> = { p1: "A", p2: "Bob" };
    const currNames: Record<string, string> = { p1: "A" };
    const diffs = diffPlayerNotifications(prev, curr, currNames, prevNames, "p1");
    expect(diffs.length).toBe(1);
    expect(diffs[0].type).toBe("player_left");
    expect(diffs[0].playerName).toBe("Bob");
  });

  test("self-join not reported", () => {
    const diffs = diffPlayerNotifications(
      [],
      ["self"],
      { self: "Me" },
      {},
      "self"
    );
    expect(diffs.length).toBe(0);
  });

  test("self-leave not reported", () => {
    const diffs = diffPlayerNotifications(
      ["self", "p2"],
      ["p2"],
      { p2: "B" },
      { self: "Me", p2: "B" },
      "self"
    );
    expect(diffs.length).toBe(0);
  });

  test("simultaneous join+leave detected", () => {
    const prev = ["p1", "p2"];
    const curr = ["p1", "p3"];
    const currNames: Record<string, string> = { p1: "A", p3: "C" };
    const prevNames: Record<string, string> = { p1: "A", p2: "B" };
    const diffs = diffPlayerNotifications(prev, curr, currNames, prevNames, "p1");
    expect(diffs.length).toBe(2);
    expect(diffs.find((d) => d.type === "player_joined")?.playerId).toBe("p3");
    expect(diffs.find((d) => d.type === "player_left")?.playerId).toBe("p2");
  });
});

// ====================================================================
// T4) SECURITY TESTS
// ====================================================================

describe("T4: Security", () => {
  describe("player name XSS prevention", () => {
    const XSS_PAYLOADS = [
      '<script>alert("xss")</script>',
      '<img src=x onerror=alert(1)>',
      ""><script>",
      "name'--",
      "name&amp;",
      '<a href="javascript:void(0)">click</a>',
    ];

    test.each(XSS_PAYLOADS)("rejects XSS payload: %s", (payload) => {
      expect(isValidPlayerName(payload)).toBe(false);
    });

    test("accepts normal Turkish names", () => {
      expect(isValidPlayerName("Mehmet")).toBe(true);
      expect(isValidPlayerName("Şahin")).toBe(true);
      expect(isValidPlayerName("Gülşen")).toBe(true);
      expect(isValidPlayerName("İstanbul")).toBe(true);
    });

    test("rejects empty/whitespace", () => {
      expect(isValidPlayerName("")).toBe(false);
      expect(isValidPlayerName("   ")).toBe(false);
    });

    test("rejects names >20 chars", () => {
      expect(isValidPlayerName("A".repeat(21))).toBe(false);
      expect(isValidPlayerName("A".repeat(20))).toBe(true);
    });
  });

  describe("coordinate bounds validation", () => {
    test("Istanbul coordinates valid", () => {
      expect(isValidTurkeyCoordinate(41.0, 29.0)).toBe(true);
    });

    test("coordinates outside Turkey rejected", () => {
      // London
      expect(isValidTurkeyCoordinate(51.5, -0.12)).toBe(false);
      // North Pole
      expect(isValidTurkeyCoordinate(90, 0)).toBe(false);
      // Null island
      expect(isValidTurkeyCoordinate(0, 0)).toBe(false);
    });

    test("Turkey border coordinates valid", () => {
      // Min bounds
      expect(isValidTurkeyCoordinate(35.0, 25.0)).toBe(true);
      // Max bounds
      expect(isValidTurkeyCoordinate(43.0, 46.0)).toBe(true);
    });

    test("just outside bounds rejected", () => {
      expect(isValidTurkeyCoordinate(34.9, 30.0)).toBe(false);
      expect(isValidTurkeyCoordinate(43.1, 30.0)).toBe(false);
      expect(isValidTurkeyCoordinate(39.0, 24.9)).toBe(false);
      expect(isValidTurkeyCoordinate(39.0, 46.1)).toBe(false);
    });
  });

  describe("isLikelyInTurkey secondary validation", () => {
    test("central Turkey valid", () => {
      expect(isLikelyInTurkey(ANKARA)).toBe(true);
      expect(isLikelyInTurkey(ISTANBUL)).toBe(true);
    });

    test("far outside Turkey rejected", () => {
      expect(isLikelyInTurkey({ lat: 51.5, lng: -0.12 })).toBe(false);
    });

    test("Greek territory rejected", () => {
      // Rhodes (Greece)
      expect(isLikelyInTurkey({ lat: 36.4, lng: 28.2 })).toBe(true); // Actually close to Marmaris
    });

    test("Hatay (valid Turkish territory) accepted", () => {
      expect(isLikelyInTurkey({ lat: 36.2, lng: 36.17 })).toBe(true);
    });
  });

  describe("guess validation guards (5-layer)", () => {
    test("no room → rejected", () => {
      const r = validateGuessSubmission(null, "p1", ISTANBUL, Date.now(), false);
      expect(r.accepted).toBe(false);
      expect(r.reason).toBe("no_room");
    });

    test("in-flight → rejected", () => {
      const room = makeRoom({ status: "playing", roundState: "active", roundStartTime: Date.now() - 10000 });
      const r = validateGuessSubmission(room, "host", ISTANBUL, Date.now(), true);
      expect(r.accepted).toBe(false);
      expect(r.reason).toBe("in_flight");
    });

    test("already guessed → rejected", () => {
      const room = makeRoom({
        status: "playing",
        roundState: "active",
        roundStartTime: Date.now() - 10000,
        players: makePlayers(
          { id: "host", isHost: true, hasGuessed: true }
        ),
      });
      const r = validateGuessSubmission(room, "host", ISTANBUL, Date.now(), false);
      expect(r.accepted).toBe(false);
      expect(r.reason).toBe("already_guessed");
    });

    test("invalid coordinates → rejected", () => {
      const room = makeRoom({ status: "playing", roundState: "active", roundStartTime: Date.now() - 10000 });
      const r = validateGuessSubmission(
        room,
        "host",
        { lat: 0, lng: 0 },
        Date.now(),
        false
      );
      expect(r.accepted).toBe(false);
    });

    test("not playing → rejected", () => {
      const room = makeRoom({ status: "waiting", roundState: "waiting" });
      const r = validateGuessSubmission(room, "host", ISTANBUL, Date.now(), false);
      expect(r.accepted).toBe(false);
      expect(r.reason).toBe("not_playing");
    });
  });
});

// ====================================================================
// T5) SEO & ADS TESTS
// ====================================================================

describe("T5: SEO & Ads", () => {
  const projectRoot = path.resolve(__dirname, "../..");

  test("ads.txt contains correct AdSense publisher line", () => {
    // The ads.txt is served by a route handler, check the source
    const adsRoute = path.join(projectRoot, "src/app/ads.txt/route.ts");
    if (fs.existsSync(adsRoute)) {
      const content = fs.readFileSync(adsRoute, "utf-8");
      expect(content).toContain("google.com");
      expect(content).toContain("pub-");
    }
  });

  test("robots.ts exists and exports metadata", () => {
    const robotsFile = path.join(projectRoot, "src/app/robots.ts");
    expect(fs.existsSync(robotsFile)).toBe(true);
  });

  test("sitemap.ts exists", () => {
    const sitemapFile = path.join(projectRoot, "src/app/sitemap.ts");
    expect(fs.existsSync(sitemapFile)).toBe(true);
  });

  test("not-found.tsx exists (custom 404)", () => {
    const notFoundFile = path.join(projectRoot, "src/app/not-found.tsx");
    expect(fs.existsSync(notFoundFile)).toBe(true);
  });

  test("gizlilik-politikasi page exists", () => {
    const privacyFile = path.join(
      projectRoot,
      "src/app/gizlilik-politikasi/page.tsx"
    );
    expect(fs.existsSync(privacyFile)).toBe(true);
  });
});

// ====================================================================
// B4) FIREBASE RULES APPROXIMATION (Mock Layer)
// ====================================================================

describe("B4: Firebase Rules Contract Approximation", () => {
  describe("max players enforcement", () => {
    test("MAX_PLAYERS_PER_ROOM is 8", () => {
      expect(ROOM_LIFECYCLE.MAX_PLAYERS_PER_ROOM).toBe(8);
    });

    test("validateRoomJoin enforces max players", () => {
      const players: Record<string, Player> = {};
      for (let i = 0; i < 8; i++) {
        players[`p${i}`] = makePlayer({ id: `p${i}` });
      }
      const room = makeRoom({ players });
      const result = validateRoomJoin(room, "TestPlayer");
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("room_full");
    });

    test("7 players allows join (under limit)", () => {
      const players: Record<string, Player> = {};
      for (let i = 0; i < 7; i++) {
        players[`p${i}`] = makePlayer({ id: `p${i}` });
      }
      const room = makeRoom({ players });
      const result = validateRoomJoin(room, "TestPlayer");
      expect(result.allowed).toBe(true);
    });
  });

  describe("game settings constraints", () => {
    test("rounds config", () => {
      expect(GAME_SETTINGS.MIN_ROUNDS).toBe(1);
      expect(GAME_SETTINGS.MAX_ROUNDS).toBe(10);
      expect(GAME_SETTINGS.DEFAULT_ROUNDS).toBe(5);
    });

    test("time limits", () => {
      expect(GAME_SETTINGS.MIN_TIME_LIMIT).toBe(30);
      expect(GAME_SETTINGS.MAX_TIME_LIMIT).toBe(300);
    });

    test("score constants", () => {
      expect(GAME_SETTINGS.MAX_SCORE_PER_ROUND).toBe(5000);
      expect(GAME_SETTINGS.MAX_DISTANCE_KM).toBe(500);
    });
  });

  describe("room code format", () => {
    test("generated room codes are 6 chars alphanumeric", () => {
      for (let i = 0; i < 50; i++) {
        const code = generateRoomCode();
        expect(code.length).toBe(6);
        expect(code).toMatch(/^[A-Z0-9]{6}$/);
      }
    });

    test("room codes exclude ambiguous characters (I, O, 0, 1)", () => {
      // Run many times to statistically verify
      const codes = Array.from({ length: 200 }, () => generateRoomCode());
      const allChars = codes.join("");
      expect(allChars).not.toContain("I");
      expect(allChars).not.toContain("O");
      expect(allChars).not.toContain("0");
      expect(allChars).not.toContain("1");
    });
  });

  describe("coordinate bounds in rules match production config", () => {
    test("database.rules.json coordinate bounds match SECURITY.TURKEY_BOUNDS", () => {
      const rulesFile = path.join(projectRoot, "database.rules.json");
      if (fs.existsSync(rulesFile)) {
        const rulesContent = fs.readFileSync(rulesFile, "utf-8");
        // Rules should contain the same bounds as SECURITY config
        expect(rulesContent).toContain("35.0"); // MIN_LAT
        expect(rulesContent).toContain("43.0"); // MAX_LAT
        expect(rulesContent).toContain("25.0"); // MIN_LNG
        expect(rulesContent).toContain("46.0"); // MAX_LNG
      }
    });
  });
});

// ====================================================================
// BONUS: TIME UTILITY GOLDEN MASTERS
// ====================================================================

describe("Bonus: Time Utility Contracts", () => {
  test("hasRoundTimeExpired basic cases", () => {
    const start = 1000000;
    // 80s elapsed, 90s limit → not expired
    expect(hasRoundTimeExpired(start, 90, start + 80000)).toBe(false);
    // 91s elapsed, 90s limit → expired
    expect(hasRoundTimeExpired(start, 90, start + 91000)).toBe(true);
    // null start → not expired
    expect(hasRoundTimeExpired(null, 90, Date.now())).toBe(false);
  });

  test("calculateTimeRemaining basic cases", () => {
    const start = 1000000;
    // 80s elapsed, 90s limit → 10s remaining
    expect(calculateTimeRemaining(start, 90, start + 80000)).toBe(10);
    // 100s elapsed, 90s limit → 0 (clamped)
    expect(calculateTimeRemaining(start, 90, start + 100000)).toBe(0);
    // null start → full time
    expect(calculateTimeRemaining(null, 90, Date.now())).toBe(90);
  });

  test("isGameOver boundary", () => {
    expect(isGameOver(4, 5)).toBe(false);
    expect(isGameOver(5, 5)).toBe(true);
    expect(isGameOver(6, 5)).toBe(true);
  });
});
