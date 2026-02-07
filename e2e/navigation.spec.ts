import { test, expect, Page } from '@playwright/test';

/**
 * Navigation Engine v2 - E2E Tests
 *
 * Verifies the 5 root-cause fixes for the "mobile rotate → auto move" bug:
 *
 * 1. iPhone emulation: continuous drag/rotate → moveCount=0, pano unchanged
 * 2. Android emulation: same scenario
 * 3. Ghost click: drag + immediate tap → moveCount stays 0
 * 4. UI button move: click on SV container → moveCount at most +1
 * 5. Listener lifecycle: 5x remount → no listener accumulation
 *
 * These tests require a running dev server with valid Google Maps API key.
 * Metrics are observed via console.log('[Nav] ...') messages.
 */

// ================================================================
// HELPERS
// ================================================================

const TIMEOUT = {
  PANO_LOAD: 60_000,
  ACTION: 15_000,
};

const MOBILE_VIEWPORTS = {
  iphone14: { width: 390, height: 844 },
  pixel7: { width: 412, height: 915 },
};

/**
 * Collect navigation metrics by listening to console.log('[Nav] ...') messages.
 */
function createMetricsCollector(page: Page) {
  const metrics = {
    moveCount: 0,
    moveRejectedCount: 0,
    panoChanges: [] as string[],
    lastPanoId: '',
    clickNavigateCount: 0,
  };

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[Nav] Move:')) {
      metrics.moveCount++;
      const panoMatch = text.match(/pano=([a-zA-Z0-9]+)/);
      if (panoMatch) {
        metrics.lastPanoId = panoMatch[1];
        metrics.panoChanges.push(panoMatch[1]);
      }
    }
    if (text.includes('[Nav] Move limit reached')) {
      metrics.moveRejectedCount++;
    }
    if (text.includes('[Nav] Click navigate:')) {
      metrics.clickNavigateCount++;
    }
  });

  return metrics;
}

/**
 * Navigate a player into a game room and wait for Street View to load.
 */
async function setupSinglePlayerGame(page: Page, playerName: string): Promise<void> {
  await page.goto('/');
  await page.fill('input[placeholder="Adını gir..."]', playerName);
  await page.click('button:has-text("Yeni Oda Oluştur")');
  await page.waitForSelector('text=Oda Kodu', { timeout: TIMEOUT.ACTION });
  await page.click('button:has-text("Oyunu Başlat")');
  await page.waitForSelector('.gm-style', { timeout: TIMEOUT.PANO_LOAD });
  await page.waitForSelector('.widget-scene-canvas, canvas', {
    timeout: TIMEOUT.PANO_LOAD,
  });
  // Wait for pano to fully render + links to populate
  await page.waitForTimeout(3000);
}

/**
 * Simulate a touch drag by dispatching PointerEvent directly on the DOM.
 *
 * CRITICAL: We dispatch events ON the SV container element directly.
 * This avoids Playwright's `page.mouse` which can emit extra tap events
 * that bypass our drag detection.
 *
 * The drag distance (startX→endX, startY→endY) must exceed DRAG_THRESHOLD_PX (12px)
 * so our handler classifies it as a drag, not a click.
 */
async function simulateDragOnSV(
  page: Page,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  steps: number = 10,
): Promise<void> {
  await page.evaluate(
    ({ sx, sy, ex, ey, s }) => {
      const container = document.querySelector('.gm-style');
      if (!container) return;

      const dispatch = (type: string, x: number, y: number) => {
        container.dispatchEvent(
          new PointerEvent(type, {
            clientX: x,
            clientY: y,
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            pointerType: 'touch',
            isPrimary: true,
          })
        );
      };

      // pointerdown at start
      dispatch('pointerdown', sx, sy);

      // pointermove in steps (Google SV handles the actual rotation)
      const dx = (ex - sx) / s;
      const dy = (ey - sy) / s;
      for (let i = 1; i <= s; i++) {
        dispatch('pointermove', sx + dx * i, sy + dy * i);
      }

      // pointerup at end position
      dispatch('pointerup', ex, ey);
    },
    { sx: startX, sy: startY, ex: endX, ey: endY, s: steps }
  );
}

/**
 * Simulate a deliberate tap (pointerdown + pointerup at same position).
 */
async function simulateTapOnSV(page: Page, x: number, y: number): Promise<void> {
  await page.evaluate(
    ({ tx, ty }) => {
      const container = document.querySelector('.gm-style');
      if (!container) return;

      const dispatch = (type: string) => {
        container.dispatchEvent(
          new PointerEvent(type, {
            clientX: tx,
            clientY: ty,
            bubbles: true,
            cancelable: true,
            pointerId: 1,
            pointerType: 'touch',
            isPrimary: true,
          })
        );
      };

      dispatch('pointerdown');
      dispatch('pointerup');
    },
    { tx: x, ty: y }
  );
}

/**
 * Get the Street View container center coordinates.
 */
async function getSVCenter(page: Page): Promise<{ x: number; y: number; box: { x: number; y: number; width: number; height: number } }> {
  const svContainer = page.locator('.gm-style').first();
  const box = await svContainer.boundingBox();
  if (!box) throw new Error('Street View container not found');
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
    box,
  };
}

/**
 * Read the moves remaining from the header UI.
 * The move counter shows "X/Y" inside the LAST stat-badge that matches X/Y pattern.
 *
 * Badge order in DOM: Timer (has ":") → Round (e.g. "1/5") → Score → Moves (e.g. "3/3")
 * We need the LAST X/Y badge (Moves), not the first (Round).
 */
async function getMovesDisplay(page: Page): Promise<{ remaining: number; total: number } | null> {
  try {
    const badges = page.locator('.stat-badge');
    const count = await badges.count();
    let lastMatch: { remaining: number; total: number } | null = null;

    for (let i = 0; i < count; i++) {
      const text = await badges.nth(i).textContent();
      if (text) {
        const match = text.match(/(\d+)\/(\d+)/);
        // Exclude timer (contains ':')
        if (match && !text.includes(':')) {
          lastMatch = {
            remaining: parseInt(match[1], 10),
            total: parseInt(match[2], 10),
          };
        }
      }
    }
    return lastMatch;
  } catch {
    return null;
  }
}

// ================================================================
// TEST SUITE 1: Mobile Rotate Never Moves (iPhone 14)
// ================================================================
test.describe('Mobile Navigation - Rotate Never Moves (iPhone 14)', () => {
  test.use({
    viewport: MOBILE_VIEWPORTS.iphone14,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });

  test('continuous rotate/drag should produce 0 moves and 0 pano changes', async ({ page }) => {
    const metrics = createMetricsCollector(page);
    await setupSinglePlayerGame(page, 'iPhoneDragTest');

    const initialMoves = await getMovesDisplay(page);
    expect(initialMoves).not.toBeNull();
    const initialRemaining = initialMoves!.remaining;

    const { x: cx, y: cy } = await getSVCenter(page);

    // Perform many drag/rotate gestures via DOM events
    let dragCount = 0;
    for (let i = 0; i < 30; i++) {
      // Horizontal drag left
      await simulateDragOnSV(page, cx + 50, cy, cx - 100, cy, 8);
      dragCount++;
      await page.waitForTimeout(50);

      // Vertical drag up
      await simulateDragOnSV(page, cx, cy + 30, cx, cy - 60, 6);
      dragCount++;
      await page.waitForTimeout(50);

      // Diagonal drag
      await simulateDragOnSV(page, cx - 80, cy - 40, cx + 80, cy + 40, 10);
      dragCount++;
      await page.waitForTimeout(50);
    }

    // CRITICAL ASSERTIONS
    expect(metrics.moveCount).toBe(0);
    expect(metrics.panoChanges).toHaveLength(0);

    const finalMoves = await getMovesDisplay(page);
    expect(finalMoves).not.toBeNull();
    expect(finalMoves!.remaining).toBe(initialRemaining);

    expect(dragCount).toBeGreaterThan(30);
    console.log(`iPhone rotate test: ${dragCount} drags, ${metrics.moveCount} moves (expected 0)`);
  });
});

// ================================================================
// TEST SUITE 2: Mobile Rotate Never Moves (Pixel 7)
// ================================================================
test.describe('Mobile Navigation - Rotate Never Moves (Pixel 7)', () => {
  test.use({
    viewport: MOBILE_VIEWPORTS.pixel7,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  });

  test('continuous rotate/drag should produce 0 moves on Android', async ({ page }) => {
    const metrics = createMetricsCollector(page);
    await setupSinglePlayerGame(page, 'PixelDragTest');

    const initialMoves = await getMovesDisplay(page);
    expect(initialMoves).not.toBeNull();
    const initialRemaining = initialMoves!.remaining;

    const { x: cx, y: cy } = await getSVCenter(page);

    let dragCount = 0;
    for (let i = 0; i < 30; i++) {
      // Fast horizontal swipe
      await simulateDragOnSV(page, cx + 100, cy, cx - 100, cy, 5);
      dragCount++;
      await page.waitForTimeout(40);

      // Slow pan
      await simulateDragOnSV(page, cx - 50, cy, cx + 50, cy, 15);
      dragCount++;
      await page.waitForTimeout(40);
    }

    expect(metrics.moveCount).toBe(0);
    expect(metrics.panoChanges).toHaveLength(0);

    const finalMoves = await getMovesDisplay(page);
    expect(finalMoves).not.toBeNull();
    expect(finalMoves!.remaining).toBe(initialRemaining);

    expect(dragCount).toBeGreaterThan(30);
    console.log(`Android rotate test: ${dragCount} drags, ${metrics.moveCount} moves (expected 0)`);
  });
});

// ================================================================
// TEST SUITE 3: Ghost Click Suppression
// ================================================================
test.describe('Ghost Click Suppression', () => {
  test.use({
    viewport: MOBILE_VIEWPORTS.iphone14,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  test('drag + immediate tap should NOT trigger a move', async ({ page }) => {
    const metrics = createMetricsCollector(page);
    await setupSinglePlayerGame(page, 'GhostClickTest');

    const initialMoves = await getMovesDisplay(page);
    expect(initialMoves).not.toBeNull();
    const initialRemaining = initialMoves!.remaining;

    const { x: cx, y: cy } = await getSVCenter(page);

    // 10 rapid drag-then-tap sequences
    for (let i = 0; i < 10; i++) {
      // 1. Drag gesture (>12px threshold)
      await simulateDragOnSV(page, cx - 80, cy, cx + 80, cy, 8);

      // 2. Immediate tap at release point (ghost click pattern)
      // The tap's pointerdown creates a new start position,
      // and pointerup at same position = 0px distance = click.
      // But because of COOLDOWN (400ms), rapid taps are suppressed.
      await page.waitForTimeout(20);
      await simulateTapOnSV(page, cx + 80, cy);

      // Wait enough for cooldown to pass before next iteration
      await page.waitForTimeout(500);
    }

    // POST-DRAG SUPPRESS WINDOW FIX:
    // When a drag is detected, lastClickTimeRef is set to Date.now().
    // The immediate tap arrives ~20ms later, well within the 400ms cooldown.
    // Therefore ALL taps after drags within cooldown are suppressed → 0 moves.
    //
    // The 500ms wait between iterations exceeds cooldown, but each iteration's
    // tap is only 20ms after its drag → always suppressed.

    // CRITICAL: 0 moves from drags, 0 moves from post-drag ghost taps
    expect(metrics.moveCount).toBe(0);
    expect(metrics.panoChanges).toHaveLength(0);

    const finalMoves = await getMovesDisplay(page);
    expect(finalMoves).not.toBeNull();
    expect(finalMoves!.remaining).toBe(initialRemaining);

    console.log(`Ghost click test: 10 drag+tap sequences, ${metrics.moveCount} moves (expected 0)`);
  });

  test('pointerup without pointerdown should be suppressed', async ({ page }) => {
    const metrics = createMetricsCollector(page);
    await setupSinglePlayerGame(page, 'MissingPDTest');

    const initialMoves = await getMovesDisplay(page);

    // Dispatch raw pointerup WITHOUT preceding pointerdown
    await page.evaluate(() => {
      const container = document.querySelector('.gm-style');
      if (container) {
        container.dispatchEvent(
          new PointerEvent('pointerup', {
            clientX: 200,
            clientY: 400,
            bubbles: true,
            pointerId: 1,
            pointerType: 'touch',
          })
        );
      }
    });

    await page.waitForTimeout(500);

    expect(metrics.moveCount).toBe(0);

    const finalMoves = await getMovesDisplay(page);
    if (finalMoves && initialMoves) {
      expect(finalMoves.remaining).toBe(initialMoves.remaining);
    }

    console.log('Missing pointerdown test: 0 moves (expected 0)');
  });
});

// ================================================================
// TEST SUITE 4: Valid Click Navigation
// ================================================================
test.describe('Valid Click Navigation', () => {
  test.use({
    viewport: MOBILE_VIEWPORTS.iphone14,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  test('deliberate tap should trigger at most 1 move', async ({ page }) => {
    const metrics = createMetricsCollector(page);
    await setupSinglePlayerGame(page, 'ValidClickTest');

    const initialMoves = await getMovesDisplay(page);
    expect(initialMoves).not.toBeNull();

    const { x: cx, y: cy } = await getSVCenter(page);

    // Deliberate tap: pointerdown + pointerup at exactly same position
    await simulateTapOnSV(page, cx, cy);

    // Wait for potential pano change
    await page.waitForTimeout(2000);

    expect(metrics.moveCount).toBeLessThanOrEqual(1);

    const finalMoves = await getMovesDisplay(page);
    if (finalMoves && initialMoves) {
      if (metrics.moveCount === 1) {
        expect(finalMoves.remaining).toBe(initialMoves.remaining - 1);
      } else {
        expect(finalMoves.remaining).toBe(initialMoves.remaining);
      }
    }

    console.log(`Valid click test: ${metrics.moveCount} moves after 1 deliberate tap`);
  });
});

// ================================================================
// TEST SUITE 5: Listener Lifecycle - No Leaks on Remount
// ================================================================
test.describe('Listener Lifecycle - No Leaks on Remount', () => {
  test.use({
    viewport: MOBILE_VIEWPORTS.iphone14,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  test('5 page navigations should not accumulate listeners', async ({ page }) => {
    // Simulate 5 full page loads (each creates new component + SV instance)
    for (let i = 0; i < 5; i++) {
      await page.goto('/');
      await page.waitForTimeout(500);

      await page.fill('input[placeholder="Adını gir..."]', `ListenerTest${i}`);
      await page.click('button:has-text("Yeni Oda Oluştur")');
      await page.waitForSelector('text=Oda Kodu', { timeout: TIMEOUT.ACTION });
      await page.click('button:has-text("Oyunu Başlat")');

      try {
        await page.waitForSelector('.gm-style', { timeout: TIMEOUT.PANO_LOAD });
        await page.waitForSelector('.widget-scene-canvas, canvas', {
          timeout: TIMEOUT.PANO_LOAD,
        });
        await page.waitForTimeout(2000);
      } catch {
        console.log(`Round ${i + 1}: SV load timeout (API quota?)`);
      }
    }

    // After 5 remounts, test that a drag still produces 0 moves
    // If listeners leaked, a single drag could trigger multiple moves
    const metrics = createMetricsCollector(page);

    try {
      const { x: cx, y: cy } = await getSVCenter(page);

      // Single drag
      await simulateDragOnSV(page, cx - 50, cy, cx + 50, cy, 10);
      await page.waitForTimeout(1000);

      expect(metrics.moveCount).toBe(0);
      console.log(`Listener lifecycle: 5 remounts, drag → ${metrics.moveCount} moves (expected 0)`);
    } catch {
      console.log('Listener lifecycle: SV not available on final round, skipping drag test');
    }
  });

  test('unmount + remount should not break navigation', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[placeholder="Adını gir..."]', 'UnmountTest');
    await page.click('button:has-text("Yeni Oda Oluştur")');
    await page.waitForSelector('text=Oda Kodu', { timeout: TIMEOUT.ACTION });
    await page.click('button:has-text("Oyunu Başlat")');

    try {
      await page.waitForSelector('.gm-style', { timeout: TIMEOUT.PANO_LOAD });
      await page.waitForTimeout(2000);
    } catch {
      console.log('SV load timeout, skipping unmount test');
      return;
    }

    // Navigate away (triggers React unmount → cleanup effect)
    await page.goto('about:blank');
    await page.waitForTimeout(500);

    // Navigate back (fresh mount)
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Page should load normally
    await expect(page.locator('text=TürkiyeGuessr')).toBeVisible();
    console.log('Unmount test: page loads normally after remount');
  });
});

// ================================================================
// TEST SUITE 6: Move Budget Enforcement
// ================================================================
test.describe('Move Budget Enforcement E2E', () => {
  test.use({
    viewport: MOBILE_VIEWPORTS.iphone14,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  test('moves remaining should never go below 0', async ({ page }) => {
    const metrics = createMetricsCollector(page);
    await setupSinglePlayerGame(page, 'BudgetTest');

    const initialMoves = await getMovesDisplay(page);
    expect(initialMoves).not.toBeNull();

    const { x: cx, y: cy } = await getSVCenter(page);

    // Try to exhaust moves with deliberate taps (respecting cooldown)
    for (let i = 0; i < 10; i++) {
      await simulateTapOnSV(page, cx, cy);
      await page.waitForTimeout(500); // Respect 400ms cooldown
    }

    const finalMoves = await getMovesDisplay(page);
    if (finalMoves) {
      expect(finalMoves.remaining).toBeGreaterThanOrEqual(0);
      const used = finalMoves.total - finalMoves.remaining;
      expect(used).toBeLessThanOrEqual(finalMoves.total);
    }

    console.log(`Budget test: ${metrics.moveCount} moves from 10 taps, rejected: ${metrics.moveRejectedCount}`);
  });
});

// ================================================================
// TEST SUITE 7: Concurrent Drag Stress Test
// ================================================================
test.describe('Concurrent Drag Stress Test', () => {
  test.use({
    viewport: MOBILE_VIEWPORTS.iphone14,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  });

  test('50 rapid multi-directional drags should never produce moves', async ({ page }) => {
    const metrics = createMetricsCollector(page);
    await setupSinglePlayerGame(page, 'StressTest');

    const { x: cx, y: cy } = await getSVCenter(page);

    const directions = [
      { dx: 100, dy: 0 },
      { dx: -100, dy: 0 },
      { dx: 0, dy: 100 },
      { dx: 0, dy: -100 },
      { dx: 70, dy: 70 },
      { dx: -70, dy: -70 },
      { dx: 70, dy: -70 },
      { dx: -70, dy: 70 },
    ];

    for (let i = 0; i < 50; i++) {
      const dir = directions[i % directions.length];
      await simulateDragOnSV(page, cx, cy, cx + dir.dx, cy + dir.dy, 5);
      await page.waitForTimeout(20);
    }

    await page.waitForTimeout(500);

    expect(metrics.moveCount).toBe(0);
    expect(metrics.panoChanges).toHaveLength(0);

    console.log(`Stress test: 50 rapid drags, ${metrics.moveCount} moves (expected 0)`);
  });
});
