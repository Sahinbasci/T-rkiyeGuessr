/**
 * Blog yazıları metadata listesi
 * Yeni blog yazısı eklerken buraya eklenmeli.
 */

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  tags: string[];
}

export const BLOG_POSTS: BlogPostMeta[] = [
  {
    slug: "turkiye-cografya-quiz",
    title: "Türkiye Coğrafya Quiz: Bilgini Test Et!",
    description: "Türkiye coğrafyasını ne kadar iyi biliyorsun? İller, bölgeler, dağlar, göller hakkında bilgini TürkiyeGuessr ile test et.",
    date: "2026-02-10",
    readTime: "4 dk",
    tags: ["quiz", "coğrafya", "eğitim"],
  },
  {
    slug: "turkiye-illeri-harita-oyunu",
    title: "Türkiye İlleri Harita Oyunu: 81 İli Keşfet",
    description: "Türkiye'nin 81 ilini harita üzerinde öğren. Sokak görünümünde illeri tanı, plaka kodlarını ezberle, coğrafyayı keşfet.",
    date: "2026-02-10",
    readTime: "5 dk",
    tags: ["iller", "harita", "eğitim"],
  },
  {
    slug: "online-harita-tahmin-oyunlari",
    title: "En İyi Online Harita Tahmin Oyunları (2026)",
    description: "2026'nın en iyi online harita ve konum tahmin oyunları listesi. GeoGuessr alternatifleri, ücretsiz seçenekler ve Türkçe oyunlar.",
    date: "2026-02-10",
    readTime: "6 dk",
    tags: ["liste", "alternatifler", "karşılaştırma"],
  },
  {
    slug: "geoguessr-taktikleri-ipuclari",
    title: "GeoGuessr Taktikleri ve İpuçları: Türkiye Özel",
    description: "Türkiye'de konum tahmin ederken işine yarayacak taktikler. Plaka kodları, tabela dili, bitki örtüsü ve mimari ipuçları.",
    date: "2026-02-10",
    readTime: "7 dk",
    tags: ["taktik", "ipuçları", "strateji"],
  },
  {
    slug: "geoguessr-vs-turkiyeguessr",
    title: "GeoGuessr vs TürkiyeGuessr: Hangisi Daha İyi?",
    description: "GeoGuessr ve TürkiyeGuessr karşılaştırması. Fiyat, içerik, Türkiye odağı, multiplayer ve daha fazlası.",
    date: "2026-02-25",
    readTime: "8 dk",
    tags: ["karşılaştırma", "geoguessr", "alternatif"],
  },
  {
    slug: "sokaktan-sehir-nasil-taninir",
    title: "Türkiye Sokak Görünümünden Şehir Nasıl Tanınır?",
    description: "Sokak görünümünde Türkiye şehirlerini tanımanın ipuçları. Tabelalar, mimari, bitki örtüsü ve coğrafi işaretler.",
    date: "2026-02-25",
    readTime: "7 dk",
    tags: ["rehber", "ipuçları", "şehir tanıma"],
  },
  {
    slug: "turkiyenin-en-zor-10-lokasyonu",
    title: "Türkiye'nin En Zor Tahmin Edilen 10 Lokasyonu",
    description: "TürkiyeGuessr'da en çok yanılınan 10 lokasyon ve bu lokasyonları tanımanın ipuçları.",
    date: "2026-02-25",
    readTime: "6 dk",
    tags: ["liste", "zor lokasyonlar", "ipuçları"],
  },
  {
    slug: "plaka-kodlarindan-il-tahmini",
    title: "Plaka Kodlarından İl Nasıl Anlaşılır?",
    description: "Türkiye plaka kodları rehberi. 01'den 81'e kadar plaka kodlarını ezberle, sokak görünümünde avantaj kazan.",
    date: "2026-02-25",
    readTime: "6 dk",
    tags: ["rehber", "plaka kodları", "ipuçları"],
  },
  {
    slug: "turkiye-bolgeleri-rehberi",
    title: "Türkiye Bölgeleri Rehberi: 7 Bölgenin Farkları",
    description: "Türkiye'nin 7 coğrafi bölgesinin özellikleri, iklimi, bitki örtüsü ve mimari farklılıkları.",
    date: "2026-02-25",
    readTime: "9 dk",
    tags: ["eğitim", "bölgeler", "coğrafya"],
  },
  {
    slug: "geotastic-vs-turkiyeguessr",
    title: "Geotastic vs TürkiyeGuessr: Hangisi Türkiye İçin Daha İyi?",
    description: "Geotastic ve TürkiyeGuessr karşılaştırması. Fiyat, Türkiye odağı, lokasyon sayısı, multiplayer ve dil desteği açısından detaylı analiz.",
    date: "2026-02-26",
    readTime: "6 dk",
    tags: ["karşılaştırma", "geotastic", "alternatif"],
  },
  {
    slug: "sinifta-turkiyeguessr",
    title: "Coğrafya Öğretmenleri İçin: TürkiyeGuessr'ı Sınıfta Kullanma Rehberi",
    description: "TürkiyeGuessr'ı coğrafya derslerinde nasıl kullanırsınız? 5 sınıf aktivitesi, adım adım kurulum ve MEB müfredatıyla uyum rehberi.",
    date: "2026-03-15",
    readTime: "7 dk",
    tags: ["eğitim", "öğretmen", "sınıf", "coğrafya"],
  },
  {
    slug: "turkiye-mimari-farklari",
    title: "Türkiye'de Bölgelere Göre Mimari Farklar: Konum Tahmin Rehberi",
    description: "Türkiye'nin 7 bölgesinde mimari tarzlar nasıl farklılaşır? Osmanlı yalılarından Karadeniz serenderlerine, konum tahmin mimari ipuçları.",
    date: "2026-03-18",
    readTime: "10 dk",
    tags: ["rehber", "mimari", "bölgeler", "ipuçları"],
  },
  {
    slug: "turkiyeguessr-hikayesi",
    title: "TürkiyeGuessr'ın Hikayesi: Neden Bu Oyunu Yaptık?",
    description: "TürkiyeGuessr'ın kuruluş hikayesi. Bir yazılım geliştirici nasıl Türkiye'ye özel bir konum tahmin oyunu yarattı?",
    date: "2026-03-20",
    readTime: "8 dk",
    tags: ["hikaye", "hakkımızda", "kurucu"],
  },
];

export function getBlogPostBySlug(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
