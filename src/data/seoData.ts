/**
 * SEO Veri Katmanı
 * ALL_PANO_PACKAGES'dan şehir ve bölge verilerini çıkarır.
 * Statik sayfa üretimi (generateStaticParams) için kullanılır.
 */

import { ALL_PANO_PACKAGES } from "./panoPackages";

// ==================== TYPES ====================

export interface CityData {
  slug: string;
  locationName: string;
  district: string;
  province: string;
  region: string;
  regionDisplayName: string;
  packageCount: number;
  modes: string[];
  hintTags: string[];
  coordinates: { lat: number; lng: number };
  qualityScore: number;
}

export interface RegionData {
  slug: string;
  name: string;
  cities: CityData[];
  packageCount: number;
}

// ==================== HELPERS ====================

const REGION_DISPLAY_NAMES: Record<string, string> = {
  marmara: "Marmara Bölgesi",
  ege: "Ege Bölgesi",
  akdeniz: "Akdeniz Bölgesi",
  karadeniz: "Karadeniz Bölgesi",
  ic_anadolu: "İç Anadolu Bölgesi",
  dogu_anadolu: "Doğu Anadolu Bölgesi",
  guneydogu: "Güneydoğu Anadolu Bölgesi",
};

const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
  ı: "i", İ: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u",
  â: "a", Â: "a",
  î: "i", Î: "i",
  û: "u", Û: "u",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => TURKISH_CHAR_MAP[ch] || ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseLocationName(name: string): { district: string; province: string } {
  const parts = name.split(",").map((s) => s.trim());
  if (parts.length >= 2) {
    return { district: parts[0], province: parts[1] };
  }
  return { district: parts[0], province: parts[0] };
}

// ==================== DATA EXTRACTION ====================

let _citiesCache: CityData[] | null = null;
let _regionsCache: RegionData[] | null = null;

export function getAllCities(): CityData[] {
  if (_citiesCache) return _citiesCache;

  const cityMap = new Map<string, {
    locationName: string;
    district: string;
    province: string;
    region: string;
    packageCount: number;
    modes: Set<string>;
    hintTags: Set<string>;
    lat: number;
    lng: number;
    qualityScore: number;
  }>();

  for (const pkg of ALL_PANO_PACKAGES) {
    const key = pkg.locationName;
    const existing = cityMap.get(key);

    if (existing) {
      existing.packageCount++;
      existing.modes.add(pkg.mode);
      for (const tag of pkg.hintTags) existing.hintTags.add(tag);
      if (pkg.qualityScore > existing.qualityScore) {
        existing.qualityScore = pkg.qualityScore;
      }
    } else {
      const { district, province } = parseLocationName(pkg.locationName);
      cityMap.set(key, {
        locationName: pkg.locationName,
        district,
        province,
        region: pkg.region,
        packageCount: 1,
        modes: new Set([pkg.mode]),
        hintTags: new Set(pkg.hintTags),
        lat: pkg.pano0.lat,
        lng: pkg.pano0.lng,
        qualityScore: pkg.qualityScore,
      });
    }
  }

  _citiesCache = Array.from(cityMap.values()).map((c) => ({
    slug: slugify(c.locationName),
    locationName: c.locationName,
    district: c.district,
    province: c.province,
    region: c.region,
    regionDisplayName: REGION_DISPLAY_NAMES[c.region] || c.region,
    packageCount: c.packageCount,
    modes: Array.from(c.modes),
    hintTags: Array.from(c.hintTags),
    coordinates: { lat: c.lat, lng: c.lng },
    qualityScore: c.qualityScore,
  }));

  // Alphabetical sort by locationName
  _citiesCache.sort((a, b) => a.locationName.localeCompare(b.locationName, "tr"));

  return _citiesCache;
}

export function getAllRegions(): RegionData[] {
  if (_regionsCache) return _regionsCache;

  const cities = getAllCities();
  const regionMap = new Map<string, CityData[]>();

  for (const city of cities) {
    const existing = regionMap.get(city.region);
    if (existing) {
      existing.push(city);
    } else {
      regionMap.set(city.region, [city]);
    }
  }

  // Fixed region order
  const regionOrder = ["marmara", "ege", "akdeniz", "karadeniz", "ic_anadolu", "dogu_anadolu", "guneydogu"];

  _regionsCache = regionOrder
    .filter((slug) => regionMap.has(slug))
    .map((slug) => {
      const regionCities = regionMap.get(slug)!;
      return {
        slug,
        name: REGION_DISPLAY_NAMES[slug] || slug,
        cities: regionCities,
        packageCount: regionCities.reduce((sum, c) => sum + c.packageCount, 0),
      };
    });

  return _regionsCache;
}

export function getCityBySlug(slug: string): CityData | undefined {
  return getAllCities().find((c) => c.slug === slug);
}

export function getRegionBySlug(slug: string): RegionData | undefined {
  return getAllRegions().find((r) => r.slug === slug);
}

// Unique provinces count
export function getUniqueProvinceCount(): number {
  const provinces = new Set(getAllCities().map((c) => c.province));
  return provinces.size;
}
