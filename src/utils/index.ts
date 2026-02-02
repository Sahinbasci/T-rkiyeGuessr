import { Coordinates, TURKEY_BOUNDS, SCORING } from "@/types";

// Re-export production utilities
export * from "./rateLimiter";
export * from "./apiCostMonitor";
export * from "./errorHandler";

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

export function isLikelyInTurkey(coord: Coordinates): boolean {
  const { lat, lng } = coord;
  if (lat < 36 || lat > 42 || lng < 26 || lng > 45) return false;
  if (lat > 41.5 && lng < 32) return false;
  if (lat > 41.8 && lng > 32 && lng < 37) return false;
  if (lng < 27 && lat < 40) return false;
  if (lat < 36.2 && lng < 32) return false;
  if (lat < 36.5 && lng > 35) return false;
  if (lng > 43.5 && lat > 41) return false;
  if (lat < 36.5 && lng > 36 && lng < 42) return false;
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
  return Math.random().toString(36).substring(2, 15);
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
    console.error("Geocoding error:", error);
    return "Türkiye";
  }
}
