/**
 * Server-rendered SEO content for homepage.
 * Google crawlers see this HTML on first paint — no JS needed.
 * Hidden during gameplay via CSS (body.game-active .home-seo).
 */

import Link from "next/link";
import { SeoFooter } from "./Footer";

const REGIONS = [
  { slug: "marmara", name: "Marmara" },
  { slug: "ege", name: "Ege" },
  { slug: "akdeniz", name: "Akdeniz" },
  { slug: "karadeniz", name: "Karadeniz" },
  { slug: "ic_anadolu", name: "İç Anadolu" },
  { slug: "dogu_anadolu", name: "Doğu Anadolu" },
  { slug: "guneydogu", name: "Güneydoğu Anadolu" },
];

const POPULAR_CITIES = [
  { slug: "fatih-istanbul", name: "İstanbul" },
  { slug: "ulus-ankara", name: "Ankara" },
  { slug: "konak-izmir", name: "İzmir" },
  { slug: "kaleici-antalya", name: "Antalya" },
  { slug: "osmangazi-bursa", name: "Bursa" },
  { slug: "uzungol-trabzon", name: "Trabzon" },
  { slug: "uchisar-nevsehir", name: "Uçhisar" },
  { slug: "bodrum-mugla", name: "Bodrum" },
  { slug: "safranbolu-karabuk", name: "Safranbolu" },
  { slug: "artuklu-mardin", name: "Mardin" },
  { slug: "pamukkale-denizli", name: "Pamukkale" },
  { slug: "goreme-nevsehir", name: "Göreme" },
  { slug: "efes-izmir", name: "Efes" },
  { slug: "fethiye-mugla", name: "Fethiye" },
  { slug: "alanya-antalya", name: "Alanya" },
  { slug: "side-antalya", name: "Side" },
];

const BLOG_LINKS = [
  { slug: "turkiye-guessr-nasil-oynanir", title: "TürkiyeGuessr Nasıl Oynanır?" },
  { slug: "turkiye-cografya-quiz", title: "Türkiye Coğrafya Quiz" },
  { slug: "turkiye-illeri-harita-oyunu", title: "Türkiye İlleri Harita Oyunu" },
  { slug: "online-harita-tahmin-oyunlari", title: "Online Harita Tahmin Oyunları" },
  { slug: "geoguessr-taktikleri-ipuclari", title: "GeoGuessr Taktikleri" },
];

export function HomeSEOContent() {
  return (
    <div className="home-seo bg-[#0a0a0f]">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        {/* Açıklama */}
        <section className="text-center space-y-3">
          <h2 className="text-2xl font-bold text-gray-200" style={{ fontFamily: "var(--font-display)" }}>
            Türkiye Konum Tahmin Oyunu
          </h2>
          <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
            TürkiyeGuessr ile Google Street View üzerinden Türkiye&apos;nin dört bir yanını keşfet.
            142+ lokasyon, 7 coğrafi bölge ve 2-8 kişilik multiplayer modlarla arkadaşlarınla yarış.
            Tamamen ücretsiz, kayıt gerektirmez.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/nasil-oynanir" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
              Nasıl Oynanır?
            </Link>
            <Link href="/multiplayer" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
              Multiplayer
            </Link>
            <Link href="/geoguessr-alternatifi" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
              GeoGuessr Alternatifi
            </Link>
            <Link href="/turkiye-harita-oyunu" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
              Türkiye Harita Oyunu
            </Link>
            <Link href="/sehir-tahmin-oyunu" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
              Şehir Tahmin Oyunu
            </Link>
            <Link href="/ucretsiz-cografya-oyunu" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
              Ücretsiz Coğrafya Oyunu
            </Link>
          </div>
        </section>

        {/* Bölgeler */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-300 text-center">
            <Link href="/bolgeler" className="hover:text-white transition-colors">
              7 Coğrafi Bölge
            </Link>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {REGIONS.map((r) => (
              <Link
                key={r.slug}
                href={`/bolgeler/${r.slug}`}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-center text-sm text-gray-400 hover:text-white hover:border-red-500/30 transition-colors"
              >
                {r.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Popüler Şehirler */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-300 text-center">
            <Link href="/sehirler" className="hover:text-white transition-colors">
              Popüler Lokasyonlar
            </Link>
          </h3>
          <div className="flex flex-wrap justify-center gap-2">
            {POPULAR_CITIES.map((c) => (
              <Link
                key={c.slug}
                href={`/sehirler/${c.slug}`}
                className="bg-gray-800/40 border border-gray-700/40 rounded-full px-3 py-1.5 text-xs text-gray-500 hover:text-white hover:border-red-500/30 transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Blog */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-300 text-center">
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BLOG_LINKS.map((b) => (
              <Link
                key={b.slug}
                href={`/blog/${b.slug}`}
                className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                &rarr; {b.title}
              </Link>
            ))}
          </div>
        </section>

      </div>

      {/* Full SEO Footer — 20+ internal links */}
      <SeoFooter />
    </div>
  );
}
