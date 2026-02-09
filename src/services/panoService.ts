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
  resetProvinceBag,
} from "./dynamicPanoService";
import { getRandomPanoPackageFromData } from "@/data/panoPackages";

export { initStreetViewService, onNewGameStart, getUsedLocationCount, resetUsedLocations, resetProvinceBag };

/**
 * Belirli bir mod için benzersiz pano paketi getir
 * Her çağrıda farklı bir lokasyon döndürür (aynı oturum içinde tekrar etmez)
 */
export async function getRandomPanoPackage(mode: GameMode): Promise<PanoPackage | null> {
  try {
    const pano = await getNextPanoPackage(mode);
    return pano;
  } catch (error) {
    console.error("Pano paketi alınamadı:", error);
    return getRandomPanoPackageFromData(mode);
  }
}
