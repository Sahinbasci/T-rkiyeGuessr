import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { getCityBySlug, getAllRegions } from "@/data/seoData";

export const metadata: Metadata = {
  title: "Türkiye Harita Oyunu — Ücretsiz Online Oyna",
  description:
    "Türkiye haritasında sokak görünümünden konum tahmin et. 142+ lokasyon, 7 bölge, multiplayer. Ücretsiz!",
  keywords: [
    "türkiye harita oyunu",
    "harita oyunu online",
    "türkiye harita tahmin",
    "ücretsiz harita oyunu",
    "türkiye coğrafya oyunu",
    "google maps tahmin oyunu",
    "harita bilmece",
    "harita tahmin oyunu",
    "harita kapmaca",
    "türkiye haritası oyunu",
  ],
  alternates: { canonical: "/turkiye-harita-oyunu" },
};

export default function TurkiyeHaritaOyunuPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "TürkiyeGuessr - Türkiye Harita Oyunu",
        url: "https://turkiyeguessr.xyz/turkiye-harita-oyunu",
        applicationCategory: "GameApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "TRY",
        },
        inLanguage: "tr",
        description:
          "Türkiye haritasında sokak görünümünden konum tahmin et. 142+ lokasyon, 7 bölge, multiplayer. Ücretsiz!",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Anasayfa",
            item: "https://turkiyeguessr.xyz",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Türkiye Harita Oyunu",
            item: "https://turkiyeguessr.xyz/turkiye-harita-oyunu",
          },
        ],
      },
    ],
  };

  const regions = getAllRegions().map((r) => ({ name: r.name, slug: r.slug }));

  const LOCATION_SLUGS = [
    "fatih-istanbul", "kaleici-antalya", "goreme-nevsehir", "alsancak-izmir",
    "uzungol-trabzon", "pamukkale-denizli", "safranbolu-karabuk", "artuklu-mardin",
  ];
  const popularLocations = LOCATION_SLUGS
    .map((slug) => { const c = getCityBySlug(slug); return c ? { name: c.locationName, slug } : null; })
    .filter((c): c is { name: string; slug: string } => c !== null);

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Türkiye Harita Oyunu", url: "/turkiye-harita-oyunu" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="space-y-10">
        {/* H1 + Intro */}
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Türkiye Harita Oyunu — Ücretsiz Online Oyna
          </h1>
          <p className="text-gray-400 mt-3 text-lg leading-relaxed">
            <strong className="text-gray-300">TürkiyeGuessr</strong>, Türkiye haritası üzerinde
            gerçek sokak görünümü panoramalarından konum tahmin ettiğin ücretsiz bir harita oyunudur.
            Google Street View teknolojisiyle Türkiye&apos;nin dört bir yanını keşfet; İstanbul&apos;un
            tarihi sokaklarından Kapadokya&apos;nın büyüleyici vadilerine, Ege&apos;nin sahil
            kasabalarından Karadeniz&apos;in yaylalarına kadar 142&apos;den fazla özenle seçilmiş
            lokasyonu harita üzerinde bulmaya çalış. Kayıt gerektirmez, tamamen ücretsizdir ve
            tarayıcından anında oynayabilirsin. Harita kapmaca tarzı oyunların modern
            versiyonu olan TürkiyeGuessr, Google sokak görünümü üzerinden oynanan interaktif
            bir harita yapboz deneyimi sunar.
          </p>
        </header>

        {/* Nasıl Oynanır */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Nasıl Oynanır?</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye harita oyununu oynamak son derece basit. Dört adımda başla:
          </p>
          <ol className="space-y-3">
            {[
              {
                step: "1",
                title: "Panoramayı İncele",
                desc: "Karşına çıkan 360 derece sokak görünümünü dikkatle incele. Tabelalar, doğa, mimari ve yol yapısı gibi ipuçlarına bak.",
              },
              {
                step: "2",
                title: "Haritada Tahmin Et",
                desc: "İpuçlarını değerlendirdikten sonra Türkiye haritası üzerinde tahmini konumunu işaretle.",
              },
              {
                step: "3",
                title: "Puanını Gör",
                desc: "Gerçek konum ile tahmininin arasındaki mesafe hesaplanır. Ne kadar yakınsan o kadar çok puan kazanırsın.",
              },
              {
                step: "4",
                title: "5 Tur, Toplam Skor",
                desc: "Her oyun 5 turdan oluşur. Tüm turların puanları toplanarak final skorun belirlenir.",
              },
            ].map((item) => (
              <li
                key={item.step}
                className="flex gap-4 bg-gray-800/40 border border-gray-700/30 rounded-lg p-4"
              >
                <span className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-gray-200 font-medium">{item.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Oyun Modları */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Oyun Modları</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr farklı oyun modlarıyla her seviyeden oyuncuya hitap eder.
            Tek başına pratik yapabilir ya da arkadaşlarınla yarışabilirsin:
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              {
                title: "Klasik Mod",
                desc: "Tüm Türkiye havuzundan rastgele 5 lokasyon. Coğrafya bilgini sına.",
              },
              {
                title: "Multiplayer",
                desc: "Arkadaşlarınla aynı anda aynı lokasyonları tahmin et. En yüksek skoru kim alacak?",
              },
              {
                title: "Bölge Modu",
                desc: "Sadece belirli bir coğrafi bölgeden lokasyonlar. Uzmanlığını derinleştir.",
              },
            ].map((mode) => (
              <div
                key={mode.title}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4"
              >
                <h3 className="text-gray-200 font-medium">{mode.title}</h3>
                <p className="text-gray-500 text-sm mt-2">{mode.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7 Coğrafi Bölge */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">7 Coğrafi Bölge</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;nin her coğrafi bölgesinden özenle seçilmiş lokasyonlar bulunur.
            Bölge sayfalarını ziyaret ederek her bölgenin kendine özgü coğrafi özelliklerini,
            lokasyon sayısını ve il dağılımını inceleyebilirsin:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {regions.map((region) => (
              <Link
                key={region.slug}
                href={`/bolgeler/${region.slug}`}
                className="text-sm text-gray-400 hover:text-white bg-gray-800/40 border border-gray-700/30 rounded-lg px-3 py-2.5 transition-colors text-center"
              >
                {region.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Popüler Lokasyonlar */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Popüler Lokasyonlar</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;nin en bilinen ve en zorlu lokasyonlarından bazıları.
            Her birinin detay sayfasında o konuma ait ipuçları ve coğrafi bilgiler bulabilirsin:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {popularLocations.map((loc) => (
              <Link
                key={loc.slug}
                href={`/sehirler/${loc.slug}`}
                className="text-sm text-gray-400 hover:text-white bg-gray-800/40 border border-gray-700/30 rounded-lg px-3 py-2.5 transition-colors text-center"
              >
                {loc.name}
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8 space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Türkiye&apos;yi Ne Kadar İyi Tanıyorsun?
          </h2>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Ücretsiz
          </Link>
          <p className="text-gray-600 text-sm">
            Kayıt yok. Ödeme yok. Tarayıcını aç ve başla.
          </p>
        </section>

        {/* Daha Fazlasını Keşfet */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Daha Fazlasını Keşfet</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Nasıl Oynanır?", href: "/nasil-oynanir" },
              { label: "Multiplayer Modu", href: "/multiplayer" },
              { label: "Tüm Bölgeler", href: "/bolgeler" },
              { label: "Tüm Şehirler", href: "/sehirler" },
              { label: "GeoGuessr Alternatifi", href: "/geoguessr-alternatifi" },
              { label: "Blog", href: "/blog" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-400 hover:text-white underline transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
