# TürkiyeGuessr — Launch Readiness Audit & Multiplayer Stabilization Plan

**Date**: 2026-02-24
**Target**: 10,000 users, launch tomorrow
**Auditor**: Principal Full-Stack Engineer (automated deep-dive)

---

# 1. Executive Verdict

**Current Launch Readiness Score: 6.5/10**

## Top 10 Launch Blockers

| # | Issue | Severity | Layer | Status |
|---|-------|----------|-------|--------|
| 1 | **Camera drift bug on mobile (sky drift)** — users report perspective drifts upward when rotating in place | P0 | Client / Street View SDK | UNRESOLVED |
| 2 | **Multiplayer freeze after round 1** — reported 3-4 player rooms stall at "Waiting for players" | P0 | Client State / Realtime Sync | NEEDS REPRO |
| 3 | **No production observability** — no Sentry, no structured event logs sent to backend, no alerting | P0 | Ops | ABSENT |
| 4 | **Firebase Security Rules not in repo** — cannot verify server-side validation is deployed | P1 | Security | UNKNOWN |
| 5 | **No load testing done** — zero evidence of handling 10K concurrent users | P1 | Infra | NOT DONE |
| 6 | **Client-only rate limiting** — trivially bypassable, no server-side throttling beyond Firebase rules | P1 | Security | PARTIAL |
| 7 | **Location DB in client bundle** — urbanSeeds.ts (142 locations) fully exposed in JS | P1 | Security / Anti-cheat | KNOWN |
| 8 | **No feature flags / kill switches** — cannot disable multiplayer or cap room size without deploy | P1 | Ops | ABSENT |
| 9 | **Timer uses Date.now() on client** — calculateRemainingTime in useTimer uses Date.now() not server offset | P2 | Timer Sync | MITIGATED |
| 10 | **No rollback plan documented** — no blue-green, no instant revert strategy | P2 | Ops | ABSENT |

## Immediate Recommendation: **CONDITIONAL GO**

**Conditions for GO:**
1. Reproduce and patch (or confirm non-existent) the round-freeze bug with 3-4 players — 2 hour max
2. Reproduce and instrument the camera drift bug — deploy workaround or document as known issue
3. Deploy Sentry or equivalent error tracking (1 hour setup)
4. Verify Firebase Security Rules are deployed and match expected constraints
5. Add emergency kill switch: environment variable to cap room size at 2 or disable room creation
6. Run a manual 8-player stress test through 5 full rounds

**If any P0 fails reproduction → GO with monitoring.**
**If any P0 reproduces and has no fix → NO-GO until patch deployed.**

---

# 2. System Assumptions

## Confirmed from Codebase

| Component | Technology | Confirmed |
|-----------|-----------|-----------|
| Frontend | Next.js 14.2.3 (App Router) + React 18.3.1 + TypeScript 5.4.5 | Yes |
| Styling | Tailwind CSS 3.4.3 + globals.css | Yes |
| Backend | Firebase Realtime Database (no custom backend server) | Yes |
| Auth | Firebase Anonymous Auth (ephemeral UIDs) | Yes |
| Maps | Google Maps Street View API via @googlemaps/js-api-loader 1.16.6 | Yes |
| State | Single useRoom hook (2194 lines) manages all multiplayer state | Yes |
| Timer | Server-timestamp-offset-based (useTimer hook, 212 lines) | Yes |
| Hosting | Vercel (turkiyeguessr.xyz) | Yes (from config) |
| Testing | Vitest + Playwright (configured but sparse) | Yes |
| Monitoring | Custom logger.ts (prod-safe), telemetry.ts (in-memory only) | Yes |

## Must Confirm from Team

1. Are Firebase Security Rules actually deployed? (database.rules.json referenced but not in repo root)
2. What is the Google Maps API daily quota / budget cap?
3. Is Vercel on Pro plan (concurrent builds, edge functions)?
4. Firebase Realtime DB plan — Spark (free) or Blaze (pay-as-you-go)?
5. Current daily active users (baseline before launch)?
6. Any CDN / edge caching in front of Vercel?

## Missing Information

- Firebase Security Rules deployment status
- Google Maps API quota configuration in Google Cloud Console
- Vercel plan tier and scaling limits
- Firebase RTDB connection limits on current plan
- Any previous load test results
- Server-side Cloud Functions (none found in repo — confirm no backend logic)

---

# 3. Multiplayer Failure Analysis

## Bug Hypothesis Table

| Bug ID | Symptom | Likely Root Cause | Layer | Reproduction Steps | Instrumentation | Fix Strategy | Severity | Confidence |
|--------|---------|-------------------|-------|--------------------|-----------------|-------------|----------|------------|
| MF-001 | **"Waiting for players" freeze after round 1** | Host's Effect 5 listener fires `acquireAndWriteRoundEnd` but transaction silently fails (network jitter / stale guard). RoundEndLock acquired but results not written. Watchdog (Effect 6) has 5s buffer — if lock exists but is "fresh" (<10s), watchdog won't force override. | Client State + Realtime Sync | 1. Create 4-player room. 2. Play round 1 normally. 3. All guess. 4. Round 1 ends. 5. Host clicks "Next Round". 6. Round 2: all guess. 7. Observe: status stays "playing", no roundEnd fires. | Log every `acquireAndWriteRoundEnd` entry/exit with trigger reason, lock state, transaction result. Log Effect 5 `allGuessed` check result per fire. | Add explicit transaction error handling with retry (max 2). Reduce WATCHDOG_LOCK_STALE_THRESHOLD from 10s to 5s. Add client-side "force round end" button for host after 15s stuck. | P0 | Medium |
| MF-002 | **Desync: some players see roundEnd, others still in playing** | Effect 5 onValue listener missed update (Firebase SDK edge case under load). Client resync (Effect 7) only activates if `hasGuessed=true` — unguessed players have no resync mechanism. | Client State | 1. 4-player room. 2. Round plays. 3. Timer expires. 4. 2 players see results, 2 stuck on map. | Add periodic (10s) status verification for ALL players during playing phase, not just hasGuessed players. Log listener fire count per player per round. | Extend Effect 7 resync to ALL players after timeLimit+5s regardless of guess status. Add `room.status` polling fallback. | P0 | Medium |
| MF-003 | **Host disconnect during roundEnd transition** | Host crashes between acquiring roundEndLock and transaction commit. New host elected but `isMigratingHostRef` guard prevents re-entry if already set. Post-migration recovery starts but room is in "playing" with stale lock. | Host Migration | 1. 3-player room. 2. Round plays, timer expires. 3. Kill host browser tab DURING roundEnd computation. 4. Observe new host behavior. | Log isMigratingHostRef state changes. Log post-migration recovery poll results. Add roundEndLock age to recovery check. | Post-migration recovery should check lock staleness (>5s) and force override, same as watchdog. | P1 | Medium |
| MF-004 | **Double roundEnd write → corrupted results** | Two triggers fire nearly simultaneously (allGuessed + timer expiry). Both pass the `!isProcessingRoundRef` guard before either sets it. `setTimeout(100)` vs `setTimeout(200)` — 100ms window. | Client State | 1. 3-player room. 2. Last player guesses at exactly timer=0. 3. Both allGuessed and timeUp fire. | Log isProcessingRoundRef state at each trigger entry. Add mutex around roundEnd entry (not just ref check). | Replace `isProcessingRoundRef` boolean with atomic counter + timestamp. First writer wins, second aborts immediately. Transaction guard (round check) is the real protection — document this. | P1 | Low |
| MF-005 | **Player stuck after tab background/foreground (mobile)** | Mobile Safari throttles timers when backgrounded. `visibilitychange` fires on return, timer resyncs, but if room already transitioned to roundEnd, player's UI doesn't reflect it because Effect 5 listener may have been suspended. | Client State + Mobile | 1. Join 3-player room on iPhone. 2. Switch to another app during round. 3. Return after round ended. 4. Observe: still shows playing state. | Log visibilitychange events with room.status at time of resume. Compare client state vs Firebase state on resume. | On visibilitychange → visible: force fresh `get()` of room state and hard-update local state. Already partially implemented in Effect 7 but only for guessed players. | P1 | High |
| MF-006 | **Ghost player inflates expectedGuesses** | Player disconnects during round. Host cleanup cycle (10s) detects disconnect but `decrementExpectedGuesses` transaction races with roundEnd. If roundEnd fires first, expectedGuesses is stale-high. | Realtime Sync | 1. 4-player room. 2. Round starts. 3. Player 4 closes browser immediately. 4. Other 3 guess. 5. Observe: allGuessed check fails because expectedGuesses=4 but only 3 online. | Log expectedGuesses vs actual online count at each allGuessed check. | allGuessed check should count `onlinePlayers.filter(p => p.hasGuessed).length === onlinePlayers.length` using LIVE player list, NOT `expectedGuesses` counter. Confirmed code does this — but verify `onlinePlayers` excludes disconnected. | P1 | Medium |
| MF-007 | **Reconnecting player can't submit guess** | Player reconnects (rejoin) but `hasGuessed` already false, `currentGuess` null. However, `isSubmittingGuessRef` may be true from pre-disconnect attempt. No reset of this ref on rejoin. | Client State | 1. Player submits guess. 2. Network drops mid-transaction. 3. Player reconnects. 4. Try to guess again — blocked by isSubmittingGuessRef. | Log isSubmittingGuessRef on rejoin. Add rejoin cleanup. | Reset `isSubmittingGuessRef` to false on rejoin/reconnect detection. Add timeout (5s) on isSubmittingGuessRef — auto-reset if stuck. | P1 | Medium |
| MF-008 | **Timer shows different values across players** | `calculateRemainingTime()` uses `Date.now()` directly, not `getServerNowMs()`. Server time offset not applied to timer display, only to validation checks. | Timer | 1. Two players on different networks with clock skew. 2. Compare timer display. 3. Observe: up to 2-3s difference. | Log `Date.now()`, `_serverTimeOffset`, `getServerNowMs()`, and `roundStartTime` at timer start. | Replace `Date.now()` in useTimer with `getServerNowMs()` from useRoom's server offset. Pass offset as prop. | P2 | High |
| MF-009 | **Rapid "Next Round" clicks create duplicate rounds** | Host clicks "Next Round" multiple times. `nextRoundWithPanoPackage` has `isNextRoundLoadingRef` guard but if pano package generation is slow, UI button may not disable fast enough. | Client State | 1. Host clicks "Next Round" rapidly 3 times. 2. Observe: round counter jumps by 2-3. | Log nextRoundWithPanoPackage entry count per roundEnd phase. | Transaction guard (`roundVersion` check) should prevent this. Verify `roundVersion` is incremented and checked. Add UI debounce (300ms) on next round button. | P2 | Low |
| MF-010 | **Host election split-brain on simultaneous disconnect detection** | Two clients detect host death at same time, both compute same election result (deterministic), both run migration transaction. First wins, second aborts cleanly — BUT if first transaction is slow, second may read stale hostId and also succeed. | Host Migration | 1. 4-player room. 2. Host disconnects. 3. Two remaining players are on fast connections. 4. Both detect and attempt migration. | Log migration transaction attempts with playerId, old hostId, new hostId, transaction result. | Already mitigated by transaction atomicity (first writer wins). Add explicit logging to confirm. Verify `isMigratingHostRef` prevents retry. | P2 | Low |

---

# 4. Multiplayer Reproduction Matrix

## Must-Test Scenarios

| ID | Scenario | Players | Host Action | Non-Host Action | Network | Device | Expected | Failure Signal | Logs to Check |
|----|----------|---------|-------------|-----------------|---------|--------|----------|----------------|---------------|
| RM-01 | Happy path — all guess normally | 2 | Guess + Next | Guess | Good | Desktop | Round completes, results shown | - | roundEnd trigger type |
| RM-02 | Happy path — 4 players | 4 | Guess + Next | All guess | Good | Mixed | All 5 rounds complete | Freeze at any round | acquireAndWriteRoundEnd logs |
| RM-03 | One player never guesses | 3 | Guess | 1 guesses, 1 doesn't | Good | Desktop | Timer expires, round ends, non-guesser gets 0 | Round never ends | watchdog trigger, timeUp handler |
| RM-04 | Host disconnects mid-round | 3 | Close tab at round 2 | Continue playing | Good | Desktop | New host elected, round continues | Game freezes | host migration transaction, post-migration recovery |
| RM-05 | Host disconnects after roundEnd before next | 3 | Close tab during roundEnd screen | Wait | Good | Desktop | New host elected, can click Next Round | Stuck at roundEnd | host migration, isHost check |
| RM-06 | Two players submit simultaneously | 3 | Guess at T-1s | Both guess at exact same time | Good | Desktop | Both guesses recorded, round ends | One guess lost, counter mismatch | currentGuesses counter, player hasGuessed |
| RM-07 | Player refreshes mid-round | 3 | Play normally | One refreshes page | Good | Desktop | Player rejoins, can still guess (if not already) | Player stuck, can't interact | rejoin flow, sessionToken match |
| RM-08 | Player joins mid-game | 3→4 | Playing | New player enters room code | Good | Desktop | Player sees lobby or spectator view | Crash, undefined state | joinRoom during "playing" status |
| RM-09 | Round timeout with mixed guessed/unguessed | 4 | Guess | 2 guess, 1 doesn't | Good | Desktop | Timer expires, all get results | Timeout not detected | handleTimeUp, watchdog |
| RM-10 | Consecutive rounds 1→2→3 (freeze test) | 4 | All rounds | Normal play | Good | Desktop | All 3 rounds complete smoothly | Freeze at round 2 or 3 | roundVersion, acquireAndWriteRoundEnd per round |
| RM-11 | Long session (5 rounds) | 4 | Full game | Normal | Good | Mixed | Game completes, gameOver shown | Memory leak, slowdown | listener count, interval count |
| RM-12 | Room code rejoin after disconnect | 3 | Play | One disconnects, then re-enters room code | Intermittent | Mobile | Player rejoins same position | New player created (duplicate) | sessionToken match, player merge |
| RM-13 | Tab background/foreground on mobile | 3 | Play | Switch to another app, return after 30s | Good | iPhone | Timer resyncs, game state correct | Stuck on old state | visibilitychange, Effect 7 resync |
| RM-14 | Device orientation change | 3 | Play | Rotate phone landscape→portrait | Good | Android | Layout adapts, game continues | Panorama breaks, map overlaps | CSS layout, Street View container |
| RM-15 | Slow network (3G simulation) | 3 | Play normally | One player on throttled connection | Slow (3G) | Mobile | Guesses accepted with delay, game continues | Timeout before guess reaches server | guess submission phases, grace period |
| RM-16 | Network disconnect + reconnect | 3 | Play | One player: airplane mode 10s, then reconnect | Disconnect | Mobile | Player reconnects, can continue | Removed from game, stuck state | presence heartbeat, onDisconnect, rejoin |
| RM-17 | Host on slow network, non-hosts fast | 3 | Play on 3G | Play normally | Mixed | Desktop | Host watchdog catches delayed roundEnd | Round stuck, non-hosts waiting | watchdog interval, server time sync |
| RM-18 | All players guess, then host refreshes before clicking Next | 3 | Refresh at roundEnd | Wait | Good | Desktop | Host rejoins, can proceed | Game stuck at roundEnd | rejoin as host, roundEnd state |
| RM-19 | Rapid room creation (spam test) | 1 | Create 5 rooms in 10s | - | Good | Desktop | Rate limiter blocks after 3 | Rooms created without limit | rateLimiter check |
| RM-20 | Two-player game, one leaves mid-round | 2 | Play | Leave room | Good | Desktop | Remaining player: round ends (all "online" guessed or timeout) | Game stuck (expectedGuesses=2 but only 1 online) | decrementExpectedGuesses, cleanup cycle |

---

# 5. Test Strategy

## Unit Tests (Vitest)

| Module | What to Test | File Pattern |
|--------|-------------|--------------|
| Score calculation | `5000 * exp(-3 * distance/500)` edge cases: 0m, 1m, 500m, 1000m, Turkey-wide | `__tests__/scoring.test.ts` |
| Timer calculation | `calculateRemainingTime` with various offsets, edge cases | `__tests__/useTimer.test.ts` |
| Rate limiter | Window-based limiting, concurrent checks, reset | `__tests__/rateLimiter.test.ts` |
| BagSelector | Fisher-Yates fairness, anti-repeat, province dedup | `__tests__/bagSelector.test.ts` |
| Room code generation | Uniqueness, format [A-Z0-9]{6}, collision handling | `__tests__/roomCode.test.ts` |
| Haversine distance | Known city pairs, boundary cases | `__tests__/haversine.test.ts` |
| Server time offset | Clock skew scenarios, offset application | `__tests__/serverTime.test.ts` |
| PersistentHistory | Ring buffer behavior, privacy (no province stored) | `__tests__/persistentHistory.test.ts` |

## Integration Tests

| Test | What It Validates | Approach |
|------|------------------|----------|
| Round lifecycle | waiting→playing→roundEnd→playing→gameOver | Mock Firebase, simulate state transitions |
| Guess submission 2-phase | Player TX + Counter TX atomicity | Mock runTransaction, verify order |
| Host migration | Election determinism, transaction atomicity | Mock player list, verify winner |
| Presence system | Heartbeat → stale → disconnected → removed | Mock timers, verify state transitions |
| Timer sync | Server offset applied correctly, background resume | Mock Date.now, visibilitychange |

## E2E Tests (Playwright)

### Folder Structure
```
e2e/
├── multiplayer/
│   ├── BUG-MF001-round-freeze.spec.ts
│   ├── BUG-MF002-desync-playing-roundend.spec.ts
│   ├── happy-path-2-players.spec.ts
│   ├── happy-path-4-players.spec.ts
│   ├── host-disconnect-migration.spec.ts
│   ├── player-rejoin.spec.ts
│   ├── round-timeout.spec.ts
│   └── simultaneous-guess.spec.ts
├── mobile/
│   ├── camera-drift.spec.ts
│   ├── orientation-change.spec.ts
│   ├── safe-area-layout.spec.ts
│   ├── tab-background-resume.spec.ts
│   └── touch-navigation.spec.ts
├── smoke/
│   ├── create-room.spec.ts
│   ├── join-room.spec.ts
│   ├── menu-navigation.spec.ts
│   └── full-game-cycle.spec.ts
└── fixtures/
    ├── mock-streetview.ts
    ├── mock-firebase.ts
    └── test-room-helpers.ts
```

### Mocking Strategy
- **Street View**: Inject mock StreetViewPanorama class via `page.addInitScript()` that returns static images
- **Firebase**: Use Firebase Emulator Suite for deterministic tests, or mock `onValue`/`runTransaction` via page context injection
- **Multiplayer Determinism**: Use 2+ Playwright browser contexts sharing same Firebase emulator. Synchronize via shared room code.

### Naming Convention
```
BUG-{ID}-{short-description}.spec.ts    // Regression tests
{feature}-{scenario}.spec.ts            // Feature tests
```

## Smoke Suite (5-Minute Pre-Deploy)

1. Menu screen loads (< 3s)
2. Create room succeeds
3. Join room with code succeeds
4. Street View panorama loads
5. Guess map renders and accepts click
6. Submit guess works
7. Timer counts down
8. Round end modal appears
9. Next round loads new panorama
10. Game over after final round

---

# 6. Mobile UI/UX Audit

| # | Item | Why It Matters | How to Test | Pass Criteria | Severity |
|---|------|---------------|-------------|---------------|----------|
| 1 | **Safe area top (notch)** | Game header hidden behind notch | iPhone 14 Pro, check header visibility | Header fully visible below notch | P1 |
| 2 | **Safe area bottom (home indicator)** | Submit button behind gesture area | iPhone, check MobileActionBar | Button fully above home indicator | P1 |
| 3 | **Touch target size (submit button)** | Missed taps → frustration | Measure button height | >= 44px height (Apple HIG) | P1 |
| 4 | **Touch target size (mini map toggle)** | Can't expand map | Measure tap area | >= 44×44px | P2 |
| 5 | **Map overlap with action bar** | Can't place pin near bottom of map | Expand map, try placing pin at bottom edge | Pin placeable everywhere | P1 |
| 6 | **Orientation: portrait→landscape** | Layout breaks, panorama stretches | Rotate device mid-round | Layout adapts, no overflow | P1 |
| 7 | **Orientation: landscape game play** | Wasted vertical space | Play full round in landscape | All UI elements visible and usable | P2 |
| 8 | **Keyboard overlay on name input** | Input hidden behind keyboard | Tap "Oyuncu Adı" on iPhone | Input scrolls into view | P2 |
| 9 | **Loading state (panorama)** | User thinks app froze | Throttle network, observe loading | Spinner visible, no blank screen | P1 |
| 10 | **Disabled submit button clarity** | User doesn't know why can't submit | No pin placed + look at button | Button visually disabled + hint text | P2 |
| 11 | **Timer visibility on small screens** | Can't see remaining time | iPhone SE (320px width) | Timer readable, not truncated | P1 |
| 12 | **Double-tap zoom prevention** | Accidentally zooms page instead of game | Double-tap on Street View | No page zoom (touch-action: manipulation) | P1 |
| 13 | **Guess submission feedback** | User unsure if guess registered | Submit guess, observe UI | Immediate visual confirmation | P1 |
| 14 | **Round transition clarity** | Confused about what happened | Round ends, observe modal | Clear score, distance, "next" button | P2 |
| 15 | **Connection loss indicator** | User doesn't know they're offline | Airplane mode, observe | Banner appears within 5s | P1 |
| 16 | **Low-end device performance** | Janky, unplayable | Moto G4 or Chrome DevTools throttle | 30+ FPS during pan, < 100ms input latency | P1 |
| 17 | **Street View pan smoothness** | Choppy rotation | Pan 360° on mobile | No frame drops during pan | P2 |
| 18 | **Pull-to-refresh interference** | Accidentally refreshes page | Pull down while panning up | No page refresh (overscroll-behavior) | P1 |
| 19 | **Accidental back navigation** | Swipe back exits game | Swipe from left edge on iOS | No accidental navigation | P2 |
| 20 | **Text readability** | Too small on mobile | Check all text at 320px | Minimum 12px font-size | P2 |

---

# 7. Mobile Camera Drift Bug ("Sky Drift") Deep-Dive

## Problem Statement
Users report: when rotating in place (without moving to a new pano), the camera perspective slowly drifts upward toward the sky.

## Codebase Analysis Result

After deep analysis of `useStreetView.ts` (1284 lines), the custom code does NOT contain pitch/heading delta accumulation logic. All POV changes are set via explicit values, not deltas. The custom click handler only computes heading from click position — pitch is never modified by custom code during rotation.

**Key finding: Rotation in place (dragging to look around) is handled entirely by Google Maps Street View SDK internally.** The custom code only intercepts `pointerup` for navigation clicks, not for drag-to-look.

## Ranked Root-Cause Hypotheses

| Rank | Hypothesis | Probability | Evidence From Code |
|------|-----------|------------|-------------------|
| 1 | **Google Street View SDK internal bug — touch inertia on mobile** | HIGH | Rotation is 100% handled by SDK. Custom code sets `touch-action: none` on widget-scene-canvas, giving SDK full control. Mobile touch handlers may accumulate pitch drift due to inertia algorithm. |
| 2 | **`pano_changed` pitch restore interfering with SDK rotation** | MEDIUM | Lines 564-575: After ANY pano_changed event, code does `setPov({heading, pitch: pendingPitchRef})` via RAF. If pano_changed fires during a rotation drag (same-pano case exits at line 554-558, so this should NOT apply). But if `getPano()` returns a different string transiently, the restore kicks in and shifts pitch. |
| 3 | **`requestAnimationFrame` setPov conflicting with SDK animation** | MEDIUM | Line 568: RAF-based setPov may execute mid-SDK animation frame, causing a conflict between SDK's internal pitch and the forced pitch value. This could create a "pull" toward pendingPitchRef on each frame. |
| 4 | **MutationObserver DOM manipulation during rotation** | LOW | Lines 864-886: Observer hides Google Maps links by modifying styles. If a link element is added/removed during rotation, the reflow could subtly affect the canvas or scroll position. |
| 5 | **CSS `touch-action` conflicts between containers** | LOW | globals.css has `touch-action: pan-x pan-y` on `.gm-style` but `touch-action: none` on `.widget-scene-canvas`. Conflicting directives on parent/child may cause browser to mishandle touch deltas. |
| 6 | **iOS Safari momentum scrolling interaction** | LOW | `-webkit-overflow-scrolling: touch` on body may cause scroll momentum to bleed into Street View canvas despite containment. |

## Instrumentation Plan

### Step 1: Verify SDK is the source
```typescript
// Add to useStreetView.ts, TEMPORARY debug code
let driftLogInterval: number | null = null;

function startDriftMonitor(panorama: google.maps.StreetViewPanorama) {
  let lastPitch = panorama.getPov().pitch;
  let lastHeading = panorama.getPov().heading;
  let frameCount = 0;

  driftLogInterval = window.setInterval(() => {
    const pov = panorama.getPov();
    const pitchDelta = pov.pitch - lastPitch;
    const headingDelta = pov.heading - lastHeading;

    if (Math.abs(pitchDelta) > 0.01 || Math.abs(headingDelta) > 0.01) {
      console.log(`[DRIFT] Frame ${frameCount}: pitch=${pov.pitch.toFixed(4)} (Δ${pitchDelta.toFixed(4)}), heading=${pov.heading.toFixed(4)} (Δ${headingDelta.toFixed(4)})`);
    }

    lastPitch = pov.pitch;
    lastHeading = pov.heading;
    frameCount++;
  }, 100); // 10 FPS sampling
}
```

### Step 2: Isolate custom code vs SDK
1. **Test A**: Comment out pano_changed listener (lines 547-730). If drift stops → hypothesis 2/3 confirmed.
2. **Test B**: Comment out MutationObserver (lines 864-886). If drift stops → hypothesis 4 confirmed.
3. **Test C**: Remove `touch-action` CSS overrides. If drift stops → hypothesis 5 confirmed.
4. **Test D**: If drift persists with ALL custom code disabled → hypothesis 1 confirmed (SDK bug).

### Step 3: Quantify drift rate
- Log pitch value every 100ms during a 30-second stationary rotation test
- Plot pitch over time — look for monotonic increase (upward drift)
- Record device, OS, browser, and Google Maps SDK version

## Fix Options

### Short-term Patch (if SDK bug confirmed)
```typescript
// Pitch clamp — add to pano_changed same-pano handler (line 554-558)
if (currentPanoId === lastPanoIdRef.current) {
  const pov = panoramaRef.current.getPov();
  // Clamp pitch to [-80, 80] to prevent sky lock
  if (pov.pitch > 80 || pov.pitch < -80) {
    panoramaRef.current.setPov({
      heading: pov.heading,
      pitch: Math.max(-80, Math.min(80, pov.pitch)),
    });
  }
  lastHeadingRef.current = pov.heading || 0;
  navigationMetrics.rotateCount++;
  return;
}
```

### Short-term Patch (if setPov conflict confirmed)
```typescript
// Debounce the RAF setPov to avoid conflict with ongoing SDK animation
// Replace lines 568-575:
const setPovTimeout = setTimeout(() => {
  requestAnimationFrame(() => {
    if (panoramaRef.current) {
      panoramaRef.current.setPov({
        heading: targetHeading,
        pitch: targetPitch,
      });
    }
  });
}, 50); // 50ms delay lets SDK animation settle
```

### Long-term Fix
- Report bug to Google Maps Platform if SDK-internal
- Add `pov_changed` listener to continuously monitor and clamp pitch within bounds
- Consider using `google.maps.StreetViewPanorama` options: `pitchRange` restriction if available

## Regression Tests
```typescript
// e2e/mobile/camera-drift.spec.ts
test('pitch should not drift during stationary rotation', async ({ page }) => {
  // Setup: Load game with known pano
  // Action: Simulate touch drag rotation (360°) without moving
  // Assert: |finalPitch - initialPitch| < 2°

  const initialPitch = await page.evaluate(() =>
    window.__testPanorama?.getPov().pitch
  );

  // Simulate 10 rotation drags
  for (let i = 0; i < 10; i++) {
    await page.touchscreen.swipe(200, 400, 600, 400, { duration: 500 });
    await page.waitForTimeout(200);
  }

  const finalPitch = await page.evaluate(() =>
    window.__testPanorama?.getPov().pitch
  );

  expect(Math.abs(finalPitch - initialPitch)).toBeLessThan(2);
});
```

---

# 8. Load & Performance Readiness for 10K Users

## Concurrency Model

| Metric | Estimate | Calculation |
|--------|----------|-------------|
| Total users | 10,000 | Given |
| Concurrent online | ~3,000 (30% peak) | Standard concurrency ratio |
| Active rooms | ~750 | 3,000 / 4 avg players per room |
| Rounds/minute | ~375 | 750 rooms × 0.5 rounds/min (90s rounds) |
| Firebase writes/sec (heartbeat) | ~600 | 3,000 players × 1 write/5s |
| Firebase writes/sec (guess submit) | ~50 | 375 rounds/min × 4 players × 2 phases / 60s |
| Firebase reads/sec (listeners) | ~750 | 1 listener per room, fires on any write |
| Google Maps API calls/round/room | ~5 | 1 setPano + ~4 navigations |
| Google Maps API calls/sec | ~31 | 375 rounds/min × 5 calls / 60s |

## Bottleneck Risk Assessment

| Component | Risk | Mitigation |
|-----------|------|------------|
| **Firebase RTDB connections** | HIGH — Spark plan: 100 simultaneous connections. Blaze: 200K. | MUST be on Blaze plan. Verify current plan immediately. |
| **Firebase RTDB bandwidth** | MEDIUM — Each room write propagates to all listeners (~4 players × full room snapshot). | Room object is ~2KB. 600 writes/sec × 2KB × 4 listeners = 4.8 MB/s. Blaze handles this. |
| **Firebase RTDB write rate** | LOW — 1000 writes/sec per database is the documented limit. We estimate 650/sec. | Within limits but close. Monitor. |
| **Google Maps API quota** | MEDIUM — Default 25,000 requests/day for Street View. 10K users × ~5 rounds × 5 calls = 250K calls/day. | MUST increase quota in Google Cloud Console. Current $50/day budget = ~7,142 calls/day — **FAR TOO LOW for 10K users.** |
| **Vercel serverless cold starts** | LOW — Static site, no server functions. | N/A |
| **Client memory (long sessions)** | MEDIUM — Listener count, interval accumulation, notification timers. | Verify cleanup on round transition. Limit notification history to last 10. |

## CRITICAL: Google Maps API Budget

**Current budget: $50/day = ~7,142 Street View calls.**
**10K users need: ~250,000 calls/day.**
**Required budget: ~$1,750/day.**

**This is a launch blocker if not addressed.**

Options:
1. Increase Google Maps API budget to $2,000/day
2. Implement server-side pano caching proxy (reduces calls by 80%)
3. Pre-load all pano data as static images (major architecture change)
4. Cap concurrent rooms to stay within budget

## Performance Test Matrix

| Test | Type | Duration | Concurrency | Success Criteria | Abort Criteria | Monitor |
|------|------|----------|-------------|-----------------|----------------|---------|
| Smoke | Basic | 2 min | 10 users (3 rooms) | All complete game | Any crash | Console errors |
| Load | Sustained | 15 min | 100 users (25 rooms) | 95% rounds complete < 5s latency | > 10% failure | Firebase bandwidth, RTDB connections |
| Stress | Ramp-up | 10 min | 10→500 users | Graceful degradation at limit | RTDB errors > 5% | Connection count, write latency |
| Spike | Burst | 5 min | 0→200→0 users | Recovery < 30s | No recovery | Firebase reconnections |
| Soak | Endurance | 60 min | 50 users | No memory leaks, stable FPS | Memory > 500MB / FPS < 15 | Heap size, FPS, listener count |

---

# 9. Observability & Production Telemetry

## Must-Have Before Launch

### Tier 1: Error Tracking (CRITICAL — deploy today)

**Recommendation: Sentry**
```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: "...",
  tracesSampleRate: 0.1, // 10% of transactions
  replaysOnErrorSampleRate: 1.0,
  environment: "production",
});
```

### Tier 2: Structured Event Logging

| Event | Required Fields | Layer | Why It Matters |
|-------|----------------|-------|---------------|
| `room_created` | roomId, hostId, gameMode, timestamp | Client | Track room creation rate |
| `room_joined` | roomId, playerId, isRejoin, playerCount | Client | Track join success rate |
| `round_started` | roomId, roundNumber, activePlayerCount, panoId | Client (host) | Track round start reliability |
| `guess_submitted` | roomId, roundNumber, playerId, latencyMs, phase1Success, phase2Success | Client | Track guess reliability |
| `round_end_triggered` | roomId, roundNumber, trigger (allGuessed/timeUp/watchdog/recovery/postMigration), latencyMs | Client (host) | **Critical for debugging freezes** |
| `round_end_failed` | roomId, roundNumber, trigger, error, lockState | Client (host) | Debug lock failures |
| `watchdog_fired` | roomId, roundNumber, elapsed, lockAge, attempt | Client (host) | Track recovery frequency |
| `host_migration_started` | roomId, oldHostId, newHostId, electionBasis | Client | Track migration events |
| `host_migration_completed` | roomId, newHostId, durationMs | Client | Track migration success |
| `client_resync_triggered` | roomId, playerId, reason, statusMismatch | Client | Track desync frequency |
| `player_disconnected` | roomId, playerId, lastSeen, gracePeriodRemaining | Client (host) | Track disconnections |
| `camera_drift_detected` | roomId, playerId, pitchDelta, headingDelta, duration | Client | Track drift bug |
| `pano_load_failed` | roomId, panoId, error | Client | Track pano failures |
| `api_budget_warning` | roomId, callCount, budgetRemaining | Client | Cost protection |

### Tier 3: Real-Time Dashboard

**Metrics to display:**
- Active rooms (count)
- Active players (count)
- Rounds completed / minute
- Round-end trigger distribution (pie: allGuessed / timeUp / watchdog / recovery)
- Average round-end latency (ms)
- Error rate (errors / minute)
- Disconnection rate
- Host migration rate
- Client resync rate

### Tier 4: Alerts

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High error rate | > 50 errors/min | SEV-1 | Page on-call |
| Watchdog fire rate | > 10% of round-ends via watchdog | SEV-2 | Investigate roundEnd reliability |
| Host migration rate | > 5% of rooms | SEV-2 | Investigate disconnect cause |
| Client resync rate | > 20% of players | SEV-2 | Investigate listener reliability |
| Firebase connection errors | > 100/min | SEV-1 | Check Firebase status |
| API budget 80% | Remaining < 20% | SEV-2 | Reduce room cap or increase budget |

---

# 10. Release Gating Checklist

## Functional Gates

- [ ] Menu screen: create room, join room, mode selection all work
- [ ] Lobby: players see each other, host can start game
- [ ] Game: Street View loads within 5s for 95% of panos
- [ ] Game: Map click places pin, submit registers guess
- [ ] Game: Timer counts down and fires roundEnd
- [ ] Game: Round-end modal shows correct scores and distances
- [ ] Game: Next round loads new panorama
- [ ] Game: Game over after final round shows leaderboard
- [ ] Game: Leave room returns to menu cleanly

## Multiplayer Stability Gates

- [ ] 2-player game: 5 rounds complete without freeze (3 test runs)
- [ ] 3-player game: 5 rounds complete without freeze (3 test runs)
- [ ] 4-player game: 5 rounds complete without freeze (3 test runs)
- [ ] Host disconnect: new host elected and game continues (2 test runs)
- [ ] Player disconnect mid-round: round ends correctly for remaining players
- [ ] Player rejoin: rejoining player retains identity and can continue
- [ ] Simultaneous guess: both recorded, no counter mismatch
- [ ] Tab background/foreground: state resyncs within 5s

## Mobile UX Gates

- [ ] iPhone (Safari): full game playable, no layout overflow
- [ ] Android (Chrome): full game playable, no layout overflow
- [ ] Safe areas: no content hidden behind notch or home indicator
- [ ] Touch: submit button responsive, no accidental double-tap zoom
- [ ] Mini map: expandable, pin placement works, collapsible
- [ ] Camera drift: pitch drift < 5° over 60s of stationary rotation (or documented as known issue)

## Performance Gates

- [ ] Initial page load: < 3s on 4G connection
- [ ] Panorama load: < 5s per round
- [ ] Input latency: < 200ms (guess submit → UI feedback)
- [ ] Memory: < 300MB after 5 rounds (no leak)
- [ ] FPS: > 30 FPS during Street View pan on mid-range mobile

## Observability Gates

- [ ] Sentry (or equivalent) deployed and receiving events
- [ ] `round_end_triggered` event logged with trigger type
- [ ] Error boundary catches and reports unhandled errors
- [ ] Firebase connection status displayed to user

## Rollback Readiness Gates

- [ ] Previous Vercel deployment accessible via instant rollback
- [ ] Room creation can be disabled via environment variable or code flag
- [ ] Team has access to Firebase Console for emergency reads/writes

---

# 11. Rollback & Incident Response Plan

## Severity Levels

| Level | Definition | Example | Response Time |
|-------|-----------|---------|---------------|
| SEV-1 | Game unplayable for all users | Firebase down, JS crash on load, all rooms freeze | < 15 min |
| SEV-2 | Major feature broken, workaround exists | Multiplayer freeze in 4+ player rooms, camera drift severe | < 1 hour |
| SEV-3 | Minor issue, cosmetic or edge case | Wrong score display, layout glitch on one device | < 24 hours |

## Triage Flow

```
1. USER REPORTS ISSUE
   ↓
2. CHECK SENTRY
   → JS errors spiking? → SEV-1 if crash, SEV-2 if non-fatal
   ↓
3. CHECK FIREBASE CONSOLE
   → Connection count? Write errors? Bandwidth spike?
   → Realtime DB rules rejecting writes? (check rules simulator)
   ↓
4. CHECK VERCEL DASHBOARD
   → Deploy status? Edge function errors? Build broken?
   ↓
5. CHECK GOOGLE CLOUD CONSOLE
   → Maps API quota reached? Billing issue?
   ↓
6. REPRODUCE IN STAGING
   → Create test room, replicate player count and actions
```

## Emergency Mitigations

| Mitigation | When | How | Rollback |
|------------|------|-----|----------|
| **Disable room creation** | Overload / cascade failure | Set `NEXT_PUBLIC_MAINTENANCE=true`, check in MenuScreen | Remove env var, redeploy |
| **Cap room size to 2** | 4-player freeze bug confirmed | Hardcode `MAX_PLAYERS=2` in production.ts | Revert and redeploy |
| **Rollback to previous deploy** | New deploy introduced regression | Vercel dashboard → Deployments → Promote previous | Redeploy fixed version |
| **Force game mode to "urban" only** | Geo mode crashing | Disable geo button in MenuScreen | Revert |
| **Reduce round count to 3** | Long sessions causing issues | Change `DEFAULT_TOTAL_ROUNDS` in types | Revert |

## User Communication

**Template for turkiyeguessr.xyz status:**
> "TürkiyeGuessr'da teknik bir sorun tespit ettik. Ekibimiz sorunu çözmek için çalışıyor. Oyun [X dakika] içinde normale dönecektir. Anlayışınız için teşekkür ederiz."

---

# 12. Execution Plan (Tonight → Launch Tomorrow)

## Tonight (T-12h to T-6h)

| Time | Owner | Task | Output | Exit Criteria | Risk if Skipped |
|------|-------|------|--------|---------------|-----------------|
| T-12h | Frontend Dev | Reproduce MF-001 (round freeze with 4 players × 3 attempts) | Reproduction report (repro/no-repro) | Clear verdict on freeze existence | Ship P0 bug to production |
| T-12h | Backend Dev | Verify Firebase plan is Blaze. Check RTDB connection limits. Verify security rules deployed. | Screenshot of Firebase Console | Blaze confirmed, rules verified | Hit 100-connection cap at launch |
| T-11h | Frontend Dev | Add drift instrumentation (Section 7, Step 1-2). Test on iPhone. | Drift data log, root cause identified or SDK confirmed | Clear diagnosis | Users report drift, no fix path |
| T-11h | Backend Dev | Check Google Maps API quota in GCP Console. Calculate required budget. | Quota numbers documented | Budget sufficient for 10K users | API quota exhausted mid-launch |
| T-10h | Frontend Dev | If MF-001 reproduced: implement fix. If not: add extra logging. | Code patch or instrumentation PR | Fix passes 3× repro test | Freeze occurs during launch |
| T-10h | Backend Dev | Set up Sentry: `npm install @sentry/nextjs`, configure, verify events arrive | Sentry dashboard with test error | Error events visible in Sentry | Zero visibility into production errors |
| T-9h | Frontend Dev | If drift confirmed: implement pitch clamp patch (Section 7 short-term fix) | Code patch | Drift < 5° over 60s rotation | Users report unplayable on mobile |
| T-9h | Backend Dev | Add `round_end_triggered` telemetry event with trigger type in acquireAndWriteRoundEnd | Code patch | Events visible in Sentry breadcrumbs | Can't debug round-end issues |
| T-8h | QA | Manual test: 4-player game, 5 rounds, desktop + mobile mix | Test report with screenshots | All 5 rounds complete, no freeze | Untested core flow ships |
| T-8h | Frontend Dev | Fix MF-005: force fresh `get()` on visibilitychange for ALL players | Code patch + manual test on iPhone | Background/foreground resyncs | Mobile users get stuck |
| T-7h | QA | Manual test: host disconnect mid-round (2 tests) | Test report | New host elected, game continues | Host crash = dead game |
| T-7h | Backend Dev | Add environment variable kill switch: `NEXT_PUBLIC_MAX_PLAYERS` (default 8, can reduce to 2) | Code + env var documentation | Cap enforced in lobby join logic | No way to reduce blast radius |

## Morning (T-6h to T-0)

| Time | Owner | Task | Output | Exit Criteria | Risk if Skipped |
|------|-------|------|--------|---------------|-----------------|
| T-6h | All | Code freeze. No more features. Only P0 fixes. | Git tag `pre-launch` | All changes committed | Untested changes in production |
| T-5h | Frontend Dev | `npm run build` clean. Deploy to Vercel staging. | Staging URL | Build succeeds, no TypeScript errors | Build failure at launch |
| T-5h | Backend Dev | Final Firebase rules verification via rules simulator | Simulator test results | All write rules pass expected scenarios | Security holes in production |
| T-4h | QA | Full smoke suite on staging (10 tests from Section 5) | Smoke test report | 10/10 pass | Broken build ships |
| T-4h | Product Owner | Verify Vercel rollback works: promote previous deploy, verify site works, re-promote current | Rollback test report | Rollback completes < 2 min | No escape hatch |
| T-3h | QA | Mobile smoke test: iPhone Safari + Android Chrome | Mobile test report | Core flow works on both | Mobile broken at launch |
| T-2h | All | GO/NO-GO meeting. Review all gate checklist items. | Decision documented | All P0 gates pass | Ship known-broken product |
| T-1h | Backend Dev | Deploy to production. Verify Sentry receives events. | Production URL live | Site loads, Sentry connected | N/A |
| T-0 | All | **LAUNCH** | Monitor Sentry, Firebase Console, Google Cloud Console | - | - |

## Post-Launch (T+0 to T+4h)

| Time | Owner | Task |
|------|-------|------|
| T+0 to T+1h | All | Active monitoring. Watch Sentry errors, Firebase connections, API quota. |
| T+15min | Backend Dev | Check Firebase RTDB connection count. If > 50% capacity → alert. |
| T+30min | Backend Dev | Check Google Maps API usage. If > 30% daily budget burned → alert. |
| T+1h | QA | Create 4-player test room on production. Play 3 rounds. Report any issues. |
| T+2h | All | If no SEV-1: reduce monitoring to 30-min checks. |
| T+4h | All | Post-launch retrospective. Document all issues found. |

---

# EXTRA: Test Cases

## 25 Multiplayer Test Cases

### TC-MP-01: Two players — happy path (5 rounds)
1. Player A creates room (Urban mode)
2. Player B joins via room code
3. Player A starts game
4. Both see same Street View panorama
5. Both place pins and submit guesses
6. Round-end modal shows scores for both
7. Host clicks "Next Round"
8. Repeat for 5 rounds
9. Game-over screen shows final leaderboard
10. **Pass**: All 5 rounds complete, scores correct

### TC-MP-02: Four players — happy path
1. Players A-D join room
2. Host starts game
3. All 4 guess within time limit
4. Round-end displays all 4 results
5. Complete 5 rounds
6. **Pass**: No freezes, all scores match expectations

### TC-MP-03: Player never guesses — timer expiry
1. 3-player room, round starts
2. Players A and B guess, Player C does nothing
3. Timer reaches 0
4. **Pass**: Round ends within 5s of timer expiry, Player C gets 0 points

### TC-MP-04: Host disconnects mid-round
1. 3-player room, round 2 in progress
2. Host closes browser tab
3. **Pass**: Within 15s, new host elected. If round was active, it continues/resolves.

### TC-MP-05: Host disconnects at roundEnd
1. 3-player room, round 1 ends, results displayed
2. Host closes browser tab
3. **Pass**: New host elected, "Next Round" button appears for new host

### TC-MP-06: Simultaneous guess submission
1. 3-player room, round active
2. Players B and C submit guess at exact same moment
3. **Pass**: Both guesses recorded, currentGuesses counter = 2

### TC-MP-07: Player refreshes page mid-round
1. 3-player room, round active
2. Player B presses F5 (browser refresh)
3. **Pass**: Player B rejoins room, sees current round, can guess if not already guessed

### TC-MP-08: Player refreshes after guessing
1. 3-player room, Player B has guessed
2. Player B refreshes page
3. **Pass**: Player B rejoins, sees "Tahmin Gönderildi" state, guess preserved

### TC-MP-09: Late joiner during waiting phase
1. Room created, 2 players waiting
2. Third player joins
3. **Pass**: All 3 visible in lobby, game can start

### TC-MP-10: Late joiner during playing phase
1. Room in "playing" status
2. New player enters room code
3. **Pass**: Either joins as spectator for next round, or rejected with clear message

### TC-MP-11: Consecutive rounds freeze test
1. 4-player room
2. Play rounds 1, 2, 3 sequentially (all guess normally)
3. **Pass**: No freeze between any round transitions

### TC-MP-12: Long session — 5 rounds with 4 players
1. 4-player room, 5 rounds
2. Mix of quick guesses and timer-expiry rounds
3. **Pass**: Game completes, memory < 300MB, no listener leaks

### TC-MP-13: Room code rejoin after network drop
1. 3-player room, round active
2. Player B: airplane mode for 20s, then reconnect
3. Player B enters same room code
4. **Pass**: Player B rejoins as same player (sessionToken match), not duplicate

### TC-MP-14: Tab background/foreground on mobile
1. 3-player room, playing on iPhone
2. Player B switches to another app for 30s
3. Player B returns
4. **Pass**: Timer resyncs, room state correct, can interact

### TC-MP-15: Device orientation change mid-round
1. Playing on Android in portrait
2. Rotate to landscape during round
3. **Pass**: Layout adapts, Street View visible, map accessible

### TC-MP-16: Slow network player
1. 3-player room
2. Player C on Chrome DevTools 3G throttle
3. Player C submits guess
4. **Pass**: Guess accepted within 10s, round continues

### TC-MP-17: Host on slow network
1. 3-player room, host on 3G
2. All guess, round should end
3. **Pass**: Watchdog catches delayed roundEnd, resolves within 10s

### TC-MP-18: Rapid "Next Round" clicks
1. 3-player room, roundEnd screen
2. Host clicks "Next Round" 5 times rapidly
3. **Pass**: Only 1 round advances, no skip

### TC-MP-19: Two-player game, one leaves
1. 2-player room, round active
2. Player B clicks "Leave Room"
3. **Pass**: Player A continues alone, round resolves (timeout or auto-end)

### TC-MP-20: All players disconnect except one
1. 4-player room, round active
2. Players B, C, D all close tabs
3. **Pass**: Player A (or new host) sees round end after cleanup removes ghosts

### TC-MP-21: Room creation spam
1. Player creates rooms rapidly (5 in 10s)
2. **Pass**: Rate limiter blocks after 3, shows error message

### TC-MP-22: Same player joins twice (two tabs)
1. Player opens game in 2 browser tabs
2. Joins same room from both
3. **Pass**: Only one session active, or clear error on second join

### TC-MP-23: Game mode change in lobby
1. 3-player room in lobby
2. Host switches from Urban to Geo
3. **Pass**: All players see mode change, timeLimit updates

### TC-MP-24: Guess at exact timer=0
1. Player submits guess at exactly timer=0
2. **Pass**: Guess accepted (2s grace period), score calculated

### TC-MP-25: Pano load failure mid-game
1. 3-player room, round starts
2. Panorama fails to load (simulate with invalid panoId)
3. **Pass**: Failure overlay shown, host can skip round (0 points)

## 15 Mobile UI/UX Test Cases

### TC-MUI-01: iPhone notch safe area
- Open game on iPhone 14 Pro
- **Pass**: Header fully below notch, no content hidden

### TC-MUI-02: iPhone home indicator safe area
- Open game, check bottom action bar
- **Pass**: Submit button fully above home indicator area

### TC-MUI-03: Submit button tap target
- Open game on mobile, try to tap submit
- **Pass**: Button height >= 44px, responsive to first tap

### TC-MUI-04: Mini map expand/collapse on mobile
- Tap mini map to expand, place pin, collapse
- **Pass**: Smooth animation, pin placement works, collapses to corner

### TC-MUI-05: Map + action bar overlap
- Expand map on mobile
- **Pass**: Map and action bar don't overlap, pin placeable everywhere

### TC-MUI-06: Portrait to landscape transition
- Start game in portrait, rotate to landscape
- **Pass**: Layout adapts, all elements visible, game continues

### TC-MUI-07: Keyboard overlay on menu screen
- Tap "Oyuncu Adı" input
- **Pass**: Input scrolls into view above keyboard

### TC-MUI-08: Double-tap zoom prevention
- Double-tap on Street View area
- **Pass**: No page zoom, Street View handles tap normally

### TC-MUI-09: Pull-to-refresh prevention
- Swipe down on Street View
- **Pass**: No page refresh, Street View pans normally

### TC-MUI-10: Connection loss banner on mobile
- Enable airplane mode during game
- **Pass**: "Bağlantı yeniden kuruluyor" banner within 5s

### TC-MUI-11: Low-end device performance
- Play on Moto G4 (or Chrome DevTools 4× CPU slowdown)
- **Pass**: Street View pans at 30+ FPS, no visible jank

### TC-MUI-12: Guess submission feedback on mobile
- Place pin and tap submit
- **Pass**: Haptic feedback (vibrate), button changes to "Tahmin Gönderildi"

### TC-MUI-13: Timer visibility on small screen (320px)
- Open game on iPhone SE
- **Pass**: Timer readable, not truncated, correct countdown

### TC-MUI-14: Round-end modal on mobile
- Complete a round on mobile
- **Pass**: Modal fully visible, scrollable if needed, "Next Round" accessible

### TC-MUI-15: Error state recovery on mobile
- Force error (disconnect during guess), then reconnect
- **Pass**: Clear error message, recovery path available (rejoin or return to menu)

## 10 Camera Drift Test Cases

### TC-CD-01: Stationary rotation — 30 seconds
- Load game, do NOT move to another pano
- Drag left/right continuously for 30 seconds
- **Pass**: |finalPitch - initialPitch| < 2°

### TC-CD-02: Stationary rotation — 60 seconds
- Same as TC-CD-01 but 60 seconds
- **Pass**: |finalPitch - initialPitch| < 5°

### TC-CD-03: Pitch direction consistency
- Start at pitch=0, rotate horizontally only
- **Pass**: Pitch never exceeds ±10° without vertical drag

### TC-CD-04: Rapid back-and-forth rotation
- Drag left 90°, right 90°, repeat 20 times
- **Pass**: Pitch stays within ±5° of starting value

### TC-CD-05: Slow single-direction rotation
- Drag slowly left for one full 360° revolution
- **Pass**: Pitch drift < 3°

### TC-CD-06: Vertical drag then horizontal
- Drag up 45°, then drag horizontally only
- **Pass**: Pitch stays at ~45° (no drift back to 0 or up to 90°)

### TC-CD-07: Device-specific — iPhone Safari
- Perform TC-CD-01 on iPhone Safari
- **Pass**: Same criteria as TC-CD-01

### TC-CD-08: Device-specific — Android Chrome
- Perform TC-CD-01 on Android Chrome
- **Pass**: Same criteria as TC-CD-01

### TC-CD-09: After pano navigation and return
- Navigate to another pano, return to start, then rotate 30s
- **Pass**: Pitch restored correctly, no drift

### TC-CD-10: Drift after backgrounding
- Rotate for 10s, background app, return, rotate 10s more
- **Pass**: No sudden pitch jump on resume, drift < 3° total

## 10 Production Smoke Tests

### TC-SMOKE-01: Menu screen loads
- Navigate to turkiyeguessr.xyz
- **Pass**: Menu visible within 3s, no console errors

### TC-SMOKE-02: Create room
- Enter name, click "Yeni Oda Oluştur"
- **Pass**: Room created, 6-char code displayed, lobby visible

### TC-SMOKE-03: Join room
- Enter name + room code, click "Odaya Katıl"
- **Pass**: Joins lobby, sees other players

### TC-SMOKE-04: Start game
- Host clicks start
- **Pass**: Street View panorama loads within 5s

### TC-SMOKE-05: Place guess
- Click on map to place pin
- **Pass**: Red marker appears at clicked location

### TC-SMOKE-06: Submit guess
- Click "Tahmin Yap"
- **Pass**: Button changes to submitted state, "Tahmin Gönderildi" shown

### TC-SMOKE-07: Round ends
- All players guess or timer expires
- **Pass**: Round-end modal appears with scores within 5s

### TC-SMOKE-08: Next round
- Host clicks "Sonraki Tur"
- **Pass**: New panorama loads, timer restarts

### TC-SMOKE-09: Game over
- Complete all rounds
- **Pass**: Game-over screen with final leaderboard

### TC-SMOKE-10: Return to menu
- Click "Ana Menüye Dön" from game-over
- **Pass**: Returns to menu cleanly, can create new room

---

# 13. Codebase Files I Need Next

For deeper analysis, these specific files/modules should be reviewed:

| Priority | File | Reason |
|----------|------|--------|
| P0 | `src/hooks/useRoom.ts` lines 488-863 | Effect 5 full logic — allGuessed detection, host migration trigger |
| P0 | `src/hooks/useRoom.ts` lines 1105-1264 | acquireAndWriteRoundEnd full implementation — lock acquisition, transaction guards |
| P0 | `src/hooks/useRoom.ts` lines 984-1103 | Effect 6 watchdog — stuck round detection and recovery |
| P0 | `src/hooks/useRoom.ts` lines 879-982 | Effect 7 client resync — stale state recovery |
| P1 | `src/hooks/useStreetView.ts` lines 408-540 | showStreetView main function — pano initialization |
| P1 | `src/hooks/useStreetView.ts` lines 905-970 | Visibility/lifecycle handlers — background/foreground |
| P1 | `src/config/production.ts` | All production constants — timing values, limits |
| P1 | `database.rules.json` (if exists) | Firebase security rules — verify constraints |
| P2 | `src/utils/telemetry.ts` | Current telemetry implementation — what's already tracked |
| P2 | `src/utils/rateLimiter.ts` | Rate limiter implementation — verify window logic |
| P2 | `src/components/game/RoundEndModal.tsx` | Round-end UI — verify it handles edge cases |
| P2 | `src/components/game/PlayersSidebar.tsx` | Player list — verify disconnect state display |

---

*End of Launch Readiness Audit*
*Generated: 2026-02-24*
