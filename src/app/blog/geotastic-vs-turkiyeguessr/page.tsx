import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Geotastic vs TürkiyeGuessr: Hangisi Türkiye İçin Daha İyi?",
  description:
    "Geotastic ve TürkiyeGuessr karşılaştırması. Fiyat, Türkiye odağı, lokasyon sayısı, multiplayer ve dil desteği açısından detaylı analiz.",
  keywords: [
    "geotastic vs turkiyeguessr",
    "geotastic alternatifi",
    "geotastic türkiye",
    "ücretsiz coğrafya oyunu",
    "geoguessr alternatifi",
    "geotastic nedir",
    "ücretsiz harita oyunu",
  ],
  alternates: { canonical: "/blog/geotastic-vs-turkiyeguessr", languages: { "tr-TR": "/blog/geotastic-vs-turkiyeguessr", "x-default": "/blog/geotastic-vs-turkiyeguessr" } },
  openGraph: {
    type: "article",
    locale: "tr_TR",
    url: `${SITE_URL}/blog/geotastic-vs-turkiyeguessr`,
    siteName: "TürkiyeGuessr",
    title: "Geotastic vs TürkiyeGuessr: Hangisi Türkiye İçin Daha İyi?",
    description:
      "Geotastic ve TürkiyeGuessr karşılaştırması. Fiyat, Türkiye odağı, lokasyon sayısı, multiplayer ve dil desteği açısından detaylı analiz.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Geotastic vs TürkiyeGuessr: Hangisi Türkiye İçin Daha İyi?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Geotastic vs TürkiyeGuessr: Hangisi Türkiye İçin Daha İyi?",
    description:
      "Geotastic ve TürkiyeGuessr karşılaştırması. Fiyat, Türkiye odağı, lokasyon sayısı, multiplayer ve dil desteği açısından detaylı analiz.",
  },
};

export default function GeotasticVsTurkiyeguessrPost() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "Geotastic vs TürkiyeGuessr: Hangisi Türkiye İçin Daha İyi?",
    datePublished: "2026-02-26",
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
      "Geotastic ve TürkiyeGuessr karşılaştırması. Fiyat, Türkiye odağı, lokasyon sayısı, multiplayer ve dil desteği açısından detaylı analiz.",
    mainEntityOfPage: `${SITE_URL}/blog/geotastic-vs-turkiyeguessr`,
    image: `${SITE_URL}/og-image.png`,
  };

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: "Geotastic vs TürkiyeGuessr", url: "/blog/geotastic-vs-turkiyeguessr" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="prose-custom space-y-8 max-w-3xl">
        <header>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <time dateTime="2026-02-26">26 Şubat 2026</time>
            <span>6 dk okuma</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Geotastic vs TürkiyeGuessr: Türkiye İçin Hangisi?
          </h1>
        </header>

        {/* Giriş */}
        <section className="space-y-3">
          <p className="text-gray-300 leading-relaxed">
            Ücretsiz coğrafya oyunu arayan herkes bir noktada <strong>Geotastic</strong> ve{" "}
            <strong>TürkiyeGuessr</strong> ile karşılaşır. İkisi de GeoGuessr alternatifi
            olarak öne çıkar, ancak odak noktaları çok farklıdır. Geotastic dünya genelinde
            geniş bir kapsam sunarken, TürkiyeGuessr yalnızca Türkiye&apos;ye odaklanarak
            derinlemesine bir deneyim sağlar.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Bu yazıda her iki oyunu fiyat, Türkiye içeriği, multiplayer, dil desteği ve
            lokasyon kalitesi açısından karşılaştırıyoruz.
          </p>
        </section>

        {/* Geotastic Nedir */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-white">Geotastic Nedir?</h2>
          <p className="text-gray-300 leading-relaxed">
            Geotastic, topluluk tarafından fonlanan (crowdfunded) ücretsiz bir multiplayer
            coğrafya quiz uygulamasıdır. Google Street View üzerinden dünya genelinde konum
            tahmin oyunu oynayabilirsiniz. Tek oyunculu, çok oyunculu ve günlük challenge
            modları sunar. Bağış sistemiyle çalışır; reklamsız deneyim için bağış yapmanız
            gerekir.
          </p>
        </section>

        {/* TürkiyeGuessr Nedir */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-white">TürkiyeGuessr Nedir?</h2>
          <p className="text-gray-300 leading-relaxed">
            TürkiyeGuessr, Türkiye&apos;ye özel olarak geliştirilmiş ücretsiz bir konum
            tahmin oyunudur. 142+ küratörlü Türkiye lokasyonu, 7 coğrafi bölge, tamamen
            Türkçe arayüz ve kayıt gerektirmeyen multiplayer modu ile Türkiye odaklı en
            kapsamlı coğrafya oyunudur.
          </p>
        </section>

        {/* Karşılaştırma Tablosu */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Detaylı Karşılaştırma</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="py-3 px-4 text-left text-gray-400 font-medium">Özellik</th>
                  <th className="py-3 px-4 text-center text-gray-400 font-medium">Geotastic</th>
                  <th className="py-3 px-4 text-center text-red-400 font-medium">TürkiyeGuessr</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4 font-medium">Fiyat</td>
                  <td className="py-3 px-4 text-center">Ücretsiz (bağış destekli)</td>
                  <td className="py-3 px-4 text-center text-green-400">Tamamen ücretsiz</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4 font-medium">Kayıt gerekli mi?</td>
                  <td className="py-3 px-4 text-center">Evet (oda oluşturmak için)</td>
                  <td className="py-3 px-4 text-center text-green-400">Hayır</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4 font-medium">Türkiye lokasyonu</td>
                  <td className="py-3 px-4 text-center">Sınırlı (rastgele)</td>
                  <td className="py-3 px-4 text-center text-green-400">142+ küratörlü</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4 font-medium">Dünya geneli kapsam</td>
                  <td className="py-3 px-4 text-center text-green-400">100+ ülke</td>
                  <td className="py-3 px-4 text-center">Sadece Türkiye</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4 font-medium">Arayüz dili</td>
                  <td className="py-3 px-4 text-center">İngilizce / Almanca</td>
                  <td className="py-3 px-4 text-center text-green-400">Türkçe</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4 font-medium">Multiplayer</td>
                  <td className="py-3 px-4 text-center text-green-400">Evet (online lobby)</td>
                  <td className="py-3 px-4 text-center text-green-400">Evet (2-8 kişi)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4 font-medium">Özel harita</td>
                  <td className="py-3 px-4 text-center text-green-400">Evet</td>
                  <td className="py-3 px-4 text-center">Hayır (7 bölge filtresi var)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4 font-medium">Challenge modu</td>
                  <td className="py-3 px-4 text-center text-green-400">Günlük challenge</td>
                  <td className="py-3 px-4 text-center">Oda bazlı yarış</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4 font-medium">Reklam</td>
                  <td className="py-3 px-4 text-center">Var (bağışsız kullanıcılar)</td>
                  <td className="py-3 px-4 text-center">Minimal</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4 font-medium">NMPZ modu</td>
                  <td className="py-3 px-4 text-center text-green-400">Evet</td>
                  <td className="py-3 px-4 text-center">Hayır</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Geotastic'in Güçlü Yanları */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-white">Geotastic Ne Zaman Daha İyi?</h2>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">+</span>
              <span>Dünya genelinde coğrafya öğrenmek istiyorsanız — 100+ ülke kapsamı</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">+</span>
              <span>NMPZ (No Move, No Pan, No Zoom) gibi ileri challenge modları arıyorsanız</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">+</span>
              <span>Kendi özel haritanızı oluşturmak istiyorsanız</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">+</span>
              <span>Günlük challenge ile düzenli oynamak istiyorsanız</span>
            </li>
          </ul>
        </section>

        {/* TürkiyeGuessr'ın Avantajları */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-white">TürkiyeGuessr Ne Zaman Daha İyi?</h2>
          <ul className="space-y-2 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">+</span>
              <span>
                Türkiye&apos;yi derinlemesine öğrenmek istiyorsanız —{" "}
                <Link href="/sehirler" className="text-red-400 hover:text-red-300">
                  142+ küratörlü lokasyon
                </Link>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">+</span>
              <span>
                Türkçe arayüz ve Türkçe içerik istiyorsanız — Geotastic&apos;te Türkçe yok
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">+</span>
              <span>
                Kayıt olmadan hemen oynamak istiyorsanız — TürkiyeGuessr hesap gerektirmez
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">+</span>
              <span>
                <Link href="/bolgeler" className="text-red-400 hover:text-red-300">
                  7 coğrafi bölge
                </Link>{" "}
                bazında filtreleme ve bölge bazlı öğrenme istiyorsanız
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-1">+</span>
              <span>
                Arkadaşlarınızla{" "}
                <Link href="/multiplayer" className="text-red-400 hover:text-red-300">
                  multiplayer
                </Link>{" "}
                Türkiye turu yapmak istiyorsanız
              </span>
            </li>
          </ul>
        </section>

        {/* TürkiyeGuessr'ın Türkiye Odaklı Avantajları */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">TürkiyeGuessr&apos;ın Türkiye Odaklı Avantajları</h2>
          <p className="text-gray-300 leading-relaxed">
            Geotastic dünya genelinde iyi bir deneyim sunarken, Türkiye özelinde derinlik eksik kalır.
            TürkiyeGuessr ise tamamen Türkiye&apos;ye odaklanarak çok daha zengin bir öğrenme ortamı sağlar.
            İşte farkı yaratan detaylar:
          </p>

          <div className="space-y-4">
            <div className="bg-gray-800/40 rounded-xl p-4 space-y-2">
              <h3 className="text-lg font-medium text-red-400">142+ Küratörlü Lokasyon</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Geotastic&apos;te Türkiye konumları rastgele seçilir ve çoğu zaman tanınması güç, belirsiz noktalara
                düşersiniz. TürkiyeGuessr&apos;da ise her lokasyon tek tek seçilmiş ve test edilmiştir. Her biri
                Türkiye&apos;nin farklı bir yüzünü gösteren{" "}
                <Link href="/sehirler" className="text-red-400 hover:text-red-300">
                  142+ özenle küratörlenmiş nokta
                </Link>{" "}
                sizi bekliyor — tarihi meydanlardan kıyı kasabalarına, yaylalardan antik kentlere kadar.
              </p>
            </div>

            <div className="bg-gray-800/40 rounded-xl p-4 space-y-2">
              <h3 className="text-lg font-medium text-red-400">Bölge Filtresi ile Hedefli Öğrenme</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Türkiye&apos;nin 7 coğrafi bölgesini ayrı ayrı keşfedebilirsiniz. Sadece belirli bir bölgeyi
                öğrenmek mi istiyorsunuz? Filtre uygulayın ve o bölgeye odaklanın:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link href="/bolgeler/marmara" className="text-xs bg-gray-700/60 hover:bg-gray-700 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors">
                  Marmara
                </Link>
                <Link href="/bolgeler/ege" className="text-xs bg-gray-700/60 hover:bg-gray-700 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors">
                  Ege
                </Link>
                <Link href="/bolgeler/akdeniz" className="text-xs bg-gray-700/60 hover:bg-gray-700 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors">
                  Akdeniz
                </Link>
                <Link href="/bolgeler/karadeniz" className="text-xs bg-gray-700/60 hover:bg-gray-700 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors">
                  Karadeniz
                </Link>
                <Link href="/bolgeler/ic-anadolu" className="text-xs bg-gray-700/60 hover:bg-gray-700 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors">
                  İç Anadolu
                </Link>
                <Link href="/bolgeler/dogu-anadolu" className="text-xs bg-gray-700/60 hover:bg-gray-700 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors">
                  Doğu Anadolu
                </Link>
                <Link href="/bolgeler/guneydogu" className="text-xs bg-gray-700/60 hover:bg-gray-700 text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg transition-colors">
                  Güneydoğu Anadolu
                </Link>
              </div>
            </div>

            <div className="bg-gray-800/40 rounded-xl p-4 space-y-2">
              <h3 className="text-lg font-medium text-red-400">Plaka Kodu ve Tabela Bazlı Strateji</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Türkiye&apos;de konum tahmin etmenin en etkili yollarından biri plaka kodlarını ve yol tabelalarını
                okumaktır. TürkiyeGuessr bu stratejiyi öğrenmeniz için ideal bir ortam sunar. Detaylı rehberimize
                göz atın:{" "}
                <Link href="/blog/plaka-kodlarindan-il-tahmini" className="text-red-400 hover:text-red-300">
                  Plaka Kodlarından İl Tahmini
                </Link>
              </p>
            </div>

            <div className="bg-gray-800/40 rounded-xl p-4 space-y-2">
              <h3 className="text-lg font-medium text-red-400">Türkçe İçerik ve Şehir Rehberleri</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Geotastic tamamen İngilizce/Almanca arayüze sahipken, TürkiyeGuessr %100 Türkçe&apos;dir. Üstelik
                her şehir için detaylı rehberler sunuyoruz — sadece oyun değil, aynı zamanda bir keşif platformu.{" "}
                <Link href="/sehirler" className="text-red-400 hover:text-red-300">
                  Şehir rehberlerine göz atın
                </Link>{" "}
                ve{" "}
                <Link href="/sehirler/fatih-istanbul" className="text-red-400 hover:text-red-300">
                  Sultanahmet
                </Link>,{" "}
                <Link href="/sehirler/kaleici-antalya" className="text-red-400 hover:text-red-300">
                  Kaleiçi
                </Link>,{" "}
                <Link href="/sehirler/goreme-nevsehir" className="text-red-400 hover:text-red-300">
                  Ürgüp
                </Link>{" "}
                gibi popüler lokasyonları keşfedin.
              </p>
            </div>
          </div>
        </section>

        {/* Popüler TürkiyeGuessr Lokasyonları */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Popüler TürkiyeGuessr Lokasyonları</h2>
          <p className="text-gray-300 leading-relaxed">
            TürkiyeGuessr&apos;da keşfedebileceğiniz en popüler lokasyonlardan bazıları:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link href="/sehirler/fatih-istanbul" className="bg-gray-800/40 rounded-xl p-4 hover:bg-gray-800/60 transition-colors group">
              <h3 className="text-base font-medium text-white group-hover:text-red-400 transition-colors">Sultanahmet, İstanbul</h3>
              <p className="text-gray-400 text-sm mt-1">Tarihi yarımada, Ayasofya ve Sultanahmet Camii</p>
            </Link>
            <Link href="/sehirler/kaleici-antalya" className="bg-gray-800/40 rounded-xl p-4 hover:bg-gray-800/60 transition-colors group">
              <h3 className="text-base font-medium text-white group-hover:text-red-400 transition-colors">Kaleiçi, Antalya</h3>
              <p className="text-gray-400 text-sm mt-1">Akdeniz&apos;in incisi, dar sokaklar</p>
            </Link>
            <Link href="/sehirler/goreme-nevsehir" className="bg-gray-800/40 rounded-xl p-4 hover:bg-gray-800/60 transition-colors group">
              <h3 className="text-base font-medium text-white group-hover:text-red-400 transition-colors">Ürgüp, Nevşehir</h3>
              <p className="text-gray-400 text-sm mt-1">Kapadokya&apos;nın kapısı, peri bacaları</p>
            </Link>
            <Link href="/sehirler/uzungol-trabzon" className="bg-gray-800/40 rounded-xl p-4 hover:bg-gray-800/60 transition-colors group">
              <h3 className="text-base font-medium text-white group-hover:text-red-400 transition-colors">Uzungöl, Trabzon</h3>
              <p className="text-gray-400 text-sm mt-1">Karadeniz&apos;in gizli cenneti</p>
            </Link>
            <Link href="/sehirler/halfeti-sanliurfa" className="bg-gray-800/40 rounded-xl p-4 hover:bg-gray-800/60 transition-colors group">
              <h3 className="text-base font-medium text-white group-hover:text-red-400 transition-colors">Halfeti, Şanlıurfa</h3>
              <p className="text-gray-400 text-sm mt-1">Batık şehir ve siyah güller</p>
            </Link>
            <Link href="/sehirler/oludeniz-mugla" className="bg-gray-800/40 rounded-xl p-4 hover:bg-gray-800/60 transition-colors group">
              <h3 className="text-base font-medium text-white group-hover:text-red-400 transition-colors">Ölüdeniz, Muğla</h3>
              <p className="text-gray-400 text-sm mt-1">Turkuaz lagün ve yamaç paraşütü</p>
            </Link>
          </div>
        </section>

        {/* Sonuç */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-white">Sonuç: Hangisini Seçmeli?</h2>
          <p className="text-gray-300 leading-relaxed">
            Dünya genelinde coğrafya keşfi ve ileri challenge modları arıyorsanız Geotastic
            iyi bir seçenek. Ama amacınız <strong>Türkiye coğrafyasını öğrenmek</strong>,
            arkadaşlarınızla Türkçe bir ortamda oynamak ve kayıt derdi olmadan hemen başlamaksa,
            TürkiyeGuessr sizin için tasarlandı.
          </p>
          <p className="text-gray-300 leading-relaxed">
            İkisini de deneyip kendi kararınızı verebilirsiniz — ama Türkiye odaklı bir deneyim
            için TürkiyeGuessr&apos;ın sunduğu 142+ lokasyon ve Türkçe içerik farkı açık.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center py-6 space-y-3">
          <h2 className="text-2xl font-bold text-white">Türkiye&apos;yi Ne Kadar Tanıyorsun?</h2>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Ücretsiz Oyna
          </Link>
        </section>

        <nav className="flex flex-wrap gap-3 pt-4 border-t border-gray-700/50">
          <Link href="/geoguessr-alternatifi" className="text-sm text-gray-400 hover:text-white transition-colors">
            GeoGuessr Alternatifi →
          </Link>
          <Link href="/ucretsiz-cografya-oyunu" className="text-sm text-gray-400 hover:text-white transition-colors">
            Ücretsiz Coğrafya Oyunu →
          </Link>
          <Link href="/blog/geoguessr-vs-turkiyeguessr" className="text-sm text-gray-400 hover:text-white transition-colors">
            GeoGuessr vs TürkiyeGuessr →
          </Link>
        </nav>

        {/* İlgili İçerikler */}
        <section className="space-y-4 pt-4 border-t border-gray-700/30">
          <h2 className="text-xl font-semibold text-red-400">İlgili İçerikler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/blog/geoguessr-vs-turkiyeguessr" className="text-gray-400 hover:text-white text-sm transition-colors">
              → GeoGuessr vs TürkiyeGuessr
            </Link>
            <Link href="/geoguessr-alternatifi" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Ücretsiz GeoGuessr Alternatifi
            </Link>
            <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-gray-400 hover:text-white text-sm transition-colors">
              → GeoGuessr Taktikleri ve İpuçları
            </Link>
            <Link href="/ucretsiz-cografya-oyunu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Ücretsiz Coğrafya Oyunu
            </Link>
            <Link href="/blog/turkiye-bolgeleri-rehberi" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye Bölgeleri Rehberi
            </Link>
            <Link href="/blog/sokaktan-sehir-nasil-taninir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Sokaktan Şehir Nasıl Tanınır?
            </Link>
            <Link href="/blog/plaka-kodlarindan-il-tahmini" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Plaka Kodlarından İl Tahmini
            </Link>
            <Link href="/sehirler" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Şehir Rehberleri
            </Link>
            <Link href="/bolgeler" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Bölge Sayfaları
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
