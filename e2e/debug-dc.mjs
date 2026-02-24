import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });

// Host
const hostCtx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const hostPage = await hostCtx.newPage();
hostPage.on('console', msg => {
  const t = msg.text();
  if (t.includes('[MP]') || t.includes('roundEnd') || t.includes('migration') || t.includes('recovery') || t.includes('Error'))
    console.log('[HOST]', t.substring(0, 300));
});

// P2
const p2Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const p2Page = await p2Ctx.newPage();
p2Page.on('console', msg => {
  const t = msg.text();
  if (t.includes('[MP]') || t.includes('roundEnd') || t.includes('migration') || t.includes('recovery') || t.includes('status') || t.includes('Error'))
    console.log('[P2]', t.substring(0, 300));
});

// P3
const p3Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const p3Page = await p3Ctx.newPage();
p3Page.on('console', msg => {
  const t = msg.text();
  if (t.includes('[MP]') || t.includes('roundEnd') || t.includes('migration') || t.includes('recovery') || t.includes('status') || t.includes('Error'))
    console.log('[P3]', t.substring(0, 300));
});

// Navigate Host
await hostPage.goto('http://localhost:3000');
await hostPage.waitForTimeout(2000);
await hostPage.fill('input[placeholder="Adını gir..."]', 'Host');
await hostPage.click('button:has-text("Yeni Oda Oluştur")');
await hostPage.waitForSelector('text=Oda Kodu', { timeout: 10000 });
const roomCode = (await (await hostPage.locator('span.tracking-\\[0\\.3em\\]')).textContent())?.trim();
console.log('=== Room:', roomCode, '===');

// P2 joins
await p2Page.goto('http://localhost:3000');
await p2Page.waitForTimeout(2000);
await p2Page.fill('input[placeholder="Adını gir..."]', 'Player2');
await p2Page.fill('input[placeholder="ABC123"]', roomCode);
await p2Page.click('button:has-text("Odaya Katıl")');
await p2Page.waitForSelector('text=Oyuncular', { timeout: 15000 });
console.log('=== P2 joined ===');

// P3 joins
await p3Page.goto('http://localhost:3000');
await p3Page.waitForTimeout(2000);
await p3Page.fill('input[placeholder="Adını gir..."]', 'Player3');
await p3Page.fill('input[placeholder="ABC123"]', roomCode);
await p3Page.click('button:has-text("Odaya Katıl")');
await p3Page.waitForSelector('text=Oyuncular', { timeout: 15000 });
console.log('=== P3 joined ===');

// Start game
await hostPage.waitForTimeout(2000);
await hostPage.click('button:has-text("Oyunu Başlat")');
console.log('=== Game started ===');

// Wait a bit for pano to load
await hostPage.waitForTimeout(5000);

// Now disconnect host immediately
console.log('=== Disconnecting host ===');
await hostCtx.close();
console.log('=== Host disconnected ===');

// Monitor P2 and P3 for roundEnd
console.log('=== Waiting for roundEnd on P2 and P3 (max 120s) ===');

const startTime = Date.now();

// Check every 5s what P2 and P3 see
for (let i = 0; i < 24; i++) {
  await p2Page.waitForTimeout(5000);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);

  const p2HasRoundEnd = await p2Page.locator('text=/Sonuç|SONUÇLARI|Sonraki Tur/i').isVisible().catch(() => false);
  const p3HasRoundEnd = await p3Page.locator('text=/Sonuç|SONUÇLARI|Sonraki Tur/i').isVisible().catch(() => false);

  console.log(`=== t=${elapsed}s P2_roundEnd=${p2HasRoundEnd} P3_roundEnd=${p3HasRoundEnd} ===`);

  if (p2HasRoundEnd && p3HasRoundEnd) {
    console.log('=== BOTH saw roundEnd! SUCCESS ===');
    break;
  }

  if (p2HasRoundEnd && !p3HasRoundEnd && i > 3) {
    // P2 has roundEnd but P3 doesn't — check P3 room state
    const p3RoomStatus = await p3Page.evaluate(() => {
      const w = window;
      // Try to access React internals or check visible status
      const statusEl = document.querySelector('[data-status]');
      const timerEl = document.querySelector('.timer, [class*="timer"]');
      return {
        visibleText: document.body.innerText.substring(0, 200),
        hasDialog: !!document.querySelector('dialog, [role="dialog"]'),
      };
    });
    console.log(`=== P3 debug: hasDialog=${p3RoomStatus.hasDialog} text=${p3RoomStatus.visibleText.substring(0, 100)} ===`);
  }
}

// Final check
const p2Final = await p2Page.locator('text=/Sonuç|SONUÇLARI|Sonraki Tur/i').isVisible().catch(() => false);
const p3Final = await p3Page.locator('text=/Sonuç|SONUÇLARI|Sonraki Tur/i').isVisible().catch(() => false);
console.log(`=== FINAL: P2=${p2Final} P3=${p3Final} ===`);

if (!p3Final) {
  await p3Page.screenshot({ path: '/tmp/p3-stuck-dc.png' });
  console.log('=== P3 screenshot saved to /tmp/p3-stuck-dc.png ===');
}

await p2Ctx.close();
await p3Ctx.close();
await browser.close();
console.log('=== Done ===');
