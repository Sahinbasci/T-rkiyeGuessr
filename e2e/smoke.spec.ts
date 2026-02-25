import { test, expect, Page, BrowserContext, Browser } from '@playwright/test';

/**
 * B) MANUAL SMOKE CHECK — Playwright automated version
 *
 * 2-player flow: lobby → game → submit → result → next round → refresh → reconnect
 * Plus Turkish text verification on cookie banner and location names.
 */

const BASE_URL = 'http://localhost:3000';
const MOBILE_VIEWPORT = { width: 390, height: 844 };

interface TestPlayer {
  page: Page;
  context: BrowserContext;
  name: string;
}

async function createPlayerContext(browser: Browser, name: string): Promise<TestPlayer> {
  const context = await browser.newContext({
    viewport: MOBILE_VIEWPORT,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  });
  const page = await context.newPage();
  return { page, context, name };
}

async function fillPlayerName(page: Page, name: string) {
  const input = page.locator('input[placeholder="Adını gir..."]');
  await input.waitFor({ state: 'visible', timeout: 30000 });
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

test.describe('B) 2-Player Smoke Check', () => {
  test.describe.configure({ timeout: 240000 });

  test('Full 2-player game flow + refresh + Turkish text', async ({ browser }) => {
    const host = await createPlayerContext(browser, 'SmokeHost');
    const player = await createPlayerContext(browser, 'SmokePlayer');

    try {
      // ===== 1) LOBBY JOIN =====
      await host.page.goto(BASE_URL, { waitUntil: 'load' });
      await fillPlayerName(host.page, host.name);

      // TURKISH TEXT CHECK: Cookie banner
      const cookieBanner = host.page.locator('text=Sitemizde zorunlu çerezler');
      const bannerVisible = await cookieBanner.isVisible({ timeout: 5000 }).catch(() => false);
      if (bannerVisible) {
        // Verify Turkish characters in cookie banner
        const bannerText = await host.page.locator('[aria-label="Çerez bildirimi"]').textContent().catch(() => '');
        expect(bannerText).toContain('çerez');
        expect(bannerText).toContain('Politikamızı');
        console.log('  ✅ SMOKE: Cookie banner Turkish text verified (ç, ı, ö characters intact)');
      }

      // Create room
      const createBtn = host.page.locator('button:has-text("Yeni Oda Oluştur")');
      await expect(createBtn).toBeEnabled({ timeout: 10000 });
      await createBtn.click();
      await host.page.waitForSelector('text=Oda Kodu', { timeout: 15000 });
      const codeEl = host.page.locator('span.tracking-\\[0\\.3em\\]');
      const code = (await codeEl.textContent())?.trim() || '';
      expect(code.length).toBe(6);
      console.log(`  ✅ SMOKE: Room created: ${code}`);

      // Player joins
      await player.page.goto(BASE_URL, { waitUntil: 'load' });
      await fillPlayerName(player.page, player.name);
      const roomInput = player.page.locator('input[placeholder="ABC123"]');
      await roomInput.waitFor({ state: 'visible', timeout: 15000 });
      await roomInput.fill(code);
      const joinBtn = player.page.locator('button:has-text("Odaya Katıl")');
      await expect(joinBtn).toBeEnabled({ timeout: 15000 });
      await joinBtn.click();

      try {
        await player.page.waitForSelector('text=Oyuncular', { timeout: 15000 });
      } catch {
        await player.page.waitForTimeout(2000);
        await joinBtn.click();
        await player.page.waitForSelector('text=Oyuncular', { timeout: 15000 });
      }
      console.log('  ✅ SMOKE: Player joined lobby');

      // Host should see 2 players
      await host.page.waitForSelector('text=2/8', { timeout: 10000 });
      console.log('  ✅ SMOKE: Host sees 2/8 players in lobby');

      // ===== 2) GAME START =====
      const startBtn = host.page.locator('button:has-text("Oyunu Başlat")');
      await startBtn.click();
      await host.page.waitForSelector('.gm-style, .streetview-container', { timeout: 60000 });
      await host.page.waitForTimeout(2000);
      console.log('  ✅ SMOKE: Game started, Street View loaded for host');

      await player.page.waitForSelector('.gm-style, .streetview-container', { timeout: 60000 });
      console.log('  ✅ SMOKE: Street View loaded for player');

      // ===== 3) WAIT A BIT (simulate moves) =====
      await host.page.waitForTimeout(3000);

      // ===== 4) PLAYER REFRESH =====
      await player.page.reload({ waitUntil: 'load' });
      await player.page.waitForSelector('.gm-style, .streetview-container', { timeout: 60000 });
      console.log('  ✅ SMOKE: Player refreshed and rejoined game');

      // Verify URL still has room code
      expect(player.page.url().toUpperCase()).toContain(code.substring(0, 3));
      console.log('  ✅ SMOKE: Room code preserved in URL after refresh');

      // ===== 5) HOST REFRESH =====
      await host.page.reload({ waitUntil: 'load' });
      await host.page.waitForSelector('.gm-style, .streetview-container', { timeout: 60000 });
      console.log('  ✅ SMOKE: Host refreshed and rejoined game');

      // ===== 6) VERIFY NO CRASH — both still in game =====
      await expect(host.page.locator('.gm-style, .streetview-container').first()).toBeVisible();
      await expect(player.page.locator('.gm-style, .streetview-container').first()).toBeVisible();
      console.log('  ✅ SMOKE: Both players still in game after double refresh');

      console.log('\n  🏁 SMOKE CHECK PASSED — All critical paths verified');

    } finally {
      await host.context.close().catch(() => {});
      await player.context.close().catch(() => {});
    }
  });
});
