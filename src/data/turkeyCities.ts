/**
 * 81 il verisi — merkez koordinatları, yarıçapları ve bölge bilgileri.
 * Birden fazla servis tarafından kullanılır (locationEngine, dynamicPanoService, dynamicUrbanGenerator).
 * Circular dependency'yi önlemek için ayrı data dosyasında tutulur.
 */

export interface CityData {
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
