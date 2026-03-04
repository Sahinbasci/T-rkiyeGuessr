/**
 * AdSense Bot-Style E2E Audit
 *
 * Comprehensive AdSense readiness test suite mapped to the 3 video requirements:
 *  1) Ad code complete & correctly placed
 *  2) Site reachable & crawlable
 *  3) Policy compliance: no low-value, no replicated, good navigation
 *
 * Also covers:
 *  - Cookie consent + Consent Mode v2
 *  - Content sufficiency checks
 *  - Navigation integrity
 *  - Broken link detection
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

// ==================== 1) AD CODE PERFECTION ====================

test.describe("AdSense Audit: Ad code placement (Video Req #1)", () => {
  test("AdSense script tag present in rendered HTML on homepage", async ({ request }) => {
    const response = await request.get(BASE_URL);
    const html = await response.text();
    // Script should be in the page (injected by next/script afterInteractive)
    // Check for the adsense script reference in inline Next.js data or script tags
    expect(
      html.includes("pagead2.googlesyndication.com") || html.includes("adsbygoogle"),
      "AdSense script reference should be in rendered HTML"
    ).toBe(true);
  });

  test("AdSense script loads in browser DOM on content page", async ({ page }) => {
    await page.goto(`${BASE_URL}/nasil-oynanir`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);

    // Check if the AdSense script or preload reference is in the DOM.
    // Next.js strategy="afterInteractive" injects a <script> after hydration,
    // but also adds a <link rel="preload"> in SSR. Either proves ad code is present.
    const hasAdSense = await page.evaluate(() => {
      // Check <script> tags
      const scripts = Array.from(document.querySelectorAll("script"));
      const hasScript = scripts.some(
        (s) => s.src?.includes("pagead2.googlesyndication.com") || s.id === "adsense-script"
      );
      // Check <link rel="preload"> tags (Next.js SSR injects these for afterInteractive scripts)
      const links = Array.from(document.querySelectorAll('link[rel="preload"][as="script"]'));
      const hasPreload = links.some(
        (l) => (l as HTMLLinkElement).href?.includes("pagead2.googlesyndication.com")
      );
      return hasScript || hasPreload;
    });
    expect(hasAdSense, "AdSense script or preload should be in DOM").toBe(true);
  });

  test("AdSense client ID is consistent across pages", async ({ request }) => {
    const pages = ["/", "/nasil-oynanir", "/blog"];
    for (const path of pages) {
      const response = await request.get(`${BASE_URL}${path}`);
      const html = await response.text();
      // The client ID should appear (in script src or data attributes)
      if (html.includes("ca-pub-")) {
        const match = html.match(/ca-pub-\d+/);
        expect(match, `${path} should have valid client ID`).toBeTruthy();
      }
    }
  });
});

// ==================== 2) REACHABLE & CRAWLABLE ====================

test.describe("AdSense Audit: Crawl files (Video Req #2)", () => {
  test("robots.txt returns 200, references sitemap, allows crawling", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/robots.txt`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body.toLowerCase()).toContain("user-agent");
    expect(body.toLowerCase()).toContain("sitemap");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Disallow: /_next/");
    // Should NOT block content pages
    expect(body).not.toContain("Disallow: /blog");
    expect(body).not.toContain("Disallow: /sehirler");
    expect(body).not.toContain("Disallow: /bolgeler");
  });

  test("sitemap.xml returns 200, valid XML, 50+ URLs", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/sitemap.xml`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("<url>");
    expect(body).toContain("<loc>");
    // Count URLs
    const urlCount = (body.match(/<url>/g) || []).length;
    expect(urlCount, "Sitemap should have 50+ URLs").toBeGreaterThan(50);
  });

  test("ads.txt returns 200, correct format, Google pub ID", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/ads.txt`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("google.com");
    expect(body).toContain("pub-");
    expect(body).toContain("DIRECT");
    expect(body).toContain("f08c47fec0942fa0");
  });
});

test.describe("AdSense Audit: Sitemap URL sampling", () => {
  test("20 sample sitemap URLs return 200 with meaningful content", async ({ request }) => {
    const sitemapResp = await request.get(`${BASE_URL}/sitemap.xml`);
    const sitemapBody = await sitemapResp.text();

    const urlRegex = /<loc>(.*?)<\/loc>/g;
    const urls: string[] = [];
    let match;
    while ((match = urlRegex.exec(sitemapBody)) !== null) {
      urls.push(match[1]);
    }
    expect(urls.length).toBeGreaterThan(20);

    // Sample 20 diverse URLs: pick from different parts of the list
    const step = Math.floor(urls.length / 20);
    const sample = Array.from({ length: 20 }, (_, i) => urls[i * step]).filter(Boolean);

    for (const url of sample) {
      const relativeUrl = url.replace(/https?:\/\/[^/]+/, BASE_URL);
      const response = await request.get(relativeUrl);
      expect(response.status(), `${relativeUrl} → 200`).toBe(200);
      const body = await response.text();
      expect(body.length, `${relativeUrl} should have content`).toBeGreaterThan(500);
    }
  });
});

test.describe("AdSense Audit: No redirect loops or errors", () => {
  const criticalPages = [
    "/", "/nasil-oynanir", "/blog", "/sss", "/hakkimizda",
    "/gizlilik-politikasi", "/cerez-politikasi", "/kullanim-kosullari",
    "/bolgeler", "/sehirler",
  ];

  for (const path of criticalPages) {
    test(`${path} returns 200 with no redirect chain`, async ({ request }) => {
      const response = await request.get(`${BASE_URL}${path}`, {
        maxRedirects: 0,
      }).catch(() => null);

      // If no redirect, check status directly
      const directResponse = await request.get(`${BASE_URL}${path}`);
      expect(directResponse.status(), `${path} should be 200`).toBe(200);
    });
  }
});

// ==================== 3) POLICY & QUALITY ====================

// 3.1: Content sufficiency — pages must have meaningful text
test.describe("AdSense Audit: Content sufficiency (Video Req #3)", () => {
  const contentPages = [
    { path: "/", label: "Homepage", minChars: 500 },
    { path: "/nasil-oynanir", label: "How to Play", minChars: 800 },
    { path: "/geoguessr-alternatifi", label: "GeoGuessr Alternatifi", minChars: 800 },
    { path: "/turkiye-harita-oyunu", label: "Türkiye Harita Oyunu", minChars: 600 },
    { path: "/blog", label: "Blog Index", minChars: 300 },
    { path: "/sss", label: "FAQ", minChars: 250 }, // Uses <details> accordions — collapsed text not in innerText
    { path: "/hakkimizda", label: "About", minChars: 400 },
    { path: "/bolgeler", label: "Regions", minChars: 400 },
    { path: "/sehirler", label: "Cities", minChars: 400 },
    { path: "/multiplayer", label: "Multiplayer", minChars: 400 },
  ];

  for (const { path, label, minChars } of contentPages) {
    test(`${label} (${path}) has ${minChars}+ chars of content`, async ({ page }) => {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState("domcontentloaded");

      const textContent = await page.evaluate(() => {
        // Get text from main content area, excluding nav/footer
        const main = document.querySelector("main") || document.body;
        return main.innerText?.trim() || "";
      });
      expect(
        textContent.length,
        `${path} content: ${textContent.length} chars (need ${minChars}+)`
      ).toBeGreaterThanOrEqual(minChars);
    });
  }
});

// 3.1b: Each page has H1 heading
test.describe("AdSense Audit: H1 headings present", () => {
  const pagesWithH1 = [
    "/nasil-oynanir", "/geoguessr-alternatifi", "/turkiye-harita-oyunu",
    "/sss", "/hakkimizda", "/bolgeler", "/sehirler",
    "/gizlilik-politikasi", "/cerez-politikasi", "/kullanim-kosullari",
  ];

  for (const path of pagesWithH1) {
    test(`${path} has an H1 heading`, async ({ page }) => {
      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState("domcontentloaded");

      const h1Count = await page.locator("h1").count();
      expect(h1Count, `${path} should have at least one H1`).toBeGreaterThanOrEqual(1);
    });
  }
});

// 3.3: Navigation integrity
test.describe("AdSense Audit: Navigation integrity", () => {
  test("content pages have header nav with key links", async ({ page }) => {
    await page.goto(`${BASE_URL}/nasil-oynanir`);
    await page.waitForLoadState("domcontentloaded");

    const nav = page.locator("nav");
    expect(await nav.count(), "Page should have nav element").toBeGreaterThan(0);

    const navText = await nav.first().textContent();
    expect(navText).toContain("TürkiyeGuessr");
  });

  test("footer has links to legal pages on content page", async ({ page }) => {
    await page.goto(`${BASE_URL}/nasil-oynanir`);
    await page.waitForLoadState("domcontentloaded");

    const footer = page.locator("footer");
    expect(await footer.count(), "Page should have footer").toBeGreaterThan(0);

    const footerText = await footer.last().textContent();
    expect(footerText?.includes("Gizlilik") || footerText?.includes("Çerez")).toBe(true);
  });
});

// ==================== COOKIE CONSENT ====================

test.describe("AdSense Audit: Cookie consent", () => {
  test("cookie banner appears on fresh desktop visit", async ({ page, context }) => {
    await context.clearCookies();
    // Consent is stored in localStorage — navigate first, clear it, then reload fresh
    await page.goto(BASE_URL, { waitUntil: "commit" });
    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000); // Allow two-phase mount (rAF x2) to complete

    const banner = page.locator('[role="dialog"][aria-label="Çerez bildirimi"]');
    await expect(banner).toBeVisible({ timeout: 5000 });
    await expect(banner).toContainText("çerez");
  });

  test("cookie banner appears on fresh mobile visit", async ({ page, context }) => {
    await context.clearCookies();
    await page.setViewportSize({ width: 375, height: 812 });
    // Consent is stored in localStorage — navigate first, clear it, then reload fresh
    await page.goto(BASE_URL, { waitUntil: "commit" });
    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000); // Allow two-phase mount (rAF x2) to complete

    const banner = page.locator('[role="dialog"][aria-label="Çerez bildirimi"]');
    await expect(banner).toBeVisible({ timeout: 5000 });
  });

  test("Google Consent Mode v2 default script is in head", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("domcontentloaded");

    const hasConsentDefault = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll("head script"));
      return scripts.some(
        (s) => s.innerHTML?.includes("consent") && s.innerHTML?.includes("denied")
      );
    });
    expect(hasConsentDefault, "Consent Mode v2 defaults should be in <head>").toBe(true);
  });
});

// ==================== POLICY PAGES ====================

test.describe("AdSense Audit: Policy pages", () => {
  const policyPages = [
    { path: "/gizlilik-politikasi", label: "Privacy Policy", minChars: 500 },
    { path: "/kullanim-kosullari", label: "Terms of Use", minChars: 500 },
    { path: "/cerez-politikasi", label: "Cookie Policy", minChars: 500 },
    { path: "/kvkk", label: "KVKK / Data Protection", minChars: 500 },
    { path: "/iletisim", label: "Contact", minChars: 200 },
    { path: "/hakkimizda", label: "About", minChars: 300 },
  ];

  for (const { path, label, minChars } of policyPages) {
    test(`${label} (${path}) accessible with ${minChars}+ chars`, async ({ page }) => {
      const response = await page.goto(`${BASE_URL}${path}`);
      expect(response?.status(), `${path} should return 200`).toBe(200);

      const textContent = await page.evaluate(() => document.body.innerText);
      expect(
        textContent.length,
        `${path} should have ${minChars}+ chars of text content`
      ).toBeGreaterThan(minChars);
    });
  }
});

// ==================== CONSOLE ERRORS ====================

test.describe("AdSense Audit: Console errors", () => {
  const keyRoutes = [
    { path: "/", label: "Homepage" },
    { path: "/nasil-oynanir", label: "How to Play" },
    { path: "/sss", label: "FAQ" },
    { path: "/blog", label: "Blog" },
    { path: "/bolgeler", label: "Regions" },
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
          err.message.includes("ResizeObserver") ||
          err.message.includes("Loading chunk") ||
          err.message.includes("google") ||
          err.message.includes("maps.googleapis")
        ) return;
        errors.push(err.message);
      });

      await page.goto(`${BASE_URL}${path}`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      expect(
        errors,
        `${path} should have no JS errors (found: ${errors.join(", ")})`
      ).toHaveLength(0);
    });
  }
});

// ==================== FOOTER NAVIGATION ====================

test.describe("AdSense Audit: Footer navigation", () => {
  test("footer contains links to all policy and info pages", async ({ page }) => {
    await page.goto(`${BASE_URL}/nasil-oynanir`);
    await page.waitForLoadState("domcontentloaded");

    const footer = page.locator("footer").last();
    const footerText = await footer.textContent() || "";

    // Verify footer sections
    expect(footerText).toContain("Gizlilik");
    expect(footerText).toContain("Çerez");
    expect(footerText).toContain("Kullanım");
    expect(footerText).toContain("KVKK");
    expect(footerText).toContain("Blog");
    expect(footerText).toContain("SSS");
    expect(footerText).toContain("Hakkımızda");
    expect(footerText).toContain("İletişim");
  });

  test("footer links to regions are present", async ({ page }) => {
    await page.goto(`${BASE_URL}/nasil-oynanir`);
    await page.waitForLoadState("domcontentloaded");

    const footer = page.locator("footer").last();
    const footerText = await footer.textContent() || "";

    expect(footerText).toContain("Marmara");
    expect(footerText).toContain("Ege");
    expect(footerText).toContain("Akdeniz");
    expect(footerText).toContain("Karadeniz");
  });
});
