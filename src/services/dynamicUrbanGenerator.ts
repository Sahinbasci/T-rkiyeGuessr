/**
 * Dynamic Urban Location Generator
 *
 * Mints new urban pano packages on-the-fly when the static pool would repeat.
 * Cost-locked: max 2 Street View resolution attempts, max 0 geocode calls per round.
 *
 * Architecture:
 * 1. Province selection: uses locationEngine's province bag (48 urban provinces)
 * 2. Seed selection: picks a random seed from the province's UrbanSeedMap
 * 3. Coordinate sampling: random offset within seed radius
 * 4. Pano resolution: uses StreetViewService.getPanorama() (max 2 attempts)
 * 5. Quality check: urban invariant (within seed envelope + Turkey bounds)
 * 6. Anti-repeat check: persistent history (panoId + locationHash)
 * 7. Fallback: if generation fails → return null (caller falls back to static)
 *
 * NO geocode calls — locationName derived from seed data + province name.
 * NO extra metadata RPC loops — navigation uses panoId + getLinks() only.
 *
 * Host-only in multiplayer: host mints and broadcasts via Firebase.
 */

import { PanoPackage, PanoData, GameMode } from "@/types";
import {
  getUrbanSeedMap,
  sampleFromSeed,
  isWithinSeedEnvelope,
  isWithinTurkeyBounds,
  UrbanSeed,
} from "@/data/urbanSeeds";
import {
  checkPersistentHistory,
  recordPersistentLocation,
  LocationFingerprint,
} from "./persistentHistory";

// ==================== TYPES ====================

export interface DynamicMintResult {
  package: PanoPackage | null;
  attemptsUsed: number;
  failReason: string | null;
}

export interface DynamicMintMetrics {
  totalMintAttempts: number;
  totalMintSuccess: number;
  totalMintFail: number;
  totalSVCalls: number;
  avgAttemptsPerMint: number;
  mintFallbackRate: number;
  repeatsBlockedByPanoId: number;
  repeatsBlockedByHash: number;
  repeatsBlockedByProvince: number;
  repeatsBlockedByEnvelope: number;
  lastMintTimestamp: number;
}

// ==================== CONSTANTS ====================

const MAX_SV_ATTEMPTS = 2;           // Hard limit per round
const SV_SEARCH_RADIUS_M = 200;     // Tight urban search (meters)
const GRID_PRECISION = 3;           // 3 decimals ~111m cells

// ==================== MODULE STATE ====================

let streetViewService: google.maps.StreetViewService | null = null;

const metrics: DynamicMintMetrics = {
  totalMintAttempts: 0,
  totalMintSuccess: 0,
  totalMintFail: 0,
  totalSVCalls: 0,
  avgAttemptsPerMint: 0,
  mintFallbackRate: 0,
  repeatsBlockedByPanoId: 0,
  repeatsBlockedByHash: 0,
  repeatsBlockedByProvince: 0,
  repeatsBlockedByEnvelope: 0,
  lastMintTimestamp: 0,
};

// ==================== HELPERS ====================

function createLocationHash(lat: number, lng: number): string {
  const factor = Math.pow(10, GRID_PRECISION);
  const rLat = Math.round(lat * factor) / factor;
  const rLng = Math.round(lng * factor) / factor;
  return `${rLat}_${rLng}`;
}

function createClusterId(province: string, locationHash: string): string {
  return `${province}__${locationHash}`;
}

/**
 * Resolve a Street View pano near coordinates.
 * Uses OUTDOOR source to get street-level panoramas.
 */
async function resolvePano(
  lat: number,
  lng: number,
  radius: number = SV_SEARCH_RADIUS_M
): Promise<{ panoId: string; lat: number; lng: number } | null> {
  if (!streetViewService) return null;

  return new Promise((resolve) => {
    streetViewService!.getPanorama(
      {
        location: { lat, lng },
        radius,
        preference: google.maps.StreetViewPreference.NEAREST,
        source: google.maps.StreetViewSource.OUTDOOR,
      },
      (data, status) => {
        if (status === google.maps.StreetViewStatus.OK && data?.location) {
          resolve({
            panoId: data.location.pano,
            lat: data.location.latLng?.lat() || lat,
            lng: data.location.latLng?.lng() || lng,
          });
        } else {
          resolve(null);
        }
      }
    );
  });
}

/**
 * Estimate difficulty tier for a dynamically minted location.
 *
 * Heuristics (no OCR/vision):
 * - Distance from seed center: closer = easier (well-known area)
 * - Province package density: more static packages = easier province
 * - Seed radius: smaller radius = tighter urban core = easier
 *
 * Returns "easy" | "medium" | "hard"
 */
function estimateDifficulty(
  lat: number,
  lng: number,
  seed: UrbanSeed,
  provincePackageCount: number
): "easy" | "medium" | "hard" {
  // Distance factor: 0 (at center) to 1 (at edge)
  const distFromCenter = Math.sqrt(
    Math.pow((lat - seed.lat) * 111, 2) +
    Math.pow((lng - seed.lng) * 111 * Math.cos(seed.lat * Math.PI / 180), 2)
  );
  const distFactor = Math.min(1, distFromCenter / seed.radiusKm);

  // Density factor: more packages = more recognizable area
  const densityFactor = Math.min(1, provincePackageCount / 10);

  // Composite score: 0 = hardest, 1 = easiest
  const easyScore = (1 - distFactor) * 0.6 + densityFactor * 0.4;

  // Map to tiers with weighted distribution targeting 15/55/30
  if (easyScore > 0.7) return "easy";
  if (easyScore > 0.3) return "medium";
  return "hard";
}

/**
 * Build a PanoPackage from a resolved pano.
 * Branch panos (pano1-3) use the same panoId with different headings.
 * This is identical to how static packages with shared panoIds work.
 *
 * Navigation uses getLinks() to discover actual connections at runtime —
 * no extra metadata calls needed.
 */
function buildPanoPackage(
  pano: { panoId: string; lat: number; lng: number },
  province: string,
  district: string | undefined,
  difficulty: "easy" | "medium" | "hard",
  region: string
): PanoPackage {
  const heading0 = Math.floor(Math.random() * 360);

  const makeBranch = (headingOffset: number): PanoData => ({
    panoId: pano.panoId,
    lat: pano.lat,
    lng: pano.lng,
    heading: (heading0 + headingOffset + 360) % 360,
  });

  const locationName = district ? `${district}, ${province}` : province;

  return {
    id: `dyn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    mode: "urban",
    region: region as PanoPackage["region"],
    roadType: "urban_street",
    hintTags: ["signage", "dynamic"],
    qualityScore: 3, // Dynamic = slightly lower default quality
    blacklist: false,
    pano0: {
      panoId: pano.panoId,
      lat: pano.lat,
      lng: pano.lng,
      heading: heading0,
    },
    pano1: makeBranch(-90),  // Left
    pano2: makeBranch(90),   // Right
    pano3: makeBranch(180),  // Forward (opposite)
    locationName,
  };
}

/**
 * Map province name to region code.
 * Uses TURKEY_CITIES data indirectly via a lookup.
 */
function getProvinceRegion(province: string): string {
  // Import avoided to prevent circular dependency — use lightweight lookup
  const regionMap: Record<string, string> = {
    "İstanbul": "marmara", "Bursa": "marmara", "Kocaeli": "marmara",
    "Tekirdağ": "marmara", "Sakarya": "marmara", "Balıkesir": "marmara",
    "Çanakkale": "marmara", "Edirne": "marmara", "Yalova": "marmara",
    "İzmir": "ege", "Manisa": "ege", "Aydın": "ege", "Denizli": "ege", "Muğla": "ege",
    "Afyonkarahisar": "ege",
    "Antalya": "akdeniz", "Adana": "akdeniz", "Mersin": "akdeniz",
    "Hatay": "akdeniz", "Kahramanmaraş": "akdeniz", "Isparta": "akdeniz",
    "Ankara": "ic_anadolu", "Konya": "ic_anadolu", "Kayseri": "ic_anadolu",
    "Eskişehir": "ic_anadolu", "Sivas": "ic_anadolu", "Aksaray": "ic_anadolu",
    "Nevşehir": "ic_anadolu",
    "Samsun": "karadeniz", "Trabzon": "karadeniz", "Ordu": "karadeniz",
    "Giresun": "karadeniz", "Amasya": "karadeniz", "Rize": "karadeniz",
    "Artvin": "karadeniz", "Zonguldak": "karadeniz", "Bolu": "karadeniz",
    "Erzurum": "dogu_anadolu", "Malatya": "dogu_anadolu", "Elazığ": "dogu_anadolu",
    "Van": "dogu_anadolu", "Kars": "dogu_anadolu",
    "Gaziantep": "guneydogu", "Şanlıurfa": "guneydogu", "Diyarbakır": "guneydogu",
    "Mardin": "guneydogu", "Batman": "guneydogu", "Adıyaman": "guneydogu",
  };
  return regionMap[province] || "ic_anadolu";
}

// ==================== MAIN GENERATION FUNCTION ====================

/**
 * Attempt to mint a dynamic urban pano package.
 *
 * Cost-locked constraints:
 * - Max 2 StreetViewService.getPanorama() calls
 * - 0 geocode calls (locationName from seed data)
 * - If both attempts fail → returns null (caller uses static fallback)
 *
 * @param province - Target province name
 * @param lastProvince - Previous round's province (for back-to-back guard)
 * @param roomId - Optional multiplayer room ID (for Firebase persistence)
 * @returns DynamicMintResult with package or null
 */
export async function mintDynamicPackage(
  province: string,
  lastProvince: string | null,
  roomId?: string
): Promise<DynamicMintResult> {
  metrics.totalMintAttempts++;

  // Back-to-back province guard (should never happen — caller checks this)
  if (province === lastProvince) {
    metrics.totalMintFail++;
    return { package: null, attemptsUsed: 0, failReason: "back_to_back_province" };
  }

  const seedMap = getUrbanSeedMap();
  const seedEntry = seedMap.get(province);

  if (!seedEntry || seedEntry.seeds.length === 0) {
    metrics.totalMintFail++;
    return { package: null, attemptsUsed: 0, failReason: "no_seeds_for_province" };
  }

  if (!streetViewService) {
    metrics.totalMintFail++;
    return { package: null, attemptsUsed: 0, failReason: "sv_service_not_initialized" };
  }

  let attemptsUsed = 0;

  for (let attempt = 0; attempt < MAX_SV_ATTEMPTS; attempt++) {
    attemptsUsed++;
    metrics.totalSVCalls++;

    // Pick a random seed from this province
    const seed = seedEntry.seeds[Math.floor(Math.random() * seedEntry.seeds.length)];

    // Sample a coordinate within the seed
    const candidate = sampleFromSeed(seed);

    // Turkey bounds check
    if (!isWithinTurkeyBounds(candidate.lat, candidate.lng)) {
      metrics.repeatsBlockedByEnvelope++;
      continue;
    }

    // Resolve nearest pano
    const pano = await resolvePano(candidate.lat, candidate.lng);
    if (!pano) continue;

    // Urban invariant: resolved pano must be within seed envelope
    if (!isWithinSeedEnvelope(pano.lat, pano.lng, seed)) {
      metrics.repeatsBlockedByEnvelope++;
      continue;
    }

    // Create fingerprint
    const locationHash = createLocationHash(pano.lat, pano.lng);
    const clusterId = createClusterId(province, locationHash);

    // Persistent history check
    const historyRejection = checkPersistentHistory(pano.panoId, locationHash);
    if (historyRejection) {
      if (historyRejection === "persistent_panoId") metrics.repeatsBlockedByPanoId++;
      if (historyRejection === "persistent_locationHash") metrics.repeatsBlockedByHash++;
      continue;
    }

    // Estimate difficulty
    const difficulty = estimateDifficulty(
      pano.lat, pano.lng, seed, seedEntry.totalStaticPackages
    );

    // Build package
    const region = getProvinceRegion(province);
    const pkg = buildPanoPackage(pano, province, seed.district, difficulty, region);

    // Record in persistent history
    const fingerprint: LocationFingerprint = {
      panoId: pano.panoId,
      locationHash,
      province,
      clusterId,
      timestamp: Date.now(),
    };
    recordPersistentLocation(fingerprint, roomId);

    metrics.totalMintSuccess++;
    metrics.lastMintTimestamp = Date.now();
    updateAvgMetrics();

    return { package: pkg, attemptsUsed, failReason: null };
  }

  // All attempts exhausted
  metrics.totalMintFail++;
  updateAvgMetrics();

  return { package: null, attemptsUsed, failReason: "all_attempts_exhausted" };
}

// ==================== METRICS ====================

function updateAvgMetrics(): void {
  const total = metrics.totalMintSuccess + metrics.totalMintFail;
  metrics.avgAttemptsPerMint = total > 0 ? metrics.totalSVCalls / total : 0;
  metrics.mintFallbackRate = total > 0 ? metrics.totalMintFail / total : 0;
}

export function getDynamicMintMetrics(): Readonly<DynamicMintMetrics> {
  return { ...metrics };
}

export function resetDynamicMintMetrics(): void {
  metrics.totalMintAttempts = 0;
  metrics.totalMintSuccess = 0;
  metrics.totalMintFail = 0;
  metrics.totalSVCalls = 0;
  metrics.avgAttemptsPerMint = 0;
  metrics.mintFallbackRate = 0;
  metrics.repeatsBlockedByPanoId = 0;
  metrics.repeatsBlockedByHash = 0;
  metrics.repeatsBlockedByProvince = 0;
  metrics.repeatsBlockedByEnvelope = 0;
  metrics.lastMintTimestamp = 0;
}

// ==================== INITIALIZATION ====================

/**
 * Initialize the dynamic generator's StreetView service.
 * Must be called after Google Maps API loads.
 */
export function initDynamicGenerator(): void {
  if (typeof google !== "undefined" && google.maps) {
    streetViewService = new google.maps.StreetViewService();
  }
}

/**
 * Check if the dynamic generator is ready (has StreetView service).
 */
export function isDynamicGeneratorReady(): boolean {
  return streetViewService !== null;
}

// ==================== SIMULATION SUPPORT ====================

/**
 * Simulated pano resolution for testing.
 * In tests, we can't call Google APIs, so this provides deterministic results.
 *
 * The simulation creates a mock pano at the candidate coordinates with a
 * deterministic panoId derived from the coordinates.
 */
export interface MockPanoResolver {
  (lat: number, lng: number): { panoId: string; lat: number; lng: number } | null;
}

let mockResolver: MockPanoResolver | null = null;

export function setMockPanoResolver(resolver: MockPanoResolver | null): void {
  mockResolver = resolver;
}

/**
 * Mint a dynamic package using mock resolver (for testing/simulation).
 * Same logic as mintDynamicPackage but synchronous and uses mock resolver.
 */
export function mintDynamicPackageSync(
  province: string,
  lastProvince: string | null,
  roomId?: string
): DynamicMintResult {
  metrics.totalMintAttempts++;

  if (province === lastProvince) {
    metrics.totalMintFail++;
    return { package: null, attemptsUsed: 0, failReason: "back_to_back_province" };
  }

  const seedMap = getUrbanSeedMap();
  const seedEntry = seedMap.get(province);

  if (!seedEntry || seedEntry.seeds.length === 0) {
    metrics.totalMintFail++;
    return { package: null, attemptsUsed: 0, failReason: "no_seeds_for_province" };
  }

  if (!mockResolver) {
    metrics.totalMintFail++;
    return { package: null, attemptsUsed: 0, failReason: "no_mock_resolver" };
  }

  let attemptsUsed = 0;

  for (let attempt = 0; attempt < MAX_SV_ATTEMPTS; attempt++) {
    attemptsUsed++;
    metrics.totalSVCalls++;

    const seed = seedEntry.seeds[Math.floor(Math.random() * seedEntry.seeds.length)];
    const candidate = sampleFromSeed(seed);

    if (!isWithinTurkeyBounds(candidate.lat, candidate.lng)) {
      metrics.repeatsBlockedByEnvelope++;
      continue;
    }

    const pano = mockResolver(candidate.lat, candidate.lng);
    if (!pano) continue;

    if (!isWithinSeedEnvelope(pano.lat, pano.lng, seed)) {
      metrics.repeatsBlockedByEnvelope++;
      continue;
    }

    const locationHash = createLocationHash(pano.lat, pano.lng);
    const clusterId = createClusterId(province, locationHash);

    const historyRejection = checkPersistentHistory(pano.panoId, locationHash);
    if (historyRejection) {
      if (historyRejection === "persistent_panoId") metrics.repeatsBlockedByPanoId++;
      if (historyRejection === "persistent_locationHash") metrics.repeatsBlockedByHash++;
      continue;
    }

    const difficulty = estimateDifficulty(
      pano.lat, pano.lng, seed, seedEntry.totalStaticPackages
    );

    const region = getProvinceRegion(province);
    const pkg = buildPanoPackage(pano, province, seed.district, difficulty, region);

    const fingerprint: LocationFingerprint = {
      panoId: pano.panoId,
      locationHash,
      province,
      clusterId,
      timestamp: Date.now(),
    };
    recordPersistentLocation(fingerprint, roomId);

    metrics.totalMintSuccess++;
    metrics.lastMintTimestamp = Date.now();
    updateAvgMetrics();

    return { package: pkg, attemptsUsed, failReason: null };
  }

  metrics.totalMintFail++;
  updateAvgMetrics();

  return { package: null, attemptsUsed, failReason: "all_attempts_exhausted" };
}

// ==================== EXPORTS FOR TESTING ====================

export const _testExports = {
  createLocationHash,
  createClusterId,
  estimateDifficulty,
  buildPanoPackage,
  getProvinceRegion,
  MAX_SV_ATTEMPTS,
  SV_SEARCH_RADIUS_M,
  getStreetViewService: () => streetViewService,
  setStreetViewService: (svc: google.maps.StreetViewService | null) => { streetViewService = svc; },
};
