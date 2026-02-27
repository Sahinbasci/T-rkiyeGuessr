import { MetadataRoute } from "next";
import { getAllCities, getAllRegions } from "@/data/seoData";
import { BLOG_POSTS } from "@/data/blogPosts";
import { SITE_URL } from "@/config/site";

const BASE = SITE_URL;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastUpdate = new Date("2026-02-28");

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: lastUpdate, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/geoguessr-alternatifi`, lastModified: lastUpdate, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/nasil-oynanir`, lastModified: lastUpdate, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/turkiye-harita-oyunu`, lastModified: lastUpdate, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/sehir-tahmin-oyunu`, lastModified: lastUpdate, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/ucretsiz-cografya-oyunu`, lastModified: lastUpdate, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/multiplayer`, lastModified: lastUpdate, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/bolgeler`, lastModified: lastUpdate, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/sehirler`, lastModified: lastUpdate, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: lastUpdate, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/sss`, lastModified: lastUpdate, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/hakkimizda`, lastModified: lastUpdate, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/iletisim`, lastModified: lastUpdate, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/gizlilik-politikasi`, lastModified: lastUpdate, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/cerez-politikasi`, lastModified: lastUpdate, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/kullanim-kosullari`, lastModified: lastUpdate, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/kvkk`, lastModified: lastUpdate, changeFrequency: "monthly", priority: 0.4 },
  ];

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const regionPages: MetadataRoute.Sitemap = getAllRegions().map((r) => ({
    url: `${BASE}/bolgeler/${r.slug}`,
    lastModified: lastUpdate,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const cityPages: MetadataRoute.Sitemap = getAllCities().map((c) => ({
    url: `${BASE}/sehirler/${c.slug}`,
    lastModified: lastUpdate,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages, ...regionPages, ...cityPages];
}
