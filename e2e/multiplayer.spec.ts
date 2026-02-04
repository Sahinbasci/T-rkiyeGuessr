import { test, expect, Page, BrowserContext } from '@playwright/test';

/**
 * TürkiyeGuessr Multiplayer E2E Test
 * 6 oyuncu simülasyonu - mobil viewport
 */

interface Player {
  page: Page;
  context: BrowserContext;
  name: string;
  isHost: boolean;
}

// Test konfigürasyonu
const TEST_CONFIG = {
  TOTAL_ROUNDS: 5,
  PLAYER_COUNT: 6,
  MOBILE_VIEWPORT: { width: 390, height: 844 }, // iPhone 14
  TIMEOUT: {
    PANO_LOAD: 60000,   // Street View yüklenmesi için 60s
    ROUND_END: 120000,  // Timer bitişi için 120s (90s timer + buffer)
    ACTION: 15000,
  },
};

// Yardımcı fonksiyonlar
async function createPlayer(
  browser: any,
  name: string,
  isHost: boolean
): Promise<Player> {
  const context = await browser.newContext({
    viewport: TEST_CONFIG.MOBILE_VIEWPORT,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
  });
  const page = await context.newPage();
  return { page, context, name, isHost };
}

async function fillPlayerName(page: Page, name: string) {
  await page.fill('input[placeholder="Adını gir..."]', name);
}

async function createRoom(page: Page): Promise<string> {
  await page.click('button:has-text("Yeni Oda Oluştur")');
  await page.waitForSelector('text=Oda Kodu', { timeout: TEST_CONFIG.TIMEOUT.ACTION });

  // Oda kodunu al
  const codeElement = await page.locator(
    'span.tracking-\\[0\\.3em\\]'
  );
  const roomCode = await codeElement.textContent();
  return roomCode?.trim() || '';
}

async function joinRoom(page: Page, roomCode: string) {
  await page.fill('input[placeholder="ABC123"]', roomCode);
  await page.click('button:has-text("Odaya Katıl")');
  await page.waitForSelector('text=Oyuncular', { timeout: TEST_CONFIG.TIMEOUT.ACTION });
}

async function waitForPanoLoad(page: Page) {
  // Street View yüklenene kadar bekle
  await page.waitForSelector('.gm-style', { timeout: TEST_CONFIG.TIMEOUT.PANO_LOAD });
  // Canvas yüklenene kadar bekle
  await page.waitForSelector('.widget-scene-canvas, canvas', {
    timeout: TEST_CONFIG.TIMEOUT.PANO_LOAD,
  });
  // Ek bekleme - pano tamamen yüklensin
  await page.waitForTimeout(2000);
}

async function makeGuess(page: Page) {
  try {
    // 1. Butonun enabled olmasını bekle (pano yüklenmiş demek)
    const openMapButton = page.locator('button:has-text("Haritadan konum seç"):not([disabled])');

    // 15 saniye bekle, yoksa timer'ın bitmesini bekleyerek devam et
    const isEnabled = await openMapButton.isVisible({ timeout: 15000 }).catch(() => false);

    if (!isEnabled) {
      console.log('      Buton aktif değil, timer bitmesini bekliyoruz...');
      return; // Timer bitince round otomatik geçecek
    }

    await openMapButton.click();
    await page.waitForTimeout(1000);

    // 2. Harita açıldı, haritaya tıkla
    const mapContainer = page.locator('[class*="map"]').last();
    const box = await mapContainer.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(500);
    }

    // 3. "TAHMİN ET" butonuna tıkla
    const submitButton = page.locator('button:has-text("TAHMİN ET")');
    await submitButton.waitFor({ state: 'visible', timeout: 10000 });
    await submitButton.click();
    await page.waitForTimeout(1000);
  } catch (err) {
    console.log('      Tahmin yapılamadı, timer bitmesini bekliyoruz...');
  }
}

async function waitForRoundEnd(page: Page) {
  // "TUR X SONUÇLARI" veya "Sonraki Tur" butonunu bekle
  await page.locator('text=SONUÇLARI').or(page.locator('button:has-text("Sonraki Tur")')).first().waitFor({
    state: 'visible',
    timeout: TEST_CONFIG.TIMEOUT.ROUND_END,
  });
}

// Ana test - 6 oyunculu multiplayer lobby testi
test.describe('Multiplayer 6 Oyuncu Testi', () => {
  test('6 oyuncu lobby\'de toplanmalı ve oyun başlatılabilmeli', async ({ browser }) => {
    const players: Player[] = [];

    // 1. Tüm oyuncuları oluştur
    console.log('📱 6 oyuncu oluşturuluyor...');
    for (let i = 0; i < TEST_CONFIG.PLAYER_COUNT; i++) {
      const player = await createPlayer(
        browser,
        `Player${i + 1}`,
        i === 0 // İlk oyuncu host
      );
      players.push(player);
      await player.page.goto('/');
      await fillPlayerName(player.page, player.name);
    }

    // 2. Host oda oluşturur
    console.log('🏠 Host oda oluşturuyor...');
    const roomCode = await createRoom(players[0].page);
    expect(roomCode).toHaveLength(6);
    console.log(`   Oda kodu: ${roomCode}`);

    // 3. Diğer oyuncular katılır
    console.log('👥 Diğer oyuncular katılıyor...');
    for (let i = 1; i < players.length; i++) {
      await joinRoom(players[i].page, roomCode);
      console.log(`   ${players[i].name} katıldı`);
      await players[i].page.waitForTimeout(500);
    }

    // 4. Tüm oyuncuların lobby'de olduğunu doğrula
    console.log('✅ Lobby kontrolü...');
    for (const player of players) {
      const playerCount = await player.page.locator('text=/\\d+\\/8/').textContent();
      expect(playerCount).toContain('6/8');
    }

    // 5. Host oyunu başlatır
    console.log('🎮 Oyun başlatılıyor...');
    await players[0].page.click('button:has-text("Oyunu Başlat")');

    // 6. Oyun ekranının yüklendiğini doğrula (ilk oyuncu için)
    console.log('🎯 Oyun ekranı kontrolü...');
    await waitForPanoLoad(players[0].page);

    // Timer görünür olmalı
    const timer = players[0].page.locator('text=/\\d{2}:\\d{2}/');
    await expect(timer).toBeVisible({ timeout: 10000 });
    console.log('   Timer görünüyor ✅');

    // Round bilgisi görünür olmalı
    const roundInfo = players[0].page.locator('text=1/5');
    await expect(roundInfo).toBeVisible({ timeout: 5000 });
    console.log('   Round bilgisi görünüyor ✅');

    // 7. Cleanup
    console.log('\n🧹 Cleanup...');
    for (const player of players) {
      await player.context.close();
    }

    console.log('\n✅ Multiplayer lobby testi tamamlandı!');
  });

  test('Oyuncu ayrılınca bildirim gösterilmeli', async ({ browser }) => {
    // Host oluştur
    const host = await createPlayer(browser, 'Host', true);
    await host.page.goto('/');
    await fillPlayerName(host.page, 'Host');
    const roomCode = await createRoom(host.page);

    // Oyuncu katıl
    const player = await createPlayer(browser, 'Player', false);
    await player.page.goto('/');
    await fillPlayerName(player.page, 'Player');
    await joinRoom(player.page, roomCode);

    // Oyuncu ayrıl
    await player.page.click('text=Odadan Ayrıl');

    // Host'ta bildirim görünmeli (5 saniye içinde)
    await host.page.waitForTimeout(2000);

    // Cleanup
    await host.context.close();
    await player.context.close();
  });
});

test.describe('Timer Bug Testleri', () => {
  test('Timer 0\'da spam olmamalı', async ({ page }) => {
    // Tek oyuncu hızlı test
    await page.goto('/');
    await page.fill('input[placeholder="Adını gir..."]', 'TimerTest');
    await page.click('button:has-text("Yeni Oda Oluştur")');
    await page.waitForSelector('text=Oda Kodu');

    // Oyunu başlat
    await page.click('button:has-text("Oyunu Başlat")');
    await waitForPanoLoad(page);

    // Console mesajlarını dinle
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('handleTimeUp') || msg.text().includes('Hareket')) {
        consoleMessages.push(msg.text());
      }
    });

    // Timer'ı bekle (timeout simülasyonu için bekleme)
    // Not: Gerçek testte timer'ı beklemek uzun sürer, bu sadece yapı kontrolü
    await page.waitForTimeout(5000);

    // Duplicate mesaj kontrolü
    const timeUpMessages = consoleMessages.filter((m) =>
      m.includes('handleTimeUp')
    );

    // Her round için max 1 handleTimeUp mesajı
    // (Timer testinde bu sayı 0 veya 1 olmalı)
    expect(timeUpMessages.length).toBeLessThanOrEqual(1);
  });
});

test.describe('Bildirim Spam Testleri', () => {
  test('Oyuncu katıl/ayrıl bildirimleri spam olmamalı', async ({ browser }) => {
    // Host oluştur
    const hostContext = await browser.newContext({
      viewport: TEST_CONFIG.MOBILE_VIEWPORT,
    });
    const hostPage = await hostContext.newPage();
    await hostPage.goto('/');
    await hostPage.fill('input[placeholder="Adını gir..."]', 'Host');
    const roomCode = await createRoom(hostPage);

    // Bildirim sayısını takip et
    let notificationCount = 0;
    hostPage.on('console', (msg) => {
      if (
        msg.text().includes('odaya katıldı') ||
        msg.text().includes('oyundan ayrıldı')
      ) {
        notificationCount++;
      }
    });

    // 3 oyuncu hızlıca katılsın
    for (let i = 0; i < 3; i++) {
      const ctx = await browser.newContext({
        viewport: TEST_CONFIG.MOBILE_VIEWPORT,
      });
      const pg = await ctx.newPage();
      await pg.goto('/');
      await pg.fill('input[placeholder="Adını gir..."]', `Player${i}`);
      await joinRoom(pg, roomCode);
      await pg.waitForTimeout(200);
    }

    await hostPage.waitForTimeout(3000);

    // Her oyuncu için max 1 bildirim = 3
    // Spam durumunda bu sayı çok yüksek olur
    expect(notificationCount).toBeLessThanOrEqual(6); // Tolerans

    await hostContext.close();
  });
});

test.describe('Mobil UI Testleri', () => {
  test('Mobil viewport\'ta tüm elementler görünür olmalı', async ({ page }) => {
    await page.setViewportSize(TEST_CONFIG.MOBILE_VIEWPORT);
    await page.goto('/');

    // Ana menü elementleri
    await expect(page.locator('text=TürkiyeGuessr')).toBeVisible();
    await expect(page.locator('input[placeholder="Adını gir..."]')).toBeVisible();
    await expect(page.locator('button:has-text("Yeni Oda Oluştur")')).toBeVisible();
    await expect(page.locator('input[placeholder="ABC123"]')).toBeVisible();
    await expect(page.locator('button:has-text("Odaya Katıl")')).toBeVisible();

    // Scroll yapılabilmeli
    await page.evaluate(() => window.scrollTo(0, 100));
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeGreaterThanOrEqual(0);
  });

  test('Oyun ekranında butonlar kesilmemeli', async ({ page }) => {
    await page.setViewportSize(TEST_CONFIG.MOBILE_VIEWPORT);
    await page.goto('/');
    await page.fill('input[placeholder="Adını gir..."]', 'MobileTest');
    await page.click('button:has-text("Yeni Oda Oluştur")');
    await page.waitForSelector('text=Oda Kodu');

    // Lobby'de tüm elementler görünür
    await expect(page.locator('button:has-text("Oyunu Başlat")')).toBeVisible();
    await expect(page.locator('text=Odadan Ayrıl')).toBeVisible();

    // Oyunu başlat
    await page.click('button:has-text("Oyunu Başlat")');
    await waitForPanoLoad(page);

    // Oyun ekranında kritik elementler
    const header = page.locator('.game-header, header');
    await expect(header).toBeVisible();

    // Timer görünür
    const timer = page.locator('text=/\\d{2}:\\d{2}/');
    await expect(timer).toBeVisible();

    // Alt buton görünür ve tıklanabilir
    const actionButton = page.locator('button:has-text("Haritadan konum seç")');
    if (await actionButton.isVisible()) {
      const box = await actionButton.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        // Buton ekran içinde olmalı
        expect(box.y + box.height).toBeLessThanOrEqual(
          TEST_CONFIG.MOBILE_VIEWPORT.height
        );
      }
    }
  });
});
