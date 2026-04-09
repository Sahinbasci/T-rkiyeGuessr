/**
 * Monetization Pipeline Tests
 *
 * Covers:
 *  1. Consent gating — no ad rendering before consent (script loads unconditionally; Consent Mode v2 defaults to "denied")
 *  2. Gameplay ad blocking — no ads during "playing"
 *  3. CLS — ad containers have min-height
 *  4. Analytics events — correct events fired
 *  5. Premium flag — no ads when premium=true
 *  6. Consent mode v2 — all 4 signals properly set
 *  7. ads.txt correctness
 *  8. Ad error handling / telemetry
 */

import { describe, it, expect, beforeEach, vi, afterEach, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";

// ── Mock localStorage & sessionStorage ──────────────────────────────────────

let store: Record<string, string> = {};

const mockStorage: Storage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = String(value); },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { store = {}; },
  get length() { return Object.keys(store).length; },
  key: (index: number) => Object.keys(store)[index] ?? null,
};

let sessionStore: Record<string, string> = {};

const mockSessionStorage: Storage = {
  getItem: (key: string) => sessionStore[key] ?? null,
  setItem: (key: string, value: string) => { sessionStore[key] = String(value); },
  removeItem: (key: string) => { delete sessionStore[key]; },
  clear: () => { sessionStore = {}; },
  get length() { return Object.keys(sessionStore).length; },
  key: (index: number) => Object.keys(sessionStore)[index] ?? null,
};

beforeAll(() => {
  vi.stubGlobal("localStorage", mockStorage);
  vi.stubGlobal("sessionStorage", mockSessionStorage);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

function clearStorage() {
  store = {};
  sessionStore = {};
}

// ── 1. Consent Gating ──────────────────────────────────────────────────────

describe("Consent Gating", () => {
  beforeEach(() => {
    clearStorage();
    vi.resetModules();
  });

  it("isMarketingAllowed returns false when no consent stored", async () => {
    const { isMarketingAllowed } = await import("@/utils/consent");
    expect(isMarketingAllowed()).toBe(false);
  });

  it("isMarketingAllowed returns false when consent is required-only", async () => {
    const { rejectOptional, isMarketingAllowed } = await import("@/utils/consent");
    rejectOptional();
    expect(isMarketingAllowed()).toBe(false);
  });

  it("isMarketingAllowed returns true after acceptAll", async () => {
    const { acceptAll, isMarketingAllowed } = await import("@/utils/consent");
    acceptAll();
    expect(isMarketingAllowed()).toBe(true);
  });

  it("isAnalyticsAllowed returns false when no consent stored", async () => {
    const { isAnalyticsAllowed } = await import("@/utils/consent");
    expect(isAnalyticsAllowed()).toBe(false);
  });

  it("isAnalyticsAllowed returns true after acceptAll", async () => {
    const { acceptAll, isAnalyticsAllowed } = await import("@/utils/consent");
    acceptAll();
    expect(isAnalyticsAllowed()).toBe(true);
  });

  it("canShowAd returns false when marketing not allowed", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ADS", "true");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-1234567890");

    const { canShowAd } = await import("@/config/ads");
    expect(canShowAd()).toBe(false);

    vi.unstubAllEnvs();
  });

  it("canShowAd returns true when ads enabled and marketing allowed", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ADS", "true");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-1234567890");

    const { acceptAll } = await import("@/utils/consent");
    acceptAll();

    const { canShowAd } = await import("@/config/ads");
    expect(canShowAd()).toBe(true);

    vi.unstubAllEnvs();
  });

  it("consent changed event is dispatched on setConsent", async () => {
    const { setConsent, CONSENT_CHANGED_EVENT } = await import("@/utils/consent");
    const handler = vi.fn();
    window.addEventListener(CONSENT_CHANGED_EVENT, handler);

    setConsent({ necessary: true, analytics: true, marketing: true });
    expect(handler).toHaveBeenCalledTimes(1);

    window.removeEventListener(CONSENT_CHANGED_EVENT, handler);
  });
});

// ── 2. Gameplay Ad Blocking ─────────────────────────────────────────────────

describe("Gameplay Ad Blocking", () => {
  beforeEach(() => {
    clearStorage();
    vi.resetModules();
  });

  it("canShowAd returns false during playing status", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ADS", "true");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-1234567890");

    const { acceptAll } = await import("@/utils/consent");
    acceptAll();

    const { canShowAd } = await import("@/config/ads");
    expect(canShowAd("playing")).toBe(false);

    vi.unstubAllEnvs();
  });

  it("canShowAd returns true during waiting status", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ADS", "true");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-1234567890");

    const { acceptAll } = await import("@/utils/consent");
    acceptAll();

    const { canShowAd } = await import("@/config/ads");
    expect(canShowAd("waiting")).toBe(true);

    vi.unstubAllEnvs();
  });

  it("canShowAd returns true during roundEnd status", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ADS", "true");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-1234567890");

    const { acceptAll } = await import("@/utils/consent");
    acceptAll();

    const { canShowAd } = await import("@/config/ads");
    expect(canShowAd("roundEnd")).toBe(true);

    vi.unstubAllEnvs();
  });

  it("canShowAd returns true during gameOver status", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ADS", "true");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-1234567890");

    const { acceptAll } = await import("@/utils/consent");
    acceptAll();

    const { canShowAd } = await import("@/config/ads");
    expect(canShowAd("gameOver")).toBe(true);

    vi.unstubAllEnvs();
  });

  it("canShowAd returns false when ADS_ENABLED is false", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ADS", "false");

    const { acceptAll } = await import("@/utils/consent");
    acceptAll();

    const { canShowAd } = await import("@/config/ads");
    expect(canShowAd("waiting")).toBe(false);

    vi.unstubAllEnvs();
  });

  it("canShowInterstitial returns false when interstitial flag is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ADS", "true");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-1234567890");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_INTERSTITIAL_ADS", "false");

    const { acceptAll } = await import("@/utils/consent");
    acceptAll();

    const { canShowInterstitial } = await import("@/config/ads");
    expect(canShowInterstitial()).toBe(false);

    vi.unstubAllEnvs();
  });
});

// ── 3. CLS Protection ───────────────────────────────────────────────────────

describe("CLS Protection", () => {
  it("AD_SIZE_RESERVATION has min-height for all formats", async () => {
    const { AD_SIZE_RESERVATION } = await import("@/config/ads");

    expect(AD_SIZE_RESERVATION["horizontal"]).toBeDefined();
    expect(AD_SIZE_RESERVATION["horizontal"].minH).toBeGreaterThanOrEqual(90);

    expect(AD_SIZE_RESERVATION["auto"]).toBeDefined();
    expect(AD_SIZE_RESERVATION["auto"].minH).toBeGreaterThanOrEqual(90);

    expect(AD_SIZE_RESERVATION["rectangle"]).toBeDefined();
    expect(AD_SIZE_RESERVATION["rectangle"].minH).toBeGreaterThanOrEqual(250);
  });

  it("all defined formats have positive min-height values", async () => {
    const { AD_SIZE_RESERVATION } = await import("@/config/ads");

    for (const [, config] of Object.entries(AD_SIZE_RESERVATION)) {
      expect(config.minH).toBeGreaterThan(0);
      expect(typeof config.minH).toBe("number");
    }
  });
});

// ── 4. Analytics Events ─────────────────────────────────────────────────────

describe("Analytics Events", () => {
  beforeEach(() => {
    vi.resetModules();
    clearStorage();
  });

  it("trackEvent records game_start in telemetry session", async () => {
    const { initTelemetry, trackEvent, getSession, cleanupTelemetry } = await import(
      "@/utils/telemetry"
    );
    cleanupTelemetry();
    initTelemetry();

    trackEvent("game_start", { gameMode: "urban" });
    const session = getSession();
    expect(session?.counters.game_start).toBe(1);
    expect(session?.events.some((e) => e.event === "game_start")).toBe(true);

    cleanupTelemetry();
  });

  it("trackEvent records round_complete", async () => {
    const { initTelemetry, trackEvent, getSession, cleanupTelemetry } = await import(
      "@/utils/telemetry"
    );
    cleanupTelemetry();
    initTelemetry();

    trackEvent("round_complete", { roundNumber: 1, score: 4500 });
    const session = getSession();
    expect(session?.counters.round_complete).toBe(1);

    cleanupTelemetry();
  });

  it("trackEvent records game_complete", async () => {
    const { initTelemetry, trackEvent, getSession, cleanupTelemetry } = await import(
      "@/utils/telemetry"
    );
    cleanupTelemetry();
    initTelemetry();

    trackEvent("game_complete", { totalScore: 22000 });
    const session = getSession();
    expect(session?.counters.game_complete).toBe(1);

    cleanupTelemetry();
  });

  it("trackEvent records room_created and room_joined", async () => {
    const { initTelemetry, trackEvent, getSession, cleanupTelemetry } = await import(
      "@/utils/telemetry"
    );
    cleanupTelemetry();
    initTelemetry();

    trackEvent("room_created", { roomId: "ABC" });
    trackEvent("room_joined", { roomId: "ABC", playerCount: 2 });

    const session = getSession();
    expect(session?.counters.room_created).toBe(1);
    expect(session?.counters.room_joined).toBe(1);

    cleanupTelemetry();
  });

  it("trackEvent records ad_impression", async () => {
    const { initTelemetry, trackEvent, getSession, cleanupTelemetry } = await import(
      "@/utils/telemetry"
    );
    cleanupTelemetry();
    initTelemetry();

    trackEvent("ad_impression", { slot: "banner", format: "horizontal" });
    const session = getSession();
    expect(session?.counters.ad_impression).toBe(1);

    cleanupTelemetry();
  });

  it("trackEvent records premium_cta_click", async () => {
    const { initTelemetry, trackEvent, getSession, cleanupTelemetry } = await import(
      "@/utils/telemetry"
    );
    cleanupTelemetry();
    initTelemetry();

    trackEvent("premium_cta_click", { location: "lobby" });
    const session = getSession();
    expect(session?.counters.premium_cta_click).toBe(1);

    cleanupTelemetry();
  });

  it("trackEvent records adSenseScriptLoaded and adSenseScriptFailed", async () => {
    const { initTelemetry, trackEvent, getSession, cleanupTelemetry } = await import(
      "@/utils/telemetry"
    );
    cleanupTelemetry();
    initTelemetry();

    trackEvent("adSenseScriptLoaded");
    trackEvent("adSenseScriptFailed");
    const session = getSession();
    expect(session?.counters.adSenseScriptLoaded).toBe(1);
    expect(session?.counters.adSenseScriptFailed).toBe(1);

    cleanupTelemetry();
  });

  it("trackEvent records ga4ScriptLoaded and ga4ScriptFailed", async () => {
    const { initTelemetry, trackEvent, getSession, cleanupTelemetry } = await import(
      "@/utils/telemetry"
    );
    cleanupTelemetry();
    initTelemetry();

    trackEvent("ga4ScriptLoaded");
    trackEvent("ga4ScriptFailed");
    const session = getSession();
    expect(session?.counters.ga4ScriptLoaded).toBe(1);
    expect(session?.counters.ga4ScriptFailed).toBe(1);

    cleanupTelemetry();
  });

  it("GA4 canSendAnalytics returns false without consent", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ANALYTICS", "true");
    vi.stubEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "G-TESTID");

    const { canSendAnalytics } = await import("@/services/analytics");
    expect(canSendAnalytics()).toBe(false);

    vi.unstubAllEnvs();
  });

  it("GA4 canSendAnalytics returns false when analytics disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ANALYTICS", "false");
    vi.stubEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "G-TESTID");

    const { acceptAll } = await import("@/utils/consent");
    acceptAll();

    const { canSendAnalytics } = await import("@/services/analytics");
    expect(canSendAnalytics()).toBe(false);

    vi.unstubAllEnvs();
  });

  it("GA4 canSendAnalytics returns false without measurement ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ANALYTICS", "true");
    vi.stubEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "");

    const { acceptAll } = await import("@/utils/consent");
    acceptAll();

    const { canSendAnalytics } = await import("@/services/analytics");
    expect(canSendAnalytics()).toBe(false);

    vi.unstubAllEnvs();
  });
});

// ── 5. Premium Flag ─────────────────────────────────────────────────────────

describe("Premium Flag", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("isPremiumUser returns false when flag is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_PREMIUM", "false");
    const { isPremiumUser } = await import("@/config/premium");
    expect(isPremiumUser()).toBe(false);
    vi.unstubAllEnvs();
  });

  it("isPremiumUser returns true when flag is on", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_PREMIUM", "true");
    const { isPremiumUser } = await import("@/config/premium");
    expect(isPremiumUser()).toBe(true);
    vi.unstubAllEnvs();
  });

  it("PREMIUM_ENABLED is false by default (no env var)", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_PREMIUM", "");
    const { PREMIUM_ENABLED } = await import("@/config/premium");
    expect(PREMIUM_ENABLED).toBe(false);
    vi.unstubAllEnvs();
  });
});

// ── 6. Consent Mode v2 ─────────────────────────────────────────────────────

describe("Consent Mode v2", () => {
  let gtagCalls: unknown[][] = [];

  beforeEach(() => {
    vi.resetModules();
    clearStorage();
    gtagCalls = [];

    // Mock gtag and dataLayer
    (window as any).dataLayer = [];
    (window as any).gtag = (...args: unknown[]) => {
      gtagCalls.push(args);
      (window as any).dataLayer.push(args);
    };
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("mapConsent maps marketing=true to granted for all ad signals", async () => {
    const { acceptAll } = await import("@/utils/consent");
    acceptAll();

    const { initConsentMode } = await import("@/utils/consentMode");
    initConsentMode();

    const updateCall = gtagCalls.find(
      (args) => args[0] === "consent" && args[1] === "update"
    );
    expect(updateCall).toBeDefined();

    const signals = updateCall![2] as Record<string, string>;
    expect(signals.ad_storage).toBe("granted");
    expect(signals.ad_user_data).toBe("granted");
    expect(signals.ad_personalization).toBe("granted");
    expect(signals.analytics_storage).toBe("granted");
  });

  it("mapConsent maps marketing=false to denied for all ad signals", async () => {
    const { rejectOptional } = await import("@/utils/consent");
    rejectOptional();

    const { initConsentMode } = await import("@/utils/consentMode");
    initConsentMode();

    const updateCall = gtagCalls.find(
      (args) => args[0] === "consent" && args[1] === "update"
    );
    expect(updateCall).toBeDefined();

    const signals = updateCall![2] as Record<string, string>;
    expect(signals.ad_storage).toBe("denied");
    expect(signals.ad_user_data).toBe("denied");
    expect(signals.ad_personalization).toBe("denied");
    expect(signals.analytics_storage).toBe("denied");
  });

  it("updateConsentMode sends correct signals when consent changes", async () => {
    const { updateConsentMode } = await import("@/utils/consentMode");

    updateConsentMode({
      necessary: true,
      analytics: true,
      marketing: false,
    });

    const updateCall = gtagCalls.find(
      (args) => args[0] === "consent" && args[1] === "update"
    );
    expect(updateCall).toBeDefined();

    const signals = updateCall![2] as Record<string, string>;
    expect(signals.ad_storage).toBe("denied");
    expect(signals.ad_user_data).toBe("denied");
    expect(signals.ad_personalization).toBe("denied");
    expect(signals.analytics_storage).toBe("granted");
  });

  it("all 4 consent signals are present in every update", async () => {
    const { updateConsentMode } = await import("@/utils/consentMode");

    updateConsentMode({
      necessary: true,
      analytics: true,
      marketing: true,
    });

    const updateCall = gtagCalls.find(
      (args) => args[0] === "consent" && args[1] === "update"
    );
    const signals = updateCall![2] as Record<string, string>;

    const required = ["ad_storage", "ad_user_data", "ad_personalization", "analytics_storage"];
    for (const key of required) {
      expect(signals).toHaveProperty(key);
      expect(["granted", "denied"]).toContain(signals[key]);
    }
  });

  it("initConsentMode does nothing when no stored consent", async () => {
    const { initConsentMode } = await import("@/utils/consentMode");
    initConsentMode();

    const updateCall = gtagCalls.find(
      (args) => args[0] === "consent" && args[1] === "update"
    );
    expect(updateCall).toBeUndefined();
  });
});

// ── 7. ads.txt ──────────────────────────────────────────────────────────────

describe("ads.txt Static File", () => {
  const adsPath = path.resolve(__dirname, "../../public/ads.txt");

  it("exists in public/ and has correct format", () => {
    expect(fs.existsSync(adsPath)).toBe(true);

    const body = fs.readFileSync(adsPath, "utf-8");
    expect(body).toContain("google.com");
    expect(body).toContain("pub-4031611961368310");
    expect(body).toContain("DIRECT");
    expect(body).toContain("f08c47fec0942fa0");
  });

  it("follows IAB ads.txt format", () => {
    const body = fs.readFileSync(adsPath, "utf-8").trim();

    // Format: <domain>, <publisher-id>, <relationship>, <cert-id>
    const parts = body.split(",").map((s: string) => s.trim());
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe("google.com");
    expect(parts[2]).toBe("DIRECT");
  });
});

// ── 8. Ad Error Handling / Telemetry ────────────────────────────────────────

describe("Ad Error Handling", () => {
  beforeEach(() => {
    vi.resetModules();
    clearStorage();
  });

  it("AD_SLOTS has default placeholder values", async () => {
    const { AD_SLOTS } = await import("@/config/ads");
    expect(AD_SLOTS.banner).toBeDefined();
    expect(typeof AD_SLOTS.banner).toBe("string");
    expect(AD_SLOTS.inContent).toBeDefined();
    expect(AD_SLOTS.interstitial).toBeDefined();
  });

  it("ADSENSE_CLIENT is string (may be empty without env)", async () => {
    const { ADSENSE_CLIENT } = await import("@/config/ads");
    expect(typeof ADSENSE_CLIENT).toBe("string");
  });

  it("canShowAd rejects empty slot ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ADS", "true");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-1234567890");

    const { acceptAll } = await import("@/utils/consent");
    acceptAll();

    const { canShowAd } = await import("@/config/ads");
    expect(canShowAd("waiting", "")).toBe(false);

    vi.unstubAllEnvs();
  });

  it("canShowAd allows placeholder slots (BUG-005 fix)", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ADS", "true");
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT", "ca-pub-1234567890");

    const { acceptAll } = await import("@/utils/consent");
    acceptAll();

    const { canShowAd } = await import("@/config/ads");
    expect(canShowAd("waiting", "0000000000")).toBe(true);

    vi.unstubAllEnvs();
  });

  it("isAdPreview returns boolean based on NODE_ENV", async () => {
    const { isAdPreview } = await import("@/config/ads");
    expect(typeof isAdPreview()).toBe("boolean");
  });
});

// ── 9. Interstitial Frequency Cap ───────────────────────────────────────────

describe("Interstitial Frequency Cap", () => {
  beforeEach(() => {
    clearStorage();
    vi.resetModules();
  });

  it("canShowInterstitialNow returns false initially (no rounds)", async () => {
    const { canShowInterstitialNow } = await import("@/utils/adsFrequency");
    expect(canShowInterstitialNow()).toBe(false);
  });

  it("canShowInterstitialNow returns true after 3+ rounds", async () => {
    const { canShowInterstitialNow, incrementRoundsPlayed } = await import(
      "@/utils/adsFrequency"
    );
    incrementRoundsPlayed();
    incrementRoundsPlayed();
    incrementRoundsPlayed();
    expect(canShowInterstitialNow()).toBe(true);
  });

  it("canShowInterstitialNow returns false after shown", async () => {
    const {
      canShowInterstitialNow,
      incrementRoundsPlayed,
      markInterstitialShown,
    } = await import("@/utils/adsFrequency");

    incrementRoundsPlayed();
    incrementRoundsPlayed();
    incrementRoundsPlayed();
    markInterstitialShown();
    expect(canShowInterstitialNow()).toBe(false);
  });
});

// ── 10. GA4 Analytics Service ───────────────────────────────────────────────

describe("GA4 Analytics Service", () => {
  beforeEach(() => {
    vi.resetModules();
    clearStorage();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("ANALYTICS_ENABLED is false when env flag is off", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ANALYTICS", "false");
    vi.stubEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "G-TEST");

    const { ANALYTICS_ENABLED } = await import("@/services/analytics");
    expect(ANALYTICS_ENABLED).toBe(false);
  });

  it("ANALYTICS_ENABLED stays true with the built-in GA4 measurement ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ANALYTICS", "true");
    vi.stubEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "");

    const { ANALYTICS_ENABLED } = await import("@/services/analytics");
    expect(ANALYTICS_ENABLED).toBe(true);
  });

  it("ANALYTICS_ENABLED is true when both env vars are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ANALYTICS", "true");
    vi.stubEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "G-TESTID");

    const { ANALYTICS_ENABLED } = await import("@/services/analytics");
    expect(ANALYTICS_ENABLED).toBe(true);
  });

  it("trackGameStart calls gtag when analytics enabled and consented", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ANALYTICS", "true");
    vi.stubEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "G-TESTID");

    const gtagCalls: unknown[][] = [];
    (window as any).gtag = (...args: unknown[]) => {
      gtagCalls.push(args);
    };

    const { acceptAll } = await import("@/utils/consent");
    acceptAll();

    const { trackGameStart } = await import("@/services/analytics");
    trackGameStart({ gameMode: "urban" });

    const eventCall = gtagCalls.find(
      (args) => args[0] === "event" && args[1] === "game_start"
    );
    expect(eventCall).toBeDefined();
    expect((eventCall![2] as Record<string, unknown>).game_mode).toBe("urban");
  });

  it("trackGameStart does NOT call gtag when not consented", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_ANALYTICS", "true");
    vi.stubEnv("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "G-TESTID");

    const gtagCalls: unknown[][] = [];
    (window as any).gtag = (...args: unknown[]) => {
      gtagCalls.push(args);
    };

    const { trackGameStart } = await import("@/services/analytics");
    trackGameStart({ gameMode: "urban" });

    const eventCall = gtagCalls.find(
      (args) => args[0] === "event" && args[1] === "game_start"
    );
    expect(eventCall).toBeUndefined();
  });
});
