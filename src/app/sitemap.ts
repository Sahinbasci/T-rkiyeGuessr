import { MetadataRoute } from "next";
import { getAllCities, getAllRegions } from "@/data/seoData";
import { BLOG_POSTS } from "@/data/blogPosts";
import { SITE_URL } from "@/config/site";

const BASE = SITE_URL;

// SEO FIX: Use actual content update dates instead of new Date().
// Google penalizes sitemaps with always-changing lastmod — it signals unreliable data
// and causes Google to ignore lastmod entirely, hurting crawl prioritization.
// Update these dates ONLY when the page content actually changes.
const LAST_DEPLOY = "2026-03-16"; // Update on each meaningful deploy
const CONTENT_UPDATE = "2026-03-11"; // Last content/copy change

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: LAST_DEPLOY, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/geoguessr-alternatifi`, lastModified: CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/nasil-oynanir`, lastModified: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/turkiye-harita-oyunu`, lastModified: CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/sehir-tahmin-oyunu`, lastModified: CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/ucretsiz-cografya-oyunu`, lastModified: CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/konum-tahmin-oyunu`, lastModified: CONTENT_UPDATE, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/multiplayer`, lastModified: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/bolgeler`, lastModified: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/sehirler`, lastModified: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: LAST_DEPLOY, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/sss`, lastModified: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/hakkimizda`, lastModified: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/iletisim`, lastModified: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/gizlilik-politikasi`, lastModified: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.1 },
    { url: `${BASE}/cerez-politikasi`, lastModified: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.1 },
    { url: `${BASE}/kullanim-kosullari`, lastModified: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.1 },
    { url: `${BASE}/kvkk`, lastModified: CONTENT_UPDATE, changeFrequency: "monthly", priority: 0.1 },
  ];

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const regionPages: MetadataRoute.Sitemap = getAllRegions().map((r) => ({
    url: `${BASE}/bolgeler/${r.slug}`,
    lastModified: CONTENT_UPDATE,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const cityPages: MetadataRoute.Sitemap = getAllCities().map((c) => ({
    url: `${BASE}/sehirler/${c.slug}`,
    lastModified: CONTENT_UPDATE,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages, ...regionPages, ...cityPages];
}
