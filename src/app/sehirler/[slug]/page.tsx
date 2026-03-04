import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { getAllCities, getCityBySlug, getRegionBySlug } from "@/data/seoData";
import { getCityDescription } from "@/data/cityDescriptions";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return getAllCities().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = getCityBySlug(params.slug);
  if (!city) return {};

  const desc = getCityDescription(city);
  const metaDesc = desc.about.slice(0, 155) + "...";

  return {
    title: `${city.locationName} Konum Tahmin Oyunu — TürkiyeGuessr`,
    description: metaDesc,
    alternates: { canonical: `/sehirler/${city.slug}` },
  };
}

const HINT_TAG_LABELS: Record<string, string> = {
  signage: "Tabelalar",
  mosque: "Cami",
  historic: "Tarihi Yapı",
  bazaar: "Çarşı/Pazar",
  coastal: "Kıyı/Sahil",
  port: "Liman",
  modern: "Modern Yapı",
  university: "Üniversite",
  industrial: "Sanayi",
  bridge: "Köprü",
  tunnel: "Tünel",
  mountain: "Dağ",
  forest: "Orman",
  lake: "Göl",
  river: "Nehir",
  plateau: "Yayla",
  valley: "Vadi",
  thermal: "Termal",
  ancient: "Antik Kent",
  ruins: "Harabe",
  castle: "Kale",
  palace: "Saray",
  monastery: "Manastır",
  cave: "Mağara",
  waterfall: "Şelale",
  beach: "Plaj",
  island: "Ada",
  canyon: "Kanyon",
  necropolis: "Nekropol",
  tea: "Çay Bahçesi",
  village: "Köy",
  rural: "Kırsal",
  exit: "Çıkış",
  viaduct: "Viyadük",
  coast: "Sahil",
  steppe: "Step",
  salt: "Tuz",
  cappadocia: "Kapadokya",
  volcanic: "Volkanik",
  snow: "Kar",
  highland: "Yayla",
  ottoman: "Osmanlı",
  seljuk: "Selçuklu",
  stone: "Taş Yapı",
  mesopotamia: "Mezopotamya",
};

function getHintLabel(tag: string): string {
  return HINT_TAG_LABELS[tag] || tag;
}

function getDifficultyLabel(score: number): { text: string; color: string } {
  if (score >= 4) return { text: "Kolay", color: "text-green-400" };
  if (score >= 3) return { text: "Orta", color: "text-yellow-400" };
  return { text: "Zor", color: "text-red-400" };
}

export default function SehirDetailPage({ params }: Props) {
  const city = getCityBySlug(params.slug);
  if (!city) notFound();

  const region = getRegionBySlug(city.region);
  const difficulty = getDifficultyLabel(city.qualityScore);
  const cityDesc = getCityDescription(city);

  const placeJsonLd = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: city.locationName,
    description: cityDesc.about,
    geo: {
      "@type": "GeoCoordinates",
      latitude: city.coordinates.lat,
      longitude: city.coordinates.lng,
    },
    containedInPlace: {
      "@type": "AdministrativeArea",
      name: city.regionDisplayName,
    },
  };

  const faqItems = [
    {
      q: `${city.district}, ${city.province} nerede?`,
      a: `${city.district}, ${city.province} ili sınırları içinde, ${city.regionDisplayName} bölgesinde yer almaktadır. TürkiyeGuessr'da sokak görünümü üzerinden bu lokasyonu keşfedebilirsiniz.`,
    },
    {
      q: `${city.district} nasıl tanınır?`,
      a: city.hintTags.length > 0
        ? `${city.district} lokasyonunda dikkat edilmesi gereken ipuçları: ${city.hintTags.map(getHintLabel).join(", ")}. Bu ipuçlarını sokak görünümünde fark ederek konumu daha kolay tahmin edebilirsiniz.`
        : `${city.district} lokasyonunda çevredeki tabelalar, mimari yapı ve coğrafi özellikler konumu tanımanıza yardımcı olabilir.`,
    },
    {
      q: `TürkiyeGuessr'da ${city.district} nasıl oynanır?`,
      a: `TürkiyeGuessr'da oda kurarak veya mevcut bir odaya katılarak ${city.district} lokasyonunu oynayabilirsiniz. Oyun ücretsizdir ve kayıt gerektirmez.`,
    },
    {
      q: `${city.district} konum tahmin stratejisi nedir?`,
      a: cityDesc.strategy,
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  // Same-region cities for internal linking (exclude self)
  const siblingCities = region
    ? region.cities.filter((c) => c.slug !== city.slug).slice(0, 12)
    : [];

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Bölgeler", url: "/bolgeler" },
        { name: city.regionDisplayName, url: `/bolgeler/${city.region}` },
        { name: city.locationName, url: `/sehirler/${city.slug}` },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(placeJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <article className="space-y-8 max-w-3xl">
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {city.locationName}
          </h1>
          <p className="text-gray-400 mt-2">
            {city.regionDisplayName} | {city.province}
          </p>
        </header>

        {/* Meta bilgiler */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center">
            <div className="text-lg font-bold text-red-400">{city.packageCount}</div>
            <div className="text-gray-500 text-xs mt-1">Lokasyon</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center">
            <div className={`text-lg font-bold ${difficulty.color}`}>{difficulty.text}</div>
            <div className="text-gray-500 text-xs mt-1">Zorluk</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center">
            <div className="text-lg font-bold text-gray-200">{city.modes.join(", ")}</div>
            <div className="text-gray-500 text-xs mt-1">Mod</div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center">
            <div className="text-lg font-bold text-gray-200">{city.province}</div>
            <div className="text-gray-500 text-xs mt-1">İl</div>
          </div>
        </div>

        {/* Lokasyon Hakkında — unique per city */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">
            {city.locationName} Hakkında
          </h2>
          <p className="text-gray-400 leading-relaxed">
            {cityDesc.about}
          </p>
        </section>

        {/* Strateji İpuçları — unique per city */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">
            Strateji ve İpuçları
          </h2>
          <p className="text-gray-400 leading-relaxed">
            {cityDesc.strategy}
          </p>
          <p className="text-gray-500 text-sm">
            Daha fazla strateji için{" "}
            <Link href="/nasil-oynanir" className="text-red-400 hover:underline">
              Nasıl Oynanır
            </Link>{" "}
            rehberimize veya{" "}
            <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-red-400 hover:underline">
              GeoGuessr Taktikleri
            </Link>{" "}
            yazımıza göz atın.
          </p>
        </section>

        {/* Fun Fact — only for popular cities */}
        {cityDesc.funFact && (
          <section className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-5 space-y-2">
            <h2 className="text-lg font-semibold text-red-400">Biliyor muydunuz?</h2>
            <p className="text-gray-400 leading-relaxed text-sm">
              {cityDesc.funFact}
            </p>
          </section>
        )}

        {/* İpucu etiketleri */}
        {city.hintTags.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-red-400">Görsel İpuçları</h2>
            <div className="flex flex-wrap gap-2">
              {city.hintTags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-800/60 border border-gray-700/40 rounded-lg px-3 py-1.5 text-xs text-gray-400"
                >
                  {getHintLabel(tag)}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* FAQ */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Sıkça Sorulan Sorular</h2>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <details key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-xl group">
                <summary className="px-5 py-4 cursor-pointer text-gray-200 font-medium text-sm hover:text-white transition-colors list-none flex items-center justify-between">
                  {item.q}
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-6 space-y-3">
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            {city.locationName} Oyna!
          </Link>
          <p className="text-gray-600 text-sm">
            Ücretsiz, kayıt gerektirmez.
          </p>
        </section>

        {/* Aynı bölgedeki diğer şehirler */}
        {siblingCities.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-red-400">
              {city.regionDisplayName} — Diğer Lokasyonlar
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {siblingCities.map((s) => (
                <Link
                  key={s.slug}
                  href={`/sehirler/${s.slug}`}
                  className="text-sm text-gray-400 hover:text-white bg-gray-800/40 border border-gray-700/30 rounded-lg px-3 py-2 transition-colors truncate"
                >
                  {s.locationName}
                </Link>
              ))}
            </div>
            {region && region.cities.length > 13 && (
              <Link
                href={`/bolgeler/${city.region}`}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Tüm {city.regionDisplayName} lokasyonları →
              </Link>
            )}
          </section>
        )}
      </article>
    </SeoLayout>
  );
}
