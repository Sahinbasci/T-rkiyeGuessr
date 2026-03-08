import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { getCityBySlug, getAllRegions } from "@/data/seoData";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Şehir Tahmin Oyunu — 142+ Türkiye Lokasyonu",
  description:
    "Sokak görünümünden hangi şehirdesin tahmin et! İstanbul, Antalya, Kapadokya ve 139+ lokasyon.",
  keywords: [
    "şehir tahmin oyunu",
    "şehir tahmin etme oyunu",
    "türkiye şehir bilmece",
    "konum tahmin oyunu",
    "sokak görünümü oyunu",
    "google maps tahmin oyunu",
    "street view oyunu türkiye",
    "yer tahmin etme oyunu",
    "yer tahmin oyunu",
    "şehir bulma oyunu",
    "il bulma oyunu",
    "il tahmin oyunu",
    "konum bulma oyunu",
    "sokak görünümü tahmin oyunu",
  ],
  alternates: { canonical: "/sehir-tahmin-oyunu" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://turkiyeguessr.xyz/sehir-tahmin-oyunu",
    siteName: "TürkiyeGuessr",
    title: "Şehir Tahmin Oyunu — 142+ Türkiye Lokasyonu",
    description:
      "Sokak görünümünden hangi şehirdesin tahmin et! İstanbul, Antalya, Kapadokya ve 139+ lokasyon.",
    images: [
      {
        url: "https://turkiyeguessr.xyz/og-image.png",
        width: 1200,
        height: 630,
        alt: "Şehir Tahmin Oyunu — 142+ Türkiye Lokasyonu - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Şehir Tahmin Oyunu — 142+ Türkiye Lokasyonu",
    description:
      "Sokak görünümünden hangi şehirdesin tahmin et! İstanbul, Antalya, Kapadokya ve 139+ lokasyon.",
  },
};

const CITY_SLUGS = [
  "fatih-istanbul", "kaleici-antalya", "goreme-nevsehir", "konak-izmir",
  "bodrum-mugla", "pamukkale-denizli", "alanya-antalya", "fethiye-mugla",
  "uzungol-trabzon", "artuklu-mardin", "safranbolu-karabuk", "side-antalya",
];

const POPULAR_CITIES = CITY_SLUGS
  .map((slug) => { const c = getCityBySlug(slug); return c ? { slug, name: c.district } : null; })
  .filter((c): c is { slug: string; name: string } => c !== null);

const REGIONS = getAllRegions().map((r) => ({
  slug: r.slug,
  name: r.name.replace(" Bölgesi", ""),
}));

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "TürkiyeGuessr — Şehir Tahmin Oyunu",
  url: `${SITE_URL}/sehir-tahmin-oyunu`,
  description:
    "Sokak görünümünden hangi şehirdesin tahmin et! İstanbul, Antalya, Kapadokya ve 139+ lokasyon.",
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "TRY",
  },
  inLanguage: "tr",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
};

export default function SehirTahminOyunuPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Şehir Tahmin Oyunu", url: "/sehir-tahmin-oyunu" },
      ]}
    >
      <article className="space-y-10">
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Header */}
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Şehir Tahmin Oyunu — 142+ Türkiye Lokasyonu
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Google Sokak Görünümü&apos;nde rastgele bir noktaya düş, etrafına bak ve hangi
            şehirde olduğunu tahmin et. <strong className="text-gray-300">TürkiyeGuessr</strong> ile
            Türkiye&apos;nin 142&apos;den fazla küratörlü lokasyonunu keşfet — tamamen ücretsiz,
            kayıt gerektirmez. Yer tahmin etme oyunu olarak da bilinen bu format,
            il bulma oyununun sokak görünümü versiyonudur — Türkiye&apos;nin her köşesinden
            gerçek görüntülerle coğrafya bilgini test et.
          </p>
        </header>

        {/* Sokak Görünümü Nasıl Çalışır? */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">
            Sokak Görünümü Nasıl Çalışır?
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Her turda Google Street View üzerinde Türkiye&apos;nin herhangi bir noktasına
            bırakılırsın. 360 derece etrafına bakabilir, sokakta ileri-geri hareket edebilir
            ve çevrendeki ipuçlarını inceleyebilirsin. Süren dolmadan haritada tahmini konumunu
            işaretleyip &quot;Tahmin Et&quot; butonuna basarsın. Gerçek konuma ne kadar yakınsan
            o kadar yüksek puan kazanırsın. Beş tur sonunda en yüksek puanı toplayan oyuncu galip gelir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Oyun iki farklı mod sunar: <strong className="text-gray-300">Urban (Yerleşim)</strong> modunda
            şehir merkezlerinde tabela ve plaka kodu gibi doğrudan ipuçları bulabilirsin;{" "}
            <strong className="text-gray-300">Geo (Coğrafya)</strong> modunda ise kırsal alanlarda
            bitki örtüsü, topoğrafya ve doğal yapıya göre konum çıkarımı yaparsın.
          </p>
        </section>

        {/* İpucu Türleri */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">İpucu Türleri</h2>
          <p className="text-gray-400 leading-relaxed">
            Şehir tahmin oyununda başarılı olmak için çevreni dikkatli gözlemlemelisin.
            İşte sana yardımcı olacak başlıca ipucu kategorileri:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                title: "Tabelalar",
                desc: "Yol tabelaları, mağaza isimleri ve belediye panoları doğrudan şehir adı verebilir.",
              },
              {
                title: "Mimari",
                desc: "Osmanlı eserleri, taş evler veya modern yapılar bölgeyi daraltır.",
              },
              {
                title: "Bitki Örtüsü",
                desc: "Zeytin ağaçları Ege, çay bahçeleri Karadeniz, çam ormanları Akdeniz işaret eder.",
              },
              {
                title: "Plaka Kodları",
                desc: "Araç plakalarındaki iki haneli il kodu şehri kesin olarak belirler.",
              },
              {
                title: "Coğrafi Şekiller",
                desc: "Dağ silüetleri, kıyı şeridi ve ova yapısı bölgeyi ortaya koyar.",
              },
              {
                title: "İklim İpuçları",
                desc: "Kar örtüsü, kuru toprak ya da yemyeşil doğa mevsim ve bölge bilgisi verir.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4"
              >
                <h3 className="font-semibold text-gray-200 text-sm">{item.title}</h3>
                <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Popüler Şehirler */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Popüler Şehirler</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;nin en bilinen destinasyonlarından sokak görünümleri seni bekliyor.
            Her şehrin kendine özgü dokusu, mimarisi ve atmosferi var.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {POPULAR_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/sehirler/${city.slug}`}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-center text-sm text-gray-400 hover:text-white hover:border-red-500/30 transition-colors"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Bölgelere Göre Oyna */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Bölgelere Göre Oyna</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;nin 7 coğrafi bölgesinden birini seç ve o bölgeye özel
            lokasyonlarda şehir tahmin becerini test et.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {REGIONS.map((region) => (
              <Link
                key={region.slug}
                href={`/bolgeler/${region.slug}`}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-center text-sm text-gray-400 hover:text-white hover:border-red-500/30 transition-colors"
              >
                {region.name}
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8 space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Şehirleri Ne Kadar İyi Tanıyorsun?
          </h2>
          <p className="text-gray-400">
            Sokak görünümünde Türkiye&apos;yi keşfet, tahminini yap ve arkadaşlarınla yarış.
          </p>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Ücretsiz
          </Link>
          <p className="text-gray-600 text-sm">Kayıt yok. Ödeme yok. Sadece coğrafya.</p>
        </section>

        {/* İlgili İçerikler */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">İlgili İçerikler</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/nasil-oynanir"
              className="text-sm text-gray-400 hover:text-white underline transition-colors"
            >
              Nasıl Oynanır?
            </Link>
            <Link
              href="/sehirler"
              className="text-sm text-gray-400 hover:text-white underline transition-colors"
            >
              Tüm Şehirler
            </Link>
            <Link
              href="/bolgeler"
              className="text-sm text-gray-400 hover:text-white underline transition-colors"
            >
              Tüm Bölgeler
            </Link>
            <Link
              href="/blog/turkiye-guessr-nasil-oynanir"
              className="text-sm text-gray-400 hover:text-white underline transition-colors"
            >
              TürkiyeGuessr Rehberi
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
