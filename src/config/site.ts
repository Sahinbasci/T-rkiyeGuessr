/**
 * Merkezi site URL kaynağı.
 * Tüm canonical, OG, sitemap, robots, JSON-LD URL'leri buradan üretilir.
 *
 * Domain swap gerektiğinde
 * sadece env değişkeni güncellenecek, kod değişikliği gerekmeyecek.
 *
 * NEXT_PUBLIC_ prefix'i sayesinde hem Server hem Client Component'lerde çalışır.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://turkiyeguessr.com";
