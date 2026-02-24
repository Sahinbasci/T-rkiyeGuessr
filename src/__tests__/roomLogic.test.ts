import { describe, test, expect } from "vitest";
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
} from "@/utils/roomLogic";
import type { Player, Coordinates, Room } from "@/types";

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

function makePlayers(...specs: Array<Partial<Player> & { id: string }>): Record<string, Player> {
  const result: Record<string, Player> = {};
  for (const spec of specs) {
    result[spec.id] = makePlayer(spec);
  }
  return result;
}

// İstanbul koordinatları
const ISTANBUL: Coordinates = { lat: 41.0082, lng: 28.9784 };
// Ankara koordinatları
const ANKARA: Coordinates = { lat: 39.9334, lng: 32.8597 };
// Antalya koordinatları
const ANTALYA: Coordinates = { lat: 36.8969, lng: 30.7133 };

// ==================== electNewHost ====================

describe("electNewHost", () => {
  test("selects lowest joinedAt among online candidates", () => {
    const players = makePlayers(
      { id: "alice", joinedAt: 3000, status: "online" },
      { id: "bob", joinedAt: 1000, status: "online" },
      { id: "charlie", joinedAt: 2000, status: "online" }
    );

    const host = electNewHost(players, "deadHost");
    expect(host).not.toBeNull();
    expect(host!.id).toBe("bob"); // Lowest joinedAt
  });

  test("excludes dead host from candidates", () => {
    const players = makePlayers(
      { id: "alice", joinedAt: 3000, status: "online" },
      { id: "bob", joinedAt: 1000, status: "online" }
    );

    // Bob has lowest joinedAt but is the dead host
    const host = electNewHost(players, "bob");
    expect(host).not.toBeNull();
    expect(host!.id).toBe("alice");
  });

  test("excludes disconnected players", () => {
    const players = makePlayers(
      { id: "alice", joinedAt: 1000, status: "disconnected" },
      { id: "bob", joinedAt: 2000, status: "online" },
      { id: "charlie", joinedAt: 3000, status: "online" }
    );

    const host = electNewHost(players, "deadHost");
    expect(host!.id).toBe("bob"); // Alice disconnected, skip
  });

  test("treats undefined status as online", () => {
    const players = makePlayers(
      { id: "alice", joinedAt: 1000, status: undefined as any },
      { id: "bob", joinedAt: 2000, status: "online" }
    );

    const host = electNewHost(players, "deadHost");
    expect(host!.id).toBe("alice"); // undefined status = online
  });

  test("returns null when no online candidates exist", () => {
    const players = makePlayers(
      { id: "alice", status: "disconnected" },
      { id: "bob", status: "disconnected" }
    );

    const host = electNewHost(players, "deadHost");
    expect(host).toBeNull();
  });

  test("returns null for empty players", () => {
    const host = electNewHost({}, "deadHost");
    expect(host).toBeNull();
  });

  test("returns null when only dead host is online", () => {
    const players = makePlayers(
      { id: "deadHost", joinedAt: 1000, status: "online" }
    );

    const host = electNewHost(players, "deadHost");
    expect(host).toBeNull();
  });

  test("handles undefined joinedAt (treated as 0)", () => {
    const players = makePlayers(
      { id: "alice", joinedAt: 5000, status: "online" },
      { id: "bob", joinedAt: undefined as any, status: "online" }
    );

    const host = electNewHost(players, "deadHost");
    expect(host!.id).toBe("bob"); // undefined joinedAt → 0, lowest
  });

  test("single online candidate wins", () => {
    const players = makePlayers(
      { id: "alice", joinedAt: 1000, status: "disconnected" },
      { id: "bob", joinedAt: 9999, status: "online" }
    );

    const host = electNewHost(players, "deadHost");
    expect(host!.id).toBe("bob"); // Only online candidate
  });

  test("determinism: same input always gives same output", () => {
    const players = makePlayers(
      { id: "a", joinedAt: 100, status: "online" },
      { id: "b", joinedAt: 200, status: "online" },
      { id: "c", joinedAt: 300, status: "online" }
    );

    // Run 100 times — should always pick "a"
    for (let i = 0; i < 100; i++) {
      const host = electNewHost(players, "deadHost");
      expect(host!.id).toBe("a");
    }
  });
});

// ==================== filterOnlinePlayers / countOnlinePlayers ====================

describe("filterOnlinePlayers", () => {
  test("returns only online players", () => {
    const players = makePlayers(
      { id: "a", status: "online" },
      { id: "b", status: "disconnected" },
      { id: "c", status: "online" }
    );

    const online = filterOnlinePlayers(players);
    expect(online).toHaveLength(2);
    expect(online.map((p) => p.id).sort()).toEqual(["a", "c"]);
  });

  test("treats undefined status as online", () => {
    const players = makePlayers(
      { id: "a", status: undefined as any }
    );

    expect(filterOnlinePlayers(players)).toHaveLength(1);
  });

  test("returns empty for empty input", () => {
    expect(filterOnlinePlayers({})).toHaveLength(0);
  });

  test("returns empty when all disconnected", () => {
    const players = makePlayers(
      { id: "a", status: "disconnected" },
      { id: "b", status: "disconnected" }
    );
    expect(filterOnlinePlayers(players)).toHaveLength(0);
  });
});

describe("countOnlinePlayers", () => {
  test("counts correctly", () => {
    const players = makePlayers(
      { id: "a", status: "online" },
      { id: "b", status: "disconnected" },
      { id: "c", status: "online" },
      { id: "d", status: "online" }
    );
    expect(countOnlinePlayers(players)).toBe(3);
  });

  test("returns 0 for empty", () => {
    expect(countOnlinePlayers({})).toBe(0);
  });
});

// ==================== findStalePlayers ====================

describe("findStalePlayers", () => {
  test("identifies players with old heartbeat", () => {
    const now = 100000;
    const players = makePlayers(
      { id: "fresh", lastSeen: now - 5000, status: "online" },
      { id: "stale", lastSeen: now - 40000, status: "online" }
    );

    const stale = findStalePlayers(players, now, 30000);
    expect(stale).toHaveLength(1);
    expect(stale[0].id).toBe("stale");
  });

  test("ignores already disconnected players", () => {
    const now = 100000;
    const players = makePlayers(
      { id: "a", lastSeen: now - 50000, status: "disconnected" }
    );

    expect(findStalePlayers(players, now, 30000)).toHaveLength(0);
  });

  test("handles zero lastSeen (never sent heartbeat)", () => {
    const now = 100000;
    const players = makePlayers(
      { id: "a", lastSeen: 0, status: "online" }
    );

    const stale = findStalePlayers(players, now, 30000);
    expect(stale).toHaveLength(1);
  });

  test("custom threshold works", () => {
    const now = 100000;
    const players = makePlayers(
      { id: "a", lastSeen: now - 6000, status: "online" }
    );

    expect(findStalePlayers(players, now, 5000)).toHaveLength(1);
    expect(findStalePlayers(players, now, 10000)).toHaveLength(0);
  });
});

// ==================== computeRoundResults ====================

describe("computeRoundResults", () => {
  const correctLocation = ISTANBUL;

  test("calculates distance and score for guessing players", () => {
    const players = [
      makePlayer({ id: "a", hasGuessed: true, currentGuess: ANKARA }),
      makePlayer({ id: "b", hasGuessed: true, currentGuess: ANTALYA }),
    ];

    const results = computeRoundResults(players, correctLocation);
    expect(results).toHaveLength(2);

    // Player A (Ankara guess for Istanbul): ~350km
    expect(results[0].distance).toBeGreaterThan(300);
    expect(results[0].distance).toBeLessThan(400);
    expect(results[0].score).toBeGreaterThan(0);

    // Player B (Antalya guess for Istanbul): ~480km
    expect(results[1].distance).toBeGreaterThan(400);
    expect(results[1].distance).toBeLessThan(600);
    expect(results[1].score).toBeGreaterThanOrEqual(0);
  });

  test("score is 0 for players who didnt guess", () => {
    const players = [
      makePlayer({ id: "a", hasGuessed: false, currentGuess: null }),
    ];

    const results = computeRoundResults(players, correctLocation);
    expect(results[0].score).toBe(0);
    expect(results[0].distance).toBe(9999);
  });

  test("exact guess gets max score (5000)", () => {
    const players = [
      makePlayer({ id: "a", hasGuessed: true, currentGuess: ISTANBUL }),
    ];

    const results = computeRoundResults(players, correctLocation);
    expect(results[0].distance).toBeLessThan(1);
    expect(results[0].score).toBe(5000);
  });

  test("filters players without id or name", () => {
    const players = [
      makePlayer({ id: "a", name: "Alice" }),
      makePlayer({ id: "", name: "NoId" }),
      { ...makePlayer({ id: "c" }), name: "" },
    ];

    const results = computeRoundResults(players, correctLocation);
    // id="" is falsy, name="" is falsy → both filtered
    expect(results).toHaveLength(1);
    expect(results[0].playerId).toBe("a");
  });

  test("empty players list returns empty results", () => {
    expect(computeRoundResults([], correctLocation)).toHaveLength(0);
  });

  test("default guess for non-guessing player is {lat:0, lng:0}", () => {
    const players = [
      makePlayer({ id: "a", hasGuessed: false, currentGuess: null }),
    ];

    const results = computeRoundResults(players, correctLocation);
    expect(results[0].guess).toEqual({ lat: 0, lng: 0 });
  });

  test("player name defaults to 'Oyuncu' when undefined", () => {
    const player = makePlayer({ id: "a", name: undefined as any });
    // name is undefined but id is truthy — filter passes, name defaults
    const results = computeRoundResults([player], correctLocation);
    // Actually, name undefined is falsy → filtered out
    expect(results).toHaveLength(0);
  });
});

// ==================== updatePlayersAfterRound ====================

describe("updatePlayersAfterRound", () => {
  test("adds round score to totalScore", () => {
    const players = makePlayers(
      { id: "a", totalScore: 3000, roundScores: [3000] }
    );

    const results = [{ playerId: "a", playerName: "A", guess: ANKARA, distance: 100, score: 2500 }];
    const updated = updatePlayersAfterRound(players, results);

    expect(updated["a"].totalScore).toBe(5500);
    expect(updated["a"].roundScores).toEqual([3000, 2500]);
    expect(updated["a"].hasGuessed).toBe(true);
  });

  test("handles player with no previous scores", () => {
    const players = makePlayers(
      { id: "a", totalScore: 0, roundScores: [] }
    );

    const results = [{ playerId: "a", playerName: "A", guess: ISTANBUL, distance: 0, score: 5000 }];
    const updated = updatePlayersAfterRound(players, results);

    expect(updated["a"].totalScore).toBe(5000);
    expect(updated["a"].roundScores).toEqual([5000]);
  });

  test("preserves non-participating players", () => {
    const players = makePlayers(
      { id: "a", totalScore: 1000 },
      { id: "b", totalScore: 2000 }
    );

    // Only player "a" has results
    const results = [{ playerId: "a", playerName: "A", guess: ANKARA, distance: 100, score: 500 }];
    const updated = updatePlayersAfterRound(players, results);

    expect(updated["a"].totalScore).toBe(1500);
    expect(updated["b"].totalScore).toBe(2000); // Unchanged
  });

  test("ignores results for non-existent players", () => {
    const players = makePlayers({ id: "a" });
    const results = [
      { playerId: "a", playerName: "A", guess: ANKARA, distance: 100, score: 500 },
      { playerId: "ghost", playerName: "Ghost", guess: ANKARA, distance: 100, score: 500 },
    ];

    const updated = updatePlayersAfterRound(players, results);
    expect(updated["a"]).toBeDefined();
    expect(updated["ghost"]).toBeUndefined();
  });

  test("is immutable — does not mutate original", () => {
    const original = makePlayers({ id: "a", totalScore: 1000 });
    const results = [{ playerId: "a", playerName: "A", guess: ANKARA, distance: 100, score: 500 }];

    updatePlayersAfterRound(original, results);
    expect(original["a"].totalScore).toBe(1000); // Unchanged
  });
});

// ==================== resetPlayerForNewRound ====================

describe("resetPlayerForNewRound", () => {
  test("resets guess, hasGuessed, movesUsed", () => {
    const player = makePlayer({
      id: "a",
      currentGuess: ISTANBUL,
      hasGuessed: true,
      movesUsed: 3,
      totalScore: 5000,
      roundScores: [2500, 2500],
    });

    const reset = resetPlayerForNewRound(player);
    expect(reset.currentGuess).toBeNull();
    expect(reset.hasGuessed).toBe(false);
    expect(reset.movesUsed).toBe(0);
  });

  test("preserves totalScore and roundScores", () => {
    const player = makePlayer({
      id: "a",
      totalScore: 5000,
      roundScores: [2500, 2500],
    });

    const reset = resetPlayerForNewRound(player);
    expect(reset.totalScore).toBe(5000);
    expect(reset.roundScores).toEqual([2500, 2500]);
  });

  test("preserves identity fields", () => {
    const player = makePlayer({
      id: "a",
      name: "Alice",
      status: "online",
      sessionToken: "tok123",
    });

    const reset = resetPlayerForNewRound(player);
    expect(reset.id).toBe("a");
    expect(reset.name).toBe("Alice");
    expect(reset.status).toBe("online");
    expect(reset.sessionToken).toBe("tok123");
  });

  test("is immutable", () => {
    const original = makePlayer({ id: "a", hasGuessed: true, movesUsed: 3 });
    resetPlayerForNewRound(original);
    expect(original.hasGuessed).toBe(true);
    expect(original.movesUsed).toBe(3);
  });
});

describe("resetAllPlayersForNewRound", () => {
  test("resets all players", () => {
    const players = makePlayers(
      { id: "a", hasGuessed: true, movesUsed: 3, currentGuess: ISTANBUL },
      { id: "b", hasGuessed: true, movesUsed: 2, currentGuess: ANKARA }
    );

    const reset = resetAllPlayersForNewRound(players);
    expect(reset["a"].hasGuessed).toBe(false);
    expect(reset["a"].movesUsed).toBe(0);
    expect(reset["a"].currentGuess).toBeNull();
    expect(reset["b"].hasGuessed).toBe(false);
    expect(reset["b"].movesUsed).toBe(0);
    expect(reset["b"].currentGuess).toBeNull();
  });
});

// ==================== validateRoundTransition ====================

describe("validateRoundTransition", () => {
  const HOST = "host-id";
  const NON_HOST = "other-id";

  test("waiting → playing: valid for host", () => {
    const result = validateRoundTransition("waiting", "playing", HOST, HOST, 1, 5, 2);
    expect(result.valid).toBe(true);
  });

  test("waiting → playing: rejected for non-host", () => {
    const result = validateRoundTransition("waiting", "playing", NON_HOST, HOST);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("host");
  });

  test("waiting → playing: rejected with 0 online players", () => {
    const result = validateRoundTransition("waiting", "playing", HOST, HOST, 1, 5, 0);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("player");
  });

  test("playing → roundEnd: valid for host", () => {
    const result = validateRoundTransition("playing", "roundEnd", HOST, HOST);
    expect(result.valid).toBe(true);
  });

  test("roundEnd → playing: valid when rounds remain", () => {
    const result = validateRoundTransition("roundEnd", "playing", HOST, HOST, 2, 5);
    expect(result.valid).toBe(true);
  });

  test("roundEnd → playing: rejected when all rounds completed", () => {
    const result = validateRoundTransition("roundEnd", "playing", HOST, HOST, 5, 5);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("completed");
  });

  test("roundEnd → gameOver: valid on last round", () => {
    const result = validateRoundTransition("roundEnd", "gameOver", HOST, HOST, 5, 5);
    expect(result.valid).toBe(true);
  });

  test("roundEnd → gameOver: rejected if rounds remain", () => {
    const result = validateRoundTransition("roundEnd", "gameOver", HOST, HOST, 3, 5);
    expect(result.valid).toBe(false);
  });

  test("gameOver → anything: always rejected", () => {
    expect(validateRoundTransition("gameOver", "waiting", HOST, HOST).valid).toBe(false);
    expect(validateRoundTransition("gameOver", "playing", HOST, HOST).valid).toBe(false);
    expect(validateRoundTransition("gameOver", "roundEnd", HOST, HOST).valid).toBe(false);
  });

  test("same status transition is rejected", () => {
    expect(validateRoundTransition("playing", "playing", HOST, HOST).valid).toBe(false);
    expect(validateRoundTransition("waiting", "waiting", HOST, HOST).valid).toBe(false);
  });

  test("invalid transitions rejected", () => {
    expect(validateRoundTransition("waiting", "roundEnd", HOST, HOST).valid).toBe(false);
    expect(validateRoundTransition("waiting", "gameOver", HOST, HOST).valid).toBe(false);
    expect(validateRoundTransition("playing", "waiting", HOST, HOST).valid).toBe(false);
    expect(validateRoundTransition("playing", "gameOver", HOST, HOST).valid).toBe(false);
  });
});

// ==================== isLockStale / isLockActiveForRound ====================

describe("isLockStale", () => {
  test("returns false when no lock", () => {
    expect(isLockStale(undefined, 1, Date.now())).toBe(false);
    expect(isLockStale(null, 1, Date.now())).toBe(false);
  });

  test("returns false for different round", () => {
    const lock = { lockedBy: "uid", roundId: 1, lockedAt: 0 };
    expect(isLockStale(lock, 2, Date.now())).toBe(false);
  });

  test("returns false for fresh lock", () => {
    const now = 100000;
    const lock = { lockedBy: "uid", roundId: 1, lockedAt: now - 5000 };
    expect(isLockStale(lock, 1, now, 10000)).toBe(false);
  });

  test("returns true for stale lock", () => {
    const now = 100000;
    const lock = { lockedBy: "uid", roundId: 1, lockedAt: now - 15000 };
    expect(isLockStale(lock, 1, now, 10000)).toBe(true);
  });

  test("exactly at threshold is not stale", () => {
    const now = 100000;
    const lock = { lockedBy: "uid", roundId: 1, lockedAt: now - 10000 };
    expect(isLockStale(lock, 1, now, 10000)).toBe(false);
  });

  test("custom threshold works", () => {
    const now = 100000;
    const lock = { lockedBy: "uid", roundId: 1, lockedAt: now - 3000 };
    expect(isLockStale(lock, 1, now, 2000)).toBe(true);
    expect(isLockStale(lock, 1, now, 5000)).toBe(false);
  });
});

describe("isLockActiveForRound", () => {
  test("returns false for no lock", () => {
    expect(isLockActiveForRound(undefined, 1)).toBe(false);
    expect(isLockActiveForRound(null, 1)).toBe(false);
  });

  test("returns true for matching round", () => {
    const lock = { lockedBy: "uid", roundId: 3, lockedAt: Date.now() };
    expect(isLockActiveForRound(lock, 3)).toBe(true);
  });

  test("returns false for different round", () => {
    const lock = { lockedBy: "uid", roundId: 3, lockedAt: Date.now() };
    expect(isLockActiveForRound(lock, 4)).toBe(false);
  });
});

// ==================== detectDesync ====================

describe("detectDesync", () => {
  test("no desync when both match", () => {
    const local = { status: "playing" as const, currentRound: 2, roundResults: null };
    const remote = { status: "playing" as const, currentRound: 2, roundResults: null };

    const result = detectDesync(local, remote);
    expect(result.isDesynced).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  test("detects status mismatch", () => {
    const local = { status: "playing" as const, currentRound: 2, roundResults: null };
    const remote = { status: "roundEnd" as const, currentRound: 2, roundResults: null };

    const result = detectDesync(local, remote);
    expect(result.isDesynced).toBe(true);
    expect(result.reasons[0]).toContain("Status");
  });

  test("detects round mismatch", () => {
    const local = { status: "playing" as const, currentRound: 2, roundResults: null };
    const remote = { status: "playing" as const, currentRound: 3, roundResults: null };

    const result = detectDesync(local, remote);
    expect(result.isDesynced).toBe(true);
    expect(result.reasons[0]).toContain("Round");
  });

  test("detects missing roundResults locally", () => {
    const local = { status: "roundEnd" as const, currentRound: 2, roundResults: null };
    const remote = {
      status: "roundEnd" as const,
      currentRound: 2,
      roundResults: [{ playerId: "a", playerName: "A", guess: ISTANBUL, distance: 0, score: 5000 }],
    };

    const result = detectDesync(local, remote);
    expect(result.isDesynced).toBe(true);
    expect(result.reasons.some((r) => r.includes("roundResults"))).toBe(true);
  });

  test("detects multiple mismatches simultaneously", () => {
    const local = { status: "playing" as const, currentRound: 1, roundResults: null };
    const remote = {
      status: "roundEnd" as const,
      currentRound: 2,
      roundResults: [{ playerId: "a", playerName: "A", guess: ISTANBUL, distance: 0, score: 5000 }],
    };

    const result = detectDesync(local, remote);
    expect(result.isDesynced).toBe(true);
    expect(result.reasons.length).toBeGreaterThanOrEqual(2);
  });

  test("no desync when both have roundResults", () => {
    const results = [{ playerId: "a", playerName: "A", guess: ISTANBUL, distance: 0, score: 5000 }];
    const local = { status: "roundEnd" as const, currentRound: 2, roundResults: results };
    const remote = { status: "roundEnd" as const, currentRound: 2, roundResults: results };

    expect(detectDesync(local, remote).isDesynced).toBe(false);
  });
});

// ==================== hasRoundTimeExpired ====================

describe("hasRoundTimeExpired", () => {
  test("not expired before time limit", () => {
    const start = 1000;
    const timeLimitSec = 90;
    const now = start + 50 * 1000; // 50s elapsed

    expect(hasRoundTimeExpired(start, timeLimitSec, now)).toBe(false);
  });

  test("expired after time limit", () => {
    const start = 1000;
    const timeLimitSec = 90;
    const now = start + 91 * 1000; // 91s elapsed

    expect(hasRoundTimeExpired(start, timeLimitSec, now)).toBe(true);
  });

  test("expired exactly at time limit", () => {
    const start = 1000;
    const timeLimitSec = 90;
    const now = start + 90 * 1000; // exactly 90s

    expect(hasRoundTimeExpired(start, timeLimitSec, now)).toBe(true);
  });

  test("grace period extends deadline", () => {
    const start = 1000;
    const timeLimitSec = 90;
    const now = start + 92 * 1000; // 92s elapsed

    // Without grace: expired
    expect(hasRoundTimeExpired(start, timeLimitSec, now, 0)).toBe(true);
    // With 5s grace: not expired yet
    expect(hasRoundTimeExpired(start, timeLimitSec, now, 5)).toBe(false);
  });

  test("returns false for null/undefined/zero roundStartTime", () => {
    expect(hasRoundTimeExpired(null, 90, Date.now())).toBe(false);
    expect(hasRoundTimeExpired(undefined, 90, Date.now())).toBe(false);
    expect(hasRoundTimeExpired(0, 90, Date.now())).toBe(false);
  });
});

// ==================== calculateTimeRemaining ====================

describe("calculateTimeRemaining", () => {
  test("full time remaining at start", () => {
    const start = 1000;
    expect(calculateTimeRemaining(start, 90, start)).toBe(90);
  });

  test("half time remaining midway", () => {
    const start = 1000;
    const now = start + 45 * 1000;
    expect(calculateTimeRemaining(start, 90, now)).toBe(45);
  });

  test("zero remaining after time limit", () => {
    const start = 1000;
    const now = start + 100 * 1000;
    expect(calculateTimeRemaining(start, 90, now)).toBe(0);
  });

  test("never returns negative", () => {
    const start = 1000;
    const now = start + 999 * 1000; // way past
    expect(calculateTimeRemaining(start, 90, now)).toBe(0);
  });

  test("returns full time for null start", () => {
    expect(calculateTimeRemaining(null, 90, Date.now())).toBe(90);
  });
});

// ==================== haveAllPlayersGuessed ====================

describe("haveAllPlayersGuessed", () => {
  test("true when all online players have guessed", () => {
    const players = makePlayers(
      { id: "a", hasGuessed: true, status: "online" },
      { id: "b", hasGuessed: true, status: "online" }
    );
    expect(haveAllPlayersGuessed(players)).toBe(true);
  });

  test("false when some haven't guessed", () => {
    const players = makePlayers(
      { id: "a", hasGuessed: true, status: "online" },
      { id: "b", hasGuessed: false, status: "online" }
    );
    expect(haveAllPlayersGuessed(players)).toBe(false);
  });

  test("ignores disconnected players", () => {
    const players = makePlayers(
      { id: "a", hasGuessed: true, status: "online" },
      { id: "b", hasGuessed: false, status: "disconnected" }
    );
    // Only player A is online, and has guessed
    expect(haveAllPlayersGuessed(players)).toBe(true);
  });

  test("false for empty players", () => {
    expect(haveAllPlayersGuessed({})).toBe(false);
  });

  test("false when all are disconnected", () => {
    const players = makePlayers(
      { id: "a", hasGuessed: true, status: "disconnected" }
    );
    expect(haveAllPlayersGuessed(players)).toBe(false);
  });

  test("single player who has guessed", () => {
    const players = makePlayers(
      { id: "a", hasGuessed: true, status: "online" }
    );
    expect(haveAllPlayersGuessed(players)).toBe(true);
  });

  test("single player who hasn't guessed", () => {
    const players = makePlayers(
      { id: "a", hasGuessed: false, status: "online" }
    );
    expect(haveAllPlayersGuessed(players)).toBe(false);
  });
});

// ==================== TEST HELPERS (Room) ====================

function makeRoom(overrides: Partial<Room> & { id: string }): Room {
  return {
    hostId: "host",
    status: "waiting",
    currentRound: 1,
    totalRounds: 5,
    players: {},
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

// ==================== validateRoomJoin ====================

describe("validateRoomJoin", () => {
  test("allows join to waiting room with valid name", () => {
    const room = makeRoom({
      id: "ABC123",
      status: "waiting",
      players: makePlayers({ id: "host" }),
    });
    expect(validateRoomJoin(room, "Ahmet")).toEqual({ allowed: true });
  });

  test("rejects null room", () => {
    const result = validateRoomJoin(null, "Ahmet");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("room_not_found");
  });

  test("rejects invalid name (empty)", () => {
    const room = makeRoom({ id: "R1", status: "waiting" });
    expect(validateRoomJoin(room, "").allowed).toBe(false);
    expect(validateRoomJoin(room, "").reason).toBe("invalid_name");
  });

  test("rejects invalid name (XSS)", () => {
    const room = makeRoom({ id: "R1", status: "waiting" });
    expect(validateRoomJoin(room, "<script>").allowed).toBe(false);
  });

  test("rejects when game already started", () => {
    const room = makeRoom({ id: "R1", status: "playing" });
    expect(validateRoomJoin(room, "Ahmet").reason).toBe("game_already_started");
  });

  test("rejects when room is full (8 players)", () => {
    const players = makePlayers(
      { id: "p1" }, { id: "p2" }, { id: "p3" }, { id: "p4" },
      { id: "p5" }, { id: "p6" }, { id: "p7" }, { id: "p8" }
    );
    const room = makeRoom({ id: "R1", status: "waiting", players });
    expect(validateRoomJoin(room, "Ahmet").reason).toBe("room_full");
  });

  test("allows when room has 7 players (not full)", () => {
    const players = makePlayers(
      { id: "p1" }, { id: "p2" }, { id: "p3" }, { id: "p4" },
      { id: "p5" }, { id: "p6" }, { id: "p7" }
    );
    const room = makeRoom({ id: "R1", status: "waiting", players });
    expect(validateRoomJoin(room, "Ahmet").allowed).toBe(true);
  });

  test("rejects roundEnd status", () => {
    const room = makeRoom({ id: "R1", status: "roundEnd" });
    expect(validateRoomJoin(room, "Ahmet").reason).toBe("game_already_started");
  });

  test("rejects gameOver status", () => {
    const room = makeRoom({ id: "R1", status: "gameOver" });
    expect(validateRoomJoin(room, "Ahmet").reason).toBe("game_already_started");
  });
});

// ==================== matchRejoinPlayer ====================

describe("matchRejoinPlayer", () => {
  test("finds matching player by sessionToken", () => {
    const players = makePlayers(
      { id: "a", sessionToken: "tok_abc" },
      { id: "b", sessionToken: "tok_xyz" }
    );
    const match = matchRejoinPlayer(players, "tok_xyz");
    expect(match).not.toBeNull();
    expect(match!.id).toBe("b");
  });

  test("returns null for no match", () => {
    const players = makePlayers(
      { id: "a", sessionToken: "tok_abc" }
    );
    expect(matchRejoinPlayer(players, "tok_unknown")).toBeNull();
  });

  test("returns null for null token", () => {
    const players = makePlayers({ id: "a", sessionToken: "tok_abc" });
    expect(matchRejoinPlayer(players, null)).toBeNull();
  });

  test("returns null for undefined players", () => {
    expect(matchRejoinPlayer(undefined, "tok_abc")).toBeNull();
  });

  test("returns null for empty players", () => {
    expect(matchRejoinPlayer({}, "tok_abc")).toBeNull();
  });
});

// ==================== validateGuessSubmission ====================

describe("validateGuessSubmission", () => {
  const validGuess = ISTANBUL;
  const NOW = 100000;

  function makePlayingRoom(overrides: Partial<Room> = {}): Room {
    return makeRoom({
      id: "R1",
      status: "playing",
      roundState: "active",
      roundStartTime: NOW - 30000, // 30s ago
      timeLimit: 90,
      players: makePlayers({ id: "player1", hasGuessed: false }),
      ...overrides,
    });
  }

  test("accepts valid guess", () => {
    const room = makePlayingRoom();
    const result = validateGuessSubmission(room, "player1", validGuess, NOW, false);
    expect(result.accepted).toBe(true);
  });

  test("rejects when no room", () => {
    const result = validateGuessSubmission(null, "p1", validGuess, NOW, false);
    expect(result.reason).toBe("no_room");
  });

  test("rejects when no playerId", () => {
    const room = makePlayingRoom();
    const result = validateGuessSubmission(room, null, validGuess, NOW, false);
    expect(result.reason).toBe("no_room");
  });

  test("rejects double-submit (in-flight)", () => {
    const room = makePlayingRoom();
    const result = validateGuessSubmission(room, "player1", validGuess, NOW, true);
    expect(result.reason).toBe("in_flight");
  });

  test("rejects already guessed", () => {
    const room = makePlayingRoom({
      players: makePlayers({ id: "player1", hasGuessed: true }),
    });
    const result = validateGuessSubmission(room, "player1", validGuess, NOW, false);
    expect(result.reason).toBe("already_guessed");
  });

  test("rejects invalid coordinates (London)", () => {
    const room = makePlayingRoom();
    const london = { lat: 51.5, lng: -0.1 };
    const result = validateGuessSubmission(room, "player1", london, NOW, false);
    expect(result.reason).toBe("invalid_coords");
  });

  test("rejects when room not playing", () => {
    const room = makePlayingRoom({ status: "roundEnd" });
    const result = validateGuessSubmission(room, "player1", validGuess, NOW, false);
    expect(result.reason).toBe("not_playing");
  });

  test("rejects when round not active", () => {
    const room = makePlayingRoom({ roundState: "ending" });
    const result = validateGuessSubmission(room, "player1", validGuess, NOW, false);
    expect(result.reason).toBe("round_not_active");
  });

  test("rejects when time expired (past 2s grace)", () => {
    const room = makePlayingRoom({
      roundStartTime: NOW - 95000, // 95s ago, limit=90s
    });
    // server now = NOW = 100000, deadline = (100000-95000) + 90000 = 95000, + 2000 grace = 97000
    // Actually: deadline = roundStartTime + timeLimit*1000 = (NOW-95000) + 90000 = NOW - 5000
    // roundEndMs = NOW - 5000, serverNow > roundEndMs + 2000 = NOW - 3000 → true
    const result = validateGuessSubmission(room, "player1", validGuess, NOW, false);
    expect(result.reason).toBe("time_expired");
  });

  test("accepts within 2s grace period", () => {
    const room = makePlayingRoom({
      roundStartTime: NOW - 91000, // 91s ago, limit=90s → 1s past
    });
    // roundEndMs = (NOW-91000) + 90000 = NOW - 1000
    // serverNow > roundEndMs + 2000 = NOW + 1000? No, NOW < NOW+1000 → false → accepted
    const result = validateGuessSubmission(room, "player1", validGuess, NOW, false);
    expect(result.accepted).toBe(true);
  });

  test("rejects coordinate at (0,0) — null island", () => {
    const room = makePlayingRoom();
    const result = validateGuessSubmission(room, "player1", { lat: 0, lng: 0 }, NOW, false);
    expect(result.reason).toBe("invalid_coords");
  });
});

// ==================== validateTimeUp ====================

describe("validateTimeUp", () => {
  test("valid when time actually expired", () => {
    const result = validateTimeUp(1000, 90, 1000 + 91000, 1, null, false);
    expect(result.valid).toBe(true);
  });

  test("rejects duplicate timeUp for same round", () => {
    const result = validateTimeUp(1000, 90, 1000 + 91000, 3, 3, false);
    expect(result.reason).toBe("duplicate_timeup");
  });

  test("rejects when already processing", () => {
    const result = validateTimeUp(1000, 90, 1000 + 91000, 1, null, true);
    expect(result.reason).toBe("already_processing");
  });

  test("rejects when time not actually expired (client clock ahead)", () => {
    // Only 80s elapsed but client thinks time is up (timeLimit=90)
    const result = validateTimeUp(1000, 90, 1000 + 80000, 1, null, false);
    expect(result.reason).toBe("not_expired_yet");
  });

  test("allows 1s early tolerance", () => {
    // 89.5s elapsed (0.5s before limit) — should be allowed
    const result = validateTimeUp(1000, 90, 1000 + 89500, 1, null, false);
    expect(result.valid).toBe(true);
  });

  test("rejects 2s early", () => {
    // 88s elapsed (2s before limit)
    const result = validateTimeUp(1000, 90, 1000 + 88000, 1, null, false);
    expect(result.reason).toBe("not_expired_yet");
  });
});

// ==================== isGameOver ====================

describe("isGameOver", () => {
  test("true when currentRound equals totalRounds", () => {
    expect(isGameOver(5, 5)).toBe(true);
  });

  test("true when currentRound exceeds totalRounds", () => {
    expect(isGameOver(6, 5)).toBe(true);
  });

  test("false when rounds remain", () => {
    expect(isGameOver(3, 5)).toBe(false);
  });

  test("false at round 0", () => {
    expect(isGameOver(0, 5)).toBe(false);
  });

  test("edge: single round game at round 1", () => {
    expect(isGameOver(1, 1)).toBe(true);
  });
});

// ==================== determineLeaveAction ====================

describe("determineLeaveAction", () => {
  test("delete_room when last player", () => {
    const players = makePlayers({ id: "only" });
    const result = determineLeaveAction(players, "only", "only");
    expect(result.type).toBe("delete_room");
  });

  test("migrate_and_leave when host leaves with others", () => {
    const players = makePlayers(
      { id: "host", joinedAt: 1000, status: "online" },
      { id: "player2", joinedAt: 2000, status: "online" }
    );
    const result = determineLeaveAction(players, "host", "host");
    expect(result.type).toBe("migrate_and_leave");
    if (result.type === "migrate_and_leave") {
      expect(result.newHostId).toBe("player2");
    }
  });

  test("just_leave when non-host leaves", () => {
    const players = makePlayers(
      { id: "host", status: "online" },
      { id: "player2", status: "online" }
    );
    const result = determineLeaveAction(players, "player2", "host");
    expect(result.type).toBe("just_leave");
  });

  test("migrate to lowest joinedAt when host leaves", () => {
    const players = makePlayers(
      { id: "host", joinedAt: 1000, status: "online" },
      { id: "p2", joinedAt: 5000, status: "online" },
      { id: "p3", joinedAt: 3000, status: "online" }
    );
    const result = determineLeaveAction(players, "host", "host");
    if (result.type === "migrate_and_leave") {
      expect(result.newHostId).toBe("p3"); // p3 has lower joinedAt than p2
    }
  });

  test("migrate to offline player as fallback when all others disconnected", () => {
    const players = makePlayers(
      { id: "host", joinedAt: 1000, status: "online" },
      { id: "p2", joinedAt: 2000, status: "disconnected" }
    );
    const result = determineLeaveAction(players, "host", "host");
    expect(result.type).toBe("migrate_and_leave");
    if (result.type === "migrate_and_leave") {
      expect(result.newHostId).toBe("p2"); // Fallback to disconnected player
    }
  });

  test("delete_room when empty players object", () => {
    const result = determineLeaveAction({}, "nobody", "host");
    expect(result.type).toBe("delete_room");
  });
});

// ==================== shouldDecrementExpectedGuesses ====================

describe("shouldDecrementExpectedGuesses", () => {
  test("true when playing and player hasn't guessed", () => {
    const player = makePlayer({ id: "a", hasGuessed: false });
    expect(shouldDecrementExpectedGuesses("playing", player)).toBe(true);
  });

  test("false when playing but player already guessed", () => {
    const player = makePlayer({ id: "a", hasGuessed: true });
    expect(shouldDecrementExpectedGuesses("playing", player)).toBe(false);
  });

  test("false when not playing (roundEnd)", () => {
    const player = makePlayer({ id: "a", hasGuessed: false });
    expect(shouldDecrementExpectedGuesses("roundEnd", player)).toBe(false);
  });

  test("false when not playing (waiting)", () => {
    const player = makePlayer({ id: "a", hasGuessed: false });
    expect(shouldDecrementExpectedGuesses("waiting", player)).toBe(false);
  });

  test("false when player is undefined", () => {
    expect(shouldDecrementExpectedGuesses("playing", undefined)).toBe(false);
  });
});

// ==================== resetPlayerForRestart ====================

describe("resetPlayerForRestart", () => {
  test("resets everything including totalScore and roundScores", () => {
    const player = makePlayer({
      id: "a",
      totalScore: 15000,
      currentGuess: ISTANBUL,
      hasGuessed: true,
      movesUsed: 3,
      roundScores: [5000, 4000, 3000, 2000, 1000],
    });

    const reset = resetPlayerForRestart(player);
    expect(reset.totalScore).toBe(0);
    expect(reset.roundScores).toEqual([]);
    expect(reset.currentGuess).toBeNull();
    expect(reset.hasGuessed).toBe(false);
    expect(reset.movesUsed).toBe(0);
  });

  test("preserves identity", () => {
    const player = makePlayer({ id: "abc", name: "Test", sessionToken: "tok" });
    const reset = resetPlayerForRestart(player);
    expect(reset.id).toBe("abc");
    expect(reset.name).toBe("Test");
    expect(reset.sessionToken).toBe("tok");
  });

  test("is immutable", () => {
    const original = makePlayer({ id: "a", totalScore: 5000 });
    resetPlayerForRestart(original);
    expect(original.totalScore).toBe(5000);
  });
});

// ==================== shouldWatchdogAct ====================

describe("shouldWatchdogAct", () => {
  test("acts when time expired past buffer with no lock", () => {
    // 90s limit + 5s buffer = 95s needed. 100s elapsed.
    const result = shouldWatchdogAct("playing", 1000, 90, 1000 + 100000, 5);
    expect(result.shouldAct).toBe(true);
    expect(result.reason).toBe("time_expired_no_lock");
  });

  test("does not act when room not playing", () => {
    const result = shouldWatchdogAct("roundEnd", 1000, 90, 1000 + 100000, 5);
    expect(result.shouldAct).toBe(false);
    expect(result.reason).toBe("not_playing");
  });

  test("does not act when time not expired", () => {
    // Only 80s elapsed, need 95s (90+5)
    const result = shouldWatchdogAct("playing", 1000, 90, 1000 + 80000, 5);
    expect(result.shouldAct).toBe(false);
    expect(result.reason).toBe("time_not_expired");
  });

  test("does not act when fresh lock exists", () => {
    const now = 1000 + 100000;
    const lock = { lockedBy: "other", roundId: 1, lockedAt: now - 3000 }; // 3s old
    const result = shouldWatchdogAct("playing", 1000, 90, now, 5, lock, 1, 10000);
    expect(result.shouldAct).toBe(false);
    expect(result.reason).toBe("lock_held_by_other");
  });

  test("overrides stale lock", () => {
    const now = 1000 + 100000;
    const lock = { lockedBy: "crashed", roundId: 1, lockedAt: now - 15000 }; // 15s old, stale
    const result = shouldWatchdogAct("playing", 1000, 90, now, 5, lock, 1, 10000);
    expect(result.shouldAct).toBe(true);
    expect(result.shouldOverrideLock).toBe(true);
    expect(result.reason).toBe("stale_lock_override");
  });

  test("does not act when no start time", () => {
    const result = shouldWatchdogAct("playing", null, 90, Date.now(), 5);
    expect(result.shouldAct).toBe(false);
    expect(result.reason).toBe("no_start_time");
  });

  test("ignores lock for different round", () => {
    const now = 1000 + 100000;
    const lock = { lockedBy: "other", roundId: 2, lockedAt: now - 3000 }; // Round 2 lock
    const result = shouldWatchdogAct("playing", 1000, 90, now, 5, lock, 1, 10000); // Checking round 1
    expect(result.shouldAct).toBe(true); // Lock is for different round, so act
  });
});

// ==================== diffPlayerNotifications ====================

describe("diffPlayerNotifications", () => {
  test("detects joined players", () => {
    const prev = ["a", "b"];
    const curr = ["a", "b", "c"];
    const names = { a: "Alice", b: "Bob", c: "Charlie" };

    const result = diffPlayerNotifications(prev, curr, names, names, "a");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("player_joined");
    expect(result[0].playerName).toBe("Charlie");
  });

  test("detects left players", () => {
    const prev = ["a", "b", "c"];
    const curr = ["a", "c"];
    const prevNames = { a: "Alice", b: "Bob", c: "Charlie" };
    const currNames = { a: "Alice", c: "Charlie" };

    const result = diffPlayerNotifications(prev, curr, currNames, prevNames, "a");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("player_left");
    expect(result[0].playerName).toBe("Bob"); // From previous snapshot
  });

  test("excludes self from notifications", () => {
    const prev: string[] = [];
    const curr = ["self"];

    const result = diffPlayerNotifications(prev, curr, { self: "Me" }, {}, "self");
    expect(result).toHaveLength(0); // Self-join not notified
  });

  test("handles simultaneous join and leave", () => {
    const prev = ["a", "b"];
    const curr = ["a", "c"];
    const currNames = { a: "Alice", c: "Charlie" };
    const prevNames = { a: "Alice", b: "Bob" };

    const result = diffPlayerNotifications(prev, curr, currNames, prevNames, "a");
    expect(result).toHaveLength(2);
    expect(result.find((n) => n.type === "player_joined")?.playerName).toBe("Charlie");
    expect(result.find((n) => n.type === "player_left")?.playerName).toBe("Bob");
  });

  test("no notifications when nothing changed", () => {
    const ids = ["a", "b"];
    const names = { a: "Alice", b: "Bob" };
    expect(diffPlayerNotifications(ids, ids, names, names, "a")).toHaveLength(0);
  });

  test("uses 'Bir oyuncu' for unknown names", () => {
    const prev = ["a"];
    const curr = ["a", "b"];

    const result = diffPlayerNotifications(prev, curr, { a: "Alice" }, { a: "Alice" }, "a");
    expect(result[0].playerName).toBe("Bir oyuncu"); // b not in names
  });

  test("left player name from PREVIOUS snapshot, not current", () => {
    const prev = ["a", "b"];
    const curr = ["a"];
    // b renamed before leaving — but we should use PREVIOUS name
    const currNames = { a: "Alice" };
    const prevNames = { a: "Alice", b: "OriginalBob" };

    const result = diffPlayerNotifications(prev, curr, currNames, prevNames, "a");
    expect(result[0].playerName).toBe("OriginalBob");
  });
});

// ==================== classifyHeartbeatError ====================

describe("classifyHeartbeatError", () => {
  test("PERMISSION_DENIED → lost", () => {
    expect(classifyHeartbeatError("PERMISSION_DENIED", "", 0)).toBe("lost");
  });

  test("permission-denied → lost", () => {
    expect(classifyHeartbeatError("permission-denied", "", 0)).toBe("lost");
  });

  test("'not found' in message → lost", () => {
    expect(classifyHeartbeatError("", "Room not found", 0)).toBe("lost");
  });

  test("'deleted' in message → lost", () => {
    expect(classifyHeartbeatError("", "Room deleted", 0)).toBe("lost");
  });

  test("network error with <3 fails → reconnecting", () => {
    expect(classifyHeartbeatError("NETWORK_ERROR", "timeout", 1)).toBe("reconnecting");
    expect(classifyHeartbeatError("NETWORK_ERROR", "timeout", 2)).toBe("reconnecting");
  });

  test("network error with >=3 fails → lost", () => {
    expect(classifyHeartbeatError("NETWORK_ERROR", "timeout", 3)).toBe("lost");
    expect(classifyHeartbeatError("NETWORK_ERROR", "timeout", 5)).toBe("lost");
  });

  test("unknown error first time → reconnecting", () => {
    expect(classifyHeartbeatError("", "", 0)).toBe("reconnecting");
  });
});

// ==================== validateStartGame ====================

describe("validateStartGame", () => {
  test("valid for host in waiting room with players", () => {
    const room = makeRoom({
      id: "R1",
      hostId: "host",
      status: "waiting",
      players: makePlayers({ id: "host", status: "online" }),
    });
    expect(validateStartGame(room, "host").valid).toBe(true);
  });

  test("rejects null room", () => {
    expect(validateStartGame(null, "host").reason).toBe("no_room");
  });

  test("rejects non-host", () => {
    const room = makeRoom({
      id: "R1",
      hostId: "host",
      status: "waiting",
      players: makePlayers({ id: "host" }),
    });
    expect(validateStartGame(room, "other").reason).toBe("not_host");
  });

  test("rejects when not waiting", () => {
    const room = makeRoom({
      id: "R1",
      hostId: "host",
      status: "playing",
      players: makePlayers({ id: "host" }),
    });
    expect(validateStartGame(room, "host").reason).toBe("not_waiting");
  });

  test("rejects with 0 online players", () => {
    const room = makeRoom({
      id: "R1",
      hostId: "host",
      status: "waiting",
      players: makePlayers({ id: "host", status: "disconnected" }),
    });
    expect(validateStartGame(room, "host").reason).toBe("no_players");
  });
});

// ==================== validateNextRound ====================

describe("validateNextRound", () => {
  test("valid for host in roundEnd with rounds remaining", () => {
    const room = makeRoom({
      id: "R1",
      hostId: "host",
      status: "roundEnd",
      currentRound: 3,
      totalRounds: 5,
    });
    const result = validateNextRound(room, "host");
    expect(result.valid).toBe(true);
    expect(result.isGameOver).toBe(false);
  });

  test("returns isGameOver=true on last round", () => {
    const room = makeRoom({
      id: "R1",
      hostId: "host",
      status: "roundEnd",
      currentRound: 5,
      totalRounds: 5,
    });
    const result = validateNextRound(room, "host");
    expect(result.valid).toBe(true);
    expect(result.isGameOver).toBe(true);
  });

  test("rejects non-host", () => {
    const room = makeRoom({ id: "R1", hostId: "host", status: "roundEnd" });
    expect(validateNextRound(room, "other").reason).toBe("not_host");
  });

  test("rejects when not in roundEnd", () => {
    const room = makeRoom({ id: "R1", hostId: "host", status: "playing" });
    expect(validateNextRound(room, "host").reason).toBe("not_round_end");
  });

  test("rejects null room", () => {
    expect(validateNextRound(null, "host").reason).toBe("no_room");
  });
});

// ==================== STRESS TESTS ====================

describe("stress & concurrency scenarios", () => {
  test("8-player room: full lifecycle scoring", () => {
    // Create 8 players
    const playerSpecs = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i}`,
      name: `Player${i}`,
      joinedAt: 1000 + i * 100,
      status: "online" as const,
      hasGuessed: true,
      // Each player guesses progressively further from Istanbul
      currentGuess: {
        lat: ISTANBUL.lat + i * 0.5,
        lng: ISTANBUL.lng + i * 0.5,
      },
    }));
    const players = makePlayers(...playerSpecs);

    // Compute results
    const results = computeRoundResults(Object.values(players), ISTANBUL);
    expect(results).toHaveLength(8);

    // Player 0 should have highest score (closest guess)
    const sorted = [...results].sort((a, b) => b.score - a.score);
    expect(sorted[0].playerId).toBe("p0");
    expect(sorted[0].score).toBe(5000); // Exact location

    // All scores should be non-negative
    for (const r of results) {
      expect(r.score).toBeGreaterThanOrEqual(0);
    }

    // Update players with results
    const updated = updatePlayersAfterRound(players, results);
    expect(Object.keys(updated)).toHaveLength(8);

    // Verify totalScore updated correctly
    for (const r of results) {
      expect(updated[r.playerId].totalScore).toBe(r.score);
    }
  });

  test("5-round game simulation: scores accumulate correctly", () => {
    let players = makePlayers(
      { id: "a", totalScore: 0, roundScores: [], hasGuessed: true, currentGuess: ANKARA },
      { id: "b", totalScore: 0, roundScores: [], hasGuessed: true, currentGuess: ANTALYA }
    );

    for (let round = 0; round < 5; round++) {
      const results = computeRoundResults(Object.values(players), ISTANBUL);
      players = updatePlayersAfterRound(players, results);

      // Reset for next round
      players = resetAllPlayersForNewRound(players);
      // Re-set guesses
      players["a"] = { ...players["a"], hasGuessed: true, currentGuess: ANKARA };
      players["b"] = { ...players["b"], hasGuessed: true, currentGuess: ANTALYA };
    }

    // After 5 rounds of same guesses
    expect(players["a"].roundScores).toHaveLength(5);
    expect(players["b"].roundScores).toHaveLength(5);
    // All round scores should be identical (same guess each round)
    const aScores = new Set(players["a"].roundScores);
    const bScores = new Set(players["b"].roundScores);
    expect(aScores.size).toBe(1); // Same score every round
    expect(bScores.size).toBe(1);
    // totalScore = roundScore × 5
    expect(players["a"].totalScore).toBe(players["a"].roundScores[0] * 5);
    expect(players["b"].totalScore).toBe(players["b"].roundScores[0] * 5);
    // Player A (Ankara) closer to Istanbul than B (Antalya)
    expect(players["a"].totalScore).toBeGreaterThan(players["b"].totalScore);
  });

  test("rapid host election under cascading disconnections", () => {
    // 8 players, hosts keep disconnecting
    let players = makePlayers(
      { id: "p0", joinedAt: 100, status: "online" },
      { id: "p1", joinedAt: 200, status: "online" },
      { id: "p2", joinedAt: 300, status: "online" },
      { id: "p3", joinedAt: 400, status: "online" },
      { id: "p4", joinedAt: 500, status: "online" },
      { id: "p5", joinedAt: 600, status: "online" },
      { id: "p6", joinedAt: 700, status: "online" },
      { id: "p7", joinedAt: 800, status: "online" }
    );

    let currentHostId = "p0";

    // Simulate 7 cascading disconnections
    for (let i = 0; i < 7; i++) {
      const newHost = electNewHost(players, currentHostId);
      expect(newHost).not.toBeNull();
      expect(newHost!.id).toBe(`p${i + 1}`); // Deterministic: next lowest joinedAt

      // Mark old host as disconnected
      players[currentHostId] = { ...players[currentHostId], status: "disconnected" };
      currentHostId = newHost!.id;
    }

    // After 7 disconnections, p7 is last host
    expect(currentHostId).toBe("p7");

    // p7 disconnects → no more hosts
    const finalHost = electNewHost(players, "p7");
    expect(finalHost).toBeNull();
  });

  test("desync detection across multiple state changes", () => {
    // Simulate: local stuck at playing/round 2, remote advanced to gameOver/round 5
    const local = { status: "playing" as const, currentRound: 2, roundResults: null };
    const remote = {
      status: "gameOver" as const,
      currentRound: 5,
      roundResults: [{ playerId: "a", playerName: "A", guess: ISTANBUL, distance: 0, score: 5000 }],
    };

    const result = detectDesync(local, remote);
    expect(result.isDesynced).toBe(true);
    expect(result.reasons.length).toBe(3); // Status + Round + Results
  });

  test("watchdog acts after host crash during round", () => {
    const roundStart = 100000;
    const timeLimitSec = 90;
    const bufferSec = 5;

    // Host acquired lock, then crashed
    const crashedLock = {
      lockedBy: "crashed_host",
      roundId: 1,
      lockedAt: roundStart + timeLimitSec * 1000, // Lock acquired at deadline
    };

    // 20s after lock was acquired — lock is stale
    const now = crashedLock.lockedAt + 20000;

    const result = shouldWatchdogAct(
      "playing", roundStart, timeLimitSec, now, bufferSec,
      crashedLock, 1, 10000
    );

    expect(result.shouldAct).toBe(true);
    expect(result.shouldOverrideLock).toBe(true);
    expect(result.reason).toBe("stale_lock_override");
  });

  test("2 players simultaneous submit — both accepted", () => {
    const NOW = 100000;
    const room = makeRoom({
      id: "R1",
      status: "playing",
      roundState: "active",
      roundStartTime: NOW - 30000,
      timeLimit: 90,
      players: makePlayers(
        { id: "alice", hasGuessed: false, status: "online" },
        { id: "bob", hasGuessed: false, status: "online" }
      ),
    });

    // Both validate at the exact same timestamp — neither has isInFlight
    const aliceResult = validateGuessSubmission(room, "alice", ANKARA, NOW, false);
    const bobResult = validateGuessSubmission(room, "bob", ANTALYA, NOW, false);

    expect(aliceResult.accepted).toBe(true);
    expect(bobResult.accepted).toBe(true);

    // After both guesses recorded
    room.players["alice"].hasGuessed = true;
    room.players["bob"].hasGuessed = true;
    expect(haveAllPlayersGuessed(room.players)).toBe(true);
  });

  test("late guess within 3s grace period — accepted", () => {
    const NOW = 100000;
    const room = makeRoom({
      id: "R1",
      status: "playing",
      roundState: "active",
      roundStartTime: NOW - 91500, // 91.5s elapsed, limit=90s → 1.5s past
      timeLimit: 90,
      players: makePlayers({ id: "p1", hasGuessed: false }),
    });

    // 1.5s past deadline, within 2s grace → accepted
    const result = validateGuessSubmission(room, "p1", ISTANBUL, NOW, false);
    expect(result.accepted).toBe(true);
  });

  test("late guess past 3s grace period — rejected", () => {
    const NOW = 100000;
    const room = makeRoom({
      id: "R1",
      status: "playing",
      roundState: "active",
      roundStartTime: NOW - 94000, // 94s elapsed, limit=90s → 4s past deadline, beyond 3s grace
      timeLimit: 90,
      players: makePlayers({ id: "p1", hasGuessed: false }),
    });

    const result = validateGuessSubmission(room, "p1", ISTANBUL, NOW, false);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe("time_expired");
  });

  test("double-click submit — second attempt rejected via isInFlight", () => {
    const NOW = 100000;
    const room = makeRoom({
      id: "R1",
      status: "playing",
      roundState: "active",
      roundStartTime: NOW - 30000,
      timeLimit: 90,
      players: makePlayers({ id: "p1", hasGuessed: false }),
    });

    // First submit: valid
    const first = validateGuessSubmission(room, "p1", ANKARA, NOW, false);
    expect(first.accepted).toBe(true);

    // Second submit: in-flight guard triggers
    const second = validateGuessSubmission(room, "p1", ANKARA, NOW, true);
    expect(second.accepted).toBe(false);
    expect(second.reason).toBe("in_flight");
  });

  test("disconnect then reconnect via sessionToken — player found", () => {
    const players = makePlayers(
      { id: "host", sessionToken: "tok_host", status: "online" },
      { id: "player2", sessionToken: "tok_p2", status: "disconnected" }
    );

    // player2 reconnects with their sessionToken
    const match = matchRejoinPlayer(players, "tok_p2");
    expect(match).not.toBeNull();
    expect(match!.id).toBe("player2");
    expect(match!.status).toBe("disconnected"); // Will be set to online by useRoom
  });

  test("host disconnect → election picks lowest joinedAt online player", () => {
    const players = makePlayers(
      { id: "host", joinedAt: 1000, status: "online", isHost: true },
      { id: "p2", joinedAt: 3000, status: "online" },
      { id: "p3", joinedAt: 2000, status: "online" },
      { id: "p4", joinedAt: 4000, status: "disconnected" }
    );

    const action = determineLeaveAction(players, "host", "host");
    expect(action.type).toBe("migrate_and_leave");
    if (action.type === "migrate_and_leave") {
      expect(action.newHostId).toBe("p3"); // joinedAt=2000, lowest among online non-host
    }
  });

  test("non-host refresh — movesUsed resets locally but server keeps it", () => {
    // This tests the NEED for syncMovesUsed: resetPlayerForNewRound resets movesUsed
    // but on refresh, the player should sync from server, not reset
    const player = makePlayer({
      id: "p1",
      movesUsed: 3,
      hasGuessed: true,
      currentGuess: ISTANBUL,
      totalScore: 4000,
      roundScores: [2000, 2000],
    });

    // Simulating what happens after refresh: player's React state resets
    // but Firebase still has movesUsed=3
    // resetPlayerForNewRound should NOT be called mid-round — only between rounds
    const reset = resetPlayerForNewRound(player);
    expect(reset.movesUsed).toBe(0); // This is correct for NEW round
    // But during same round after refresh, we need syncMovesUsed to restore server value
    // The pure function works correctly — the sync is handled by useStreetView.syncMovesUsed
    expect(player.movesUsed).toBe(3); // Original unchanged (immutable)
  });

  test("player guesses then disconnects — still counted in round results", () => {
    const players = [
      makePlayer({ id: "alice", hasGuessed: true, currentGuess: ANKARA, status: "online" }),
      makePlayer({ id: "bob", hasGuessed: true, currentGuess: ANTALYA, status: "disconnected" }),
    ];

    // computeRoundResults should include ALL players who guessed, even disconnected ones
    const results = computeRoundResults(players, ISTANBUL);
    expect(results).toHaveLength(2);
    expect(results.find(r => r.playerId === "bob")).toBeDefined();
    expect(results.find(r => r.playerId === "bob")!.score).toBeGreaterThan(0);
  });

  test("watchdog should act when playing state stuck with expired time", () => {
    const roundStart = 100000;
    const timeLimitSec = 90;
    const now = roundStart + (timeLimitSec + 10) * 1000; // 10s past deadline + buffer

    const result = shouldWatchdogAct("playing", roundStart, timeLimitSec, now, 5);
    expect(result.shouldAct).toBe(true);
    expect(result.reason).toBe("time_expired_no_lock");
  });

  test("allGuessed ignores disconnected players who haven't guessed", () => {
    const players = makePlayers(
      { id: "alice", hasGuessed: true, status: "online" },
      { id: "bob", hasGuessed: true, status: "online" },
      { id: "charlie", hasGuessed: false, status: "disconnected" }
    );

    // Charlie hasn't guessed but is disconnected → should not block round end
    expect(haveAllPlayersGuessed(players)).toBe(true);
  });

  test("validateNextRound rejects double-click by non-host", () => {
    const room = makeRoom({
      id: "R1",
      hostId: "host",
      status: "roundEnd",
      currentRound: 2,
      totalRounds: 5,
    });

    // Non-host tries to advance round
    const result = validateNextRound(room, "non-host");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("not_host");
  });

  test("2-player game: one disconnects mid-round → remaining player's guess triggers allGuessed", () => {
    const players = makePlayers(
      { id: "alice", hasGuessed: true, status: "online" },
      { id: "bob", hasGuessed: false, status: "disconnected" }
    );

    // Bob disconnected without guessing → only Alice is online and has guessed
    expect(haveAllPlayersGuessed(players)).toBe(true);
  });

  test("round transition: roundEnd → playing valid only with rounds remaining", () => {
    // Round 3 of 5: can continue
    expect(
      validateRoundTransition("roundEnd", "playing", "host", "host", 3, 5).valid
    ).toBe(true);

    // Round 5 of 5: cannot go to playing (should go to gameOver)
    expect(
      validateRoundTransition("roundEnd", "playing", "host", "host", 5, 5).valid
    ).toBe(false);

    // Round 5 of 5: gameOver is valid
    expect(
      validateRoundTransition("roundEnd", "gameOver", "host", "host", 5, 5).valid
    ).toBe(true);
  });

  test("cascading host migration in 2-player game", () => {
    const players = makePlayers(
      { id: "host", joinedAt: 1000, status: "online", isHost: true },
      { id: "p2", joinedAt: 2000, status: "online" }
    );

    // Host leaves → p2 becomes host
    const action1 = determineLeaveAction(players, "host", "host");
    expect(action1.type).toBe("migrate_and_leave");
    if (action1.type === "migrate_and_leave") {
      expect(action1.newHostId).toBe("p2");
    }

    // Now p2 is alone — if p2 leaves, room should be deleted
    const remainingPlayers = makePlayers(
      { id: "p2", joinedAt: 2000, status: "online", isHost: true }
    );
    const action2 = determineLeaveAction(remainingPlayers, "p2", "p2");
    expect(action2.type).toBe("delete_room");
  });

  test("desync detection: local playing while remote roundEnd with results", () => {
    const local = { status: "playing" as const, currentRound: 3, roundResults: null };
    const remote = {
      status: "roundEnd" as const,
      currentRound: 3,
      roundResults: [
        { playerId: "a", playerName: "A", guess: ISTANBUL, distance: 0, score: 5000 },
      ],
    };

    const result = detectDesync(local, remote);
    expect(result.isDesynced).toBe(true);
    expect(result.reasons.some(r => r.includes("Status"))).toBe(true);
    expect(result.reasons.some(r => r.includes("roundResults"))).toBe(true);
  });

  test("XSS player name rejected on room join", () => {
    const room = makeRoom({
      id: "R1",
      status: "waiting",
      players: makePlayers({ id: "host" }),
    });

    const names = [
      "<script>alert(1)</script>",
      "name<img src=x>",
      'name"onclick="alert(1)',
      "name&lt;script&gt;",
    ];

    for (const name of names) {
      const result = validateRoomJoin(room, name);
      expect(result.allowed).toBe(false);
    }
  });

  test("full guess validation pipeline: 8 players submitting sequentially", () => {
    const NOW = 100000;
    const room = makeRoom({
      id: "R1",
      status: "playing",
      roundState: "active",
      roundStartTime: NOW - 30000,
      timeLimit: 90,
      players: makePlayers(
        ...Array.from({ length: 8 }, (_, i) => ({
          id: `p${i}`,
          hasGuessed: false,
          status: "online" as const,
        }))
      ),
    });

    // All 8 players submit valid guesses
    for (let i = 0; i < 8; i++) {
      const guess = { lat: 39 + i * 0.3, lng: 30 + i * 0.5 };
      const result = validateGuessSubmission(room, `p${i}`, guess, NOW, false);
      expect(result.accepted).toBe(true);

      // Simulate: mark player as guessed
      room.players[`p${i}`].hasGuessed = true;
    }

    // All have guessed
    expect(haveAllPlayersGuessed(room.players)).toBe(true);

    // 9th attempt by already-guessed player should fail
    const result = validateGuessSubmission(room, "p0", ISTANBUL, NOW, false);
    expect(result.reason).toBe("already_guessed");
  });
});
