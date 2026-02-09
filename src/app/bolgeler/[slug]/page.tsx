import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { getAllRegions, getRegionBySlug } from "@/data/seoData";
import { getRegionDescription } from "@/data/regionDescriptions";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getAllRegions().map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const region = getRegionBySlug(params.slug);
  if (!region) return {};

  const desc = getRegionDescription(params.slug);
  const uniqueProvinces = new Set(region.cities.map((c) => c.province)).size;

  return {
    title: `${region.name} Konum Tahmin Oyunu — ${uniqueProvinces} İl, ${region.packageCount} Lokasyon`,
    description:
      desc?.shortDesc
        ? `${desc.shortDesc} TürkiyeGuessr ile ${region.name} lokasyonlarında konum tahmin et. ${region.packageCount} lokasyon, ücretsiz.`
        : `${region.name} sokak görünümlerinde konum tahmin et. ${region.packageCount} lokasyon, ücretsiz.`,
    alternates: { canonical: `/bolgeler/${params.slug}` },
  };
}

export default function BolgeDetailPage({ params }: Props) {
  const region = getRegionBySlug(params.slug);
  if (!region) notFound();

  const desc = getRegionDescription(params.slug);
  const uniqueProvinces = new Set(region.cities.map((c) => c.province)).size;

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${region.name} Lokasyonları`,
    numberOfItems: region.cities.length,
    itemListElement: region.cities.map((city, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: city.locationName,
      url: `https://turkiyeguessr.xyz/sehirler/${city.slug}`,
    })),
  };

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Bölgeler", url: "/bolgeler" },
        { name: region.name, url: `/bolgeler/${params.slug}` },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <article className="space-y-8">
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {region.name}
          </h1>
          {desc && (
            <p className="text-gray-400 mt-3 text-lg">{desc.shortDesc}</p>
          )}
        </header>

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { n: region.packageCount.toString(), l: "Lokasyon" },
            { n: uniqueProvinces.toString(), l: "İl" },
            { n: region.cities.length.toString(), l: "Konum" },
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

        {/* Detaylı açıklama */}
        {desc && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-red-400">
              {region.name} Hakkında
            </h2>
            <p className="text-gray-400 leading-relaxed">{desc.longDesc}</p>
            {desc.features.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {desc.features.map((f) => (
                  <span
                    key={f}
                    className="bg-gray-800/60 border border-gray-700/40 rounded-lg px-3 py-1.5 text-xs text-gray-400"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Şehir listesi */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">
            {region.name} Lokasyonları
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {region.cities.map((city) => (
              <Link
                key={city.slug}
                href={`/sehirler/${city.slug}`}
                className="group bg-gray-800/40 border border-gray-700/40 rounded-xl p-4 hover:border-red-500/40 transition-colors"
              >
                <h3 className="font-medium text-gray-200 group-hover:text-red-400 transition-colors">
                  {city.locationName}
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {city.hintTags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-gray-700/40 rounded px-1.5 py-0.5 text-gray-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  {city.modes.join(" + ")} | {city.packageCount} paket
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-6">
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl text-lg font-bold transition-colors"
          >
            {region.name} Oyna — Ücretsiz!
          </Link>
          <p className="text-gray-600 text-sm mt-3">
            Kayıt gerektirmez. Tarayıcını aç ve başla.
          </p>
        </section>

        {/* Diğer bölgeler */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">
            Diğer Bölgeler
          </h2>
          <div className="flex flex-wrap gap-2">
            {getAllRegions()
              .filter((r) => r.slug !== params.slug)
              .map((r) => (
                <Link
                  key={r.slug}
                  href={`/bolgeler/${r.slug}`}
                  className="text-sm text-gray-400 hover:text-white bg-gray-800/40 border border-gray-700/40 rounded-lg px-3 py-1.5 transition-colors"
                >
                  {r.name}
                </Link>
              ))}
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
