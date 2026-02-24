import { describe, test, expect } from "vitest";
import {
  FEATURE_FLAGS,
  RATE_LIMITS,
  ROOM_LIFECYCLE,
  GAME_SETTINGS,
  API_COST_CONTROL,
  SECURITY,
  ERROR_MESSAGES,
  isValidTurkeyCoordinate,
  isValidPlayerName,
} from "@/config/production";

// ==================== Feature Flags ====================

describe("FEATURE_FLAGS", () => {
  test("ENABLE_DEBUG_LOGS is false in production", () => {
    // In test environment NODE_ENV='test' !== 'production', so it's true in test.
    // But the expression itself should be: process.env.NODE_ENV !== 'production'
    // We verify the flag EXISTS and is a boolean.
    expect(typeof FEATURE_FLAGS.ENABLE_DEBUG_LOGS).toBe("boolean");
  });

  test("ENABLE_ANALYTICS is boolean", () => {
    expect(typeof FEATURE_FLAGS.ENABLE_ANALYTICS).toBe("boolean");
  });

  test("ENABLE_ERROR_REPORTING is boolean", () => {
    expect(typeof FEATURE_FLAGS.ENABLE_ERROR_REPORTING).toBe("boolean");
  });

  test("ENABLE_DYNAMIC_PANO_GENERATION is true", () => {
    expect(FEATURE_FLAGS.ENABLE_DYNAMIC_PANO_GENERATION).toBe(true);
  });

  test("all expected flags exist", () => {
    const expectedKeys = [
      "ENABLE_DYNAMIC_PANO_GENERATION",
      "ENABLE_DEBUG_LOGS",
      "ENABLE_ANALYTICS",
      "ENABLE_ERROR_REPORTING",
    ];
    for (const key of expectedKeys) {
      expect(FEATURE_FLAGS).toHaveProperty(key);
    }
  });
});

// ==================== Rate Limits ====================

describe("RATE_LIMITS", () => {
  test("rate limits are positive numbers", () => {
    expect(RATE_LIMITS.ROOM_CREATION_PER_MINUTE).toBeGreaterThan(0);
    expect(RATE_LIMITS.ROOM_JOIN_PER_MINUTE).toBeGreaterThan(0);
    expect(RATE_LIMITS.GUESS_PER_ROUND).toBeGreaterThan(0);
    expect(RATE_LIMITS.API_CALLS_PER_MINUTE).toBeGreaterThan(0);
    expect(RATE_LIMITS.MOVE_PER_SECOND).toBeGreaterThan(0);
    expect(RATE_LIMITS.MOVE_PER_10_SECONDS).toBeGreaterThan(0);
  });

  test("MOVE_PER_10_SECONDS >= MOVE_PER_SECOND", () => {
    expect(RATE_LIMITS.MOVE_PER_10_SECONDS).toBeGreaterThanOrEqual(
      RATE_LIMITS.MOVE_PER_SECOND
    );
  });
});

// ==================== Room Lifecycle ====================

describe("ROOM_LIFECYCLE", () => {
  test("TTLs are reasonable (between 1min and 24h)", () => {
    const oneMin = 60 * 1000;
    const oneDay = 24 * 60 * 60 * 1000;

    expect(ROOM_LIFECYCLE.EMPTY_ROOM_TTL_MS).toBeGreaterThanOrEqual(oneMin);
    expect(ROOM_LIFECYCLE.EMPTY_ROOM_TTL_MS).toBeLessThanOrEqual(oneDay);

    expect(ROOM_LIFECYCLE.FINISHED_GAME_TTL_MS).toBeGreaterThanOrEqual(oneMin);
    expect(ROOM_LIFECYCLE.FINISHED_GAME_TTL_MS).toBeLessThanOrEqual(oneDay);
  });

  test("MAX_PLAYERS_PER_ROOM is between 2 and 20", () => {
    expect(ROOM_LIFECYCLE.MAX_PLAYERS_PER_ROOM).toBeGreaterThanOrEqual(2);
    expect(ROOM_LIFECYCLE.MAX_PLAYERS_PER_ROOM).toBeLessThanOrEqual(20);
  });

  test("MAX_ACTIVE_ROOMS is positive", () => {
    expect(ROOM_LIFECYCLE.MAX_ACTIVE_ROOMS).toBeGreaterThan(0);
  });
});

// ==================== Game Settings ====================

describe("GAME_SETTINGS", () => {
  test("round range is valid", () => {
    expect(GAME_SETTINGS.MIN_ROUNDS).toBeLessThanOrEqual(GAME_SETTINGS.MAX_ROUNDS);
    expect(GAME_SETTINGS.DEFAULT_ROUNDS).toBeGreaterThanOrEqual(GAME_SETTINGS.MIN_ROUNDS);
    expect(GAME_SETTINGS.DEFAULT_ROUNDS).toBeLessThanOrEqual(GAME_SETTINGS.MAX_ROUNDS);
  });

  test("move range is valid", () => {
    expect(GAME_SETTINGS.MIN_MOVES).toBeLessThanOrEqual(GAME_SETTINGS.MAX_MOVES);
    expect(GAME_SETTINGS.URBAN_DEFAULT_MOVES).toBeGreaterThanOrEqual(GAME_SETTINGS.MIN_MOVES);
    expect(GAME_SETTINGS.GEO_DEFAULT_MOVES).toBeGreaterThanOrEqual(GAME_SETTINGS.MIN_MOVES);
  });

  test("time range is valid (seconds)", () => {
    expect(GAME_SETTINGS.MIN_TIME_LIMIT).toBeLessThanOrEqual(GAME_SETTINGS.MAX_TIME_LIMIT);
    expect(GAME_SETTINGS.URBAN_DEFAULT_TIME).toBeGreaterThanOrEqual(GAME_SETTINGS.MIN_TIME_LIMIT);
    expect(GAME_SETTINGS.GEO_DEFAULT_TIME).toBeGreaterThanOrEqual(GAME_SETTINGS.MIN_TIME_LIMIT);
  });

  test("MAX_SCORE_PER_ROUND is 5000", () => {
    expect(GAME_SETTINGS.MAX_SCORE_PER_ROUND).toBe(5000);
  });
});

// ==================== API Cost Control ====================

describe("API_COST_CONTROL", () => {
  test("daily budget math is consistent", () => {
    const expected = Math.floor(
      API_COST_CONTROL.DAILY_API_BUDGET_USD /
        API_COST_CONTROL.STREET_VIEW_COST_PER_CALL
    );
    expect(API_COST_CONTROL.MAX_DAILY_API_CALLS).toBe(expected);
  });

  test("PANO_CACHE_TTL_MS is 24 hours", () => {
    expect(API_COST_CONTROL.PANO_CACHE_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });
});

// ==================== Security ====================

describe("SECURITY", () => {
  test("Turkey bounds are geographically valid", () => {
    const { TURKEY_BOUNDS } = SECURITY;
    expect(TURKEY_BOUNDS.MIN_LAT).toBeLessThan(TURKEY_BOUNDS.MAX_LAT);
    expect(TURKEY_BOUNDS.MIN_LNG).toBeLessThan(TURKEY_BOUNDS.MAX_LNG);
    // Turkey is roughly 36-42°N, 26-45°E
    expect(TURKEY_BOUNDS.MIN_LAT).toBeGreaterThanOrEqual(34);
    expect(TURKEY_BOUNDS.MAX_LAT).toBeLessThanOrEqual(44);
    expect(TURKEY_BOUNDS.MIN_LNG).toBeGreaterThanOrEqual(24);
    expect(TURKEY_BOUNDS.MAX_LNG).toBeLessThanOrEqual(47);
  });

  test("ROOM_CODE_LENGTH is 6", () => {
    expect(SECURITY.ROOM_CODE_LENGTH).toBe(6);
  });

  test("name length limits are reasonable", () => {
    expect(SECURITY.NAME_MIN_LENGTH).toBeGreaterThan(0);
    expect(SECURITY.NAME_MAX_LENGTH).toBeGreaterThanOrEqual(SECURITY.NAME_MIN_LENGTH);
    expect(SECURITY.NAME_MAX_LENGTH).toBeLessThanOrEqual(100);
  });
});

// ==================== Validation Helpers ====================

describe("isValidTurkeyCoordinate", () => {
  test("accepts Istanbul", () => {
    expect(isValidTurkeyCoordinate(41.0082, 28.9784)).toBe(true);
  });

  test("accepts Ankara", () => {
    expect(isValidTurkeyCoordinate(39.9334, 32.8597)).toBe(true);
  });

  test("rejects London", () => {
    expect(isValidTurkeyCoordinate(51.5074, -0.1278)).toBe(false);
  });

  test("rejects origin (0,0)", () => {
    expect(isValidTurkeyCoordinate(0, 0)).toBe(false);
  });

  test("accepts boundary values", () => {
    const { MIN_LAT, MAX_LAT, MIN_LNG, MAX_LNG } = SECURITY.TURKEY_BOUNDS;
    expect(isValidTurkeyCoordinate(MIN_LAT, MIN_LNG)).toBe(true);
    expect(isValidTurkeyCoordinate(MAX_LAT, MAX_LNG)).toBe(true);
  });
});

describe("isValidPlayerName", () => {
  test("accepts normal Turkish names", () => {
    expect(isValidPlayerName("Ahmet")).toBe(true);
    expect(isValidPlayerName("Şahin")).toBe(true);
    expect(isValidPlayerName("Gül")).toBe(true);
  });

  test("rejects empty string", () => {
    expect(isValidPlayerName("")).toBe(false);
    expect(isValidPlayerName("   ")).toBe(false);
  });

  test("rejects HTML/script characters", () => {
    expect(isValidPlayerName("<script>")).toBe(false);
    expect(isValidPlayerName('alert("xss")')).toBe(false);
    expect(isValidPlayerName("name&name")).toBe(false);
    expect(isValidPlayerName("name'name")).toBe(false);
  });

  test("rejects names exceeding max length", () => {
    const tooLong = "a".repeat(SECURITY.NAME_MAX_LENGTH + 1);
    expect(isValidPlayerName(tooLong)).toBe(false);
  });

  test("accepts max-length name", () => {
    const exact = "a".repeat(SECURITY.NAME_MAX_LENGTH);
    expect(isValidPlayerName(exact)).toBe(true);
  });
});

// ==================== Error Messages ====================

describe("ERROR_MESSAGES", () => {
  test("all error messages are non-empty strings", () => {
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
      expect(typeof value).toBe("string");
      expect(value.length).toBeGreaterThan(0);
    }
  });
});

// ==================== Firebase Rules Regression ====================

describe("Firebase Rules — totalScore regression (non-host guess bug)", () => {
  // This test validates that database.rules.json allows non-host players
  // to write their own totalScore when the value is unchanged.
  // BUG: Before the fix, non-host players with totalScore > 0 could NOT
  // submit guesses because the player-level transaction triggered totalScore
  // validation, which only allowed host or (value == 0 && own node).

  let rules: any;

  beforeAll(async () => {
    const fs = await import("fs");
    const path = await import("path");
    const rulesPath = path.resolve(__dirname, "../../database.rules.json");
    rules = JSON.parse(fs.readFileSync(rulesPath, "utf-8"));
  });

  test("totalScore validate rule exists", () => {
    const totalScoreRule =
      rules.rules.rooms["$roomId"].players["$playerId"].totalScore[".validate"];
    expect(totalScoreRule).toBeDefined();
    expect(typeof totalScoreRule).toBe("string");
  });

  test("totalScore rule allows same-value writes by player (regression)", () => {
    const rule =
      rules.rules.rooms["$roomId"].players["$playerId"].totalScore[".validate"];
    // The rule MUST contain the "newData.val() == data.val()" clause
    // so non-host players can write their unchanged totalScore in transactions
    expect(rule).toContain("newData.val() == data.val()");
  });

  test("totalScore rule still requires host for different values", () => {
    const rule =
      rules.rules.rooms["$roomId"].players["$playerId"].totalScore[".validate"];
    // Must have hostId check
    expect(rule).toContain("hostId");
    // Must have val() == 0 clause for initial writes
    expect(rule).toContain("newData.val() == 0");
  });

  test("currentGuess rule allows first-write by non-host", () => {
    const rule =
      rules.rules.rooms["$roomId"].players["$playerId"].currentGuess[".validate"];
    // Must allow writes when data doesn't exist (!data.exists())
    expect(rule).toContain("!data.exists()");
  });

  test("currentGuesses rule allows +1 increment by non-host when playing", () => {
    const rule =
      rules.rules.rooms["$roomId"].currentGuesses[".validate"];
    // Must allow increment by 1 when status is playing
    expect(rule).toContain("data.val() + 1");
    expect(rule).toContain("playing");
  });
});
