import { MetadataRoute } from "next";
import { getAllCities, getAllRegions } from "@/data/seoData";
import { BLOG_POSTS } from "@/data/blogPosts";
import { SITE_URL } from "@/config/site";

const BASE = SITE_URL;

/**
 * Sitemap Index — Next.js otomatik olarak /sitemap.xml altında bir index oluşturur.
 * Her segment ayrı bir sitemap dosyası olur:
 *   /sitemap/0.xml — Statik sayfalar
 *   /sitemap/1.xml — Blog yazıları
 *   /sitemap/2.xml — Bölge sayfaları
 *   /sitemap/3.xml — Şehir sayfaları
 */
export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }];
}

export default function sitemap({ id }: { id: number }): MetadataRoute.Sitemap {
  const lastUpdate = new Date("2026-03-11");
  const contentUpdate = new Date("2026-03-11");

  switch (id) {
    // Segment 0: Static pages
    case 0:
      return [
        { url: BASE, lastModified: lastUpdate, changeFrequency: "daily", priority: 1.0 },
        { url: `${BASE}/geoguessr-alternatifi`, lastModified: lastUpdate, changeFrequency: "weekly", priority: 0.9 },
        { url: `${BASE}/nasil-oynanir`, lastModified: contentUpdate, changeFrequency: "monthly", priority: 0.9 },
        { url: `${BASE}/turkiye-harita-oyunu`, lastModified: lastUpdate, changeFrequency: "weekly", priority: 0.9 },
        { url: `${BASE}/sehir-tahmin-oyunu`, lastModified: lastUpdate, changeFrequency: "weekly", priority: 0.9 },
        { url: `${BASE}/ucretsiz-cografya-oyunu`, lastModified: lastUpdate, changeFrequency: "weekly", priority: 0.9 },
        { url: `${BASE}/multiplayer`, lastModified: contentUpdate, changeFrequency: "monthly", priority: 0.8 },
        { url: `${BASE}/bolgeler`, lastModified: lastUpdate, changeFrequency: "monthly", priority: 0.8 },
        { url: `${BASE}/sehirler`, lastModified: lastUpdate, changeFrequency: "monthly", priority: 0.8 },
        { url: `${BASE}/blog`, lastModified: lastUpdate, changeFrequency: "weekly", priority: 0.8 },
        { url: `${BASE}/sss`, lastModified: contentUpdate, changeFrequency: "monthly", priority: 0.7 },
        { url: `${BASE}/hakkimizda`, lastModified: contentUpdate, changeFrequency: "monthly", priority: 0.6 },
        { url: `${BASE}/iletisim`, lastModified: contentUpdate, changeFrequency: "monthly", priority: 0.6 },
        { url: `${BASE}/gizlilik-politikasi`, lastModified: contentUpdate, changeFrequency: "monthly", priority: 0.4 },
        { url: `${BASE}/cerez-politikasi`, lastModified: contentUpdate, changeFrequency: "monthly", priority: 0.4 },
        { url: `${BASE}/kullanim-kosullari`, lastModified: contentUpdate, changeFrequency: "monthly", priority: 0.4 },
        { url: `${BASE}/kvkk`, lastModified: contentUpdate, changeFrequency: "monthly", priority: 0.4 },
      ];

    // Segment 1: Blog posts
    case 1:
      return BLOG_POSTS.map((p) => ({
        url: `${BASE}/blog/${p.slug}`,
        lastModified: new Date(p.date),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));

    // Segment 2: Region pages
    case 2:
      return getAllRegions().map((r) => ({
        url: `${BASE}/bolgeler/${r.slug}`,
        lastModified: lastUpdate,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));

    // Segment 3: City pages
    case 3:
      return getAllCities().map((c) => ({
        url: `${BASE}/sehirler/${c.slug}`,
        lastModified: contentUpdate,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));

    default:
      return [];
  }
}
