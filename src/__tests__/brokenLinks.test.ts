/**
 * Broken-link guard — build-time slug validation.
 *
 * Ensures every hardcoded city slug that appears on homepage,
 * landing pages, and blog cross-links maps to an actual city
 * generated from panoPackages. Prevents internal 404s.
 */

import fs from "node:fs";
import path from "node:path";
import { getAllCities, getCityBySlug, getPopularCities, POPULAR_CITY_SLUGS } from "@/data/seoData";
import { BLOG_POSTS } from "@/data/blogPosts";

describe("Internal Link Integrity", () => {
  const allCitySlugs = new Set(getAllCities().map((c) => c.slug));

  // ── POPULAR_CITY_SLUGS (HomeSEOContent source) ──

  test("every POPULAR_CITY_SLUGS entry exists in panoPackages", () => {
    const missing: string[] = [];
    for (const slug of POPULAR_CITY_SLUGS) {
      if (!allCitySlugs.has(slug)) missing.push(slug);
    }
    expect(missing).toEqual([]);
  });

  test("getPopularCities() returns all 16 cities", () => {
    const cities = getPopularCities();
    expect(cities.length).toBe(POPULAR_CITY_SLUGS.length);
  });

  // ── turkiye-harita-oyunu popularLocations ──

  const haritaOyunuSlugs = [
    "fatih-istanbul", "kaleici-antalya", "goreme-nevsehir", "alsancak-izmir",
    "uzungol-trabzon", "pamukkale-denizli", "safranbolu-karabuk", "artuklu-mardin",
  ];

  test("turkiye-harita-oyunu popular locations all exist", () => {
    const missing = haritaOyunuSlugs.filter((s) => !allCitySlugs.has(s));
    expect(missing).toEqual([]);
  });

  // ── sehir-tahmin-oyunu POPULAR_CITIES ──

  const sehirTahminSlugs = [
    "fatih-istanbul", "kaleici-antalya", "goreme-nevsehir", "konak-izmir",
    "bodrum-mugla", "pamukkale-denizli", "alanya-antalya", "fethiye-mugla",
    "uzungol-trabzon", "artuklu-mardin", "safranbolu-karabuk", "side-antalya",
  ];

  test("sehir-tahmin-oyunu popular cities all exist", () => {
    const missing = sehirTahminSlugs.filter((s) => !allCitySlugs.has(s));
    expect(missing).toEqual([]);
  });

  // ── Blog post slugs vs actual blog routes ──

  test("all BLOG_POSTS slugs are non-empty", () => {
    for (const post of BLOG_POSTS) {
      expect(post.slug).toBeTruthy();
      expect(post.slug).not.toContain(" ");
    }
  });

  test("every BLOG_POSTS entry has a concrete page route", () => {
    const missingRoutes = BLOG_POSTS
      .map((post) => post.slug)
      .filter((slug) => {
        const pagePath = path.resolve(__dirname, `../app/blog/${slug}/page.tsx`);
        return !fs.existsSync(pagePath);
      });

    expect(missingRoutes).toEqual([]);
  });

  // ── getCityBySlug works for every city ──

  test("getCityBySlug returns data for every known slug", () => {
    for (const slug of allCitySlugs) {
      expect(getCityBySlug(slug)).toBeDefined();
    }
  });
});
