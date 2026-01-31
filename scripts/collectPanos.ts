/**
 * Pano Toplama Script'i
 * Türkiye'den rastgele Street View panoları toplar ve paket haline getirir
 *
 * Kullanım: npx ts-node scripts/collectPanos.ts
 */

// Bu script tarayıcıda çalışacak şekilde tasarlandı
// Node.js'de çalıştırmak için puppeteer kullanılabilir

const TURKEY_CITIES = [
  // Urban lokasyonlar - şehir merkezleri
  { name: "İstanbul Fatih", lat: 41.0082, lng: 28.9784, mode: "urban" },
  { name: "İstanbul Kadıköy", lat: 40.9927, lng: 29.0277, mode: "urban" },
  { name: "İstanbul Beşiktaş", lat: 41.0422, lng: 29.0067, mode: "urban" },
  { name: "Ankara Kızılay", lat: 39.9208, lng: 32.8541, mode: "urban" },
  { name: "Ankara Ulus", lat: 39.9414, lng: 32.8543, mode: "urban" },
  { name: "İzmir Alsancak", lat: 38.4350, lng: 27.1428, mode: "urban" },
  { name: "İzmir Konak", lat: 38.4189, lng: 27.1287, mode: "urban" },
  { name: "Bursa Osmangazi", lat: 40.1826, lng: 29.0665, mode: "urban" },
  { name: "Antalya Muratpaşa", lat: 36.8841, lng: 30.7056, mode: "urban" },
  { name: "Adana Seyhan", lat: 36.9914, lng: 35.3308, mode: "urban" },
  { name: "Konya Selçuklu", lat: 37.8713, lng: 32.4846, mode: "urban" },
  { name: "Gaziantep Şahinbey", lat: 37.0662, lng: 37.3833, mode: "urban" },
  { name: "Mersin Yenişehir", lat: 36.8000, lng: 34.6333, mode: "urban" },
  { name: "Kayseri Melikgazi", lat: 38.7312, lng: 35.4787, mode: "urban" },
  { name: "Eskişehir Tepebaşı", lat: 39.7767, lng: 30.5206, mode: "urban" },

  // Geo lokasyonlar - doğa/kırsal
  { name: "Kapadokya", lat: 38.6431, lng: 34.8289, mode: "geo" },
  { name: "Pamukkale", lat: 37.9204, lng: 29.1212, mode: "geo" },
  { name: "Karadeniz Yaylası", lat: 40.9167, lng: 38.3833, mode: "geo" },
  { name: "Ege Kıyısı", lat: 38.3949, lng: 26.1418, mode: "geo" },
  { name: "Akdeniz Sahili", lat: 36.5477, lng: 31.9947, mode: "geo" },
  { name: "Doğu Anadolu", lat: 39.9334, lng: 41.2769, mode: "geo" },
  { name: "Toros Dağları", lat: 36.7500, lng: 32.5000, mode: "geo" },
  { name: "Bolu Dağı", lat: 40.7333, lng: 31.6000, mode: "geo" },
  { name: "Uludağ Çevresi", lat: 40.0667, lng: 29.1167, mode: "geo" },
  { name: "Nemrut Dağı", lat: 37.9814, lng: 38.7411, mode: "geo" },
  { name: "Van Gölü", lat: 38.6000, lng: 43.0000, mode: "geo" },
  { name: "Kaçkar Dağları", lat: 40.8333, lng: 41.1667, mode: "geo" },
  { name: "Sakarya Vadisi", lat: 40.7000, lng: 30.4000, mode: "geo" },
  { name: "Fırat Nehri", lat: 38.7939, lng: 39.0200, mode: "geo" },
  { name: "Iğdır Ovası", lat: 39.9200, lng: 44.0450, mode: "geo" },
];

console.log(`
========================================
PANO TOPLAMA TALİMATLARI
========================================

Bu script otomatik çalışamıyor çünkü Google Street View API
tarayıcı ortamı gerektiriyor.

MANUEL YÖNTEM:
1. Google Maps'e git (maps.google.com)
2. Aşağıdaki koordinatlardan birine git
3. Street View'a geç (sarı adamı sürükle)
4. Tarayıcı konsolunu aç (F12)
5. Şu kodu yapıştır:

-----------------------------------------
// Mevcut pano bilgisini al
const sv = new google.maps.StreetViewService();
const panorama = document.querySelector('canvas')?.__gm?.panorama;
if (panorama) {
  const pos = panorama.getPosition();
  const pov = panorama.getPov();
  console.log(JSON.stringify({
    panoId: panorama.getPano(),
    lat: pos.lat(),
    lng: pos.lng(),
    heading: pov.heading
  }, null, 2));
}
-----------------------------------------

6. Çıkan JSON'ı kopyala
7. Sol/Sağ/İleri yönlere git ve aynısını tekrarla

========================================
LOKASYONLAR (${TURKEY_CITIES.length} adet):
========================================
`);

TURKEY_CITIES.forEach((city, i) => {
  console.log(`${i + 1}. ${city.name} (${city.mode})`);
  console.log(`   https://www.google.com/maps/@${city.lat},${city.lng},17z`);
  console.log('');
});

console.log(`
========================================
ÖNERİ: Daha kolay yöntem için ben sana
hazır pano paketleri oluşturayım.
========================================
`);
