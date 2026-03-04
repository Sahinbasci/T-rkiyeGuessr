/**
 * AdSense Bot-Style E2E Audit
 *
 * Simulates what Google's AdSense crawler checks:
 * - robots.txt, sitemap.xml, ads.txt accessible
 * - Sitemap URLs return 200
 * - Cookie consent banner appears
 * - Policy pages accessible and have content
 * - No console errors on key routes
 *
 * GAP #6: Production-like AdSense readiness audit.
 */

import { test, expect, Page } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

// ==================== SEO / Crawl Files ====================

test.describe("AdSense Audit: Crawl files", () => {
  test("robots.txt returns 200 and contains sitemap", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/robots.txt`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("User-agent");
    expect(body).toContain("sitemap");
    expect(body).toContain("Disallow: /_next/");
  });

  test("sitemap.xml returns 200 and contains URLs", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemap.xml`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("<url>");
    expect(body).toContain("<loc>");
  });

  test("ads.txt returns 200 and contains Google pub ID", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/ads.txt`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("google.com");
    expect(body).toContain("pub-");
  });
});

// ==================== Sitemap URL Sampling ====================

test.describe("AdSense Audit: Sitemap URL sampling", () => {
  test("sample sitemap URLs return 200 with content", async ({ request }) => {
    // Fetch sitemap
    const sitemapResp = await request.get(`${BASE_URL}/sitemap.xml`);
    const sitemapBody = await sitemapResp.text();

    // Extract URLs from sitemap
    const urlRegex = /<loc>(.*?)<\/loc>/g;
    const urls: string[] = [];
    let match;
    while ((match = urlRegex.exec(sitemapBody)) !== null) {
      urls.push(match[1]);
    }
    expect(urls.length).toBeGreaterThan(5);

    // Sample 10 URLs (or fewer if sitemap is small)
    const sample = urls.slice(0, 10);
    for (const url of sample) {
      // Convert absolute URL to relative for local testing
      const relativeUrl = url.replace(/https?:\/\/[^/]+/, BASE_URL);
      const response = await request.get(relativeUrl);
      expect(response.status(), `URL ${relativeUrl} should be 200`).toBe(200);
      const body = await response.text();
      expect(body.length, `URL ${relativeUrl} should have content`).toBeGreaterThan(100);
    }
  });
});

// ==================== Cookie Consent ====================

test.describe("AdSense Audit: Cookie consent", () => {
  test("cookie banner appears on fresh desktop visit", async ({ page, context }) => {
    await context.clearCookies();
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // Should show consent banner
    const banner = page.locator(".fixed.bottom-0");
    await expect(banner).toBeVisible({ timeout: 5000 });
    await expect(banner).toContainText("çerez");
  });

  test("cookie banner appears on fresh mobile visit", async ({ page, context }) => {
    await context.clearCookies();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    const banner = page.locator(".fixed.bottom-0");
    await expect(banner).toBeVisible({ timeout: 5000 });
  });
});

// ==================== Policy Pages ====================

test.describe("AdSense Audit: Policy pages", () => {
  const policyPages = [
    { path: "/gizlilik-politikasi", label: "Privacy Policy" },
    { path: "/kullanim-kosullari", label: "Terms of Use" },
    { path: "/cerez-politikasi", label: "Cookie Policy" },
    { path: "/kvkk", label: "KVKK / Data Protection" },
    { path: "/iletisim", label: "Contact" },
    { path: "/hakkimizda", label: "About" },
  ];

  for (const { path, label } of policyPages) {
    test(`${label} (${path}) accessible and has content`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}${path}`);
      expect(response?.status(), `${path} should return 200`).toBe(200);

      // Page should have non-trivial text content (>100 chars)
      const textContent = await page.evaluate(() => document.body.innerText);
      expect(
        textContent.length,
        `${path} should have meaningful text content`
      ).toBeGreaterThan(100);
    });
  }
});

// ==================== Console Errors ====================

test.describe("AdSense Audit: Console errors", () => {
  const keyRoutes = [
    { path: "/", label: "Homepage" },
    { path: "/nasil-oynanir", label: "How to Play" },
    { path: "/sss", label: "FAQ" },
  ];

  for (const { path, label } of keyRoutes) {
    test(`no JS errors on ${label} (${path})`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => {
        // Ignore known benign errors
        if (
          err.message.includes("AdSense") ||
          err.message.includes("hydration") ||
          err.message.includes("adsbygoogle") ||
          err.message.includes("googlesyndication") ||
          err.message.includes("ResizeObserver")
        ) return;
        errors.push(err.message);
      });

      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState("networkidle");

      // Allow a brief moment for async errors
      await page.waitForTimeout(1000);

      expect(
        errors,
        `${path} should have no JS errors (found: ${errors.join(", ")})`
      ).toHaveLength(0);
    });
  }
});

// ==================== Footer Links ====================

test.describe("AdSense Audit: Footer navigation", () => {
  test("footer contains links to policy pages", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");

    // Check footer exists and has policy links
    const footer = page.locator("footer");
    if (await footer.count() > 0) {
      const footerText = await footer.textContent();
      // At least some of these should be present
      const hasPrivacy = footerText?.includes("Gizlilik") || false;
      const hasTerms = footerText?.includes("Kullanım") || false;
      const hasCookie = footerText?.includes("Çerez") || false;
      expect(hasPrivacy || hasTerms || hasCookie).toBe(true);
    }
  });
});
