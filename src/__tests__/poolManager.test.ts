/**
 * PoolManager — Unit Tests
 *
 * Tests cover:
 * - toPackage conversion (PrecomputedLocation → PanoPackage)
 * - Manifest and chunk loading (mocked fetch)
 * - drawPackage returns valid PanoPackage
 * - Fallback behavior when pool is empty
 * - Stats and telemetry
 * - Reset behavior
 */

import { PoolManager, resetPoolManagerSingleton, getPoolManager } from "../services/poolManager";
import { PrecomputedLocation, PoolManifest, PrecomputedChunk } from "../types/precomputed";
import { PanoPackage } from "../types";
import {
  resetPersistentHistoryState,
  initPersistentHistoryFromArray,
} from "../services/persistentHistory";

// ==================== HELPERS ====================

function makeLoc(
  overrides: Partial<PrecomputedLocation> = {}
): PrecomputedLocation {
  const lat = overrides.lat ?? 39.0 + Math.random() * 4;
  const lng = overrides.lng ?? 27.0 + Math.random() * 15;
  return {
    id: overrides.id ?? `pc_test_${Math.random().toString(36).substr(2, 6)}`,
    panoId: overrides.panoId ?? `pano_${Math.random().toString(36).substr(2, 8)}`,
    lat,
    lng,
    heading: overrides.heading ?? 90,
    province: overrides.province ?? "Istanbul",
    district: overrides.district ?? "Fatih",
    region: overrides.region ?? "marmara",
    classification: overrides.classification ?? "urban",
    roadType: overrides.roadType ?? "urban_street",
    qualityScore: overrides.qualityScore ?? 4,
    locationHash: overrides.locationHash ?? `${lat.toFixed(3)}_${lng.toFixed(3)}`,
    clusterId: overrides.clusterId ?? `Istanbul__${lat.toFixed(3)}_${lng.toFixed(3)}`,
    validatedAt: overrides.validatedAt ?? new Date().toISOString(),
    osmMeta: overrides.osmMeta ?? {
      insideCityBoundary: true,
      nearestRoadClass: "residential",
      buildingDensity: 0.6,
    },
  };
}

function makeManifest(urbanCount: number, geoCount: number): PoolManifest {
  const chunks = [];
  const urbanChunkCount = Math.ceil(urbanCount / 200);
  const geoChunkCount = Math.ceil(geoCount / 200);

  for (let i = 0; i < urbanChunkCount; i++) {
    const count = Math.min(200, urbanCount - i * 200);
    chunks.push({
      id: `urban_chunk_${i}`,
      mode: "urban" as const,
      count,
      url: `/data/pool/urban_chunk_${i}.json`,
      hash: `hash_urban_${i}`,
    });
  }

  for (let i = 0; i < geoChunkCount; i++) {
    const count = Math.min(200, geoCount - i * 200);
    chunks.push({
      id: `geo_chunk_${i}`,
      mode: "geo" as const,
      count,
      url: `/data/pool/geo_chunk_${i}.json`,
      hash: `hash_geo_${i}`,
    });
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    chunks,
    totalUrban: urbanCount,
    totalGeo: geoCount,
  };
}

function makeChunk(
  chunkId: string,
  mode: "urban" | "geo",
  count: number,
  provinces: string[]
): PrecomputedChunk {
  const locations: PrecomputedLocation[] = [];
  for (let i = 0; i < count; i++) {
    locations.push(
      makeLoc({
        id: `${chunkId}_loc_${i}`,
        province: provinces[i % provinces.length],
        classification: mode,
        panoId: `pano_${chunkId}_${i}`,
        locationHash: `${(39 + i * 0.01).toFixed(3)}_${(28 + i * 0.01).toFixed(3)}`,
      })
    );
  }

  return {
    chunkId,
    mode,
    locations,
    version: 1,
    generatedAt: new Date().toISOString(),
  };
}

// ==================== MOCKING ====================

const mockFetchResponses: Map<string, unknown> = new Map();

function setupMockFetch(): void {
  const originalFetch = global.fetch;
  global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();

    // Find matching mock
    for (const [pattern, data] of mockFetchResponses) {
      if (url.includes(pattern)) {
        return {
          ok: true,
          status: 200,
          json: async () => data,
        } as Response;
      }
    }

    // Not found
    return {
      ok: false,
      status: 404,
      statusText: "Not Found",
      json: async () => ({}),
    } as Response;
  };
}

// ==================== SETUP ====================

beforeEach(() => {
  resetPersistentHistoryState();
  initPersistentHistoryFromArray([]);
  resetPoolManagerSingleton();
  mockFetchResponses.clear();
  setupMockFetch();
});

afterEach(() => {
  resetPoolManagerSingleton();
});

// ==================== toPackage CONVERSION ====================

describe("PoolManager — toPackage Conversion", () => {
  test("drawPackage returns a valid PanoPackage when pool is loaded", async () => {
    const manifest = makeManifest(10, 0);
    const chunk = makeChunk("urban_chunk_0", "urban", 10, [
      "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya",
    ]);

    mockFetchResponses.set("manifest.json", manifest);
    mockFetchResponses.set("urban_chunk_0.json", chunk);

    const pm = new PoolManager();
    const pkg = await pm.drawPackage("urban");

    expect(pkg).not.toBeNull();
    expect(pkg!.id).toMatch(/^pool_/);
    expect(pkg!.mode).toBe("urban");
    expect(pkg!.pano0).toBeDefined();
    expect(pkg!.pano0.panoId).toBeTruthy();
    expect(pkg!.pano1).toBeDefined();
    expect(pkg!.pano2).toBeDefined();
    expect(pkg!.pano3).toBeDefined();
    expect(pkg!.locationName).toBeTruthy();
    expect(pkg!.blacklist).toBe(false);
    expect(pkg!.region).toBeTruthy();
    expect(pkg!.roadType).toBeTruthy();
    expect(pkg!.qualityScore).toBeGreaterThanOrEqual(1);
    expect(pkg!.qualityScore).toBeLessThanOrEqual(5);
  });

  test("pano branches have correct heading offsets", async () => {
    const loc = makeLoc({ heading: 90 });
    const manifest = makeManifest(1, 0);
    const chunk: PrecomputedChunk = {
      chunkId: "urban_chunk_0",
      mode: "urban",
      locations: [loc],
      version: 1,
      generatedAt: new Date().toISOString(),
    };

    mockFetchResponses.set("manifest.json", manifest);
    mockFetchResponses.set("urban_chunk_0.json", chunk);

    const pm = new PoolManager();
    const pkg = await pm.drawPackage("urban");

    expect(pkg).not.toBeNull();
    // pano0 heading = original heading (90)
    expect(pkg!.pano0.heading).toBe(90);
    // pano1 heading = 90 - 90 = 0 (left)
    expect(pkg!.pano1.heading).toBe(0);
    // pano2 heading = 90 + 90 = 180 (right)
    expect(pkg!.pano2.heading).toBe(180);
    // pano3 heading = 90 + 180 = 270 (behind)
    expect(pkg!.pano3.heading).toBe(270);

    // All branches use same panoId
    expect(pkg!.pano1.panoId).toBe(pkg!.pano0.panoId);
    expect(pkg!.pano2.panoId).toBe(pkg!.pano0.panoId);
    expect(pkg!.pano3.panoId).toBe(pkg!.pano0.panoId);
  });

  test("locationName is 'district, province' when district exists", async () => {
    const loc = makeLoc({ province: "Istanbul", district: "Fatih" });
    const manifest = makeManifest(1, 0);
    const chunk: PrecomputedChunk = {
      chunkId: "urban_chunk_0",
      mode: "urban",
      locations: [loc],
      version: 1,
      generatedAt: new Date().toISOString(),
    };

    mockFetchResponses.set("manifest.json", manifest);
    mockFetchResponses.set("urban_chunk_0.json", chunk);

    const pm = new PoolManager();
    const pkg = await pm.drawPackage("urban");

    expect(pkg!.locationName).toBe("Fatih, Istanbul");
  });

  test("locationName is just province when district is empty", async () => {
    const loc = makeLoc({ province: "Istanbul", district: "" });
    const manifest = makeManifest(1, 0);
    const chunk: PrecomputedChunk = {
      chunkId: "urban_chunk_0",
      mode: "urban",
      locations: [loc],
      version: 1,
      generatedAt: new Date().toISOString(),
    };

    mockFetchResponses.set("manifest.json", manifest);
    mockFetchResponses.set("urban_chunk_0.json", chunk);

    const pm = new PoolManager();
    const pkg = await pm.drawPackage("urban");

    expect(pkg!.locationName).toBe("Istanbul");
  });

  test("hint tags reflect urban classification", async () => {
    const loc = makeLoc({
      classification: "urban",
      roadType: "urban_street",
      osmMeta: { insideCityBoundary: true, nearestRoadClass: "residential", buildingDensity: 0.8 },
    });
    const manifest = makeManifest(1, 0);
    const chunk: PrecomputedChunk = {
      chunkId: "urban_chunk_0",
      mode: "urban",
      locations: [loc],
      version: 1,
      generatedAt: new Date().toISOString(),
    };

    mockFetchResponses.set("manifest.json", manifest);
    mockFetchResponses.set("urban_chunk_0.json", chunk);

    const pm = new PoolManager();
    const pkg = await pm.drawPackage("urban");

    expect(pkg!.hintTags).toContain("precomputed");
    expect(pkg!.hintTags).toContain("signage");
    expect(pkg!.hintTags).toContain("dense_urban"); // buildingDensity > 0.7
    expect(pkg!.hintTags).toContain("shop"); // urban_street
  });

  test("hint tags reflect geo classification", async () => {
    const loc = makeLoc({
      classification: "geo",
      roadType: "highway",
      osmMeta: { insideCityBoundary: false, nearestRoadClass: "trunk", buildingDensity: 0.1 },
    });
    const manifest = makeManifest(0, 1);
    const chunk: PrecomputedChunk = {
      chunkId: "geo_chunk_0",
      mode: "geo",
      locations: [loc],
      version: 1,
      generatedAt: new Date().toISOString(),
    };

    mockFetchResponses.set("manifest.json", manifest);
    mockFetchResponses.set("geo_chunk_0.json", chunk);

    const pm = new PoolManager();
    const pkg = await pm.drawPackage("geo");

    expect(pkg!.hintTags).toContain("precomputed");
    expect(pkg!.hintTags).toContain("nature");
    expect(pkg!.hintTags).toContain("highway");
  });
});

// ==================== LOADING ====================

describe("PoolManager — Loading", () => {
  test("ensurePoolLoaded returns false when manifest not found", async () => {
    // No mock responses → 404
    const pm = new PoolManager();
    const result = await pm.ensurePoolLoaded("urban");
    expect(result).toBe(false);
  });

  test("ensurePoolLoaded returns false when no chunks for mode", async () => {
    const manifest = makeManifest(0, 10); // Only geo chunks
    mockFetchResponses.set("manifest.json", manifest);

    const pm = new PoolManager();
    const result = await pm.ensurePoolLoaded("urban");
    expect(result).toBe(false);
  });

  test("ensurePoolLoaded returns true when chunk loaded", async () => {
    const manifest = makeManifest(10, 0);
    const chunk = makeChunk("urban_chunk_0", "urban", 10, [
      "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya",
    ]);

    mockFetchResponses.set("manifest.json", manifest);
    mockFetchResponses.set("urban_chunk_0.json", chunk);

    const pm = new PoolManager();
    const result = await pm.ensurePoolLoaded("urban");
    expect(result).toBe(true);
  });

  test("drawPackage returns null when pool is empty", async () => {
    const pm = new PoolManager();
    const pkg = await pm.drawPackage("urban");
    expect(pkg).toBeNull();
  });
});

// ==================== STATS ====================

describe("PoolManager — Stats", () => {
  test("getStats reflects loaded state", async () => {
    const manifest = makeManifest(10, 0);
    const chunk = makeChunk("urban_chunk_0", "urban", 10, [
      "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya",
    ]);

    mockFetchResponses.set("manifest.json", manifest);
    mockFetchResponses.set("urban_chunk_0.json", chunk);

    const pm = new PoolManager();
    await pm.ensurePoolLoaded("urban");

    const stats = pm.getStats("urban");
    expect(stats.poolSize).toBe(10);
    expect(stats.totalLoaded).toBe(10);
    expect(stats.firstChunkReady).toBe(true);
    expect(stats.manifestLoaded).toBe(true);
    expect(stats.manifestVersion).toBe(1);
  });
});

// ==================== RESET ====================

describe("PoolManager — Reset", () => {
  test("reset clears bag state but keeps pool data in memory", async () => {
    const manifest = makeManifest(10, 0);
    const chunk = makeChunk("urban_chunk_0", "urban", 10, [
      "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya",
    ]);

    mockFetchResponses.set("manifest.json", manifest);
    mockFetchResponses.set("urban_chunk_0.json", chunk);

    const pm = new PoolManager();
    await pm.drawPackage("urban"); // Load and draw

    pm.reset();

    // After reset, bagSelector.reset() clears order/pointer but pool arrays
    // are cleared too (emptyBag). The mode state (firstChunkReady) is preserved
    // so re-ensurePoolLoaded won't re-fetch.
    const stats = pm.getStats("urban");
    // Pool data stays in BagSelector arrays (reset only clears bag order)
    // Actually BagSelector.reset() creates emptyBag which has empty order/pointer
    // but doesn't touch the pool arrays — poolSize stays 10
    expect(stats.poolSize).toBe(10);
    expect(stats.firstChunkReady).toBe(true);
  });

  test("fullReset clears everything", async () => {
    const manifest = makeManifest(10, 0);
    const chunk = makeChunk("urban_chunk_0", "urban", 10, [
      "Istanbul", "Ankara", "Izmir", "Bursa", "Antalya",
    ]);

    mockFetchResponses.set("manifest.json", manifest);
    mockFetchResponses.set("urban_chunk_0.json", chunk);

    const pm = new PoolManager();
    await pm.ensurePoolLoaded("urban");

    // Before fullReset, pool is loaded
    expect(pm.getStats("urban").poolSize).toBe(10);

    pm.fullReset();

    // After fullReset, everything is cleared including mode state
    const stats = pm.getStats("urban");
    // BagSelector.reset() doesn't clear pool arrays, but fullReset creates
    // a new BagSelector entirely — so poolSize is 0
    expect(stats.poolSize).toBe(0);
    expect(stats.firstChunkReady).toBe(false);
    expect(stats.manifestLoaded).toBe(false);
  });
});

// ==================== SINGLETON ====================

describe("PoolManager — Singleton", () => {
  test("getPoolManager returns same instance", () => {
    const a = getPoolManager();
    const b = getPoolManager();
    expect(a).toBe(b);
  });

  test("resetPoolManagerSingleton creates fresh instance", () => {
    const a = getPoolManager();
    resetPoolManagerSingleton();
    const b = getPoolManager();
    expect(a).not.toBe(b);
  });
});
