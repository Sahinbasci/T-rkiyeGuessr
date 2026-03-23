import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { getCityBySlug, getAllRegions } from "@/data/seoData";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Şehir Tahmin Oyunu — 142+ Türkiye Lokasyonu",
  description:
    "Sokak görünümünden hangi şehirdesin tahmin et! İstanbul, Antalya, Kapadokya ve 139+ lokasyon. Arkadaşlarınla yarış, ücretsiz oyna.",
  keywords: [
    "şehir tahmin oyunu",
    "şehir tahmin etme oyunu",
    "türkiye şehir bilmece",
    "konum tahmin oyunu",
    "sokak görünümü oyunu",
    "google maps tahmin oyunu",
    "street view oyunu türkiye",
    "yer tahmin etme oyunu",
    "yer tahmin oyunu",
    "şehir bulma oyunu",
    "il bulma oyunu",
    "il tahmin oyunu",
    "konum bulma oyunu",
    "sokak görünümü tahmin oyunu",
  ],
  alternates: { canonical: "/sehir-tahmin-oyunu", languages: { "tr-TR": "/sehir-tahmin-oyunu", "x-default": "/sehir-tahmin-oyunu" } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${SITE_URL}/sehir-tahmin-oyunu`,
    siteName: "TürkiyeGuessr",
    title: "Şehir Tahmin Oyunu — 142+ Türkiye Lokasyonu",
    description:
      "Sokak görünümünden hangi şehirdesin tahmin et! İstanbul, Antalya, Kapadokya ve 139+ lokasyon. Arkadaşlarınla yarış, ücretsiz oyna.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Şehir Tahmin Oyunu — 142+ Türkiye Lokasyonu - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Şehir Tahmin Oyunu — 142+ Türkiye Lokasyonu",
    description:
      "Sokak görünümünden hangi şehirdesin tahmin et! İstanbul, Antalya, Kapadokya ve 139+ lokasyon. Arkadaşlarınla yarış, ücretsiz oyna.",
  },
};

const CITY_SLUGS = [
  "fatih-istanbul", "kaleici-antalya", "goreme-nevsehir", "konak-izmir",
  "bodrum-mugla", "pamukkale-denizli", "alanya-antalya", "fethiye-mugla",
  "uzungol-trabzon", "artuklu-mardin", "safranbolu-karabuk", "side-antalya",
];

const POPULAR_CITIES = CITY_SLUGS
  .map((slug) => { const c = getCityBySlug(slug); return c ? { slug, name: c.district } : null; })
  .filter((c): c is { slug: string; name: string } => c !== null);

const REGIONS = getAllRegions().map((r) => ({
  slug: r.slug,
  name: r.name.replace(" Bölgesi", ""),
}));

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "TürkiyeGuessr — Şehir Tahmin Oyunu",
      url: `${SITE_URL}/sehir-tahmin-oyunu`,
      description:
        "Sokak görünümünden hangi şehirdesin tahmin et! İstanbul, Antalya, Kapadokya ve 139+ lokasyon. Arkadaşlarınla yarış, ücretsiz oyna.",
      applicationCategory: "GameApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "TRY",
      },
      inLanguage: "tr",
      browserRequirements: "Requires JavaScript. Requires HTML5.",
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Şehir tahmin oyununda başarılı olmak için ne yapmalıyım?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Plaka kodlarına, yol tabelalarına, mimari tarza ve bitki örtüsüne dikkat edin. Her şehrin kendine özgü görsel imzaları vardır — örneğin taş evler Mardin'i, beyaz badanalı evler Bodrum'u, çay tarlaları Rize'yi işaret eder.",
          },
        },
        {
          "@type": "Question",
          name: "Şehir tahmin oyunu ücretsiz mi?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Evet, TürkiyeGuessr tamamen ücretsizdir. Kayıt gerektirmez, abonelik ücreti yoktur ve tüm özellikler (multiplayer dahil) ücretsiz olarak sunulmaktadır.",
          },
        },
        {
          "@type": "Question",
          name: "Hangi şehirler oyunda yer alıyor?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "İstanbul, Antalya, İzmir, Trabzon, Mardin, Muğla, Nevşehir ve daha birçok ilden 142'den fazla özenle seçilmiş lokasyon bulunmaktadır. Hem büyükşehirler hem tarihi kasabalar temsil edilmektedir.",
          },
        },
        {
          "@type": "Question",
          name: "Şehir tahmin oyunu ile konum tahmin oyunu arasındaki fark nedir?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Şehir tahmin oyunu özellikle kentsel ipuçlarına (tabela, mimari, sokak dokusu) odaklanırken, konum tahmin oyunu daha geniş bir perspektifle kırsal alanlar dahil tüm coğrafi ipuçlarını kapsar.",
          },
        },
        {
          "@type": "Question",
          name: "Arkadaşlarımla birlikte şehir tahmin oyunu oynayabilir miyim?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Evet, multiplayer modda 2-8 kişilik odalar oluşturabilirsiniz. Oda kodunu arkadaşlarınızla paylaşarak aynı anda aynı lokasyonları tahmin edebilir ve en yüksek puanı kimin alacağını görebilirsiniz.",
          },
        },
      ],
    },
  ],
};

export default function SehirTahminOyunuPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Şehir Tahmin Oyunu", url: "/sehir-tahmin-oyunu" },
      ]}
    >
      <article className="space-y-10">
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Header */}
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Şehir Tahmin Oyunu — 142+ Türkiye Lokasyonu
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Google Sokak Görünümü&apos;nde rastgele bir noktaya düş, etrafına bak ve hangi
            şehirde olduğunu tahmin et. <strong className="text-gray-300">TürkiyeGuessr</strong> ile
            Türkiye&apos;nin 142&apos;den fazla küratörlü lokasyonunu keşfet — tamamen ücretsiz,
            kayıt gerektirmez. Yer tahmin etme oyunu olarak da bilinen bu format,
            il bulma oyununun sokak görünümü versiyonudur — Türkiye&apos;nin her köşesinden
            gerçek görüntülerle coğrafya bilgini test et.
          </p>
        </header>

        {/* Sokak Görünümü Nasıl Çalışır? */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">
            Sokak Görünümü Nasıl Çalışır?
          </h2>
          <p className="text-gray-400 leading-relaxed">
            Her turda Google Street View üzerinde Türkiye&apos;nin herhangi bir noktasına
            bırakılırsın. 360 derece etrafına bakabilir, sokakta ileri-geri hareket edebilir
            ve çevrendeki ipuçlarını inceleyebilirsin. Süren dolmadan haritada tahmini konumunu
            işaretleyip &quot;Tahmin Et&quot; butonuna basarsın. Gerçek konuma ne kadar yakınsan
            o kadar yüksek puan kazanırsın. Beş tur sonunda en yüksek puanı toplayan oyuncu galip gelir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Oyun iki farklı mod sunar: <strong className="text-gray-300">Urban (Yerleşim)</strong> modunda
            şehir merkezlerinde tabela ve plaka kodu gibi doğrudan ipuçları bulabilirsin;{" "}
            <strong className="text-gray-300">Geo (Coğrafya)</strong> modunda ise kırsal alanlarda
            bitki örtüsü, topoğrafya ve doğal yapıya göre konum çıkarımı yaparsın.
          </p>
        </section>

        {/* İpucu Türleri */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">İpucu Türleri</h2>
          <p className="text-gray-400 leading-relaxed">
            Şehir tahmin oyununda başarılı olmak için çevreni dikkatli gözlemlemelisin.
            İşte sana yardımcı olacak başlıca ipucu kategorileri:
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              {
                title: "Tabelalar",
                desc: "Yol tabelaları, mağaza isimleri ve belediye panoları doğrudan şehir adı verebilir.",
              },
              {
                title: "Mimari",
                desc: "Osmanlı eserleri, taş evler veya modern yapılar bölgeyi daraltır.",
              },
              {
                title: "Bitki Örtüsü",
                desc: "Zeytin ağaçları Ege, çay bahçeleri Karadeniz, çam ormanları Akdeniz işaret eder.",
              },
              {
                title: "Plaka Kodları",
                desc: "Araç plakalarındaki iki haneli il kodu şehri kesin olarak belirler.",
              },
              {
                title: "Coğrafi Şekiller",
                desc: "Dağ silüetleri, kıyı şeridi ve ova yapısı bölgeyi ortaya koyar.",
              },
              {
                title: "İklim İpuçları",
                desc: "Kar örtüsü, kuru toprak ya da yemyeşil doğa mevsim ve bölge bilgisi verir.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4"
              >
                <h3 className="font-semibold text-gray-200 text-sm">{item.title}</h3>
                <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Popüler Şehirler */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Popüler Şehirler</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;nin en bilinen destinasyonlarından sokak görünümleri seni bekliyor.
            Her şehrin kendine özgü dokusu, mimarisi ve atmosferi var.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {POPULAR_CITIES.map((city) => (
              <Link
                key={city.slug}
                href={`/sehirler/${city.slug}`}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-center text-sm text-gray-400 hover:text-white hover:border-red-500/30 transition-colors"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Bölgelere Göre Oyna */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Bölgelere Göre Oyna</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;nin 7 coğrafi bölgesinden birini seç ve o bölgeye özel
            lokasyonlarda şehir tahmin becerini test et.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {REGIONS.map((region) => (
              <Link
                key={region.slug}
                href={`/bolgeler/${region.slug}`}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-center text-sm text-gray-400 hover:text-white hover:border-red-500/30 transition-colors"
              >
                {region.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Şehir Tanıma Becerileri */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Şehir Tanıma Becerileri</h2>
          <p className="text-gray-400 leading-relaxed">
            Bir şehri sokak görünümünden tanımak, birden fazla duyusal ve bilişsel beceriyi aynı anda
            kullanmayı gerektirir. İyi bir şehir tahmincisi, öncelikle güçlü bir gözlem yeteneğine
            sahiptir: sokak genişliği, kaldırım taşı tipi, elektrik direkleri, çöp kutuları ve hatta
            duvar boyası renkleri gibi detayları fark eder. İkinci olarak, coğrafi bilgi birikimi
            kritiktir — Türkiye&apos;nin 81 ilinin plaka kodlarını bilmek, tek bir araç plakasıyla
            şehri kesinleştirmeyi sağlar.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Üçüncü beceri ise örüntü tanımadır. Deneyimli oyuncular, belirli bir zincir marketin
            tabelasını, belediye otobüsünün rengini veya cami minaresinin stilini görerek şehri
            daraltabilir. Dördüncü olarak, eliminasyon stratejisi önemlidir: göremediğin şeyler de
            ipucudur. Deniz yoksa iç bölgedesin, yüksek binalar yoksa muhtemelen küçük bir ilçedesin,
            kar yoksa Akdeniz veya Ege olabilir. Bu becerilerin tümü pratikle gelişir ve TürkiyeGuessr
            bu pratiği yapmanın en eğlenceli yoludur.
          </p>
        </section>

        {/* Türkiye'nin En Karakteristik 7 Şehri */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Türkiye&apos;nin En Karakteristik 7 Şehri</h2>
          <p className="text-gray-400 leading-relaxed">
            Bazı şehirler, sokak görünümünde anında tanınabilecek kadar güçlü bir görsel kimliğe sahiptir.
            İşte TürkiyeGuessr&apos;da karşılaşabileceğin en karakteristik 7 şehir:
          </p>
          <div className="space-y-3">
            {[
              {
                city: "Mardin",
                desc: "Mezopotamya ovasına bakan bal rengi taş evleri, dar sokakları ve düz damlı mimarisiyle Türkiye'nin en ayırt edici silüetine sahiptir. Minareler ve kilise kuleleri bir arada görülür.",
              },
              {
                city: "Safranbolu",
                desc: "UNESCO Dünya Mirası listesindeki Osmanlı konakları, cumbalı ahşap evler ve arnavut kaldırımlı sokaklar Safranbolu'yu benzersiz kılar. Çatı kiremitleri ve ahşap detaylar her kareden okunur.",
              },
              {
                city: "Bodrum",
                desc: "Beyaz badanalı evler, mavi kapı-pencere detayları ve dar sokaklar Ege'nin imzasıdır. Limanın her açısından görülebilen Bodrum Kalesi ise şehri kesinleştirir.",
              },
              {
                city: "Trabzon",
                desc: "Dik yamaçlara tırmanan binalar, yemyeşil tepeler ve sis bulutları Karadeniz'in en tanınmış şehrini ele verir. Hamsi restoranları ve çay bahçeleri kültürel ipuçları sunar.",
              },
              {
                city: "Göreme (Kapadokya)",
                desc: "Peri bacaları, kaya oyma oteller ve tüf kayadan yapılar dünyanın başka hiçbir yerinde bulunmaz. Balon uçuşları ve vadi manzaraları Kapadokya'nın imzasıdır.",
              },
              {
                city: "Antalya (Kaleiçi)",
                desc: "Roma dönemi surları, Osmanlı ahşap evleri ve modern marina bir arada. Hurma ağaçları, Akdeniz mavisi ve tarihi saat kulesi şehrin en bilinen görsel öğeleridir.",
              },
              {
                city: "İstanbul (Fatih)",
                desc: "Osmanlı camileri, Bizans surları, tramvay hatları ve yoğun insan trafiği bir arada. Boğaz manzarası, martılar ve vapur dumanları İstanbul'u her açıdan ele verir.",
              },
            ].map((item) => (
              <div
                key={item.city}
                className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4"
              >
                <h3 className="text-gray-200 font-medium">{item.city}</h3>
                <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sokak Detaylarından Şehir Çıkarma */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Sokak Detaylarından Şehir Çıkarma</h2>
          <p className="text-gray-400 leading-relaxed">
            Kentsel alanlarda şehir tahmini yapmak, kırsal alanlardan oldukça farklı bir strateji
            gerektirir. Şehirlerde ipuçları çok daha yoğundur: mağaza tabelaları, banka şubeleri,
            belediye logoları, toplu taşıma araçları ve sokak isimleri doğrudan bilgi verir.
            Örneğin bir belediye otobüsünün üzerindeki logo veya renk şeması şehri kesinleştirebilir.
            Marketlerin bölgesel zincirleri de önemli bir ipucudur — belirli zincirler yalnızca
            belirli bölgelerde faaliyet gösterir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Kırsal alanlarda ise ipuçları daha dolaylıdır ve doğaya dayalıdır. Tarım ürünleri,
            toprak rengi, yol kalitesi ve arazi yapısı bölgeyi daraltmak için kullanılır.
            Ancak kentsel ortamlarda dikkat etmen gereken detaylar farklıdır: kaldırım taşı
            desenleri (her belediye farklı tercih eder), sokak lambası tasarımları, çöp kutusu
            tipleri ve hatta reklam panolarındaki yerel işletme isimleri sana şehrin kimliğini
            fısıldar. Bu mikro detayları okumayı öğrenmek, şehir tahmin oyununda profesyonel
            seviyeye ulaşmanın anahtarıdır.
          </p>
        </section>

        {/* Şehir Tahmin Oyunlarının Faydaları */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Şehir Tahmin Oyunlarının Faydaları</h2>
          <p className="text-gray-400 leading-relaxed">
            Şehir tahmin oyunları yalnızca eğlenceli bir zaman geçirme aracı değil, aynı zamanda
            birçok bilişsel ve kültürel fayda sunar. İlk olarak, <strong className="text-gray-300">gözlem becerisi</strong> gelişir:
            çevrendeki küçük detayları fark etme yeteneğin günlük hayatta da güçlenir. İkinci
            olarak, <strong className="text-gray-300">mekansal zeka</strong> artar — haritada konum belirleme, mesafe tahmin
            etme ve yön bulma yeteneklerin keskinleşir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Üçüncü önemli fayda <strong className="text-gray-300">kültürel farkındalık</strong>tır. Farklı şehirlerin
            sokaklarını sanal olarak dolaşmak, Türkiye&apos;nin ne kadar çeşitli bir ülke olduğunu
            görsel olarak deneyimlemenizi sağlar. Güneydoğu&apos;nun taş mimarisi ile Karadeniz&apos;in
            ahşap evleri, Ege&apos;nin beyaz cepheleri ile İç Anadolu&apos;nun kerpiç yapıları
            arasındaki fark, ülkenin kültürel zenginliğini gözler önüne serer. Son olarak,
            multiplayer modda oynandığında <strong className="text-gray-300">sosyal etkileşim</strong> ve sağlıklı rekabet
            deneyimi yaşanır; arkadaşlarla veya aile bireyleriyle birlikte oynamak, ortak bir
            keşif deneyimi oluşturur.
          </p>
        </section>

        {/* SSS */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Sıkça Sorulan Sorular</h2>
          <div className="space-y-4">
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">Şehir tahmin oyununda başarılı olmak için ne yapmalıyım?</h3>
              <p className="text-gray-400 text-sm mt-2">
                Plaka kodlarına, yol tabelalarına, mimari tarza ve bitki örtüsüne dikkat edin. Her şehrin
                kendine özgü görsel imzaları vardır — örneğin taş evler Mardin&apos;i, beyaz badanalı evler
                Bodrum&apos;u, çay tarlaları Rize&apos;yi işaret eder.
              </p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">Şehir tahmin oyunu ücretsiz mi?</h3>
              <p className="text-gray-400 text-sm mt-2">
                Evet, TürkiyeGuessr tamamen ücretsizdir. Kayıt gerektirmez, abonelik ücreti yoktur ve tüm
                özellikler (multiplayer dahil) ücretsiz olarak sunulmaktadır.
              </p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">Hangi şehirler oyunda yer alıyor?</h3>
              <p className="text-gray-400 text-sm mt-2">
                İstanbul, Antalya, İzmir, Trabzon, Mardin, Muğla, Nevşehir ve daha birçok ilden
                142&apos;den fazla özenle seçilmiş lokasyon bulunmaktadır. Hem büyükşehirler hem
                tarihi kasabalar temsil edilmektedir.
              </p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">Şehir tahmin oyunu ile konum tahmin oyunu arasındaki fark nedir?</h3>
              <p className="text-gray-400 text-sm mt-2">
                Şehir tahmin oyunu özellikle kentsel ipuçlarına (tabela, mimari, sokak dokusu) odaklanırken,
                konum tahmin oyunu daha geniş bir perspektifle kırsal alanlar dahil tüm coğrafi ipuçlarını
                kapsar.
              </p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">Arkadaşlarımla birlikte şehir tahmin oyunu oynayabilir miyim?</h3>
              <p className="text-gray-400 text-sm mt-2">
                Evet, multiplayer modda 2-8 kişilik odalar oluşturabilirsiniz. Oda kodunu arkadaşlarınızla
                paylaşarak aynı anda aynı lokasyonları tahmin edebilir ve en yüksek puanı kimin alacağını
                görebilirsiniz.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8 space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Şehirleri Ne Kadar İyi Tanıyorsun?
          </h2>
          <p className="text-gray-400">
            Sokak görünümünde Türkiye&apos;yi keşfet, tahminini yap ve arkadaşlarınla yarış.
          </p>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Ücretsiz
          </Link>
          <p className="text-gray-600 text-sm">Kayıt yok. Ödeme yok. Sadece coğrafya.</p>
        </section>

        {/* İlgili İçerikler */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">İlgili İçerikler</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/nasil-oynanir"
              className="text-sm text-gray-400 hover:text-white underline transition-colors"
            >
              Nasıl Oynanır?
            </Link>
            <Link
              href="/sehirler"
              className="text-sm text-gray-400 hover:text-white underline transition-colors"
            >
              Tüm Şehirler
            </Link>
            <Link
              href="/bolgeler"
              className="text-sm text-gray-400 hover:text-white underline transition-colors"
            >
              Tüm Bölgeler
            </Link>
            <Link
              href="/nasil-oynanir"
              className="text-sm text-gray-400 hover:text-white underline transition-colors"
            >
              TürkiyeGuessr Rehberi
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
