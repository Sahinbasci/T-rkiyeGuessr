import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";

export const metadata: Metadata = {
  title: "En İyi Online Harita Tahmin Oyunları (2026)",
  description:
    "2026'nın en iyi online harita ve konum tahmin oyunları listesi. GeoGuessr alternatifleri, ücretsiz seçenekler ve Türkçe oyunlar.",
  keywords: ["online harita tahmin oyunları", "geoguessr alternatifleri", "ücretsiz konum tahmin oyunu", "harita oyunları"],
  alternates: { canonical: "/blog/online-harita-tahmin-oyunlari" },
};

export default function OnlineHaritaTahminOyunlariPost() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "En İyi Online Harita Tahmin Oyunları (2026)",
    datePublished: "2026-02-10",
    author: { "@type": "Organization", name: "TürkiyeGuessr" },
    publisher: { "@type": "Organization", name: "TürkiyeGuessr" },
  };

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: "Harita Tahmin Oyunları", url: "/blog/online-harita-tahmin-oyunlari" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="prose-custom space-y-8 max-w-3xl">
        <header>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <time dateTime="2026-02-10">10 Şubat 2026</time>
            <span>6 dk okuma</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            En İyi Online Harita Tahmin Oyunları
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            2026&apos;da oynayabileceğin en iyi konum tahmin ve harita oyunları.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Konum Tahmin Oyunları Nedir?</h2>
          <p className="text-gray-400 leading-relaxed">
            Konum tahmin oyunları, Google Street View veya benzeri sokak görünümü teknolojilerini kullanarak oyuncuları dünya üzerinde rastgele bir noktaya &quot;bırakan&quot; ve konumu tahmin etmelerini isteyen oyunlardır. Son yıllarda bu türün popülaritesi hızla arttı.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">2026&apos;nın En İyi Seçenekleri</h2>
          <div className="space-y-4">
            {[
              {
                name: "TürkiyeGuessr",
                desc: "Türkiye'ye odaklanan ücretsiz multiplayer konum tahmin oyunu. 142+ lokasyon, 7 bölge, tamamen Türkçe. Kayıt gerektirmez.",
                pros: ["Tamamen ücretsiz", "Türkçe arayüz", "Multiplayer (2-8 kişi)", "Kayıt gereksiz"],
                cons: ["Sadece Türkiye"],
                price: "Ücretsiz",
              },
              {
                name: "GeoGuessr",
                desc: "Konum tahmin oyunlarının öncüsü. Dünya genelinde milyonlarca lokasyon. Profesyonel e-spor sahnesi.",
                pros: ["Dünya geneli kapsam", "Büyük topluluk", "Çok sayıda mod"],
                cons: ["Aylık $3.99", "Kayıt zorunlu", "Türkçe yok"],
                price: "$3.99/ay",
              },
              {
                name: "City Guesser",
                desc: "Sokak görünümü yerine video kullanarak şehirleri tahmin ettiren farklı bir yaklaşım.",
                pros: ["Video tabanlı", "Farklı deneyim"],
                cons: ["Sınırlı içerik", "Türkiye içeriği az"],
                price: "Ücretsiz (sınırlı)",
              },
              {
                name: "Seterra",
                desc: "Klasik harita quiz oyunu. Ülkeleri, başkentleri ve bayrakları harita üzerinde bul.",
                pros: ["Eğitim odaklı", "Geniş konu yelpazesi"],
                cons: ["Sokak görünümü yok", "Tekrar eden format"],
                price: "Ücretsiz",
              },
            ].map((game) => (
              <div key={game.name} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-200">{game.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${game.price === "Ücretsiz" ? "bg-green-500/20 text-green-400" : "bg-gray-700 text-gray-400"}`}>
                    {game.price}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{game.desc}</p>
                <div className="grid sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-green-400 font-medium">Artılar:</span>
                    <ul className="text-gray-500 mt-1 space-y-0.5">
                      {game.pros.map((p) => <li key={p}>+ {p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <span className="text-red-400 font-medium">Eksiler:</span>
                    <ul className="text-gray-500 mt-1 space-y-0.5">
                      {game.cons.map((c) => <li key={c}>- {c}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Hangisi Sana Uygun?</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye coğrafyasını öğrenmek istiyorsan, ücretsiz ve Türkçe bir deneyim arıyorsan TürkiyeGuessr en iyi seçenek. Dünya genelinde oynamak istiyorsan ve aylık ücret ödemeye hazırsan GeoGuessr daha geniş kapsam sunar. Her iki oyunu da deneyerek kendi favorini belirleyebilirsin.
          </p>
        </section>

        <section className="text-center py-6 space-y-3">
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            TürkiyeGuessr Oyna — Ücretsiz!
          </Link>
        </section>

        <nav className="flex flex-wrap gap-3 pt-4 border-t border-gray-700/50">
          <Link href="/geoguessr-alternatifi" className="text-sm text-gray-400 hover:text-white transition-colors">
            GeoGuessr Alternatifi →
          </Link>
          <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-sm text-gray-400 hover:text-white transition-colors">
            Taktikler ve İpuçları →
          </Link>
        </nav>
      </article>
    </SeoLayout>
  );
}
