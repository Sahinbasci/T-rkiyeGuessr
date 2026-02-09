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
    slug: "turkiye-guessr-nasil-oynanir",
    title: "TürkiyeGuessr Nasıl Oynanır? Detaylı Rehber",
    description: "TürkiyeGuessr'da konum tahmin etmenin tüm detayları. Oda kurma, mod seçimi, ipuçları ve strateji rehberi.",
    date: "2026-02-10",
    readTime: "5 dk",
    tags: ["rehber", "nasıl oynanır", "başlangıç"],
  },
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
];

export function getBlogPostBySlug(slug: string): BlogPostMeta | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
