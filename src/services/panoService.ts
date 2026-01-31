/**
 * Pano Servisi
 * Dinamik pano üretimi + statik havuz entegrasyonu
 *
 * Binlerce benzersiz lokasyon için:
 * 1. Dinamik: Google Street View API ile gerçek zamanlı pano bulma
 * 2. Statik: Önceden hazırlanmış 150+ pano paketi
 */

import { PanoPackage, GameMode } from "@/types";
import {
  getNextPanoPackage,
  onNewGameStart,
  initStreetViewService,
  getUsedLocationCount,
  resetUsedLocations,
} from "./dynamicPanoService";
import { URBAN_PACKAGES, GEO_PACKAGES, getRandomPanoPackageFromData } from "@/data/panoPackages";

// Re-export dinamik servis fonksiyonları
export { initStreetViewService, onNewGameStart, getUsedLocationCount, resetUsedLocations };

/**
 * Belirli bir mod için benzersiz pano paketi getir
 * Her çağrıda farklı bir lokasyon döndürür (aynı oturum içinde tekrar etmez)
 */
export async function getRandomPanoPackage(mode: GameMode): Promise<PanoPackage | null> {
  try {
    // Dinamik + statik hibrit sistem
    const pano = await getNextPanoPackage(mode);
    return pano;
  } catch (error) {
    console.error("Pano paketi alınamadı:", error);

    // En son çare: statik havuzdan rastgele seç
    return getRandomPanoPackageFromData(mode);
  }
}

/**
 * ID ile pano paketi getir
 */
export async function getPanoPackageById(id: string): Promise<PanoPackage | null> {
  try {
    // Önce statik havuzda ara
    const allPackages = [...URBAN_PACKAGES, ...GEO_PACKAGES];
    const found = allPackages.find(p => p.id === id);
    if (found) return found;

    // Dinamik pano'lar ID ile bulunamaz (geçici)
    console.warn("Pano paketi bulunamadı:", id);
    return null;
  } catch (error) {
    console.error("Pano paketi bulunamadı:", error);
    return null;
  }
}

/**
 * Toplam mevcut pano sayısını döndür
 */
export function getTotalPanoCount(): { urban: number; geo: number; total: number } {
  return {
    urban: URBAN_PACKAGES.length,
    geo: GEO_PACKAGES.length,
    total: URBAN_PACKAGES.length + GEO_PACKAGES.length
  };
}

/**
 * Dinamik pano üretim bilgisi
 */
export function getDynamicPanoInfo(): string {
  const count = getUsedLocationCount();
  const total = getTotalPanoCount().total;
  return `Kullanılmış: ${count} | Statik Havuz: ${total} | Potansiyel: 81 il × sınırsız nokta`;
}
