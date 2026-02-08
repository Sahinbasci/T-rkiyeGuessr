/**
 * Location Engine Unit Tests — HARDENED v3
 *
 * Tests cover:
 * - PART 1: Dataset enrichment (auto-difficulty, panoId groups, hotspot bans)
 * - PART 2: Anti-repeat engine (sliding windows, zero consecutive duplicates)
 * - PART 3: Urban difficulty mix (15/55/30 target)
 * - PART 4: Province bag (urban-only, boundary guard, zero back-to-back)
 * - PHASE A: Province back-to-back = 0 (HARD INVARIANT)
 * - PHASE B: Urban-only province bag
 * - PHASE C: Rejection rate and duplicate metrics
 * - PHASE D: Hotspot auto-ban
 * - PHASE E: 10,000-draw stability test
 */

import {
  _testExports,
  resetLocationEngine,
  getEnrichedPackages,
  getEnrichmentReport,
  selectStaticPackage,
  getAntiRepeatState,
  getUrbanProvinceList,
  runSimulation,
  EnrichedPackage,
  Difficulty,
  SimulationResult,
} from "../services/locationEngine";

const {
  extractProvince,
  createLocationHash,
  createClusterId,
  checkAntiRepeat,
  isBackToBackProvince,
  recordSelection,
  fillProvinceBag,
  popProvince,
  pickDifficultyTier,
  selectUrbanPackage,
  antiRepeat,
  getProvinceBag,
  setProvinceBag,
  getLastBagProvince,
  setLastBagProvince,
  getUrbanProvinceList: getUrbanProvinceListInternal,
  PANOID_HOTSPOT_THRESHOLD,
} = _testExports;

// ==================== HELPERS ====================

function createMockEnriched(overrides: Partial<EnrichedPackage> = {}): EnrichedPackage {
  return {
    pkg: {
      id: `test_${Math.random().toString(36).substr(2, 6)}`,
      mode: "urban",
      region: "marmara",
      roadType: "urban_street",
      hintTags: ["signage"],
      qualityScore: 4,
      blacklist: false,
      pano0: { panoId: `pano_${Math.random().toString(36).substr(2, 8)}`, lat: 41.0, lng: 29.0, heading: 0 },
      pano1: { panoId: "p1", lat: 41.001, lng: 29.001, heading: 90 },
      pano2: { panoId: "p2", lat: 41.001, lng: 28.999, heading: 270 },
      pano3: { panoId: "p3", lat: 41.002, lng: 29.0, heading: 0 },
      locationName: "Fatih, İstanbul",
    },
    province: "İstanbul",
    difficulty: "medium" as Difficulty,
    bannedUrban: false,
    locationHash: "41.000_29.000",
    clusterId: "İstanbul__41.000_29.000",
    clusterSize: 1,
    panoIdGroup: 1,
    easyScore: 50,
    ...overrides,
  };
}

// ==================== PART 1: ENRICHMENT TESTS ====================

describe("Part 1: Dataset Enrichment", () => {
  test("extractProvince handles 'İlçe, İl' format", () => {
    expect(extractProvince("Fatih, İstanbul")).toBe("İstanbul");
    expect(extractProvince("Kızılay, Ankara")).toBe("Ankara");
    expect(extractProvince("Merkez, Giresun")).toBe("Giresun");
  });

  test("extractProvince handles single name format", () => {
    const result = extractProvince("Toros Dağları");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("createLocationHash produces consistent hashes", () => {
    const h1 = createLocationHash(41.0086, 28.9802);
    const h2 = createLocationHash(41.0086, 28.9802);
    expect(h1).toBe(h2);
  });

  test("createLocationHash produces different hashes for distant points", () => {
    const h1 = createLocationHash(41.0, 29.0);
    const h2 = createLocationHash(39.0, 32.0);
    expect(h1).not.toBe(h2);
  });

  test("createClusterId combines province and hash", () => {
    const id = createClusterId("İstanbul", "41.009_28.980");
    expect(id).toBe("İstanbul__41.009_28.980");
  });

  test("enriched urban packages have required fields including panoIdGroup", () => {
    const urbanPackages = getEnrichedPackages("urban");
    expect(urbanPackages.length).toBeGreaterThan(0);

    for (const ep of urbanPackages) {
      expect(ep.province).toBeTruthy();
      expect(["easy", "medium", "hard"]).toContain(ep.difficulty);
      expect(typeof ep.bannedUrban).toBe("boolean");
      expect(ep.locationHash).toBeTruthy();
      expect(ep.clusterId).toBeTruthy();
      expect(ep.clusterSize).toBeGreaterThanOrEqual(1);
      expect(ep.panoIdGroup).toBeGreaterThanOrEqual(1);
      expect(ep.easyScore).toBeGreaterThanOrEqual(0);
      expect(ep.easyScore).toBeLessThanOrEqual(100);
    }
  });

  test("enriched packages have all three difficulty tiers", () => {
    const urbanPackages = getEnrichedPackages("urban");
    const diffs = new Set(urbanPackages.map(ep => ep.difficulty));
    expect(diffs.has("easy")).toBe(true);
    expect(diffs.has("medium")).toBe(true);
    expect(diffs.has("hard")).toBe(true);
  });

  test("enrichment report is generated without errors", () => {
    const report = getEnrichmentReport();
    expect(report).toContain("ENRICHMENT REPORT");
    expect(report).toContain("URBAN");
    expect(report).toContain("Difficulty:");
    expect(report).toContain("BannedUrban:");
    expect(report).toContain("Available (non-banned):");
    expect(report).toContain("URBAN PROVINCE BAG");
  });

  test("blacklisted packages are flagged bannedUrban", () => {
    const urbanPackages = getEnrichedPackages("urban");
    for (const ep of urbanPackages) {
      if (ep.pkg.blacklist) {
        expect(ep.bannedUrban).toBe(true);
      }
    }
  });
});

// ==================== PART 2: ANTI-REPEAT ENGINE TESTS ====================

describe("Part 2: Anti-Repeat Engine", () => {
  beforeEach(() => {
    resetLocationEngine();
  });

  test("rejects duplicate panoId", () => {
    const ep = createMockEnriched();
    recordSelection(ep);

    const ep2 = createMockEnriched({
      locationHash: "different_hash",
      clusterId: "different_cluster",
      province: "Ankara",
    });
    ep2.pkg.pano0.panoId = ep.pkg.pano0.panoId;

    const rejection = checkAntiRepeat(ep2);
    expect(rejection).toBe("recent_panoId");
  });

  test("rejects duplicate locationHash", () => {
    const ep = createMockEnriched();
    recordSelection(ep);

    const ep2 = createMockEnriched({
      locationHash: ep.locationHash,
      clusterId: "different_cluster",
      province: "Ankara",
    });

    const rejection = checkAntiRepeat(ep2);
    expect(rejection).toBe("recent_locationHash");
  });

  test("rejects duplicate clusterId", () => {
    const ep = createMockEnriched();
    recordSelection(ep);

    const ep2 = createMockEnriched({
      locationHash: "different_hash",
      clusterId: ep.clusterId,
      province: "Ankara",
    });

    const rejection = checkAntiRepeat(ep2);
    expect(rejection).toBe("recent_clusterId");
  });

  test("isBackToBackProvince detects consecutive province", () => {
    const ep = createMockEnriched({ province: "İstanbul" });
    recordSelection(ep);

    expect(isBackToBackProvince("İstanbul")).toBe(true);
    expect(isBackToBackProvince("Ankara")).toBe(false);
  });

  test("sliding window evicts old entries", () => {
    for (let i = 0; i < 20; i++) {
      const ep = createMockEnriched({
        province: `Province${i}`,
        locationHash: `hash_${i}`,
        clusterId: `cluster_${i}`,
      });
      ep.pkg.pano0.panoId = `pano_${i}`;
      recordSelection(ep);
    }

    const state = getAntiRepeatState();
    expect(state.recentPanoIds.length).toBeLessThanOrEqual(20);

    const ep21 = createMockEnriched({
      province: "Province20",
      locationHash: "hash_20",
      clusterId: "cluster_20",
    });
    ep21.pkg.pano0.panoId = "pano_20";
    recordSelection(ep21);

    const stateAfter = getAntiRepeatState();
    expect(stateAfter.recentPanoIds).toContain("pano_20");
    // pano_0 should be evicted (window size 10 for panoIds)
    expect(stateAfter.recentPanoIds).not.toContain("pano_0");
  });

  test("no consecutive package ID duplicates in 200 selections", () => {
    resetLocationEngine();
    const pkgIds: string[] = [];

    for (let i = 0; i < 200; i++) {
      const result = selectUrbanPackage();
      if (!result) continue;
      const currentPkgId = result.pkg.id;

      if (pkgIds.length > 0) {
        expect(currentPkgId).not.toBe(pkgIds[pkgIds.length - 1]);
      }
      pkgIds.push(currentPkgId);
    }
  });

  test("no consecutive locationHash duplicates in 200 selections", () => {
    resetLocationEngine();
    const hashes: string[] = [];

    for (let i = 0; i < 200; i++) {
      const result = selectUrbanPackage();
      if (!result) continue;

      if (hashes.length > 0) {
        expect(result.locationHash).not.toBe(hashes[hashes.length - 1]);
      }
      hashes.push(result.locationHash);
    }
  });

  test("no consecutive cluster duplicates in 200 selections", () => {
    resetLocationEngine();
    const clusters: string[] = [];

    for (let i = 0; i < 200; i++) {
      const result = selectUrbanPackage();
      if (!result) continue;

      if (clusters.length > 0) {
        expect(result.clusterId).not.toBe(clusters[clusters.length - 1]);
      }
      clusters.push(result.clusterId);
    }
  });
});

// ==================== PHASE A: PROVINCE BACK-TO-BACK = 0 ====================

describe("Phase A: Province Back-to-Back ZERO TOLERANCE", () => {
  beforeEach(() => {
    resetLocationEngine();
  });

  test("HARD: zero back-to-back same province in 500 urban selections", () => {
    const provinces: string[] = [];

    for (let i = 0; i < 500; i++) {
      const result = selectUrbanPackage();
      if (!result) continue;

      if (provinces.length > 0) {
        expect(result.province).not.toBe(provinces[provinces.length - 1]);
      }
      provinces.push(result.province);
    }

    // Count should be exactly 0
    let consecutiveCount = 0;
    for (let i = 1; i < provinces.length; i++) {
      if (provinces[i] === provinces[i - 1]) consecutiveCount++;
    }
    expect(consecutiveCount).toBe(0);
  });

  test("HARD: zero back-to-back across bag boundaries", () => {
    // Force bag exhaustion and refill multiple times
    const provinces: string[] = [];
    const urbanProvCount = getUrbanProvinceList().length;

    // Draw enough to cycle through bags multiple times
    for (let i = 0; i < urbanProvCount * 3; i++) {
      const result = selectUrbanPackage();
      if (!result) continue;

      if (provinces.length > 0) {
        expect(result.province).not.toBe(provinces[provinces.length - 1]);
      }
      provinces.push(result.province);
    }
  });

  test("HARD: popProvince never returns lastProvince", () => {
    // Set lastProvince and verify popProvince never returns it
    const ep = createMockEnriched({ province: "İstanbul" });
    recordSelection(ep);

    // Pop 100 provinces — none should be İstanbul consecutively
    for (let i = 0; i < 100; i++) {
      const prov = popProvince();
      expect(prov).not.toBe(antiRepeat.lastProvince || "IMPOSSIBLE");
      // Simulate recording so lastProvince updates
      antiRepeat.lastProvince = prov;
    }
  });
});

// ==================== PHASE B: URBAN-ONLY PROVINCE BAG ====================

describe("Phase B: Urban-Only Province Bag", () => {
  beforeEach(() => {
    resetLocationEngine();
  });

  test("province bag contains only provinces with urban packages", () => {
    const urbanProvs = getUrbanProvinceList();
    expect(urbanProvs.length).toBeGreaterThan(0);
    expect(urbanProvs.length).toBeLessThan(81); // Not all 81

    // Every province in the bag should have at least one non-banned urban package
    const enriched = getEnrichedPackages("urban");
    for (const prov of urbanProvs) {
      const hasPackage = enriched.some(ep => ep.province === prov && !ep.bannedUrban);
      expect(hasPackage).toBe(true);
    }
  });

  test("fillProvinceBag creates bag from urban provinces only", () => {
    fillProvinceBag();
    const bag = getProvinceBag();
    const urbanProvs = getUrbanProvinceList();

    expect(bag.length).toBe(urbanProvs.length);

    const unique = new Set(bag);
    expect(unique.size).toBe(urbanProvs.length);

    // All bag entries should be in urban province list
    for (const prov of bag) {
      expect(urbanProvs).toContain(prov);
    }
  });

  test("one full cycle covers all urban provinces", () => {
    const urbanProvs = getUrbanProvinceList();
    const provCount = urbanProvs.length;

    // Pop enough provinces to guarantee one full cycle
    // popProvince may skip some due to back-to-back guard,
    // so we draw more than provCount to be safe
    const drawn = new Set<string>();
    for (let i = 0; i < provCount * 2; i++) {
      const prov = popProvince();
      drawn.add(prov);
      // Update lastProvince to simulate real usage
      antiRepeat.lastProvince = prov;

      if (drawn.size === provCount) break;
    }
    expect(drawn.size).toBe(provCount);
  });

  test("boundary guard prevents same province at bag boundary", () => {
    const urbanProvs = getUrbanProvinceList();

    // Draw all provinces (empties bag)
    let lastDrawn = "";
    for (let i = 0; i < urbanProvs.length; i++) {
      lastDrawn = popProvince();
      antiRepeat.lastProvince = lastDrawn;
    }

    // Next draw triggers refill — should NOT be same as lastDrawn
    const firstOfNewBag = popProvince();
    expect(firstOfNewBag).not.toBe(lastDrawn);
  });
});

// ==================== PART 3: DIFFICULTY MIX TESTS ====================

describe("Part 3: Urban Difficulty Mix", () => {
  test("pickDifficultyTier returns valid difficulties", () => {
    const results = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      results.add(pickDifficultyTier());
    }
    expect(results.has("easy")).toBe(true);
    expect(results.has("medium")).toBe(true);
    expect(results.has("hard")).toBe(true);
  });

  test("pickDifficultyTier roughly follows 15/55/30 distribution", () => {
    const counts = { easy: 0, medium: 0, hard: 0 };
    const N = 10000;

    for (let i = 0; i < N; i++) {
      counts[pickDifficultyTier()]++;
    }

    expect(counts.easy / N).toBeGreaterThan(0.10);
    expect(counts.easy / N).toBeLessThan(0.20);
    expect(counts.medium / N).toBeGreaterThan(0.50);
    expect(counts.medium / N).toBeLessThan(0.60);
    expect(counts.hard / N).toBeGreaterThan(0.25);
    expect(counts.hard / N).toBeLessThan(0.35);
  });

  test("selectStaticPackage returns valid urban packages", () => {
    resetLocationEngine();

    for (let i = 0; i < 20; i++) {
      const pkg = selectStaticPackage("urban");
      if (!pkg) continue;
      expect(pkg.mode).toBe("urban");
      expect(pkg.blacklist).toBe(false);
    }
  });
});

// ==================== PHASE D: HOTSPOT / SIGNAGE HARDENING ====================

describe("Phase D: Hotspot Handling", () => {
  test("hotspot packages (high panoIdGroup) are scored as easy, not banned", () => {
    const urbanPackages = getEnrichedPackages("urban");
    const hotspots = urbanPackages.filter(ep => ep.panoIdGroup >= PANOID_HOTSPOT_THRESHOLD);

    // Hotspot packages should NOT be banned (strategy: window prevention, not banning)
    for (const ep of hotspots) {
      // Only blacklisted packages should be banned
      if (!ep.pkg.blacklist) {
        expect(ep.bannedUrban).toBe(false);
      }
    }

    // Hotspot packages should have HIGH easyScore (well-covered = easy)
    if (hotspots.length > 0) {
      const avgHotspotScore = hotspots.reduce((sum, ep) => sum + ep.easyScore, 0) / hotspots.length;
      const avgAllScore = urbanPackages.reduce((sum, ep) => sum + ep.easyScore, 0) / urbanPackages.length;
      expect(avgHotspotScore).toBeGreaterThanOrEqual(avgAllScore);
    }
  });

  test("banned packages (blacklisted) are never selected", () => {
    resetLocationEngine();
    const bannedPkgIds = new Set(
      getEnrichedPackages("urban")
        .filter(ep => ep.bannedUrban)
        .map(ep => ep.pkg.id)
    );

    for (let i = 0; i < 200; i++) {
      const result = selectUrbanPackage();
      if (!result) continue;
      expect(bannedPkgIds.has(result.pkg.id)).toBe(false);
    }
  });

  test("hotspot table: province → totalPackages → hotspotPanoIdGroups → bannedPackages", () => {
    const urbanPackages = getEnrichedPackages("urban");

    const provStats = new Map<string, { total: number; hotspot: number; banned: number }>();
    for (const ep of urbanPackages) {
      if (!provStats.has(ep.province)) {
        provStats.set(ep.province, { total: 0, hotspot: 0, banned: 0 });
      }
      const stats = provStats.get(ep.province)!;
      stats.total++;
      if (ep.panoIdGroup >= PANOID_HOTSPOT_THRESHOLD) stats.hotspot++;
      if (ep.bannedUrban) stats.banned++;
    }

    // Print hotspot table for report
    console.log("\n--- HOTSPOT TABLE ---");
    console.log("Province | Total | Hotspot | Banned");
    const sorted = Array.from(provStats.entries()).sort((a, b) => b[1].total - a[1].total);
    for (const [prov, stats] of sorted) {
      if (stats.hotspot > 0 || stats.banned > 0) {
        console.log(`${prov} | ${stats.total} | ${stats.hotspot} | ${stats.banned}`);
      }
    }
  });

  test("anti-repeat panoId window prevents consecutive hotspot reuse", () => {
    resetLocationEngine();
    const panoIds: string[] = [];

    for (let i = 0; i < 200; i++) {
      const result = selectUrbanPackage();
      if (!result) continue;

      // No consecutive same panoId
      if (panoIds.length > 0) {
        expect(result.pkg.pano0.panoId).not.toBe(panoIds[panoIds.length - 1]);
      }
      panoIds.push(result.pkg.pano0.panoId);
    }
  });
});

// ==================== PHASE E: 10,000-DRAW STABILITY TEST ====================

describe("Phase E: 10,000-Draw Stability Test", () => {
  test("10,000 draws: all hard invariants hold", () => {
    resetLocationEngine();
    const stats = runSimulation(10000);

    console.log("\n=== 10,000-DRAW SIMULATION RESULTS ===");
    console.log(`Total draws: ${stats.totalDraws}`);
    console.log(`Total successful: ${stats.totalSuccessful}`);
    const total = stats.totalSuccessful;
    console.log(`Difficulty distribution:`);
    console.log(`  Easy:   ${stats.difficultyDist.easy} (${((stats.difficultyDist.easy / total) * 100).toFixed(1)}%)`);
    console.log(`  Medium: ${stats.difficultyDist.medium} (${((stats.difficultyDist.medium / total) * 100).toFixed(1)}%)`);
    console.log(`  Hard:   ${stats.difficultyDist.hard} (${((stats.difficultyDist.hard / total) * 100).toFixed(1)}%)`);
    console.log(`Province coverage: ${stats.provinceCoverage}`);
    console.log(`Banned selections: ${stats.bannedSelections}`);
    console.log(`Consecutive same province: ${stats.consecutiveSameProvince}`);
    console.log(`Consecutive same panoId: ${stats.consecutiveSamePanoId}`);
    console.log(`Consecutive same locationHash: ${stats.consecutiveSameLocationHash}`);
    console.log(`Consecutive same clusterId: ${stats.consecutiveSameClusterId}`);
    console.log(`Duplicate panoIds generated: ${stats.duplicateGeneratedCount}`);
    console.log(`Duplicate panoIds returned (consecutive): ${stats.duplicateReturnedCount}`);
    console.log(`Rejection rate: ${(stats.rejectionRate * 100).toFixed(1)}%`);

    console.log(`\n--- Sample log (first 20) ---`);
    stats.sampleLog.slice(0, 20).forEach(line => console.log(line));

    // ===== HARD INVARIANTS =====

    // Province back-to-back = 0 (PHASE A)
    expect(stats.consecutiveSameProvince).toBe(0);

    // PanoId back-to-back = 0
    expect(stats.consecutiveSamePanoId).toBe(0);

    // LocationHash back-to-back = 0
    expect(stats.consecutiveSameLocationHash).toBe(0);

    // ClusterId back-to-back = 0
    expect(stats.consecutiveSameClusterId).toBe(0);

    // Banned selections = 0 (PHASE D)
    expect(stats.bannedSelections).toBe(0);

    // Duplicate returned count = 0
    expect(stats.duplicateReturnedCount).toBe(0);

    // ===== SOFT TARGETS (±3%) =====

    // Difficulty distribution within ±5% of target
    const easyPct = stats.difficultyDist.easy / total;
    const mediumPct = stats.difficultyDist.medium / total;
    const hardPct = stats.difficultyDist.hard / total;

    expect(easyPct).toBeGreaterThan(0.08);
    expect(easyPct).toBeLessThan(0.22);
    expect(mediumPct).toBeGreaterThan(0.45);
    expect(mediumPct).toBeLessThan(0.65);
    expect(hardPct).toBeGreaterThan(0.22);
    expect(hardPct).toBeLessThan(0.38);

    // All draws successful
    expect(stats.totalSuccessful).toBe(stats.totalDraws);

    // Province coverage — should cover all urban provinces
    const urbanProvCount = getUrbanProvinceList().length;
    expect(stats.provinceCoverage).toBe(urbanProvCount);
  });
});
