/**
 * BagSelector — Unit Tests
 *
 * Tests cover:
 * - Fisher-Yates shuffle uniformity
 * - O(1) draw and automatic reshuffle on exhaustion
 * - Province back-to-back prevention guard
 * - State persistence (export/import)
 * - 10K draw stability (no crashes, finite loops)
 * - Province coverage verification
 * - Edge cases: single-element pool, empty pool
 */

import { BagSelector, BagState } from "../services/bagSelector";
import { PrecomputedLocation } from "../types/precomputed";
import {
  resetPersistentHistoryState,
  initPersistentHistoryFromArray,
} from "../services/persistentHistory";

// ==================== HELPERS ====================

function makeLoc(
  overrides: Partial<PrecomputedLocation> = {}
): PrecomputedLocation {
  return {
    id: overrides.id ?? `pc_test_${Math.random().toString(36).substr(2, 6)}`,
    panoId: overrides.panoId ?? `pano_${Math.random().toString(36).substr(2, 8)}`,
    lat: overrides.lat ?? 39.0 + Math.random() * 4,
    lng: overrides.lng ?? 27.0 + Math.random() * 15,
    heading: overrides.heading ?? Math.floor(Math.random() * 360),
    province: overrides.province ?? "TestProvince",
    district: overrides.district ?? "TestDistrict",
    region: overrides.region ?? "marmara",
    classification: overrides.classification ?? "urban",
    roadType: overrides.roadType ?? "urban_street",
    qualityScore: overrides.qualityScore ?? 4,
    locationHash: overrides.locationHash ?? `${(39 + Math.random() * 4).toFixed(3)}_${(27 + Math.random() * 15).toFixed(3)}`,
    clusterId: overrides.clusterId ?? "TestProvince__39.123_28.456",
    validatedAt: overrides.validatedAt ?? new Date().toISOString(),
    osmMeta: overrides.osmMeta ?? {
      insideCityBoundary: true,
      nearestRoadClass: "residential",
      buildingDensity: 0.6,
    },
  };
}

function makePool(
  size: number,
  provinces: string[] = ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"]
): PrecomputedLocation[] {
  return Array.from({ length: size }, (_, i) =>
    makeLoc({
      id: `pc_test_${i}`,
      province: provinces[i % provinces.length],
      panoId: `pano_${i}`,
      locationHash: `${(39 + (i * 0.01)).toFixed(3)}_${(28 + (i * 0.01)).toFixed(3)}`,
    })
  );
}

// ==================== SETUP ====================

beforeEach(() => {
  // Reset persistent history to avoid interference
  resetPersistentHistoryState();
  initPersistentHistoryFromArray([]);
});

// ==================== BASIC DRAW TESTS ====================

describe("BagSelector — Basic Draw", () => {
  test("draw returns null for empty pool", () => {
    const bag = new BagSelector();
    bag.setPool("urban", []);
    expect(bag.draw("urban")).toBeNull();
  });

  test("draw returns a location from the pool", () => {
    const bag = new BagSelector();
    const pool = makePool(10);
    bag.setPool("urban", pool);

    const result = bag.draw("urban");
    expect(result).not.toBeNull();
    expect(pool.some((loc) => loc.panoId === result!.panoId)).toBe(true);
  });

  test("draw is O(1) — returns immediately", () => {
    const bag = new BagSelector();
    bag.setPool("urban", makePool(1000));

    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      bag.draw("urban");
    }
    const elapsed = performance.now() - start;

    // 100 draws should take < 50ms (generous for CI)
    expect(elapsed).toBeLessThan(50);
  });

  test("draw exhausts entire pool before reshuffling", () => {
    const bag = new BagSelector();
    // Use 5 locations with different provinces to avoid skip
    const pool = [
      makeLoc({ id: "a", province: "Istanbul", panoId: "p1", locationHash: "h1" }),
      makeLoc({ id: "b", province: "Ankara", panoId: "p2", locationHash: "h2" }),
      makeLoc({ id: "c", province: "Izmir", panoId: "p3", locationHash: "h3" }),
      makeLoc({ id: "d", province: "Bursa", panoId: "p4", locationHash: "h4" }),
      makeLoc({ id: "e", province: "Antalya", panoId: "p5", locationHash: "h5" }),
    ];
    bag.setPool("urban", pool);

    const drawn = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const loc = bag.draw("urban");
      expect(loc).not.toBeNull();
      drawn.add(loc!.panoId);
    }

    // All 5 should be unique (no repeats within the bag)
    expect(drawn.size).toBe(5);
  });

  test("draw reshuffles after exhaustion and continues", () => {
    const bag = new BagSelector();
    const pool = makePool(5, ["A", "B", "C", "D", "E"]);
    bag.setPool("urban", pool);

    // Draw more than pool size — should reshuffle
    const draws: string[] = [];
    for (let i = 0; i < 15; i++) {
      const loc = bag.draw("urban");
      expect(loc).not.toBeNull();
      draws.push(loc!.panoId);
    }

    // All 15 draws should succeed
    expect(draws.length).toBe(15);
    // All panoIds should be from the pool
    const poolPanoIds = new Set(pool.map((l) => l.panoId));
    for (const panoId of draws) {
      expect(poolPanoIds.has(panoId)).toBe(true);
    }

    // Stats should show generation > 1
    const stats = bag.getStats("urban");
    expect(stats.generation).toBeGreaterThan(1);
  });
});

// ==================== PROVINCE GUARD ====================

describe("BagSelector — Province Back-to-Back Guard", () => {
  test("never draws same province consecutively", () => {
    const bag = new BagSelector();
    // Create pool with multiple provinces (at least 2)
    const pool = makePool(100, ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"]);
    bag.setPool("urban", pool);

    let lastProvince: string | null = null;
    for (let i = 0; i < 200; i++) {
      const loc = bag.draw("urban");
      if (!loc) continue;

      if (lastProvince !== null) {
        expect(loc.province).not.toBe(lastProvince);
      }
      lastProvince = loc.province;
    }
  });

  test("boundary guard on reshuffle prevents cross-boundary repeat", () => {
    const bag = new BagSelector();
    // Only 2 provinces — forces boundary guard to trigger often
    const pool = makePool(20, ["Istanbul", "Ankara"]);
    bag.setPool("urban", pool);

    let lastProvince: string | null = null;
    let consecutiveCount = 0;

    for (let i = 0; i < 100; i++) {
      const loc = bag.draw("urban");
      if (!loc) continue;

      if (loc.province === lastProvince) {
        consecutiveCount++;
      }
      lastProvince = loc.province;
    }

    // Should be zero consecutive same-province draws
    expect(consecutiveCount).toBe(0);
  });

  test("single province pool still works (no infinite loop)", () => {
    const bag = new BagSelector();
    const pool = makePool(5, ["Istanbul"]); // Only one province
    bag.setPool("urban", pool);

    // Should still be able to draw (guard skipped when pool.length <= 1 for province diversity)
    // The guard checks pool.length > 1, so with 5 items from same province,
    // it will skip items due to province guard but eventually exhaust MAX_SKIP_ATTEMPTS
    // and return null. That's OK — it means all-same-province pool is handled gracefully.
    const results: PrecomputedLocation[] = [];
    for (let i = 0; i < 10; i++) {
      const loc = bag.draw("urban");
      if (loc) results.push(loc);
    }

    // We should get some results (first draw of each bag has no lastProvince)
    expect(results.length).toBeGreaterThan(0);
  });
});

// ==================== MODE ISOLATION ====================

describe("BagSelector — Mode Isolation", () => {
  test("urban and geo pools are independent", () => {
    const bag = new BagSelector();
    const urbanPool = makePool(5, ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"]);
    const geoPool = makePool(3, ["Trabzon", "Samsun", "Rize"]);

    bag.setPool("urban", urbanPool);
    bag.setPool("geo", geoPool);

    // Urban draws should only come from urbanPool
    const urbanDraw = bag.draw("urban");
    expect(urbanDraw).not.toBeNull();
    expect(urbanPool.some((l) => l.panoId === urbanDraw!.panoId)).toBe(true);

    // Geo draws should only come from geoPool
    const geoDraw = bag.draw("geo");
    expect(geoDraw).not.toBeNull();
    expect(geoPool.some((l) => l.panoId === geoDraw!.panoId)).toBe(true);
  });

  test("stats are per-mode", () => {
    const bag = new BagSelector();
    bag.setPool("urban", makePool(10, ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"]));
    bag.setPool("geo", makePool(20, ["Trabzon", "Samsun", "Rize", "Artvin", "Ordu"]));

    expect(bag.getStats("urban").poolSize).toBe(10);
    expect(bag.getStats("geo").poolSize).toBe(20);
  });
});

// ==================== STATE PERSISTENCE ====================

describe("BagSelector — State Persistence", () => {
  test("exportState captures current bag state", () => {
    const bag = new BagSelector();
    bag.setPool("urban", makePool(10, ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"]));

    // Draw a few to advance pointer
    bag.draw("urban");
    bag.draw("urban");

    const state = bag.exportState();
    expect(state.urban.order.length).toBeGreaterThan(0);
    expect(state.urban.pointer).toBeGreaterThan(0);
    expect(state.urban.generation).toBeGreaterThan(0);
  });

  test("importState restores bag state with matching pool version", () => {
    const bag1 = new BagSelector();
    const pool = makePool(10, ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"]);
    bag1.setPool("urban", pool);

    // Draw 3 items
    bag1.draw("urban");
    bag1.draw("urban");
    bag1.draw("urban");

    const state = bag1.exportState();

    // Create new bag and import state
    const bag2 = new BagSelector();
    bag2.setPool("urban", pool);
    const success = bag2.importState(state, 0); // poolVersion 0 matches emptyBag default

    expect(success).toBe(true);
    expect(bag2.getStats("urban").pointer).toBe(state.urban.pointer);
  });

  test("importState rejects mismatched pool version", () => {
    const bag = new BagSelector();
    const state = {
      urban: {
        order: [0, 1, 2],
        pointer: 1,
        lastProvince: "Istanbul",
        generation: 1,
        poolVersion: 5,
      },
      geo: {
        order: [],
        pointer: 0,
        lastProvince: null,
        generation: 0,
        poolVersion: 5,
      },
    };

    const success = bag.importState(state, 3); // Version mismatch
    expect(success).toBe(false);
  });
});

// ==================== APPEND TO POOL ====================

describe("BagSelector — appendToPool", () => {
  test("appended locations become available on next reshuffle", () => {
    const bag = new BagSelector();
    const initialPool = makePool(3, ["Istanbul", "Ankara", "Izmir"]);
    bag.setPool("urban", initialPool);

    // Draw all 3
    const firstBatch: string[] = [];
    for (let i = 0; i < 3; i++) {
      const loc = bag.draw("urban");
      if (loc) firstBatch.push(loc.panoId);
    }

    // Append new locations
    const newLocs = [
      makeLoc({ province: "Bursa", panoId: "new_1", locationHash: "nh1" }),
      makeLoc({ province: "Antalya", panoId: "new_2", locationHash: "nh2" }),
    ];
    bag.appendToPool("urban", newLocs);

    // Pool size should now be 5
    expect(bag.getStats("urban").poolSize).toBe(5);

    // Draw more — after reshuffle, new locations should appear
    const allDrawn = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const loc = bag.draw("urban");
      if (loc) allDrawn.add(loc.panoId);
    }

    // New panoIds should eventually appear
    expect(allDrawn.has("new_1") || allDrawn.has("new_2")).toBe(true);
  });
});

// ==================== 10K STABILITY ====================

describe("BagSelector — 10K Draw Stability", () => {
  test("10K draws complete without crash", () => {
    const bag = new BagSelector();
    const provinces = [
      "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya",
      "Adana", "Konya", "Gaziantep", "Samsun", "Trabzon",
    ];
    bag.setPool("urban", makePool(100, provinces));

    let draws = 0;
    let nulls = 0;

    for (let i = 0; i < 10000; i++) {
      const loc = bag.draw("urban");
      if (loc) draws++;
      else nulls++;
    }

    // Most draws should succeed
    expect(draws).toBeGreaterThan(9000);
    // Some nulls are acceptable (skip exhaustion at bag boundaries)
    expect(nulls).toBeLessThan(1000);

    // Stats should show many reshuffles
    const stats = bag.getStats("urban");
    expect(stats.generation).toBeGreaterThan(50);
  });

  test("province distribution is roughly uniform over 10K draws", () => {
    const bag = new BagSelector();
    const provinces = [
      "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya",
      "Adana", "Konya", "Gaziantep", "Samsun", "Trabzon",
    ];
    bag.setPool("urban", makePool(100, provinces));

    const provinceCounts = new Map<string, number>();

    for (let i = 0; i < 5000; i++) {
      const loc = bag.draw("urban");
      if (!loc) continue;
      provinceCounts.set(
        loc.province,
        (provinceCounts.get(loc.province) || 0) + 1
      );
    }

    // Each province should have been drawn (all 10 covered)
    expect(provinceCounts.size).toBe(10);

    // Distribution should be roughly uniform (within 3x of average)
    const values = [...provinceCounts.values()];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    for (const count of values) {
      expect(count).toBeGreaterThan(avg * 0.2); // At least 20% of average
      expect(count).toBeLessThan(avg * 3.0);    // At most 3x average
    }
  });
});

// ==================== RESET ====================

describe("BagSelector — Reset", () => {
  test("reset clears both bags", () => {
    const bag = new BagSelector();
    bag.setPool("urban", makePool(10, ["Istanbul", "Ankara", "Izmir", "Bursa", "Antalya"]));
    bag.setPool("geo", makePool(10, ["Trabzon", "Samsun", "Rize", "Artvin", "Ordu"]));

    bag.draw("urban");
    bag.draw("geo");

    bag.reset();

    const urbanStats = bag.getStats("urban");
    const geoStats = bag.getStats("geo");

    expect(urbanStats.pointer).toBe(0);
    expect(urbanStats.generation).toBe(0);
    expect(geoStats.pointer).toBe(0);
    expect(geoStats.generation).toBe(0);
  });
});
