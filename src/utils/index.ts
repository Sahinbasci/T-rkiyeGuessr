import { Coordinates, TURKEY_BOUNDS, SCORING } from "@/types";
import { logger } from "@/utils/logger";

// Re-export production utilities
export * from "./telemetry";
export * from "./rateLimiter";

// Haversine Formula
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371;
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) *
      Math.cos(toRadians(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function formatDistance(distanceKm: number): string {
  // Tahmin yapılmadıysa
  if (distanceKm >= 9999) return "Tahmin yok";
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  if (distanceKm < 10) return `${distanceKm.toFixed(1)} km`;
  return `${Math.round(distanceKm)} km`;
}

export function calculateScore(distanceKm: number): number {
  const { maxScore, maxDistance } = SCORING;
  if (distanceKm <= 0.1) return maxScore;
  if (distanceKm >= maxDistance) return 0;
  const k = 3;
  return Math.round(maxScore * Math.exp(-k * (distanceKm / maxDistance)));
}

export function generateRandomCoordinates(): Coordinates {
  const { north, south, east, west } = TURKEY_BOUNDS;
  return {
    lat: south + Math.random() * (north - south),
    lng: west + Math.random() * (east - west),
  };
}

/**
 * 2-aşamalı Türkiye sınır doğrulaması.
 * Aşama 1: Dikdörtgen bounding box (hızlı eleme)
 * Aşama 2: Deniz/komşu ülke exclusion kuralları (authoritative)
 *
 * Kullanım: Client-side pin validation + server-side guess validation
 */
export function isLikelyInTurkey(coord: Coordinates): boolean {
  const { lat, lng } = coord;

  // Aşama 1: Geniş bounding box (Trakya + Hatay dahil)
  if (lat < 35.8 || lat > 42.2 || lng < 25.5 || lng > 44.8) return false;

  // Aşama 2: Sadece kesinlikle Türkiye OLMAYAN alanları çıkar.
  // DİKKAT: Trakya (Edirne 41.67/26.56, Kırklareli 41.73/27.23, Tekirdağ 41.0/27.5),
  // Hatay (Antakya 36.2/36.17), güney kıyı (Kaş 36.2/29.6, Datça 36.7/27.7)
  // kesinlikle korunmalı.

  // Yunanistan: Meriç nehrinin batısı (sadece kesin Yunan toprakları)
  if (lng < 26 && lat < 41) return false;

  // Suriye: Hatay yarımadasının doğusu (Hatay lng ~35.8-36.5 arası)
  if (lat < 36.3 && lng > 36.5) return false;

  // Irak: güneydoğu köşe
  if (lat < 37.0 && lng > 44) return false;

  // Gürcistan/Ermenistan: kuzeydoğu köşe
  if (lat > 41.5 && lng > 43.5) return false;

  return true;
}

export function getTurkeyCenter(): Coordinates {
  return { lat: 39.0, lng: 35.0 };
}

export function getTurkeyZoom(): number {
  return 6;
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generatePlayerId(): string {
  // crypto.randomUUID() daha güvenli - tahmin edilemez ID üretir
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").substring(0, 15);
  }
  // Fallback: eski yöntem
  return Math.random().toString(36).substring(2, 15);
}

// ==================== SESSION TOKEN (REJOIN) ====================
// Oyuncu disconnect olup geri geldiğinde aynı state'i korumak için

export function generateSessionToken(): string {
  const timestamp = Date.now().toString(36);
  const random = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "")
    : Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${random}`;
}

export function saveSessionToken(roomId: string, token: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(`turkiye_guessr_session_${roomId}`, token);
    } catch (e) {
      logger.warn("localStorage sessionToken save failed:", e);
    }
  }
}

export function getSessionToken(roomId: string): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return localStorage.getItem(`turkiye_guessr_session_${roomId}`);
    } catch (e) {
      logger.warn("localStorage sessionToken get failed:", e);
      return null;
    }
  }
  return null;
}

export function clearSessionToken(roomId: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem(`turkiye_guessr_session_${roomId}`);
    } catch (e) {
      logger.warn("localStorage sessionToken clear failed:", e);
    }
  }
}

/**
 * BUG-011 FIX: Stale session token cleanup.
 * Keeps the most recent MAX_SESSIONS session tokens, removes the rest.
 * Called on app init to prevent unbounded localStorage growth.
 */
const MAX_SESSIONS = 5;
const SESSION_PREFIX = "turkiye_guessr_session_";

export function cleanupStaleSessions(): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const sessionKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(SESSION_PREFIX)) {
        sessionKeys.push(key);
      }
    }
    // Keep only the most recent MAX_SESSIONS (sorted by key which includes timestamp)
    if (sessionKeys.length > MAX_SESSIONS) {
      sessionKeys.sort();
      const toRemove = sessionKeys.slice(0, sessionKeys.length - MAX_SESSIONS);
      toRemove.forEach((key) => localStorage.removeItem(key));
    }
  } catch {
    // Silent fail — cleanup is best-effort
  }
}

// Koordinatlardan il/ilçe bilgisi al (Reverse Geocoding)
export async function getLocationName(coord: Coordinates): Promise<string> {
  if (typeof google === "undefined" || !google.maps) {
    return "Türkiye";
  }

  try {
    const geocoder = new google.maps.Geocoder();
    const result = await new Promise<google.maps.GeocoderResult[] | null>((resolve) => {
      geocoder.geocode(
        { location: { lat: coord.lat, lng: coord.lng } },
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
      return "Türkiye";
    }

    let ilce = "";
    let il = "";

    // Sonuçları tara ve il/ilçe bul
    for (const r of result) {
      for (const component of r.address_components) {
        // İlçe (administrative_area_level_2 veya locality)
        if (
          component.types.includes("administrative_area_level_2") ||
          component.types.includes("locality")
        ) {
          if (!ilce) ilce = component.long_name;
        }
        // İl (administrative_area_level_1)
        if (component.types.includes("administrative_area_level_1")) {
          if (!il) il = component.long_name;
        }
      }
      // İkisini de bulduysan çık
      if (il && ilce) break;
    }

    // Sonucu formatla
    if (ilce && il) {
      // İlçe ve il aynıysa (merkez ilçe) sadece il göster
      if (ilce === il || ilce.includes("Merkez")) {
        return il;
      }
      return `${ilce}, ${il}`;
    } else if (il) {
      return il;
    } else if (ilce) {
      return ilce;
    }

    return "Türkiye";
  } catch (error) {
    logger.error("Geocoding error:", error);
    return "Türkiye";
  }
}
