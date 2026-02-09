import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { getAllCities, getAllRegions, getUniqueProvinceCount } from "@/data/seoData";

export const metadata: Metadata = {
  title: "Tüm Şehirler — 142+ Türkiye Lokasyonu Konum Tahmin Oyunu",
  description:
    "TürkiyeGuessr'daki tüm şehir ve lokasyonları keşfet. 7 bölge, 48+ il, 142+ küratörlü konum. Ücretsiz konum tahmin oyunu.",
  alternates: { canonical: "/sehirler" },
};

export default function SehirlerPage() {
  const regions = getAllRegions();
  const totalCities = getAllCities().length;
  const totalProvinces = getUniqueProvinceCount();

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Şehirler", url: "/sehirler" },
      ]}
    >
      <article className="space-y-8">
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tüm Şehirler ve Lokasyonlar
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            {totalCities} lokasyon, {totalProvinces} il, 7 bölge. Türkiye&apos;yi keşfetmeye hazır mısın?
          </p>
        </header>

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { n: `${totalCities}+`, l: "Lokasyon" },
            { n: totalProvinces.toString(), l: "İl" },
            { n: "7", l: "Bölge" },
          ].map((s) => (
            <div
              key={s.l}
              className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center"
            >
              <div className="text-2xl font-bold text-red-400">{s.n}</div>
              <div className="text-gray-500 text-sm mt-1">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Bölgelere göre şehirler */}
        {regions.map((region) => (
          <section key={region.slug} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-red-400">
                {region.name}
              </h2>
              <Link
                href={`/bolgeler/${region.slug}`}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                Bölge Detayı →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {region.cities.map((city) => (
                <Link
                  key={city.slug}
                  href={`/sehirler/${city.slug}`}
                  className="text-sm text-gray-400 hover:text-white bg-gray-800/40 border border-gray-700/30 rounded-lg px-3 py-2 transition-colors truncate"
                >
                  {city.locationName}
                </Link>
              ))}
            </div>
          </section>
        ))}

        {/* CTA */}
        <section className="text-center py-6">
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Ücretsiz!
          </Link>
          <p className="text-gray-600 text-sm mt-3">
            Kayıt gerektirmez. Tarayıcını aç ve başla.
          </p>
        </section>
      </article>
    </SeoLayout>
  );
}
