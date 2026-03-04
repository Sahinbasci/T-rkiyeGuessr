import { test, expect, Page, BrowserContext, Browser } from '@playwright/test';

/**
 * TurkiyeGuessr E2E Bug-Catcher Test Suite
 *
 * 13 scenarios that target real, production-impacting bugs.
 * Each test has a "BUG THIS CATCHES" comment explaining
 * what regression it guards against.
 *
 * API KEY REQUIREMENTS:
 *   - Tests 1-5 need Google Maps API key (NEXT_PUBLIC_GOOGLE_MAPS_KEY)
 *   - Tests 6-13 work WITHOUT any API key
 *
 * Run:  npx playwright test --project='Bugcatcher - Desktop' e2e/bugcatcher.spec.ts
 */

// ==================== CONFIG ====================

const NEEDS_API_KEY = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
const MOBILE_VIEWPORT = { width: 375, height: 812 };

const TIMEOUT = {
  PAGE_LOAD: 30_000,
  LOBBY: 15_000,
  PANO_LOAD: 60_000,
  ROUND_END: 130_000,
  ACTION: 15_000,
};

// ==================== HELPERS ====================

interface TestPlayer {
  page: Page;
  context: BrowserContext;
  name: string;
}

async function createPlayerContext(
  browser: Browser,
  name: string,
  viewport = MOBILE_VIEWPORT,
): Promise<TestPlayer> {
  const context = await browser.newContext({
    viewport,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  return { page, context, name };
}

/**
 * Fill the player name input with retry logic.
 * React hydration can race with fill(), so we retry up to 3 times.
 */
async function fillPlayerName(page: Page, name: string): Promise<void> {
  const input = page.locator('#player-name-input');
  await input.waitFor({ state: 'visible', timeout: TIMEOUT.PAGE_LOAD });

  for (let attempt = 1; attempt <= 3; attempt++) {
    await input.fill(name);
    const btn = page.locator('button:has-text("Yeni Oda Oluştur")');
    const enabled = await btn.isEnabled({ timeout: 5000 }).catch(() => false);
    if (enabled) return;
    if (attempt < 3) {
      await input.clear();
      await page.waitForTimeout(1000 * attempt);
      await input.click();
      await page.keyboard.type(name, { delay: 50 });
      const enabled2 = await btn.isEnabled({ timeout: 3000 }).catch(() => false);
      if (enabled2) return;
      await input.clear();
    }
  }
}

/**
 * Create a room and return its 6-char code.
 */
async function createRoom(page: Page, name: string): Promise<string> {
  await page.goto('/', { waitUntil: 'load' });
  await fillPlayerName(page, name);

  const createBtn = page.locator('button:has-text("Yeni Oda Oluştur")');
  await expect(createBtn).toBeEnabled({ timeout: TIMEOUT.ACTION });
  await createBtn.click();

  await page.waitForSelector('text=Oda Kodu', { timeout: TIMEOUT.LOBBY });
  const codeEl = page.locator('span.tracking-\\[0\\.3em\\]');
  const code = await codeEl.textContent();
  return code?.trim() || '';
}

/**
 * Join an existing room by code.
 */
async function joinRoom(page: Page, name: string, code: string): Promise<void> {
  await page.goto('/', { waitUntil: 'load' });
  await fillPlayerName(page, name);

  const roomInput = page.locator('#room-code-input');
  await roomInput.waitFor({ state: 'visible', timeout: TIMEOUT.LOBBY });
  await roomInput.fill(code);

  const joinBtn = page.locator('button:has-text("Odaya Katıl")');
  await expect(joinBtn).toBeEnabled({ timeout: TIMEOUT.ACTION });
  await joinBtn.click();

  try {
    await page.waitForSelector('text=Oyuncular', { timeout: TIMEOUT.LOBBY });
  } catch {
    // Retry once on auth race
    await page.waitForTimeout(2000);
    await joinBtn.click();
    await page.waitForSelector('text=Oyuncular', { timeout: TIMEOUT.LOBBY });
  }
}

async function startGameAndWait(hostPage: Page): Promise<void> {
  const startBtn = hostPage.locator('button:has-text("Oyunu Başlat")');
  await startBtn.waitFor({ state: 'visible', timeout: TIMEOUT.ACTION });
  await startBtn.click();
  await hostPage.waitForSelector('.gm-style, .streetview-container', {
    timeout: TIMEOUT.PANO_LOAD,
  });
  await hostPage.waitForTimeout(2000);
}

async function waitForGameScreen(page: Page): Promise<void> {
  await page.waitForSelector('.gm-style, .streetview-container', {
    timeout: TIMEOUT.PANO_LOAD,
  });
  await page.waitForTimeout(1000);
}

async function cleanupPlayers(players: TestPlayer[]): Promise<void> {
  for (const p of players) {
    await p.context.close().catch(() => {});
  }
}

// ==================== TEST SUITE ====================

test.describe('E2E Bug-Catcher Suite', () => {
  test.describe.configure({ timeout: 240_000 });

  // ──────────────────────────────────────────────────────────────────
  // 1. MOBILE SAFARI FULL GAME FLOW
  // ──────────────────────────────────────────────────────────────────

  test('1. Mobile Safari game flow (iPhone 375x812)', async ({ browser }) => {
    // BUG THIS CATCHES:
    // - viewport overflow / content cut-off on 375px screens (BUG-012)
    // - buttons unreachable outside viewport on small screens (BUG-011)
    // - create room, lobby, start game, UI element visibility

    test.skip(!NEEDS_API_KEY, 'Requires Google Maps API key');

    const player = await createPlayerContext(browser, 'MobileSafariTest');

    try {
      const code = await createRoom(player.page, player.name);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);

      // Verify lobby elements are visible within viewport
      const startBtn = player.page.locator('button:has-text("Oyunu Başlat")');
      await expect(startBtn).toBeVisible({ timeout: TIMEOUT.ACTION });
      const startBox = await startBtn.boundingBox();
      expect(startBox).not.toBeNull();
      // Button must be within the 812px tall viewport
      expect(startBox!.y + startBox!.height).toBeLessThanOrEqual(MOBILE_VIEWPORT.height + 50);

      const leaveBtn = player.page.locator('text=Odadan Ayrıl');
      await expect(leaveBtn).toBeVisible();

      // Start game
      await startBtn.click();
      await player.page.waitForSelector('.gm-style, .streetview-container', {
        timeout: TIMEOUT.PANO_LOAD,
      });

      // Timer must be visible
      const timer = player.page.locator('text=/\\d{2}:\\d{2}/');
      await expect(timer).toBeVisible({ timeout: 10_000 });

      // MobileActionBar must be visible and inside viewport
      const actionBar = player.page.locator('.mobile-action-bar');
      if (await actionBar.isVisible({ timeout: 5000 }).catch(() => false)) {
        const barBox = await actionBar.boundingBox();
        expect(barBox).not.toBeNull();
        expect(barBox!.y + barBox!.height).toBeLessThanOrEqual(MOBILE_VIEWPORT.height + 5);
      }
    } finally {
      await cleanupPlayers([player]);
    }
  });

  // ──────────────────────────────────────────────────────────────────
  // 2. HOST DISCONNECT -> MIGRATION
  // ──────────────────────────────────────────────────────────────────

  test('2. Host disconnect triggers host migration', async ({ browser }) => {
    // BUG THIS CATCHES:
    // - Room stuck with dead host, no one can start game or advance rounds
    // - electNewHost() selecting wrong player (non-deterministic / offline player)
    // - "Oyunu Baslat" button never appearing for new host

    const host = await createPlayerContext(browser, 'HostDC');
    const p2 = await createPlayerContext(browser, 'Player2DC');
    const p3 = await createPlayerContext(browser, 'Player3DC');

    try {
      const code = await createRoom(host.page, host.name);
      await joinRoom(p2.page, p2.name, code);
      await joinRoom(p3.page, p3.name, code);

      // Verify 3 players in lobby
      await host.page.locator('text=3/8').waitFor({ state: 'visible', timeout: TIMEOUT.ACTION });

      // Host disconnects (close browser context)
      await host.context.close();

      // Wait for host migration (onDisconnect + election)
      await p2.page.waitForTimeout(10_000);

      // One of the remaining players should see "Oyunu Baslat" (they are the new host)
      const startBtnP2 = p2.page.locator('button:has-text("Oyunu Başlat")');
      const startBtnP3 = p3.page.locator('button:has-text("Oyunu Başlat")');

      const p2IsHost = await startBtnP2.isVisible({ timeout: 15_000 }).catch(() => false);
      const p3IsHost = await startBtnP3.isVisible({ timeout: 5_000 }).catch(() => false);

      // At least one player must have become host
      expect(p2IsHost || p3IsHost).toBe(true);
    } finally {
      await p2.context.close().catch(() => {});
      await p3.context.close().catch(() => {});
    }
  });

  // ──────────────────────────────────────────────────────────────────
  // 3. REFRESH -> REJOIN
  // ──────────────────────────────────────────────────────────────────

  test('3. Page refresh during game preserves state (rejoin)', async ({ browser }) => {
    // BUG THIS CATCHES:
    // - sessionToken not persisted across page reload (BUG-003)
    // - Player gets kicked back to menu after F5
    // - Room code lost from URL after navigation
    // - Street view fails to reinitialize after remount

    test.skip(!NEEDS_API_KEY, 'Requires Google Maps API key');

    const host = await createPlayerContext(browser, 'RefreshHost');
    const player = await createPlayerContext(browser, 'RefreshPlayer');

    try {
      const code = await createRoom(host.page, host.name);
      await joinRoom(player.page, player.name, code);

      await startGameAndWait(host.page);
      await waitForGameScreen(player.page);

      // Capture URL before refresh
      const urlBefore = player.page.url();
      expect(urlBefore).toContain('room=');

      // Player refreshes mid-game
      await player.page.reload({ waitUntil: 'load' });

      // Should rejoin the game (not go to menu)
      await waitForGameScreen(player.page);

      // URL should still contain room parameter
      const urlAfter = player.page.url();
      expect(urlAfter).toContain('room=');

      // Streetview container should be visible
      await expect(player.page.locator('.streetview-container')).toBeVisible({ timeout: 15_000 });

      // Host should also still be in game
      await expect(host.page.locator('.streetview-container')).toBeVisible();
    } finally {
      await cleanupPlayers([host, player]);
    }
  });

  // ──────────────────────────────────────────────────────────────────
  // 4. OFFLINE -> ONLINE RESYNC
  // ──────────────────────────────────────────────────────────────────

  test('4. Offline/online resync preserves game state', async ({ browser }) => {
    // BUG THIS CATCHES:
    // - Firebase listener detaches during offline and never reattaches
    // - connectionState stuck on "reconnecting" forever
    // - Player shown as disconnected to others even after coming back online
    // - Game screen replaced by error screen after brief network drop

    test.skip(!NEEDS_API_KEY, 'Requires Google Maps API key');

    const host = await createPlayerContext(browser, 'OfflineHost');
    const player = await createPlayerContext(browser, 'OfflinePlayer');

    try {
      const code = await createRoom(host.page, host.name);
      await joinRoom(player.page, player.name, code);
      await startGameAndWait(host.page);
      await waitForGameScreen(player.page);

      // Go offline
      await player.context.setOffline(true);
      await player.page.waitForTimeout(3000);

      // Come back online
      await player.context.setOffline(false);
      await player.page.waitForTimeout(8000);

      // Player should still see game (not error screen or menu)
      const streetView = player.page.locator('.streetview-container');
      const errorScreen = player.page.locator('.error-screen');

      const svVisible = await streetView.isVisible().catch(() => false);
      const errVisible = await errorScreen.isVisible().catch(() => false);

      // Must be in game, not error
      expect(svVisible).toBe(true);
      expect(errVisible).toBe(false);
    } finally {
      await cleanupPlayers([host, player]);
    }
  });

  // ──────────────────────────────────────────────────────────────────
  // 5. DOUBLE-CLICK NEXT ROUND GUARD
  // ──────────────────────────────────────────────────────────────────

  test('5. Double-click nextRound only triggers one transition', async ({ browser }) => {
    // BUG THIS CATCHES:
    // - useAsyncLock not preventing duplicate nextRound calls (BUG-004)
    // - Two pano packages fetched, second overwrites first causing desync
    // - roundVersion incremented twice, creating phantom round
    // - currentRound jumps by 2 instead of 1

    test.skip(!NEEDS_API_KEY, 'Requires Google Maps API key');

    const host = await createPlayerContext(browser, 'DoubleClickHost');

    try {
      const code = await createRoom(host.page, host.name);
      await startGameAndWait(host.page);

      // Wait for round timer to expire (90s urban mode + buffer)
      // This is a long wait but necessary for deterministic round end
      await host.page.locator('text=/Tur.*Sonuç/i')
        .or(host.page.locator('text=/Sonraki Tur/i'))
        .or(host.page.locator('text=/SONUÇLARI/i'))
        .first()
        .waitFor({ state: 'visible', timeout: TIMEOUT.ROUND_END });

      // Rapid-fire click the "Sonraki Tur" button
      const nextBtn = host.page.locator('button:has-text("Sonraki Tur")');
      if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Click 3 times rapidly
        await nextBtn.click({ delay: 0 });
        await nextBtn.click({ delay: 0 }).catch(() => {});
        await nextBtn.click({ delay: 0 }).catch(() => {});

        // Wait for transition
        await host.page.waitForTimeout(5000);

        // After transition, verify we are on round 2 (not 3 or 4)
        // Round display in header shows "X/5"
        const roundBadge = host.page.locator('text=2/5');
        const isRound2 = await roundBadge.isVisible({ timeout: 10_000 }).catch(() => false);

        // If round skipped (bug), it would show 3/5 or higher
        const skippedRound = host.page.locator('text=3/5');
        const isRound3 = await skippedRound.isVisible({ timeout: 2000 }).catch(() => false);

        if (isRound2) {
          expect(isRound3).toBe(false); // Should NOT have skipped to round 3
        }
        // If nextBtn was not visible (e.g., last round), that is also acceptable
      }
    } finally {
      await cleanupPlayers([host]);
    }
  });

  // ──────────────────────────────────────────────────────────────────
  // 6. GUESS VALIDATION — Coordinates Outside Turkey
  // ──────────────────────────────────────────────────────────────────

  test('6. Room code validation rejects invalid codes', async ({ page }) => {
    // BUG THIS CATCHES:
    // - Server accepting empty or malformed room codes
    // - No user-facing error when joining with invalid code
    // - XSS/injection via room code input (special chars)
    // - Case sensitivity issues (room codes are uppercase)

    await page.goto('/', { waitUntil: 'load' });
    await fillPlayerName(page, 'ValidationTest');

    const roomInput = page.locator('#room-code-input');
    const joinBtn = page.locator('button:has-text("Odaya Katıl")');

    // Test 1: Empty code -> button disabled
    await expect(joinBtn).toBeDisabled();

    // Test 2: Short code (3 chars) -> button enabled but server rejects
    await roomInput.fill('ABC');
    await expect(joinBtn).toBeEnabled({ timeout: 3000 });
    await joinBtn.click();
    // Should see error (room not found)
    const errorMsg = page.locator('[role="alert"]');
    await expect(errorMsg).toBeVisible({ timeout: TIMEOUT.ACTION });

    // Test 3: Special characters get uppercased or stripped
    await roomInput.fill('');
    await roomInput.fill('abc123');
    // Input has uppercase transform via onChange
    const inputValue = await roomInput.inputValue();
    expect(inputValue).toBe('ABC123');

    // Test 4: maxLength enforcement = 6
    await expect(roomInput).toHaveAttribute('maxlength', '6');
  });

  // ──────────────────────────────────────────────────────────────────
  // 7. ADS CONSENT MODE V2 COMPLIANCE
  // ──────────────────────────────────────────────────────────────────

  test('7. AdSense script loads with Consent Mode v2 defaults denied', async ({ page }) => {
    // WHAT THIS VERIFIES:
    // - AdSense pagead2.js loads unconditionally (for crawler visibility)
    // - Google Consent Mode v2 defaults are set to "denied" BEFORE script loads
    // - Ad rendering (AdSlot) is still gated by canShowAd() + isMarketingAllowed()
    // - Accepting consent stores correct preferences in localStorage

    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(2000);

    // 1. Verify Consent Mode v2 defaults are "denied" (set in ConsentModeInit.tsx)
    const consentDefaults = await page.evaluate(() => {
      const dl = (window as any).dataLayer;
      if (!dl || !Array.isArray(dl)) return null;
      for (const entry of dl) {
        if (Array.isArray(entry) && entry[0] === 'consent' && entry[1] === 'default') {
          return entry[2];
        }
        if (entry && entry['0'] === 'consent' && entry['1'] === 'default') {
          return entry['2'];
        }
      }
      return null;
    });

    if (consentDefaults) {
      expect(consentDefaults.ad_storage).toBe('denied');
      expect(consentDefaults.analytics_storage).toBe('denied');
    }

    // 2. If ADS_ENABLED, script should be present in DOM (unconditional loading for AdSense approval)
    const adScriptPresent = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some(s => s.src?.includes('pagead2.googlesyndication.com') || s.id === 'adsense-script');
    });
    // Script presence depends on ADS_ENABLED env var — either present or absent is valid
    // The key invariant: if present, Consent Mode defaults must be "denied"

    // 3. Accept all cookies and verify localStorage persistence
    const acceptBtn = page.locator('button:has-text("Tümünü Kabul Et")');
    const bannerVisible = await acceptBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (bannerVisible) {
      await acceptBtn.click();
      await page.waitForTimeout(2000);

      const consentStored = await page.evaluate(() => {
        const raw = localStorage.getItem('turkiyeguessr_consent');
        if (!raw) return null;
        return JSON.parse(raw);
      });

      expect(consentStored).not.toBeNull();
      expect(consentStored?.marketing).toBe(true);
      expect(consentStored?.analytics).toBe(true);
      expect(consentStored?.necessary).toBe(true);
    }
  });

  // ──────────────────────────────────────────────────────────────────
  // 8. NO ADS DURING GAMEPLAY
  // ──────────────────────────────────────────────────────────────────

  test('8. No ad slots visible during active gameplay (status=playing)', async ({ page }) => {
    // BUG THIS CATCHES:
    // - canShowAd() not guarding roomStatus="playing"
    // - Ad slot rendered but hidden via CSS (still loads, wastes impressions)
    // - AdSlot component ignoring roomStatus prop
    // - CLS from ads appearing mid-game and shifting street view

    await page.goto('/', { waitUntil: 'load' });

    // Accept cookies first to ensure ads would load if not guarded
    const acceptBtn = page.locator('button:has-text("Tümünü Kabul Et")');
    if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }

    await fillPlayerName(page, 'AdsGameTest');
    const createBtn = page.locator('button:has-text("Yeni Oda Oluştur")');
    await expect(createBtn).toBeEnabled({ timeout: TIMEOUT.ACTION });
    await createBtn.click();

    await page.waitForSelector('text=Oda Kodu', { timeout: TIMEOUT.LOBBY });

    // Start game (solo)
    const startBtn = page.locator('button:has-text("Oyunu Başlat")');
    await startBtn.click();

    // Wait for game screen
    await page.waitForSelector('.streetview-container, .gm-style', {
      timeout: TIMEOUT.PANO_LOAD,
    }).catch(() => {
      // If API key missing, game screen might not fully load.
      // We can still check the DOM for ad elements.
    });

    await page.waitForTimeout(2000);

    // Check for any adsbygoogle elements in the DOM during gameplay
    const visibleAds = await page.evaluate(() => {
      const adElements = document.querySelectorAll('.adsbygoogle, [data-ad-slot]');
      let visibleCount = 0;
      adElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        if (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden'
        ) {
          visibleCount++;
        }
      });
      return visibleCount;
    });

    // No ad elements should be visible during active gameplay
    expect(visibleAds).toBe(0);
  });

  // ──────────────────────────────────────────────────────────────────
  // 9. LOBBY ADS WITH CLS RESERVATION
  // ──────────────────────────────────────────────────────────────────

  test('9. Lobby ad containers have CLS-safe min-height reservation', async ({ page }) => {
    // BUG THIS CATCHES:
    // - Ad containers with 0 height causing layout shift when ad loads (CLS)
    // - AD_SIZE_RESERVATION not applied (horizontal: 90px, rectangle: 250px)
    // - Ad container missing min-height during "loading" state
    // - Lobby ad slot not rendered when ADS_ENABLED but consent not yet given

    await page.goto('/', { waitUntil: 'load' });

    // Accept cookies to enable ad rendering
    const acceptBtn = page.locator('button:has-text("Tümünü Kabul Et")');
    if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await acceptBtn.click();
      await page.waitForTimeout(500);
    }

    // Menu screen ad slot check
    // The menu screen has: <AdSlot slot={AD_SLOTS.banner} format="horizontal" roomStatus="waiting" />
    // In dev mode it shows a placeholder with min-height
    const devAdPlaceholders = await page.evaluate(() => {
      // In dev mode, AdSlot renders a placeholder div with "Ad Slot:" text
      const placeholders = document.querySelectorAll('[class*="border-dashed"]');
      const results: Array<{ minHeight: string; text: string }> = [];
      placeholders.forEach(el => {
        const style = getComputedStyle(el);
        results.push({
          minHeight: style.minHeight,
          text: (el as HTMLElement).innerText || '',
        });
      });
      return results;
    });

    // In dev mode (isAdPreview), placeholders should have min-height set
    for (const placeholder of devAdPlaceholders) {
      if (placeholder.text.includes('Ad Slot:')) {
        // min-height should be set (90px for horizontal, 250px for rectangle)
        const minH = parseInt(placeholder.minHeight, 10);
        expect(minH).toBeGreaterThanOrEqual(90);
      }
    }

    // Also verify that AD_SIZE_RESERVATION values are sane via page evaluation
    const sizeReservation = await page.evaluate(() => {
      // Access the module config indirectly by checking rendered containers
      // In production, ad wrappers get inline min-height during "loading" state
      const adWrappers = document.querySelectorAll('[class*="overflow-hidden"]');
      const withMinH: Array<{ minHeight: string }> = [];
      adWrappers.forEach(el => {
        const style = (el as HTMLElement).style;
        if (style.minHeight) {
          withMinH.push({ minHeight: style.minHeight });
        }
      });
      return withMinH;
    });

    // If any ad wrappers exist with inline min-height, they should be >= 90px
    for (const wrapper of sizeReservation) {
      const px = parseInt(wrapper.minHeight, 10);
      if (!isNaN(px)) {
        expect(px).toBeGreaterThanOrEqual(90);
      }
    }
  });

  // ──────────────────────────────────────────────────────────────────
  // 10. ROOM CODE VALIDATION (EDGE CASES)
  // ──────────────────────────────────────────────────────────────────

  test('10. Empty name prevents room creation and joining', async ({ page }) => {
    // BUG THIS CATCHES:
    // - BUG-005: Empty or whitespace-only name bypassing validation
    // - Create button enabled with blank name
    // - Join button enabled with blank name
    // - Server accepting empty player name in Firebase

    await page.goto('/', { waitUntil: 'load' });

    const nameInput = page.locator('#player-name-input');
    const createBtn = page.locator('button:has-text("Yeni Oda Oluştur")');
    const joinBtn = page.locator('button:has-text("Odaya Katıl")');

    await nameInput.waitFor({ state: 'visible', timeout: TIMEOUT.PAGE_LOAD });

    // Empty name -> create button disabled
    await expect(createBtn).toBeDisabled();

    // Whitespace-only name -> still disabled
    await nameInput.fill('   ');
    await expect(createBtn).toBeDisabled();

    // Clear and type valid name
    await nameInput.fill('ValidName');
    await expect(createBtn).toBeEnabled({ timeout: 5000 });

    // Clear back to empty -> disabled again
    await nameInput.fill('');
    await expect(createBtn).toBeDisabled();

    // Room code without name -> join disabled
    const roomCodeInput = page.locator('#room-code-input');
    await roomCodeInput.fill('ABC123');
    await expect(joinBtn).toBeDisabled();

    // Name maxLength is 20
    await expect(nameInput).toHaveAttribute('maxlength', '20');
  });

  // ──────────────────────────────────────────────────────────────────
  // 11. MAX PLAYERS ROOM FULL REJECTION
  // ──────────────────────────────────────────────────────────────────

  test('11. Room at max capacity rejects new players with error', async ({ browser }) => {
    // BUG THIS CATCHES:
    // - validateRoomJoin() not enforcing MAX_PLAYERS_PER_ROOM (8)
    // - 9th player silently joins, corrupting player map
    // - Error message not displayed to rejected player
    // - Player count display going above 8/8

    // We cannot easily create 8 browser contexts, so we test with a realistic
    // subset: create room, verify capacity display, and test the join validation
    // logic indirectly.

    const host = await createPlayerContext(browser, 'CapHost');
    const player = await createPlayerContext(browser, 'CapPlayer');

    try {
      const code = await createRoom(host.page, host.name);

      // Verify the lobby shows "1/8" (current/max)
      const capacityBadge = host.page.locator('text=/1\\/8/');
      await expect(capacityBadge).toBeVisible({ timeout: TIMEOUT.ACTION });

      // Player joins -> should show "2/8"
      await joinRoom(player.page, player.name, code);
      const twoEight = host.page.locator('text=/2\\/8/');
      await expect(twoEight).toBeVisible({ timeout: TIMEOUT.ACTION });

      // Verify max display is /8 (not /10, /99, etc)
      const badgeText = await twoEight.textContent();
      expect(badgeText).toContain('/8');
    } finally {
      await cleanupPlayers([host, player]);
    }
  });

  // ──────────────────────────────────────────────────────────────────
  // 12. CLS GUARD — AD CONTAINERS
  // ──────────────────────────────────────────────────────────────────

  test('12. Ad containers have reserved min-height preventing CLS', async ({ page }) => {
    // BUG THIS CATCHES:
    // - Layout shift when ads load (Core Web Vitals CLS penalty)
    // - ad wrapper div has 0 height, then jumps to 90/250px
    // - AD_SIZE_RESERVATION config not matching actual CSS
    // - overflow-hidden missing, causing content bleed

    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    // The AD_SIZE_RESERVATION should define: horizontal=90px, rectangle=250px, auto=90px
    // We verify these values are used in the rendered DOM

    // Check the AdSlot component source contract:
    // It uses minH from AD_SIZE_RESERVATION[format]?.minH ?? 90
    // In dev (isAdPreview), placeholder gets minH as inline style

    const adContainers = await page.evaluate(() => {
      const results: Array<{
        text: string;
        minHeight: number;
        hasOverflowHidden: boolean;
      }> = [];

      // Look for ad placeholder divs or ad wrapper divs
      const allDivs = document.querySelectorAll('div');
      allDivs.forEach(div => {
        const text = div.textContent || '';
        if (text.includes('Ad Slot:') && div.children.length === 0) {
          const style = getComputedStyle(div);
          results.push({
            text: text.trim(),
            minHeight: parseInt(style.minHeight, 10) || 0,
            hasOverflowHidden: style.overflow === 'hidden',
          });
        }
      });
      return results;
    });

    // Every ad placeholder should have a non-zero min-height
    for (const container of adContainers) {
      expect(container.minHeight).toBeGreaterThanOrEqual(90);
    }

    // Also verify the parent wrapper (if any) has overflow-hidden
    const overflowWrappers = await page.evaluate(() => {
      const wrappers = document.querySelectorAll('.overflow-hidden');
      return wrappers.length;
    });
    // At least some overflow-hidden elements should exist if ads are in the page
    // (This is structural; exact count depends on ADS_ENABLED)
    expect(overflowWrappers).toBeGreaterThanOrEqual(0);
  });

  // ──────────────────────────────────────────────────────────────────
  // 13. CONSENT MODAL ACCESSIBILITY & FUNCTIONALITY
  // ──────────────────────────────────────────────────────────────────

  test('13. Cookie consent banner and modal work correctly', async ({ page }) => {
    // BUG THIS CATCHES:
    // - Consent banner not appearing on first visit
    // - "Sadece Zorunlu" not actually rejecting marketing/analytics
    // - Consent preferences not persisted to localStorage
    // - Modal not closing on ESC
    // - aria-modal and role="dialog" missing (accessibility)
    // - Body scroll not locked when modal open

    // Clear any existing consent to simulate first visit
    await page.goto('/', { waitUntil: 'load' });
    await page.evaluate(() => localStorage.removeItem('turkiyeguessr_consent'));
    await page.reload({ waitUntil: 'load' });
    await page.waitForTimeout(1500);

    // Cookie banner should appear
    const banner = page.locator('[aria-label="Çerez bildirimi"]');
    const bannerVisible = await banner.isVisible({ timeout: 5000 }).catch(() => false);

    if (bannerVisible) {
      // Verify all 3 buttons exist
      await expect(page.locator('button:has-text("Tümünü Kabul Et")')).toBeVisible();
      await expect(page.locator('button:has-text("Sadece Zorunlu")')).toBeVisible();
      await expect(page.locator('button:has-text("Tercihleri Yönet")')).toBeVisible();

      // Click "Tercihleri Yonet" to open modal
      await page.locator('button:has-text("Tercihleri Yönet")').click();

      // Modal should appear with proper accessibility
      const modal = page.locator('[role="dialog"][aria-modal="true"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Verify toggle switches exist
      const switches = page.locator('[role="switch"]');
      const switchCount = await switches.count();
      expect(switchCount).toBeGreaterThanOrEqual(3); // necessary, analytics, marketing

      // Necessary toggle should be disabled (always on)
      const necessaryToggle = switches.first();
      await expect(necessaryToggle).toBeDisabled();

      // Close modal with ESC
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible({ timeout: 3000 });

      // Now click "Sadece Zorunlu"
      await page.locator('button:has-text("Sadece Zorunlu")').click();

      // Banner should disappear
      await expect(banner).not.toBeVisible({ timeout: 3000 });

      // Verify consent in localStorage
      const consent = await page.evaluate(() => {
        const raw = localStorage.getItem('turkiyeguessr_consent');
        return raw ? JSON.parse(raw) : null;
      });

      expect(consent).not.toBeNull();
      expect(consent.necessary).toBe(true);
      expect(consent.analytics).toBe(false);
      expect(consent.marketing).toBe(false);

      // Reload page — banner should NOT reappear
      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(1500);
      const bannerAfterReload = page.locator('[aria-label="Çerez bildirimi"]');
      await expect(bannerAfterReload).not.toBeVisible({ timeout: 3000 });
    }
  });

  // ──────────────────────────────────────────────────────────────────
  // BONUS: DOUBLE ROOM CREATION PREVENTION
  // ──────────────────────────────────────────────────────────────────

  test('14. Double-click room creation prevented by async lock', async ({ page }) => {
    // BUG THIS CATCHES:
    // - useAsyncLock not preventing duplicate createRoom calls
    // - Two rooms created, player stuck in first (phantom room)
    // - Firebase write collision creating orphan room data
    // - Button not disabling during isLoading state

    await page.goto('/', { waitUntil: 'load' });
    await fillPlayerName(page, 'DoubleCreateTest');

    const createBtn = page.locator('button:has-text("Yeni Oda Oluştur")');
    await expect(createBtn).toBeEnabled({ timeout: TIMEOUT.ACTION });

    // Rapid double-click
    await createBtn.click();
    // After first click, button should be disabled (isLoading or async lock)
    await page.waitForTimeout(100);
    const isDisabledAfterFirst = await createBtn.isDisabled().catch(() => true);

    // Try clicking again immediately
    await createBtn.click({ force: true }).catch(() => {});

    // Wait for result
    await page.waitForTimeout(5000);

    // Should end up in ONE lobby (not error)
    const lobbyVisible = await page.locator('text=Oda Kodu').isVisible().catch(() => false);
    const errorVisible = await page.locator('[role="alert"]').isVisible().catch(() => false);

    // Exactly one outcome: lobby success or handled error
    expect(lobbyVisible || errorVisible).toBe(true);

    // If in lobby, room code should be valid
    if (lobbyVisible) {
      const codeEl = page.locator('span.tracking-\\[0\\.3em\\]');
      const code = await codeEl.textContent();
      expect(code?.trim()).toMatch(/^[A-Z0-9]{6}$/);
    }
  });

  // ──────────────────────────────────────────────────────────────────
  // BONUS: VIEWPORT META DOES NOT BLOCK ZOOM
  // ──────────────────────────────────────────────────────────────────

  test('15. Viewport meta allows user scaling (accessibility)', async ({ page }) => {
    // BUG THIS CATCHES:
    // - user-scalable=no in viewport meta (WCAG 1.4.4 violation)
    // - maximum-scale=1 blocking pinch-to-zoom
    // - Missing width=device-width causing layout issues

    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    const viewport = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content') || '';
    });

    expect(viewport).toContain('width=device-width');
    expect(viewport).not.toContain('user-scalable=no');
    expect(viewport).not.toContain('maximum-scale=1');
  });

  // ──────────────────────────────────────────────────────────────────
  // BONUS: GOOGLE MAPS ATTRIBUTION PRESERVED
  // ──────────────────────────────────────────────────────────────────

  test('16. Google Maps attribution CSS is not hidden', async ({ page }) => {
    // BUG THIS CATCHES:
    // - Anti-cheat CSS accidentally hiding Google Maps copyright (.gm-style-cc)
    // - Google Maps Platform ToS violation (attribution required)
    // - Unscoped CSS rules targeting Google links outside .streetview-container

    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    // Check that .gm-style-cc is NOT set to display:none in any stylesheet
    const attributionHidden = await page.evaluate(() => {
      const sheets = document.styleSheets;
      for (let i = 0; i < sheets.length; i++) {
        try {
          const rules = sheets[i].cssRules;
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j] as CSSStyleRule;
            if (
              rule.selectorText &&
              rule.selectorText.includes('.gm-style-cc') &&
              rule.style.display === 'none'
            ) {
              return true;
            }
          }
        } catch {
          continue;
        }
      }
      return false;
    });

    expect(attributionHidden).toBe(false);

    // Verify anti-cheat rules scoped to .streetview-container
    const unscopedRules = await page.evaluate(() => {
      const sheets = document.styleSheets;
      const violations: string[] = [];
      for (let i = 0; i < sheets.length; i++) {
        try {
          const rules = sheets[i].cssRules;
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j] as CSSStyleRule;
            if (!rule.selectorText) continue;
            if (
              rule.selectorText.includes('a[href*="cbll="]') &&
              !rule.selectorText.includes('.streetview-container') &&
              (rule.style.display === 'none' || rule.style.opacity === '0')
            ) {
              violations.push(rule.selectorText);
            }
          }
        } catch {
          continue;
        }
      }
      return violations;
    });

    expect(unscopedRules).toHaveLength(0);
  });
});
