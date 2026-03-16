import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Türkiye Bölgeleri Rehberi: 7 Bölgenin Farkları",
  description:
    "Türkiye'nin 7 coğrafi bölgesinin özellikleri, iklimi, bitki örtüsü ve mimari farklılıkları.",
  keywords: [
    "türkiye bölgeleri",
    "7 coğrafi bölge",
    "türkiye coğrafya rehberi",
    "bölge özellikleri",
    "türkiye iklim bölgeleri",
  ],
  alternates: { canonical: "/blog/turkiye-bolgeleri-rehberi", languages: { "tr-TR": "/blog/turkiye-bolgeleri-rehberi", "x-default": "/blog/turkiye-bolgeleri-rehberi" } },
  openGraph: {
    type: "article",
    locale: "tr_TR",
    url: `${SITE_URL}/blog/turkiye-bolgeleri-rehberi`,
    siteName: "TürkiyeGuessr",
    title: "Türkiye Bölgeleri Rehberi: 7 Bölgenin Farkları",
    description:
      "Türkiye'nin 7 coğrafi bölgesinin özellikleri, iklimi, bitki örtüsü ve mimari farklılıkları.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Türkiye Bölgeleri Rehberi: 7 Bölgenin Farkları",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Türkiye Bölgeleri Rehberi: 7 Bölgenin Farkları",
    description:
      "Türkiye'nin 7 coğrafi bölgesinin özellikleri, iklimi, bitki örtüsü ve mimari farklılıkları.",
  },
};

export default function TurkiyeBolgeleriRehberiPost() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "Türkiye Bölgeleri Rehberi: 7 Bölgenin Farkları",
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
      "Türkiye'nin 7 coğrafi bölgesinin özellikleri, iklimi, bitki örtüsü ve mimari farklılıkları.",
    mainEntityOfPage: `${SITE_URL}/blog/turkiye-bolgeleri-rehberi`,
    image: `${SITE_URL}/og-image.png`,
  };

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: "Bölgeler Rehberi", url: "/blog/turkiye-bolgeleri-rehberi" },
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
            <span>9 dk okuma</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Türkiye&apos;nin 7 Coğrafi Bölgesi: Kapsamlı Rehber
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Her bölgenin kendine özgü iklimi, bitki örtüsü ve mimarisi var. Bu rehberle hepsini tanı.
          </p>
        </header>

        <section className="space-y-4">
          <p className="text-gray-400 leading-relaxed">
            Türkiye, coğrafi çeşitliliği bakımından dünyanın en zengin ülkelerinden biridir. Üç tarafı
            denizlerle çevrili olan ülke, 7 farklı coğrafi bölgeye ayrılır. Her bölgenin kendine has
            iklimi, bitki örtüsü, mimarisi ve kültürel dokusu vardır. TürkiyeGuessr oynarken bu bölgesel
            farkları bilmek, konumunu tahmin etmede en büyük avantajlarından biri olacaktır. İşte
            Türkiye&apos;nin 7 coğrafi bölgesi ve ayırt edici özellikleri:
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">1. Marmara Bölgesi</h2>
          <p className="text-gray-400 leading-relaxed">
            Marmara Bölgesi, Türkiye&apos;nin en kalabalık ve en sanayileşmiş bölgesidir. İstanbul,
            Bursa, Kocaeli gibi büyük şehirlere ev sahipliği yapar. Marmara Denizi bölgenin merkezinde
            yer alır ve bölgeye adını verir. İklimi geçiş özelliği taşır: kuzey kesimler Karadeniz
            iklimine, güney kesimler ise Akdeniz iklimine yaklaşır. Trakya kesiminde düz tarım arazileri,
            ayçiçeği ve buğday tarlaları yaygındır. Anadolu yakasında ise sanayi bölgeleri, modern
            yapılaşma ve yoğun trafik baskındır. Sokak görünümünde çok şeritli otoyollar, büyük alışveriş
            merkezleri, fabrikalar ve yoğun kentsel doku Marmara&apos;nın belirgin işaretleridir.
            Boğaz manzarası ve feribot iskelesi görüyorsan büyük ihtimalle İstanbul&apos;dasın.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <Link href="/sehirler/fatih-istanbul" className="text-sm text-gray-400 hover:text-white transition-colors">
              Fatih, İstanbul →
            </Link>
            <Link href="/sehirler/osmangazi-bursa" className="text-sm text-gray-400 hover:text-white transition-colors">
              Osmangazi, Bursa →
            </Link>
            <Link href="/sehirler/izmit-kocaeli" className="text-sm text-gray-400 hover:text-white transition-colors">
              İzmit, Kocaeli →
            </Link>
          </div>
          <Link href="/bolgeler/marmara" className="inline-block text-sm text-red-400 hover:text-red-300 transition-colors">
            Marmara Bölgesi lokasyonlarını keşfet →
          </Link>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">2. Ege Bölgesi</h2>
          <p className="text-gray-400 leading-relaxed">
            Ege Bölgesi, Türkiye&apos;nin batı kıyısında yer alır ve Akdeniz ikliminin etkisi altındadır.
            Yazlar sıcak ve kurak, kışlar ılık ve yağışlıdır. Zeytinlikler, bağlar ve incir bahçeleri
            bölgenin en karakteristik tarım ürünleridir. Antik çağlardan kalma sayısız harabe ve
            arkeolojik alan bulunur: Efes, Bergama, Afrodisias gibi. Kıyı kesimlerinde turkuaz
            koylar, beyaz badanalı taş evler ve dar sokaklar tipiktir. Bodrum, Çeşme ve Alaçatı
            gibi turizm merkezlerinde butik oteller ve kafe kültürü yaygındır. Sokak görünümünde
            zeytinlik manzaraları, taş duvarlar, antik sütun kalıntıları ve Ege tipi mimariyle
            karşılaşırsan bu bölgedesin demektir. İç kesimlerde ise daha kurak arazi ve geleneksel
            kasaba yapısı hakim olur.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <Link href="/sehirler/konak-izmir" className="text-sm text-gray-400 hover:text-white transition-colors">
              Konak, İzmir →
            </Link>
            <Link href="/sehirler/bodrum-mugla" className="text-sm text-gray-400 hover:text-white transition-colors">
              Bodrum, Muğla →
            </Link>
            <Link href="/sehirler/fethiye-mugla" className="text-sm text-gray-400 hover:text-white transition-colors">
              Fethiye, Muğla →
            </Link>
          </div>
          <Link href="/bolgeler/ege" className="inline-block text-sm text-red-400 hover:text-red-300 transition-colors">
            Ege Bölgesi lokasyonlarını keşfet →
          </Link>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">3. Akdeniz Bölgesi</h2>
          <p className="text-gray-400 leading-relaxed">
            Akdeniz Bölgesi, Türkiye&apos;nin güney kıyısı boyunca uzanır ve tipik Akdeniz iklimine
            sahiptir. Yazlar çok sıcak ve kurak, kışlar ılık ve yağışlıdır. Toros Dağları bölgenin
            kuzey sınırını oluşturur ve kıyı ovalarını iç kesimlerden ayırır. Narenciye bahçeleri,
            muz seraları, palmiyeler ve zakkum çiçekleri yaygındır. Antalya, Alanya ve Side gibi
            turistik merkezler modern otel kompleksleri ve sahil şeritleriyle tanınır. Kıyı
            kasabalarında Akdeniz tipi beyaz-mavi boyalı evler, bougainville sarmaşıkları ve
            balıkçı limanları bulunur. Dağ eteklerinde ise sera tarımı yapılır. Sokak görünümünde
            palmiye sıraları, sera örtüleri, Toros&apos;ların dik silueti ve turkuaz deniz
            manzarası bu bölgenin ayırt edici işaretleridir.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <Link href="/sehirler/kaleici-antalya" className="text-sm text-gray-400 hover:text-white transition-colors">
              Kaleiçi, Antalya →
            </Link>
            <Link href="/sehirler/alanya-antalya" className="text-sm text-gray-400 hover:text-white transition-colors">
              Alanya, Antalya →
            </Link>
            <Link href="/sehirler/tarsus-mersin" className="text-sm text-gray-400 hover:text-white transition-colors">
              Tarsus, Mersin →
            </Link>
          </div>
          <Link href="/bolgeler/akdeniz" className="inline-block text-sm text-red-400 hover:text-red-300 transition-colors">
            Akdeniz Bölgesi lokasyonlarını keşfet →
          </Link>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">4. Karadeniz Bölgesi</h2>
          <p className="text-gray-400 leading-relaxed">
            Karadeniz Bölgesi, Türkiye&apos;nin kuzey kıyısı boyunca uzanır ve ülkenin en yeşil,
            en yağışlı bölgesidir. Her mevsim yağış alır, sis ve bulut sıkça görülür. Çay bahçeleri,
            fındık ağaçları ve yoğun yeşil ormanlar bölgenin simgesidir. Dağlar denize paralel uzanır
            ve kıyı ile iç kesimler arasında keskin bir geçiş yaratır. Trabzon, Rize, Artvin gibi
            illerde dik yamaçlara kurulmuş evler, serender adı verilen ahşap ambarlar ve çatıları
            kalın saçaklı yapılar dikkat çeker. Yayla kültürü çok güçlüdür; yaz aylarında yaylalara
            göç edilir. Sokak görünümünde her yer yemyeşildir, yollar dar ve virajlıdır, sis
            görüş mesafesini kısıtlayabilir. Çay toplama işçileri, fındık kurutma alanları ve
            ahşap yaylacı evler Karadeniz&apos;in en belirgin işaretleridir.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <Link href="/sehirler/uzungol-trabzon" className="text-sm text-gray-400 hover:text-white transition-colors">
              Uzungöl, Trabzon →
            </Link>
            <Link href="/sehirler/camlihemsin-rize" className="text-sm text-gray-400 hover:text-white transition-colors">
              Çamlıhemşin, Rize →
            </Link>
            <Link href="/sehirler/ayder-rize" className="text-sm text-gray-400 hover:text-white transition-colors">
              Ayder, Rize →
            </Link>
          </div>
          <Link href="/bolgeler/karadeniz" className="inline-block text-sm text-red-400 hover:text-red-300 transition-colors">
            Karadeniz Bölgesi lokasyonlarını keşfet →
          </Link>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">5. İç Anadolu Bölgesi</h2>
          <p className="text-gray-400 leading-relaxed">
            İç Anadolu Bölgesi, Türkiye&apos;nin merkezinde yer alan geniş bir plato bölgesidir.
            Karasal iklim hakimdir: yazlar sıcak ve kurak, kışlar soğuk ve karlıdır. Bozkır (step)
            arazisi, tahıl tarlaları ve geniş otlaklar bölgenin karakteristik manzarasıdır. Ankara,
            Konya, Kayseri gibi önemli şehirler bu bölgededir. Kapadokya&apos;nın peri bacaları,
            yeraltı şehirleri ve kayadan oyma kiliseleri dünyaca ünlüdür. Tuz Gölü bölgenin
            merkezinde yer alır ve benzersiz beyaz manzarasıyla dikkat çeker. Sokak görünümünde
            dümdüz uzanan araziler, buğday ve arpa tarlaları, seyrek yerleşim ve kurak toprak
            İç Anadolu&apos;nun işaretleridir. Kapadokya&apos;da ise volkanik tüf kayaları ve
            peri bacaları anında tanınır. Bölgede modern şehirleşme ile geleneksel kırsal yapı
            yan yana bulunur.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <Link href="/sehirler/ulus-ankara" className="text-sm text-gray-400 hover:text-white transition-colors">
              Ulus, Ankara →
            </Link>
            <Link href="/sehirler/selcuklu-konya" className="text-sm text-gray-400 hover:text-white transition-colors">
              Selçuklu, Konya →
            </Link>
            <Link href="/sehirler/goreme-nevsehir" className="text-sm text-gray-400 hover:text-white transition-colors">
              Göreme, Nevşehir →
            </Link>
          </div>
          <Link href="/bolgeler/ic-anadolu" className="inline-block text-sm text-red-400 hover:text-red-300 transition-colors">
            İç Anadolu Bölgesi lokasyonlarını keşfet →
          </Link>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">6. Doğu Anadolu Bölgesi</h2>
          <p className="text-gray-400 leading-relaxed">
            Doğu Anadolu Bölgesi, Türkiye&apos;nin en yüksek, en soğuk ve en seyrek nüfuslu
            bölgesidir. Yüksek platolar, derin vadiler ve büyük dağlar (Ağrı Dağı, Süphan Dağı)
            bölgenin coğrafyasını şekillendirir. Karasal iklim çok serttir; kış aylarında sıcaklık
            eksi 30 derecelerin altına düşebilir. Van Gölü, Türkiye&apos;nin en büyük gölüdür ve
            alkalin yapısıyla benzersizdir. Hayvancılık temel geçim kaynağıdır; geniş otlaklar ve
            yaylalar yaygındır. Mimari olarak taş yapılar, kalın duvarlar ve küçük pencereler sert
            iklime uyum sağlar. Sokak görünümünde karlı zirveler, çorak yüksek platolar, seyrek
            yerleşim ve geniş otlaklar bu bölgeyi ele verir. Yollar uzun ve düz olabilir,
            çevrede çok az ağaç bulunur. Doğu Anadolu&apos;nun engin ve ıssız manzarası
            Türkiye&apos;nin en zorlayıcı ama en etkileyici coğrafyalarından biridir.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <Link href="/sehirler/agri-dagi-agri" className="text-sm text-gray-400 hover:text-white transition-colors">
              Ağrı Dağı, Ağrı →
            </Link>
            <Link href="/sehirler/ipekyolu-van" className="text-sm text-gray-400 hover:text-white transition-colors">
              İpekyolu, Van →
            </Link>
            <Link href="/sehirler/yakutiye-erzurum" className="text-sm text-gray-400 hover:text-white transition-colors">
              Yakutiye, Erzurum →
            </Link>
          </div>
          <Link href="/bolgeler/dogu-anadolu" className="inline-block text-sm text-red-400 hover:text-red-300 transition-colors">
            Doğu Anadolu Bölgesi lokasyonlarını keşfet →
          </Link>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">7. Güneydoğu Anadolu Bölgesi</h2>
          <p className="text-gray-400 leading-relaxed">
            Güneydoğu Anadolu Bölgesi, Türkiye&apos;nin en sıcak ve en kurak bölgesidir. Mezopotamya
            düzlüklerinin uzantısı olan bu bölge, yaz aylarında 45 dereceyi aşan sıcaklıklara ulaşır.
            Fırat ve Dicle nehirleri bölgeden geçer ve tarihi boyunca medeniyetlerin beşiği olmuştur.
            Gaziantep, Şanlıurfa, Mardin ve Diyarbakır bölgenin önemli şehirleridir. Mimari olarak
            kireçtaşı yapılar, avlulu evler, düz damlar ve sivri kemerli kapılar karakteristiktir.
            Mardin&apos;in taş evleri, Gaziantep&apos;in bakır işçiliği ve Şanlıurfa&apos;nın
            Balıklıgöl&apos;ü bölgesel kimliğin parçalarıdır. Fıstık bahçeleri, pamuk tarlaları
            ve kuru tarım alanları yaygındır. Sokak görünümünde sıcak ve kurak manzara, sarımsı
            kireçtaşı binalar, düz ovalar ve zaman zaman Arapça tabelalar Güneydoğu Anadolu&apos;nun
            belirgin işaretleridir. GAP (Güneydoğu Anadolu Projesi) baraj gölleri de bölgesel
            ipucu olarak kullanılabilir.
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            <Link href="/sehirler/artuklu-mardin" className="text-sm text-gray-400 hover:text-white transition-colors">
              Artuklu, Mardin →
            </Link>
            <Link href="/sehirler/sahinbey-gaziantep" className="text-sm text-gray-400 hover:text-white transition-colors">
              Şahinbey, Gaziantep →
            </Link>
            <Link href="/sehirler/haliliye-sanliurfa" className="text-sm text-gray-400 hover:text-white transition-colors">
              Haliliye, Şanlıurfa →
            </Link>
          </div>
          <Link href="/bolgeler/guneydogu" className="inline-block text-sm text-red-400 hover:text-red-300 transition-colors">
            Güneydoğu Anadolu Bölgesi lokasyonlarını keşfet →
          </Link>
        </section>

        <section className="space-y-4 bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-200">Bölge Tahmin İpuçları</h2>
          <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
            <li>
              <strong className="text-gray-300">Deniz + dağ:</strong> Akdeniz (Toros etekleri) veya
              Karadeniz (Kaçkar Dağları)
            </li>
            <li>
              <strong className="text-gray-300">Yemyeşil + sis:</strong> Karadeniz Bölgesi (neredeyse
              kesin)
            </li>
            <li>
              <strong className="text-gray-300">Düz bozkır + kurak:</strong> İç Anadolu veya
              Güneydoğu Anadolu
            </li>
            <li>
              <strong className="text-gray-300">Zeytinlik + taş ev:</strong> Ege Bölgesi
            </li>
            <li>
              <strong className="text-gray-300">Palmiye + sera:</strong> Akdeniz Bölgesi
            </li>
            <li>
              <strong className="text-gray-300">Kar + yüksek plato:</strong> Doğu Anadolu
            </li>
            <li>
              <strong className="text-gray-300">Kireçtaşı mimari + sıcak:</strong> Güneydoğu Anadolu
            </li>
            <li>
              <strong className="text-gray-300">Sanayi + trafik:</strong> Marmara Bölgesi
            </li>
          </ul>
          <p className="text-gray-400 text-sm mt-3">
            Birden fazla ipucunu birleştirerek bölgeyi doğru tahmin etme olasılığını artırabilirsin.
            Her oyun bir öğrenme fırsatıdır; ne kadar çok oynarsan bölgeleri o kadar hızlı tanırsın.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Bölgeler Arası Geçiş Kuşakları</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;nin coğrafi bölgeleri arasında keskin sınırlar değil, yumuşak geçiş kuşakları
            bulunur ve bu geçiş alanları oyunda en çok yanıltan lokasyonlardır.{" "}
            <Link href="/bolgeler/marmara" className="text-red-400 hover:text-red-300 transition-colors">Marmara</Link>
            -
            <Link href="/bolgeler/ege" className="text-red-400 hover:text-red-300 transition-colors">Ege</Link>
            {" "}geçişinde (Balıkesir-Çanakkale hattı) hem Ege tipi zeytinlikler hem Marmara tipi
            sanayi alanları bir arada görülebilir. Akdeniz-İç Anadolu geçişinde Toros Dağları&apos;nın
            kuzey yamacı kurak step araziye dönerken güney yamacı tropikal bitki örtüsünü korur.{" "}
            <Link href="/sehirler/pamukkale-denizli" className="text-red-400 hover:text-red-300 transition-colors">Pamukkale</Link>
            {" "}bölgesi Ege-İç Anadolu geçişinin mükemmel bir örneğidir. Karadeniz-İç Anadolu
            geçişi ise Samsun-Amasya hattında dramatik şekilde hissedilir: bir dağ geçidinde
            yemyeşil orman birden kurak bozkıra dönüşür. Bu geçiş kuşaklarında iki bölgenin mimari
            stillerinin karıştığını, iklim özelliklerinin iç içe geçtiğini ve çift bölge
            karakteri taşıyan yapılar gördüğünü fark edeceksin.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">İstatistiklerle Bölgeler</h2>
          <p className="text-gray-400 leading-relaxed mb-3">
            TürkiyeGuessr&apos;da her bölge farklı sayıda lokasyon ve zorluk seviyesi sunar. Bölgelerin
            oyundaki dağılımını bilmek, pratik stratejini şekillendirmene yardımcı olur.
          </p>
          <div className="space-y-2">
            {[
              { bolge: "Marmara", zorluk: "Kolay-Orta", neden: "Yoğun kentsel doku, çok sayıda tabela ve plaka ipucu" },
              { bolge: "Ege", zorluk: "Kolay", neden: "Belirgin kıyı manzaraları, zeytinlikler ve turizm altyapısı" },
              { bolge: "Akdeniz", zorluk: "Kolay-Orta", neden: "Palmiyeler ve seralar ayırt edici, ancak dağ köyleri zorlu" },
              { bolge: "Karadeniz", zorluk: "Orta", neden: "Yeşil manzara belirgin ama sis görüşü kısıtlayabiliyor" },
              { bolge: "İç Anadolu", zorluk: "Orta-Zor", neden: "Tekdüze step arazisi, benzer görünen kasabalar" },
              { bolge: "Doğu Anadolu", zorluk: "Zor", neden: "Seyrek yerleşim, az tabela, benzer dağ manzaraları" },
              { bolge: "Güneydoğu", zorluk: "Orta-Zor", neden: "Kendine özgü mimari tanınabilir, ancak düz ovalar karışabilir" },
            ].map((item) => (
              <div key={item.bolge} className="flex flex-col sm:flex-row gap-2 sm:gap-4 bg-gray-800/40 border border-gray-700/30 rounded-lg p-3">
                <span className="text-red-400 font-medium text-sm whitespace-nowrap min-w-[120px]">{item.bolge}</span>
                <span className="text-yellow-400 text-sm whitespace-nowrap min-w-[80px]">{item.zorluk}</span>
                <span className="text-gray-400 text-sm">{item.neden}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-400 leading-relaxed">
            Genel olarak kıyı bölgeleri daha kolaydır çünkü deniz, liman ve turizm altyapısı güçlü ipuçları
            sunar. İç ve doğu bölgeleri ise daha az ayırt edici özellik taşıdığından zorluyor. En iyi strateji:
            önce kolay bölgelerde pratik yap, ardından zorluk seviyesini kademeli olarak artır.
          </p>
        </section>

        <section className="text-center py-6 space-y-3">
          <h2 className="text-2xl font-bold text-white">7 Bölgeyi Keşfetmeye Hazır Mısın?</h2>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Ücretsiz!
          </Link>
        </section>

        <nav className="flex flex-wrap gap-3 pt-4 border-t border-gray-700/50">
          <Link href="/bolgeler" className="text-sm text-gray-400 hover:text-white transition-colors">
            Tüm Bölgeler →
          </Link>
          <Link href="/sehirler" className="text-sm text-gray-400 hover:text-white transition-colors">
            Tüm Şehirler →
          </Link>
          <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-sm text-gray-400 hover:text-white transition-colors">
            Taktikler ve İpuçları →
          </Link>
        </nav>

        {/* İlgili İçerikler */}
        <section className="space-y-4 pt-4 border-t border-gray-700/30">
          <h2 className="text-xl font-semibold text-red-400">İlgili İçerikler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/blog/sokaktan-sehir-nasil-taninir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Sokaktan Şehir Nasıl Tanınır?
            </Link>
            <Link href="/blog/turkiyenin-en-zor-10-lokasyonu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → En Zor 10 Lokasyon
            </Link>
            <Link href="/blog/geoguessr-vs-turkiyeguessr" className="text-gray-400 hover:text-white text-sm transition-colors">
              → GeoGuessr vs TürkiyeGuessr
            </Link>
            <Link href="/bolgeler" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Tüm Bölgeler
            </Link>
            <Link href="/blog/plaka-kodlarindan-il-tahmini" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Plaka Kodlarından İl Tahmini
            </Link>
            <Link href="/sehirler/fatih-istanbul" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Fatih, İstanbul Lokasyonları
            </Link>
            <Link href="/sehirler/artuklu-mardin" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Artuklu, Mardin Lokasyonları
            </Link>
            <Link href="/sehirler/uzungol-trabzon" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Uzungöl, Trabzon Lokasyonları
            </Link>
            <Link href="/sehirler/goreme-nevsehir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Göreme, Nevşehir Lokasyonları
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
