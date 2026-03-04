/**
 * provinceCentroids.ts — Centroid coordinates for all 81 Turkish provinces.
 *
 * Used by the "İl Seç" dropdown on the guess map to help users navigate
 * to a province quickly. Centroids are approximate geographic centers.
 *
 * GAP #4 FIX: Provides data for the province selector UX helper.
 */

export interface ProvinceCentroid {
  name: string;
  lat: number;
  lng: number;
}

export const PROVINCE_CENTROIDS: ProvinceCentroid[] = [
  { name: "Adana", lat: 37.00, lng: 35.32 },
  { name: "Adıyaman", lat: 37.76, lng: 38.27 },
  { name: "Afyonkarahisar", lat: 38.73, lng: 30.53 },
  { name: "Ağrı", lat: 39.72, lng: 43.05 },
  { name: "Aksaray", lat: 38.37, lng: 34.03 },
  { name: "Amasya", lat: 40.65, lng: 35.83 },
  { name: "Ankara", lat: 39.93, lng: 32.86 },
  { name: "Antalya", lat: 36.88, lng: 30.70 },
  { name: "Ardahan", lat: 41.11, lng: 42.70 },
  { name: "Artvin", lat: 41.18, lng: 41.82 },
  { name: "Aydın", lat: 37.85, lng: 27.85 },
  { name: "Balıkesir", lat: 39.65, lng: 27.89 },
  { name: "Bartın", lat: 41.64, lng: 32.34 },
  { name: "Batman", lat: 37.88, lng: 41.13 },
  { name: "Bayburt", lat: 40.26, lng: 40.23 },
  { name: "Bilecik", lat: 40.05, lng: 30.00 },
  { name: "Bingöl", lat: 38.88, lng: 40.50 },
  { name: "Bitlis", lat: 38.40, lng: 42.11 },
  { name: "Bolu", lat: 40.73, lng: 31.61 },
  { name: "Burdur", lat: 37.72, lng: 30.29 },
  { name: "Bursa", lat: 40.18, lng: 29.06 },
  { name: "Çanakkale", lat: 40.15, lng: 26.41 },
  { name: "Çankırı", lat: 40.60, lng: 33.62 },
  { name: "Çorum", lat: 40.55, lng: 34.96 },
  { name: "Denizli", lat: 37.77, lng: 29.09 },
  { name: "Diyarbakır", lat: 37.91, lng: 40.22 },
  { name: "Düzce", lat: 40.84, lng: 31.16 },
  { name: "Edirne", lat: 41.68, lng: 26.56 },
  { name: "Elazığ", lat: 38.67, lng: 39.22 },
  { name: "Erzincan", lat: 39.75, lng: 39.49 },
  { name: "Erzurum", lat: 39.91, lng: 41.28 },
  { name: "Eskişehir", lat: 39.77, lng: 30.52 },
  { name: "Gaziantep", lat: 37.07, lng: 37.38 },
  { name: "Giresun", lat: 40.91, lng: 38.39 },
  { name: "Gümüşhane", lat: 40.46, lng: 39.48 },
  { name: "Hakkari", lat: 37.58, lng: 43.74 },
  { name: "Hatay", lat: 36.40, lng: 36.35 },
  { name: "Iğdır", lat: 39.92, lng: 44.05 },
  { name: "Isparta", lat: 37.76, lng: 30.55 },
  { name: "İstanbul", lat: 41.01, lng: 28.98 },
  { name: "İzmir", lat: 38.42, lng: 27.14 },
  { name: "Kahramanmaraş", lat: 37.58, lng: 36.94 },
  { name: "Karabük", lat: 41.20, lng: 32.63 },
  { name: "Karaman", lat: 37.18, lng: 33.23 },
  { name: "Kars", lat: 40.60, lng: 43.09 },
  { name: "Kastamonu", lat: 41.39, lng: 33.78 },
  { name: "Kayseri", lat: 38.73, lng: 35.48 },
  { name: "Kilis", lat: 36.72, lng: 37.12 },
  { name: "Kırıkkale", lat: 39.85, lng: 33.51 },
  { name: "Kırklareli", lat: 41.73, lng: 27.23 },
  { name: "Kırşehir", lat: 39.15, lng: 34.17 },
  { name: "Kocaeli", lat: 40.77, lng: 29.92 },
  { name: "Konya", lat: 37.87, lng: 32.48 },
  { name: "Kütahya", lat: 39.42, lng: 29.97 },
  { name: "Malatya", lat: 38.35, lng: 38.31 },
  { name: "Manisa", lat: 38.61, lng: 27.43 },
  { name: "Mardin", lat: 37.31, lng: 40.73 },
  { name: "Mersin", lat: 36.80, lng: 34.63 },
  { name: "Muğla", lat: 37.22, lng: 28.36 },
  { name: "Muş", lat: 38.74, lng: 41.51 },
  { name: "Nevşehir", lat: 38.63, lng: 34.71 },
  { name: "Niğde", lat: 37.97, lng: 34.68 },
  { name: "Ordu", lat: 40.98, lng: 37.88 },
  { name: "Osmaniye", lat: 37.07, lng: 36.25 },
  { name: "Rize", lat: 41.02, lng: 40.52 },
  { name: "Sakarya", lat: 40.69, lng: 30.40 },
  { name: "Samsun", lat: 41.29, lng: 36.33 },
  { name: "Şanlıurfa", lat: 37.17, lng: 38.79 },
  { name: "Siirt", lat: 37.93, lng: 41.94 },
  { name: "Sinop", lat: 42.03, lng: 35.15 },
  { name: "Şırnak", lat: 37.41, lng: 42.46 },
  { name: "Sivas", lat: 39.75, lng: 37.02 },
  { name: "Tekirdağ", lat: 41.00, lng: 27.51 },
  { name: "Tokat", lat: 40.31, lng: 36.55 },
  { name: "Trabzon", lat: 41.00, lng: 39.72 },
  { name: "Tunceli", lat: 39.11, lng: 39.55 },
  { name: "Uşak", lat: 38.67, lng: 29.41 },
  { name: "Van", lat: 38.49, lng: 43.38 },
  { name: "Yalova", lat: 40.65, lng: 29.28 },
  { name: "Yozgat", lat: 39.77, lng: 34.80 },
  { name: "Zonguldak", lat: 41.46, lng: 31.80 },
];

/**
 * Get centroid for a province by name (Turkish locale-safe comparison).
 */
export function getProvinceCentroid(name: string): ProvinceCentroid | undefined {
  return PROVINCE_CENTROIDS.find(
    p => p.name.toLocaleLowerCase("tr-TR") === name.toLocaleLowerCase("tr-TR")
  );
}
