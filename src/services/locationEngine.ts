/**
 * PROFESSIONAL URBAN LOCATION SELECTION ENGINE
 *
 * This module implements a comprehensive location selection system with:
 * 1. Auto-difficulty tagging (easy/medium/hard) based on cluster analysis
 * 2. Anti-repeat engine with sliding window dedup
 * 3. Difficulty mix targeting (15% easy, 55% medium, 30% hard)
 * 4. Province bag rotation (Fisher-Yates, 81 provinces, boundary guard)
 *
 * ZERO new API calls. Deterministic multiplayer (host decides).
 * Urban mode NEVER shows rural/empty roads.
 */

import { PanoPackage, GameMode } from "@/types";
import { URBAN_PACKAGES, GEO_PACKAGES } from "@/data/panoPackages";
import { TURKEY_CITIES } from "./dynamicPanoService";

// ==================== TYPES ====================

export type Difficulty = "easy" | "medium" | "hard";

export interface EnrichedPackage {
  pkg: PanoPackage;
  province: string;          // Extracted province name (e.g., "İstanbul")
  difficulty: Difficulty;
  bannedUrban: boolean;
  locationHash: string;      // Grid hash from lat/lng (3 decimal ~111m)
  clusterId: string;         // Province + grid cell
  clusterSize: number;       // How many packages share this cluster
  easyScore: number;         // 0-100 composite score
}

interface AntiRepeatState {
  recentPackageIds: string[];    // Last 20 package IDs (pkg.id)
  recentPanoIds: string[];       // Last 20 pano IDs (pano0.panoId)
  recentLocationHashes: string[];// Last 20 location hashes
  recentClusterIds: string[];    // Last 20 cluster IDs
  recentProvinces: string[];     // Last 5 provinces
  lastProvince: string | null;   // Previous round's province
}

// ==================== CONSTANTS ====================

const DIFFICULTY_MIX = { easy: 0.15, medium: 0.55, hard: 0.30 };
const RECENT_PANO_WINDOW = 20;
const RECENT_HASH_WINDOW = 20;
const RECENT_CLUSTER_WINDOW = 20;
const RECENT_PROVINCE_WINDOW = 5;
const GRID_PRECISION = 3;  // 3 decimals ≈ 111m cells
const MAX_SELECTION_ATTEMPTS = 50;
const HOTSPOT_CLUSTER_THRESHOLD = 5;  // Clusters with >= 5 packages are hotspots

// ==================== MODULE STATE ====================

let enrichedUrbanCache: EnrichedPackage[] = [];
let enrichedGeoCache: EnrichedPackage[] = [];
let enrichmentReportGenerated = false;

// Province bag state
let provinceBag: string[] = [];
let lastBagProvince: string | null = null;

// Anti-repeat state
const antiRepeat: AntiRepeatState = {
  recentPackageIds: [],
  recentPanoIds: [],
  recentLocationHashes: [],
  recentClusterIds: [],
  recentProvinces: [],
  lastProvince: null,
};

// Static used IDs (session dedup — existing behavior preserved)
let staticUsedIds: Set<string> = new Set();

// ==================== PART 1: DATASET ENRICHMENT ====================

/**
 * Extract province name from locationName.
 * Handles formats: "İlçe, İl" and "İl" and "Merkez, İl"
 */
function extractProvince(locationName: string): string {
  const parts = locationName.split(",").map(s => s.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 1]; // Last part is province
  }
  // Single name — match against TURKEY_CITIES
  const cityMatch = TURKEY_CITIES.find(c =>
    locationName.includes(c.name) || c.name.includes(locationName)
  );
  return cityMatch ? cityMatch.name : locationName;
}

/**
 * Create grid hash from coordinates (GRID_PRECISION decimals).
 * At precision 3: each cell ≈ 111m × 111m
 */
function createLocationHash(lat: number, lng: number): string {
  const factor = Math.pow(10, GRID_PRECISION);
  const rLat = Math.round(lat * factor) / factor;
  const rLng = Math.round(lng * factor) / factor;
  return `${rLat}_${rLng}`;
}

/**
 * Create cluster ID from province + grid cell
 */
function createClusterId(province: string, locationHash: string): string {
  return `${province}__${locationHash}`;
}

/**
 * Enrich all packages with difficulty, cluster info, and auto-blacklist.
 * This is a pure computation — no API calls.
 */
function enrichPackages(packages: PanoPackage[], mode: GameMode): EnrichedPackage[] {
  // Step 1: Basic enrichment
  const enriched: EnrichedPackage[] = packages.map(pkg => {
    const province = extractProvince(pkg.locationName);
    const locationHash = createLocationHash(pkg.pano0.lat, pkg.pano0.lng);
    const clusterId = createClusterId(province, locationHash);
    return {
      pkg,
      province,
      difficulty: "medium" as Difficulty, // Will be overwritten
      bannedUrban: false,
      locationHash,
      clusterId,
      clusterSize: 0,
      easyScore: 50,
    };
  });

  // Step 2: Compute cluster sizes
  const clusterCounts = new Map<string, number>();
  for (const ep of enriched) {
    clusterCounts.set(ep.clusterId, (clusterCounts.get(ep.clusterId) || 0) + 1);
  }
  for (const ep of enriched) {
    ep.clusterSize = clusterCounts.get(ep.clusterId) || 1;
  }

  // Step 3: Compute province package counts
  const provinceCounts = new Map<string, number>();
  for (const ep of enriched) {
    provinceCounts.set(ep.province, (provinceCounts.get(ep.province) || 0) + 1);
  }

  // Step 4: Compute easyScore (0–100)
  // Higher = easier (more recognizable, well-covered area)
  const maxCluster = Math.max(...Array.from(clusterCounts.values()), 1);
  const maxProvCount = Math.max(...Array.from(provinceCounts.values()), 1);

  for (const ep of enriched) {
    const clusterFactor = (ep.clusterSize / maxCluster) * 40;   // 0-40 pts
    const provFactor = ((provinceCounts.get(ep.province) || 1) / maxProvCount) * 35; // 0-35 pts
    const qualityFactor = ((ep.pkg.qualityScore || 3) / 5) * 25; // 0-25 pts
    ep.easyScore = Math.round(clusterFactor + provFactor + qualityFactor);
  }

  // Step 5: Assign difficulty tiers using PERCENTILE-BASED ranking
  // This ensures all 3 tiers exist regardless of score distribution.
  // Sort by easyScore descending, then assign:
  //   Top 15% → easy, Next 55% → medium, Bottom 30% → hard
  const sorted = [...enriched].sort((a, b) => b.easyScore - a.easyScore);
  const easyThresholdIdx = Math.floor(sorted.length * 0.15);
  const mediumThresholdIdx = Math.floor(sorted.length * 0.70); // 15% + 55%

  // Get score thresholds from sorted positions
  const easyScoreThreshold = sorted[Math.min(easyThresholdIdx, sorted.length - 1)]?.easyScore ?? 70;
  const hardScoreThreshold = sorted[Math.min(mediumThresholdIdx, sorted.length - 1)]?.easyScore ?? 40;

  for (const ep of enriched) {
    if (ep.easyScore >= easyScoreThreshold && easyScoreThreshold > hardScoreThreshold) {
      ep.difficulty = "easy";
    } else if (ep.easyScore >= hardScoreThreshold) {
      ep.difficulty = "medium";
    } else {
      ep.difficulty = "hard";
    }
  }

  // If percentile thresholds collapsed (all same score), force distribution
  const counts = { easy: 0, medium: 0, hard: 0 };
  for (const ep of enriched) counts[ep.difficulty]++;
  if (counts.hard === 0 && enriched.length >= 3) {
    // Force bottom 30% to hard
    for (let i = mediumThresholdIdx; i < sorted.length; i++) {
      sorted[i].difficulty = "hard";
    }
    // Force top 15% to easy
    for (let i = 0; i < easyThresholdIdx; i++) {
      sorted[i].difficulty = "easy";
    }
    // Rest are medium
    for (let i = easyThresholdIdx; i < mediumThresholdIdx; i++) {
      sorted[i].difficulty = "medium";
    }
  }

  // Step 6: Auto-blacklist for urban mode
  if (mode === "urban") {
    for (const ep of enriched) {
      // Ban hotspot clusters (too many packages at same spot)
      if (ep.clusterSize >= HOTSPOT_CLUSTER_THRESHOLD) {
        ep.bannedUrban = true;
      }
      // Ban packages marked as blacklisted in source data
      if (ep.pkg.blacklist) {
        ep.bannedUrban = true;
      }
    }
  }

  return enriched;
}

/**
 * Initialize enrichment caches. Call once at startup.
 */
function ensureEnrichment(): void {
  if (enrichedUrbanCache.length > 0 && enrichedGeoCache.length > 0) return;

  enrichedUrbanCache = enrichPackages(URBAN_PACKAGES, "urban");
  enrichedGeoCache = enrichPackages(GEO_PACKAGES, "geo");
}

/**
 * Generate and log enrichment report.
 */
export function getEnrichmentReport(): string {
  ensureEnrichment();

  const lines: string[] = ["=== ENRICHMENT REPORT ==="];

  for (const [label, cache] of [["URBAN", enrichedUrbanCache], ["GEO", enrichedGeoCache]] as const) {
    lines.push(`\n--- ${label} (${cache.length} packages) ---`);

    // Packages per province
    const provCounts = new Map<string, number>();
    for (const ep of cache) {
      provCounts.set(ep.province, (provCounts.get(ep.province) || 0) + 1);
    }
    const sortedProvs = Array.from(provCounts.entries()).sort((a, b) => b[1] - a[1]);
    lines.push(`Provinces with packages: ${sortedProvs.length}`);
    for (const [prov, count] of sortedProvs.slice(0, 10)) {
      lines.push(`  ${prov}: ${count}`);
    }
    if (sortedProvs.length > 10) lines.push(`  ... and ${sortedProvs.length - 10} more`);

    // Clusters per province
    const clustersByProv = new Map<string, number[]>();
    const clusterSeen = new Set<string>();
    for (const ep of cache) {
      if (!clusterSeen.has(ep.clusterId)) {
        clusterSeen.add(ep.clusterId);
        if (!clustersByProv.has(ep.province)) clustersByProv.set(ep.province, []);
        clustersByProv.get(ep.province)!.push(ep.clusterSize);
      }
    }
    let totalClusters = 0;
    const allSizes: number[] = [];
    Array.from(clustersByProv.values()).forEach(sizes => {
      totalClusters += sizes.length;
      allSizes.push(...sizes);
    });
    allSizes.sort((a, b) => a - b);
    lines.push(`Total clusters: ${totalClusters}`);
    if (allSizes.length > 0) {
      lines.push(`Cluster size: min=${allSizes[0]} median=${allSizes[Math.floor(allSizes.length / 2)]} max=${allSizes[allSizes.length - 1]}`);
    }

    // Difficulty counts
    const diffCounts = { easy: 0, medium: 0, hard: 0 };
    for (const ep of cache) {
      diffCounts[ep.difficulty]++;
    }
    lines.push(`Difficulty: easy=${diffCounts.easy} medium=${diffCounts.medium} hard=${diffCounts.hard}`);

    // Banned count
    const bannedCount = cache.filter(ep => ep.bannedUrban).length;
    lines.push(`BannedUrban: ${bannedCount}`);
  }

  const report = lines.join("\n");
  if (!enrichmentReportGenerated) {
    console.log(report);
    enrichmentReportGenerated = true;
  }
  return report;
}

// ==================== PART 2: ANTI-REPEAT ENGINE ====================

/**
 * Push to sliding window (FIFO)
 */
function pushWindow(window: string[], value: string, maxSize: number): void {
  window.push(value);
  while (window.length > maxSize) {
    window.shift();
  }
}

/**
 * Check if a candidate passes ALL anti-repeat rules.
 * Returns rejection reason or null if passes.
 */
function checkAntiRepeat(
  ep: EnrichedPackage,
  relaxProvince: boolean = false
): string | null {
  // Rule 0: package ID must not be in recent window
  if (antiRepeat.recentPackageIds.includes(ep.pkg.id)) {
    return "recent_packageId";
  }

  // Rule 1: panoId must not be in recent window
  if (antiRepeat.recentPanoIds.includes(ep.pkg.pano0.panoId)) {
    return "recent_panoId";
  }

  // Rule 2: locationHash must not be in recent window
  if (antiRepeat.recentLocationHashes.includes(ep.locationHash)) {
    return "recent_locationHash";
  }

  // Rule 3: clusterId must not be in recent window
  if (antiRepeat.recentClusterIds.includes(ep.clusterId)) {
    return "recent_clusterId";
  }

  // Rule 4: province must not be same as last province (urban mode)
  if (!relaxProvince && antiRepeat.lastProvince === ep.province) {
    return "back_to_back_province";
  }

  return null; // Passes all checks
}

/**
 * Record a selection in the anti-repeat state.
 */
function recordSelection(ep: EnrichedPackage): void {
  pushWindow(antiRepeat.recentPackageIds, ep.pkg.id, RECENT_PANO_WINDOW);
  pushWindow(antiRepeat.recentPanoIds, ep.pkg.pano0.panoId, RECENT_PANO_WINDOW);
  pushWindow(antiRepeat.recentLocationHashes, ep.locationHash, RECENT_HASH_WINDOW);
  pushWindow(antiRepeat.recentClusterIds, ep.clusterId, RECENT_CLUSTER_WINDOW);
  pushWindow(antiRepeat.recentProvinces, ep.province, RECENT_PROVINCE_WINDOW);
  antiRepeat.lastProvince = ep.province;
  staticUsedIds.add(ep.pkg.id);
}

// ==================== PART 4: PROVINCE BAG (ROTATION) ====================

/**
 * Fisher-Yates shuffle
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Fill province bag with all 81 provinces, shuffled.
 * Boundary guard: ensure first province != lastBagProvince.
 */
function fillProvinceBag(): void {
  const allProvinces = TURKEY_CITIES.map(c => c.name);
  let shuffled = shuffle(allProvinces);

  // Boundary guard: if first province == last province of previous bag, swap it
  if (lastBagProvince && shuffled.length > 1 && shuffled[0] === lastBagProvince) {
    // Find first element that's different and swap
    for (let i = 1; i < shuffled.length; i++) {
      if (shuffled[i] !== lastBagProvince) {
        [shuffled[0], shuffled[i]] = [shuffled[i], shuffled[0]];
        break;
      }
    }
  }

  provinceBag = shuffled;
  console.log(`[ProvinceBag v2] Bag refilled with ${provinceBag.length} provinces`);
}

/**
 * Pop next province from bag. Refills when empty.
 */
function popProvince(): string {
  if (provinceBag.length === 0) {
    fillProvinceBag();
  }

  const province = provinceBag.shift()!;

  // Track last province for boundary guard on next refill
  if (provinceBag.length === 0) {
    lastBagProvince = province;
  }

  return province;
}

// ==================== PART 3: URBAN DIFFICULTY MIX ====================

/**
 * Pick a difficulty tier based on weighted random (15/55/30).
 */
function pickDifficultyTier(): Difficulty {
  const r = Math.random();
  if (r < DIFFICULTY_MIX.easy) return "easy";
  if (r < DIFFICULTY_MIX.easy + DIFFICULTY_MIX.medium) return "medium";
  return "hard";
}

/**
 * Select a package for a given province and difficulty tier.
 * Returns null if no valid candidate found.
 */
function selectFromTier(
  candidates: EnrichedPackage[],
  tier: Difficulty,
  relaxProvince: boolean = false
): EnrichedPackage | null {
  const tierCandidates = candidates.filter(ep => ep.difficulty === tier);

  // Shuffle to randomize within tier
  const shuffled = shuffle(tierCandidates);

  for (const ep of shuffled) {
    const rejection = checkAntiRepeat(ep, relaxProvince);
    if (!rejection) {
      return ep;
    }
  }

  return null;
}

/**
 * MAIN SELECTION: Pick a pano package for urban mode.
 *
 * Algorithm:
 * 1. Pop province from bag
 * 2. Filter candidates for province + mode=urban + bannedUrban=false
 * 3. Pick difficulty tier (15/55/30 weighted)
 * 4. Try to find a candidate in that tier passing anti-repeat
 * 5. Fallback: try other tiers within same province
 * 6. If no candidates in province: try next provinces from bag
 * 7. NEVER fallback to rural
 */
function selectUrbanPackage(recursionGuard: boolean = false): EnrichedPackage | null {
  ensureEnrichment();

  // Available non-banned, non-used urban packages
  const allAvailable = enrichedUrbanCache.filter(ep =>
    !ep.bannedUrban && !staticUsedIds.has(ep.pkg.id)
  );

  // If all used, reset static tracking (anti-repeat windows survive!)
  if (allAvailable.length === 0) {
    if (recursionGuard) return null; // Prevent infinite recursion
    staticUsedIds.clear();
    return selectUrbanPackage(true); // Recurse once with guard
  }

  for (let attempt = 0; attempt < MAX_SELECTION_ATTEMPTS; attempt++) {
    const targetProvince = popProvince();

    // Filter candidates for this province
    const provinceCandidates = allAvailable.filter(ep =>
      ep.province === targetProvince && !staticUsedIds.has(ep.pkg.id)
    );

    if (provinceCandidates.length === 0) {
      // No static packages for this province — will need dynamic later
      continue;
    }

    // Pick target difficulty
    const targetTier = pickDifficultyTier();
    const tierOrder: Difficulty[] = [targetTier];

    // Fallback tiers (prefer medium/hard over easy)
    if (targetTier === "easy") tierOrder.push("medium", "hard");
    else if (targetTier === "medium") tierOrder.push("hard", "easy");
    else tierOrder.push("medium", "easy");

    for (const tier of tierOrder) {
      const selected = selectFromTier(provinceCandidates, tier);
      if (selected) {
        recordSelection(selected);
        return selected;
      }
    }

    // All tiers exhausted for this province with strict rules.
    // Try relaxed province rule (allow back-to-back).
    for (const tier of tierOrder) {
      const selected = selectFromTier(provinceCandidates, tier, true);
      if (selected) {
        recordSelection(selected);
        return selected;
      }
    }

    // This province fully exhausted, try next
  }

  // Absolute fallback: pick ANY available urban package
  const anyAvailable = enrichedUrbanCache.filter(ep =>
    !ep.bannedUrban && !staticUsedIds.has(ep.pkg.id)
  );

  if (anyAvailable.length > 0) {
    const shuffled = shuffle(anyAvailable);
    for (const ep of shuffled) {
      const rejection = checkAntiRepeat(ep, true); // Relax province
      if (!rejection) {
        recordSelection(ep);
        return ep;
      }
    }
    // Even with relaxed rules, all rejected — pick one that at least
    // avoids the LAST panoId (minimum consecutive-duplicate guard)
    const lastPanoId = antiRepeat.recentPanoIds.length > 0
      ? antiRepeat.recentPanoIds[antiRepeat.recentPanoIds.length - 1]
      : null;
    const nonConsecutive = shuffled.find(ep => ep.pkg.pano0.panoId !== lastPanoId);
    const fallback = nonConsecutive || shuffled[0];
    recordSelection(fallback);
    return fallback;
  }

  return null;
}

/**
 * Select a package for geo mode (simpler — no difficulty mix needed).
 */
function selectGeoPackage(recursionGuard: boolean = false): EnrichedPackage | null {
  ensureEnrichment();

  const available = enrichedGeoCache.filter(ep => !staticUsedIds.has(ep.pkg.id));

  if (available.length === 0) {
    if (recursionGuard) return null;
    staticUsedIds.clear();
    return selectGeoPackage(true);
  }

  const shuffled = shuffle(available);
  for (const ep of shuffled) {
    const rejection = checkAntiRepeat(ep, true); // Geo mode doesn't enforce back-to-back province
    if (!rejection) {
      recordSelection(ep);
      return ep;
    }
  }

  // Fallback: avoid consecutive duplicate
  if (shuffled.length > 0) {
    const lastPanoId = antiRepeat.recentPanoIds.length > 0
      ? antiRepeat.recentPanoIds[antiRepeat.recentPanoIds.length - 1]
      : null;
    const nonConsecutive = shuffled.find(ep => ep.pkg.pano0.panoId !== lastPanoId);
    const fallback = nonConsecutive || shuffled[0];
    recordSelection(fallback);
    return fallback;
  }

  return null;
}

// ==================== PUBLIC API ====================

/**
 * Get the next static pano package using the professional selection engine.
 * Returns null if dynamic generation should be attempted.
 *
 * This replaces the old getStaticPanoPackage function.
 */
export function selectStaticPackage(mode: GameMode, preferredProvince?: string): PanoPackage | null {
  ensureEnrichment();

  if (mode === "urban") {
    // If we have a preferred province from the province bag in dynamicPanoService,
    // try to find a match in our enriched cache
    if (preferredProvince) {
      const candidates = enrichedUrbanCache.filter(ep =>
        ep.province === preferredProvince && !ep.bannedUrban && !staticUsedIds.has(ep.pkg.id)
      );

      if (candidates.length > 0) {
        const targetTier = pickDifficultyTier();
        const tierOrder: Difficulty[] = [targetTier];
        if (targetTier === "easy") tierOrder.push("medium", "hard");
        else if (targetTier === "medium") tierOrder.push("hard", "easy");
        else tierOrder.push("medium", "easy");

        for (const tier of tierOrder) {
          const selected = selectFromTier(candidates, tier);
          if (selected) {
            recordSelection(selected);
            console.log(`[LocationEngine] Selected: ${selected.pkg.locationName} (${selected.difficulty}, score=${selected.easyScore})`);
            return selected.pkg;
          }
        }

        // Relaxed province
        for (const tier of tierOrder) {
          const selected = selectFromTier(candidates, tier, true);
          if (selected) {
            recordSelection(selected);
            console.log(`[LocationEngine] Selected (relaxed): ${selected.pkg.locationName} (${selected.difficulty})`);
            return selected.pkg;
          }
        }
      }

      // No packages for this province
      console.log(`[LocationEngine] No package for province: ${preferredProvince}`);
      return null;
    }

    // No preferred province — use full selection engine
    const selected = selectUrbanPackage();
    if (selected) {
      console.log(`[LocationEngine] Selected: ${selected.pkg.locationName} (${selected.difficulty}, score=${selected.easyScore})`);
      return selected.pkg;
    }
    return null;
  }

  // Geo mode
  const selected = selectGeoPackage();
  if (selected) {
    console.log(`[LocationEngine] Selected geo: ${selected.pkg.locationName}`);
    return selected.pkg;
  }
  return null;
}

/**
 * Get the target province for this round (urban mode).
 * Uses the internal province bag.
 */
export function getNextProvince(): string {
  return popProvince();
}

/**
 * Reset all engine state for a new game.
 */
export function resetLocationEngine(): void {
  // Reset anti-repeat
  antiRepeat.recentPackageIds = [];
  antiRepeat.recentPanoIds = [];
  antiRepeat.recentLocationHashes = [];
  antiRepeat.recentClusterIds = [];
  antiRepeat.recentProvinces = [];
  antiRepeat.lastProvince = null;

  // Reset province bag
  provinceBag = [];
  lastBagProvince = null;

  // Reset static tracking
  staticUsedIds.clear();

  console.log("[LocationEngine] Reset complete");
}

/**
 * Get the current anti-repeat state (for testing/debugging).
 */
export function getAntiRepeatState(): Readonly<AntiRepeatState> {
  return { ...antiRepeat };
}

/**
 * Get enriched packages (for testing/debugging).
 */
export function getEnrichedPackages(mode: GameMode): readonly EnrichedPackage[] {
  ensureEnrichment();
  return mode === "urban" ? enrichedUrbanCache : enrichedGeoCache;
}

// ==================== SIMULATION (for testing) ====================

/**
 * Run a simulation of N draws and return statistics.
 * This is for testing/validation only — not called in production.
 */
export function runSimulation(draws: number = 1000): {
  difficultyDist: { easy: number; medium: number; hard: number };
  provinceCoverage: number;
  uniqueProvinces: Set<string>;
  duplicates: number;
  nearDuplicates: number;
  bannedSelections: number;
  consecutiveSameProvince: number;
} {
  // Save and reset state
  const savedAntiRepeat = { ...antiRepeat };
  const savedBag = [...provinceBag];
  const savedLastBag = lastBagProvince;
  const savedUsedIds = new Set(staticUsedIds);

  resetLocationEngine();
  ensureEnrichment();

  const stats = {
    difficultyDist: { easy: 0, medium: 0, hard: 0 },
    provinceCoverage: 0,
    uniqueProvinces: new Set<string>(),
    duplicates: 0,
    nearDuplicates: 0,
    bannedSelections: 0,
    consecutiveSameProvince: 0,
  };

  const selectedPanoIds: string[] = [];
  const selectedHashes: string[] = [];
  let lastProv = "";

  for (let i = 0; i < draws; i++) {
    const result = selectUrbanPackage();
    if (!result) continue;

    stats.difficultyDist[result.difficulty]++;
    stats.uniqueProvinces.add(result.province);

    if (result.bannedUrban) stats.bannedSelections++;

    // Check duplicates
    if (selectedPanoIds.includes(result.pkg.pano0.panoId)) {
      stats.duplicates++;
    }
    selectedPanoIds.push(result.pkg.pano0.panoId);

    if (selectedHashes.includes(result.locationHash)) {
      stats.nearDuplicates++;
    }
    selectedHashes.push(result.locationHash);

    // Consecutive province check
    if (result.province === lastProv) {
      stats.consecutiveSameProvince++;
    }
    lastProv = result.province;
  }

  stats.provinceCoverage = stats.uniqueProvinces.size;

  // Restore state
  antiRepeat.recentPanoIds = savedAntiRepeat.recentPanoIds;
  antiRepeat.recentLocationHashes = savedAntiRepeat.recentLocationHashes;
  antiRepeat.recentClusterIds = savedAntiRepeat.recentClusterIds;
  antiRepeat.recentProvinces = savedAntiRepeat.recentProvinces;
  antiRepeat.lastProvince = savedAntiRepeat.lastProvince;
  provinceBag = savedBag;
  lastBagProvince = savedLastBag;
  staticUsedIds = savedUsedIds;

  return stats;
}

// ==================== EXPORT FOR TESTING ====================

export const _testExports = {
  extractProvince,
  createLocationHash,
  createClusterId,
  enrichPackages,
  checkAntiRepeat,
  recordSelection,
  fillProvinceBag,
  popProvince,
  pickDifficultyTier,
  selectFromTier,
  selectUrbanPackage,
  selectGeoPackage,
  antiRepeat,
  // Direct access for test manipulation
  getProvinceBag: () => provinceBag,
  setProvinceBag: (bag: string[]) => { provinceBag = bag; },
  getLastBagProvince: () => lastBagProvince,
  setLastBagProvince: (p: string | null) => { lastBagProvince = p; },
  resetStaticUsedIds: () => staticUsedIds.clear(),
  getStaticUsedIds: () => staticUsedIds,
};
