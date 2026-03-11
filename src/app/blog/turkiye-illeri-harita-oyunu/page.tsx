import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { getAllRegions, getUniqueProvinceCount } from "@/data/seoData";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Türkiye İlleri Harita Oyunu: 81 İli Keşfet",
  description:
    "Türkiye'nin 81 ilini harita üzerinde öğren. Sokak görünümünde illeri tanı, plaka kodlarını ezberle, coğrafyayı keşfet. Ücretsiz.",
  keywords: ["türkiye illeri harita oyunu", "81 il oyunu", "türkiye harita bilmece", "il plaka kodları oyunu"],
  alternates: { canonical: "/blog/turkiye-illeri-harita-oyunu" },
  openGraph: {
    type: "article",
    locale: "tr_TR",
    url: `${SITE_URL}/blog/turkiye-illeri-harita-oyunu`,
    siteName: "TürkiyeGuessr",
    title: "Türkiye İlleri Harita Oyunu: 81 İli Keşfet",
    description:
      "Türkiye'nin 81 ilini harita üzerinde öğren. Sokak görünümünde illeri tanı, plaka kodlarını ezberle, coğrafyayı keşfet. Ücretsiz.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Türkiye İlleri Harita Oyunu: 81 İli Keşfet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Türkiye İlleri Harita Oyunu: 81 İli Keşfet",
    description:
      "Türkiye'nin 81 ilini harita üzerinde öğren. Sokak görünümünde illeri tanı, plaka kodlarını ezberle, coğrafyayı keşfet. Ücretsiz.",
  },
};

export default function TurkiyeIlleriHaritaOyunuPost() {
  const regions = getAllRegions();
  const totalProvinces = getUniqueProvinceCount();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "Türkiye İlleri Harita Oyunu: 81 İli Keşfet",
    datePublished: "2026-02-10",
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
      "Türkiye'nin 81 ilini harita üzerinde öğren. Sokak görünümünde illeri tanı, plaka kodlarını ezberle, coğrafyayı keşfet. Ücretsiz.",
    mainEntityOfPage: `${SITE_URL}/blog/turkiye-illeri-harita-oyunu`,
    image: `${SITE_URL}/og-image.png`,
  };

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: "81 İl Harita Oyunu", url: "/blog/turkiye-illeri-harita-oyunu" },
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
            <span>5 dk okuma</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Türkiye İlleri Harita Oyunu
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            81 ili tanımanın en eğlenceli yolu: sokak görünümünde keşfet, haritada bul.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Neden Harita Oyunu?</h2>
          <p className="text-gray-400 leading-relaxed">
            Geleneksel harita ezberleme yöntemleri sıkıcı ve etkisiz. Oyunlaştırma (gamification) ile öğrenme hem daha kalıcı hem daha eğlenceli. TürkiyeGuessr, Türkiye&apos;nin sokak görünümlerini kullanarak illeri ve bölgeleri görsel olarak tanımanı sağlar — ezberlemek yerine deneyimleyerek öğrenirsin.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">TürkiyeGuessr&apos;da Kaç İl Var?</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr şu anda <strong className="text-gray-300">{totalProvinces} farklı ilden</strong> lokasyonlar sunuyor. Her bölgeden dengeli bir dağılım sağlanarak Türkiye&apos;nin coğrafi çeşitliliği yansıtılıyor. İşte bölgelere göre dağılım:
          </p>
          <div className="space-y-2">
            {regions.map((r) => {
              const provinces = new Set(r.cities.map((c) => c.province));
              return (
                <div key={r.slug} className="flex items-center justify-between bg-gray-800/40 border border-gray-700/30 rounded-lg px-4 py-2">
                  <Link href={`/bolgeler/${r.slug}`} className="text-sm text-gray-300 hover:text-red-400 transition-colors">
                    {r.name}
                  </Link>
                  <span className="text-xs text-gray-500">{provinces.size} il, {r.packageCount} lokasyon</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Plaka Kodları: En Güçlü İpucun</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;de her ilin benzersiz bir plaka kodu vardır. Sokak görünümünde araçların plakalarına bakarak hangi ilde olduğunu anında anlayabilirsin. İşte en sık karşılaşacağın kodlar:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            {[
              ["01", "Adana"], ["06", "Ankara"], ["07", "Antalya"], ["16", "Bursa"],
              ["34", "İstanbul"], ["35", "İzmir"], ["42", "Konya"], ["61", "Trabzon"],
            ].map(([code, city]) => (
              <div key={code} className="bg-gray-800/50 border border-gray-700/40 rounded-lg px-3 py-2 flex justify-between">
                <span className="text-red-400 font-bold">{code}</span>
                <span className="text-gray-400">{city}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Öğretmenler İçin</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, sınıfta coğrafya öğretmek için mükemmel bir araç. Öğrencilerinizle birlikte bir oda kurun ve dersi interaktif bir yarışmaya dönüştürün. Kayıt gerektirmediği için her öğrenci anında katılabilir. Multiplayer modda 8 kişiye kadar aynı anda oynayabilirsiniz.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">İlleri Tanımanın Pratik Yolları</h2>
          <p className="text-gray-400 leading-relaxed">
            81 ili birden ezberlemeye çalışmak bunaltıcı olabilir; bunun yerine sistematik bir yaklaşım
            benimse. Öncelikle her bölgedeki komşu illeri grup halinde öğren:{" "}
            <Link href="/bolgeler/marmara" className="text-red-400 hover:text-red-300 transition-colors">
              Marmara
            </Link>{" "}
            bölgesinde İstanbul, Kocaeli, Bursa ve Tekirdağ bir küme oluşturur. İl merkezlerini tanımak da
            kritik önem taşır; çünkü sokak görünümü lokasyonlarının büyük çoğunluğu il merkezlerinden veya
            ilçe merkezlerinden gelir.{" "}
            <Link href="/sehirler/beyoglu-istanbul" className="text-red-400 hover:text-red-300 transition-colors">
              Beyoğlu
            </Link>,{" "}
            <Link href="/sehirler/selcuklu-konya" className="text-red-400 hover:text-red-300 transition-colors">
              Selçuklu (Konya)
            </Link>{" "}
            ve{" "}
            <Link href="/sehirler/cesme-izmir" className="text-red-400 hover:text-red-300 transition-colors">
              Çeşme (İzmir)
            </Link>{" "}
            gibi popüler ilçelerin görsel özelliklerini bir kez öğrendiğinde, benzer lokasyonları anında
            tanımaya başlarsın. Ayrıca il sınırlarını harita üzerinde takip ederek hangi illerin birbirine
            komşu olduğunu öğrenmek, tahminlerini daraltmanda büyük avantaj sağlar.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Büyükşehirler ve Küçük İller Arasındaki Farklar</h2>
          <p className="text-gray-400 leading-relaxed">
            Street View&apos;da büyükşehirler ile küçük iller arasında belirgin görsel farklar vardır
            ve bu farkları tanımak il tahmininde güçlü bir araçtır.{" "}
            <Link href="/sehirler/beyoglu-istanbul" className="text-red-400 hover:text-red-300 transition-colors">
              İstanbul
            </Link>,{" "}
            <Link href="/sehirler/cesme-izmir" className="text-red-400 hover:text-red-300 transition-colors">
              İzmir
            </Link>{" "}
            gibi metropollerde geniş bulvarlar, modern AVM&apos;ler, zincir mağaza tabelaları ve yoğun
            trafik görürsün. Buna karşın{" "}
            <Link href="/sehirler/safranbolu-karabuk" className="text-red-400 hover:text-red-300 transition-colors">
              Safranbolu (Karabük)
            </Link>,{" "}
            <Link href="/sehirler/akdamar-adasi-van" className="text-red-400 hover:text-red-300 transition-colors">
              Van
            </Link>{" "}
            veya{" "}
            <Link href="/sehirler/artuklu-mardin" className="text-red-400 hover:text-red-300 transition-colors">
              Mardin
            </Link>{" "}
            gibi küçük illerde dar sokaklar, geleneksel mimari ve yerel esnaf tabelaları baskındır.
            Kentsel dönüşüm projeleri de önemli bir ipucudur: TOKİ bloklarının yoğun olduğu bölgeler
            genellikle{" "}
            <Link href="/bolgeler/dogu-anadolu" className="text-red-400 hover:text-red-300 transition-colors">
              Doğu
            </Link>{" "}
            ve{" "}
            <Link href="/bolgeler/ic-anadolu" className="text-red-400 hover:text-red-300 transition-colors">
              İç Anadolu
            </Link>{" "}
            illerinin çeperlerinde bulunur. Bu kentsel doku farklılıklarını tanımak, henüz plaka veya
            tabela görmeden bile hangi ölçekte bir şehirde olduğunu anlamana yardımcı olur.
          </p>
        </section>

        <section className="text-center py-6 space-y-3">
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            81 İli Keşfet — Ücretsiz Oyna!
          </Link>
        </section>

        <nav className="flex flex-wrap gap-3 pt-4 border-t border-gray-700/50">
          <Link href="/sehirler" className="text-sm text-gray-400 hover:text-white transition-colors">
            Tüm Şehirler →
          </Link>
          <Link href="/blog/turkiye-cografya-quiz" className="text-sm text-gray-400 hover:text-white transition-colors">
            Coğrafya Quiz →
          </Link>
        </nav>

        {/* İlgili İçerikler */}
        <section className="space-y-4 pt-4 border-t border-gray-700/30">
          <h2 className="text-xl font-semibold text-red-400">İlgili İçerikler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/sehirler" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Tüm Şehirler
            </Link>
            <Link href="/bolgeler" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Tüm Bölgeler
            </Link>
            <Link href="/turkiye-harita-oyunu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye Harita Oyunu
            </Link>
            <Link href="/blog/plaka-kodlarindan-il-tahmini" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Plaka Kodlarından İl Tahmini
            </Link>
            <Link href="/blog/turkiyenin-en-zor-10-lokasyonu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → En Zor 10 Lokasyon
            </Link>
            <Link href="/blog/sokaktan-sehir-nasil-taninir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Sokaktan Şehir Nasıl Tanınır?
            </Link>
            <Link href="/sehirler/beyoglu-istanbul" className="text-gray-400 hover:text-white text-sm transition-colors">
              → İstanbul - Beyoğlu Lokasyonu
            </Link>
            <Link href="/sehirler/selcuklu-konya" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Konya - Selçuklu Lokasyonu
            </Link>
            <Link href="/sehirler/safranbolu-karabuk" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Safranbolu Lokasyonu
            </Link>
            <Link href="/bolgeler/akdeniz" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Akdeniz Bölgesi Rehberi
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
