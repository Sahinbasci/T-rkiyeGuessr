# FINAL RELEASE SWEEP — TürkiyeGuessr
**Date**: 2026-02-24
**Sweep Commander**: Claude (Final Pass)
**Baseline**: 259/259 unit PASS | 15/15 E2E PASS | 169/169 build PASS

---

# 1. Executive Verdict

**Current Readiness Score: 7.5/10**

### Already Strongly Verified
- Multiplayer state machine: transaction-guarded start/roundEnd/nextRound/gameOver
- Host migration: deterministic election (lowest joinedAt), transaction-based, E2E tested
- Ghost cleanup: host-only, two-phase (stale heartbeat → disconnect → grace → remove), E2E tested
- Timer: server-timestamp-based, Page Visibility resync, local fallback
- Stuck client recovery: client resync watchdog (non-host) + host watchdog + post-migration recovery
- Camera drift: pure-function fix, 29 unit tests including 60s simulation, integrated into useStreetView
- Security: CSP, HSTS, Permissions-Policy, input sanitization, coordinate validation
- Anti-cheat: console redaction, CSS overlay hiding, MutationObserver for runtime links
- Code quality: TypeScript strict, 259 unit tests, 15 E2E tests

### Top Remaining Risks
1. **NO ERROR MONITORING** — Sentry is not installed. Zero visibility into production errors (P0)
2. **Camera drift untested on real devices** — only unit-tested with simulated data (P0)
3. **Firebase plan/quota unverified** — Spark plan = 100 concurrent connections (P0 for 10K launch)
4. **Google Maps API budget unverified** — $50/day budget = ~7142 calls (P1)
5. **Nothing is deployed** — 44 uncommitted files in git (P0)
6. **No rollback mechanism** — no feature flags to disable multiplayer or drift fix in production (P1)
7. **Telemetry is console-only** — no persistent storage, no dashboards, no alerts (P1)

### Final Recommendation: **GO WITH MITIGATION**

Go with ≤200 concurrent users (soft launch). Full 10K launch requires: Firebase Blaze plan, Google Maps budget verification, real-device camera drift validation, error monitoring, and git commit + deploy.

---

# 2. Proven vs Unproven Matrix

| Area | Status | Evidence | Why It Matters | Still Needs Validation | Priority |
|------|--------|----------|---------------|----------------------|----------|
| Multiplayer sync | **Proven** | 15/15 E2E, roundEndLock transaction, host-only elector | Core gameplay | Real-network jitter (3G, packet loss) | P2 |
| Host migration | **Proven** | E2E `host-disconnect-migration.spec`, transaction-based | Game continues if host leaves | 6-player room + host leaves mid-roundEnd write | P2 |
| Disconnect/reconnect | **Proven** | E2E `disconnect-rejoin`, sessionToken rejoin, onDisconnect | Player doesn't lose progress | Tab close + reopen within 15s grace | P2 |
| Ghost cleanup | **Proven** | E2E `ghost-cleanup`, host-only CLEANUP_INTERVAL=10s | Dead players don't block roundEnd | No ghosts in waiting status (cleanup runs in ALL statuses ✓) | P2 |
| Timer/round transitions | **Proven** | E2E `timer-roundend-sync`, server-timestamp, watchdog | Rounds don't get stuck | Clock skew >2s between client/server | P2 |
| Mobile UI layout | **Partially** | CSS responsive fixes (320px, landscape), safe-area | Playable on all phones | Real iPhone SE, Galaxy S21 visual test | P1 |
| Camera drift | **Partially** | 29 unit tests, simulation pass | Camera doesn't drift to sky | **Real-device 60s rotation test** | P0 |
| Google Maps interaction | **Unproven** | Headless can't fully exercise Maps | Markers, pano loading, touch | Real-device marker placement, pano transitions | P0 |
| Firebase auth timing | **Partially** | getAuthUid() awaits promise, E2E shows "Join failed, retrying" | Users can join rooms | Auth delay >5s on slow networks | P1 |
| Telemetry emission | **Partially** | 22/22 telemetry test pass, trackEvent calls exist | Bug visibility | Console-only, no persistent store | P1 |
| Sentry/error capture | **Unproven** | **NOT INSTALLED** (not in package.json) | Zero prod error visibility | Install + configure + verify source maps | P0 |
| Production quota/budget | **Unproven** | production.ts has $50/day config but **not enforced** | Cost runaway, service disruption | Firebase plan, Maps quota, billing alerts | P0 |
| Rollback toggles | **Unproven** | FEATURE_FLAGS exist but no runtime toggle | Can't disable features in prod | No admin panel, no env var override mechanism | P1 |
| Feature flags | **Partially** | 4 flags in production.ts, compile-time | Feature control | No runtime override, no A/B test capability | P2 |
| Performance under load | **Unproven** | No load testing done | 1000+ concurrent users | Firebase connection limits, RTDB write throughput | P0 |
| Memory leaks / listener cleanup | **Partially** | All useEffect have cleanup, telemetry tracks listener balance | Long sessions don't degrade | 10+ round session memory profile | P1 |
| Duplicate listeners | **Proven** | trackListener sub/unsub balance check, Effect 5 cleanup | No event spam | StrictMode double-mount (disabled ✓ reactStrictMode:false) | P2 |
| Background/foreground lifecycle | **Partially** | useTimer has visibilitychange handler | Timer correct after tab switch | iOS Safari aggressive backgrounding behavior | P1 |
| Orientation changes | **Unproven** | No orientation change handler in code | Layout doesn't break on rotate | Real-device portrait↔landscape during gameplay | P1 |
| Browser-specific (Safari vs Chrome) | **Unproven** | E2E uses Chromium/WebKit but headless | Touch events, Maps rendering | Real iOS Safari + Android Chrome side-by-side | P1 |

---

# 3. Blind Spot Hunt

### BS-01: Telemetry Console Log Leak in Production
- **Symptom**: `console.log` calls in telemetry.ts lines 107, 157-162, 176, 225-229, 281+ fire unconditionally — NOT gated by FEATURE_FLAGS.ENABLE_DEBUG_LOGS
- **Why missed**: logger.ts was added for other modules but telemetry.ts uses raw console.log/warn/error
- **Detection**: Open DevTools console on production build
- **Test today**: `npm run build && npm start`, open console, play a round, check for [Telemetry] logs
- **Severity**: MEDIUM — leaks internal event names and room IDs in production console
- **Mitigation**: Replace telemetry console.log/warn with logger.debug/warn (or conditional ENABLE_DEBUG_LOGS guard)

### BS-02: Firebase Anonymous Auth Expiry During Long Session
- **Symptom**: Player loses auth after 1 hour+ session, all Firebase writes fail silently
- **Why missed**: E2E tests run <15 minutes, unit tests mock Firebase
- **Detection**: Player sees "Tahmin gönderilemedi" errors after long idle
- **Test today**: Open game, wait 60+ minutes idle, try to submit guess
- **Severity**: HIGH — player appears stuck, no error feedback
- **Mitigation**: Add auth state listener that re-authenticates on token expiry

### BS-03: pov_changed Infinite Loop Risk
- **Symptom**: processPovChange corrects pitch → setPov fires → pov_changed fires → processPovChange called again
- **Why missed**: Unit tests don't exercise the Google Maps event loop
- **Detection**: CPU spike, UI freeze, rapid pitch oscillation
- **Test today**: Real device 60s rotation test (drift-validation.js)
- **Severity**: HIGH — potential UI freeze
- **Mitigation**: The ring buffer sample update in processPovChange should prevent re-trigger (corrected pitch matches anchor, so pDelta=0, no drift detected). Verified in unit test "rapid heading oscillation does not cause false correction". **But real Maps SDK pov_changed behavior may differ from simulation.**

### BS-04: Google Maps API Key Not Domain-Restricted
- **Symptom**: API key usable from any domain → theft → cost runaway
- **Why missed**: This is a Google Cloud Console setting, not in code
- **Detection**: Check Google Cloud Console → APIs & Services → Credentials
- **Test today**: Verify API key has HTTP referrer restriction for turkiyeguessr.xyz
- **Severity**: HIGH — financial risk
- **Mitigation**: Add domain restriction in Google Cloud Console

### BS-05: useStreetView Cleanup Race on Rapid Pano Change
- **Symptom**: User clicks arrow rapidly → showStreetView called multiple times → old listener not cleaned up → stale pov_changed listener accumulates
- **Why missed**: E2E navigation tests may not exercise sub-second pano changes
- **Detection**: After 10+ rapid clicks, multiple pov_changed handlers fire per event
- **Test today**: Profile listener count during rapid navigation clicks
- **Severity**: MEDIUM — potential memory leak over long sessions
- **Mitigation**: cleanupFnRef pattern in useStreetView should handle this (old cleanup runs before new setup). Verify with manual test.

### BS-06: Safari touch-action: none Missing
- **Symptom**: Safari intercepts touch events on Street View → swipe triggers browser back/forward navigation
- **Why missed**: E2E uses headless WebKit, not real Safari with gesture navigation
- **Detection**: On iPhone, horizontal swipe on Street View triggers iOS Safari back gesture
- **Test today**: Test on real iPhone Safari
- **Severity**: HIGH — game becomes unplayable
- **Mitigation**: Verify `.streetview-container { touch-action: none; }` in globals.css

### BS-07: ChunkLoadError on Deploy (Stale Chunks)
- **Symptom**: After deploy, users with cached HTML get 404 on new chunk filenames
- **Why missed**: Only reproducible during deployment, not in tests
- **Detection**: Console error `ChunkLoadError: Loading chunk GameScreen_tsx failed`
- **Test today**: Check if Next.js has chunk hash in filenames (it does by default ✓)
- **Severity**: MEDIUM — affects users who had tab open during deploy
- **Mitigation**: ErrorBoundary exists (ErrorBoundary.tsx) — verify it catches ChunkLoadError and shows "refresh" message

### BS-08: Firebase RTDB Write Size Limit
- **Symptom**: Room data exceeds 10MB limit → all writes fail
- **Why missed**: Unit tests use small data sets
- **Detection**: After many rounds, room node accumulates roundResults, locationHistory
- **Test today**: Calculate max room size: 8 players × 10 rounds × (roundResults + playerData)
- **Severity**: LOW — unlikely to hit 10MB with 10 rounds
- **Mitigation**: roundResults are overwritten per round (not accumulated). locationHistory capped at 200 entries.

### BS-09: pointerdown/pointerup Mismatch (Touch Cancel)
- **Symptom**: User touches Street View, gets interrupted (notification, call), pointerup never fires → isDragging stays true → drift correction permanently suppressed
- **Why missed**: E2E doesn't simulate phone interruptions
- **Detection**: Drift correction stops working after phone notification
- **Test today**: During rotation, receive a notification/call, resume game, check if drift correction resumes
- **Severity**: MEDIUM — drift correction disabled until next pano change (resetDriftTracker runs on pano change)
- **Mitigation**: Add `pointercancel` event listener that calls markDragEnd, OR add a timeout that auto-resets isDragging after 5 seconds of no pointerup

### BS-10: Rate Limiter State Persists in Module Scope
- **Symptom**: Rate limit counters in utils/rateLimiter.ts or utils/index.ts persist across navigations in SPA
- **Why missed**: Tests isolate each run
- **Detection**: User creates 3 rooms, navigates away, comes back, still rate-limited
- **Test today**: Check rate limiter implementation for timestamp-based windowing
- **Severity**: LOW — timestamps should naturally expire
- **Mitigation**: Verify rate limiter uses time-window (not just counter)

### BS-11: No `pointercancel` Event Handler for Drift Tracker
- **Symptom**: Touch cancelled (e.g., palm rejection, system gesture) → markDragEnd never called → isDragging=true forever for this pano
- **Why missed**: pointercancel is rare in desktop testing, common on mobile
- **Detection**: After palm touch on Street View, drift correction stops
- **Test today**: Add pointercancel handler (code fix)
- **Severity**: MEDIUM
- **Mitigation**: Add `pointercancel` to event listeners alongside pointerup

---

# 4. Final Test Expansion Plan

## A) Automated Tests (Claude Can Add Now)

| ID | Type | Goal | File | Expected | Priority |
|----|------|------|------|----------|----------|
| AT-01 | Unit | Verify pointercancel resets isDragging | cameraDrift.test.ts | markDragEnd on cancel restores drift detection | P1 |
| AT-02 | Unit | Verify telemetry event schema completeness | telemetry.test.ts | All trackEvent calls include roomId/roundId/playerId | P2 |
| AT-03 | Unit | Verify feature flag defaults for production | production.test.ts (NEW) | ENABLE_DEBUG_LOGS=false, ENABLE_ANALYTICS=true in prod | P1 |
| AT-04 | Unit | Verify drift correction doesn't loop (setPov→pov_changed cycle) | cameraDrift.test.ts | After correction, next processPovChange with corrected pitch returns null | P1 |
| AT-05 | Unit | Verify ring buffer doesn't grow past DRIFT_WINDOW_SIZE | cameraDrift.test.ts | After 100 samples, buffer stays at 60 | P2 |

## B) Manual Tests (Real Devices)

| ID | Type | Goal | Steps | Expected | Priority |
|----|------|------|-------|----------|----------|
| MT-01 | Manual | Camera drift on iPhone Safari | Open game → start round → rotate horizontally 60s | Pitch stays within 5° of start | P0 |
| MT-02 | Manual | Camera drift on Android Chrome | Same as MT-01 | Same | P0 |
| MT-03 | Manual | Pano transition during rotation | While rotating, click navigation arrow | No pitch jump, smooth transition | P1 |
| MT-04 | Manual | Background→foreground mid-round | Start round → switch to other app for 30s → return | Timer correct, pano visible, can submit | P1 |
| MT-05 | Manual | Orientation change mid-round | Play in portrait → rotate to landscape → back | Layout adjusts, no overlap, Street View fills | P1 |
| MT-06 | Manual | Guess submit at timer=1 | Wait until 1 second left → tap submit | Either accepted or "Süre doldu" (no crash) | P1 |
| MT-07 | Manual | Host leaves mid-round | 3 players, host closes tab during round | New host elected, round continues or finishes | P1 |
| MT-08 | Manual | Long session (10+ rounds) | Play 10+ rounds without page refresh | No memory degradation, no listener leak, game responsive | P1 |
| MT-09 | Manual | Slow network multiplayer | Use Chrome DevTools throttle to Slow 3G | Join works (retry), guess submits, timer syncs | P1 |
| MT-10 | Manual | iPhone Safari swipe gesture | Swipe horizontally on Street View | No browser back navigation triggered | P1 |

## C) Staging/Production Checks

| ID | Type | Goal | Steps | Expected | Priority |
|----|------|------|-------|----------|----------|
| SC-01 | Staging | Console clean in production build | npm run build && npm start → open DevTools console | No [REDACTED]-less location logs, minimal telemetry noise | P1 |
| SC-02 | Staging | Security headers present | curl -I https://turkiyeguessr.xyz | HSTS, CSP, X-Frame-Options present | P1 |
| SC-03 | Staging | 404 page works | Visit /asdfasdf | Turkish 404 page renders | P2 |
| SC-04 | Staging | Privacy policy accessible | Visit /gizlilik-politikasi | Page renders with KVKK content | P2 |
| SC-05 | Staging | ErrorBoundary catches chunk errors | Simulate chunk load failure | "Bir hata oluştu" message with refresh button | P2 |

## D) Load/Quota/Infra Checks

| ID | Type | Goal | Steps | Expected | Priority |
|----|------|------|-------|----------|----------|
| LC-01 | Infra | Firebase plan | Check Firebase Console → Usage & Billing | Blaze plan active OR upgrade now | P0 |
| LC-02 | Infra | Firebase concurrent connections | Check Firebase Console → RTDB → Usage | Current: <100 → Plan for 1000+ | P0 |
| LC-03 | Infra | Google Maps API quota | Check Google Cloud Console → APIs → Street View Static API | Daily quota > 10,000 calls | P0 |
| LC-04 | Infra | Google Maps API key restriction | Check Google Cloud Console → Credentials | HTTP referrer restricted to turkiyeguessr.xyz | P0 |
| LC-05 | Infra | Billing alerts | Google Cloud + Firebase billing alerts at $25, $50, $100 | Alerts configured | P1 |

---

# 5. Real-Device Validation Scripts

## iPhone Safari Test Script

### Test 1: Camera Drift (60s Rotation)
1. Open turkiyeguessr.xyz on iPhone Safari
2. Start a solo game (any mode)
3. Wait for Street View to fully load
4. Note the starting pitch visually (horizon line position)
5. **Slowly** swipe left-to-right continuously for 60 seconds (horizontal rotation only)
6. Stop and check: is the horizon line still at approximately the same position?
- **PASS**: Horizon hasn't moved significantly (camera still looking roughly level)
- **FAIL**: Camera is pointing at sky or ground
- **Telemetry**: Run `scripts/drift-validation.js` in Safari Web Inspector → maxDeviation should be <5°
- **Severity if failed**: P0 — core gameplay broken on mobile

### Test 2: Pano Transition During Rotation
1. Start a round, begin rotating
2. While still swiping, tap a navigation arrow (forward/backward)
3. Observe: does the new pano load with a reasonable pitch?
- **PASS**: New pano loads at roughly level horizon
- **FAIL**: New pano shows sky/ground, or pitch jumps wildly
- **Severity if failed**: P1

### Test 3: Background App → Foreground Return
1. Start a round, note timer value (e.g., "01:15")
2. Press Home button (or swipe up) to go to another app
3. Wait 30 seconds
4. Return to Safari
- **PASS**: Timer shows ~0:45 (30s less), Street View is visible and interactive
- **FAIL**: Timer shows wrong value, black screen, or "Bağlantı hatası"
- **Severity if failed**: P1

### Test 4: Orientation Change
1. Start a round in portrait mode
2. Rotate phone to landscape
3. Check: does Street View fill the space? Is the header/timer visible?
4. Rotate back to portrait
- **PASS**: Layout adjusts both ways, no overlapping elements
- **FAIL**: UI elements overlap, Street View doesn't resize, minimap disappears
- **Severity if failed**: P1

### Test 5: Guess Submit at Last Second
1. Start a round, wait until timer shows 0:03
2. Quickly tap the map, place a pin, tap "Tahmin Et"
3. Check: is the guess accepted?
- **PASS**: Either "accepted" (score shown in round end) OR "Süre doldu" message (graceful rejection)
- **FAIL**: App freezes, no feedback, or crash
- **Severity if failed**: P1

## Android Chrome Test Script

Repeat all 5 tests above on Android Chrome. Additionally:

### Test 6: Android Chrome Pull-to-Refresh
1. During a round, pull down on the Street View area
2. Check: does the page refresh?
- **PASS**: No refresh (touch events captured by Street View)
- **FAIL**: Page refreshes, losing game state
- **Severity if failed**: P1

### Test 7: Android Back Button
1. During a multiplayer round, press hardware/gesture back button
2. Check: expected behavior
- **PASS**: Shows leave confirmation or does nothing
- **FAIL**: Navigates away from game without confirmation, player appears as ghost
- **Severity if failed**: MEDIUM

---

# 6. Multiplayer Final Edge-Case Matrix

| ID | Scenario | Players | Network | Trigger | Expected | Telemetry | Risk Area | Priority |
|----|----------|---------|---------|---------|----------|-----------|-----------|----------|
| MP-01 | Simultaneous submit | 4 | Good | 2 players submit within 100ms | Both accepted (player-level transaction) | submitGuess ×2 | currentGuesses counter race | P2 |
| MP-02 | Timeout + reconnect race | 3 | Jitter | Player disconnects at timer=0, reconnects at timer+5s | Player marked disconnected, roundEnd processed without them, rejoin sees roundEnd screen | roundEnd trigger=timeUp | Ghost cleanup vs rejoin race | P1 |
| MP-03 | Host leave during roundEnd write | 4 | Good | Host tab close during acquireAndWriteRoundEnd transaction | Transaction may commit or abort. If abort: new host's watchdog triggers roundEnd within 5s | hostMigration, watchdog | roundEndLock stale detection | P1 |
| MP-04 | Host leave during nextRound | 4 | Good | Host clicks "Sonraki Tur" then immediately closes tab | nextRound TX may commit. If not: new host can trigger nextRound | hostMigration | UI shows "waiting for host" | P1 |
| MP-05 | Rejoin with stale room state | 3 | Slow 3G | Player disconnects, reconnects 20s later, room has advanced 1 round | Rejoin success, player sees current round state via onValue | join action=rejoin | Stale closure in reconnect handler | P2 |
| MP-06 | Duplicate "next round" clicks | 4 | Good | Host double-clicks "Sonraki Tur" button | Only 1 round advance (roundVersion guard) | roundStart ×1 | UI double-click prevention | P2 |
| MP-07 | App background near timer=0 | 3 | Good | 1 client backgrounds at timer=2 | Client's visibilitychange fires onTimeUp when foregrounded. Host's timer/watchdog handles roundEnd | timeUp via visibilitychange | Timer resync on foreground | P1 |
| MP-08 | 1 client lagging 5-10s | 4 | Throttled | 1 client on slow network, 3 on fast | Slow client sees delayed state updates, but onValue eventually delivers. No stuck. | clientResync watchdog | Stale snapshot correction | P2 |
| MP-09 | Auth delay on join | 2 | Slow | signInAnonymously takes 5+s | "Join failed, retrying" → retry succeeds after auth ready | join action=join | UX: loading spinner, error message | P1 |
| MP-10 | Repeated join/leave spam | 1 | Good | Player joins, leaves, joins, leaves ×5 in 1 minute | Rate limiter (10 joins/min) blocks after threshold | rateLimitTriggered | Rate limit works correctly | P2 |
| MP-11 | Room close while in game | 4 | Good | Room deleted from Firebase (admin/cleanup) | onValue fires null → "Oda silindi" error shown | Error display | Error handling and UX | P2 |
| MP-12 | Browser refresh during transition | 3 | Good | Player refreshes during roundEnd→playing transition | Rejoin via sessionToken, sees current state | join action=rejoin | Session persistence | P2 |

---

# 7. Camera Drift Final Verification

## A) What the 29 Tests Prove
- `clampPitch`: NaN, Infinity, bounds enforcement (±80°)
- `needsClamp`: boundary detection
- `headingDelta`: wraparound (0/360), symmetry
- `pitchDelta`: absolute difference
- `processPovChange` hard clamp: out-of-bounds corrected immediately
- `processPovChange` drift detection: gradual drift during horizontal rotation detected and corrected
- Intentional vertical drag NOT falsely corrected
- Drag suppression during active touch
- Re-anchoring on drag end
- **60-second simulation**: 0.1°/frame drift at 15fps → uncorrected would reach 90°, corrected stays <5°
- **Non-zero anchor simulation**: starting pitch=45° with 0.08°/frame drift → stays within 5° of anchor
- Ring buffer sample update on correction prevents false "intentional movement" classification
- NaN handling, rapid oscillation (no false positives), single-sample graceful handling

## B) What They Do NOT Prove
1. **Real Google Maps pov_changed event timing** — SDK may fire at different rates than simulated
2. **setPov → pov_changed re-entry** — unit tests don't exercise the actual Maps event loop
3. **Touch event timing on real mobile** — pointerdown/pointerup timing differs from simulation
4. **Performance impact** — processPovChange runs on every pov_changed (60fps hot path). Object spread `[...state.samples]` creates new array every frame
5. **Multi-finger touch** — pinch-to-zoom may trigger unexpected pitch changes
6. **Safari passive touch behavior** — Safari may throttle or defer touch events differently

## C) Real-Device Confidence Criteria
- [ ] iPhone Safari: 60s horizontal rotation → maxDeviation <5° (drift-validation.js)
- [ ] Android Chrome: same test → maxDeviation <5°
- [ ] Intentional vertical drag still works (can look up/down)
- [ ] No visible jitter or stuttering during rotation
- [ ] Pano change resets drift tracker (no accumulated state from previous pano)
- [ ] Phone notification mid-rotation doesn't permanently disable correction

## D) Telemetry Thresholds for Drift Regression
- `correctionCount > 0` during horizontal rotation → drift fix is active
- `maxDeviation < 5°` over 60 seconds → fix is effective
- If `maxDeviation > 15°` → drift fix has regressed, investigate
- If `correctionCount = 0` after 30s rotation → drift detection not triggering (threshold tuning needed)

## E) Fallback Plan if Drift Still Appears
1. **Increase correction aggressiveness**: Lower `DRIFT_CORRECTION_THRESHOLD_DEG` from 2.0 to 1.0
2. **Increase detection sensitivity**: Lower `DRIFT_THRESHOLD_DEG` from 0.15 to 0.10, heading threshold from 0.3 to 0.1
3. **Nuclear option**: Hard-clamp pitch to ±10° of anchor on every pov_changed (aggressive but guaranteed)
4. **Feature flag**: Add `ENABLE_DRIFT_CORRECTION` flag to production.ts, default true, allows runtime disable if correction causes problems

---

# 8. Observability & Telemetry Verification

## Current State: Console-Only Telemetry (No Persistent Store)

| Event | Required Fields | Emission Point | Validation | Dashboard Panel | Priority |
|-------|----------------|----------------|------------|-----------------|----------|
| join | roomId, playerId, action (create/join/rejoin), gameMode | useRoom.createRoom/joinRoom | telemetry.test.ts | "Active Players" | P1 |
| leave | roomId | useRoom.leaveRoom | telemetry.test.ts | "Player Churn" | P2 |
| roundStart | roundId, panoPackageId | useRoom.startGameWithPanoPackage | telemetry.test.ts | "Rounds Started" | P1 |
| roundEnd | roundId, trigger | acquireAndWriteRoundEnd | telemetry.test.ts | "Round Completion" | P1 |
| submitGuess | roundId, lat, lng | useRoom.submitGuess | telemetry.test.ts | "Guesses/Round" | P2 |
| timeUp | (implicit via roundEnd trigger) | handleTimeUp | telemetry.test.ts | — | P2 |
| error | message, stack, context | trackError | telemetry.test.ts | "Error Rate" | P0 |
| desyncDetected | — | — (exists in type but NOT emitted) | **MISSING** | "Desync Rate" | P1 |

### Critical Gaps
1. **Sentry NOT installed** — `package.json` has no @sentry dependency. `FEATURE_FLAGS.ENABLE_ERROR_REPORTING` is true in prod but there's no error reporting implementation
2. **Telemetry is console-only** — `trackEvent` writes to `console.log`, not to any backend
3. **`desyncDetected` event type exists but is never emitted** — dead code
4. **Telemetry console.log not gated** — Lines 107, 157, 176, 225 in telemetry.ts use raw console.log (not logger.debug)
5. **No launch-day dashboard** — no way to monitor player count, error rate, room creation rate

### Minimum Viable Monitoring for Launch
Without Sentry, the **minimum** is:
- Firebase RTDB console to watch room count
- Google Cloud Console for Maps API usage
- Browser DevTools on a test device running alongside real users

---

# 9. Infrastructure / Quota / Config Readiness

| Item | Required State | How to Verify | What If Wrong | Priority | Owner |
|------|---------------|---------------|---------------|----------|-------|
| Firebase plan | **Blaze (pay-as-you-go)** | Firebase Console → Usage & Billing | Spark plan = 100 concurrent connections → instant failure at scale | P0 | Product |
| RTDB concurrent connections | ≥1000 for launch | Firebase Console → RTDB → Usage tab | Default Blaze = 200K max, but cost increases with connections | P0 | Product |
| RTDB read/write rate | Monitor in Firebase Console | Real-time monitoring during launch | Throttling → slow/failed game updates | P1 | Product |
| Firebase billing alerts | Set at $10, $25, $50 thresholds | Firebase Console → Billing → Budgets | Surprise bill | P1 | Product |
| Google Maps API daily quota | ≥10,000 Street View calls | Google Cloud Console → APIs → Quotas | Quota exceeded → black Street View, game unplayable | P0 | Product |
| Google Maps API key restriction | HTTP referrer = turkiyeguessr.xyz | Google Cloud Console → Credentials → API key | Key theft → cost runaway | P0 | Product |
| Google Maps billing alerts | Set at $25, $50 | Google Cloud Console → Billing → Budgets | Surprise bill (SV = $0.007/call, 10K calls = $70) | P1 | Product |
| Production env vars | All 8 NEXT_PUBLIC_FIREBASE_* + GOOGLE_MAPS_API_KEY set | Hosting platform env vars page | Missing vars → Firebase/Maps don't initialize | P0 | Product |
| Feature flag defaults | ENABLE_DEBUG_LOGS=false in prod | production.ts line 116: `process.env.NODE_ENV !== "production"` ✓ | Debug logs leak to user console | P1 | Verified ✓ |
| CDN/cache config | Static pages cached (86400s), dynamic not | next.config.js headers ✓ | Stale content after deploy | P2 | Verified ✓ |
| CORS/security | CSP configured for Maps, Firebase, Fonts | next.config.js headers ✓ | Blocked resources | P2 | Verified ✓ |
| Deployment rollback | Hosting platform supports instant rollback | Check Vercel/Netlify dashboard | Can't revert if deploy breaks prod | P1 | Product |

---

# 10. Final Release Gate (Hard Checklist)

```
CODE & TESTS
[ ] 259/259 unit tests PASS                          ✅ Verified
[ ] 15/15 E2E tests PASS                             ✅ Verified (previous run)
[ ] 169/169 build pages compile                      ✅ Verified
[ ] TypeScript compiles with no errors               ✅ (build passes)
[ ] All changes committed to git                     ❌ 44 files uncommitted
[ ] Changes deployed to production                   ❌ Not deployed

REAL-DEVICE VALIDATION
[ ] iPhone Safari: 60s drift test PASS               ❌ Not done
[ ] Android Chrome: 60s drift test PASS              ❌ Not done
[ ] iPhone Safari: no browser gesture interference   ❌ Not done
[ ] Both devices: pano transition smooth             ❌ Not done
[ ] Both devices: orientation change handled          ❌ Not done

MULTIPLAYER VALIDATION
[ ] 4-player real game completes 5 rounds            ❌ Not done
[ ] Host disconnect: migration works on real devices  ❌ Not done (E2E only)
[ ] Disconnect/reconnect: rejoin works               ❌ Not done (E2E only)

TELEMETRY & MONITORING
[ ] Sentry installed and error capture verified       ❌ NOT INSTALLED
[ ] Production console clean (no debug logs)          ❌ Telemetry leaks
[ ] Error tracking live and alerting                  ❌ No alerts
[ ] Launch-day dashboard ready                        ❌ No dashboard

INFRASTRUCTURE
[ ] Firebase plan = Blaze                             ❓ Unverified
[ ] Firebase concurrent connection limit adequate     ❓ Unverified
[ ] Google Maps API quota adequate                    ❓ Unverified
[ ] Google Maps API key domain-restricted             ❓ Unverified
[ ] Billing alerts configured                         ❓ Unverified
[ ] All production env vars correct                   ❓ Unverified

ROLLBACK READINESS
[ ] Previous working deploy exists                    ❓ Unverified
[ ] Feature flag to disable drift correction           ❌ Not implemented
[ ] Can disable multiplayer mode if needed            ❌ No toggle
[ ] On-call person identified for launch              ❓ Unverified
```

**Gate Result: 5/25 passed, 10 unverified, 10 not done**

---

# 11. Rollback / Fallback / Mitigation Plan

## If Something Goes Wrong After Launch

### Blast Radius Reduction (Ordered by Safety)
1. **Disable dynamic pano generation** → Set `ENABLE_DYNAMIC_PANO_GENERATION: false` → falls back to static 150+ pano pool → reduces Maps API costs to near zero
2. **Reduce room capacity** → Change `MAX_PLAYERS_PER_ROOM` from 8 to 4 → reduces Firebase write pressure
3. **Reduce max rooms** → Change `MAX_ACTIVE_ROOMS` from 1000 to 100 → hard cap on concurrent load
4. **Full rollback** → Redeploy previous version via hosting platform

### 15-Minute Emergency Response Sequence
```
T+0:  Detect issue (user reports, console errors, Firebase spike)
T+1:  Identify category: (a) UI broken (b) multiplayer stuck (c) cost spike (d) total outage
T+3:  For (a): Check deployment, redeploy if needed
       For (b): Check Firebase RTDB for stuck rooms, manually delete if needed
       For (c): Google Cloud Console → disable API key temporarily
       For (d): Full rollback to previous deploy
T+5:  Communicate to users (if social media page exists)
T+10: If mitigation failed, full rollback
T+15: Post-mortem: collect Firebase logs, browser console, user reports
```

### Evidence Collection
- Firebase RTDB → Export room data for stuck rooms
- Browser DevTools → Console errors, network failures
- Google Cloud → API usage graphs, error rates
- User reports → Screenshot, device model, OS version, browser

---

# 12. Final Command Plan (Tonight → Tomorrow Launch)

| Time | Owner | Task | Output | Exit Criteria | Risk if Skipped |
|------|-------|------|--------|---------------|-----------------|
| T-12h | Claude | Add pointercancel handler to drift tracker | Code + test | Test passes | Drift correction disabled after phone interrupts |
| T-12h | Claude | Fix telemetry console.log leak (gate with ENABLE_DEBUG_LOGS) | Code | No [Telemetry] logs in production build console | Internal info leaked to users |
| T-12h | Claude | Git commit all 44 pending files | Single commit | `git status` clean | Nothing deployed |
| T-11h | Product | Verify Firebase plan is Blaze | Screenshot | Blaze confirmed | 100 user cap |
| T-11h | Product | Verify Google Maps API quota + key restriction | Screenshot | Quota ≥10K, key restricted | Cost runaway |
| T-11h | Product | Set billing alerts ($10, $25, $50) | Configured | Alerts active | Surprise bill |
| T-10h | Product | Deploy to production | Live URL working | turkiyeguessr.xyz loads, game playable | Not launched |
| T-9h | QA | iPhone Safari: 5 real-device tests (Section 5) | Pass/fail for each | All 5 pass | Camera drift, gesture issues undetected |
| T-9h | QA | Android Chrome: 6 real-device tests (Section 5) | Pass/fail for each | All 6 pass | Same |
| T-8h | QA | 4-player multiplayer test (real devices) | 5 rounds complete | All rounds finish, scores correct | MP bugs in production |
| T-7h | Product | Verify production console clean | DevTools screenshot | No location names, minimal logs | Anti-cheat leak |
| T-6h | Product | Verify security headers | curl output | HSTS, CSP present | Security gap |
| T-4h | All | Final GO/NO-GO decision | Decision | All P0 items passed | — |
| T+0 | Product | Launch (small social media post) | 50-200 users | Monitoring active | — |
| T+30m | Product | First 30-min monitoring | Firebase usage, error rate | No anomalies | Issues undetected |
| T+2h | Product | If stable: expand promotion | 500+ users | No issues in first wave | — |

---

# 13. What Claude Should Still Add/Run Now

### 1. Add `pointercancel` Handler (Prevents BS-09)
**File**: `src/hooks/useStreetView.ts`
**Change**: Add `pointercancel` event listener alongside `pointerup` that calls `markDragEnd`
**Test**: Add unit test in `cameraDrift.test.ts` verifying markDragEnd from cancelled state
**Bug prevented**: isDragging stuck at true after phone interruption

### 2. Fix Telemetry Console Leak (Prevents BS-01)
**File**: `src/utils/telemetry.ts`
**Change**: Replace `console.log(...)` with `if (FEATURE_FLAGS.ENABLE_DEBUG_LOGS) console.log(...)` on lines 107, 157-162, 176
**Bug prevented**: Internal event names and room IDs visible in production console

### 3. Add Drift Correction Loop Prevention Test
**File**: `src/__tests__/cameraDrift.test.ts`
**Test name**: "correction does not re-trigger on corrected pitch"
**Steps**: After processPovChange returns correctedPitch, feed that pitch back as next input → expect no correction
**Bug prevented**: Infinite setPov→pov_changed→setPov loop

### 4. Add Feature Flag Defaults Test
**File**: `src/__tests__/production.test.ts` (NEW)
**Tests**:
- ENABLE_DEBUG_LOGS defaults to false in production NODE_ENV
- ENABLE_ANALYTICS defaults to true in production NODE_ENV
- PITCH_MAX = 80, PITCH_MIN = -80
- MAX_PLAYERS_PER_ROOM = 8
**Bug prevented**: Config drift between environments

### 5. Run Full Test Suite After Patches
**Command**: `npx vitest run && npm run build`
**Expected**: All tests pass, build succeeds
**Bug prevented**: Regression from patches

---

# 14. Final Deliverables

| # | Deliverable | Status | File |
|---|------------|--------|------|
| 1 | Camera drift pure-function fix | ✅ Complete | src/utils/cameraDrift.ts |
| 2 | Camera drift unit tests (29) | ✅ Complete | src/__tests__/cameraDrift.test.ts |
| 3 | Camera drift integration (5 patches) | ✅ Complete | src/hooks/useStreetView.ts |
| 4 | Manual drift validation script | ✅ Complete | scripts/drift-validation.js |
| 5 | This final release sweep document | ✅ Complete | FINAL_RELEASE_SWEEP.md |
| 6 | pointercancel handler | ⏳ TODO | src/hooks/useStreetView.ts |
| 7 | Telemetry console leak fix | ⏳ TODO | src/utils/telemetry.ts |
| 8 | Drift loop prevention test | ⏳ TODO | src/__tests__/cameraDrift.test.ts |
| 9 | Feature flag defaults test | ⏳ TODO | src/__tests__/production.test.ts |
| 10 | Git commit + deploy | ⏳ TODO | — |
| 11 | Real-device validation results | ⏳ TODO (Manual) | — |
| 12 | Infrastructure verification | ⏳ TODO (Manual) | — |

---

## FINAL ONE-LINE VERDICT

**GO WITH MITIGATION** — Code is solid (259 tests, transaction-guarded multiplayer, drift fix), but launch requires: (1) Firebase Blaze plan verified, (2) Google Maps quota verified, (3) real-device camera drift validation passed, (4) git commit + deploy, (5) telemetry console leak fixed. Soft launch to ≤200 users first, scale to 10K after 1 week of stability data.
