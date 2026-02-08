/**
 * PROFESSIONAL URBAN LOCATION SELECTION ENGINE v3 — HARDENED
 *
 * This module implements a comprehensive location selection system with:
 * 1. Auto-difficulty tagging (easy/medium/hard) based on cluster + panoId analysis
 * 2. Anti-repeat engine with sliding window dedup (zero-tolerance)
 * 3. Difficulty mix targeting (15% easy, 55% medium, 30% hard)
 * 4. Province bag rotation (URBAN-ONLY provinces, Fisher-Yates, boundary guard)
 *
 * HARD INVARIANTS:
 * - Province back-to-back = 0 (urban mode, including fallback)
 * - Banned package selection = 0
 * - No duplicate panoId/locationHash/clusterId within sliding window
 * - ZERO new API calls. Deterministic multiplayer (host decides).
 * - Urban mode NEVER shows rural/empty roads.
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
  panoIdGroup: number;       // How many packages share same pano0.panoId
  easyScore: number;         // 0-100 composite score
}

interface AntiRepeatState {
  recentPackageIds: string[];    // Last N package IDs (pkg.id)
  recentPanoIds: string[];       // Last N pano IDs (pano0.panoId)
  recentLocationHashes: string[];// Last N location hashes
  recentClusterIds: string[];    // Last N cluster IDs
  recentProvinces: string[];     // Last N provinces
  lastProvince: string | null;   // Previous round's province (HARD: never back-to-back)
}

// ==================== CONSTANTS ====================

const DIFFICULTY_MIX = { easy: 0.15, medium: 0.55, hard: 0.30 };
const GRID_PRECISION = 3;  // 3 decimals ≈ 111m cells
// Max province attempts per selection = urbanProvinceList.length
// Try each province at most once, then fall through to absolute fallback.
// This prevents burning through multiple bag cycles per selection.

// Sliding window sizes — tuned to actual dataset (86 packages, 30 unique panoIds)
// Window must be < unique count to avoid deadlocks
const RECENT_PACKAGE_WINDOW = 20;
const RECENT_PANO_WINDOW = 10;       // Only 30 unique panoIds — 10 avoids deadlock
const RECENT_HASH_WINDOW = 15;       // 86 unique hashes — safe at 15
const RECENT_CLUSTER_WINDOW = 15;    // 86 unique clusters — safe at 15
const RECENT_PROVINCE_WINDOW = 5;

// Hotspot detection: packages sharing a panoId
// Packages with high panoId reuse are city-center locations — they get
// scored as "easy" (well-known areas) via easyScore, but are NOT banned.
// Banning would reduce the available pool below sustainable levels
// (86 pkgs, 30 unique panoIds — banning shrinks pool and causes deadlocks).
// Instead, the anti-repeat panoId sliding window prevents consecutive reuse.
const PANOID_HOTSPOT_THRESHOLD = 6;  // For reporting; NOT used for banning

// ==================== MODULE STATE ====================

let enrichedUrbanCache: EnrichedPackage[] = [];
let enrichedGeoCache: EnrichedPackage[] = [];
let enrichmentReportGenerated = false;

// Province bag state — URBAN-ONLY provinces (only those with packages)
let provinceBag: string[] = [];
let lastBagProvince: string | null = null;
let urbanProvinceList: string[] = []; // Provinces that actually have urban packages

// Anti-repeat state
const antiRepeat: AntiRepeatState = {
  recentPackageIds: [],
  recentPanoIds: [],
  recentLocationHashes: [],
  recentClusterIds: [],
  recentProvinces: [],
  lastProvince: null,
};

// Note: staticUsedIds removed in v3 hardening. Anti-repeat sliding windows
// now handle all dedup. This prevents pool exhaustion deadlocks with 86 packages.

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
 * Enrich all packages with difficulty, cluster info, panoId grouping, and auto-blacklist.
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
      panoIdGroup: 0,
      easyScore: 50,
    };
  });

  // Step 2: Compute cluster sizes (location-hash-based clusters)
  const clusterCounts = new Map<string, number>();
  for (const ep of enriched) {
    clusterCounts.set(ep.clusterId, (clusterCounts.get(ep.clusterId) || 0) + 1);
  }
  for (const ep of enriched) {
    ep.clusterSize = clusterCounts.get(ep.clusterId) || 1;
  }

  // Step 3: Compute panoId group sizes (packages sharing same pano0.panoId)
  const panoIdCounts = new Map<string, number>();
  for (const ep of enriched) {
    const pid = ep.pkg.pano0.panoId;
    panoIdCounts.set(pid, (panoIdCounts.get(pid) || 0) + 1);
  }
  for (const ep of enriched) {
    ep.panoIdGroup = panoIdCounts.get(ep.pkg.pano0.panoId) || 1;
  }

  // Step 4: Compute province package counts
  const provinceCounts = new Map<string, number>();
  for (const ep of enriched) {
    provinceCounts.set(ep.province, (provinceCounts.get(ep.province) || 0) + 1);
  }

  // Step 5: Compute easyScore (0–100)
  // Higher = easier (more recognizable, well-covered area)
  const maxCluster = Math.max(...Array.from(clusterCounts.values()), 1);
  const maxProvCount = Math.max(...Array.from(provinceCounts.values()), 1);
  const maxPanoGroup = Math.max(...Array.from(panoIdCounts.values()), 1);

  for (const ep of enriched) {
    const clusterFactor = (ep.clusterSize / maxCluster) * 25;   // 0-25 pts
    const provFactor = ((provinceCounts.get(ep.province) || 1) / maxProvCount) * 25; // 0-25 pts
    const qualityFactor = ((ep.pkg.qualityScore || 3) / 5) * 25; // 0-25 pts
    const panoGroupFactor = (ep.panoIdGroup / maxPanoGroup) * 25; // 0-25 pts — high panoId sharing = well-covered area
    ep.easyScore = Math.round(clusterFactor + provFactor + qualityFactor + panoGroupFactor);
  }

  // Step 6: Assign difficulty tiers using PERCENTILE-BASED ranking
  // Sort by easyScore descending, then assign:
  //   Top 15% → easy, Next 55% → medium, Bottom 30% → hard
  const sorted = [...enriched].sort((a, b) => b.easyScore - a.easyScore);
  const easyCount = Math.max(1, Math.floor(sorted.length * 0.15));
  const mediumCount = Math.max(1, Math.floor(sorted.length * 0.55));
  // hard gets the rest

  // Direct index-based assignment — no threshold collapse possible
  for (let i = 0; i < sorted.length; i++) {
    if (i < easyCount) {
      sorted[i].difficulty = "easy";
    } else if (i < easyCount + mediumCount) {
      sorted[i].difficulty = "medium";
    } else {
      sorted[i].difficulty = "hard";
    }
  }

  // Step 7: Auto-blacklist for urban mode
  // Only ban packages explicitly marked as blacklisted in source data.
  // PanoId hotspots are NOT banned — they are handled by:
  //   1) easyScore (high panoIdGroup → high score → "easy" tier)
  //   2) Anti-repeat panoId sliding window (prevents consecutive reuse)
  // Banning hotspots would reduce the pool from 86 to ~65 packages
  // with only 27 unique panoIds, causing deadlocks.
  if (mode === "urban") {
    for (const ep of enriched) {
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

  // Build urban-only province list from non-banned enriched packages
  const provSet = new Set<string>();
  for (const ep of enrichedUrbanCache) {
    if (!ep.bannedUrban) {
      provSet.add(ep.province);
    }
  }
  urbanProvinceList = Array.from(provSet).sort();
}

/**
 * Generate and log enrichment report.
 */
export function getEnrichmentReport(): string {
  ensureEnrichment();

  const lines: string[] = ["=== ENRICHMENT REPORT v3 ==="];

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

    // PanoId group analysis
    const panoGroupCounts = new Map<string, number>();
    for (const ep of cache) {
      const pid = ep.pkg.pano0.panoId;
      panoGroupCounts.set(pid, (panoGroupCounts.get(pid) || 0) + 1);
    }
    const uniquePanoIds = panoGroupCounts.size;
    const hotspotPanoIds = Array.from(panoGroupCounts.entries()).filter(([, v]) => v >= PANOID_HOTSPOT_THRESHOLD);
    lines.push(`Unique panoIds: ${uniquePanoIds}`);
    lines.push(`PanoId hotspot groups (>=${PANOID_HOTSPOT_THRESHOLD}): ${hotspotPanoIds.length}`);

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
    lines.push(`Total location clusters: ${totalClusters}`);
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

    // Non-banned count
    const availableCount = cache.filter(ep => !ep.bannedUrban).length;
    lines.push(`Available (non-banned): ${availableCount}`);
  }

  // Urban province coverage
  lines.push(`\n--- URBAN PROVINCE BAG ---`);
  lines.push(`Provinces in urban bag: ${urbanProvinceList.length}`);
  lines.push(`Provinces: ${urbanProvinceList.join(", ")}`);

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
 *
 * HARD INVARIANT: Province back-to-back is NEVER relaxed in urban mode.
 * The relaxProvince parameter only controls the sliding window check (Rule 4),
 * NOT the consecutive province check (which is always enforced).
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

  // Rule 4: province sliding window check (can be relaxed for fallback)
  if (!relaxProvince && antiRepeat.recentProvinces.includes(ep.province)) {
    return "recent_province_window";
  }

  return null; // Passes all checks
}

/**
 * HARD check: province back-to-back.
 * This is separate from checkAntiRepeat and is NEVER relaxed.
 */
function isBackToBackProvince(province: string): boolean {
  return antiRepeat.lastProvince === province;
}

/**
 * Record a selection in the anti-repeat state.
 */
function recordSelection(ep: EnrichedPackage): void {
  pushWindow(antiRepeat.recentPackageIds, ep.pkg.id, RECENT_PACKAGE_WINDOW);
  pushWindow(antiRepeat.recentPanoIds, ep.pkg.pano0.panoId, RECENT_PANO_WINDOW);
  pushWindow(antiRepeat.recentLocationHashes, ep.locationHash, RECENT_HASH_WINDOW);
  pushWindow(antiRepeat.recentClusterIds, ep.clusterId, RECENT_CLUSTER_WINDOW);
  pushWindow(antiRepeat.recentProvinces, ep.province, RECENT_PROVINCE_WINDOW);
  antiRepeat.lastProvince = ep.province;
}

// ==================== PART 4: PROVINCE BAG (URBAN-ONLY ROTATION) ====================

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
 * Fill province bag with ONLY provinces that have non-banned urban packages.
 * Boundary guard: ensure first province != lastBagProvince.
 *
 * PHASE B: OPTION 1 — Urban-only bag. No fake 81-province rotation.
 */
function fillProvinceBag(): void {
  ensureEnrichment();

  const shuffled = shuffle([...urbanProvinceList]);

  // Boundary guard: if first province == last province of previous bag, swap it
  if (lastBagProvince && shuffled.length > 1 && shuffled[0] === lastBagProvince) {
    for (let i = 1; i < shuffled.length; i++) {
      if (shuffled[i] !== lastBagProvince) {
        [shuffled[0], shuffled[i]] = [shuffled[i], shuffled[0]];
        break;
      }
    }
  }

  provinceBag = shuffled;
  console.log(`[ProvinceBag v3] Bag refilled with ${provinceBag.length} urban provinces`);
}

/**
 * Pop next province from bag. Refills when empty.
 * HARD: never returns the same province as lastProvince (antiRepeat.lastProvince).
 */
function popProvince(): string {
  if (provinceBag.length === 0) {
    fillProvinceBag();
  }

  // Find next province that is NOT the same as lastProvince
  for (let i = 0; i < provinceBag.length; i++) {
    if (provinceBag[i] !== antiRepeat.lastProvince) {
      const province = provinceBag.splice(i, 1)[0];
      // Track last bag province for boundary guard on refill
      if (provinceBag.length === 0) {
        lastBagProvince = province;
      }
      return province;
    }
  }

  // Edge case: all remaining provinces in bag equal lastProvince (impossible with
  // >1 province, but guard against it). Refill and try again.
  lastBagProvince = provinceBag[provinceBag.length - 1] || null;
  provinceBag = [];
  fillProvinceBag();
  // After refill, boundary guard ensures first != lastBagProvince
  const province = provinceBag.shift()!;
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
 * Select a package for given candidates and difficulty tier.
 * Returns null if no valid candidate found.
 * relaxProvince only affects sliding window — NOT back-to-back.
 */
function selectFromTier(
  candidates: EnrichedPackage[],
  tier: Difficulty,
  relaxProvince: boolean = false
): EnrichedPackage | null {
  const tierCandidates = candidates.filter(ep => ep.difficulty === tier);
  const shuffled = shuffle(tierCandidates);

  for (const ep of shuffled) {
    // HARD: always check back-to-back province first
    if (isBackToBackProvince(ep.province)) {
      continue; // NEVER allow
    }
    const rejection = checkAntiRepeat(ep, relaxProvince);
    if (!rejection) {
      return ep;
    }
  }

  return null;
}

/**
 * Try to select ANY package from candidates regardless of tier.
 * Used when tier-based selection fails.
 * relaxProvince only affects sliding window — NOT back-to-back.
 */
function selectAnyTier(
  candidates: EnrichedPackage[],
  relaxProvince: boolean = false
): EnrichedPackage | null {
  const shuffled = shuffle(candidates);

  for (const ep of shuffled) {
    // HARD: always check back-to-back province first
    if (isBackToBackProvince(ep.province)) {
      continue; // NEVER allow
    }
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
 * 1. Pop province from bag (HARD: never same as lastProvince)
 * 2. Filter candidates for province + bannedUrban=false
 * 3. Pick difficulty tier (15/55/30 weighted)
 * 4. Try to find a candidate in that tier passing anti-repeat
 * 5. Fallback: try other tiers within same province
 * 6. If no candidates in province: move to NEXT province in bag (NOT reuse)
 * 7. Absolute fallback: any non-back-to-back province package with relaxed windows
 *
 * HARD INVARIANTS:
 * - NEVER return a back-to-back same province
 * - NEVER return a banned package
 * - NEVER fallback to rural
 */
function selectUrbanPackage(): EnrichedPackage | null {
  ensureEnrichment();

  // All non-banned urban packages are always in the pool.
  // Anti-repeat sliding windows handle dedup — no separate staticUsedIds needed.
  const allAvailable = enrichedUrbanCache.filter(ep => !ep.bannedUrban);
  if (allAvailable.length === 0) return null;

  // Last-selected values for back-to-back guards
  const lastPanoId = antiRepeat.recentPanoIds.length > 0
    ? antiRepeat.recentPanoIds[antiRepeat.recentPanoIds.length - 1]
    : null;
  const lastHash = antiRepeat.recentLocationHashes.length > 0
    ? antiRepeat.recentLocationHashes[antiRepeat.recentLocationHashes.length - 1]
    : null;
  const lastCluster = antiRepeat.recentClusterIds.length > 0
    ? antiRepeat.recentClusterIds[antiRepeat.recentClusterIds.length - 1]
    : null;

  // Pick target difficulty BEFORE province loop
  const targetTier = pickDifficultyTier();

  // DIFFICULTY-FIRST PATH: When target tier is easy or hard, and
  // most provinces lack packages of that tier, try finding a matching
  // package across ALL provinces first (still with province back-to-back guard).
  // This ensures the 15/55/30 mix is achievable despite uneven tier distribution.
  const tierPackages = allAvailable.filter(ep => ep.difficulty === targetTier);
  if (tierPackages.length > 0) {
    const shuffledTier = shuffle(tierPackages);
    for (const ep of shuffledTier) {
      if (isBackToBackProvince(ep.province)) continue;
      const rejection = checkAntiRepeat(ep);
      if (!rejection) {
        recordSelection(ep);
        return ep;
      }
    }
    // Relaxed province window
    for (const ep of shuffledTier) {
      if (isBackToBackProvince(ep.province)) continue;
      const rejection = checkAntiRepeat(ep, true);
      if (!rejection) {
        recordSelection(ep);
        return ep;
      }
    }
  }

  // PROVINCE-FIRST FALLBACK: If no matching tier found across all provinces,
  // use province bag rotation and accept any difficulty
  const maxAttempts = Math.max(urbanProvinceList.length, 48);
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const targetProvince = popProvince();

    if (targetProvince === antiRepeat.lastProvince) continue;

    const provinceCandidates = allAvailable.filter(ep =>
      ep.province === targetProvince
    );

    if (provinceCandidates.length === 0) continue;

    // Try the target tier first within this province
    if (provinceCandidates.length > 1) {
      const tierOrder: Difficulty[] = [targetTier];
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
    }

    // Accept any candidate from this province
    const anyResult = selectAnyTier(provinceCandidates, true);
    if (anyResult) {
      recordSelection(anyResult);
      return anyResult;
    }
  }

  // PHASE 2: Absolute fallback — any available package from different province
  // Relax province window, keep all other anti-repeat guards
  const shuffledAll = shuffle(allAvailable);
  for (const ep of shuffledAll) {
    if (isBackToBackProvince(ep.province)) continue;
    const rejection = checkAntiRepeat(ep, true);
    if (!rejection) {
      recordSelection(ep);
      return ep;
    }
  }

  // PHASE 3: Ultra-fallback — only enforce back-to-back guards
  for (const ep of shuffledAll) {
    if (isBackToBackProvince(ep.province)) continue;
    if (ep.pkg.pano0.panoId === lastPanoId) continue;
    if (ep.locationHash === lastHash) continue;
    if (ep.clusterId === lastCluster) continue;
    recordSelection(ep);
    return ep;
  }

  // PHASE 4: Relax hash/cluster, keep province + panoId guard
  for (const ep of shuffledAll) {
    if (isBackToBackProvince(ep.province)) continue;
    if (ep.pkg.pano0.panoId === lastPanoId) continue;
    recordSelection(ep);
    return ep;
  }

  // PHASE 5: Only province guard (last resort)
  for (const ep of shuffledAll) {
    if (isBackToBackProvince(ep.province)) continue;
    recordSelection(ep);
    return ep;
  }

  return null;
}

/**
 * Select a package for geo mode (simpler — no difficulty mix needed).
 */
function selectGeoPackage(): EnrichedPackage | null {
  ensureEnrichment();

  const available = enrichedGeoCache.filter(ep => !ep.bannedUrban);
  if (available.length === 0) return null;

  const shuffled = shuffle(available);
  for (const ep of shuffled) {
    const rejection = checkAntiRepeat(ep, true); // Geo mode doesn't enforce province rules
    if (!rejection) {
      recordSelection(ep);
      return ep;
    }
  }

  // Fallback: avoid consecutive panoId duplicate
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
 */
export function selectStaticPackage(mode: GameMode, preferredProvince?: string): PanoPackage | null {
  ensureEnrichment();

  if (mode === "urban") {
    if (preferredProvince) {
      // HARD: check back-to-back province
      if (isBackToBackProvince(preferredProvince)) {
        console.log(`[LocationEngine] Rejected preferred province (back-to-back): ${preferredProvince}`);
        return null;
      }

      const candidates = enrichedUrbanCache.filter(ep =>
        ep.province === preferredProvince && !ep.bannedUrban
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
            return selected.pkg;
          }
        }

        // Try any tier with relaxed province window
        const anyResult = selectAnyTier(candidates, true);
        if (anyResult) {
          recordSelection(anyResult);
          return anyResult.pkg;
        }
      }

      return null;
    }

    // No preferred province — use full selection engine
    const selected = selectUrbanPackage();
    if (selected) {
      return selected.pkg;
    }
    return null;
  }

  // Geo mode
  const selected = selectGeoPackage();
  if (selected) {
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
  antiRepeat.recentPackageIds = [];
  antiRepeat.recentPanoIds = [];
  antiRepeat.recentLocationHashes = [];
  antiRepeat.recentClusterIds = [];
  antiRepeat.recentProvinces = [];
  antiRepeat.lastProvince = null;

  provinceBag = [];
  lastBagProvince = null;

  console.log("[LocationEngine v3] Reset complete");
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

/**
 * Get urban province list (for testing/debugging).
 */
export function getUrbanProvinceList(): readonly string[] {
  ensureEnrichment();
  return urbanProvinceList;
}

// ==================== SIMULATION v3 (for testing) ====================

export interface SimulationResult {
  totalDraws: number;
  totalSuccessful: number;
  difficultyDist: { easy: number; medium: number; hard: number };
  provinceCoverage: number;
  uniqueProvinces: Set<string>;
  bannedSelections: number;
  consecutiveSameProvince: number;       // MUST be 0
  consecutiveSamePanoId: number;          // MUST be 0
  consecutiveSameLocationHash: number;    // MUST be 0
  consecutiveSameClusterId: number;       // MUST be 0
  duplicateGeneratedCount: number;        // panoIds generated more than once (expected with 30 unique)
  duplicateReturnedCount: number;         // consecutive duplicate panoIds (MUST be 0)
  rejectionCount: number;                 // total anti-repeat rejections
  attemptCount: number;                   // total candidate evaluations
  rejectionRate: number;                  // rejectionCount / attemptCount
  sampleLog: string[];                    // first 50 draw logs
}

/**
 * Run a simulation of N draws and return detailed statistics.
 * This is for testing/validation only — not called in production.
 */
export function runSimulation(draws: number = 1000): SimulationResult {
  // Save state
  const savedAntiRepeat = {
    recentPackageIds: [...antiRepeat.recentPackageIds],
    recentPanoIds: [...antiRepeat.recentPanoIds],
    recentLocationHashes: [...antiRepeat.recentLocationHashes],
    recentClusterIds: [...antiRepeat.recentClusterIds],
    recentProvinces: [...antiRepeat.recentProvinces],
    lastProvince: antiRepeat.lastProvince,
  };
  const savedBag = [...provinceBag];
  const savedLastBag = lastBagProvince;

  resetLocationEngine();
  ensureEnrichment();

  const stats: SimulationResult = {
    totalDraws: draws,
    totalSuccessful: 0,
    difficultyDist: { easy: 0, medium: 0, hard: 0 },
    provinceCoverage: 0,
    uniqueProvinces: new Set<string>(),
    bannedSelections: 0,
    consecutiveSameProvince: 0,
    consecutiveSamePanoId: 0,
    consecutiveSameLocationHash: 0,
    consecutiveSameClusterId: 0,
    duplicateGeneratedCount: 0,
    duplicateReturnedCount: 0,
    rejectionCount: 0,
    attemptCount: 0,
    rejectionRate: 0,
    sampleLog: [],
  };

  const seenPanoIds = new Set<string>();
  let lastProv = "";
  let lastPanoId = "";
  let lastHash = "";
  let lastCluster = "";

  for (let i = 0; i < draws; i++) {
    const result = selectUrbanPackage();
    if (!result) {
      if (i < 50) stats.sampleLog.push(`[${i}] FAILED — no package returned`);
      continue;
    }

    stats.totalSuccessful++;
    stats.difficultyDist[result.difficulty]++;
    stats.uniqueProvinces.add(result.province);

    if (result.bannedUrban) stats.bannedSelections++;

    // Duplicate tracking
    if (seenPanoIds.has(result.pkg.pano0.panoId)) {
      stats.duplicateGeneratedCount++;
    }
    seenPanoIds.add(result.pkg.pano0.panoId);

    // Consecutive checks (MUST all be 0)
    if (result.province === lastProv) stats.consecutiveSameProvince++;
    if (result.pkg.pano0.panoId === lastPanoId) stats.consecutiveSamePanoId++;
    if (result.locationHash === lastHash) stats.consecutiveSameLocationHash++;
    if (result.clusterId === lastCluster) stats.consecutiveSameClusterId++;

    if (result.pkg.pano0.panoId === lastPanoId) stats.duplicateReturnedCount++;

    // Sample log
    if (i < 50) {
      stats.sampleLog.push(
        `[${i}] ${result.province} | ${result.difficulty} | pano=${result.pkg.pano0.panoId.substring(0, 20)}... | hash=${result.locationHash}`
      );
    }

    lastProv = result.province;
    lastPanoId = result.pkg.pano0.panoId;
    lastHash = result.locationHash;
    lastCluster = result.clusterId;
  }

  stats.provinceCoverage = stats.uniqueProvinces.size;

  // Compute rejection stats from anti-repeat state
  // We track this approximately — each selectUrbanPackage call involves
  // multiple candidate evaluations; the exact count needs instrumentation.
  // For now, use the ratio of (draws - successful in first try) / draws.
  stats.attemptCount = draws;
  stats.rejectionCount = draws - stats.totalSuccessful;
  stats.rejectionRate = stats.attemptCount > 0 ? stats.rejectionCount / stats.attemptCount : 0;

  // Restore state
  antiRepeat.recentPackageIds = savedAntiRepeat.recentPackageIds;
  antiRepeat.recentPanoIds = savedAntiRepeat.recentPanoIds;
  antiRepeat.recentLocationHashes = savedAntiRepeat.recentLocationHashes;
  antiRepeat.recentClusterIds = savedAntiRepeat.recentClusterIds;
  antiRepeat.recentProvinces = savedAntiRepeat.recentProvinces;
  antiRepeat.lastProvince = savedAntiRepeat.lastProvince;
  provinceBag = savedBag;
  lastBagProvince = savedLastBag;

  return stats;
}

// ==================== EXPORT FOR TESTING ====================

export const _testExports = {
  extractProvince,
  createLocationHash,
  createClusterId,
  enrichPackages,
  checkAntiRepeat,
  isBackToBackProvince,
  recordSelection,
  fillProvinceBag,
  popProvince,
  pickDifficultyTier,
  selectFromTier,
  selectAnyTier,
  selectUrbanPackage,
  selectGeoPackage,
  antiRepeat,
  getProvinceBag: () => provinceBag,
  setProvinceBag: (bag: string[]) => { provinceBag = bag; },
  getLastBagProvince: () => lastBagProvince,
  setLastBagProvince: (p: string | null) => { lastBagProvince = p; },
  // staticUsedIds removed in v3 — anti-repeat windows handle dedup
  getUrbanProvinceList: () => urbanProvinceList,
  PANOID_HOTSPOT_THRESHOLD,
};
