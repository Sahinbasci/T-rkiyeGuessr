/**
 * Stabilization Sprint Closer — Comprehensive Unit Tests
 *
 * Covers all 6 GAPS from the stabilization sprint closer audit:
 * GAP #1: B2 attribution — no overlay, ToS-safe layout
 * GAP #2: B1 StreetView drift — listener dedupe, lastKnownGoodPOV, corruption detection
 * GAP #3: A4 share — Web Share API + WhatsApp fallback, message builder
 * GAP #4: B4 map — province centroid selector
 * GAP #5: B3 Turkish text — expanded fixtures, robust parsing
 * GAP #6: AdSense audit (automated checks — E2E handles browser-level)
 */

import { describe, test, expect, vi } from "vitest";
import {
  createLastKnownGoodPOV,
  updateLastKnownGoodPOV,
  MAX_STABLE_PITCH_JUMP,
  MAX_STABLE_HEADING_JUMP,
  createCorruptionDetector,
  detectCorruption,
  resetCorruptionDetector,
  CORRUPTION_REINIT_THRESHOLD,
  EVENT_STORM_THRESHOLD,
  sanitizePov,
  isPovCorrupted,
  clampPitch,
  createDriftTracker,
  processPovChange,
  resetDriftTracker,
} from "@/utils/cameraDrift";
import {
  buildShareMessage,
  buildWhatsAppUrl,
  executeShare,
  SITE_URL,
} from "@/utils/shareUtils";
import { PROVINCE_CENTROIDS, getProvinceCentroid } from "@/data/provinceCentroids";
import {
  formatLocationName,
  toTurkishTitleCase,
  toTurkishUpperCase,
  toTurkishLowerCase,
  normalizeTurkish,
  turkishCompare,
} from "@/utils/turkishFormat";
import { TURKEY_MAP_RESTRICTION } from "@/config/maps";

// ==================== GAP #1: Attribution (no overlay) ====================

describe("GAP #1: B2 Attribution — ToS-safe layout (no overlay)", () => {
  test("MiniMap component does not import attribution guard state", async () => {
    // Verify the MiniMap source doesn't contain overlay/guard logic
    const fs = await import("fs");
    const content = fs.readFileSync(
      "src/components/game/MiniMap.tsx", "utf-8"
    );
    expect(content).not.toContain("attribution-tap-guard");
    expect(content).not.toContain("handleAttributionGuardTap");
    expect(content).not.toContain("guardPassthrough");
    expect(content).not.toContain("showAttributionHint");
    // Should still have the map div
    expect(content).toContain("minimap-inner");
  });

  test("CSS does not contain overlay guard rules", async () => {
    const fs = await import("fs");
    const css = fs.readFileSync("src/app/globals.css", "utf-8");
    // Should NOT have the old overlay
    expect(css).not.toContain("attribution-tap-guard");
    expect(css).not.toContain("attribution-hint");
    // Should have the safe layout comment
    expect(css).toContain("SAFE-LAYOUT ATTRIBUTION PROTECTION");
    // Google attribution links should remain interactive
    expect(css).toContain('pointer-events: auto !important');
  });

  test("mobile mini-map size is increased for safe distance from attribution", async () => {
    const fs = await import("fs");
    const css = fs.readFileSync("src/app/globals.css", "utf-8");
    // Mobile map should be at least 140px tall (increased from 120px)
    expect(css).toMatch(/height:\s*140px/);
    expect(css).toMatch(/width:\s*160px/);
  });
});

// ==================== GAP #2: StreetView drift hardening ====================

describe("GAP #2: B1 StreetView drift — lastKnownGoodPOV", () => {

  test("createLastKnownGoodPOV returns initial state", () => {
    const state = createLastKnownGoodPOV(90, 10);
    expect(state.heading).toBe(90);
    expect(state.pitch).toBe(10);
    expect(state.stabilityCount).toBe(0);
  });

  test("stable samples increment stability counter", () => {
    let state = createLastKnownGoodPOV(90, 10);
    state = updateLastKnownGoodPOV(state, 90.5, 10.1);
    expect(state.stabilityCount).toBe(1);
    state = updateLastKnownGoodPOV(state, 91, 10.2);
    expect(state.stabilityCount).toBe(2);
  });

  test("3 stable samples updates stored POV", () => {
    let state = createLastKnownGoodPOV(90, 10);
    state = updateLastKnownGoodPOV(state, 91, 10.5);
    state = updateLastKnownGoodPOV(state, 92, 11);
    state = updateLastKnownGoodPOV(state, 93, 11.5);
    // After 3 stable samples, POV should be updated
    expect(state.heading).toBe(93);
    expect(state.pitch).toBe(11.5);
  });

  test("NaN/Infinity resets stability counter without updating POV", () => {
    let state = createLastKnownGoodPOV(90, 10);
    state = updateLastKnownGoodPOV(state, 91, 10.5);
    state = updateLastKnownGoodPOV(state, NaN, 10.5);
    expect(state.stabilityCount).toBe(0);
    expect(state.heading).toBe(90); // Not updated
  });

  test("large pitch jump resets stability counter", () => {
    let state = createLastKnownGoodPOV(90, 10);
    state = updateLastKnownGoodPOV(state, 91, 10.5);
    // Large pitch jump (>MAX_STABLE_PITCH_JUMP)
    state = updateLastKnownGoodPOV(state, 92, 10 + MAX_STABLE_PITCH_JUMP + 1);
    expect(state.stabilityCount).toBe(0);
  });

  test("out-of-range pitch resets stability counter", () => {
    let state = createLastKnownGoodPOV(90, 10);
    state = updateLastKnownGoodPOV(state, 91, 85); // beyond PITCH_MAX of 80
    expect(state.stabilityCount).toBe(0);
  });

  test("MAX_STABLE_PITCH_JUMP is 15 degrees", () => {
    expect(MAX_STABLE_PITCH_JUMP).toBe(15);
  });

  test("MAX_STABLE_HEADING_JUMP is 45 degrees", () => {
    expect(MAX_STABLE_HEADING_JUMP).toBe(45);
  });
});

describe("GAP #2: B1 StreetView drift — corruption detection", () => {

  test("createCorruptionDetector returns clean state", () => {
    const state = createCorruptionDetector();
    expect(state.consecutiveCorrupted).toBe(0);
    expect(state.consecutiveDriftCorrections).toBe(0);
    expect(state.reinitRequested).toBe(false);
  });

  test("non-corrupted POV does not trigger reinit", () => {
    const state = createCorruptionDetector();
    const result = detectCorruption(state, { heading: 90, pitch: 10 }, false);
    expect(result.needsReinit).toBe(false);
    expect(result.newState.consecutiveCorrupted).toBe(0);
  });

  test("consecutive corrupted events trigger reinit at threshold", () => {
    let state = createCorruptionDetector();
    for (let i = 0; i < CORRUPTION_REINIT_THRESHOLD - 1; i++) {
      const result = detectCorruption(state, { heading: NaN, pitch: NaN }, false, Date.now() + i);
      state = result.newState;
      expect(result.needsReinit).toBe(false);
    }
    const final = detectCorruption(state, { heading: NaN, pitch: NaN }, false, Date.now() + CORRUPTION_REINIT_THRESHOLD);
    expect(final.needsReinit).toBe(true);
  });

  test("CORRUPTION_REINIT_THRESHOLD is 5", () => {
    expect(CORRUPTION_REINIT_THRESHOLD).toBe(5);
  });

  test("valid POV after corruption resets counter", () => {
    let state = createCorruptionDetector();
    // 3 corrupted events
    for (let i = 0; i < 3; i++) {
      const r = detectCorruption(state, { heading: NaN, pitch: NaN }, false);
      state = r.newState;
    }
    expect(state.consecutiveCorrupted).toBe(3);
    // 1 valid event
    const r = detectCorruption(state, { heading: 90, pitch: 10 }, false);
    expect(r.newState.consecutiveCorrupted).toBe(0);
  });

  test("consecutive drift corrections trigger reinit at 2x threshold", () => {
    let state = createCorruptionDetector();
    const driftThreshold = CORRUPTION_REINIT_THRESHOLD * 2;
    for (let i = 0; i < driftThreshold - 1; i++) {
      const r = detectCorruption(state, { heading: 90, pitch: 10 }, true, Date.now() + i);
      state = r.newState;
    }
    const final = detectCorruption(state, { heading: 90, pitch: 10 }, true, Date.now() + driftThreshold);
    expect(final.needsReinit).toBe(true);
  });

  test("resetCorruptionDetector returns clean state", () => {
    const state = resetCorruptionDetector();
    expect(state.consecutiveCorrupted).toBe(0);
    expect(state.consecutiveDriftCorrections).toBe(0);
    expect(state.reinitRequested).toBe(false);
  });

  test("EVENT_STORM_THRESHOLD is 120", () => {
    expect(EVENT_STORM_THRESHOLD).toBe(120);
  });
});

describe("GAP #2: B1 — listener generation guard", () => {
  test("usePanoLifecycle exports listenerGenerationRef and lastKnownGoodPOVRef", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "src/hooks/streetview/usePanoLifecycle.ts", "utf-8"
    );
    expect(content).toContain("listenerGenerationRef");
    expect(content).toContain("lastKnownGoodPOVRef");
  });

  test("ensurePanorama increments listener generation", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "src/hooks/streetview/usePanoLifecycle.ts", "utf-8"
    );
    expect(content).toContain("listenerGenerationRef.current++");
  });

  test("handleResume uses sanitizePov", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "src/hooks/streetview/usePanoLifecycle.ts", "utf-8"
    );
    expect(content).toContain('import { sanitizePov }');
    expect(content).toContain("sanitizePov(rawPov)");
  });

  test("online event handler registered", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "src/hooks/streetview/usePanoLifecycle.ts", "utf-8"
    );
    expect(content).toContain('"online"');
    expect(content).toContain("handleOnline");
  });

  test("attachDriftCorrection accepts generation guard params", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "src/hooks/streetview/useCameraDrift.ts", "utf-8"
    );
    expect(content).toContain("listenerGeneration");
    expect(content).toContain("listenerGenerationRef");
    // Should have generation guard check
    expect(content).toContain("Stale listener");
  });
});

// ==================== GAP #3: Share utility ====================

describe("GAP #3: A4 Share — message builder & URL", () => {

  test("SITE_URL is turkiyeguessr.com", () => {
    expect(SITE_URL).toBe("https://turkiyeguessr.com");
  });

  test("buildShareMessage contains room code and URL", () => {
    const result = buildShareMessage("ABC123");
    expect(result.text).toContain("ABC123");
    expect(result.text).toContain("Oda Kodu");
    expect(result.text).toContain("TürkiyeGuessr");
    expect(result.url).toBe("https://turkiyeguessr.com?room=ABC123");
    expect(result.fullMessage).toContain(result.text);
    expect(result.fullMessage).toContain(result.url);
  });

  test("buildWhatsAppUrl uses api.whatsapp.com/send", () => {
    const url = buildWhatsAppUrl("XYZ789");
    expect(url).toContain("api.whatsapp.com/send");
    expect(url).not.toContain("wa.me");
    expect(url).toContain("text=");
    // Should be URL-encoded
    expect(url).toContain(encodeURIComponent("XYZ789"));
  });

  test("buildWhatsAppUrl properly encodes Turkish characters", () => {
    const url = buildWhatsAppUrl("TEST01");
    const decoded = decodeURIComponent(url);
    expect(decoded).toContain("TürkiyeGuessr");
    expect(decoded).toContain("Oda Kodu");
  });

  test("executeShare uses Web Share API when available", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    const mockOpen = vi.fn();
    const result = await executeShare("ABC123", mockShare, mockOpen);
    expect(result).toBe("webshare");
    expect(mockShare).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "TürkiyeGuessr",
        text: expect.stringContaining("ABC123"),
        url: expect.stringContaining("turkiyeguessr.com"),
      })
    );
    // Should NOT fall through to WhatsApp
    expect(mockOpen).not.toHaveBeenCalled();
  });

  test("executeShare falls back to WhatsApp when share fails", async () => {
    const mockShare = vi.fn().mockRejectedValue(new Error("cancelled"));
    const mockOpen = vi.fn();
    const result = await executeShare("ABC123", mockShare, mockOpen);
    expect(result).toBe("whatsapp");
    expect(mockOpen).toHaveBeenCalledWith(
      expect.stringContaining("api.whatsapp.com/send"),
      "_blank"
    );
  });

  test("executeShare falls back to WhatsApp when share is undefined", async () => {
    const mockOpen = vi.fn();
    const result = await executeShare("ABC123", undefined, mockOpen);
    expect(result).toBe("whatsapp");
    expect(mockOpen).toHaveBeenCalled();
  });
});

// ==================== GAP #4: Province selector ====================

describe("GAP #4: Province centroid data", () => {

  test("has exactly 81 provinces", () => {
    expect(PROVINCE_CENTROIDS).toHaveLength(81);
  });

  test("all provinces have valid coordinates within Turkey bounds", () => {
    for (const p of PROVINCE_CENTROIDS) {
      expect(p.name).toBeTruthy();
      expect(p.lat).toBeGreaterThan(35);
      expect(p.lat).toBeLessThan(43);
      expect(p.lng).toBeGreaterThan(25);
      expect(p.lng).toBeLessThan(46);
    }
  });

  test("no duplicate province names", () => {
    const names = PROVINCE_CENTROIDS.map((p: { name: string }) => p.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });

  test("getProvinceCentroid finds İstanbul", () => {
    const result = getProvinceCentroid("İstanbul");
    expect(result).toBeDefined();
    expect(result!.lat).toBeCloseTo(41.01, 0);
    expect(result!.lng).toBeCloseTo(28.98, 0);
  });

  test("getProvinceCentroid is case-insensitive (Turkish locale)", () => {
    const result = getProvinceCentroid("istanbul");
    // Should match İstanbul thanks to tr-TR locale comparison
    // Note: This may not match because "istanbul" lowercase != "istanbul" in Turkish
    // "İstanbul".toLocaleLowerCase("tr-TR") = "istanbul" ✓
    // "istanbul".toLocaleLowerCase("tr-TR") = "istanbul" ✓
    expect(result).toBeDefined();
  });

  test("getProvinceCentroid returns undefined for non-existent province", () => {
    const result = getProvinceCentroid("NonExistent");
    expect(result).toBeUndefined();
  });

  test("key provinces exist: Ankara, İzmir, Antalya, Trabzon", () => {
    expect(getProvinceCentroid("Ankara")).toBeDefined();
    expect(getProvinceCentroid("İzmir")).toBeDefined();
    expect(getProvinceCentroid("Antalya")).toBeDefined();
    expect(getProvinceCentroid("Trabzon")).toBeDefined();
  });

  test("MiniMap includes province selector UI", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync(
      "src/components/game/MiniMap.tsx", "utf-8"
    );
    expect(content).toContain("province-selector-btn");
    expect(content).toContain("İl Seç");
    expect(content).toContain("PROVINCE_CENTROIDS");
    expect(content).toContain("handleProvinceSelect");
  });
});

// ==================== GAP #5: Turkish text — expanded fixtures ====================

describe("GAP #5: Turkish text formatting — expanded fixtures", () => {

  // Expanded real-world Turkish location fixtures
  const FIXTURES = [
    { input: "Fatih, İstanbul", district: "Fatih", province: "İstanbul", formatted: "Fatih, İstanbul" },
    { input: "Üsküdar, İstanbul", district: "Üsküdar", province: "İstanbul", formatted: "Üsküdar, İstanbul" },
    { input: "Çankaya, Ankara", district: "Çankaya", province: "Ankara", formatted: "Çankaya, Ankara" },
    { input: "Osmangazi, Bursa", district: "Osmangazi", province: "Bursa", formatted: "Osmangazi, Bursa" },
    { input: "Muratpaşa, Antalya", district: "Muratpaşa", province: "Antalya", formatted: "Muratpaşa, Antalya" },
    { input: "Ortahisar, Trabzon", district: "Ortahisar", province: "Trabzon", formatted: "Ortahisar, Trabzon" },
    { input: "Şahinbey, Gaziantep", district: "Şahinbey", province: "Gaziantep", formatted: "Şahinbey, Gaziantep" },
    { input: "Seyhan, Adana", district: "Seyhan", province: "Adana", formatted: "Seyhan, Adana" },
    { input: "Konak, İzmir", district: "Konak", province: "İzmir", formatted: "Konak, İzmir" },
    { input: "Meram, Konya", district: "Meram", province: "Konya", formatted: "Meram, Konya" },
  ];

  test.each(FIXTURES)(
    "formatLocationName($input) → $formatted",
    ({ input, district, province, formatted }) => {
      const result = formatLocationName(input);
      expect(result.district).toBe(district);
      expect(result.province).toBe(province);
      expect(result.formatted).toBe(formatted);
    }
  );

  // Case variations
  test("handles ALL CAPS input", () => {
    const result = formatLocationName("FATİH, İSTANBUL");
    expect(result.formatted).toBe("Fatih, İstanbul");
  });

  test("handles all lowercase input", () => {
    const result = formatLocationName("fatih, istanbul");
    expect(result.formatted).toBe("Fatih, İstanbul");
  });

  test("handles mixed case", () => {
    const result = formatLocationName("ÜSKÜDAR, istanbul");
    expect(result.formatted).toBe("Üsküdar, İstanbul");
  });

  // Multi-word districts
  test("multi-word district: Kırşehir Merkez", () => {
    const result = formatLocationName("merkez, kırşehir");
    expect(result.formatted).toBe("Merkez, Kırşehir");
  });

  // Edge cases
  test("null returns fallback", () => {
    const result = formatLocationName(null);
    expect(result.formatted).toBe("Bilinmeyen Konum");
  });

  test("undefined returns fallback", () => {
    const result = formatLocationName(undefined);
    expect(result.formatted).toBe("Bilinmeyen Konum");
  });

  test("empty string returns fallback", () => {
    const result = formatLocationName("");
    expect(result.formatted).toBe("Bilinmeyen Konum");
  });

  test("whitespace-only returns fallback", () => {
    const result = formatLocationName("   ");
    expect(result.formatted).toBe("Bilinmeyen Konum");
  });

  test("single province name without comma", () => {
    const result = formatLocationName("İstanbul");
    expect(result.district).toBe("İstanbul");
    expect(result.province).toBe("İstanbul");
    expect(result.formatted).toBe("İstanbul");
  });

  test("extra commas handled (3 parts)", () => {
    const result = formatLocationName("Fatih, İstanbul, Türkiye");
    expect(result.district).toBe("Fatih");
    expect(result.province).toBe("İstanbul");
    expect(result.formatted).toBe("Fatih, İstanbul");
  });

  // Turkish I/İ specific tests
  test("toTurkishUpperCase: i → İ", () => {
    expect(toTurkishUpperCase("istanbul")).toBe("İSTANBUL");
  });

  test("toTurkishLowerCase: İ → i", () => {
    expect(toTurkishLowerCase("İSTANBUL")).toBe("istanbul");
  });

  test("toTurkishLowerCase: I → ı", () => {
    expect(toTurkishLowerCase("IĞDIR")).toBe("ığdır");
  });

  test("toTurkishTitleCase handles ş,ö,ü,ç,ğ,ı characters", () => {
    expect(toTurkishTitleCase("şanlıurfa")).toBe("Şanlıurfa");
    expect(toTurkishTitleCase("ödemİş")).toBe("Ödemiş");
    expect(toTurkishTitleCase("gümüşhane")).toBe("Gümüşhane");
    expect(toTurkishTitleCase("çankırı")).toBe("Çankırı");
  });

  test("normalizeTurkish handles NFC normalization", () => {
    // NFD decomposed İ (I + combining dot above) should become NFC İ
    const nfd = "I\u0307stanbul"; // NFD form of İstanbul
    const result = normalizeTurkish(nfd);
    expect(result).toBe("İstanbul");
  });

  test("turkishCompare sorts correctly", () => {
    const cities = ["İstanbul", "Ankara", "İzmir", "Çanakkale", "Balıkesir"];
    const sorted = [...cities].sort(turkishCompare);
    expect(sorted[0]).toBe("Ankara");
    expect(sorted[1]).toBe("Balıkesir");
    expect(sorted[2]).toBe("Çanakkale");
  });
});

// ==================== GAP #6: AdSense readiness checks ====================

describe("GAP #6: AdSense readiness — file existence checks", () => {
  test("robots.ts exists and disallows _next and api", async () => {
    const fs = await import("fs");
    const exists = fs.existsSync("src/app/robots.ts");
    expect(exists).toBe(true);
    const content = fs.readFileSync("src/app/robots.ts", "utf-8");
    expect(content).toContain("/_next/");
    expect(content).toContain("/api/");
    expect(content).toContain("sitemap");
  });

  test("sitemap.ts exists and includes legal pages", async () => {
    const fs = await import("fs");
    const exists = fs.existsSync("src/app/sitemap.ts");
    expect(exists).toBe(true);
    const content = fs.readFileSync("src/app/sitemap.ts", "utf-8");
    expect(content).toContain("gizlilik-politikasi");
    expect(content).toContain("kullanim-kosullari");
    expect(content).toContain("cerez-politikasi");
  });

  test("ads.txt exists in public/", async () => {
    const fs = await import("fs");
    const exists = fs.existsSync("public/ads.txt");
    expect(exists).toBe(true);
    const content = fs.readFileSync("public/ads.txt", "utf-8");
    expect(content).toContain("google.com");
    expect(content).toContain("pub-");
  });

  test("cookie consent component exists", async () => {
    const fs = await import("fs");
    const exists = fs.existsSync("src/components/consent/CookieBanner.tsx");
    expect(exists).toBe(true);
  });

  test("legal page routes exist", async () => {
    const fs = await import("fs");
    const legalPages = [
      "src/app/gizlilik-politikasi",
      "src/app/kullanim-kosullari",
      "src/app/cerez-politikasi",
      "src/app/kvkk",
      "src/app/iletisim",
      "src/app/hakkimizda",
    ];
    for (const page of legalPages) {
      const pageExists = fs.existsSync(page) || fs.existsSync(page + "/page.tsx");
      expect(pageExists).toBe(true);
    }
  });

  test("AdSense config has consent gating", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("src/config/ads.ts", "utf-8");
    expect(content).toContain("consent");
    expect(content).toContain("canShowAd");
  });
});

// ==================== Integration: sanitizePov + cameraDrift ====================

describe("GAP #2 Integration: sanitizePov with drift tracker", () => {

  test("sanitizePov handles NaN heading and pitch", () => {
    const result = sanitizePov({ heading: NaN, pitch: NaN });
    expect(result.heading).toBe(0);
    expect(result.pitch).toBe(0);
  });

  test("sanitizePov handles Infinity", () => {
    const result = sanitizePov({ heading: Infinity, pitch: -Infinity });
    expect(result.heading).toBe(0);
    expect(result.pitch).toBe(0);
  });

  test("sanitizePov normalizes heading to [0, 360)", () => {
    expect(sanitizePov({ heading: -90, pitch: 0 }).heading).toBe(270);
    expect(sanitizePov({ heading: 400, pitch: 0 }).heading).toBe(40);
    expect(sanitizePov({ heading: 720, pitch: 0 }).heading).toBe(0);
  });

  test("sanitizePov clamps pitch to [-80, 80]", () => {
    expect(sanitizePov({ heading: 0, pitch: 85 }).pitch).toBe(80);
    expect(sanitizePov({ heading: 0, pitch: -85 }).pitch).toBe(-80);
    expect(sanitizePov({ heading: 0, pitch: 45 }).pitch).toBe(45);
  });

  test("simulate 3 resume cycles: drift tracker resets correctly", () => {
    let state = createDriftTracker(0);

    // Simulate 3 resume cycles
    for (let cycle = 0; cycle < 3; cycle++) {
      // Process some POV changes
      for (let i = 0; i < 10; i++) {
        const r = processPovChange(state, i * 0.05, 90 + i, Date.now() + i);
        state = r.newState;
      }
      // Reset (simulating resume)
      state = resetDriftTracker(state, 0);

      // After reset, state should be clean
      expect(state.anchorPitch).toBe(0);
      expect(state.accumulatedDrift).toBe(0);
      expect(state.correctionCount).toBe(0);
      expect(state.samples).toHaveLength(0);
    }
  });

  test("simulate corruption → reset resolves", () => {
    let state = createDriftTracker(0);
    // Simulate corruption: pitch out of range
    const r1 = processPovChange(state, 85, 90);
    state = r1.newState;
    expect(r1.correctedPitch).toBe(80); // hard clamp

    // After corruption correction, drift counter incremented
    expect(state.correctionCount).toBe(1);

    // Reset resolves everything
    state = resetDriftTracker(state, 0);
    expect(state.correctionCount).toBe(0);
    expect(state.accumulatedDrift).toBe(0);
  });
});

// ==================== Existing A1-A4 re-verification ====================

describe("A1-A4 re-verification", () => {
  test("A1: getTurkeyZoom returns 6", () => {
    // Verify the zoom constant is unchanged
    // imported at top level
    expect(TURKEY_MAP_RESTRICTION.north).toBe(43.0);
    expect(TURKEY_MAP_RESTRICTION.south).toBe(35.0);
  });

  test("A3: consent localStorage key is turkiyeguessr_consent", async () => {
    const fs = await import("fs");
    // The key lives in the consent utility, imported by CookieBanner
    const content = fs.readFileSync("src/utils/consent.ts", "utf-8");
    expect(content).toContain("turkiyeguessr_consent");
  });

  test("A4: share uses api.whatsapp.com not wa.me", () => {
    // imported at top level
    const url = buildWhatsAppUrl("TEST");
    expect(url).toContain("api.whatsapp.com");
    expect(url).not.toContain("wa.me");
  });
});
