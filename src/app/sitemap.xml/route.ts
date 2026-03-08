import { SITE_URL } from "@/config/site";
import { NextResponse } from "next/server";

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap/0.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap/1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap/2.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap/3.xml</loc>
  </sitemap>
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
