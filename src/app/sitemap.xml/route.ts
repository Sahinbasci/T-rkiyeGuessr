/**
 * Sitemap route handler — explicit XML + headers.
 * Uses route handler instead of Next.js metadata API to ensure
 * correct Content-Type and no CSP interference for Google's crawler.
 */

import { getAllCities, getAllRegions } from "@/data/seoData";
import { BLOG_POSTS } from "@/data/blogPosts";

const BASE = "https://turkiyeguessr.xyz";

function entry(url: string, lastmod: string, freq: string, priority: number): string {
  return `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority.toFixed(1)}</priority>\n  </url>`;
}

export function GET() {
  const now = new Date().toISOString();

  const entries: string[] = [];

  // Static pages
  entries.push(entry(BASE, now, "weekly", 1.0));
  entries.push(entry(`${BASE}/geoguessr-alternatifi`, now, "monthly", 0.9));
  entries.push(entry(`${BASE}/nasil-oynanir`, now, "monthly", 0.9));
  entries.push(entry(`${BASE}/multiplayer`, now, "monthly", 0.8));
  entries.push(entry(`${BASE}/bolgeler`, now, "monthly", 0.8));
  entries.push(entry(`${BASE}/sehirler`, now, "monthly", 0.8));
  entries.push(entry(`${BASE}/blog`, now, "weekly", 0.8));
  entries.push(entry(`${BASE}/sss`, now, "monthly", 0.7));
  entries.push(entry(`${BASE}/hakkimizda`, now, "monthly", 0.5));
  entries.push(entry(`${BASE}/iletisim`, now, "monthly", 0.5));
  entries.push(entry(`${BASE}/gizlilik-politikasi`, now, "monthly", 0.4));
  entries.push(entry(`${BASE}/cerez-politikasi`, now, "monthly", 0.4));
  entries.push(entry(`${BASE}/kullanim-kosullari`, now, "monthly", 0.4));
  entries.push(entry(`${BASE}/kvkk`, now, "monthly", 0.4));

  // Blog posts
  for (const p of BLOG_POSTS) {
    entries.push(entry(`${BASE}/blog/${p.slug}`, new Date(p.date).toISOString(), "monthly", 0.7));
  }

  // Regions
  for (const r of getAllRegions()) {
    entries.push(entry(`${BASE}/bolgeler/${r.slug}`, now, "monthly", 0.7));
  }

  // Cities
  for (const c of getAllCities()) {
    entries.push(entry(`${BASE}/sehirler/${c.slug}`, now, "monthly", 0.6));
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
  ].join("\n");

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, must-revalidate",
      "CDN-Cache-Control": "no-store",
    },
  });
}
