/**
 * Dinamik Pano Üretim Servisi
 *
 * Binlerce benzersiz lokasyon için:
 * 1. Türkiye genelinde rastgele koordinatlar üretir
 * 2. Google Street View API ile gerçek pano ID'leri bulur
 * 3. Her oyunda tekrar etmeyen benzersiz lokasyonlar sağlar
 */

import { PanoPackage, GameMode, PanoData } from "@/types";
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

// 81 İL VERİSİ - Merkez koordinatları ve yarıçapları
interface CityData {
  name: string;
  lat: number;
  lng: number;
  radius: number; // km cinsinden
  population: number; // Yaklaşık nüfus (ağırlık için)
  region: "marmara" | "ege" | "akdeniz" | "karadeniz" | "ic_anadolu" | "dogu_anadolu" | "guneydogu";
  isUrban: boolean; // Büyükşehir mi?
}

export const TURKEY_CITIES: CityData[] = [
  // MARMARA BÖLGESİ
  { name: "İstanbul", lat: 41.0082, lng: 28.9784, radius: 30, population: 15500000, region: "marmara", isUrban: true },
  { name: "Bursa", lat: 40.1826, lng: 29.0665, radius: 15, population: 3100000, region: "marmara", isUrban: true },
  { name: "Kocaeli", lat: 40.8533, lng: 29.8815, radius: 12, population: 2000000, region: "marmara", isUrban: true },
  { name: "Tekirdağ", lat: 40.9780, lng: 27.5110, radius: 10, population: 1100000, region: "marmara", isUrban: true },
  { name: "Sakarya", lat: 40.7569, lng: 30.3950, radius: 10, population: 1000000, region: "marmara", isUrban: true },
  { name: "Balıkesir", lat: 39.6484, lng: 27.8826, radius: 12, population: 1200000, region: "marmara", isUrban: true },
  { name: "Çanakkale", lat: 40.1553, lng: 26.4142, radius: 10, population: 550000, region: "marmara", isUrban: false },
  { name: "Edirne", lat: 41.6772, lng: 26.5557, radius: 8, population: 400000, region: "marmara", isUrban: false },
  { name: "Kırklareli", lat: 41.7333, lng: 27.2167, radius: 8, population: 360000, region: "marmara", isUrban: false },
  { name: "Yalova", lat: 40.6500, lng: 29.2667, radius: 5, population: 275000, region: "marmara", isUrban: false },
  { name: "Bilecik", lat: 40.0567, lng: 30.0667, radius: 5, population: 220000, region: "marmara", isUrban: false },

  // EGE BÖLGESİ
  { name: "İzmir", lat: 38.4192, lng: 27.1287, radius: 20, population: 4400000, region: "ege", isUrban: true },
  { name: "Manisa", lat: 38.6191, lng: 27.4289, radius: 12, population: 1450000, region: "ege", isUrban: true },
  { name: "Aydın", lat: 37.8560, lng: 27.8416, radius: 12, population: 1100000, region: "ege", isUrban: true },
  { name: "Denizli", lat: 37.7765, lng: 29.0864, radius: 12, population: 1050000, region: "ege", isUrban: true },
  { name: "Muğla", lat: 37.2153, lng: 28.3636, radius: 15, population: 1000000, region: "ege", isUrban: true },
  { name: "Afyonkarahisar", lat: 38.7507, lng: 30.5567, radius: 10, population: 750000, region: "ege", isUrban: false },
  { name: "Kütahya", lat: 39.4167, lng: 29.9833, radius: 10, population: 580000, region: "ege", isUrban: false },
  { name: "Uşak", lat: 38.6823, lng: 29.4082, radius: 8, population: 370000, region: "ege", isUrban: false },

  // AKDENİZ BÖLGESİ
  { name: "Antalya", lat: 36.8841, lng: 30.7056, radius: 20, population: 2550000, region: "akdeniz", isUrban: true },
  { name: "Adana", lat: 36.9914, lng: 35.3308, radius: 15, population: 2250000, region: "akdeniz", isUrban: true },
  { name: "Mersin", lat: 36.8000, lng: 34.6333, radius: 15, population: 1850000, region: "akdeniz", isUrban: true },
  { name: "Hatay", lat: 36.2025, lng: 36.1606, radius: 12, population: 1650000, region: "akdeniz", isUrban: true },
  { name: "Kahramanmaraş", lat: 37.5858, lng: 36.9371, radius: 10, population: 1150000, region: "akdeniz", isUrban: true },
  { name: "Osmaniye", lat: 37.0742, lng: 36.2478, radius: 8, population: 540000, region: "akdeniz", isUrban: false },
  { name: "Isparta", lat: 37.7648, lng: 30.5566, radius: 8, population: 440000, region: "akdeniz", isUrban: false },
  { name: "Burdur", lat: 37.7203, lng: 30.2900, radius: 8, population: 270000, region: "akdeniz", isUrban: false },

  // KARADENİZ BÖLGESİ
  { name: "Samsun", lat: 41.2867, lng: 36.3300, radius: 12, population: 1350000, region: "karadeniz", isUrban: true },
  { name: "Trabzon", lat: 41.0015, lng: 39.7178, radius: 10, population: 810000, region: "karadeniz", isUrban: true },
  { name: "Ordu", lat: 40.9839, lng: 37.8764, radius: 10, population: 770000, region: "karadeniz", isUrban: true },
  { name: "Zonguldak", lat: 41.4564, lng: 31.7987, radius: 8, population: 600000, region: "karadeniz", isUrban: false },
  { name: "Tokat", lat: 40.3167, lng: 36.5500, radius: 10, population: 610000, region: "karadeniz", isUrban: false },
  { name: "Giresun", lat: 40.9128, lng: 38.3895, radius: 8, population: 450000, region: "karadeniz", isUrban: false },
  { name: "Amasya", lat: 40.6499, lng: 35.8353, radius: 8, population: 340000, region: "karadeniz", isUrban: false },
  { name: "Çorum", lat: 40.5506, lng: 34.9556, radius: 10, population: 530000, region: "karadeniz", isUrban: false },
  { name: "Kastamonu", lat: 41.3887, lng: 33.7827, radius: 10, population: 380000, region: "karadeniz", isUrban: false },
  { name: "Sinop", lat: 42.0231, lng: 35.1531, radius: 8, population: 220000, region: "karadeniz", isUrban: false },
  { name: "Rize", lat: 41.0201, lng: 40.5234, radius: 8, population: 350000, region: "karadeniz", isUrban: false },
  { name: "Artvin", lat: 41.1828, lng: 41.8183, radius: 8, population: 170000, region: "karadeniz", isUrban: false },
  { name: "Bartın", lat: 41.6344, lng: 32.3375, radius: 6, population: 200000, region: "karadeniz", isUrban: false },
  { name: "Karabük", lat: 41.2061, lng: 32.6204, radius: 6, population: 250000, region: "karadeniz", isUrban: false },
  { name: "Düzce", lat: 40.8438, lng: 31.1565, radius: 6, population: 400000, region: "karadeniz", isUrban: false },
  { name: "Bolu", lat: 40.7333, lng: 31.6000, radius: 8, population: 320000, region: "karadeniz", isUrban: false },
  { name: "Gümüşhane", lat: 40.4386, lng: 39.5086, radius: 6, population: 150000, region: "karadeniz", isUrban: false },
  { name: "Bayburt", lat: 40.2552, lng: 40.2249, radius: 5, population: 85000, region: "karadeniz", isUrban: false },

  // İÇ ANADOLU BÖLGESİ
  { name: "Ankara", lat: 39.9334, lng: 32.8597, radius: 25, population: 5750000, region: "ic_anadolu", isUrban: true },
  { name: "Konya", lat: 37.8713, lng: 32.4846, radius: 15, population: 2280000, region: "ic_anadolu", isUrban: true },
  { name: "Kayseri", lat: 38.7312, lng: 35.4787, radius: 12, population: 1420000, region: "ic_anadolu", isUrban: true },
  { name: "Eskişehir", lat: 39.7767, lng: 30.5206, radius: 12, population: 890000, region: "ic_anadolu", isUrban: true },
  { name: "Sivas", lat: 39.7477, lng: 37.0179, radius: 10, population: 640000, region: "ic_anadolu", isUrban: false },
  { name: "Yozgat", lat: 39.8181, lng: 34.8147, radius: 8, population: 420000, region: "ic_anadolu", isUrban: false },
  { name: "Aksaray", lat: 38.3687, lng: 34.0370, radius: 8, population: 420000, region: "ic_anadolu", isUrban: false },
  { name: "Nevşehir", lat: 38.6244, lng: 34.7239, radius: 8, population: 310000, region: "ic_anadolu", isUrban: false },
  { name: "Niğde", lat: 37.9667, lng: 34.6833, radius: 8, population: 360000, region: "ic_anadolu", isUrban: false },
  { name: "Kırşehir", lat: 39.1425, lng: 34.1709, radius: 6, population: 240000, region: "ic_anadolu", isUrban: false },
  { name: "Kırıkkale", lat: 39.8468, lng: 33.5153, radius: 6, population: 290000, region: "ic_anadolu", isUrban: false },
  { name: "Karaman", lat: 37.1759, lng: 33.2287, radius: 8, population: 250000, region: "ic_anadolu", isUrban: false },
  { name: "Çankırı", lat: 40.6013, lng: 33.6134, radius: 6, population: 195000, region: "ic_anadolu", isUrban: false },

  // DOĞU ANADOLU BÖLGESİ
  { name: "Erzurum", lat: 39.9000, lng: 41.2700, radius: 12, population: 760000, region: "dogu_anadolu", isUrban: true },
  { name: "Malatya", lat: 38.3552, lng: 38.3095, radius: 12, population: 810000, region: "dogu_anadolu", isUrban: true },
  { name: "Elazığ", lat: 38.6810, lng: 39.2264, radius: 10, population: 590000, region: "dogu_anadolu", isUrban: false },
  { name: "Van", lat: 38.4942, lng: 43.3800, radius: 12, population: 1130000, region: "dogu_anadolu", isUrban: true },
  { name: "Ağrı", lat: 39.7191, lng: 43.0503, radius: 10, population: 540000, region: "dogu_anadolu", isUrban: false },
  { name: "Erzincan", lat: 39.7500, lng: 39.5000, radius: 8, population: 235000, region: "dogu_anadolu", isUrban: false },
  { name: "Muş", lat: 38.9462, lng: 41.7539, radius: 8, population: 410000, region: "dogu_anadolu", isUrban: false },
  { name: "Bitlis", lat: 38.4000, lng: 42.1167, radius: 8, population: 350000, region: "dogu_anadolu", isUrban: false },
  { name: "Bingöl", lat: 38.8854, lng: 40.4980, radius: 8, population: 280000, region: "dogu_anadolu", isUrban: false },
  { name: "Kars", lat: 40.6167, lng: 43.1000, radius: 10, population: 290000, region: "dogu_anadolu", isUrban: false },
  { name: "Iğdır", lat: 39.9167, lng: 44.0333, radius: 6, population: 200000, region: "dogu_anadolu", isUrban: false },
  { name: "Ardahan", lat: 41.1105, lng: 42.7022, radius: 6, population: 100000, region: "dogu_anadolu", isUrban: false },
  { name: "Hakkari", lat: 37.5833, lng: 43.7333, radius: 6, population: 280000, region: "dogu_anadolu", isUrban: false },
  { name: "Tunceli", lat: 39.1079, lng: 39.5401, radius: 6, population: 90000, region: "dogu_anadolu", isUrban: false },

  // GÜNEYDOĞU ANADOLU BÖLGESİ
  { name: "Gaziantep", lat: 37.0662, lng: 37.3833, radius: 15, population: 2130000, region: "guneydogu", isUrban: true },
  { name: "Şanlıurfa", lat: 37.1591, lng: 38.7969, radius: 15, population: 2115000, region: "guneydogu", isUrban: true },
  { name: "Diyarbakır", lat: 37.9100, lng: 40.2300, radius: 12, population: 1790000, region: "guneydogu", isUrban: true },
  { name: "Mardin", lat: 37.3212, lng: 40.7245, radius: 10, population: 850000, region: "guneydogu", isUrban: true },
  { name: "Batman", lat: 37.8812, lng: 41.1351, radius: 8, population: 620000, region: "guneydogu", isUrban: false },
  { name: "Adıyaman", lat: 37.7648, lng: 38.2786, radius: 10, population: 630000, region: "guneydogu", isUrban: false },
  { name: "Şırnak", lat: 37.4187, lng: 42.4918, radius: 8, population: 540000, region: "guneydogu", isUrban: false },
  { name: "Siirt", lat: 37.9333, lng: 41.9500, radius: 6, population: 330000, region: "guneydogu", isUrban: false },
  { name: "Kilis", lat: 36.7184, lng: 37.1212, radius: 5, population: 145000, region: "guneydogu", isUrban: false },
];

// ==================== YARDIMCI FONKSİYONLAR ====================

/**
 * İki nokta arasındaki mesafeyi km cinsinden hesapla (Haversine)
 */
function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Dünya yarıçapı (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

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
  console.log(`[ProvinceBag] Bag refilled with ${provinceBag.length} provinces (mode=${mode})`);
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
    console.error("Geocoding error:", error);
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
    console.warn("Street View service not initialized");
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
    console.log(`[DynamicPano] Session API ceiling reached (${sessionApiCallCount}/${MAX_SESSION_API_CALLS}) — static-only mode`);
    return null;
  }

  // Street View servisi yoksa başlat
  if (!streetViewService && typeof google !== 'undefined') {
    initStreetViewService();
  }

  if (!streetViewService) {
    console.error("Google Maps API not loaded");
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

    console.log(`Dinamik pano oluşturuldu: ${locationName} (${mode})`);
    return panoPackage;
  }

  console.warn("Dinamik pano oluşturulamadı, maksimum deneme aşıldı");
  return null;
}

/**
 * Oturum için kullanılmış lokasyonları sıfırla
 */
export function resetUsedLocations(): void {
  usedLocationHashes.clear();
  console.log("Kullanılmış lokasyonlar sıfırlandı");
}

/**
 * Kaç benzersiz lokasyon kullanıldığını döndür
 */
export function getUsedLocationCount(): number {
  return usedLocationHashes.size;
}

export function getSessionApiCallCount(): number {
  return sessionApiCallCount;
}

// ==================== FALLBACK: STATİK PANO HAVUZU ====================
// Dinamik üretim başarısız olursa bu havuzdan seç

import { URBAN_PACKAGES, GEO_PACKAGES } from "@/data/panoPackages";

let staticUsedIds: Set<string> = new Set();

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
  if (mode === "urban") {
    // PHASE 1: Get target province from locationEngine's province bag
    const provinceName = getNextProvince();
    const lastProv = getLastProvince();
    console.log(`[Urban D2] Target province: ${provinceName}, last: ${lastProv}`);

    // PHASE 2: Check if dynamic generation should be attempted
    const tryDynamic = isDynamicGeneratorReady() && shouldAttemptDynamic(provinceName);

    if (tryDynamic) {
      console.log(`[Urban D2] Attempting dynamic mint for ${provinceName}`);
      const mintResult = await mintDynamicPackage(provinceName, lastProv, roomId);

      if (mintResult.package) {
        console.log(`[Urban D2] Dynamic mint SUCCESS: ${mintResult.package.locationName} (${mintResult.attemptsUsed} attempts)`);
        // Record in locationEngine's anti-repeat state
        recordDynamicSelection(mintResult.package);
        return mintResult.package;
      }

      console.log(`[Urban D2] Dynamic mint failed: ${mintResult.failReason} (${mintResult.attemptsUsed} attempts)`);
    }

    // PHASE 3: Static selection via locationEngine (preferred province)
    const staticMatch = getStaticPanoPackage(mode, provinceName);
    if (staticMatch) {
      console.log(`[Urban D2] Static match: ${staticMatch.locationName}`);
      incrementRoundCount();
      return staticMatch;
    }

    // PHASE 4: Static fallback — any province via full engine
    const staticAny = getStaticPanoPackage(mode);
    if (staticAny) {
      console.log(`[Urban D2] Static fallback: ${staticAny.locationName}`);
      incrementRoundCount();
      return staticAny;
    }

    // PHASE 5: Last resort — first urban package
    const fallback = URBAN_PACKAGES[0];
    console.warn("[Urban D2] Last resort fallback:", fallback.id);
    incrementRoundCount();
    return fallback;
  }

  // GEO MOD: Unchanged flow
  const dynamicPano = await generateDynamicPanoPackage(mode);
  if (dynamicPano) return dynamicPano;

  console.log("Dinamik pano üretilemedi, statik havuz kullanılıyor");
  const staticPano = getStaticPanoPackage(mode);
  if (staticPano) return staticPano;

  const fallback = GEO_PACKAGES[0];
  console.warn("Fallback pano kullanılıyor:", fallback.id);
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

  // Initialize dynamic generator (if Google Maps loaded)
  initDynamicGenerator();

  // Initialize persistent anti-repeat history
  await initPersistentHistory(roomId);

  // Generate enrichment report on first game (lazy)
  getEnrichmentReport();
  console.log("Yeni oyun: Tüm pano kullanımları, province bag, persistent history sıfırlandı");
}
