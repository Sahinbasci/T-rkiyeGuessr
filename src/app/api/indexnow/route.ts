import { NextResponse } from "next/server";
import { SITE_URL } from "@/config/site";
import { getAllCities } from "@/data/seoData";
import { getAllRegions } from "@/data/seoData";
import { BLOG_POSTS } from "@/data/blogPosts";

const INDEXNOW_KEY = "80b47ac0d8a5fad4c937029bf5c09787";

/**
 * IndexNow API — Bing ve Yandex'e URL'leri anında bildirir.
 * GET /api/indexnow?secret=<DEPLOY_SECRET> ile tetiklenir.
 * Vercel deploy hook veya manuel olarak çağrılabilir.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // Basit koruma — sadece doğru secret ile çalışır
  const expectedSecret = process.env.INDEXNOW_SECRET || "deploy-trigger-2026";
  if (secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Tüm site URL'lerini topla
  const urls: string[] = [];

  // Statik sayfalar
  const staticPages = [
    "",
    "/geoguessr-alternatifi",
    "/nasil-oynanir",
    "/turkiye-harita-oyunu",
    "/sehir-tahmin-oyunu",
    "/ucretsiz-cografya-oyunu",
    "/multiplayer",
    "/bolgeler",
    "/sehirler",
    "/blog",
    "/sss",
    "/hakkimizda",
    "/iletisim",
  ];
  staticPages.forEach((p) => urls.push(`${SITE_URL}${p}`));

  // Blog yazıları
  BLOG_POSTS.forEach((p) => urls.push(`${SITE_URL}/blog/${p.slug}`));

  // Bölge sayfaları
  getAllRegions().forEach((r) => urls.push(`${SITE_URL}/bolgeler/${r.slug}`));

  // Şehir sayfaları
  getAllCities().forEach((c) => urls.push(`${SITE_URL}/sehirler/${c.slug}`));

  // IndexNow API'ye gönder (batch — max 10000 URL)
  const host = new URL(SITE_URL).host;
  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls.slice(0, 10000),
  };

  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });

    const status = response.status;
    const text = await response.text();

    return NextResponse.json({
      success: status >= 200 && status < 300,
      indexnowStatus: status,
      urlCount: urls.length,
      response: text || "OK",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "IndexNow request failed", details: String(error) },
      { status: 500 }
    );
  }
}
