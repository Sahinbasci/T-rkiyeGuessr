/**
 * Urban Seed Map — Auto-derived from static URBAN_PACKAGES
 *
 * Each province has 1+ seed points (lat/lng centroid of its static packages)
 * with radius ranges calibrated to the geographic spread of those packages.
 *
 * For provinces with only 1 static package, a default urban radius (1.5km) is used.
 * For provinces with 2+ packages, the radius is derived from the spread + padding.
 *
 * These seeds are used by the Dynamic Urban Generator to sample candidate coords
 * within known urban zones, ensuring "urban feel" without new API calls.
 *
 * Generated from 86 URBAN_PACKAGES across 48 provinces.
 */

import { URBAN_PACKAGES } from "./panoPackages";

// ==================== TYPES ====================

export interface UrbanSeed {
  lat: number;
  lng: number;
  radiusKm: number;       // Sampling radius in km
  district?: string;      // District name if available (e.g., "Fatih")
}

export interface ProvinceSeedEntry {
  province: string;
  seeds: UrbanSeed[];
  totalStaticPackages: number;
}

export type UrbanSeedMap = Map<string, ProvinceSeedEntry>;

// ==================== CONSTANTS ====================

const DEFAULT_SINGLE_RADIUS_KM = 1.5;  // Default radius for 1-package provinces
const MIN_RADIUS_KM = 0.8;              // Minimum sampling radius
const MAX_RADIUS_KM = 3.0;              // Maximum sampling radius
const SPREAD_PADDING_KM = 0.5;          // Extra padding on computed spread
const EARTH_RADIUS_KM = 6371;

// ==================== HELPERS ====================

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Extract province name from locationName.
 * Handles: "İlçe, İl" → "İl", "Merkez, İl" → "İl", "İl" → "İl"
 */
function extractProvinceFromLocationName(locationName: string): string {
  const parts = locationName.split(",").map(s => s.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 1];
  }
  return locationName;
}

/**
 * Extract district name from locationName.
 * Handles: "İlçe, İl" → "İlçe", "İl" → undefined
 */
function extractDistrictFromLocationName(locationName: string): string | undefined {
  const parts = locationName.split(",").map(s => s.trim());
  if (parts.length >= 2) {
    return parts[0];
  }
  return undefined;
}

// ==================== SEED MAP BUILDER ====================

/**
 * Build UrbanSeedMap from URBAN_PACKAGES.
 *
 * Strategy:
 * - Group packages by province
 * - For provinces with 1 package: single seed at package coords, default radius
 * - For provinces with 2+ packages:
 *   - If spread > 5km: create per-district seeds (each district = 1 seed)
 *   - If spread <= 5km: single centroid seed with radius = spread/2 + padding
 *
 * This maximizes seed coverage while keeping radius urban-tight.
 */
export function buildUrbanSeedMap(): UrbanSeedMap {
  const seedMap: UrbanSeedMap = new Map();

  // Group packages by province
  const byProvince = new Map<string, Array<{
    lat: number; lng: number; district?: string; locationName: string;
  }>>();

  for (const pkg of URBAN_PACKAGES) {
    if (pkg.blacklist) continue;

    const province = extractProvinceFromLocationName(pkg.locationName);
    const district = extractDistrictFromLocationName(pkg.locationName);

    if (!byProvince.has(province)) {
      byProvince.set(province, []);
    }
    byProvince.get(province)!.push({
      lat: pkg.pano0.lat,
      lng: pkg.pano0.lng,
      district,
      locationName: pkg.locationName,
    });
  }

  for (const [province, points] of Array.from(byProvince.entries())) {
    if (points.length === 1) {
      // Single package → single seed with default radius
      seedMap.set(province, {
        province,
        seeds: [{
          lat: points[0].lat,
          lng: points[0].lng,
          radiusKm: DEFAULT_SINGLE_RADIUS_KM,
          district: points[0].district,
        }],
        totalStaticPackages: 1,
      });
      continue;
    }

    // Multiple packages — check geographic spread
    let maxDist = 0;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const d = haversineKm(points[i].lat, points[i].lng, points[j].lat, points[j].lng);
        if (d > maxDist) maxDist = d;
      }
    }

    if (maxDist > 5) {
      // Large spread → per-district seeds
      // Group by district, each gets its own seed
      const byDistrict = new Map<string, Array<{ lat: number; lng: number }>>();
      for (const p of points) {
        const key = p.district || "Merkez";
        if (!byDistrict.has(key)) byDistrict.set(key, []);
        byDistrict.get(key)!.push({ lat: p.lat, lng: p.lng });
      }

      const seeds: UrbanSeed[] = [];
      for (const [district, dPoints] of Array.from(byDistrict.entries())) {
        const centroidLat = dPoints.reduce((s: number, p: { lat: number; lng: number }) => s + p.lat, 0) / dPoints.length;
        const centroidLng = dPoints.reduce((s: number, p: { lat: number; lng: number }) => s + p.lng, 0) / dPoints.length;

        // Radius = max distance from centroid to any point + padding
        let radius = DEFAULT_SINGLE_RADIUS_KM;
        if (dPoints.length > 1) {
          let maxFromCenter = 0;
          for (const p of dPoints) {
            const d = haversineKm(centroidLat, centroidLng, p.lat, p.lng);
            if (d > maxFromCenter) maxFromCenter = d;
          }
          radius = Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, maxFromCenter + SPREAD_PADDING_KM));
        }

        seeds.push({
          lat: centroidLat,
          lng: centroidLng,
          radiusKm: radius,
          district,
        });
      }

      seedMap.set(province, { province, seeds, totalStaticPackages: points.length });
    } else {
      // Tight cluster → single centroid seed
      const centroidLat = points.reduce((s: number, p: { lat: number }) => s + p.lat, 0) / points.length;
      const centroidLng = points.reduce((s: number, p: { lng: number }) => s + p.lng, 0) / points.length;

      const radius = Math.min(MAX_RADIUS_KM, Math.max(MIN_RADIUS_KM, maxDist / 2 + SPREAD_PADDING_KM));

      seedMap.set(province, {
        province,
        seeds: [{
          lat: centroidLat,
          lng: centroidLng,
          radiusKm: radius,
        }],
        totalStaticPackages: points.length,
      });
    }
  }

  return seedMap;
}

// ==================== COORDINATE SAMPLING ====================

/**
 * Sample a random coordinate within a seed's radius.
 * Uses uniform disk distribution (not ring — we want coverage near center too,
 * but avoid exact center via minimum offset).
 */
export function sampleFromSeed(seed: UrbanSeed): { lat: number; lng: number } {
  const angle = Math.random() * 2 * Math.PI;
  // Uniform disk: r = R * sqrt(rand) gives uniform area distribution
  // Min offset = 0.1km to avoid exact seed center (hotspot avoidance)
  const minR = 0.1;
  const rawR = Math.sqrt(Math.random()) * seed.radiusKm;
  const distance = Math.max(minR, rawR);

  const latOffset = (distance * Math.cos(angle)) / 111;
  const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(seed.lat * Math.PI / 180));

  return {
    lat: seed.lat + latOffset,
    lng: seed.lng + lngOffset,
  };
}

/**
 * Check if a coordinate is within a seed's radius envelope.
 * Used as "urban invariant" check.
 */
export function isWithinSeedEnvelope(
  lat: number,
  lng: number,
  seed: UrbanSeed,
  toleranceKm: number = 0.5
): boolean {
  const dist = haversineKm(lat, lng, seed.lat, seed.lng);
  return dist <= seed.radiusKm + toleranceKm;
}

/**
 * Check if coordinates are within Turkey bounds.
 */
export function isWithinTurkeyBounds(lat: number, lng: number): boolean {
  return lat >= 35.8 && lat <= 42.2 && lng >= 25.5 && lng <= 45.0;
}

// ==================== SINGLETON ====================

let _cachedSeedMap: UrbanSeedMap | null = null;

export function getUrbanSeedMap(): UrbanSeedMap {
  if (!_cachedSeedMap) {
    _cachedSeedMap = buildUrbanSeedMap();
  }
  return _cachedSeedMap;
}

/**
 * Get total seed count across all provinces.
 */
export function getSeedStats(): { provinces: number; totalSeeds: number; avgRadius: number } {
  const map = getUrbanSeedMap();
  let totalSeeds = 0;
  let totalRadius = 0;

  for (const entry of Array.from(map.values())) {
    totalSeeds += entry.seeds.length;
    for (const s of entry.seeds) {
      totalRadius += s.radiusKm;
    }
  }

  return {
    provinces: map.size,
    totalSeeds,
    avgRadius: totalSeeds > 0 ? totalRadius / totalSeeds : 0,
  };
}
