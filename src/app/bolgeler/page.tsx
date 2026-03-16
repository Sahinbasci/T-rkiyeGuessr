import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { getAllRegions } from "@/data/seoData";
import { REGION_DESCRIPTIONS } from "@/data/regionDescriptions";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Türkiye Bölgeleri — 7 Coğrafi Bölge Konum Tahmin Oyunu",
  description:
    "TürkiyeGuessr ile Türkiye'nin 7 coğrafi bölgesini keşfet. Marmara, Ege, Akdeniz, Karadeniz, İç Anadolu, Doğu Anadolu ve Güneydoğu bölgelerinde konum tahmin et.",
  keywords: [
    "türkiye bölgeleri",
    "7 coğrafi bölge",
    "türkiye coğrafya bölgeleri",
    "bölge harita oyunu",
  ],
  alternates: { canonical: "/bolgeler", languages: { "tr-TR": "/bolgeler", "x-default": "/bolgeler" } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${SITE_URL}/bolgeler`,
    siteName: "TürkiyeGuessr",
    title: "Türkiye Bölgeleri — 7 Coğrafi Bölge Konum Tahmin Oyunu",
    description:
      "TürkiyeGuessr ile Türkiye'nin 7 coğrafi bölgesini keşfet. Marmara, Ege, Akdeniz, Karadeniz, İç Anadolu, Doğu Anadolu ve Güneydoğu bölgelerinde konum tahmin et.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Türkiye Bölgeleri — 7 Coğrafi Bölge Konum Tahmin Oyunu - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Türkiye Bölgeleri — 7 Coğrafi Bölge Konum Tahmin Oyunu",
    description:
      "TürkiyeGuessr ile Türkiye'nin 7 coğrafi bölgesini keşfet. Marmara, Ege, Akdeniz, Karadeniz, İç Anadolu, Doğu Anadolu ve Güneydoğu bölgelerinde konum tahmin et.",
  },
};

export default function BolgelerPage() {
  const regions = getAllRegions();

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Bölgeler", url: "/bolgeler" },
      ]}
    >
      <article className="space-y-8">
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Türkiye Bölgeleri
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            7 coğrafi bölge, 142+ lokasyon. Hangi bölgeyi ne kadar iyi tanıyorsun?
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Türkiye&apos;nin 7 Coğrafi Bölgesi</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye, coğrafi, iklimsel ve kültürel çeşitliliğiyle dünya üzerinde benzersiz bir konuma
            sahiptir. Üç tarafı denizlerle çevrili olan ülke, yedi farklı coğrafi bölgeye ayrılır.
            Her bölgenin kendine özgü iklimi, bitki örtüsü, mimarisi ve kültürel dokusu vardır.
            TürkiyeGuessr&apos;da bu bölgelerin her birinden lokasyonlar bulunur — sokak görünümünde
            çevredeki ipuçlarını kullanarak hangi bölgede olduğunuzu tahmin edebilirsiniz.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Marmara&apos;nın sanayi kentlerinden Karadeniz&apos;in yemyeşil yaylalarına,
            Ege&apos;nin zeytin ağaçlı kıyılarından Güneydoğu&apos;nun tarihi sokaklarına kadar
            her bölge farklı ipuçları sunar. Plaka kodları, tabela dilleri, mimari tarzlar ve
            topoğrafya gibi göstergeler bölgeyi belirlemenin anahtarıdır.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Bölge İpuçları</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-gray-800/40 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium mb-1">Plaka Kodları</h3>
              <p className="text-gray-500 text-sm">Her bölgenin illeri belirli plaka kod aralıklarına sahiptir. Araçlardaki plakaları okuyarak bölgeyi daraltabilirsiniz.</p>
            </div>
            <div className="bg-gray-800/40 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium mb-1">Bitki Örtüsü</h3>
              <p className="text-gray-500 text-sm">Karadeniz&apos;in çay bahçeleri, Ege&apos;nin zeytinlikleri, İç Anadolu&apos;nun step bitki örtüsü bölgeyi ele verir.</p>
            </div>
            <div className="bg-gray-800/40 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium mb-1">Mimari</h3>
              <p className="text-gray-500 text-sm">Doğu Anadolu&apos;nun taş evleri, Karadeniz&apos;in ahşap yapıları, Akdeniz&apos;in beyaz badanalı evleri farklılık yaratır.</p>
            </div>
            <div className="bg-gray-800/40 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium mb-1">Topoğrafya</h3>
              <p className="text-gray-500 text-sm">Dağlık arazi, ova, kıyı şeridi veya yayla — arazinin şekli bölge hakkında güçlü bir ipucudur.</p>
            </div>
          </div>
        </section>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regions.map((region) => {
            const desc = REGION_DESCRIPTIONS[region.slug];
            const uniqueProvinces = new Set(region.cities.map((c) => c.province)).size;
            return (
              <Link
                key={region.slug}
                href={`/bolgeler/${region.slug}`}
                className="group bg-gray-800/50 border border-gray-700/50 rounded-xl p-5 hover:border-red-500/50 transition-colors"
              >
                <h2 className="text-lg font-semibold text-gray-200 group-hover:text-red-400 transition-colors">
                  {region.name}
                </h2>
                {desc && (
                  <p className="text-gray-500 text-sm mt-2 line-clamp-2">
                    {desc.shortDesc}
                  </p>
                )}
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span>{region.packageCount} lokasyon</span>
                  <span>{uniqueProvinces} il</span>
                  <span>{region.cities.length} konum</span>
                </div>
              </Link>
            );
          })}
        </div>

        <section className="text-center py-6">
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Tüm Bölgeler
          </Link>
          <p className="text-gray-600 text-sm mt-3">
            Ücretsiz, kayıt gerektirmez.
          </p>
        </section>
      </article>
    </SeoLayout>
  );
}
