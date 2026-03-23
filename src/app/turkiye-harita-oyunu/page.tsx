import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { getCityBySlug, getAllRegions } from "@/data/seoData";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Türkiye Harita Oyunu — Ücretsiz Online Oyna",
  description:
    "Türkiye haritasında sokak görünümünden konum tahmin et. 142+ gerçek lokasyon, 7 bölge, multiplayer mod. Kayıt gerektirmez, tamamen ücretsiz harita oyunu!",
  keywords: [
    "türkiye harita oyunu",
    "harita oyunu online",
    "türkiye harita tahmin",
    "ücretsiz harita oyunu",
    "türkiye coğrafya oyunu",
    "google maps tahmin oyunu",
    "harita bilmece",
    "harita tahmin oyunu",
    "harita kapmaca",
    "türkiye haritası oyunu",
  ],
  alternates: { canonical: "/turkiye-harita-oyunu", languages: { "tr-TR": "/turkiye-harita-oyunu", "x-default": "/turkiye-harita-oyunu" } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${SITE_URL}/turkiye-harita-oyunu`,
    siteName: "TürkiyeGuessr",
    title: "Türkiye Harita Oyunu — Ücretsiz Online Oyna",
    description:
      "Türkiye haritasında sokak görünümünden konum tahmin et. 142+ gerçek lokasyon, 7 bölge, multiplayer mod. Kayıt gerektirmez, tamamen ücretsiz harita oyunu!",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Türkiye Harita Oyunu — Ücretsiz Online Oyna - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Türkiye Harita Oyunu — Ücretsiz Online Oyna",
    description:
      "Türkiye haritasında sokak görünümünden konum tahmin et. 142+ gerçek lokasyon, 7 bölge, multiplayer mod. Kayıt gerektirmez, tamamen ücretsiz harita oyunu!",
  },
};

export default function TurkiyeHaritaOyunuPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "TürkiyeGuessr - Türkiye Harita Oyunu",
        url: `${SITE_URL}/turkiye-harita-oyunu`,
        applicationCategory: "GameApplication",
        operatingSystem: "Web",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "TRY",
        },
        inLanguage: "tr",
        description:
          "Türkiye haritasında sokak görünümünden konum tahmin et. 142+ gerçek lokasyon, 7 bölge, multiplayer mod. Kayıt gerektirmez, tamamen ücretsiz harita oyunu!",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Anasayfa",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Türkiye Harita Oyunu",
            item: `${SITE_URL}/turkiye-harita-oyunu`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "Harita oyunu oynayarak coğrafya öğrenilebilir mi?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Evet, araştırmalar interaktif harita oyunlarının geleneksel ezbere dayalı yöntemlere kıyasla coğrafi bilgiyi %40'a kadar daha kalıcı hale getirdiğini göstermektedir. TürkiyeGuessr gibi sokak görünümü tabanlı oyunlar, görsel hafızayı ve mekansal muhakemeyi aktif olarak kullanarak öğrenmeyi pekiştirir.",
            },
          },
          {
            "@type": "Question",
            name: "Türkiye harita oyunu hangi yaş grubuna uygundur?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "TürkiyeGuessr her yaş grubuna uygundur. İlkokul öğrencileri bölge tanıma pratiği yapabilirken, ortaokul ve lise öğrencileri sınav hazırlığı için kullanabilir. Yetişkinler ise genel kültür ve eğlence amaçlı oynayabilir.",
            },
          },
          {
            "@type": "Question",
            name: "Harita oyununda kaç lokasyon var?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "TürkiyeGuessr'da Türkiye'nin 7 coğrafi bölgesinden özenle seçilmiş 142'den fazla gerçek Google Sokak Görünümü lokasyonu bulunmaktadır. Lokasyonlar düzenli olarak güncellenmektedir.",
            },
          },
          {
            "@type": "Question",
            name: "Türkiye harita oyunu mobilde oynanabilir mi?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Evet, TürkiyeGuessr tamamen mobil uyumludur. Herhangi bir uygulama indirmenize gerek yoktur; telefon, tablet veya bilgisayarınızın tarayıcısından doğrudan oynayabilirsiniz.",
            },
          },
          {
            "@type": "Question",
            name: "Öğretmenler harita oyununu derslerinde nasıl kullanabilir?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Öğretmenler TürkiyeGuessr'ı sınıf içi yarışma olarak kullanabilir, bölge bazlı ödevler verebilir veya multiplayer modda takım çalışması etkinlikleri düzenleyebilir. Ücretsiz olması okul bütçesine ek yük getirmez.",
            },
          },
        ],
      },
    ],
  };

  const regions = getAllRegions().map((r) => ({ name: r.name, slug: r.slug }));

  const LOCATION_SLUGS = [
    "fatih-istanbul", "kaleici-antalya", "goreme-nevsehir", "alsancak-izmir",
    "uzungol-trabzon", "pamukkale-denizli", "safranbolu-karabuk", "artuklu-mardin",
  ];
  const popularLocations = LOCATION_SLUGS
    .map((slug) => { const c = getCityBySlug(slug); return c ? { name: c.locationName, slug } : null; })
    .filter((c): c is { name: string; slug: string } => c !== null);

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Türkiye Harita Oyunu", url: "/turkiye-harita-oyunu" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="space-y-10">
        {/* H1 + Intro */}
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Türkiye Harita Oyunu — Ücretsiz Online Oyna
          </h1>
          <p className="text-gray-400 mt-3 text-lg leading-relaxed">
            <strong className="text-gray-300">TürkiyeGuessr</strong>, Türkiye haritası üzerinde
            gerçek sokak görünümü panoramalarından konum tahmin ettiğin ücretsiz bir harita oyunudur.
            Google Street View teknolojisiyle Türkiye&apos;nin dört bir yanını keşfet; İstanbul&apos;un
            tarihi sokaklarından Kapadokya&apos;nın büyüleyici vadilerine, Ege&apos;nin sahil
            kasabalarından Karadeniz&apos;in yaylalarına kadar 142&apos;den fazla özenle seçilmiş
            lokasyonu harita üzerinde bulmaya çalış. Kayıt gerektirmez, tamamen ücretsizdir ve
            tarayıcından anında oynayabilirsin. Harita kapmaca tarzı oyunların modern
            versiyonu olan TürkiyeGuessr, Google sokak görünümü üzerinden oynanan interaktif
            bir harita yapboz deneyimi sunar.
          </p>
        </header>

        {/* Nasıl Oynanır */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Nasıl Oynanır?</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye harita oyununu oynamak son derece basit. Dört adımda başla:
          </p>
          <ol className="space-y-3">
            {[
              {
                step: "1",
                title: "Panoramayı İncele",
                desc: "Karşına çıkan 360 derece sokak görünümünü dikkatle incele. Tabelalar, doğa, mimari ve yol yapısı gibi ipuçlarına bak.",
              },
              {
                step: "2",
                title: "Haritada Tahmin Et",
                desc: "İpuçlarını değerlendirdikten sonra Türkiye haritası üzerinde tahmini konumunu işaretle.",
              },
              {
                step: "3",
                title: "Puanını Gör",
                desc: "Gerçek konum ile tahmininin arasındaki mesafe hesaplanır. Ne kadar yakınsan o kadar çok puan kazanırsın.",
              },
              {
                step: "4",
                title: "5 Tur, Toplam Skor",
                desc: "Her oyun 5 turdan oluşur. Tüm turların puanları toplanarak final skorun belirlenir.",
              },
            ].map((item) => (
              <li
                key={item.step}
                className="flex gap-4 bg-gray-800/40 border border-gray-700/30 rounded-lg p-4"
              >
                <span className="flex-shrink-0 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </span>
                <div>
                  <h3 className="text-gray-200 font-medium">{item.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Oyun Modları */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Oyun Modları</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr farklı oyun modlarıyla her seviyeden oyuncuya hitap eder.
            Tek başına pratik yapabilir ya da arkadaşlarınla yarışabilirsin:
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              {
                title: "Klasik Mod",
                desc: "Tüm Türkiye havuzundan rastgele 5 lokasyon. Coğrafya bilgini sına.",
              },
              {
                title: "Multiplayer",
                desc: "Arkadaşlarınla aynı anda aynı lokasyonları tahmin et. En yüksek skoru kim alacak?",
              },
              {
                title: "Bölge Modu",
                desc: "Sadece belirli bir coğrafi bölgeden lokasyonlar. Uzmanlığını derinleştir.",
              },
            ].map((mode) => (
              <div
                key={mode.title}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4"
              >
                <h3 className="text-gray-200 font-medium">{mode.title}</h3>
                <p className="text-gray-500 text-sm mt-2">{mode.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 7 Coğrafi Bölge */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">7 Coğrafi Bölge</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;nin her coğrafi bölgesinden özenle seçilmiş lokasyonlar bulunur.
            Bölge sayfalarını ziyaret ederek her bölgenin kendine özgü coğrafi özelliklerini,
            lokasyon sayısını ve il dağılımını inceleyebilirsin:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {regions.map((region) => (
              <Link
                key={region.slug}
                href={`/bolgeler/${region.slug}`}
                className="text-sm text-gray-400 hover:text-white bg-gray-800/40 border border-gray-700/30 rounded-lg px-3 py-2.5 transition-colors text-center"
              >
                {region.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Popüler Lokasyonlar */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Popüler Lokasyonlar</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;nin en bilinen ve en zorlu lokasyonlarından bazıları.
            Her birinin detay sayfasında o konuma ait ipuçları ve coğrafi bilgiler bulabilirsin:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {popularLocations.map((loc) => (
              <Link
                key={loc.slug}
                href={`/sehirler/${loc.slug}`}
                className="text-sm text-gray-400 hover:text-white bg-gray-800/40 border border-gray-700/30 rounded-lg px-3 py-2.5 transition-colors text-center"
              >
                {loc.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Harita Oyunlarıyla Coğrafya Öğrenmek */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Harita Oyunlarıyla Coğrafya Öğrenmek</h2>
          <p className="text-gray-400 leading-relaxed">
            Geleneksel coğrafya eğitimi genellikle harita üzerinde illeri ezberlemeye ve ders kitaplarındaki
            statik görsellere dayanır. Ancak interaktif harita oyunları bu yaklaşımı tamamen değiştirmektedir.
            Sokak görünümü tabanlı harita oyunları, öğrencinin pasif bir alıcı olmak yerine aktif bir keşifçi
            rolüne girmesini sağlar. Oyuncu, karşısındaki panoramik görüntüdeki ipuçlarını analiz ederek
            mekansal muhakeme becerisini geliştirir. Bu süreç, beynin görsel hafıza, yön bulma ve coğrafi
            çıkarım yeteneklerini aynı anda çalıştırır; bu da bilginin çok daha kalıcı olmasını sağlar.
          </p>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr gibi harita oyunlarının en büyük avantajı, öğrenme sürecini oyunlaştırmasıdır.
            Puan sistemi, turlar ve arkadaşlarla yarışma mekanizması, coğrafya çalışmasını sıkıcı bir ödev
            olmaktan çıkarıp heyecanlı bir deneyime dönüştürür. Her yanlış tahmin, yeni bir şey öğrenme
            fırsatıdır: doğru konum gösterildiğinde oyuncu, o bölgenin bitki örtüsünü, mimarisini ve
            topoğrafyasını zihninde otomatik olarak kodlar. Araştırmalar, bu tür deneyimsel öğrenmenin
            geleneksel ezbere kıyasla bilgiyi daha uzun süre akılda tutmayı sağladığını ortaya koymaktadır.
          </p>
        </section>

        {/* Türkiye Haritasını Tanımanın 5 Yolu */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Türkiye Haritasını Tanımanın 5 Yolu</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye haritasında usta olmak için şu beş stratejiyi uygulayabilirsin:
          </p>
          <ol className="space-y-4 text-gray-400 leading-relaxed">
            <li className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">1. Bölge Sınırlarını Öğren</h3>
              <p className="text-sm mt-1">
                Türkiye 7 coğrafi bölgeye ayrılır ve her birinin kendine özgü sınırları vardır.
                Marmara Bölgesi kuzeybatıda, Karadeniz kuzeyde dar bir şerit halinde uzanır,
                Doğu Anadolu en geniş yüzölçümüne sahipken Güneydoğu Anadolu en küçük bölgedir.
                Bu sınırları zihninde canlandırmak, tahminin bölge düzeyinde bile doğru olmasını sağlar.
              </p>
            </li>
            <li className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">2. Kıyı Şeritlerini Tanı</h3>
              <p className="text-sm mt-1">
                Türkiye üç tarafı denizlerle çevrili bir yarımadadır. Karadeniz kıyısı dik ve yeşil,
                Ege kıyısı girintili çıkıntılı ve zeytinliklerle dolu, Akdeniz kıyısı ise uzun kumlu
                plajlar ve narenciye bahçeleriyle karakterizedir. Kıyı panoramasını gördüğünde hangi
                denize baktığını ayırt etmek büyük avantaj sağlar.
              </p>
            </li>
            <li className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">3. Dağ Silüetlerini Ezberle</h3>
              <p className="text-sm mt-1">
                Kaçkar Dağları Karadeniz&apos;in arkasında yükselir, Toros Dağları Akdeniz boyunca uzanır,
                Ağrı Dağı Doğu Anadolu&apos;nun simgesidir. Dağ silüetleri, panoramada ufuk çizgisinde
                göründüğünde bölgeyi daraltmanın en etkili yollarından biridir.
              </p>
            </li>
            <li className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">4. Tarım Ürünlerinden Bölge Çıkar</h3>
              <p className="text-sm mt-1">
                Çay tarlaları Rize ve Artvin&apos;i, fındık bahçeleri Giresun ve Ordu&apos;yu,
                pamuk tarlaları Çukurova&apos;yı, üzüm bağları Kapadokya ve Ege&apos;yi işaret eder.
                Panoramadaki tarım alanları, harita üzerinde konumu daraltmanın doğal bir yoludur.
              </p>
            </li>
            <li className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">5. Yerleşim Dokusu ve Mimariyi Oku</h3>
              <p className="text-sm mt-1">
                Mardin&apos;in taş evleri, Safranbolu&apos;nun Osmanlı konakları, Bodrum&apos;un beyaz
                badanalı evleri, Karadeniz&apos;in ahşap yığma evleri — her bölgenin mimari dokusu
                farklıdır. Yapı malzemesi ve çatı tipi bile bölge hakkında güçlü ipuçları verir.
              </p>
            </li>
          </ol>
        </section>

        {/* Okulda Harita Oyunu Kullanımı */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Okulda Harita Oyunu Kullanımı</h2>
          <p className="text-gray-400 leading-relaxed">
            Giderek daha fazla öğretmen, coğrafya derslerini canlandırmak için interaktif harita oyunlarını
            müfredatlarına entegre etmektedir. TürkiyeGuessr, projeksiyon veya akıllı tahta üzerinden
            tüm sınıfa gösterilebilir; öğretmen bir turu başlatır ve öğrenciler el kaldırarak ya da
            takımlar halinde tahmin yapar. Bölge modu sayesinde dersin konusuyla doğrudan ilişkili
            lokasyonlar seçilebilir — örneğin Karadeniz Bölgesi işleniyorsa yalnızca Karadeniz
            lokasyonları üzerinden oyun oynanabilir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Multiplayer modu ise uzaktan eğitim dönemlerinde de etkili bir araç olarak öne çıkar.
            Öğretmen bir oda kodu paylaşarak öğrencilerin aynı anda aynı lokasyonları tahmin etmesini
            sağlayabilir. Bu yarışma formatı, öğrencilerin motivasyonunu artırır ve dersin etkileşimli
            olmasını garantiler. Ev ödevlerinde de bölge bazlı oturumlar verilebilir; öğrenciler
            oynadıktan sonra hangi ipuçlarını kullandıklarını kısa bir paragrafla açıklayarak hem
            coğrafya hem yazma becerilerini geliştirebilir.
          </p>
        </section>

        {/* Türkiye'nin Coğrafi Yapısı */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Türkiye&apos;nin Coğrafi Yapısı</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye, Asya ve Avrupa kıtalarını birbirine bağlayan eşsiz bir coğrafi konuma sahiptir.
            783.562 km&sup2; yüzölçümüyle üç tarafı denizlerle çevrili bir yarımada olan Türkiye,
            kuzeyde Karadeniz, batıda Ege Denizi ve güneyde Akdeniz ile sınırlıdır. Bu benzersiz
            konum, ülkeye olağanüstü bir iklim ve bitki örtüsü çeşitliliği kazandırır: Karadeniz
            kıyılarında yemyeşil ormanlar, İç Anadolu&apos;da geniş step bozkırları, Akdeniz&apos;de
            makiler ve Doğu Anadolu&apos;da sert karasal iklim bir arada bulunur.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;nin topoğrafyası da son derece çeşitlidir. Ortalama yükseltisi 1.132 metre
            olan ülke, Ağrı Dağı&apos;nın 5.137 metrelik zirvesinden Hatay&apos;ın deniz seviyesindeki
            ovalarına kadar geniş bir yükselti aralığına sahiptir. Bu coğrafi çeşitlilik, harita
            oyunlarında her turun farklı bir meydan okuma sunmasını sağlar — bir turda Kapadokya&apos;nın
            peri bacaları arasında olabilirken, bir sonraki turda Karadeniz&apos;in sisli yaylalarında
            bulabilirsin kendini. İşte bu zenginlik, Türkiye harita oyununu dünya üzerindeki en
            ilgi çekici coğrafya deneyimlerinden biri haline getirir.
          </p>
        </section>

        {/* SSS */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Sıkça Sorulan Sorular</h2>
          <div className="space-y-4">
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">Harita oyunu oynayarak coğrafya öğrenilebilir mi?</h3>
              <p className="text-gray-400 text-sm mt-2">
                Evet, araştırmalar interaktif harita oyunlarının geleneksel ezbere dayalı yöntemlere kıyasla
                coğrafi bilgiyi %40&apos;a kadar daha kalıcı hale getirdiğini göstermektedir. TürkiyeGuessr gibi
                sokak görünümü tabanlı oyunlar, görsel hafızayı ve mekansal muhakemeyi aktif olarak kullanarak
                öğrenmeyi pekiştirir.
              </p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">Türkiye harita oyunu hangi yaş grubuna uygundur?</h3>
              <p className="text-gray-400 text-sm mt-2">
                TürkiyeGuessr her yaş grubuna uygundur. İlkokul öğrencileri bölge tanıma pratiği yapabilirken,
                ortaokul ve lise öğrencileri sınav hazırlığı için kullanabilir. Yetişkinler ise genel kültür
                ve eğlence amaçlı oynayabilir.
              </p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">Harita oyununda kaç lokasyon var?</h3>
              <p className="text-gray-400 text-sm mt-2">
                TürkiyeGuessr&apos;da Türkiye&apos;nin 7 coğrafi bölgesinden özenle seçilmiş 142&apos;den
                fazla gerçek Google Sokak Görünümü lokasyonu bulunmaktadır. Lokasyonlar düzenli olarak
                güncellenmektedir.
              </p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">Türkiye harita oyunu mobilde oynanabilir mi?</h3>
              <p className="text-gray-400 text-sm mt-2">
                Evet, TürkiyeGuessr tamamen mobil uyumludur. Herhangi bir uygulama indirmenize gerek yoktur;
                telefon, tablet veya bilgisayarınızın tarayıcısından doğrudan oynayabilirsiniz.
              </p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">Öğretmenler harita oyununu derslerinde nasıl kullanabilir?</h3>
              <p className="text-gray-400 text-sm mt-2">
                Öğretmenler TürkiyeGuessr&apos;ı sınıf içi yarışma olarak kullanabilir, bölge bazlı ödevler
                verebilir veya multiplayer modda takım çalışması etkinlikleri düzenleyebilir. Ücretsiz olması
                okul bütçesine ek yük getirmez.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-8 space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Türkiye&apos;yi Ne Kadar İyi Tanıyorsun?
          </h2>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Ücretsiz
          </Link>
          <p className="text-gray-600 text-sm">
            Kayıt yok. Ödeme yok. Tarayıcını aç ve başla.
          </p>
        </section>

        {/* Daha Fazlasını Keşfet */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Daha Fazlasını Keşfet</h2>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "Nasıl Oynanır?", href: "/nasil-oynanir" },
              { label: "Multiplayer Modu", href: "/multiplayer" },
              { label: "Tüm Bölgeler", href: "/bolgeler" },
              { label: "Tüm Şehirler", href: "/sehirler" },
              { label: "GeoGuessr Alternatifi", href: "/geoguessr-alternatifi" },
              { label: "Blog", href: "/blog" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-400 hover:text-white underline transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
