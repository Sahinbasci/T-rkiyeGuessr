import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });

// Host
const hostCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const hostPage = await hostCtx.newPage();
hostPage.on('console', msg => {
  const t = msg.text();
  if (t.includes('[MP]') || t.includes('roundEnd') || t.includes('acquireAndWrite') || t.includes('Telemetry'))
    console.log('[HOST]', t.substring(0, 250));
});

// Player 2
const p2Ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p2Page = await p2Ctx.newPage();
p2Page.on('console', msg => {
  const t = msg.text();
  if (t.includes('[MP]') || t.includes('roundEnd') || t.includes('Telemetry') || t.includes('stuck') || t.includes('Error'))
    console.log('[P2]', t.substring(0, 250));
});

// Navigate
await hostPage.goto('http://localhost:3000');
await hostPage.waitForTimeout(2000);
await hostPage.fill('input[placeholder="Adını gir..."]', 'Host');
await hostPage.click('button:has-text("Yeni Oda Oluştur")');
await hostPage.waitForSelector('text=Oda Kodu', { timeout: 10000 });
const roomCode = (await (await hostPage.locator('span.tracking-\\[0\\.3em\\]')).textContent())?.trim();
console.log('=== Room:', roomCode, '===');

await p2Page.goto('http://localhost:3000');
await p2Page.waitForTimeout(2000);
await p2Page.fill('input[placeholder="Adını gir..."]', 'Player2');
await p2Page.fill('input[placeholder="ABC123"]', roomCode);
await p2Page.click('button:has-text("Odaya Katıl")');
await p2Page.waitForSelector('text=Oyuncular', { timeout: 15000 });
console.log('=== P2 joined ===');

// Wait for lobby
await hostPage.waitForTimeout(2000);

// Start game
await hostPage.click('button:has-text("Oyunu Başlat")');
console.log('=== Game started ===');

// Wait for pano + timer to run out (90s urban)
console.log('=== Waiting 100s for timer expiry ===');
await hostPage.waitForTimeout(100000);

// Check status
const hostSeeRoundEnd = await hostPage.locator('text=/Sonuç|SONUÇ/i').isVisible().catch(() => false);
const p2SeeRoundEnd = await p2Page.locator('text=/Sonuç|SONUÇ/i').isVisible().catch(() => false);

console.log('=== Host sees roundEnd:', hostSeeRoundEnd, '===');
console.log('=== P2 sees roundEnd:', p2SeeRoundEnd, '===');

// If P2 stuck, wait more
if (p2SeeRoundEnd === false) {
  console.log('=== P2 stuck, waiting 20 more seconds ===');
  await p2Page.waitForTimeout(20000);
  const p2Retry = await p2Page.locator('text=/Sonuç|SONUÇ/i').isVisible().catch(() => false);
  console.log('=== P2 sees roundEnd after extra wait:', p2Retry, '===');

  // Screenshot
  await p2Page.screenshot({ path: '/tmp/p2-stuck.png' });
  console.log('=== P2 screenshot saved to /tmp/p2-stuck.png ===');
}

await browser.close();
console.log('=== Done ===');
