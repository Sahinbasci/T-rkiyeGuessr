/**
 * Dinamik Pano Üretim Servisi
 *
 * Binlerce benzersiz lokasyon için:
 * 1. Türkiye genelinde rastgele koordinatlar üretir
 * 2. Google Street View API ile gerçek pano ID'leri bulur
 * 3. Her oyunda tekrar etmeyen benzersiz lokasyonlar sağlar
 */

import { PanoPackage, GameMode, PanoData } from "@/types";
import { logger } from "@/utils/logger";
import {
  selectStaticPackage,
  resetLocationEngine,
  getEnrichmentReport,
  getNextProvince,
  shouldAttemptDynamic,
  recordDynamicSelection,
  getLastProvince,
  incrementRoundCount,
} from "./locationEngine";
import {
  mintDynamicPackage,
  initDynamicGenerator,
  isDynamicGeneratorReady,
} from "./dynamicUrbanGenerator";
import { initPersistentHistory } from "./persistentHistory";
import { getPoolManager } from "./poolManager";
import { TURKEY_CITIES, CityData } from "@/data/turkeyCities";

// ==================== TÜRKİYE BÖLGE VERİLERİ ====================
// Her bölge için koordinat sınırları ve ağırlıklar

interface RegionData {
  name: string;
  bounds: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  weight: number; // Seçilme olasılığı (nüfus yoğunluğuna göre)
  urbanWeight: number; // Urban mod için ağırlık
  geoWeight: number; // Geo mod için ağırlık
}

// Re-export for backward compat — tüm importlar artık @/data/turkeyCities'ten gelir
export { TURKEY_CITIES, type CityData } from "@/data/turkeyCities";

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * Belirli bir merkez etrafında rastgele koordinat üret
 * Urban mod için şehir merkezine yakın, Geo mod için şehir merkezinden UZAK
 */
function getRandomCoordinateNearCity(city: CityData, mode: GameMode): { lat: number; lng: number } {
  // Rastgele açı
  const angle = Math.random() * 2 * Math.PI;

  let distance: number;

  if (mode === "urban") {
    // Urban modda şehir merkezine daha yakın ol (radius'un %40'ı)
    distance = Math.random() * city.radius * 0.4;
  } else {
    // Geo modda şehir merkezinden UZAK ol
    // Minimum mesafe: radius'un %60'ı, maksimum: radius'un %150'si
    const minDistance = city.radius * 0.6;
    const maxDistance = city.radius * 1.5;
    distance = minDistance + Math.random() * (maxDistance - minDistance);
  }

  // Yaklaşık dönüşüm (1 derece ≈ 111 km)
  const latOffset = (distance * Math.cos(angle)) / 111;
  const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos(city.lat * Math.PI / 180));

  return {
    lat: city.lat + latOffset,
    lng: city.lng + lngOffset
  };
}

// ==================== PROVINCE BAG (HYBRID D1 MODEL) ====================
// Stratified sampling: shuffled bag of ALL provinces, no repetition within session.
// Each round pops next province. Ensures uniform geographic distribution.

let provinceBag: CityData[] = [];
let usedProvincesInSession: Set<string> = new Set();

/**
 * Fisher-Yates shuffle (in-place, unbiased)
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Province bag'i oluştur veya yenile
 * Tüm 81 ili karıştırıp sıralı çekme havuzu yapar
 */
function ensureProvinceBag(mode: GameMode): void {
  if (provinceBag.length > 0) return; // Hala çekilecek il var

  // Bag boşalmış — tüm 81 ili yeniden doldur
  // Urban mod: tüm iller dahil (her ilin şehir merkezi var)
  // Geo mod: tüm iller dahil
  provinceBag = shuffleArray([...TURKEY_CITIES]);
  logger.debug(`[ProvinceBag] Bag refilled with ${provinceBag.length} provinces (mode=${mode})`);
}

/**
 * Province bag'dan sonraki ili çek
 * Session içinde tekrar etmez
 */
function popNextProvince(mode: GameMode): CityData {
  ensureProvinceBag(mode);

  // Session'da kullanılmamış bir il bul
  while (provinceBag.length > 0) {
    const city = provinceBag.pop()!;
    if (!usedProvincesInSession.has(city.name)) {
      usedProvincesInSession.add(city.name);
      return city;
    }
  }

  // Bag bitti ve tüm iller kullanılmış — session tracker'ı sıfırla
  usedProvincesInSession.clear();
  ensureProvinceBag(mode);
  const city = provinceBag.pop()!;
  usedProvincesInSession.add(city.name);
  return city;
}

/**
 * Province bag ve session tracker'ı sıfırla
 */
export function resetProvinceBag(): void {
  provinceBag = [];
  usedProvincesInSession.clear();
}

/**
 * Şehir seç — HYBRID D1 MODEL
 * Urban mod: Province bag'dan stratified çekim (tüm 81 il eşit şanslı)
 * Geo mod: Mevcut ağırlıklı sistemi korur (doğa/kırsal odaklı)
 */
function selectWeightedCity(mode: GameMode): CityData {
  if (mode === "urban") {
    // HYBRID D1: Stratified province selection
    return popNextProvince(mode);
  }

  // Geo mod: Kırsal bölgelere ve doğa alanlarına ağırlık (mevcut davranış korunuyor)
  let weightedCities: { city: CityData; weight: number }[] = TURKEY_CITIES.map(city => ({
    city,
    weight: city.isUrban ? city.population * 0.1 : city.population * 2
  }));

  const totalWeight = weightedCities.reduce((sum, wc) => sum + wc.weight, 0);
  let random = Math.random() * totalWeight;

  for (const wc of weightedCities) {
    random -= wc.weight;
    if (random <= 0) {
      return wc.city;
    }
  }

  return weightedCities[0].city;
}

/**
 * Koordinatlardan konum adı al (Reverse Geocoding)
 */
async function getLocationNameFromCoords(lat: number, lng: number, fallbackCity: string): Promise<string> {
  if (typeof google === "undefined" || !google.maps) {
    return fallbackCity;
  }

  try {
    sessionApiCallCount++;
    const geocoder = new google.maps.Geocoder();
    const result = await new Promise<google.maps.GeocoderResult[] | null>((resolve) => {
      geocoder.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results) {
            resolve(results);
          } else {
            resolve(null);
          }
        }
      );
    });

    if (!result || result.length === 0) {
      return fallbackCity;
    }

    let ilce = "";
    let il = "";

    // Sonuçları tara ve il/ilçe bul
    for (const r of result) {
      for (const component of r.address_components) {
        // İlçe
        if (
          component.types.includes("administrative_area_level_2") ||
          component.types.includes("locality")
        ) {
          if (!ilce) ilce = component.long_name;
        }
        // İl
        if (component.types.includes("administrative_area_level_1")) {
          if (!il) il = component.long_name;
        }
      }
      if (il && ilce) break;
    }

    // Sonucu formatla: "İlçe, İl"
    if (ilce && il) {
      // İlçe ve il aynıysa veya merkez ise sadece il göster
      if (ilce === il || ilce.includes("Merkez")) {
        return il;
      }
      return `${ilce}, ${il}`;
    } else if (il) {
      return il;
    } else if (ilce) {
      return ilce;
    }

    return fallbackCity;
  } catch (error) {
    logger.error("Geocoding error:", error);
    return fallbackCity;
  }
}

/**
 * Heading hesapla (iki nokta arasında)
 */
function calculateHeading(fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const dLng = (toLng - fromLng) * Math.PI / 180;
  const lat1 = fromLat * Math.PI / 180;
  const lat2 = toLat * Math.PI / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  let heading = Math.atan2(y, x) * 180 / Math.PI;
  return (heading + 360) % 360;
}

// ==================== ANA SERVİS ====================

// Oturumdaki kullanılmış lokasyonları takip et
let usedLocationHashes: Set<string> = new Set();
let streetViewService: google.maps.StreetViewService | null = null;

// Session API call ceiling — prevents runaway costs
const MAX_SESSION_API_CALLS = 50;
let sessionApiCallCount = 0;

/**
 * Street View servisini başlat
 */
export function initStreetViewService(): void {
  if (typeof google !== 'undefined' && google.maps) {
    streetViewService = new google.maps.StreetViewService();
  }
}

/**
 * Lokasyon hash'i oluştur (tekrarı önlemek için)
 */
function getLocationHash(lat: number, lng: number): string {
  // 0.01 derece hassasiyetinde (yaklaşık 1km)
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLng = Math.round(lng * 100) / 100;
  return `${roundedLat}_${roundedLng}`;
}

/**
 * Belirli bir koordinat için Street View pano bul
 */
async function findStreetViewPano(
  lat: number,
  lng: number,
  radius: number = 500
): Promise<{ panoId: string; lat: number; lng: number } | null> {
  if (!streetViewService) {
    logger.warn("Street View service not initialized");
    return null;
  }

  sessionApiCallCount++;

  return new Promise((resolve) => {
    streetViewService!.getPanorama(
      {
        location: { lat, lng },
        radius: radius,
        preference: google.maps.StreetViewPreference.NEAREST,
        source: google.maps.StreetViewSource.OUTDOOR
      },
      (data, status) => {
        if (status === google.maps.StreetViewStatus.OK && data?.location) {
          resolve({
            panoId: data.location.pano,
            lat: data.location.latLng?.lat() || lat,
            lng: data.location.latLng?.lng() || lng
          });
        } else {
          resolve(null);
        }
      }
    );
  });
}

/**
 * Bir pano'nun komşularını (dalları) bul
 */
async function findBranchPanos(
  centerPano: { panoId: string; lat: number; lng: number },
  searchRadius: number = 100
): Promise<{ pano1: PanoData; pano2: PanoData; pano3: PanoData } | null> {
  if (!streetViewService) return null;

  // 3 farklı yönde ara (sol, sağ, ileri)
  const directions = [
    { angle: -90, name: "left" },   // Sol
    { angle: 90, name: "right" },   // Sağ
    { angle: 0, name: "forward" }   // İleri
  ];

  const branches: PanoData[] = [];

  for (const dir of directions) {
    // Merkez heading'ine göre yön hesapla
    const targetHeading = (dir.angle + 360) % 360;

    // O yönde bir nokta hesapla
    const offsetDistance = 0.0003; // ~30 metre
    const targetLat = centerPano.lat + offsetDistance * Math.cos(targetHeading * Math.PI / 180);
    const targetLng = centerPano.lng + offsetDistance * Math.sin(targetHeading * Math.PI / 180) / Math.cos(centerPano.lat * Math.PI / 180);

    const foundPano = await findStreetViewPano(targetLat, targetLng, searchRadius);

    if (foundPano && foundPano.panoId !== centerPano.panoId) {
      const heading = calculateHeading(centerPano.lat, centerPano.lng, foundPano.lat, foundPano.lng);
      branches.push({
        panoId: foundPano.panoId,
        lat: foundPano.lat,
        lng: foundPano.lng,
        heading: Math.round(heading)
      });
    } else {
      // Bulunamazsa merkez pano'yu kullan ama farklı heading ile
      branches.push({
        panoId: centerPano.panoId,
        lat: centerPano.lat,
        lng: centerPano.lng,
        heading: targetHeading
      });
    }
  }

  return {
    pano1: branches[0], // Sol
    pano2: branches[1], // Sağ
    pano3: branches[2]  // İleri
  };
}

/**
 * Dinamik olarak yeni bir pano paketi oluştur
 */
export async function generateDynamicPanoPackage(mode: GameMode): Promise<PanoPackage | null> {
  // Session ceiling check — switch to static-only if exceeded
  if (sessionApiCallCount >= MAX_SESSION_API_CALLS) {
    logger.debug(`[DynamicPano] Session API ceiling reached (${sessionApiCallCount}/${MAX_SESSION_API_CALLS}) — static-only mode`);
    return null;
  }

  // Street View servisi yoksa başlat
  if (!streetViewService && typeof google !== 'undefined') {
    initStreetViewService();
  }

  if (!streetViewService) {
    logger.error("Google Maps API not loaded");
    return null;
  }

  // Maliyet kontrolü: her deneme 1 center + 3 branch = 4 getPanorama calls.
  // With maxAttempts=1, worst case is 4 SV calls + 1 geocode = 5 total.
  // (Previously maxAttempts=2 → up to 8 SV calls, too expensive.)
  const maxAttempts = 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Rastgele şehir seç
    const city = selectWeightedCity(mode);

    // Urban modda sadece büyükşehirleri kullan
    if (mode === "urban" && !city.isUrban) {
      continue; // Kırsal şehirleri atla
    }

    // Şehir içinde rastgele koordinat (mod'a göre)
    const randomCoord = getRandomCoordinateNearCity(city, mode);

    // Bu lokasyon daha önce kullanılmış mı?
    const hash = getLocationHash(randomCoord.lat, randomCoord.lng);
    if (usedLocationHashes.has(hash)) {
      continue; // Tekrar dene
    }

    // Street View pano bul
    // Urban modda çok dar arama (100m) - sadece cadde kenarları
    // Geo modda geniş arama (2000m) - doğa, kırsal
    const centerPano = await findStreetViewPano(
      randomCoord.lat,
      randomCoord.lng,
      mode === "urban" ? 100 : 2000
    );

    if (!centerPano) {
      continue; // Pano bulunamadı, tekrar dene
    }

    // Dalları bul
    const branches = await findBranchPanos(centerPano);

    if (!branches) {
      continue;
    }

    // Lokasyonu kullanıldı olarak işaretle
    usedLocationHashes.add(hash);

    // Konum adını al (ilçe, il formatında)
    const locationName = await getLocationNameFromCoords(centerPano.lat, centerPano.lng, city.name);

    // Pano paketi oluştur
    const panoPackage: PanoPackage = {
      id: `dynamic_${mode}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mode: mode,
      region: city.region,
      roadType: mode === "urban" ? "urban_street" : "rural",
      hintTags: mode === "urban" ? ["signage", "shop"] : ["nature", "landscape"],
      qualityScore: 4,
      blacklist: false,
      pano0: {
        panoId: centerPano.panoId,
        lat: centerPano.lat,
        lng: centerPano.lng,
        heading: 0
      },
      pano1: branches.pano1,
      pano2: branches.pano2,
      pano3: branches.pano3,
      locationName: locationName
    };

    logger.debug(`Dinamik pano oluşturuldu: [REDACTED] (${mode})`);
    return panoPackage;
  }

  logger.warn("Dinamik pano oluşturulamadı, maksimum deneme aşıldı");
  return null;
}

/**
 * Oturum için kullanılmış lokasyonları sıfırla
 */
export function resetUsedLocations(): void {
  usedLocationHashes.clear();
  logger.debug("Kullanılmış lokasyonlar sıfırlandı");
}

/**
 * Kaç benzersiz lokasyon kullanıldığını döndür
 */
export function getUsedLocationCount(): number {
  return usedLocationHashes.size;
}

// ==================== FALLBACK: STATİK PANO HAVUZU ====================
// Dinamik üretim başarısız olursa bu havuzdan seç

import { URBAN_PACKAGES, GEO_PACKAGES } from "@/data/panoPackages";

let staticUsedIds: Set<string> = new Set();

// BUG-001 FIX: Track pano IDs used in current session to prevent last-resort repeats
let sessionUsedPanoIds: Set<string> = new Set();

/**
 * BUG-001 FIX: Last resort fallback with round-robin dedup.
 * Instead of always returning PACKAGES[0], picks a random package
 * that hasn't been used this session. If ALL are used, resets and picks random.
 */
function pickLastResortFallback(packages: PanoPackage[]): PanoPackage {
  // Find packages not yet used this session
  const unused = packages.filter(p => !sessionUsedPanoIds.has(p.pano0.panoId));

  let selected: PanoPackage;
  if (unused.length > 0) {
    selected = unused[Math.floor(Math.random() * unused.length)];
  } else {
    // All packages used — reset tracker and pick random
    sessionUsedPanoIds.clear();
    selected = packages[Math.floor(Math.random() * packages.length)];
  }

  sessionUsedPanoIds.add(selected.pano0.panoId);
  return selected;
}

/**
 * Statik havuzdan benzersiz pano seç (fallback)
 * Delegated to LocationEngine for difficulty-aware, anti-repeat selection.
 */
export function getStaticPanoPackage(mode: GameMode, preferredProvince?: string): PanoPackage | null {
  return selectStaticPackage(mode, preferredProvince);
}

/**
 * Statik havuz kullanımını sıfırla
 */
export function resetStaticUsage(): void {
  staticUsedIds.clear();
}

// ==================== ENTEGRE SERVİS ====================

/**
 * Ana pano getirme fonksiyonu — HYBRID D2 MODEL (Dynamic Urban Generator)
 *
 * Urban mod akışı:
 * 1. LocationEngine'den province bag'dan sonraki ili çek
 * 2. Check: should we attempt dynamic generation?
 *    - Heavy player (30+ rounds) → always try dynamic first
 *    - Province has no available static candidates → try dynamic
 * 3. If dynamic: mint via dynamicUrbanGenerator (max 2 SV calls)
 * 4. If dynamic fails OR not needed: use static locationEngine
 * 5. If static also fails: last-resort static fallback (any province)
 *
 * Geo mod: Unchanged (dynamic → static fallback)
 *
 * MULTIPLAYER: Host-only minting. Host generates pano, writes to Firebase.
 * All clients receive the same pano package via room state.
 */
export async function getNextPanoPackage(mode: GameMode, roomId?: string): Promise<PanoPackage> {
  // PHASE 0: Pre-computed pool draw — $0 cost, O(1) amortized
  try {
    const poolManager = getPoolManager();
    poolManager.setRoomId(roomId);
    const poolPackage = await poolManager.drawPackage(mode);
    if (poolPackage) {
      logger.debug(`[PanoService] Phase 0 HIT: pool package [REDACTED] (mode=${mode})`);
      incrementRoundCount();
      return poolPackage;
    }
    logger.debug(`[PanoService] Phase 0 MISS: pool empty or exhausted (mode=${mode}), falling through`);
  } catch (err) {
    logger.warn(`[PanoService] Phase 0 ERROR: pool draw failed (mode=${mode}):`, err);
    // Fall through to existing phases
  }

  if (mode === "urban") {
    // PHASE 1: Get target province from locationEngine's province bag
    const provinceName = getNextProvince();
    const lastProv = getLastProvince();
    logger.debug(`[Urban D2] Target province: [REDACTED], last: [REDACTED]`);

    // PHASE 2: Check if dynamic generation should be attempted
    const tryDynamic = isDynamicGeneratorReady() && shouldAttemptDynamic(provinceName);

    if (tryDynamic) {
      logger.debug(`[Urban D2] Attempting dynamic mint for [REDACTED]`);
      const mintResult = await mintDynamicPackage(provinceName, lastProv, roomId);

      if (mintResult.package) {
        logger.debug(`[Urban D2] Dynamic mint SUCCESS: [REDACTED] (${mintResult.attemptsUsed} attempts)`);
        // Record in locationEngine's anti-repeat state
        recordDynamicSelection(mintResult.package);
        return mintResult.package;
      }

      logger.debug(`[Urban D2] Dynamic mint failed: ${mintResult.failReason} (${mintResult.attemptsUsed} attempts)`);
    }

    // PHASE 3: Static selection via locationEngine (preferred province)
    const staticMatch = getStaticPanoPackage(mode, provinceName);
    if (staticMatch) {
      logger.debug(`[Urban D2] Static match: [REDACTED]`);
      incrementRoundCount();
      return staticMatch;
    }

    // PHASE 4: Static fallback — any province via full engine
    const staticAny = getStaticPanoPackage(mode);
    if (staticAny) {
      logger.debug(`[Urban D2] Static fallback: [REDACTED]`);
      incrementRoundCount();
      return staticAny;
    }

    // PHASE 5: Last resort — pick an unused urban package (avoid repeats)
    const fallback = pickLastResortFallback(URBAN_PACKAGES);
    logger.warn("[Urban D2] Last resort fallback:", fallback.id);
    incrementRoundCount();
    return fallback;
  }

  // GEO MOD: Unchanged flow
  const dynamicPano = await generateDynamicPanoPackage(mode);
  if (dynamicPano) return dynamicPano;

  logger.debug("Dinamik pano üretilemedi, statik havuz kullanılıyor");
  const staticPano = getStaticPanoPackage(mode);
  if (staticPano) return staticPano;

  const fallback = pickLastResortFallback(GEO_PACKAGES);
  logger.warn("Fallback pano kullanılıyor:", fallback.id);
  return fallback;
}

/**
 * Yeni oyun başladığında çağrılacak
 * @param roomId - Multiplayer room ID (for persistent history from Firebase)
 */
export async function onNewGameStart(roomId?: string): Promise<void> {
  resetUsedLocations();
  resetStaticUsage();
  resetProvinceBag();
  resetLocationEngine();
  sessionApiCallCount = 0;
  sessionUsedPanoIds.clear(); // BUG-001 FIX: Reset last-resort dedup

  // Initialize dynamic generator (if Google Maps loaded)
  initDynamicGenerator();

  // Initialize persistent anti-repeat history
  await initPersistentHistory(roomId);

  // Initialize pre-computed pool (Phase 0)
  const poolManager = getPoolManager();
  poolManager.setRoomId(roomId);
  poolManager.reset();
  // Fire-and-forget prewarm — loads first chunk blocking, rest in background
  poolManager.ensurePoolLoaded("urban").catch((err) => {
    logger.warn("[PanoService] Pool prewarm failed for urban:", err);
  });
  poolManager.ensurePoolLoaded("geo").catch((err) => {
    logger.warn("[PanoService] Pool prewarm failed for geo:", err);
  });

  // Generate enrichment report on first game (lazy)
  getEnrichmentReport();
  logger.debug("Yeni oyun: Tüm pano kullanımları, province bag, persistent history, pool sıfırlandı");
}
