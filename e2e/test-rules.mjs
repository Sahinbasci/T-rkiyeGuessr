import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, remove, runTransaction } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

const cfg = {
  apiKey: "AIzaSyChX9qroh1RAeAwTScCXZPwnyowbz8xADo",
  authDomain: "turkiye-guessr.firebaseapp.com",
  projectId: "turkiye-guessr",
  databaseURL: "https://turkiye-guessr-default-rtdb.firebaseio.com",
  appId: "1:1042107796020:web:x"
};

const a1 = initializeApp(cfg, "host_app");
const a2 = initializeApp(cfg, "p2_app");
const d1 = getDatabase(a1);
const d2 = getDatabase(a2);

const h = (await signInAnonymously(getAuth(a1))).user.uid;
const p = (await signInAnonymously(getAuth(a2))).user.uid;
const c = "T" + String(Math.floor(Math.random() * 90000) + 10000);
const n = Date.now();

let passed = 0;
let failed = 0;

function ok(name) { passed++; console.log(`  OK: ${name}`); }
function fail(name, err) { failed++; console.log(`  FAIL: ${name} — ${err}`); }

// Test 1: createRoom
try {
  await set(ref(d1, "rooms/" + c), {
    id: c, hostId: h, status: "waiting", currentRound: 0,
    totalRounds: 5, gameMode: "urban", timeLimit: 90, moveLimit: 3,
    createdAt: n, lastActivityAt: n, currentGuesses: 0,
    expectedGuesses: 0, activePlayerCount: 1,
    players: {
      [h]: { id: h, name: "Host", isHost: true, totalScore: 0,
        hasGuessed: false, movesUsed: 0, lastActiveAt: n, joinedAt: n,
        status: "online", lastSeen: n }
    }
  });
  ok("createRoom");
} catch (e) { fail("createRoom", e.message); }

// Test 2: joinRoom (P2)
try {
  await set(ref(d2, "rooms/" + c + "/players/" + p), {
    id: p, name: "P2", isHost: false, totalScore: 0,
    hasGuessed: false, movesUsed: 0, lastActiveAt: n, joinedAt: n + 1,
    status: "online", lastSeen: n
  });
  ok("joinRoom");
} catch (e) { fail("joinRoom", e.message); }

// Test 3: host migration transaction (P2 becomes host)
try {
  await runTransaction(ref(d2, "rooms/" + c), (room) => {
    if (room === null) return room;
    if (room.hostId !== h) return undefined; // abort
    return {
      ...room,
      hostId: p,
      players: {
        ...room.players,
        [p]: { ...room.players[p], isHost: true },
        [h]: { ...room.players[h], isHost: false }
      }
    };
  });
  const snap = await get(ref(d1, "rooms/" + c + "/hostId"));
  if (snap.val() === p) {
    ok("host migration");
  } else {
    fail("host migration", "hostId=" + snap.val() + " expected=" + p);
  }
} catch (e) { fail("host migration", e.message); }

// Test 4: new host writes roundEnd
try {
  await runTransaction(ref(d2, "rooms/" + c), (room) => {
    if (room === null) return room;
    return {
      ...room,
      status: "roundEnd",
      roundResults: [{ playerId: p, playerName: "P2", score: 0, distance: 9999, guess: { lat: 39, lng: 35 } }],
      roundEndLock: { lockedBy: p, roundId: 1, lockedAt: Date.now() }
    };
  });
  const snap = await get(ref(d1, "rooms/" + c + "/status"));
  if (snap.val() === "roundEnd") {
    ok("roundEnd by new host");
  } else {
    fail("roundEnd by new host", "status=" + snap.val());
  }
} catch (e) { fail("roundEnd by new host", e.message); }

// Cleanup
await remove(ref(d1, "rooms/" + c));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
process.exit(0);
