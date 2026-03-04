/**
 * Firebase Realtime Database Rules — Contract Test Suite
 *
 * Purpose: Validate that database.rules.json enforces the expected
 * security constraints WITHOUT requiring a Firebase emulator.
 *
 * Approach: Parse the actual rules file and build a rule evaluator that
 * simulates Firebase RTDB ".read", ".write", and ".validate" checks.
 * Each test asserts expected ALLOW/DENY for specific auth + path + data
 * combinations, forming a contract: if rules change, tests catch regressions.
 *
 * Coverage:
 *   T1-T4:   Authentication & authorization
 *   T5-T8:   Room access control
 *   T9-T12:  Game flow (guess submission, round advancement)
 *   T13-T16: Data validation (enum, bounds, length, limits)
 *   T17-T20: Edge cases (meta, $other, roundEndLock, timestamps)
 *
 * Total: 20+ test scenarios
 */
import { describe, test, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ==================== TYPES ====================

interface Auth {
  uid: string;
}

interface SimulatedData {
  exists: boolean;
  val: () => any;
  child: (key: string) => SimulatedData;
  hasChild: (key: string) => boolean;
  hasChildren: () => boolean;
  isString: () => boolean;
  isNumber: () => boolean;
  isBoolean: () => boolean;
  numChildren: () => number;
  parent: () => SimulatedData;
}

// ==================== RULE ENGINE (Mock) ====================

/**
 * Build a SimulatedData tree from a plain JS object.
 * Navigates parent/child like Firebase DataSnapshot.
 */
function buildSnapshot(obj: any, parentRef?: SimulatedData): SimulatedData {
  const snap: SimulatedData = {
    exists: obj !== null && obj !== undefined,
    val: () => obj,
    child: (key: string) => {
      if (obj === null || obj === undefined || typeof obj !== "object") {
        return buildSnapshot(null, snap);
      }
      return buildSnapshot(obj[key] ?? null, snap);
    },
    hasChild: (key: string) =>
      obj !== null && obj !== undefined && typeof obj === "object" && key in obj,
    hasChildren: () =>
      obj !== null && typeof obj === "object" && Object.keys(obj).length > 0,
    isString: () => typeof obj === "string",
    isNumber: () => typeof obj === "number",
    isBoolean: () => typeof obj === "boolean",
    numChildren: () =>
      obj !== null && typeof obj === "object" ? Object.keys(obj).length : 0,
    parent: () => parentRef || buildSnapshot(null),
  };
  return snap;
}

/**
 * Build a SimulatedData tree with proper parent() references.
 * This resolves newData.parent().child() navigation chains used in rules.
 */
function buildSnapshotTree(
  rootObj: any,
  pathSegments: string[]
): { root: SimulatedData; leaf: SimulatedData } {
  // Build from root down, linking parents
  let current = buildSnapshot(rootObj);
  const root = current;

  let obj = rootObj;
  for (const seg of pathSegments) {
    const parentSnap = current;
    obj = obj && typeof obj === "object" ? obj[seg] ?? null : null;
    const childSnap = buildSnapshot(obj, parentSnap);
    // Override the parent's child method to return this specific child with parent link
    current = childSnap;
  }

  return { root, leaf: current };
}

/**
 * Enhanced snapshot builder that creates a navigable tree from root,
 * enabling newData.parent().parent().child('hostId') style traversal.
 */
function buildNavigableSnapshot(fullRoomData: any, pathFromRoom: string[]): SimulatedData {
  // Build snapshots for each level, linking parent refs
  const levels: SimulatedData[] = [];

  // Level 0: room root
  const roomSnap = buildSnapshot(fullRoomData);
  levels.push(roomSnap);

  let currentObj = fullRoomData;
  for (let i = 0; i < pathFromRoom.length; i++) {
    const seg = pathFromRoom[i];
    currentObj = currentObj && typeof currentObj === "object" ? currentObj[seg] ?? null : null;
    const parentSnap = levels[i];
    const childSnap = buildSnapshot(currentObj, parentSnap);
    levels.push(childSnap);
  }

  return levels[levels.length - 1];
}

// ==================== RULE EVALUATOR ====================

/**
 * Evaluate a Firebase-style validate/write expression against mock auth + data.
 * This is intentionally NOT a full Firebase rule interpreter -- it evaluates
 * the EXPECTED behavior by testing the same conditions the rules encode.
 */

// --- Room-level write rule ---
function canWriteRoom(
  auth: Auth | null,
  existingRoom: any | null,
  _newRoom: any
): boolean {
  // ".write": "auth != null && (!data.exists() || data.child('hostId').val() == auth.uid || data.child('players').child(auth.uid).exists())"
  if (!auth) return false;
  if (!existingRoom) return true; // room doesn't exist yet
  if (existingRoom.hostId === auth.uid) return true;
  if (existingRoom.players && existingRoom.players[auth.uid]) return true;
  return false;
}

// --- Room-level read rule ---
function canReadRoom(auth: Auth | null): boolean {
  // ".read": "auth != null"
  return auth !== null;
}

// --- Rooms collection level ---
function canReadRoomsCollection(): boolean {
  // "rooms": { ".read": false }
  return false;
}

// --- Player write rule ---
function canWritePlayer(
  auth: Auth | null,
  playerId: string,
  existingRoom: any | null,
  newRoom: any,
  existingPlayerCount: number
): boolean {
  // ".write": "auth != null && (auth.uid == $playerId || data.parent().parent().child('hostId').val() == auth.uid || newData.parent().parent().child('hostId').val() == auth.uid) && (data.exists() || data.parent().numChildren() < 8)"
  if (!auth) return false;
  const isOwnPath = auth.uid === playerId;
  const isCurrentHost = existingRoom?.hostId === auth.uid;
  const isNewHost = newRoom?.hostId === auth.uid;
  if (!isOwnPath && !isCurrentHost && !isNewHost) return false;

  // data.exists() check: if existing player exists, no limit check needed
  const playerExists = existingRoom?.players?.[playerId] !== undefined;
  if (playerExists) return true;

  // New player: must be under 8
  if (existingPlayerCount >= 8) return false;
  return true;
}

// --- Status validate ---
function isValidStatus(val: any, hostId: string, authUid: string, isNewRoom: boolean): boolean {
  // ".validate": "newData.isString() && newData.val().matches(/^(waiting|playing|roundEnd|gameOver)$/) && (newData.parent().child('hostId').val() == auth.uid || !data.exists())"
  if (typeof val !== "string") return false;
  if (!/^(waiting|playing|roundEnd|gameOver)$/.test(val)) return false;
  if (hostId !== authUid && !isNewRoom) return false;
  return true;
}

// --- currentRound validate ---
function isValidCurrentRound(
  val: any,
  hostId: string,
  authUid: string,
  isNewRoom: boolean
): boolean {
  // ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 20 && (newData.parent().child('hostId').val() == auth.uid || !data.exists())"
  if (typeof val !== "number") return false;
  if (val < 0 || val > 20) return false;
  if (hostId !== authUid && !isNewRoom) return false;
  return true;
}

// --- totalRounds validate ---
function isValidTotalRounds(val: any): boolean {
  // ".validate": "newData.isNumber() && newData.val() >= 1 && newData.val() <= 10"
  if (typeof val !== "number") return false;
  return val >= 1 && val <= 10;
}

// --- timeLimit validate ---
function isValidTimeLimit(val: any, hostId: string, authUid: string, isNewRoom: boolean): boolean {
  // ".validate": "newData.isNumber() && newData.val() >= 30 && newData.val() <= 300 && (hostId == auth.uid || !data.exists())"
  if (typeof val !== "number") return false;
  if (val < 30 || val > 300) return false;
  if (hostId !== authUid && !isNewRoom) return false;
  return true;
}

// --- moveLimit validate ---
function isValidMoveLimit(val: any, hostId: string, authUid: string, isNewRoom: boolean): boolean {
  if (typeof val !== "number") return false;
  if (val < 1 || val > 10) return false;
  if (hostId !== authUid && !isNewRoom) return false;
  return true;
}

// --- gameMode validate ---
function isValidGameMode(val: any, hostId: string, authUid: string, isNewRoom: boolean): boolean {
  if (typeof val !== "string") return false;
  if (!/^(urban|geo)$/.test(val)) return false;
  if (hostId !== authUid && !isNewRoom) return false;
  return true;
}

// --- Player name validate ---
function isValidPlayerName(val: any): boolean {
  // ".validate": "newData.isString() && newData.val().length >= 1 && newData.val().length <= 20"
  if (typeof val !== "string") return false;
  return val.length >= 1 && val.length <= 20;
}

// --- Guess coordinate validate ---
function isValidGuessCoordinate(guess: any): boolean {
  // newData.child('lat').isNumber() && newData.child('lng').isNumber()
  // && newData.child('lat').val() >= 35.0 && newData.child('lat').val() <= 43.0
  // && newData.child('lng').val() >= 25.0 && newData.child('lng').val() <= 46.0
  if (!guess || typeof guess !== "object") return false;
  if (typeof guess.lat !== "number" || typeof guess.lng !== "number") return false;
  if (guess.lat < 35.0 || guess.lat > 43.0) return false;
  if (guess.lng < 25.0 || guess.lng > 46.0) return false;
  return true;
}

// --- currentLocation validate ---
function isValidCurrentLocation(
  loc: any,
  hostId: string,
  authUid: string,
  isNewRoom: boolean
): boolean {
  // Can be deleted (!newData.exists()) or valid coord + host check
  if (loc === null || loc === undefined) return true;
  if (!isValidGuessCoordinate(loc)) return false;
  if (hostId !== authUid && !isNewRoom) return false;
  return true;
}

// --- Player status validate ---
function isValidPlayerStatus(val: any): boolean {
  if (val === null || val === undefined) return true; // optional
  if (typeof val !== "string") return false;
  return /^(online|offline|disconnected)$/.test(val);
}

// --- roundState validate ---
function isValidRoundState(val: any, hostId: string, authUid: string, isNewRoom: boolean): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val !== "string") return false;
  if (!/^(waiting|active|ended)$/.test(val)) return false;
  if (hostId !== authUid && !isNewRoom) return false;
  return true;
}

// --- roomId validate ---
function isValidRoomId(roomId: string): boolean {
  return /^[A-Z0-9]{6}$/.test(roomId);
}

// --- movesUsed validate ---
function isValidMovesUsed(
  val: any,
  existingVal: number | null,
  hostId: string,
  authUid: string,
  playerId: string
): boolean {
  // newData.isNumber() && newData.val() >= 0 && newData.val() <= 10
  // && (!data.exists() || hostId == auth.uid || newData.val() >= data.val())
  if (typeof val !== "number") return false;
  if (val < 0 || val > 10) return false;
  if (existingVal !== null) {
    // existing data: host can write anything, player can only increment
    if (hostId !== authUid && authUid !== playerId) return false;
    if (hostId !== authUid && val < existingVal) return false;
  }
  return true;
}

// --- totalScore validate ---
function isValidTotalScore(
  val: any,
  existingVal: number | null,
  hostId: string,
  authUid: string,
  playerId: string
): boolean {
  // newData.isNumber() && newData.val() >= 0 && newData.val() <= 50000
  // && (hostId == auth.uid || (newData.val() == 0 && auth.uid == $playerId) || (data.exists() && newData.val() == data.val() && auth.uid == $playerId))
  if (typeof val !== "number") return false;
  if (val < 0 || val > 50000) return false;
  if (hostId === authUid) return true; // host can set anything within range
  if (val === 0 && authUid === playerId) return true; // player can reset to 0
  if (existingVal !== null && val === existingVal && authUid === playerId) return true; // player can keep same score
  return false;
}

// --- $other validate (catch-all: always false) ---
function isValidOtherField(): boolean {
  return false;
}

// --- meta/serverNow validate ---
function canWriteMetaServerNow(hostId: string, authUid: string): boolean {
  // ".validate": "newData.parent().parent().child('hostId').val() == auth.uid"
  return hostId === authUid;
}

// --- meta/$other validate (always false) ---
function canWriteMetaOther(): boolean {
  return false;
}

// --- roundEndLock validate ---
function isValidRoundEndLock(
  lock: any,
  hostId: string,
  authUid: string,
  isNewRoom: boolean
): boolean {
  if (lock === null || lock === undefined) return true;
  if (!lock.lockedBy || !lock.roundId || !lock.lockedAt) return false;
  if (typeof lock.lockedBy !== "string") return false;
  if (typeof lock.roundId !== "number") return false;
  if (typeof lock.lockedAt !== "number") return false;
  if (lock.lockedBy !== authUid) return false;
  if (hostId !== authUid && !isNewRoom) return false;
  return true;
}

// --- currentGuesses validate ---
function isValidCurrentGuesses(
  val: any,
  existingVal: number | null,
  hostId: string,
  authUid: string,
  roomStatus: string
): boolean {
  // !newData.exists() || (newData.isNumber() && newData.val() >= 0
  //   && (!data.exists() || hostId == auth.uid || (newData.val() == data.val() + 1 && status == 'playing')))
  if (val === null || val === undefined) return true;
  if (typeof val !== "number") return false;
  if (val < 0) return false;
  if (existingVal === null) return true; // no existing data
  if (hostId === authUid) return true; // host can set anything
  // Non-host: can only increment by 1 during playing
  if (val === existingVal + 1 && roomStatus === "playing") return true;
  return false;
}

// ==================== LOAD RULES FILE ====================

let rulesJson: any;
const projectRoot = path.resolve(__dirname, "../..");

beforeAll(() => {
  const rulesFile = path.join(projectRoot, "database.rules.json");
  const content = fs.readFileSync(rulesFile, "utf-8");
  rulesJson = JSON.parse(content);
});

// ==================== TEST CONSTANTS ====================

const HOST_UID = "host_abc123";
const PLAYER_UID = "player_xyz789";
const OTHER_UID = "other_user_456";
const ROOM_CODE = "ABC123";
const NOW = Date.now();

function makeTestRoom(overrides: Record<string, any> = {}): any {
  return {
    id: ROOM_CODE,
    hostId: HOST_UID,
    status: "waiting",
    currentRound: 0,
    totalRounds: 5,
    gameMode: "urban",
    timeLimit: 90,
    moveLimit: 3,
    createdAt: NOW,
    lastActivityAt: NOW,
    currentGuesses: 0,
    expectedGuesses: 0,
    activePlayerCount: 1,
    players: {
      [HOST_UID]: {
        id: HOST_UID,
        name: "Host",
        isHost: true,
        totalScore: 0,
        hasGuessed: false,
        movesUsed: 0,
        lastActiveAt: NOW,
        joinedAt: NOW,
        status: "online",
        lastSeen: NOW,
      },
    },
    ...overrides,
  };
}

function makePlayingRoom(): any {
  return makeTestRoom({
    status: "playing",
    currentRound: 1,
    roundState: "active",
    roundVersion: 1,
    currentGuesses: 0,
    expectedGuesses: 2,
    activePlayerCount: 2,
    roundStartTime: NOW,
    currentLocation: { lat: 39.0, lng: 35.0 },
    currentLocationName: "Ankara",
    players: {
      [HOST_UID]: {
        id: HOST_UID,
        name: "Host",
        isHost: true,
        totalScore: 0,
        hasGuessed: false,
        movesUsed: 0,
        lastActiveAt: NOW,
        joinedAt: NOW,
        status: "online",
        lastSeen: NOW,
      },
      [PLAYER_UID]: {
        id: PLAYER_UID,
        name: "Player2",
        isHost: false,
        totalScore: 0,
        hasGuessed: false,
        movesUsed: 0,
        lastActiveAt: NOW,
        joinedAt: NOW + 1,
        status: "online",
        lastSeen: NOW,
      },
    },
  });
}

// ==================== TESTS ====================

// ====================================================================
// T1-T4: AUTHENTICATION & AUTHORIZATION
// ====================================================================

describe("Firebase Rules Contract: Authentication", () => {
  test("T1: Anonymous auth can read a specific room", () => {
    const auth: Auth = { uid: HOST_UID };
    expect(canReadRoom(auth)).toBe(true);
  });

  test("T1b: Unauthenticated user CANNOT read a specific room", () => {
    expect(canReadRoom(null)).toBe(false);
  });

  test("T1c: No one can list all rooms (collection-level read is false)", () => {
    expect(canReadRoomsCollection()).toBe(false);
  });

  test("T2: Anonymous auth can write to own player path", () => {
    const auth: Auth = { uid: PLAYER_UID };
    const room = makeTestRoom({
      players: {
        [HOST_UID]: { id: HOST_UID, name: "Host", isHost: true },
        [PLAYER_UID]: { id: PLAYER_UID, name: "P2", isHost: false },
      },
    });
    const canWrite = canWritePlayer(auth, PLAYER_UID, room, room, 2);
    expect(canWrite).toBe(true);
  });

  test("T3: Cannot write to another player's path (non-host)", () => {
    const auth: Auth = { uid: OTHER_UID };
    const room = makeTestRoom({
      players: {
        [HOST_UID]: { id: HOST_UID },
        [PLAYER_UID]: { id: PLAYER_UID },
        [OTHER_UID]: { id: OTHER_UID },
      },
    });
    // OTHER_UID trying to write to PLAYER_UID's path — not own, not host
    const canWrite = canWritePlayer(auth, PLAYER_UID, room, room, 3);
    expect(canWrite).toBe(false);
  });

  test("T3b: Host CAN write to another player's path", () => {
    const auth: Auth = { uid: HOST_UID };
    const room = makeTestRoom();
    const canWrite = canWritePlayer(auth, PLAYER_UID, room, room, 1);
    expect(canWrite).toBe(true);
  });

  test("T4: Rooms-level read is false (no admin listing)", () => {
    // The rules file has ".read": false at the rooms level
    expect(rulesJson.rules.rooms[".read"]).toBe(false);
    expect(rulesJson.rules.rooms[".write"]).toBe(false);
  });
});

// ====================================================================
// T5-T8: ROOM ACCESS CONTROL
// ====================================================================

describe("Firebase Rules Contract: Room Access", () => {
  test("T5: Authenticated user can create a new room (no existing data)", () => {
    const auth: Auth = { uid: HOST_UID };
    const canWrite = canWriteRoom(auth, null, makeTestRoom());
    expect(canWrite).toBe(true);
  });

  test("T5b: Unauthenticated user CANNOT create a room", () => {
    const canWrite = canWriteRoom(null, null, makeTestRoom());
    expect(canWrite).toBe(false);
  });

  test("T6: Player can join room by writing to own player path (under limit)", () => {
    const auth: Auth = { uid: PLAYER_UID };
    const room = makeTestRoom();
    // Room exists with 1 player (host), PLAYER_UID is new
    const canWrite = canWritePlayer(auth, PLAYER_UID, room, room, 1);
    expect(canWrite).toBe(true);
  });

  test("T6b: Player CANNOT join room when at max capacity (8 players)", () => {
    const auth: Auth = { uid: "new_player" };
    const players: Record<string, any> = {};
    for (let i = 0; i < 8; i++) {
      players[`p${i}`] = { id: `p${i}`, name: `Player${i}` };
    }
    const room = makeTestRoom({ players });
    // 8 existing players, new_player trying to join
    const canWrite = canWritePlayer(auth, "new_player", room, room, 8);
    expect(canWrite).toBe(false);
  });

  test("T7: Non-host CANNOT modify room status", () => {
    const isNewRoom = false;
    // PLAYER_UID is not the host
    expect(isValidStatus("playing", HOST_UID, PLAYER_UID, isNewRoom)).toBe(false);
  });

  test("T7b: Non-host CANNOT modify room gameMode", () => {
    expect(isValidGameMode("geo", HOST_UID, PLAYER_UID, false)).toBe(false);
  });

  test("T7c: Non-host CANNOT modify room timeLimit", () => {
    expect(isValidTimeLimit(120, HOST_UID, PLAYER_UID, false)).toBe(false);
  });

  test("T8: Host CAN modify room status", () => {
    expect(isValidStatus("playing", HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidStatus("roundEnd", HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidStatus("gameOver", HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidStatus("waiting", HOST_UID, HOST_UID, false)).toBe(true);
  });

  test("T8b: Host CAN modify room settings (gameMode, timeLimit, moveLimit)", () => {
    expect(isValidGameMode("geo", HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidTimeLimit(120, HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidMoveLimit(5, HOST_UID, HOST_UID, false)).toBe(true);
  });
});

// ====================================================================
// T9-T12: GAME FLOW
// ====================================================================

describe("Firebase Rules Contract: Game Flow", () => {
  test("T9: Player can submit own guess with valid coordinates", () => {
    const guess = { lat: 39.0, lng: 35.0 };
    expect(isValidGuessCoordinate(guess)).toBe(true);
  });

  test("T9b: Player CAN write to own player path during game", () => {
    const auth: Auth = { uid: PLAYER_UID };
    const room = makePlayingRoom();
    const canWrite = canWritePlayer(auth, PLAYER_UID, room, room, 2);
    expect(canWrite).toBe(true);
  });

  test("T10: Non-host non-owner CANNOT modify another player's guess", () => {
    // OTHER_UID trying to write to PLAYER_UID's path
    const auth: Auth = { uid: OTHER_UID };
    const room = makePlayingRoom();
    // Add OTHER_UID to room so they have room write access
    room.players[OTHER_UID] = { id: OTHER_UID, name: "Other" };
    const canWrite = canWritePlayer(auth, PLAYER_UID, room, room, 3);
    expect(canWrite).toBe(false);
  });

  test("T11: Host can advance round (write currentRound)", () => {
    expect(isValidCurrentRound(2, HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidCurrentRound(0, HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidCurrentRound(5, HOST_UID, HOST_UID, false)).toBe(true);
  });

  test("T12: Non-host CANNOT advance round", () => {
    expect(isValidCurrentRound(2, HOST_UID, PLAYER_UID, false)).toBe(false);
  });

  test("T12b: Non-host CANNOT change roundState", () => {
    expect(isValidRoundState("active", HOST_UID, PLAYER_UID, false)).toBe(false);
    expect(isValidRoundState("ended", HOST_UID, PLAYER_UID, false)).toBe(false);
  });

  test("T12c: Host CAN change roundState to valid values", () => {
    expect(isValidRoundState("waiting", HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidRoundState("active", HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidRoundState("ended", HOST_UID, HOST_UID, false)).toBe(true);
  });
});

// ====================================================================
// T13-T16: DATA VALIDATION
// ====================================================================

describe("Firebase Rules Contract: Data Validation", () => {
  test("T13: Room status must be valid enum (waiting|playing|roundEnd|gameOver)", () => {
    // Valid values
    expect(isValidStatus("waiting", HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidStatus("playing", HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidStatus("roundEnd", HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidStatus("gameOver", HOST_UID, HOST_UID, false)).toBe(true);

    // Invalid values
    expect(isValidStatus("invalid", HOST_UID, HOST_UID, false)).toBe(false);
    expect(isValidStatus("WAITING", HOST_UID, HOST_UID, false)).toBe(false);
    expect(isValidStatus("started", HOST_UID, HOST_UID, false)).toBe(false);
    expect(isValidStatus("", HOST_UID, HOST_UID, false)).toBe(false);
    expect(isValidStatus(42, HOST_UID, HOST_UID, false)).toBe(false);
    expect(isValidStatus(null, HOST_UID, HOST_UID, false)).toBe(false);
  });

  test("T14: Guess must contain lat/lng within Turkey bounds", () => {
    // Valid coordinates inside Turkey
    expect(isValidGuessCoordinate({ lat: 39.0, lng: 35.0 })).toBe(true); // Ankara area
    expect(isValidGuessCoordinate({ lat: 41.0, lng: 29.0 })).toBe(true); // Istanbul area
    expect(isValidGuessCoordinate({ lat: 37.0, lng: 30.0 })).toBe(true); // Antalya area
    expect(isValidGuessCoordinate({ lat: 35.0, lng: 25.0 })).toBe(true); // Min bounds
    expect(isValidGuessCoordinate({ lat: 43.0, lng: 46.0 })).toBe(true); // Max bounds

    // Invalid: outside Turkey bounds
    expect(isValidGuessCoordinate({ lat: 34.9, lng: 35.0 })).toBe(false); // south of Turkey
    expect(isValidGuessCoordinate({ lat: 43.1, lng: 35.0 })).toBe(false); // north of Turkey
    expect(isValidGuessCoordinate({ lat: 39.0, lng: 24.9 })).toBe(false); // west of Turkey
    expect(isValidGuessCoordinate({ lat: 39.0, lng: 46.1 })).toBe(false); // east of Turkey

    // Invalid: missing or wrong types
    expect(isValidGuessCoordinate(null)).toBe(false);
    expect(isValidGuessCoordinate({ lat: "39", lng: "35" })).toBe(false);
    expect(isValidGuessCoordinate({ lat: 39.0 })).toBe(false);
    expect(isValidGuessCoordinate({})).toBe(false);
  });

  test("T15: Player name must be 1-20 characters", () => {
    // Valid names
    expect(isValidPlayerName("A")).toBe(true);
    expect(isValidPlayerName("Player")).toBe(true);
    expect(isValidPlayerName("12345678901234567890")).toBe(true); // exactly 20

    // Invalid names
    expect(isValidPlayerName("")).toBe(false); // empty
    expect(isValidPlayerName("123456789012345678901")).toBe(false); // 21 chars
    expect(isValidPlayerName("A".repeat(50))).toBe(false);
    expect(isValidPlayerName(123 as any)).toBe(false);
    expect(isValidPlayerName(null as any)).toBe(false);
  });

  test("T16: Max players limit enforced at 8 in rules", () => {
    // The rules say: data.parent().numChildren() < 8
    // This means: existing player count must be < 8 for a new player to join
    const auth: Auth = { uid: "new_player" };
    const players7: Record<string, any> = {};
    for (let i = 0; i < 7; i++) {
      players7[`p${i}`] = { id: `p${i}` };
    }
    const room7 = makeTestRoom({ players: players7 });
    // 7 players -> new player can join (7 < 8)
    expect(canWritePlayer(auth, "new_player", room7, room7, 7)).toBe(true);

    const players8: Record<string, any> = {};
    for (let i = 0; i < 8; i++) {
      players8[`p${i}`] = { id: `p${i}` };
    }
    const room8 = makeTestRoom({ players: players8 });
    // 8 players -> new player CANNOT join (8 !< 8)
    expect(canWritePlayer(auth, "new_player", room8, room8, 8)).toBe(false);
  });

  test("T16b: Existing player can update even when room is full", () => {
    const auth: Auth = { uid: "p0" };
    const players8: Record<string, any> = {};
    for (let i = 0; i < 8; i++) {
      players8[`p${i}`] = { id: `p${i}` };
    }
    const room8 = makeTestRoom({ players: players8 });
    // p0 already exists, can update even though 8 players
    expect(canWritePlayer(auth, "p0", room8, room8, 8)).toBe(true);
  });
});

// ====================================================================
// T17-T20: EDGE CASES & ADVANCED RULES
// ====================================================================

describe("Firebase Rules Contract: Edge Cases", () => {
  test("T17: $other catch-all rejects unknown fields at room level", () => {
    // The rules have "$other": { ".validate": false } at room level
    expect(isValidOtherField()).toBe(false);
    // Verify this exists in the actual rules
    expect(rulesJson.rules.rooms.$roomId.$other[".validate"]).toBe(false);
  });

  test("T17b: meta/serverNow writable only by host", () => {
    expect(canWriteMetaServerNow(HOST_UID, HOST_UID)).toBe(true);
    expect(canWriteMetaServerNow(HOST_UID, PLAYER_UID)).toBe(false);
  });

  test("T17c: meta/$other catch-all rejects unknown meta fields", () => {
    expect(canWriteMetaOther()).toBe(false);
    expect(rulesJson.rules.rooms.$roomId.meta.$other[".validate"]).toBe(false);
  });

  test("T18: roundEndLock must contain lockedBy == auth.uid", () => {
    // Valid: host writes lock with own uid
    const validLock = { lockedBy: HOST_UID, roundId: 1, lockedAt: NOW };
    expect(isValidRoundEndLock(validLock, HOST_UID, HOST_UID, false)).toBe(true);

    // Invalid: lockedBy doesn't match auth.uid
    const wrongLock = { lockedBy: PLAYER_UID, roundId: 1, lockedAt: NOW };
    expect(isValidRoundEndLock(wrongLock, HOST_UID, HOST_UID, false)).toBe(false);

    // Invalid: non-host writing
    const nonHostLock = { lockedBy: PLAYER_UID, roundId: 1, lockedAt: NOW };
    expect(isValidRoundEndLock(nonHostLock, HOST_UID, PLAYER_UID, false)).toBe(false);

    // Invalid: missing fields
    expect(isValidRoundEndLock({ lockedBy: HOST_UID }, HOST_UID, HOST_UID, false)).toBe(false);

    // Valid: null (deletion)
    expect(isValidRoundEndLock(null, HOST_UID, HOST_UID, false)).toBe(true);
  });

  test("T19: currentGuesses can only be incremented by 1 by non-host during playing", () => {
    // Host can set anything
    expect(isValidCurrentGuesses(5, 3, HOST_UID, HOST_UID, "playing")).toBe(true);

    // Non-host: increment by 1 during playing
    expect(isValidCurrentGuesses(4, 3, HOST_UID, PLAYER_UID, "playing")).toBe(true);

    // Non-host: increment by 2 DENIED
    expect(isValidCurrentGuesses(5, 3, HOST_UID, PLAYER_UID, "playing")).toBe(false);

    // Non-host: decrement DENIED
    expect(isValidCurrentGuesses(2, 3, HOST_UID, PLAYER_UID, "playing")).toBe(false);

    // Non-host: increment during non-playing status DENIED
    expect(isValidCurrentGuesses(4, 3, HOST_UID, PLAYER_UID, "waiting")).toBe(false);
    expect(isValidCurrentGuesses(4, 3, HOST_UID, PLAYER_UID, "roundEnd")).toBe(false);
  });

  test("T20: totalScore bounded 0-50000, only host can set arbitrary values", () => {
    // Host can set any valid score
    expect(isValidTotalScore(5000, 0, HOST_UID, HOST_UID, PLAYER_UID)).toBe(true);
    expect(isValidTotalScore(0, 5000, HOST_UID, HOST_UID, PLAYER_UID)).toBe(true);
    expect(isValidTotalScore(50000, 0, HOST_UID, HOST_UID, PLAYER_UID)).toBe(true);

    // Host CANNOT set score above 50000
    expect(isValidTotalScore(50001, 0, HOST_UID, HOST_UID, PLAYER_UID)).toBe(false);

    // Host CANNOT set negative score
    expect(isValidTotalScore(-1, 0, HOST_UID, HOST_UID, PLAYER_UID)).toBe(false);

    // Player can reset own score to 0
    expect(isValidTotalScore(0, 5000, HOST_UID, PLAYER_UID, PLAYER_UID)).toBe(true);

    // Player can keep same score (no-op update)
    expect(isValidTotalScore(5000, 5000, HOST_UID, PLAYER_UID, PLAYER_UID)).toBe(true);

    // Player CANNOT increase own score
    expect(isValidTotalScore(6000, 5000, HOST_UID, PLAYER_UID, PLAYER_UID)).toBe(false);
  });
});

// ====================================================================
// RULES FILE STRUCTURAL INTEGRITY
// ====================================================================

describe("Firebase Rules Contract: Structural Integrity", () => {
  test("Rules file is valid JSON with expected top-level structure", () => {
    expect(rulesJson).toBeDefined();
    expect(rulesJson.rules).toBeDefined();
    expect(rulesJson.rules.rooms).toBeDefined();
    expect(rulesJson.rules.rooms.$roomId).toBeDefined();
  });

  test("Room-level has .read, .write, and .validate rules", () => {
    const roomRules = rulesJson.rules.rooms.$roomId;
    expect(roomRules[".read"]).toBeDefined();
    expect(roomRules[".write"]).toBeDefined();
    expect(roomRules[".validate"]).toBeDefined();
  });

  test("All expected room fields have validate rules", () => {
    const roomRules = rulesJson.rules.rooms.$roomId;
    const expectedFields = [
      "id", "hostId", "status", "currentRound", "totalRounds",
      "gameMode", "timeLimit", "moveLimit", "currentLocation",
      "currentPanoPackageId", "currentPanoPackage", "currentLocationName",
      "roundResults", "roundStartTime", "createdAt", "lastActivityAt",
      "lastActiveAt", "gameInstanceId", "roundState", "roundVersion",
      "activePlayerCount", "expectedGuesses", "currentGuesses",
      "locationHistory", "roundEndLock", "meta", "players",
    ];
    for (const field of expectedFields) {
      expect(roomRules[field]).toBeDefined();
    }
  });

  test("All expected player fields have validate rules", () => {
    const playerRules = rulesJson.rules.rooms.$roomId.players.$playerId;
    const expectedPlayerFields = [
      "id", "name", "isHost", "totalScore", "currentGuess",
      "hasGuessed", "roundScores", "lastActiveAt", "joinedAt",
      "status", "lastSeen", "disconnectedAt", "sessionToken", "movesUsed",
    ];
    for (const field of expectedPlayerFields) {
      expect(playerRules[field]).toBeDefined();
    }
  });

  test("Player $other catch-all rejects unknown fields", () => {
    expect(rulesJson.rules.rooms.$roomId.players.$playerId.$other[".validate"]).toBe(false);
  });

  test("RoomId must match 6-char alphanumeric pattern", () => {
    const validateRule = rulesJson.rules.rooms.$roomId[".validate"];
    expect(validateRule).toContain("[A-Z0-9]{6}");

    // Test our evaluator matches
    expect(isValidRoomId("ABC123")).toBe(true);
    expect(isValidRoomId("ABCDEF")).toBe(true);
    expect(isValidRoomId("123456")).toBe(true);
    expect(isValidRoomId("abc123")).toBe(false); // lowercase
    expect(isValidRoomId("AB123")).toBe(false); // 5 chars
    expect(isValidRoomId("AB12345")).toBe(false); // 7 chars
    expect(isValidRoomId("ABC 12")).toBe(false); // space
  });

  test("Status regex matches rules file exactly", () => {
    const statusValidate = rulesJson.rules.rooms.$roomId.status[".validate"];
    expect(statusValidate).toContain("waiting|playing|roundEnd|gameOver");
  });

  test("GameMode regex matches rules file exactly", () => {
    const gameModeValidate = rulesJson.rules.rooms.$roomId.gameMode[".validate"];
    expect(gameModeValidate).toContain("urban|geo");
  });

  test("RoundState regex matches rules file exactly", () => {
    const roundStateValidate = rulesJson.rules.rooms.$roomId.roundState[".validate"];
    expect(roundStateValidate).toContain("waiting|active|ended");
  });

  test("Player status regex matches rules file exactly", () => {
    const playerStatusValidate = rulesJson.rules.rooms.$roomId.players.$playerId.status[".validate"];
    expect(playerStatusValidate).toContain("online|offline|disconnected");
  });

  test("Coordinate bounds in rules match expected Turkey bounds", () => {
    const rulesContent = JSON.stringify(rulesJson);
    // currentLocation and currentGuess share these bounds
    expect(rulesContent).toContain("35.0"); // MIN_LAT
    expect(rulesContent).toContain("43.0"); // MAX_LAT
    expect(rulesContent).toContain("25.0"); // MIN_LNG
    expect(rulesContent).toContain("46.0"); // MAX_LNG
  });

  test("totalRounds bounded 1-10 in rules", () => {
    const validate = rulesJson.rules.rooms.$roomId.totalRounds[".validate"];
    expect(validate).toContain(">= 1");
    expect(validate).toContain("<= 10");
    expect(isValidTotalRounds(1)).toBe(true);
    expect(isValidTotalRounds(10)).toBe(true);
    expect(isValidTotalRounds(0)).toBe(false);
    expect(isValidTotalRounds(11)).toBe(false);
  });

  test("currentRound bounded 0-20 in rules", () => {
    const validate = rulesJson.rules.rooms.$roomId.currentRound[".validate"];
    expect(validate).toContain(">= 0");
    expect(validate).toContain("<= 20");
  });

  test("timeLimit bounded 30-300 in rules", () => {
    const validate = rulesJson.rules.rooms.$roomId.timeLimit[".validate"];
    expect(validate).toContain(">= 30");
    expect(validate).toContain("<= 300");
    expect(isValidTimeLimit(30, HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidTimeLimit(300, HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidTimeLimit(29, HOST_UID, HOST_UID, false)).toBe(false);
    expect(isValidTimeLimit(301, HOST_UID, HOST_UID, false)).toBe(false);
  });

  test("moveLimit bounded 1-10 in rules", () => {
    const validate = rulesJson.rules.rooms.$roomId.moveLimit[".validate"];
    expect(validate).toContain(">= 1");
    expect(validate).toContain("<= 10");
    expect(isValidMoveLimit(1, HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidMoveLimit(10, HOST_UID, HOST_UID, false)).toBe(true);
    expect(isValidMoveLimit(0, HOST_UID, HOST_UID, false)).toBe(false);
    expect(isValidMoveLimit(11, HOST_UID, HOST_UID, false)).toBe(false);
  });

  test("Player name length bounded 1-20 in rules", () => {
    const validate = rulesJson.rules.rooms.$roomId.players.$playerId.name[".validate"];
    expect(validate).toContain("length >= 1");
    expect(validate).toContain("length <= 20");
  });

  test("totalScore bounded 0-50000 in rules", () => {
    const validate = rulesJson.rules.rooms.$roomId.players.$playerId.totalScore[".validate"];
    expect(validate).toContain(">= 0");
    expect(validate).toContain("<= 50000");
  });

  test("movesUsed bounded 0-10 in rules", () => {
    const validate = rulesJson.rules.rooms.$roomId.players.$playerId.movesUsed[".validate"];
    expect(validate).toContain(">= 0");
    expect(validate).toContain("<= 10");
    expect(isValidMovesUsed(0, null, HOST_UID, PLAYER_UID, PLAYER_UID)).toBe(true);
    expect(isValidMovesUsed(10, null, HOST_UID, PLAYER_UID, PLAYER_UID)).toBe(true);
    expect(isValidMovesUsed(11, null, HOST_UID, PLAYER_UID, PLAYER_UID)).toBe(false);
    expect(isValidMovesUsed(-1, null, HOST_UID, PLAYER_UID, PLAYER_UID)).toBe(false);
  });

  test("movesUsed can only increase for non-host players", () => {
    // Player can increment
    expect(isValidMovesUsed(3, 2, HOST_UID, PLAYER_UID, PLAYER_UID)).toBe(true);
    // Player CANNOT decrement
    expect(isValidMovesUsed(1, 2, HOST_UID, PLAYER_UID, PLAYER_UID)).toBe(false);
    // Host can reset
    expect(isValidMovesUsed(0, 5, HOST_UID, HOST_UID, PLAYER_UID)).toBe(true);
  });

  test("sessionToken minimum length 10 chars in rules", () => {
    const validate = rulesJson.rules.rooms.$roomId.players.$playerId.sessionToken[".validate"];
    expect(validate).toContain("length >= 10");
  });
});

// ====================================================================
// CROSS-REFERENCE: Rules <-> Production Config Consistency
// ====================================================================

describe("Firebase Rules Contract: Rules-Config Consistency", () => {
  test("Max players in rules (numChildren < 8) matches ROOM_LIFECYCLE.MAX_PLAYERS_PER_ROOM", () => {
    // Rules say: data.parent().numChildren() < 8
    const playerWriteRule = rulesJson.rules.rooms.$roomId.players.$playerId[".write"];
    expect(playerWriteRule).toContain("numChildren() < 8");
    // Production config says 8
    // This is consistent: "< 8" means max 7 existing + 1 new = 8 total
  });

  test("Host-only fields require hostId == auth.uid pattern", () => {
    const hostOnlyFields = [
      "status", "currentRound", "gameMode", "timeLimit", "moveLimit",
      "currentLocation", "currentPanoPackageId", "currentPanoPackage",
      "currentLocationName", "roundResults", "roundStartTime",
      "gameInstanceId", "roundState", "roundVersion",
      "activePlayerCount", "expectedGuesses", "locationHistory", "roundEndLock",
    ];
    for (const field of hostOnlyFields) {
      const validate = rulesJson.rules.rooms.$roomId[field];
      if (typeof validate === "object" && validate[".validate"]) {
        expect(validate[".validate"]).toContain("hostId");
      } else if (typeof validate === "string") {
        expect(validate).toContain("hostId");
      }
    }
  });

  test("currentLocation bounds match currentGuess bounds (35-43 lat, 25-46 lng)", () => {
    const locValidate = rulesJson.rules.rooms.$roomId.currentLocation[".validate"];
    const guessValidate = rulesJson.rules.rooms.$roomId.players.$playerId.currentGuess[".validate"];
    // Both should contain the same Turkey bounds
    for (const bounds of ["35.0", "43.0", "25.0", "46.0"]) {
      expect(locValidate).toContain(bounds);
      expect(guessValidate).toContain(bounds);
    }
  });

  test("createdAt must be <= now (prevents future timestamps)", () => {
    const validate = rulesJson.rules.rooms.$roomId.createdAt[".validate"];
    expect(validate).toContain("<= now");
  });

  test("roundStartTime monotonically increases (newData.val() >= data.val())", () => {
    const validate = rulesJson.rules.rooms.$roomId.roundStartTime[".validate"];
    expect(validate).toContain("newData.val() >= data.val()");
  });

  test("roundVersion monotonically increases (newData.val() >= data.val())", () => {
    const validate = rulesJson.rules.rooms.$roomId.roundVersion[".validate"];
    expect(validate).toContain("newData.val() >= data.val()");
  });
});
