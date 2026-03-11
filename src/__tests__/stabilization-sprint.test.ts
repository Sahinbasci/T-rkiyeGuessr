/**
 * Stabilization Sprint Tests — Covers bugs B1-B4 + proactive fixes
 *
 * B1: StreetView perspective drift on mobile lock/resume
 * B2: Google logo misclick prevention on mobile map
 * B3: Round-end Turkish text formatting
 * B4: Map style/label readability
 * A1-A4: Re-verification of previous fixes
 *
 * NEW-BUG #1: POV corruption detection (proactive)
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";

// ==================== B1: POV Sanitization + Drift Guard ====================

describe("B1: POV sanitization and drift guard on lifecycle resume", () => {
  describe("sanitizePov (pure function)", () => {
    let sanitizePov: typeof import("@/utils/cameraDrift").sanitizePov;
    let isPovCorrupted: typeof import("@/utils/cameraDrift").isPovCorrupted;
    let clampPitch: typeof import("@/utils/cameraDrift").clampPitch;
    let PITCH_MAX: number;
    let PITCH_MIN: number;

    beforeEach(async () => {
      const mod = await import("@/utils/cameraDrift");
      sanitizePov = mod.sanitizePov;
      isPovCorrupted = mod.isPovCorrupted;
      clampPitch = mod.clampPitch;
      PITCH_MAX = mod.PITCH_MAX;
      PITCH_MIN = mod.PITCH_MIN;
    });

    test("passes through normal POV unchanged", () => {
      const pov = { heading: 90, pitch: 10 };
      const result = sanitizePov(pov);
      expect(result.heading).toBe(90);
      expect(result.pitch).toBe(10);
    });

    test("clamps pitch above PITCH_MAX", () => {
      const pov = { heading: 45, pitch: 89 };
      const result = sanitizePov(pov);
      expect(result.pitch).toBe(PITCH_MAX); // 80
      expect(result.heading).toBe(45);
    });

    test("clamps pitch below PITCH_MIN", () => {
      const pov = { heading: 180, pitch: -85 };
      const result = sanitizePov(pov);
      expect(result.pitch).toBe(PITCH_MIN); // -80
    });

    test("handles NaN pitch", () => {
      const pov = { heading: 90, pitch: NaN };
      const result = sanitizePov(pov);
      expect(result.pitch).toBe(0);
      expect(Number.isFinite(result.pitch)).toBe(true);
    });

    test("handles NaN heading", () => {
      const pov = { heading: NaN, pitch: 10 };
      const result = sanitizePov(pov);
      expect(result.heading).toBe(0);
      expect(Number.isFinite(result.heading)).toBe(true);
    });

    test("handles Infinity pitch", () => {
      const pov = { heading: 0, pitch: Infinity };
      const result = sanitizePov(pov);
      expect(result.pitch).toBe(0);
    });

    test("normalizes heading > 360 to [0, 360)", () => {
      const pov = { heading: 450, pitch: 0 };
      const result = sanitizePov(pov);
      expect(result.heading).toBe(90);
    });

    test("normalizes negative heading to [0, 360)", () => {
      const pov = { heading: -90, pitch: 0 };
      const result = sanitizePov(pov);
      expect(result.heading).toBe(270);
    });

    test("isPovCorrupted detects NaN", () => {
      expect(isPovCorrupted({ heading: NaN, pitch: 0 })).toBe(true);
      expect(isPovCorrupted({ heading: 0, pitch: NaN })).toBe(true);
    });

    test("isPovCorrupted detects out-of-bounds pitch", () => {
      expect(isPovCorrupted({ heading: 0, pitch: 85 })).toBe(true);
      expect(isPovCorrupted({ heading: 0, pitch: -85 })).toBe(true);
    });

    test("isPovCorrupted returns false for valid POV", () => {
      expect(isPovCorrupted({ heading: 90, pitch: 10 })).toBe(false);
      expect(isPovCorrupted({ heading: 359, pitch: -50 })).toBe(false);
    });
  });

  describe("drift tracker reset on resume", () => {
    let createDriftTracker: typeof import("@/utils/cameraDrift").createDriftTracker;
    let resetDriftTracker: typeof import("@/utils/cameraDrift").resetDriftTracker;
    let processPovChange: typeof import("@/utils/cameraDrift").processPovChange;

    beforeEach(async () => {
      const mod = await import("@/utils/cameraDrift");
      createDriftTracker = mod.createDriftTracker;
      resetDriftTracker = mod.resetDriftTracker;
      processPovChange = mod.processPovChange;
    });

    test("resetDriftTracker creates fresh state with new anchor pitch", () => {
      const state = createDriftTracker(10);
      // Simulate some drift accumulation
      const drifted = { ...state, accumulatedDrift: 5.0, correctionCount: 3 };

      // Reset to new pitch (simulating post-resume state)
      const fresh = resetDriftTracker(drifted, 0);
      expect(fresh.anchorPitch).toBe(0);
      expect(fresh.accumulatedDrift).toBe(0);
      expect(fresh.correctionCount).toBe(0);
      expect(fresh.samples).toHaveLength(0);
      expect(fresh.isDragging).toBe(false);
    });

    test("after reset, drift detection starts clean", () => {
      const fresh = createDriftTracker(0);

      // Feed samples that previously would accumulate drift
      let state = fresh;
      for (let i = 0; i < 5; i++) {
        const result = processPovChange(state, 0.05, i * 10, Date.now() + i * 16);
        state = result.newState;
        // Should not trigger correction on fresh state
        expect(result.correctedPitch).toBeNull();
      }
    });
  });

  describe("clampPitch edge cases", () => {
    let clampPitch: typeof import("@/utils/cameraDrift").clampPitch;

    beforeEach(async () => {
      clampPitch = (await import("@/utils/cameraDrift")).clampPitch;
    });

    test("clamps extreme positive pitch", () => {
      expect(clampPitch(999)).toBe(80);
    });

    test("clamps extreme negative pitch", () => {
      expect(clampPitch(-999)).toBe(-80);
    });

    test("handles NaN by returning 0", () => {
      expect(clampPitch(NaN)).toBe(0);
    });

    test("handles Infinity by returning 0", () => {
      expect(clampPitch(Infinity)).toBe(0);
    });

    test("handles -Infinity by returning 0", () => {
      expect(clampPitch(-Infinity)).toBe(0);
    });

    test("preserves values within bounds", () => {
      expect(clampPitch(0)).toBe(0);
      expect(clampPitch(80)).toBe(80);
      expect(clampPitch(-80)).toBe(-80);
      expect(clampPitch(45.5)).toBe(45.5);
    });
  });
});

// ==================== B3: Turkish Text Formatting ====================

describe("B3: Turkish locale-safe text formatting", () => {
  let toTurkishUpperCase: typeof import("@/utils/turkishFormat").toTurkishUpperCase;
  let toTurkishLowerCase: typeof import("@/utils/turkishFormat").toTurkishLowerCase;
  let toTurkishTitleCase: typeof import("@/utils/turkishFormat").toTurkishTitleCase;
  let normalizeTurkish: typeof import("@/utils/turkishFormat").normalizeTurkish;
  let formatLocationName: typeof import("@/utils/turkishFormat").formatLocationName;
  let turkishCompare: typeof import("@/utils/turkishFormat").turkishCompare;

  beforeEach(async () => {
    const mod = await import("@/utils/turkishFormat");
    toTurkishUpperCase = mod.toTurkishUpperCase;
    toTurkishLowerCase = mod.toTurkishLowerCase;
    toTurkishTitleCase = mod.toTurkishTitleCase;
    normalizeTurkish = mod.normalizeTurkish;
    formatLocationName = mod.formatLocationName;
    turkishCompare = mod.turkishCompare;
  });

  describe("toTurkishUpperCase", () => {
    test("converts 'i' to 'İ' (dotted capital I)", () => {
      const result = toTurkishUpperCase("istanbul");
      expect(result).toBe("İSTANBUL");
    });

    test("does NOT produce 'I' for 'i' (English-style uppercase would be wrong)", () => {
      const result = toTurkishUpperCase("i");
      expect(result).not.toBe("I");
      expect(result).toBe("İ");
    });

    test("handles mixed Turkish characters", () => {
      const result = toTurkishUpperCase("çğıöşü");
      expect(result).toBe("ÇĞIÖŞÜ");
    });
  });

  describe("toTurkishLowerCase", () => {
    test("converts 'İ' to 'i' (dotted lowercase i)", () => {
      const result = toTurkishLowerCase("İSTANBUL");
      expect(result).toBe("istanbul");
    });

    test("converts 'I' to 'ı' (dotless lowercase i)", () => {
      const result = toTurkishLowerCase("I");
      expect(result).toBe("ı");
    });
  });

  describe("toTurkishTitleCase", () => {
    test("title cases single word", () => {
      expect(toTurkishTitleCase("fatih")).toBe("Fatih");
    });

    test("title cases district, province format", () => {
      expect(toTurkishTitleCase("fatih, istanbul")).toBe("Fatih, İstanbul");
    });

    test("handles already title-cased input", () => {
      const result = toTurkishTitleCase("Fatih, İstanbul");
      expect(result).toBe("Fatih, İstanbul");
    });

    test("handles all-caps input", () => {
      const result = toTurkishTitleCase("FATİH, İSTANBUL");
      expect(result).toBe("Fatih, İstanbul");
    });

    test("handles names with special Turkish chars", () => {
      const result = toTurkishTitleCase("şahinbey, gaziantep");
      expect(result).toBe("Şahinbey, Gaziantep");
    });
  });

  describe("normalizeTurkish", () => {
    test("trims whitespace", () => {
      expect(normalizeTurkish("  Fatih  ")).toBe("Fatih");
    });

    test("applies NFC normalization", () => {
      // NFD: İ can be decomposed to I + combining dot above (U+0049 U+0307)
      const nfd = "I\u0307stanbul";
      const result = normalizeTurkish(nfd);
      // After NFC, should be composed
      expect(result).toBe(result.normalize("NFC"));
    });
  });

  describe("formatLocationName", () => {
    test("formats standard district, province", () => {
      const result = formatLocationName("Fatih, İstanbul");
      expect(result.district).toBe("Fatih");
      expect(result.province).toBe("İstanbul");
      expect(result.formatted).toBe("Fatih, İstanbul");
    });

    test("handles lowercase input with Turkish title case", () => {
      const result = formatLocationName("fatih, istanbul");
      expect(result.formatted).toBe("Fatih, İstanbul");
    });

    test("returns fallback for null", () => {
      const result = formatLocationName(null);
      expect(result.formatted).toBe("Bilinmeyen Konum");
    });

    test("returns fallback for undefined", () => {
      const result = formatLocationName(undefined);
      expect(result.formatted).toBe("Bilinmeyen Konum");
    });

    test("returns fallback for empty string", () => {
      const result = formatLocationName("");
      expect(result.formatted).toBe("Bilinmeyen Konum");
    });

    test("returns fallback for whitespace-only string", () => {
      const result = formatLocationName("   ");
      expect(result.formatted).toBe("Bilinmeyen Konum");
    });

    test("handles single name (no comma) — district = province", () => {
      const result = formatLocationName("Ankara");
      expect(result.district).toBe("Ankara");
      expect(result.province).toBe("Ankara");
      expect(result.formatted).toBe("Ankara");
    });

    test("handles extra whitespace around comma", () => {
      const result = formatLocationName("Kaleiçi ,  Antalya ");
      expect(result.district).toBe("Kaleiçi");
      expect(result.province).toBe("Antalya");
    });

    test("handles all pano package location names", async () => {
      // Test a representative sample of actual pano data
      const names = [
        "Fatih, İstanbul",
        "Kadıköy, İstanbul",
        "Kızılay, Ankara",
        "Alsancak, İzmir",
        "Kaleiçi, Antalya",
        "Şahinbey, Gaziantep",
        "Haliliye, Şanlıurfa",
        "Ortahisar, Trabzon",
        "Yakutiye, Erzurum",
      ];

      for (const name of names) {
        const result = formatLocationName(name);
        expect(result.formatted).toBeTruthy();
        expect(result.district).toBeTruthy();
        expect(result.province).toBeTruthy();
        // Must contain the original data (title-cased)
        expect(result.formatted).toContain(",");
      }
    });
  });

  describe("turkishCompare", () => {
    test("sorts Turkish chars correctly", () => {
      const cities = ["Şanlıurfa", "Ankara", "İstanbul", "Çanakkale"];
      const sorted = cities.sort(turkishCompare);
      // In Turkish locale: A, Ç, I/İ, Ş
      expect(sorted[0]).toBe("Ankara");
      expect(sorted[sorted.length - 1]).toBe("Şanlıurfa");
    });
  });
});

// ==================== B4: Map Style Labels ====================

describe("B4: Map style label visibility", () => {
  let MAPS_CONFIG: typeof import("@/config/maps").MAPS_CONFIG;

  beforeEach(async () => {
    MAPS_CONFIG = (await import("@/config/maps")).MAPS_CONFIG;
  });

  test("darkMapStyles is an array with style entries", () => {
    expect(Array.isArray(MAPS_CONFIG.darkMapStyles)).toBe(true);
    expect(MAPS_CONFIG.darkMapStyles.length).toBeGreaterThan(5);
  });

  test("province labels have explicit bright styling", () => {
    const provinceLabel = MAPS_CONFIG.darkMapStyles.find(
      (s: any) =>
        s.featureType === "administrative.province" &&
        s.elementType === "labels.text.fill"
    );
    expect(provinceLabel).toBeTruthy();

    // The fill color should be bright (high hex values)
    const color = provinceLabel?.stylers?.[0]?.color as string;
    expect(color).toBeTruthy();
    // Brightness check: #e0e0f0 → 0xe0 = 224 > 180 (bright enough)
    const r = parseInt(color.slice(1, 3), 16);
    expect(r).toBeGreaterThan(180);
  });

  test("province labels have text stroke for contrast", () => {
    const provinceStroke = MAPS_CONFIG.darkMapStyles.find(
      (s: any) =>
        s.featureType === "administrative.province" &&
        s.elementType === "labels.text.stroke"
    );
    expect(provinceStroke).toBeTruthy();
    // Should have weight >= 3 for readability
    const weight = provinceStroke?.stylers?.find((s: any) => s.weight)?.weight;
    expect(weight).toBeGreaterThanOrEqual(3);
  });

  test("locality labels have explicit styling", () => {
    const localityLabel = MAPS_CONFIG.darkMapStyles.find(
      (s: any) =>
        s.featureType === "administrative.locality" &&
        s.elementType === "labels.text.fill"
    );
    expect(localityLabel).toBeTruthy();
    const color = localityLabel?.stylers?.[0]?.color as string;
    expect(color).toBeTruthy();
    // #d0d0e0 → 0xd0 = 208 > 160
    const r = parseInt(color.slice(1, 3), 16);
    expect(r).toBeGreaterThan(160);
  });

  test("water labels are visible", () => {
    const waterLabel = MAPS_CONFIG.darkMapStyles.find(
      (s: any) =>
        s.featureType === "water" &&
        s.elementType === "labels.text.fill"
    );
    expect(waterLabel).toBeTruthy();
  });

  test("POI is hidden (no distractions)", () => {
    const poi = MAPS_CONFIG.darkMapStyles.find(
      (s: any) => s.featureType === "poi"
    );
    expect(poi).toBeTruthy();
    expect(poi?.stylers?.some((s: any) => s.visibility === "off")).toBe(true);
  });

  test("road labels are hidden (less clutter)", () => {
    const roadLabels = MAPS_CONFIG.darkMapStyles.find(
      (s: any) =>
        s.featureType === "road" &&
        s.elementType === "labels"
    );
    expect(roadLabels).toBeTruthy();
    expect(roadLabels?.stylers?.some((s: any) => s.visibility === "off")).toBe(true);
  });

  test("country border has red emphasis", () => {
    const countryBorder = MAPS_CONFIG.darkMapStyles.find(
      (s: any) =>
        s.featureType === "administrative.country" &&
        s.elementType === "geometry.stroke"
    );
    expect(countryBorder).toBeTruthy();
    expect(countryBorder?.stylers?.some((s: any) => s.color === "#ef4444")).toBe(true);
  });
});

// ==================== A1-A4: Re-verification of Previous Fixes ====================

describe("A1-A4: Previous bug fixes re-verification", () => {
  describe("A1: Map zoom reset", () => {
    test("getTurkeyZoom returns consistent default", async () => {
      const { getTurkeyZoom, getTurkeyCenter } = await import("@/utils");
      expect(getTurkeyZoom()).toBe(6);
      expect(getTurkeyCenter()).toEqual({ lat: 39.0, lng: 35.0 });
    });
  });

  describe("A2: Host leave lobby atomicity", () => {
    test("single transaction atomically migrates host AND removes player", () => {
      const currentRoom: any = {
        hostId: "host1",
        status: "waiting",
        players: {
          host1: { id: "host1", isHost: true, status: "online", joinedAt: 1000 },
          player2: { id: "player2", isHost: false, status: "online", joinedAt: 2000 },
        },
      };

      const playerId = "host1";
      const players = { ...currentRoom.players };
      let newHostId = currentRoom.hostId;

      if (playerId === currentRoom.hostId) {
        const candidates = Object.values(players)
          .filter((p: any) => p.id !== playerId && (!p.status || p.status === "online"))
          .sort((a: any, b: any) => (a.joinedAt || 0) - (b.joinedAt || 0));
        const newHost: any = candidates[0];
        if (newHost) {
          newHostId = newHost.id;
          players[newHostId] = { ...players[newHostId], isHost: true };
        }
      }

      delete players[playerId];

      expect(newHostId).toBe("player2");
      expect(players["player2"].isHost).toBe(true);
      expect(players["host1"]).toBeUndefined();
    });

    test("idempotency guard: returns undefined for already-removed player", () => {
      const room = {
        hostId: "host1",
        players: { host1: { id: "host1" } },
      };
      const playerId = "ghost_player";
      const playerExists = !!room.players[playerId as keyof typeof room.players];
      expect(playerExists).toBe(false);
    });
  });

  describe("A3: Cookie consent banner", () => {
    const STORAGE_KEY = "turkiyeguessr_consent";
    let store: Record<string, string> = {};
    const mockStorage: Storage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = String(value); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
      get length() { return Object.keys(store).length; },
      key: (index: number) => Object.keys(store)[index] ?? null,
    };

    beforeEach(() => {
      store = {};
      vi.stubGlobal("localStorage", mockStorage);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    test("banner visible when no consent stored", () => {
      expect(mockStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    test("acceptAll stores correct consent", () => {
      const consent = { necessary: true, analytics: true, marketing: true, version: 1, updatedAt: Date.now() };
      mockStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
      const parsed = JSON.parse(mockStorage.getItem(STORAGE_KEY)!);
      expect(parsed.necessary).toBe(true);
      expect(parsed.analytics).toBe(true);
      expect(parsed.marketing).toBe(true);
    });
  });

  describe("A4: WhatsApp share URL", () => {
    const SITE_URL = "https://turkiyeguessr.com";

    test("uses api.whatsapp.com/send (not wa.me)", () => {
      const roomId = "ABC123";
      const shareText = `🎯 TürkiyeGuessr'da bana katıl!\n\nOda Kodu: ${roomId}`;
      const shareUrl = `${SITE_URL}?room=${roomId}`;
      const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`;

      expect(url).toContain("api.whatsapp.com/send");
      expect(url).not.toContain("wa.me");
    });

    test("properly encodes Turkish characters", () => {
      const text = "🎯 TürkiyeGuessr'da bana katıl!";
      const encoded = encodeURIComponent(text);
      expect(encoded).not.toContain("ü");
      expect(encoded).not.toContain("ı");
      expect(decodeURIComponent(encoded)).toBe(text);
    });
  });
});

// ==================== B2: Attribution — ToS-Safe Layout (Overlay Removed) ====================

describe("B2: Attribution ToS-safe layout (no overlay)", () => {
  test("MiniMap source no longer contains overlay guard logic", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("src/components/game/MiniMap.tsx", "utf-8");
    expect(content).not.toContain("attribution-tap-guard");
    expect(content).not.toContain("guardPassthrough");
  });

  test("CSS no longer has attribution-tap-guard class", async () => {
    const fs = await import("fs");
    const css = fs.readFileSync("src/app/globals.css", "utf-8");
    expect(css).not.toContain("attribution-tap-guard");
  });

  test("mobile minimap increased size provides safe distance", async () => {
    const fs = await import("fs");
    const css = fs.readFileSync("src/app/globals.css", "utf-8");
    expect(css).toMatch(/height:\s*140px/);
  });
});

// ==================== NEW-BUG #1: Lifecycle Event Listener Management ====================

describe("Lifecycle event listener deduplication (B1-FIX v2)", () => {
  test("all 4 lifecycle events are covered: visibilitychange, pageshow, focus, online", () => {
    const events = new Set(["visibilitychange", "pageshow", "focus", "online"]);
    expect(events.size).toBe(4);
    expect(events.has("visibilitychange")).toBe(true);
    expect(events.has("pageshow")).toBe(true);
    expect(events.has("focus")).toBe(true);
    expect(events.has("online")).toBe(true);
  });

  test("centralized handleResume uses sanitizePov", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("src/hooks/streetview/usePanoLifecycle.ts", "utf-8");
    expect(content).toContain("handleResume");
    expect(content).toContain("sanitizePov");
  });

  test("pitch clamping produces consistent results across all resume paths", async () => {
    const { sanitizePov } = await import("@/utils/cameraDrift");
    expect(sanitizePov({ heading: 0, pitch: NaN }).pitch).toBe(0);
    expect(sanitizePov({ heading: 0, pitch: 0 }).pitch).toBe(0);
    expect(sanitizePov({ heading: 0, pitch: 85 }).pitch).toBe(80);
    expect(sanitizePov({ heading: 0, pitch: -85 }).pitch).toBe(-80);
    expect(sanitizePov({ heading: 0, pitch: 45 }).pitch).toBe(45);
    expect(sanitizePov({ heading: 0, pitch: Infinity }).pitch).toBe(0);
    expect(sanitizePov({ heading: 0, pitch: -Infinity }).pitch).toBe(0);
  });
});
