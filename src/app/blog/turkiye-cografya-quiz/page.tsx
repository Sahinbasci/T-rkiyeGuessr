import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Türkiye Coğrafya Quiz: Bilgini Test Et!",
  description:
    "Türkiye coğrafyasını ne kadar iyi biliyorsun? İller, bölgeler, dağlar, göller hakkında bilgini TürkiyeGuessr ile test et.",
  keywords: ["türkiye coğrafya quiz", "coğrafya bilgi yarışması", "türkiye coğrafya testi"],
  alternates: { canonical: "/blog/turkiye-cografya-quiz", languages: { "tr-TR": "/blog/turkiye-cografya-quiz", "x-default": "/blog/turkiye-cografya-quiz" } },
  openGraph: {
    type: "article",
    locale: "tr_TR",
    url: `${SITE_URL}/blog/turkiye-cografya-quiz`,
    siteName: "TürkiyeGuessr",
    title: "Türkiye Coğrafya Quiz: Bilgini Test Et!",
    description:
      "Türkiye coğrafyasını ne kadar iyi biliyorsun? İller, bölgeler, dağlar, göller hakkında bilgini TürkiyeGuessr ile test et.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Türkiye Coğrafya Quiz: Bilgini Test Et!",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Türkiye Coğrafya Quiz: Bilgini Test Et!",
    description:
      "Türkiye coğrafyasını ne kadar iyi biliyorsun? İller, bölgeler, dağlar, göller hakkında bilgini TürkiyeGuessr ile test et.",
  },
};

export default function TurkiyeCografyaQuizPost() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "Türkiye Coğrafya Quiz: Bilgini Test Et!",
    datePublished: "2026-02-10",
    dateModified: "2026-03-12",
    author: { "@type": "Organization", name: "TürkiyeGuessr" },
    publisher: {
      "@type": "Organization",
      name: "TürkiyeGuessr",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-512.png`,
      },
    },
    description:
      "Türkiye coğrafyasını ne kadar iyi biliyorsun? İller, bölgeler, dağlar, göller hakkında bilgini TürkiyeGuessr ile test et.",
    mainEntityOfPage: `${SITE_URL}/blog/turkiye-cografya-quiz`,
    image: `${SITE_URL}/og-image.png`,
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
          <h2 className="text-xl font-semibold text-red-400">Bölge Bölge Coğrafya İpuçları</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;nin 7 coğrafi bölgesinin her birinin kendine özgü coğrafi özellikleri vardır. İşte her bölge için kısa ipuçları:
          </p>
          <div className="space-y-3">
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-1">Marmara Bölgesi</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Türkiye&apos;nin en kalabalık bölgesi olan Marmara, İstanbul Boğazı ve Trakya yarımadası ile tanınır. Sanayi, ticaret ve tarım bir arada bulunur.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/bolgeler/marmara" className="text-xs text-red-400 hover:text-red-300 transition-colors">Marmara Bölgesi →</Link>
                <Link href="/sehirler/fatih-istanbul" className="text-xs text-red-400 hover:text-red-300 transition-colors">Sultanahmet →</Link>
              </div>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-1">Ege Bölgesi</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Antik kentler, zeytinlikler ve berrak deniz kıyıları Ege&apos;nin karakteristik özelliklerindendir. Efes antik kenti ve Çeşme gibi turistik merkezlere ev sahipliği yapar.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/bolgeler/ege" className="text-xs text-red-400 hover:text-red-300 transition-colors">Ege Bölgesi →</Link>
                <Link href="/sehirler/efes-izmir" className="text-xs text-red-400 hover:text-red-300 transition-colors">Efes →</Link>
                <Link href="/sehirler/cesme-izmir" className="text-xs text-red-400 hover:text-red-300 transition-colors">Çeşme →</Link>
              </div>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-1">Akdeniz Bölgesi</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Toros Dağları&apos;nın kıyıya paralel uzandığı Akdeniz, Türkiye&apos;nin turizm başkentidir. Antalya, Alanya ve Ölüdeniz gibi dünyaca ünlü tatil merkezlerini barındırır.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/bolgeler/akdeniz" className="text-xs text-red-400 hover:text-red-300 transition-colors">Akdeniz Bölgesi →</Link>
                <Link href="/sehirler/kaleici-antalya" className="text-xs text-red-400 hover:text-red-300 transition-colors">Kaleiçi →</Link>
                <Link href="/sehirler/oludeniz-mugla" className="text-xs text-red-400 hover:text-red-300 transition-colors">Ölüdeniz →</Link>
              </div>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-1">Karadeniz Bölgesi</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Yağışlı iklimi, yemyeşil yaylaları ve çay-fındık tarlaları ile tanınan Karadeniz, Türkiye&apos;nin en yeşil bölgesidir. Uzungöl ve Ayder gibi doğal güzellikleri barındırır.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/bolgeler/karadeniz" className="text-xs text-red-400 hover:text-red-300 transition-colors">Karadeniz Bölgesi →</Link>
                <Link href="/sehirler/uzungol-trabzon" className="text-xs text-red-400 hover:text-red-300 transition-colors">Uzungöl →</Link>
              </div>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-1">İç Anadolu Bölgesi</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Step ikliminin hakim olduğu İç Anadolu, başkent Ankara&apos;ya ve Kapadokya&apos;nın peri bacalarına ev sahipliği yapar. Tuz Gölü ve Kızılırmak bölgenin önemli doğal unsurlarıdır.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/bolgeler/ic-anadolu" className="text-xs text-red-400 hover:text-red-300 transition-colors">İç Anadolu Bölgesi →</Link>
                <Link href="/sehirler/goreme-nevsehir" className="text-xs text-red-400 hover:text-red-300 transition-colors">Ürgüp →</Link>
              </div>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-1">Doğu Anadolu Bölgesi</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Türkiye&apos;nin en yüksek dağı Ağrı Dağı ve en büyük gölü Van Gölü bu bölgededir. Sert kara iklimi ve yüksek rakım bölgenin belirleyici özelliklerindendir.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/bolgeler/dogu-anadolu" className="text-xs text-red-400 hover:text-red-300 transition-colors">Doğu Anadolu Bölgesi →</Link>
                <Link href="/sehirler/akdamar-adasi-van" className="text-xs text-red-400 hover:text-red-300 transition-colors">Akdamar Adası →</Link>
              </div>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-1">Güneydoğu Anadolu Bölgesi</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Dünyanın en eski tapınağı Göbeklitepe ve batık şehir Halfeti&apos;ye ev sahipliği yapan bu bölge, tarihi ve kültürel zenginlikleriyle dikkat çeker. GAP projesi bölgenin tarımsal potansiyelini artırmıştır.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/bolgeler/guneydogu" className="text-xs text-red-400 hover:text-red-300 transition-colors">Güneydoğu Anadolu Bölgesi →</Link>
                <Link href="/sehirler/halfeti-sanliurfa" className="text-xs text-red-400 hover:text-red-300 transition-colors">Halfeti →</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">TürkiyeGuessr ile Pratik Yap</h2>
          <p className="text-gray-400 leading-relaxed">
            Coğrafya bilgisi sadece sorularla değil, görsel deneyimle pekişir. TürkiyeGuessr&apos;da gerçek Google Street View panoramalarında Türkiye&apos;nin dört bir köşesine düşersin. Sokak tabelaları, bitki örtüsü, mimari tarz ve arazi yapısı gibi ipuçlarını kullanarak konumunu tahmin edersin. Bu sayede bölgeleri ezberlemek yerine gerçekten tanırsın.
          </p>
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 space-y-2">
            <p className="text-gray-400 text-sm leading-relaxed">
              Oyuna başlamadan önce{" "}
              <Link href="/nasil-oynanir" className="text-red-400 hover:text-red-300 transition-colors">nasıl oynanır</Link>{" "}
              sayfamıza göz atabilirsin. Daha fazla taktik için{" "}
              <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-red-400 hover:text-red-300 transition-colors">GeoGuessr taktikleri ve ipuçları</Link>{" "}
              ve{" "}
              <Link href="/blog/sokaktan-sehir-nasil-taninir" className="text-red-400 hover:text-red-300 transition-colors">sokaktan şehir nasıl tanınır</Link>{" "}
              yazılarımızı oku.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              Keşfedebileceğin tüm şehirleri görmek için{" "}
              <Link href="/sehirler" className="text-red-400 hover:text-red-300 transition-colors">şehirler sayfamızı</Link>{" "}
              ziyaret et.
            </p>
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

        {/* İlgili İçerikler */}
        <section className="space-y-4 pt-4 border-t border-gray-700/30">
          <h2 className="text-xl font-semibold text-red-400">İlgili İçerikler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/bolgeler" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Tüm Bölgeler
            </Link>
            <Link href="/sehirler" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Tüm Şehirler
            </Link>
            <Link href="/blog/turkiye-bolgeleri-rehberi" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye Bölgeleri Rehberi
            </Link>
            <Link href="/blog/turkiye-illeri-harita-oyunu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye İlleri Harita Oyunu
            </Link>
            <Link href="/blog/plaka-kodlarindan-il-tahmini" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Plaka Kodlarından İl Tahmini
            </Link>
            <Link href="/blog/sokaktan-sehir-nasil-taninir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Sokaktan Şehir Nasıl Tanınır?
            </Link>
            <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-gray-400 hover:text-white text-sm transition-colors">
              → GeoGuessr Taktikleri ve İpuçları
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
