import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { getCityBySlug, getAllRegions } from "@/data/seoData";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Konum Tahmin Oyunu — Türkiye Sokak Görünümü ile Oyna",
  description:
    "Sokak görünümünde neredesin tahmin et! 142+ Türkiye lokasyonu, 7 bölge, multiplayer. Ücretsiz konum tahmin oyunu — kayıt gerektirmez.",
  keywords: [
    "konum tahmin oyunu",
    "konum tahmin etme oyunu",
    "neredesin bil oyunu",
    "konum bulma oyunu",
    "türkiye konum tahmin",
    "sokak görünümü tahmin oyunu",
    "harita tahmin oyunu",
    "yer tahmin oyunu",
    "konum bulmaca",
    "google maps konum tahmin",
    "konum tahmin",
    "konum tahmin oyunu online",
  ],
  alternates: { canonical: "/konum-tahmin-oyunu", languages: { "tr-TR": "/konum-tahmin-oyunu", "x-default": "/konum-tahmin-oyunu" } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${SITE_URL}/konum-tahmin-oyunu`,
    siteName: "TürkiyeGuessr",
    title: "Konum Tahmin Oyunu — Türkiye Sokak Görünümü ile Oyna",
    description:
      "Sokak görünümünde neredesin tahmin et! 142+ Türkiye lokasyonu, 7 bölge, multiplayer. Ücretsiz konum tahmin oyunu.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Konum Tahmin Oyunu — TürkiyeGuessr ile Türkiye Sokak Görünümünde Oyna",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Konum Tahmin Oyunu — Türkiye Sokak Görünümü ile Oyna",
    description:
      "Sokak görünümünde neredesin tahmin et! 142+ Türkiye lokasyonu, 7 bölge, multiplayer. Ücretsiz konum tahmin oyunu.",
  },
};

export default function KonumTahminOyunuPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "TürkiyeGuessr - Konum Tahmin Oyunu",
        url: `${SITE_URL}/konum-tahmin-oyunu`,
        applicationCategory: "GameApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "TRY",
        },
        inLanguage: "tr",
        description:
          "Sokak görünümünde konum tahmin et! 142+ Türkiye lokasyonu, 7 bölge, multiplayer. Ücretsiz konum tahmin oyunu.",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Anasayfa",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Konum Tahmin Oyunu",
            item: `${SITE_URL}/konum-tahmin-oyunu`,
          },
        ],
      },
    ],
  };

  const regions = getAllRegions().map((r) => ({ name: r.name, slug: r.slug }));

  const LOCATION_SLUGS = [
    "fatih-istanbul", "kaleici-antalya", "goreme-nevsehir", "alsancak-izmir",
    "uzungol-trabzon", "pamukkale-denizli", "artuklu-mardin", "safranbolu-karabuk",
  ];
  const popularLocations = LOCATION_SLUGS
    .map((slug) => { const c = getCityBySlug(slug); return c ? { name: c.locationName, slug } : null; })
    .filter((c): c is { name: string; slug: string } => c !== null);

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Konum Tahmin Oyunu", url: "/konum-tahmin-oyunu" },
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
            Konum Tahmin Oyunu — Sokak Görünümünde Neredesin?
          </h1>
          <p className="text-gray-400 mt-3 text-lg leading-relaxed">
            <strong className="text-gray-300">TürkiyeGuessr</strong>, Google Street View
            panoramalarından bulunduğun konumu tahmin ettiğin ücretsiz bir konum tahmin oyunudur.
            Karşına çıkan 360 derece sokak görünümünü incele, tabelaları oku, mimariyi analiz et
            ve Türkiye haritasında doğru yeri bul. 142&apos;den fazla özenle seçilmiş lokasyonla
            İstanbul&apos;dan Kapadokya&apos;ya, Trabzon&apos;dan Mardin&apos;e kadar Türkiye&apos;nin
            dört bir köşesini keşfet. Kayıt gerektirmez, tamamen ücretsizdir ve tarayıcından anında
            oynayabilirsin. Konum tahmin etme oyunlarının en kapsamlı Türkçe versiyonu olan
            TürkiyeGuessr, sokak görünümü ipuçlarıyla konum bulmaca deneyimi sunar.
          </p>
        </header>

        {/* Nasıl Oynanır */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Konum Tahmin Oyunu Nasıl Oynanır?</h2>
          <p className="text-gray-400 leading-relaxed">
            Konum tahmin etmek son derece basit — dört adımda başla:
          </p>
          <ol className="space-y-3">
            {[
              {
                step: "1",
                title: "Sokak Görünümünü İncele",
                desc: "Karşına çıkan 360 derece panoramayı dikkatle incele. Yol tabelaları, dağ silüetleri, bitki örtüsü, mimari tarz ve araç plakaları en güçlü ipuçlarındır.",
              },
              {
                step: "2",
                title: "Haritada Konumu İşaretle",
                desc: "İpuçlarını değerlendirdikten sonra Türkiye haritası üzerinde tahmini konumunu seç. Doğru bölgeyi bile bulman iyi bir başlangıçtır.",
              },
              {
                step: "3",
                title: "Mesafe ve Puanını Gör",
                desc: "Gerçek konum ile tahmininin arasındaki mesafe hesaplanır. Ne kadar yakınsan o kadar çok puan kazanırsın — 150 km altı mükemmel bir tahmindir.",
              },
              {
                step: "4",
                title: "5 Tur, Toplam Skor",
                desc: "Her oyun 5 turdan oluşur. Tüm turların puanları toplanarak final skorun belirlenir. Arkadaşlarınla yarış veya kişisel rekorunu kır.",
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

        {/* Konum Tahmin İpuçları */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Konum Tahmin İpuçları</h2>
          <p className="text-gray-400 leading-relaxed">
            Konum tahmin oyununda başarılı olmak için dikkat etmen gereken 6 temel ipucu:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                title: "Plaka Kodları",
                desc: "Araç plakalarındaki il kodları en kesin ipucudur. 34 İstanbul, 06 Ankara, 35 İzmir — Türkiye'nin 81 ili benzersiz bir koda sahiptir.",
              },
              {
                title: "Yol Tabelaları",
                desc: "Yeşil otoban tabelaları, mavi şehir içi yönlendirmeler ve kahverengi turizm işaretleri konum hakkında doğrudan bilgi verir.",
              },
              {
                title: "Bitki Örtüsü",
                desc: "Çay bahçeleri Karadeniz, zeytinlikler Ege, narenciye bahçeleri Akdeniz, step bozkırı İç Anadolu'yu işaret eder.",
              },
              {
                title: "Mimari Tarz",
                desc: "Taş evler Güneydoğu, ahşap evler Karadeniz, beyaz badanalı evler Ege, modern binalar büyük şehirleri gösterir.",
              },
              {
                title: "Arazi Yapısı",
                desc: "Dik yamaçlar Karadeniz, düz ovalar İç Anadolu/Güneydoğu, dağ-deniz kontrastı Akdeniz bölgesinin imzasıdır.",
              },
              {
                title: "İklim İpuçları",
                desc: "Kar örtüsü Doğu Anadolu, palmiyeler Akdeniz, sis Karadeniz, kurak arazi Güneydoğu'yu işaret eder.",
              },
            ].map((tip) => (
              <div
                key={tip.title}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4"
              >
                <h3 className="text-gray-200 font-medium">{tip.title}</h3>
                <p className="text-gray-500 text-sm mt-2">{tip.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Oyun Modları */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Oyun Modları</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr farklı oyun modlarıyla her seviyeden oyuncuya hitap eder.
            Tek başına pratik yap veya arkadaşlarınla yarış:
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              {
                title: "Klasik Mod",
                desc: "Tüm Türkiye havuzundan rastgele 5 lokasyon. Coğrafya bilgini sına ve kişisel rekorunu kır.",
              },
              {
                title: "Multiplayer",
                desc: "2-8 kişilik odalar oluştur, arkadaşlarınla aynı anda aynı lokasyonları tahmin et. En yüksek skoru kim alacak?",
              },
              {
                title: "Bölge Modu",
                desc: "Sadece belirli bir coğrafi bölgeden lokasyonlar. Ege, Karadeniz veya İç Anadolu'da uzmanlaş.",
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
            Her bölgenin kendine özgü coğrafi özellikleri, iklimi ve kültürü vardır — bu da
            konum tahmin oyununda bölge tanımayı hem öğretici hem eğlenceli kılar:
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
            Her birinin detay sayfasında konum tahmin ipuçları ve coğrafi bilgiler bulabilirsin:
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
            Konumu Tahmin Edebilecek Misin?
          </h2>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Ücretsiz
          </Link>
          <p className="text-gray-600 text-sm">
            Kayıt yok. Ödeme yok. Tarayıcını aç ve konum tahmin etmeye başla.
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
              { label: "Türkiye Harita Oyunu", href: "/turkiye-harita-oyunu" },
              { label: "Şehir Tahmin Oyunu", href: "/sehir-tahmin-oyunu" },
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
