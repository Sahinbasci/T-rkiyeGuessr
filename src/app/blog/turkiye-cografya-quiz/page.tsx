import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";

export const metadata: Metadata = {
  title: "Türkiye Coğrafya Quiz: Bilgini Test Et!",
  description:
    "Türkiye coğrafyasını ne kadar iyi biliyorsun? İller, bölgeler, dağlar, göller hakkında bilgini TürkiyeGuessr ile test et.",
  keywords: ["türkiye coğrafya quiz", "coğrafya bilgi yarışması", "türkiye coğrafya testi"],
  alternates: { canonical: "/blog/turkiye-cografya-quiz" },
};

export default function TurkiyeCografyaQuizPost() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Türkiye Coğrafya Quiz: Bilgini Test Et!",
    datePublished: "2026-02-10",
    author: { "@type": "Organization", name: "TürkiyeGuessr" },
    publisher: { "@type": "Organization", name: "TürkiyeGuessr" },
  };

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: "Coğrafya Quiz", url: "/blog/turkiye-cografya-quiz" },
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
            <span>4 dk okuma</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Türkiye Coğrafya Quiz
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Türkiye&apos;nin coğrafyasını ne kadar iyi biliyorsun? Kendinizi test edin!
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Neden Coğrafya Bilgisi Önemli?</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye, 7 farklı coğrafi bölge, 81 il, binlerce dağ, göl ve nehirle dünyanın en zengin coğrafyalarından birine sahip. Bu coğrafyayı tanımak sadece okul sınavları için değil, günlük yaşamda yön bulmaktan seyahat planlamaya kadar her alanda işine yarar.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Kendini Test Et: 10 Soru</h2>
          <p className="text-gray-400 leading-relaxed">
            Aşağıdaki soruları kendi kendinize cevaplayın. Kaç tanesini bildiğinizi sayın!
          </p>
          <div className="space-y-3">
            {[
              { q: "Türkiye'nin en büyük gölü hangisidir?", a: "Van Gölü (3.713 km²)" },
              { q: "Hangi bölge Türkiye'nin en az nüfuslu bölgesidir?", a: "Doğu Anadolu Bölgesi" },
              { q: "Kapadokya hangi bölgededir?", a: "İç Anadolu Bölgesi (Nevşehir)" },
              { q: "Türkiye'nin en uzun nehri hangisidir?", a: "Kızılırmak (1.355 km)" },
              { q: "34 plaka kodu hangi ile aittir?", a: "İstanbul" },
              { q: "Pamukkale hangi ildedir?", a: "Denizli" },
              { q: "Türkiye'nin en yüksek dağı hangisidir?", a: "Ağrı Dağı (5.137 m)" },
              { q: "Fırtına Vadisi hangi bölgededir?", a: "Karadeniz Bölgesi (Rize)" },
              { q: "Göbeklitepe hangi ildedir?", a: "Şanlıurfa" },
              { q: "Türkiye kaç coğrafi bölgeye ayrılır?", a: "7 bölge" },
            ].map((item, i) => (
              <details key={i} className="group bg-gray-800/40 border border-gray-700/50 rounded-xl">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors list-none flex items-center justify-between">
                  <span>{i + 1}. {item.q}</span>
                  <span className="text-gray-600 group-open:rotate-180 transition-transform ml-4 shrink-0" aria-hidden="true">▾</span>
                </summary>
                <div className="px-4 pb-3 text-green-400 text-sm font-medium">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Puanlama</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-red-400">0-3</div>
              <div className="text-gray-500 text-xs mt-1">Acemi Gezgin</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-yellow-400">4-7</div>
              <div className="text-gray-500 text-xs mt-1">Coğrafya Meraklısı</div>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center">
              <div className="text-lg font-bold text-green-400">8-10</div>
              <div className="text-gray-500 text-xs mt-1">Coğrafya Ustası</div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Bilgini Pratiğe Dök</h2>
          <p className="text-gray-400 leading-relaxed">
            Soru cevap iyi bir başlangıç ama gerçek coğrafya bilgisi sahada test edilir. TürkiyeGuessr&apos;da sokak görünümünde gerçek Türkiye lokasyonlarına düşerek bilgini pratikte uygularsın. Teorik bilgiyi görsel hafızayla birleştirdiğinde coğrafya ustası olmak işten bile değil.
          </p>
        </section>

        <section className="text-center py-6 space-y-3">
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Coğrafya Bilgini Test Et — Ücretsiz Oyna!
          </Link>
        </section>

        <nav className="flex flex-wrap gap-3 pt-4 border-t border-gray-700/50">
          <Link href="/blog/turkiye-illeri-harita-oyunu" className="text-sm text-gray-400 hover:text-white transition-colors">
            81 İl Harita Oyunu →
          </Link>
          <Link href="/bolgeler" className="text-sm text-gray-400 hover:text-white transition-colors">
            Tüm Bölgeler →
          </Link>
        </nav>
      </article>
    </SeoLayout>
  );
}
