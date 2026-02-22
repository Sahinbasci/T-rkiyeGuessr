#!/usr/bin/env npx ts-node
/**
 * collectOfflinePool.ts — Offline Pre-Computed Location Pool Collector
 *
 * Türkiye genelinde Street View panoramaları toplar, OSM ile sınıflandırır,
 * chunk'lara böler ve public/data/pool/ dizinine yazar.
 *
 * Kullanım:
 *   GOOGLE_MAPS_API_KEY=xxx npx ts-node scripts/collectOfflinePool.ts \
 *     --target-urban 600 --target-geo 400 [--resume] [--dry-run]
 *
 * Parametreler:
 *   --target-urban N    Hedef urban lokasyon sayısı (varsayılan: 600)
 *   --target-geo N      Hedef geo lokasyon sayısı (varsayılan: 400)
 *   --chunk-size N      Chunk başına lokasyon sayısı (varsayılan: 200)
 *   --resume            Önceki çalışmadan kalan checkpoint'ten devam et
 *   --dry-run           API çağrısı yapmadan test et
 *   --skip-osm          OSM sınıflandırma adımını atla (hızlı test için)
 *
 * Maliyet tahmini:
 *   ~2000 SV Resolution çağrısı × $0.007 = ~$14 tek seferlik
 *   OSM Overpass API: ücretsiz (rate-limited)
 *
 * Çıktı:
 *   public/data/pool/manifest.json
 *   public/data/pool/urban_chunk_0.json
 *   public/data/pool/urban_chunk_1.json
 *   public/data/pool/geo_chunk_0.json
 *   ...
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// ==================== TYPES ====================

interface CityData {
  name: string;
  lat: number;
  lng: number;
  radius: number;
  population: number;
  region:
    | "marmara"
    | "ege"
    | "akdeniz"
    | "karadeniz"
    | "ic_anadolu"
    | "dogu_anadolu"
    | "guneydogu";
  isUrban: boolean;
}

interface CandidatePoint {
  lat: number;
  lng: number;
  city: CityData;
  intendedMode: "urban" | "geo";
}

interface ResolvedPano {
  panoId: string;
  lat: number;
  lng: number;
  heading: number;
  candidate: CandidatePoint;
}

interface PrecomputedLocation {
  id: string;
  panoId: string;
  lat: number;
  lng: number;
  heading: number;
  province: string;
  district: string;
  region:
    | "marmara"
    | "ege"
    | "akdeniz"
    | "karadeniz"
    | "ic_anadolu"
    | "dogu_anadolu"
    | "guneydogu";
  classification: "urban" | "geo";
  roadType: "urban_street" | "highway" | "rural" | "village";
  qualityScore: number;
  locationHash: string;
  clusterId: string;
  validatedAt: string;
  osmMeta: {
    insideCityBoundary: boolean;
    nearestRoadClass: string;
    buildingDensity: number;
  };
}

interface Checkpoint {
  resolvedPanos: ResolvedPano[];
  classifiedLocations: PrecomputedLocation[];
  phase: "candidates" | "resolving" | "classifying" | "chunking" | "done";
  resolveIndex: number;
  classifyIndex: number;
  timestamp: string;
}

// ==================== CONSTANTS ====================

const OUTPUT_DIR = path.resolve(__dirname, "../public/data/pool");
const CHECKPOINT_FILE = path.resolve(__dirname, ".pool_checkpoint.json");

const GRID_PRECISION = 3; // 3 decimals ~111m cells
const SV_RESOLUTION_URL =
  "https://maps.googleapis.com/maps/api/streetview/metadata";
const OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";

// Rate limiting
const SV_DELAY_MS = 100; // 100ms between SV calls (~10 req/s)
const OVERPASS_DELAY_MS = 1500; // 1.5s between Overpass calls (respect rate limit)
const OVERPASS_BATCH_SIZE = 10; // Batch N locations per Overpass query

// ==================== 81 PROVINCES ====================
// Mirrors TURKEY_CITIES from dynamicPanoService.ts

const TURKEY_CITIES: CityData[] = [
  // MARMARA
  { name: "Istanbul", lat: 41.0082, lng: 28.9784, radius: 30, population: 15500000, region: "marmara", isUrban: true },
  { name: "Bursa", lat: 40.1826, lng: 29.0665, radius: 15, population: 3100000, region: "marmara", isUrban: true },
  { name: "Kocaeli", lat: 40.8533, lng: 29.8815, radius: 12, population: 2000000, region: "marmara", isUrban: true },
  { name: "Tekirdag", lat: 40.9780, lng: 27.5110, radius: 10, population: 1100000, region: "marmara", isUrban: true },
  { name: "Sakarya", lat: 40.7569, lng: 30.3950, radius: 10, population: 1000000, region: "marmara", isUrban: true },
  { name: "Balikesir", lat: 39.6484, lng: 27.8826, radius: 12, population: 1200000, region: "marmara", isUrban: true },
  { name: "Canakkale", lat: 40.1553, lng: 26.4142, radius: 10, population: 550000, region: "marmara", isUrban: false },
  { name: "Edirne", lat: 41.6772, lng: 26.5557, radius: 8, population: 400000, region: "marmara", isUrban: false },
  { name: "Kirklareli", lat: 41.7333, lng: 27.2167, radius: 8, population: 360000, region: "marmara", isUrban: false },
  { name: "Yalova", lat: 40.6500, lng: 29.2667, radius: 5, population: 275000, region: "marmara", isUrban: false },
  { name: "Bilecik", lat: 40.0567, lng: 30.0667, radius: 5, population: 220000, region: "marmara", isUrban: false },

  // EGE
  { name: "Izmir", lat: 38.4192, lng: 27.1287, radius: 20, population: 4400000, region: "ege", isUrban: true },
  { name: "Manisa", lat: 38.6191, lng: 27.4289, radius: 12, population: 1450000, region: "ege", isUrban: true },
  { name: "Aydin", lat: 37.8560, lng: 27.8416, radius: 12, population: 1100000, region: "ege", isUrban: true },
  { name: "Denizli", lat: 37.7765, lng: 29.0864, radius: 12, population: 1050000, region: "ege", isUrban: true },
  { name: "Mugla", lat: 37.2153, lng: 28.3636, radius: 15, population: 1000000, region: "ege", isUrban: true },
  { name: "Afyonkarahisar", lat: 38.7507, lng: 30.5567, radius: 10, population: 750000, region: "ege", isUrban: false },
  { name: "Kutahya", lat: 39.4167, lng: 29.9833, radius: 10, population: 580000, region: "ege", isUrban: false },
  { name: "Usak", lat: 38.6823, lng: 29.4082, radius: 8, population: 370000, region: "ege", isUrban: false },

  // AKDENIZ
  { name: "Antalya", lat: 36.8841, lng: 30.7056, radius: 20, population: 2550000, region: "akdeniz", isUrban: true },
  { name: "Adana", lat: 36.9914, lng: 35.3308, radius: 15, population: 2250000, region: "akdeniz", isUrban: true },
  { name: "Mersin", lat: 36.8000, lng: 34.6333, radius: 15, population: 1850000, region: "akdeniz", isUrban: true },
  { name: "Hatay", lat: 36.2025, lng: 36.1606, radius: 12, population: 1650000, region: "akdeniz", isUrban: true },
  { name: "Kahramanmaras", lat: 37.5858, lng: 36.9371, radius: 10, population: 1150000, region: "akdeniz", isUrban: true },
  { name: "Osmaniye", lat: 37.0742, lng: 36.2478, radius: 8, population: 540000, region: "akdeniz", isUrban: false },
  { name: "Isparta", lat: 37.7648, lng: 30.5566, radius: 8, population: 440000, region: "akdeniz", isUrban: false },
  { name: "Burdur", lat: 37.7203, lng: 30.2900, radius: 8, population: 270000, region: "akdeniz", isUrban: false },

  // KARADENIZ
  { name: "Samsun", lat: 41.2867, lng: 36.3300, radius: 12, population: 1350000, region: "karadeniz", isUrban: true },
  { name: "Trabzon", lat: 41.0015, lng: 39.7178, radius: 10, population: 810000, region: "karadeniz", isUrban: true },
  { name: "Ordu", lat: 40.9839, lng: 37.8764, radius: 10, population: 770000, region: "karadeniz", isUrban: true },
  { name: "Zonguldak", lat: 41.4564, lng: 31.7987, radius: 8, population: 600000, region: "karadeniz", isUrban: false },
  { name: "Tokat", lat: 40.3167, lng: 36.5500, radius: 10, population: 610000, region: "karadeniz", isUrban: false },
  { name: "Giresun", lat: 40.9128, lng: 38.3895, radius: 8, population: 450000, region: "karadeniz", isUrban: false },
  { name: "Amasya", lat: 40.6499, lng: 35.8353, radius: 8, population: 340000, region: "karadeniz", isUrban: false },
  { name: "Corum", lat: 40.5506, lng: 34.9556, radius: 10, population: 530000, region: "karadeniz", isUrban: false },
  { name: "Kastamonu", lat: 41.3887, lng: 33.7827, radius: 10, population: 380000, region: "karadeniz", isUrban: false },
  { name: "Sinop", lat: 42.0231, lng: 35.1531, radius: 8, population: 220000, region: "karadeniz", isUrban: false },
  { name: "Rize", lat: 41.0201, lng: 40.5234, radius: 8, population: 350000, region: "karadeniz", isUrban: false },
  { name: "Artvin", lat: 41.1828, lng: 41.8183, radius: 8, population: 170000, region: "karadeniz", isUrban: false },
  { name: "Bartin", lat: 41.6344, lng: 32.3375, radius: 6, population: 200000, region: "karadeniz", isUrban: false },
  { name: "Karabuk", lat: 41.2061, lng: 32.6204, radius: 6, population: 250000, region: "karadeniz", isUrban: false },
  { name: "Duzce", lat: 40.8438, lng: 31.1565, radius: 6, population: 400000, region: "karadeniz", isUrban: false },
  { name: "Bolu", lat: 40.7333, lng: 31.6000, radius: 8, population: 320000, region: "karadeniz", isUrban: false },
  { name: "Gumushane", lat: 40.4386, lng: 39.5086, radius: 6, population: 150000, region: "karadeniz", isUrban: false },
  { name: "Bayburt", lat: 40.2552, lng: 40.2249, radius: 5, population: 85000, region: "karadeniz", isUrban: false },

  // IC ANADOLU
  { name: "Ankara", lat: 39.9334, lng: 32.8597, radius: 25, population: 5750000, region: "ic_anadolu", isUrban: true },
  { name: "Konya", lat: 37.8713, lng: 32.4846, radius: 15, population: 2280000, region: "ic_anadolu", isUrban: true },
  { name: "Kayseri", lat: 38.7312, lng: 35.4787, radius: 12, population: 1420000, region: "ic_anadolu", isUrban: true },
  { name: "Eskisehir", lat: 39.7767, lng: 30.5206, radius: 12, population: 890000, region: "ic_anadolu", isUrban: true },
  { name: "Sivas", lat: 39.7477, lng: 37.0179, radius: 10, population: 640000, region: "ic_anadolu", isUrban: false },
  { name: "Yozgat", lat: 39.8181, lng: 34.8147, radius: 8, population: 420000, region: "ic_anadolu", isUrban: false },
  { name: "Aksaray", lat: 38.3687, lng: 34.0370, radius: 8, population: 420000, region: "ic_anadolu", isUrban: false },
  { name: "Nevsehir", lat: 38.6244, lng: 34.7239, radius: 8, population: 310000, region: "ic_anadolu", isUrban: false },
  { name: "Nigde", lat: 37.9667, lng: 34.6833, radius: 8, population: 360000, region: "ic_anadolu", isUrban: false },
  { name: "Kirsehir", lat: 39.1425, lng: 34.1709, radius: 6, population: 240000, region: "ic_anadolu", isUrban: false },
  { name: "Kirikkale", lat: 39.8468, lng: 33.5153, radius: 6, population: 290000, region: "ic_anadolu", isUrban: false },
  { name: "Karaman", lat: 37.1759, lng: 33.2287, radius: 8, population: 250000, region: "ic_anadolu", isUrban: false },
  { name: "Cankiri", lat: 40.6013, lng: 33.6134, radius: 6, population: 195000, region: "ic_anadolu", isUrban: false },

  // DOGU ANADOLU
  { name: "Erzurum", lat: 39.9000, lng: 41.2700, radius: 12, population: 760000, region: "dogu_anadolu", isUrban: true },
  { name: "Malatya", lat: 38.3552, lng: 38.3095, radius: 12, population: 810000, region: "dogu_anadolu", isUrban: true },
  { name: "Elazig", lat: 38.6810, lng: 39.2264, radius: 10, population: 590000, region: "dogu_anadolu", isUrban: false },
  { name: "Van", lat: 38.4942, lng: 43.3800, radius: 12, population: 1130000, region: "dogu_anadolu", isUrban: true },
  { name: "Agri", lat: 39.7191, lng: 43.0503, radius: 10, population: 540000, region: "dogu_anadolu", isUrban: false },
  { name: "Erzincan", lat: 39.7500, lng: 39.5000, radius: 8, population: 235000, region: "dogu_anadolu", isUrban: false },
  { name: "Mus", lat: 38.9462, lng: 41.7539, radius: 8, population: 410000, region: "dogu_anadolu", isUrban: false },
  { name: "Bitlis", lat: 38.4000, lng: 42.1167, radius: 8, population: 350000, region: "dogu_anadolu", isUrban: false },
  { name: "Bingol", lat: 38.8854, lng: 40.4980, radius: 8, population: 280000, region: "dogu_anadolu", isUrban: false },
  { name: "Kars", lat: 40.6167, lng: 43.1000, radius: 10, population: 290000, region: "dogu_anadolu", isUrban: false },
  { name: "Igdir", lat: 39.9167, lng: 44.0333, radius: 6, population: 200000, region: "dogu_anadolu", isUrban: false },
  { name: "Ardahan", lat: 41.1105, lng: 42.7022, radius: 6, population: 100000, region: "dogu_anadolu", isUrban: false },
  { name: "Hakkari", lat: 37.5833, lng: 43.7333, radius: 6, population: 280000, region: "dogu_anadolu", isUrban: false },
  { name: "Tunceli", lat: 39.1079, lng: 39.5401, radius: 6, population: 90000, region: "dogu_anadolu", isUrban: false },

  // GUNEYDOGU ANADOLU
  { name: "Gaziantep", lat: 37.0662, lng: 37.3833, radius: 15, population: 2130000, region: "guneydogu", isUrban: true },
  { name: "Sanliurfa", lat: 37.1591, lng: 38.7969, radius: 15, population: 2115000, region: "guneydogu", isUrban: true },
  { name: "Diyarbakir", lat: 37.9100, lng: 40.2300, radius: 12, population: 1790000, region: "guneydogu", isUrban: true },
  { name: "Mardin", lat: 37.3212, lng: 40.7245, radius: 10, population: 850000, region: "guneydogu", isUrban: true },
  { name: "Batman", lat: 37.8812, lng: 41.1351, radius: 8, population: 620000, region: "guneydogu", isUrban: false },
  { name: "Adiyaman", lat: 37.7648, lng: 38.2786, radius: 10, population: 630000, region: "guneydogu", isUrban: false },
  { name: "Sirnak", lat: 37.4187, lng: 42.4918, radius: 8, population: 540000, region: "guneydogu", isUrban: false },
  { name: "Siirt", lat: 37.9333, lng: 41.9500, radius: 6, population: 330000, region: "guneydogu", isUrban: false },
  { name: "Kilis", lat: 36.7184, lng: 37.1212, radius: 5, population: 145000, region: "guneydogu", isUrban: false },
];

// ==================== CLI PARSING ====================

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    targetUrban: 600,
    targetGeo: 400,
    chunkSize: 200,
    resume: false,
    dryRun: false,
    skipOsm: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--target-urban":
        config.targetUrban = parseInt(args[++i], 10);
        break;
      case "--target-geo":
        config.targetGeo = parseInt(args[++i], 10);
        break;
      case "--chunk-size":
        config.chunkSize = parseInt(args[++i], 10);
        break;
      case "--resume":
        config.resume = true;
        break;
      case "--dry-run":
        config.dryRun = true;
        break;
      case "--skip-osm":
        config.skipOsm = true;
        break;
    }
  }

  return config;
}

// ==================== HELPERS ====================

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createLocationHash(lat: number, lng: number): string {
  const factor = Math.pow(10, GRID_PRECISION);
  const rLat = Math.round(lat * factor) / factor;
  const rLng = Math.round(lng * factor) / factor;
  return `${rLat}_${rLng}`;
}

function createClusterId(province: string, locationHash: string): string {
  return `${province}__${locationHash}`;
}

function sha256(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 16);
}

// ==================== PHASE A: CANDIDATE GENERATION ====================

function generateCandidates(targetUrban: number, targetGeo: number): CandidatePoint[] {
  const candidates: CandidatePoint[] = [];

  // Calculate candidates per city based on targets
  const urbanCities = TURKEY_CITIES.filter((c) => c.isUrban);
  const allCities = TURKEY_CITIES;

  // Urban: 20-30 candidates per city center (radius * 0.4)
  const urbanPerCity = Math.ceil((targetUrban * 1.5) / urbanCities.length); // 1.5x overshoot for SV failures
  for (const city of urbanCities) {
    for (let i = 0; i < urbanPerCity; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.random() * city.radius * 0.4;
      const latOffset = (distance * Math.cos(angle)) / 111;
      const lngOffset =
        (distance * Math.sin(angle)) /
        (111 * Math.cos((city.lat * Math.PI) / 180));

      candidates.push({
        lat: city.lat + latOffset,
        lng: city.lng + lngOffset,
        city,
        intendedMode: "urban",
      });
    }
  }

  // Geo: 15-20 candidates per city (radius * 0.6-1.5, away from center)
  const geoPerCity = Math.ceil((targetGeo * 1.5) / allCities.length);
  for (const city of allCities) {
    for (let i = 0; i < geoPerCity; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const minDistance = city.radius * 0.6;
      const maxDistance = city.radius * 1.5;
      const distance = minDistance + Math.random() * (maxDistance - minDistance);
      const latOffset = (distance * Math.cos(angle)) / 111;
      const lngOffset =
        (distance * Math.sin(angle)) /
        (111 * Math.cos((city.lat * Math.PI) / 180));

      candidates.push({
        lat: city.lat + latOffset,
        lng: city.lng + lngOffset,
        city,
        intendedMode: "geo",
      });
    }
  }

  // Shuffle candidates to spread API calls across regions
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  console.log(
    `[Phase A] Generated ${candidates.length} candidates (${candidates.filter((c) => c.intendedMode === "urban").length} urban, ${candidates.filter((c) => c.intendedMode === "geo").length} geo)`
  );

  return candidates;
}

// ==================== PHASE B: STREET VIEW RESOLUTION ====================

async function resolveStreetView(
  candidate: CandidatePoint,
  apiKey: string
): Promise<ResolvedPano | null> {
  const url = `${SV_RESOLUTION_URL}?location=${candidate.lat},${candidate.lng}&source=outdoor&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = (await response.json()) as {
      status: string;
      pano_id?: string;
      location?: { lat: number; lng: number };
    };

    if (data.status !== "OK" || !data.pano_id) {
      return null;
    }

    // Validate Turkey bounds (lat 35-43, lng 25-46)
    const lat = data.location?.lat ?? candidate.lat;
    const lng = data.location?.lng ?? candidate.lng;
    if (lat < 35 || lat > 43 || lng < 25 || lng > 46) {
      return null;
    }

    return {
      panoId: data.pano_id,
      lat,
      lng,
      heading: Math.floor(Math.random() * 360), // Random initial heading
      candidate,
    };
  } catch (err) {
    console.warn(`  SV resolve error for (${candidate.lat.toFixed(4)}, ${candidate.lng.toFixed(4)}):`, err);
    return null;
  }
}

async function resolveAllCandidates(
  candidates: CandidatePoint[],
  apiKey: string,
  targetUrban: number,
  targetGeo: number,
  startIndex: number = 0,
  existingResolved: ResolvedPano[] = []
): Promise<ResolvedPano[]> {
  const resolved: ResolvedPano[] = [...existingResolved];
  const seenPanoIds = new Set(resolved.map((r) => r.panoId));
  const seenHashes = new Set(
    resolved.map((r) => createLocationHash(r.lat, r.lng))
  );

  let urbanCount = resolved.filter(
    (r) => r.candidate.intendedMode === "urban"
  ).length;
  let geoCount = resolved.filter(
    (r) => r.candidate.intendedMode === "geo"
  ).length;

  const totalTarget = targetUrban + targetGeo;

  console.log(
    `[Phase B] Resolving Street View panoramas... (starting from index ${startIndex})`
  );

  for (let i = startIndex; i < candidates.length; i++) {
    // Check if we have enough
    if (urbanCount >= targetUrban && geoCount >= targetGeo) {
      console.log(`[Phase B] Targets reached: ${urbanCount} urban, ${geoCount} geo`);
      break;
    }

    // Skip if we already have enough for this mode
    const candidate = candidates[i];
    if (
      candidate.intendedMode === "urban" && urbanCount >= targetUrban
    ) continue;
    if (
      candidate.intendedMode === "geo" && geoCount >= targetGeo
    ) continue;

    const pano = await resolveStreetView(candidate, apiKey);
    await sleep(SV_DELAY_MS);

    if (!pano) continue;

    // Deduplicate by panoId and location hash
    if (seenPanoIds.has(pano.panoId)) continue;
    const hash = createLocationHash(pano.lat, pano.lng);
    if (seenHashes.has(hash)) continue;

    seenPanoIds.add(pano.panoId);
    seenHashes.add(hash);
    resolved.push(pano);

    if (candidate.intendedMode === "urban") urbanCount++;
    else geoCount++;

    // Progress log every 50 resolved
    if (resolved.length % 50 === 0) {
      console.log(
        `  Progress: ${resolved.length}/${totalTarget} resolved (${urbanCount} urban, ${geoCount} geo, ${i + 1}/${candidates.length} candidates checked)`
      );

      // Save checkpoint
      saveCheckpoint({
        resolvedPanos: resolved,
        classifiedLocations: [],
        phase: "resolving",
        resolveIndex: i + 1,
        classifyIndex: 0,
        timestamp: new Date().toISOString(),
      });
    }
  }

  console.log(
    `[Phase B] Resolution complete: ${resolved.length} total (${urbanCount} urban, ${geoCount} geo)`
  );

  return resolved;
}

// ==================== PHASE C: OSM CLASSIFICATION ====================

interface OsmClassification {
  insideCityBoundary: boolean;
  nearestRoadClass: string;
  buildingDensity: number;
  classification: "urban" | "geo";
  roadType: "urban_street" | "highway" | "rural" | "village";
}

async function classifyWithOSM(
  lat: number,
  lng: number
): Promise<OsmClassification> {
  // Default fallback values
  const fallback: OsmClassification = {
    insideCityBoundary: false,
    nearestRoadClass: "unknown",
    buildingDensity: 0,
    classification: "geo",
    roadType: "rural",
  };

  try {
    // Combined Overpass query for efficiency:
    // 1. Admin boundary level 6 (district) containing point
    // 2. Nearest road within 50m
    // 3. Building count within 200m
    const query = `
      [out:json][timeout:15];
      (
        // Admin boundaries (district level) containing point
        is_in(${lat},${lng})->.a;
        area.a["boundary"="administrative"]["admin_level"~"^(6|7|8)$"];
        out tags;

        // Roads within 50m
        way(around:50,${lat},${lng})["highway"];
        out tags;

        // Buildings within 200m (count only)
        way(around:200,${lat},${lng})["building"];
        out count;
      );
    `;

    const response = await fetch(OVERPASS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) {
      console.warn(`  Overpass error: HTTP ${response.status}`);
      return fallback;
    }

    const data = (await response.json()) as {
      elements?: Array<{
        type?: string;
        tags?: Record<string, string>;
      }>;
    };
    const elements = data.elements || [];

    // Parse admin boundaries
    let insideBoundary = false;
    for (const el of elements) {
      if (el.tags?.boundary === "administrative") {
        insideBoundary = true;
        break;
      }
    }

    // Parse nearest road
    let nearestRoadClass = "unknown";
    const roadPriority = [
      "motorway", "trunk", "primary", "secondary", "tertiary",
      "residential", "living_street", "service", "unclassified",
      "track", "path",
    ];
    for (const el of elements) {
      if (el.tags?.highway && !el.tags?.boundary) {
        const hw = el.tags.highway;
        if (roadPriority.indexOf(hw) < roadPriority.indexOf(nearestRoadClass) || nearestRoadClass === "unknown") {
          nearestRoadClass = hw;
        }
      }
    }

    // Parse building count
    let buildingCount = 0;
    for (const el of elements) {
      if (el.type === "count") {
        buildingCount = el.tags?.total ? parseInt(el.tags.total, 10) : 0;
      }
    }
    // Normalize: 0-1, with 50+ buildings = 1.0
    const buildingDensity = Math.min(1, buildingCount / 50);

    // Composite classification score
    const urbanRoads = new Set([
      "residential", "living_street", "service", "tertiary",
      "secondary", "primary",
    ]);
    const highwayRoads = new Set(["motorway", "trunk"]);

    const boundaryScore = insideBoundary ? 0.5 : 0;
    const roadScore = urbanRoads.has(nearestRoadClass) ? 0.3 : 0;
    const densityScore = buildingDensity * 0.2;
    const compositeScore = boundaryScore + roadScore + densityScore;

    const classification: "urban" | "geo" =
      compositeScore >= 0.5 ? "urban" : "geo";

    // Road type mapping
    let roadType: "urban_street" | "highway" | "rural" | "village";
    if (highwayRoads.has(nearestRoadClass)) {
      roadType = "highway";
    } else if (urbanRoads.has(nearestRoadClass)) {
      roadType = "urban_street";
    } else if (
      nearestRoadClass === "track" || nearestRoadClass === "path"
    ) {
      roadType = "village";
    } else {
      roadType = "rural";
    }

    return {
      insideCityBoundary: insideBoundary,
      nearestRoadClass,
      buildingDensity,
      classification,
      roadType,
    };
  } catch (err) {
    console.warn(`  OSM classify error for (${lat.toFixed(4)}, ${lng.toFixed(4)}):`, err);
    return fallback;
  }
}

async function classifyAllPanos(
  panos: ResolvedPano[],
  skipOsm: boolean,
  startIndex: number = 0,
  existingLocations: PrecomputedLocation[] = []
): Promise<PrecomputedLocation[]> {
  const locations: PrecomputedLocation[] = [...existingLocations];

  console.log(
    `[Phase C] Classifying ${panos.length} panoramas with OSM... (starting from index ${startIndex})`
  );

  for (let i = startIndex; i < panos.length; i++) {
    const pano = panos[i];
    const locationHash = createLocationHash(pano.lat, pano.lng);
    const clusterId = createClusterId(pano.candidate.city.name, locationHash);

    let osmResult: OsmClassification;

    if (skipOsm) {
      // Use intended mode from candidate as fallback
      osmResult = {
        insideCityBoundary: pano.candidate.intendedMode === "urban",
        nearestRoadClass: pano.candidate.intendedMode === "urban" ? "residential" : "unclassified",
        buildingDensity: pano.candidate.intendedMode === "urban" ? 0.6 : 0.1,
        classification: pano.candidate.intendedMode,
        roadType: pano.candidate.intendedMode === "urban" ? "urban_street" : "rural",
      };
    } else {
      osmResult = await classifyWithOSM(pano.lat, pano.lng);
      await sleep(OVERPASS_DELAY_MS);
    }

    // Generate quality score based on OSM data
    let qualityScore = 3; // Default
    if (osmResult.classification === "urban") {
      if (osmResult.buildingDensity > 0.5) qualityScore = 4;
      if (osmResult.buildingDensity > 0.7 && osmResult.insideCityBoundary)
        qualityScore = 5;
    } else {
      if (osmResult.nearestRoadClass !== "unknown") qualityScore = 4;
      if (
        osmResult.roadType === "highway" ||
        osmResult.roadType === "rural"
      )
        qualityScore = 4;
    }

    const loc: PrecomputedLocation = {
      id: `pc_${pano.candidate.city.name.toLowerCase().replace(/\s+/g, "_")}_${String(i).padStart(4, "0")}`,
      panoId: pano.panoId,
      lat: pano.lat,
      lng: pano.lng,
      heading: pano.heading,
      province: pano.candidate.city.name,
      district: "", // Would need reverse geocoding — left empty for offline
      region: pano.candidate.city.region,
      classification: osmResult.classification,
      roadType: osmResult.roadType,
      qualityScore,
      locationHash,
      clusterId,
      validatedAt: new Date().toISOString(),
      osmMeta: {
        insideCityBoundary: osmResult.insideCityBoundary,
        nearestRoadClass: osmResult.nearestRoadClass,
        buildingDensity: osmResult.buildingDensity,
      },
    };

    locations.push(loc);

    // Progress log every 50
    if (locations.length % 50 === 0) {
      const urbanLocs = locations.filter((l) => l.classification === "urban").length;
      const geoLocs = locations.filter((l) => l.classification === "geo").length;
      console.log(
        `  Progress: ${locations.length}/${panos.length} classified (${urbanLocs} urban, ${geoLocs} geo)`
      );

      // Save checkpoint
      saveCheckpoint({
        resolvedPanos: panos,
        classifiedLocations: locations,
        phase: "classifying",
        resolveIndex: panos.length,
        classifyIndex: i + 1,
        timestamp: new Date().toISOString(),
      });
    }
  }

  const urbanCount = locations.filter((l) => l.classification === "urban").length;
  const geoCount = locations.filter((l) => l.classification === "geo").length;
  console.log(
    `[Phase C] Classification complete: ${locations.length} total (${urbanCount} urban, ${geoCount} geo)`
  );

  return locations;
}

// ==================== PHASE D: CHUNKING & OUTPUT ====================

function chunkLocations(
  locations: PrecomputedLocation[],
  chunkSize: number
): void {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Split by mode
  const urbanLocs = locations.filter((l) => l.classification === "urban");
  const geoLocs = locations.filter((l) => l.classification === "geo");

  const version = 1;
  const generatedAt = new Date().toISOString();
  const chunks: Array<{
    id: string;
    mode: "urban" | "geo";
    count: number;
    url: string;
    hash: string;
  }> = [];

  // Write urban chunks
  for (let i = 0; i < urbanLocs.length; i += chunkSize) {
    const chunkLocs = urbanLocs.slice(i, i + chunkSize);
    const chunkIndex = Math.floor(i / chunkSize);
    const chunkId = `urban_chunk_${chunkIndex}`;
    const fileName = `${chunkId}.json`;

    const chunkData = {
      chunkId,
      mode: "urban" as const,
      locations: chunkLocs,
      version,
      generatedAt,
    };

    const jsonStr = JSON.stringify(chunkData);
    fs.writeFileSync(path.join(OUTPUT_DIR, fileName), jsonStr, "utf-8");

    chunks.push({
      id: chunkId,
      mode: "urban",
      count: chunkLocs.length,
      url: `/data/pool/${fileName}`,
      hash: sha256(jsonStr),
    });

    console.log(
      `  Wrote ${fileName}: ${chunkLocs.length} locations (${(jsonStr.length / 1024).toFixed(1)} KB)`
    );
  }

  // Write geo chunks
  for (let i = 0; i < geoLocs.length; i += chunkSize) {
    const chunkLocs = geoLocs.slice(i, i + chunkSize);
    const chunkIndex = Math.floor(i / chunkSize);
    const chunkId = `geo_chunk_${chunkIndex}`;
    const fileName = `${chunkId}.json`;

    const chunkData = {
      chunkId,
      mode: "geo" as const,
      locations: chunkLocs,
      version,
      generatedAt,
    };

    const jsonStr = JSON.stringify(chunkData);
    fs.writeFileSync(path.join(OUTPUT_DIR, fileName), jsonStr, "utf-8");

    chunks.push({
      id: chunkId,
      mode: "geo",
      count: chunkLocs.length,
      url: `/data/pool/${fileName}`,
      hash: sha256(jsonStr),
    });

    console.log(
      `  Wrote ${fileName}: ${chunkLocs.length} locations (${(jsonStr.length / 1024).toFixed(1)} KB)`
    );
  }

  // Write manifest
  const manifest = {
    version,
    generatedAt,
    chunks,
    totalUrban: urbanLocs.length,
    totalGeo: geoLocs.length,
  };

  const manifestStr = JSON.stringify(manifest, null, 2);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "manifest.json"),
    manifestStr,
    "utf-8"
  );

  console.log(`\n[Phase D] Output complete:`);
  console.log(`  Manifest: ${OUTPUT_DIR}/manifest.json`);
  console.log(`  Chunks: ${chunks.length} files`);
  console.log(`  Urban: ${urbanLocs.length} locations in ${chunks.filter((c) => c.mode === "urban").length} chunks`);
  console.log(`  Geo: ${geoLocs.length} locations in ${chunks.filter((c) => c.mode === "geo").length} chunks`);
}

// ==================== CHECKPOINT ====================

function saveCheckpoint(checkpoint: Checkpoint): void {
  try {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint), "utf-8");
  } catch (err) {
    console.warn("Failed to save checkpoint:", err);
  }
}

function loadCheckpoint(): Checkpoint | null {
  try {
    if (!fs.existsSync(CHECKPOINT_FILE)) return null;
    const raw = fs.readFileSync(CHECKPOINT_FILE, "utf-8");
    return JSON.parse(raw) as Checkpoint;
  } catch {
    return null;
  }
}

function clearCheckpoint(): void {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      fs.unlinkSync(CHECKPOINT_FILE);
    }
  } catch {}
}

// ==================== COVERAGE REPORT ====================

function printCoverageReport(locations: PrecomputedLocation[]): void {
  console.log("\n========================================");
  console.log("COVERAGE REPORT");
  console.log("========================================\n");

  const byProvince = new Map<
    string,
    { urban: number; geo: number; total: number }
  >();

  for (const loc of locations) {
    const existing = byProvince.get(loc.province) || {
      urban: 0,
      geo: 0,
      total: 0,
    };
    if (loc.classification === "urban") existing.urban++;
    else existing.geo++;
    existing.total++;
    byProvince.set(loc.province, existing);
  }

  // Sort by total descending
  const sorted = Array.from(byProvince.entries()).sort(
    (a, b) => b[1].total - a[1].total
  );

  console.log(
    "Province".padEnd(20) +
      "Urban".padStart(8) +
      "Geo".padStart(8) +
      "Total".padStart(8)
  );
  console.log("-".repeat(44));

  for (const [province, counts] of sorted) {
    console.log(
      province.padEnd(20) +
        String(counts.urban).padStart(8) +
        String(counts.geo).padStart(8) +
        String(counts.total).padStart(8)
    );
  }

  // Missing provinces
  const coveredProvinces = new Set(byProvince.keys());
  const missingProvinces = TURKEY_CITIES.filter(
    (c) => !coveredProvinces.has(c.name)
  );

  if (missingProvinces.length > 0) {
    console.log(`\nMissing provinces (${missingProvinces.length}):`);
    for (const c of missingProvinces) {
      console.log(`  - ${c.name} (${c.region})`);
    }
  } else {
    console.log(`\nAll ${TURKEY_CITIES.length} provinces covered!`);
  }

  // By region
  const byRegion = new Map<string, number>();
  for (const loc of locations) {
    byRegion.set(loc.region, (byRegion.get(loc.region) || 0) + 1);
  }
  console.log("\nBy region:");
  for (const [region, count] of Array.from(byRegion.entries()).sort(
    (a, b) => b[1] - a[1]
  )) {
    console.log(`  ${region}: ${count}`);
  }
}

// ==================== MAIN ====================

async function main(): Promise<void> {
  const config = parseArgs();
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  console.log("========================================");
  console.log("TurkiyeGuessr Offline Pool Collector");
  console.log("========================================\n");
  console.log(`Target: ${config.targetUrban} urban, ${config.targetGeo} geo`);
  console.log(`Chunk size: ${config.chunkSize}`);
  console.log(`Dry run: ${config.dryRun}`);
  console.log(`Skip OSM: ${config.skipOsm}`);
  console.log(`Resume: ${config.resume}`);
  console.log();

  if (!apiKey && !config.dryRun) {
    console.error(
      "ERROR: GOOGLE_MAPS_API_KEY environment variable is required."
    );
    console.error(
      "Usage: GOOGLE_MAPS_API_KEY=xxx npx ts-node scripts/collectOfflinePool.ts"
    );
    process.exit(1);
  }

  // Check for checkpoint
  let checkpoint: Checkpoint | null = null;
  if (config.resume) {
    checkpoint = loadCheckpoint();
    if (checkpoint) {
      console.log(
        `Resuming from checkpoint (phase=${checkpoint.phase}, ${checkpoint.resolvedPanos.length} resolved, ${checkpoint.classifiedLocations.length} classified)`
      );
    } else {
      console.log("No checkpoint found, starting fresh.");
    }
  }

  // Phase A: Generate candidate coordinates
  const candidates = generateCandidates(config.targetUrban, config.targetGeo);

  if (config.dryRun) {
    console.log("\n[DRY RUN] Would resolve these candidates:");
    console.log(`  Total: ${candidates.length}`);
    console.log(
      `  Urban candidates: ${candidates.filter((c) => c.intendedMode === "urban").length}`
    );
    console.log(
      `  Geo candidates: ${candidates.filter((c) => c.intendedMode === "geo").length}`
    );
    console.log(`  Estimated SV API calls: ~${candidates.length}`);
    console.log(
      `  Estimated cost: ~$${(candidates.length * 0.007).toFixed(2)}`
    );
    return;
  }

  // Phase B: Resolve with Street View API
  let resolvedPanos: ResolvedPano[];
  if (
    checkpoint &&
    (checkpoint.phase === "classifying" || checkpoint.phase === "chunking")
  ) {
    resolvedPanos = checkpoint.resolvedPanos;
    console.log(
      `[Phase B] Using ${resolvedPanos.length} panos from checkpoint`
    );
  } else {
    const startIndex =
      checkpoint?.phase === "resolving" ? checkpoint.resolveIndex : 0;
    const existingResolved =
      checkpoint?.phase === "resolving" ? checkpoint.resolvedPanos : [];
    resolvedPanos = await resolveAllCandidates(
      candidates,
      apiKey!,
      config.targetUrban,
      config.targetGeo,
      startIndex,
      existingResolved
    );
  }

  // Phase C: Classify with OSM
  let locations: PrecomputedLocation[];
  if (checkpoint?.phase === "chunking") {
    locations = checkpoint.classifiedLocations;
    console.log(
      `[Phase C] Using ${locations.length} locations from checkpoint`
    );
  } else {
    const startIndex =
      checkpoint?.phase === "classifying" ? checkpoint.classifyIndex : 0;
    const existingLocs =
      checkpoint?.phase === "classifying"
        ? checkpoint.classifiedLocations
        : [];
    locations = await classifyAllPanos(
      resolvedPanos,
      config.skipOsm,
      startIndex,
      existingLocs
    );
  }

  // Phase D: Chunk and write output
  console.log("\n[Phase D] Writing chunk files...");
  chunkLocations(locations, config.chunkSize);

  // Coverage report
  printCoverageReport(locations);

  // Clean up checkpoint
  clearCheckpoint();

  console.log("\nDone! Pool data written to public/data/pool/");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
