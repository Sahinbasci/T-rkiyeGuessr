import { MetadataRoute } from "next";
import { getAllCities, getAllRegions } from "@/data/seoData";
import { BLOG_POSTS } from "@/data/blogPosts";

const BASE = "https://turkiyeguessr.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/geoguessr-alternatifi`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/nasil-oynanir`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/multiplayer`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/bolgeler`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/sehirler`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/sss`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/hakkimizda`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const blogPages: MetadataRoute.Sitemap = BLOG_POSTS.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const regionPages: MetadataRoute.Sitemap = getAllRegions().map((r) => ({
    url: `${BASE}/bolgeler/${r.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const cityPages: MetadataRoute.Sitemap = getAllCities().map((c) => ({
    url: `${BASE}/sehirler/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogPages, ...regionPages, ...cityPages];
}
