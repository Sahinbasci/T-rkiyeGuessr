import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "GeoGuessr vs TürkiyeGuessr: Hangisi Daha İyi?",
  description:
    "GeoGuessr ve TürkiyeGuessr karşılaştırması. Fiyat, içerik, Türkiye odağı, multiplayer ve daha fazlası.",
  keywords: [
    "geoguessr vs turkiyeguessr",
    "geoguessr alternatifi",
    "geoguessr karşılaştırma",
    "türkiye harita oyunu",
    "ücretsiz geoguessr",
  ],
  alternates: { canonical: "/blog/geoguessr-vs-turkiyeguessr", languages: { "tr-TR": "/blog/geoguessr-vs-turkiyeguessr", "x-default": "/blog/geoguessr-vs-turkiyeguessr" } },
  openGraph: {
    type: "article",
    locale: "tr_TR",
    url: `${SITE_URL}/blog/geoguessr-vs-turkiyeguessr`,
    siteName: "TürkiyeGuessr",
    title: "GeoGuessr vs TürkiyeGuessr: Hangisi Daha İyi?",
    description:
      "GeoGuessr ve TürkiyeGuessr karşılaştırması. Fiyat, içerik, Türkiye odağı, multiplayer ve daha fazlası.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "GeoGuessr vs TürkiyeGuessr: Hangisi Daha İyi?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GeoGuessr vs TürkiyeGuessr: Hangisi Daha İyi?",
    description:
      "GeoGuessr ve TürkiyeGuessr karşılaştırması. Fiyat, içerik, Türkiye odağı, multiplayer ve daha fazlası.",
  },
};

export default function GeoguessrVsTurkiyeguessrPost() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "GeoGuessr vs TürkiyeGuessr: Hangisi Daha İyi?",
    datePublished: "2026-02-25",
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
      "GeoGuessr ve TürkiyeGuessr karşılaştırması. Fiyat, içerik, Türkiye odağı, multiplayer ve daha fazlası.",
    wordCount: 2300,
    mainEntityOfPage: `${SITE_URL}/blog/geoguessr-vs-turkiyeguessr`,
    image: `${SITE_URL}/og-image.png`,
  };

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: "GeoGuessr vs TürkiyeGuessr", url: "/blog/geoguessr-vs-turkiyeguessr" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="prose-custom space-y-8 max-w-3xl">
        <header>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <time dateTime="2026-02-25">25 Şubat 2026</time>
            <span>8 dk okuma</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            GeoGuessr vs TürkiyeGuessr: Detaylı Karşılaştırma
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Konum tahmin oyunları arasında doğru seçimi yapmak isteyenler için kapsamlı bir karşılaştırma.
          </p>
        </header>

        <figure className="my-8 rounded-xl overflow-hidden">
          <Image
            src="/images/blog/geoguessr-karsilastirma.jpg"
            alt="Istanbul Kapalicarsi ic mekan gorunumu"
            width={800}
            height={450}
            className="w-full h-auto rounded-xl"
            priority
          />
          <figcaption className="text-center text-sm text-gray-500 mt-2">Istanbul Kapalicarsi&apos;nin tarihi ic mekani</figcaption>
        </figure>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">GeoGuessr Nedir?</h2>
          <p className="text-gray-400 leading-relaxed">
            GeoGuessr, 2013 yılında İsveç&apos;te kurulan ve Google Street View panoramalarını kullanarak
            dünya genelinde konum tahmin etmeye dayanan popüler bir web oyunudur. Oyuncular rastgele bir
            sokak görünümüne bırakılır ve çevresindeki ipuçlarını kullanarak harita üzerinde konumlarını
            tahmin etmeye çalışır. Dünya genelinde milyonlarca oyuncuya sahip olan GeoGuessr, aylık
            abonelik modeliyle çalışır. Ücretsiz versiyonda sınırlı sayıda oyun hakkı bulunurken, tam
            erişim için ödeme gerektirir. Platform 100&apos;den fazla ülkeyi kapsar ancak bazı bölgelerde
            Street View kapsamı sınırlıdır.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">TürkiyeGuessr Nedir?</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, tamamen Türkiye&apos;ye odaklanan ücretsiz bir konum tahmin oyunudur. Türkiye&apos;nin
            81 ilinden özenle seçilmiş lokasyonlarla, oyuncular sokak görünümünde Türkiye coğrafyasını
            keşfederken eğlenceli bir deneyim yaşar. Kayıt gerektirmeden hemen oynanabilir, Türkçe
            arayüze sahiptir ve multiplayer desteği sayesinde arkadaşlarla birlikte oynanabilir.
            TürkiyeGuessr, Türkiye&apos;yi tanımak ve coğrafya bilgisini geliştirmek isteyenler için
            özel olarak tasarlanmıştır.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Karşılaştırma Tablosu</h2>
          <p className="text-gray-400 leading-relaxed">
            İki platformu temel özellikler açısından karşılaştırdığımızda ortaya şu tablo çıkar:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">Özellik</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">GeoGuessr</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-semibold">TürkiyeGuessr</th>
                </tr>
              </thead>
              <tbody className="text-gray-400">
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 px-4 font-medium text-gray-300">Fiyat</td>
                  <td className="py-3 px-4">Aylık abonelik (ücretli)</td>
                  <td className="py-3 px-4 text-green-400">Tamamen ücretsiz</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 px-4 font-medium text-gray-300">Kayıt</td>
                  <td className="py-3 px-4">Zorunlu</td>
                  <td className="py-3 px-4 text-green-400">Gerekmez</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 px-4 font-medium text-gray-300">Dil</td>
                  <td className="py-3 px-4">İngilizce</td>
                  <td className="py-3 px-4 text-green-400">Türkçe</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 px-4 font-medium text-gray-300">İçerik Odağı</td>
                  <td className="py-3 px-4">Dünya geneli</td>
                  <td className="py-3 px-4">Sadece Türkiye</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 px-4 font-medium text-gray-300">Türkiye Lokasyonları</td>
                  <td className="py-3 px-4">Sınırlı ve rastgele</td>
                  <td className="py-3 px-4 text-green-400">500+ özenle seçilmiş</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 px-4 font-medium text-gray-300">Multiplayer</td>
                  <td className="py-3 px-4">Var (ücretli)</td>
                  <td className="py-3 px-4 text-green-400">Var (ücretsiz, 8 kişi)</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 px-4 font-medium text-gray-300">Mobil Destek</td>
                  <td className="py-3 px-4">Uygulama mevcut</td>
                  <td className="py-3 px-4">Mobil tarayıcıdan oynanır</td>
                </tr>
                <tr className="border-b border-gray-700/50">
                  <td className="py-3 px-4 font-medium text-gray-300">Bölge Çeşitliliği</td>
                  <td className="py-3 px-4">100+ ülke</td>
                  <td className="py-3 px-4">7 bölge, 81 il</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Hangi Durumda Hangisi?</h2>
          <p className="text-gray-400 leading-relaxed">
            Her iki platform da kendi alanında güçlü. Hangisini seçeceğin tamamen ihtiyaçlarına bağlı.
            İşte bazı senaryolar:
          </p>
          <div className="space-y-3">
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">GeoGuessr Tercih Et:</h3>
              <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                <li>Dünya genelinde farklı ülkeleri keşfetmek istiyorsan</li>
                <li>Uluslararası yarışmalara katılmak istiyorsan</li>
                <li>İngilizce arayüzle sorunun yoksa</li>
                <li>Aylık abonelik ödemeyi göze alabiliyorsan</li>
              </ul>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">TürkiyeGuessr Tercih Et:</h3>
              <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                <li>Türkiye coğrafyasını derinlemesine öğrenmek istiyorsan</li>
                <li>Ücretsiz ve kayıt gerektirmeyen bir platform arıyorsan</li>
                <li>Türkçe arayüz sana daha uygunsa</li>
                <li>Arkadaşlarınla ücretsiz multiplayer oynamak istiyorsan</li>
                <li>Sınıfta coğrafya dersi için interaktif bir araç arıyorsan</li>
                <li>Türkiye&apos;nin 81 ilini sokak görünümünde tanımak istiyorsan</li>
              </ul>
            </div>
          </div>
          <p className="text-gray-400 leading-relaxed">
            GeoGuessr dünya genelinde geniş bir perspektif sunarken, TürkiyeGuessr Türkiye&apos;ye
            odaklanarak çok daha derin ve detaylı bir deneyim sağlar. Türkiye&apos;nin her köşesinden
            özenle seçilmiş lokasyonlar, bölgesel çeşitlilik ve Türkçe dil desteğiyle TürkiyeGuessr,
            Türkiye coğrafyasını öğrenmek için en ideal platformdur.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Fiyat Karşılaştırması</h2>
          <p className="text-gray-400 leading-relaxed">
            GeoGuessr&apos;ın ücretsiz versiyonu günlük sınırlı oyun hakkı sunar. Sınırsız oynamak için
            aylık abonelik gerekir. Bu da yılda ciddi bir harcama anlamına gelir. TürkiyeGuessr ise
            tamamen ücretsizdir: sınırsız oyun, sınırsız multiplayer, sınırsız eğlence. Hiçbir gizli
            maliyet yoktur. Kayıt bile gerekmez, tarayıcını aç ve oynamaya başla.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Multiplayer Deneyimi</h2>
          <p className="text-gray-400 leading-relaxed">
            Her iki platformda da çok oyunculu mod bulunur. GeoGuessr&apos;da multiplayer oynamak
            için hem sizin hem de rakiplerinizin ücretli aboneliğe sahip olması gerekir.
            TürkiyeGuessr&apos;da ise bir oda kodu paylaşarak 8 kişiye kadar ücretsiz multiplayer
            oynayabilirsiniz. Oda kurma süreci saniyeler içinde tamamlanır ve herkes anında katılabilir.
            Bu da TürkiyeGuessr&apos;ı arkadaş grupları ve sınıf etkinlikleri için ideal kılar.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">TürkiyeGuessr&apos;da Keşfedebileceğin Lokasyonlar</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, Türkiye&apos;nin en etkileyici lokasyonlarını sokak görünümünde keşfetmeni sağlar.
            İşte oynayarak gezebileceğin bazı öne çıkan noktalar:
          </p>
          <div className="space-y-3">
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">İstanbul&apos;un Tarihi Yarımadası</h3>
              <p className="text-gray-400 text-sm mb-2">
                Binlerce yıllık tarihi sokak aralarında keşfet. Osmanlı ve Bizans mirasının iç içe geçtiği
                bu bölgelerde her köşede farklı bir ipucu seni bekliyor.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/sehirler/fatih-istanbul" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Sultanahmet →
                </Link>
                <Link href="/sehirler/beyoglu-istanbul" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Beyoğlu →
                </Link>
                <Link href="/sehirler/kadikoy-istanbul" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Kadıköy →
                </Link>
              </div>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Kapadokya&apos;nın Peri Bacaları</h3>
              <p className="text-gray-400 text-sm mb-2">
                Dünyada eşi benzeri olmayan peribacaları ve kaya otelleri arasında yolunu bulmaya çalış.
                Kapadokya&apos;nın büyülü coğrafyasını sokak görünümünde deneyimle.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/sehirler/goreme-nevsehir" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Ürgüp →
                </Link>
              </div>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Akdeniz Sahilleri</h3>
              <p className="text-gray-400 text-sm mb-2">
                Turkuaz suları ve tarihi limanlarıyla Akdeniz kıyılarını keşfet. Antik kentlerden modern
                tatil beldelerine uzanan geniş bir coğrafyada tahmin becerilerini test et.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/sehirler/kaleici-antalya" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Kaleiçi →
                </Link>
                <Link href="/sehirler/oludeniz-mugla" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Ölüdeniz →
                </Link>
                <Link href="/sehirler/marmaris-mugla" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Marmaris →
                </Link>
              </div>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Karadeniz Yaylaları</h3>
              <p className="text-gray-400 text-sm mb-2">
                Yemyeşil yaylalar, ahşap evler ve sisli dağ yolları... Karadeniz&apos;in eşsiz atmosferini
                sokak görünümünde hisset ve bu benzersiz coğrafyayı tanı.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/sehirler/uzungol-trabzon" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Uzungöl →
                </Link>
              </div>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Güneydoğu&apos;nun Tarihi</h3>
              <p className="text-gray-400 text-sm mb-2">
                Mezopotamya&apos;nın kapısında binlerce yıllık tarihi yaşa. Batık şehirlerden taş evlere,
                Güneydoğu Anadolu&apos;nun zengin kültürel mirasını keşfet.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/sehirler/halfeti-sanliurfa" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Halfeti →
                </Link>
                <Link href="/sehirler/hasankeyf-batman" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Hasankeyf →
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Bölge Bazlı Karşılaştırma</h2>
          <p className="text-gray-400 leading-relaxed">
            GeoGuessr&apos;da Türkiye lokasyonları rastgele ve oldukça sınırlıdır. Genellikle büyük
            şehirlerin ana yollarına düşersiniz ve bölgesel çeşitlilik neredeyse yoktur.
            TürkiyeGuessr ise Türkiye&apos;nin 7 coğrafi bölgesinin tamamını kapsayarak her bölgeden
            özenle seçilmiş lokasyonlar sunar. Bölge filtresi sayesinde istediğin bölgeye odaklanabilir
            ve o bölgenin kendine özgü coğrafi ipuçlarını öğrenebilirsin.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Link href="/bolgeler/marmara" className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-3 text-center text-sm text-gray-300 hover:text-white hover:border-red-500/50 transition-colors">
              Marmara
            </Link>
            <Link href="/bolgeler/ege" className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-3 text-center text-sm text-gray-300 hover:text-white hover:border-red-500/50 transition-colors">
              Ege
            </Link>
            <Link href="/bolgeler/akdeniz" className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-3 text-center text-sm text-gray-300 hover:text-white hover:border-red-500/50 transition-colors">
              Akdeniz
            </Link>
            <Link href="/bolgeler/karadeniz" className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-3 text-center text-sm text-gray-300 hover:text-white hover:border-red-500/50 transition-colors">
              Karadeniz
            </Link>
            <Link href="/bolgeler/ic-anadolu" className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-3 text-center text-sm text-gray-300 hover:text-white hover:border-red-500/50 transition-colors">
              İç Anadolu
            </Link>
            <Link href="/bolgeler/dogu-anadolu" className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-3 text-center text-sm text-gray-300 hover:text-white hover:border-red-500/50 transition-colors">
              Doğu Anadolu
            </Link>
            <Link href="/bolgeler/guneydogu" className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-3 text-center text-sm text-gray-300 hover:text-white hover:border-red-500/50 transition-colors col-span-2 sm:col-span-1">
              Güneydoğu Anadolu
            </Link>
          </div>
          <p className="text-gray-400 leading-relaxed">
            Bu bölge bazlı yapı, TürkiyeGuessr&apos;ı sadece bir oyun değil, aynı zamanda Türkiye
            coğrafyasını sistematik olarak öğrenebileceğin bir eğitim aracı haline getirir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Sonuç</h2>
          <p className="text-gray-400 leading-relaxed">
            GeoGuessr ve TürkiyeGuessr farklı ihtiyaçlara hitap eden iki harika platformdur.
            Eğer amacın dünyayı gezmek ve farklı kültürleri keşfetmekse GeoGuessr iyi bir tercih
            olabilir. Ancak Türkiye&apos;yi derinlemesine tanımak, illeri ve bölgeleri öğrenmek,
            arkadaşlarınla ücretsiz yarışmak istiyorsan TürkiyeGuessr tam sana göre. Ücretsiz olması,
            Türkçe desteği ve Türkiye odaklı zengin içeriğiyle TürkiyeGuessr, Türkiye coğrafya
            tutkunları için vazgeçilmez bir platform olmaya devam ediyor.
          </p>
        </section>

        <section className="text-center py-6 space-y-3">
          <h2 className="text-2xl font-bold text-white">Hemen Dene, Farkı Gör!</h2>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Ücretsiz Oyna — Kayıt Gerektirmez!
          </Link>
        </section>

        <nav className="flex flex-wrap gap-3 pt-4 border-t border-gray-700/50">
          <Link href="/geoguessr-alternatifi" className="text-sm text-gray-400 hover:text-white transition-colors">
            GeoGuessr Alternatifi
          </Link>
          <Link href="/nasil-oynanir" className="text-sm text-gray-400 hover:text-white transition-colors">
            Nasıl Oynanır? →
          </Link>
          <Link href="/multiplayer" className="text-sm text-gray-400 hover:text-white transition-colors">
            Multiplayer Mod →
          </Link>
          <Link href="/bolgeler" className="text-sm text-gray-400 hover:text-white transition-colors">
            Tüm Bölgeler →
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
            <Link href="/blog/sokaktan-sehir-nasil-taninir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Sokaktan Şehir Nasıl Tanınır?
            </Link>
            <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-gray-400 hover:text-white text-sm transition-colors">
              → GeoGuessr Taktikleri ve İpuçları
            </Link>
            <Link href="/blog/geotastic-vs-turkiyeguessr" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Geotastic vs TürkiyeGuessr
            </Link>
            <Link href="/blog/turkiye-bolgeleri-rehberi" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye Bölgeleri Rehberi
            </Link>
            <Link href="/blog/plaka-kodlarindan-il-tahmini" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Plaka Kodlarından İl Tahmini
            </Link>
            <Link href="/blog/online-harita-tahmin-oyunlari" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Online Harita Tahmin Oyunları
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
