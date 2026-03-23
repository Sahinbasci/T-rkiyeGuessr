import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "En İyi Online Harita Tahmin Oyunları (2026)",
  description:
    "2026'nın en iyi online harita ve konum tahmin oyunları listesi. GeoGuessr alternatifleri, ücretsiz seçenekler ve Türkçe oyunlar.",
  keywords: ["online harita tahmin oyunları", "geoguessr alternatifleri", "ücretsiz konum tahmin oyunu", "harita oyunları", "worldguessr türkiye", "openguessr türkiye"],
  alternates: { canonical: "/blog/online-harita-tahmin-oyunlari", languages: { "tr-TR": "/blog/online-harita-tahmin-oyunlari", "x-default": "/blog/online-harita-tahmin-oyunlari" } },
  openGraph: {
    type: "article",
    locale: "tr_TR",
    url: `${SITE_URL}/blog/online-harita-tahmin-oyunlari`,
    siteName: "TürkiyeGuessr",
    title: "En İyi Online Harita Tahmin Oyunları (2026)",
    description:
      "2026'nın en iyi online harita ve konum tahmin oyunları listesi. GeoGuessr alternatifleri, ücretsiz seçenekler ve Türkçe oyunlar.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "En İyi Online Harita Tahmin Oyunları (2026)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "En İyi Online Harita Tahmin Oyunları (2026)",
    description:
      "2026'nın en iyi online harita ve konum tahmin oyunları listesi. GeoGuessr alternatifleri, ücretsiz seçenekler ve Türkçe oyunlar.",
  },
};

export default function OnlineHaritaTahminOyunlariPost() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "En İyi Online Harita Tahmin Oyunları (2026)",
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
      "2026'nın en iyi online harita ve konum tahmin oyunları listesi. GeoGuessr alternatifleri, ücretsiz seçenekler ve Türkçe oyunlar.",
    mainEntityOfPage: `${SITE_URL}/blog/online-harita-tahmin-oyunlari`,
    image: `${SITE_URL}/og-image.png`,
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

        <figure className="my-8 rounded-xl overflow-hidden">
          <Image
            src="/images/blog/harita-oyunlari.jpg"
            alt="Online harita tahmin oyunları rehberi"
            width={800}
            height={450}
            className="w-full h-auto rounded-xl"
            priority
          />
          <figcaption className="text-center text-sm text-gray-500 mt-2">En iyi online harita tahmin oyunları</figcaption>
        </figure>

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

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Türkiye Odaklı Oynamanın Avantajları</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye, harita tahmin oyunları için eşsiz bir coğrafya sunar.{" "}
            <Link href="/bolgeler" className="text-red-400 hover:text-red-300 underline">7 farklı bölgesi</Link> ve{" "}
            <Link href="/sehirler" className="text-red-400 hover:text-red-300 underline">81 ili</Link> ile her köşesinde farklı bir manzara, iklim ve kültür seni bekliyor.
          </p>
          <ul className="space-y-3 text-gray-400 leading-relaxed">
            <li>
              <strong className="text-gray-200">81 İl, 7 Bölge ile Zengin Coğrafi Çeşitlilik:</strong>{" "}
              Ege&apos;nin zeytinliklerinden Karadeniz&apos;in yemyeşil yaylalarına, Kapadokya&apos;nın peri bacalarından{" "}
              <Link href="/sehirler/uzungol-trabzon" className="text-red-400 hover:text-red-300 underline">Uzungöl&apos;ün</Link>{" "}
              doğasına kadar çok geniş bir coğrafi yelpazeyi keşfedebilirsin.
            </li>
            <li>
              <strong className="text-gray-200">Plaka Kodlarından İl Tanıma Becerisi:</strong>{" "}
              Sokak görünümlerindeki araç plakalarından hangi ilde olduğunu tahmin etmek, Türkiye&apos;ye özgü bir strateji.{" "}
              <Link href="/blog/plaka-kodlarindan-il-tahmini" className="text-red-400 hover:text-red-300 underline">Plaka kodları rehberimiz</Link> ile bu becerini geliştirebilirsin.
            </li>
            <li>
              <strong className="text-gray-200">Bölgesel Bitki Örtüsü ve İklim Farklılıkları:</strong>{" "}
              Akdeniz&apos;in makileri, İç Anadolu&apos;nun bozkırı, Karadeniz&apos;in ormanları... Her bölgenin kendine has bitki örtüsü, konumu tahmin etmende büyük ipucu sağlar.
            </li>
            <li>
              <strong className="text-gray-200">Tarihi ve Kültürel Çeşitlilik:</strong>{" "}
              <Link href="/sehirler/fatih-istanbul" className="text-red-400 hover:text-red-300 underline">Sultanahmet&apos;in</Link> Osmanlı mirası,{" "}
              <Link href="/sehirler/kaleici-antalya" className="text-red-400 hover:text-red-300 underline">Kaleiçi&apos;nin</Link> Roma dönemi surları,{" "}
              <Link href="/sehirler/goreme-nevsehir" className="text-red-400 hover:text-red-300 underline">Ürgüp&apos;ün</Link> kaya kiliseleri ve{" "}
              <Link href="/sehirler/halfeti-sanliurfa" className="text-red-400 hover:text-red-300 underline">Halfeti&apos;nin</Link> batık şehri gibi eşsiz noktalar seni bekliyor.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">TürkiyeGuessr&apos;da Keşfedebileceğin Bölgeler</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;nin{" "}
            <Link href="/bolgeler" className="text-red-400 hover:text-red-300 underline">7 coğrafi bölgesi</Link>,
            her biri kendine özgü manzaralar ve ipuçları sunar:
          </p>
          <div className="space-y-2">
            {[
              { name: "Marmara Bölgesi", desc: "İstanbul ve tarihi yarımada", href: "/bolgeler/marmara" },
              { name: "Ege Bölgesi", desc: "Antik kentler ve zeytinlikler", href: "/bolgeler/ege" },
              { name: "Akdeniz Bölgesi", desc: "Turkuaz kıyılar ve Toros Dağları", href: "/bolgeler/akdeniz" },
              { name: "Karadeniz Bölgesi", desc: "Yemyeşil dağlar ve yaylalar", href: "/bolgeler/karadeniz" },
              { name: "İç Anadolu Bölgesi", desc: "Kapadokya ve bozkır", href: "/bolgeler/ic-anadolu" },
              { name: "Doğu Anadolu Bölgesi", desc: "Ağrı Dağı ve Van Gölü", href: "/bolgeler/dogu-anadolu" },
              { name: "Güneydoğu Anadolu Bölgesi", desc: "Tarihi Mezopotamya", href: "/bolgeler/guneydogu" },
            ].map((region) => (
              <Link
                key={region.href}
                href={region.href}
                className="flex items-center gap-3 bg-gray-800/40 border border-gray-700/50 rounded-lg p-3 hover:border-red-500/50 transition-colors group"
              >
                <span className="text-red-400 font-semibold group-hover:text-red-300">{region.name}</span>
                <span className="text-gray-500 text-sm">— {region.desc}</span>
              </Link>
            ))}
          </div>
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

        {/* İlgili İçerikler */}
        <section className="space-y-4 pt-4 border-t border-gray-700/30">
          <h2 className="text-xl font-semibold text-red-400">İlgili İçerikler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/geoguessr-alternatifi" className="text-gray-400 hover:text-white text-sm transition-colors">
              → GeoGuessr Alternatifi
            </Link>
            <Link href="/ucretsiz-cografya-oyunu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Ücretsiz Coğrafya Oyunu
            </Link>
            <Link href="/blog/geoguessr-vs-turkiyeguessr" className="text-gray-400 hover:text-white text-sm transition-colors">
              → GeoGuessr vs TürkiyeGuessr
            </Link>
            <Link href="/blog/turkiye-bolgeleri-rehberi" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye Bölgeleri Rehberi
            </Link>
            <Link href="/blog/sokaktan-sehir-nasil-taninir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Sokaktan Şehir Nasıl Tanınır?
            </Link>
            <Link href="/sehirler" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Tüm Şehirler
            </Link>
            <Link href="/bolgeler" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Tüm Bölgeler
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
