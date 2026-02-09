import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { getAllRegions } from "@/data/seoData";
import { REGION_DESCRIPTIONS } from "@/data/regionDescriptions";

export const metadata: Metadata = {
  title: "Türkiye Bölgeleri — 7 Coğrafi Bölge Konum Tahmin Oyunu",
  description:
    "TürkiyeGuessr ile Türkiye'nin 7 coğrafi bölgesini keşfet. Marmara, Ege, Akdeniz, Karadeniz, İç Anadolu, Doğu Anadolu ve Güneydoğu bölgelerinde konum tahmin et.",
  alternates: { canonical: "/bolgeler" },
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
