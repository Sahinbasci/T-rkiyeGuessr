import { NextResponse } from "next/server";
import { SITE_URL } from "@/config/site";

/**
 * Sitemap Index — /sitemap.xml
 *
 * Next.js 14.2.3 generateSitemaps() alt segmentleri (/sitemap/0.xml vb.)
 * otomatik uretir ama sitemap INDEX dosyasini uretmiyor.
 * Bu route bunu halleder. vercel.json rewrite ile /sitemap.xml -> buraya yonlendirilir.
 */
export async function GET() {
  const sitemapIds = [0, 1, 2, 3];
  const lastMod = "2026-03-11";

  const entries = sitemapIds
    .map(
      (id) => `  <sitemap>
    <loc>${SITE_URL}/sitemap/${id}.xml</loc>
    <lastmod>${lastMod}</lastmod>
  </sitemap>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200",
      "X-Robots-Tag": "noindex",
    },
  });
}
