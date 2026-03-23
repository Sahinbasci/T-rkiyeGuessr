import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Türkiye'de Bölgelere Göre Mimari Farklar: Konum Tahmin Rehberi",
  description:
    "Türkiye'nin 7 bölgesinde mimari tarzlar nasıl farklılaşır? Osmanlı yalılarından Karadeniz serenderlerine, Ege taş evlerinden Güneydoğu avlu evlerine kadar konum tahmin ipuçları.",
  keywords: ["türkiye mimari farkları", "bölgelere göre yapı tarzları", "konum tahmin mimari ipuçları"],
  alternates: { canonical: "/blog/turkiye-mimari-farklari", languages: { "tr-TR": "/blog/turkiye-mimari-farklari", "x-default": "/blog/turkiye-mimari-farklari" } },
  openGraph: {
    type: "article",
    locale: "tr_TR",
    url: `${SITE_URL}/blog/turkiye-mimari-farklari`,
    siteName: "TürkiyeGuessr",
    title: "Türkiye'de Bölgelere Göre Mimari Farklar: Konum Tahmin Rehberi",
    description:
      "Türkiye'nin 7 bölgesinde mimari tarzlar nasıl farklılaşır? Osmanlı yalılarından Karadeniz serenderlerine, Ege taş evlerinden Güneydoğu avlu evlerine kadar konum tahmin ipuçları.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Türkiye'de Bölgelere Göre Mimari Farklar: Konum Tahmin Rehberi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Türkiye'de Bölgelere Göre Mimari Farklar: Konum Tahmin Rehberi",
    description:
      "Türkiye'nin 7 bölgesinde mimari tarzlar nasıl farklılaşır? Osmanlı yalılarından Karadeniz serenderlerine, Ege taş evlerinden Güneydoğu avlu evlerine kadar konum tahmin ipuçları.",
  },
};

export default function TurkiyeMimariFarklariPost() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "Türkiye'de Bölgelere Göre Mimari Farklar: Konum Tahmin Rehberi",
    datePublished: "2026-03-18",
    dateModified: "2026-03-18",
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
      "Türkiye'nin 7 bölgesinde mimari tarzlar nasıl farklılaşır? Osmanlı yalılarından Karadeniz serenderlerine, Ege taş evlerinden Güneydoğu avlu evlerine kadar konum tahmin ipuçları.",
    mainEntityOfPage: `${SITE_URL}/blog/turkiye-mimari-farklari`,
    image: `${SITE_URL}/og-image.png`,
  };

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: "Mimari Farklar Rehberi", url: "/blog/turkiye-mimari-farklari" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="prose-custom space-y-8 max-w-3xl">
        <header>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <time dateTime="2026-03-18">18 Mart 2026</time>
            <span>10 dk okuma</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Türkiye&apos;de Bölgelere Göre Mimari Farklar
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Konum tahmin oyunlarında mimari tarzı okumak, bölgeyi daraltmanın en etkili yollarından biri. İşte Türkiye&apos;nin 7 bölgesinin yapı karakteristikleri.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Mimari Neden En Güçlü İpucudur?</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr oynarken karşına çıkan sokak görünümünde en kalıcı ve güvenilir ipuçlarından biri yapıların mimari tarzıdır. Plaka kodları her zaman görünmeyebilir, tabelalar okunaksız olabilir, ama binaların genel görünümü her zaman orada. Çatı şekli, duvar malzemesi, pencere boyutları, balkon yapısı ve binanın çevreyle ilişkisi bölgeyi ele veren ipuçlarıyla doludur.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;de mimari tarzlar yüzyıllar boyunca iklime, mevcut yapı malzemesine, kültürel mirasa ve yaşam biçimine göre şekillenmiştir. Her bölgenin kendine özgü bir yapı geleneği vardır ve bu gelenekler modern yapılarda bile izlerini sürdürür. Bu rehberde her bölgenin mimari karakteristiklerini detaylıca inceleyecek ve <Link href="/" className="text-red-400 hover:text-red-300 transition-colors">TürkiyeGuessr</Link>&apos;da bu bilgiyi nasıl kullanacağını öğreneceksin.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">1. Marmara Bölgesi: İmparatorlukların Mirası</h2>
          <p className="text-gray-400 leading-relaxed">
            <Link href="/bolgeler/marmara" className="text-red-400 hover:text-red-300 transition-colors">Marmara Bölgesi</Link>, hem Osmanlı hem Bizans İmparatorluğu&apos;nun başkentine ev sahipliği yapmış olmanın zengin mimari mirasını taşır. İstanbul&apos;un tarihi yarımadasında Osmanlı döneminin ahşap konakları, cumbalı evleri ve kagir yapıları yan yana durur. Boğaz kıyısında ise zarif yalılar, neoclassical köşkler ve art nouveau apartmanlar dikkat çeker.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Bursa&apos;da erken Osmanlı dönemi camileri ve hanları şehrin merkezine damgasını vurmuştur. Edirne&apos;de Mimar Sinan&apos;ın eserleri göz kamaştırırken, Trakya kırsalında Balkan göçmenlerinin getirdiği mimari tarz kendini gösterir. Marmara&apos;nın sanayi şehirlerinde ise modern fabrika yapıları, lojistik depoları ve toplu konut projeleri baskındır.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Modern <Link href="/sehirler/fatih-istanbul" className="text-red-400 hover:text-red-300 transition-colors">İstanbul</Link>&apos;da gökdelenler, AVM&apos;ler ve çağdaş konut projeleri tarihi dokuyla iç içe yaşar. Levent ve Maslak&apos;taki cam kuleler, Kadıköy&apos;ün renkli apartmanları ve Balat&apos;ın pastel boyalı sıra evleri birbirinden çok farklı görüntüler sunar.
          </p>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">TürkiyeGuessr&apos;da Nasıl Tanırsın?</h3>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li>Cumbalı ahşap evler ve dar sokaklar: Tarihi İstanbul veya Bursa</li>
              <li>Boğaz kıyısında yalılar ve neoclassical cepheler: İstanbul Boğaziçi</li>
              <li>Yoğun apartman dokusu + sanayi tesisleri: Kocaeli, Tekirdağ veya Bursa</li>
              <li>Gökdelenler ve modern cam binalar: İstanbul iş merkezleri</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">2. Ege Bölgesi: Beyaz Taş ve Mavi Panjur</h2>
          <p className="text-gray-400 leading-relaxed">
            <Link href="/bolgeler/ege" className="text-red-400 hover:text-red-300 transition-colors">Ege Bölgesi</Link>&apos;nin mimari kimliği beyaz badanalı taş evler, mavi veya yeşil panjurlar ve taş döşeli dar sokaklardır. Bu tarz özellikle kıyı kasabalarında ve iç kesimlerdeki tarihi köylerde belirgindir. Bodrum, Alaçatı, Şirince ve Foça gibi yerleşimlerde bu mimari dil yoğun biçimde yaşar.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Ege evlerinin özellikleri iklimle doğrudan ilişkilidir. Kalın taş duvarlar yazın serin tutar, beyaz badana güneş ışığını yansıtarak iç mekanı serin tutar. Geniş verandalar ve avlular açık hava yaşamına olanak tanır. Zeytinlik ve üzüm bağları arasındaki taş çiftlik evleri bölgenin kırsal karakterini oluşturur. Pencereler genellikle güneye veya batıya bakar ve ahşap kepenkleri vardır.
          </p>
          <p className="text-gray-400 leading-relaxed">
            <Link href="/sehirler/konak-izmir" className="text-red-400 hover:text-red-300 transition-colors">İzmir</Link>&apos;in Alsancak ve Konak semtlerinde Levanten mimari mirası görülür: demir balkonlu, yüksek tavanlı taş apartmanlar ve ticaret hanları. Rum ve Ermeni kiliselerinin yanı sıra Osmanlı çarşıları da Ege şehirlerinin mimari çeşitliliğini artırır. Antik kalıntılar da bölgenin her köşesinde karşına çıkabilir; Efes, Bergama ve Afrodisias gibi antik kentlerin kalıntıları manzaraya eşlik eder.
          </p>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">TürkiyeGuessr&apos;da Nasıl Tanırsın?</h3>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li>Beyaz badanalı taş evler + mavi panjurlar: Ege kıyı kasabaları</li>
              <li>Zeytinlik arasında taş çiftlik evleri: Ege kırsalı</li>
              <li>Demir balkonlu Levanten apartmanlar: İzmir merkez</li>
              <li>Antik sütunlar veya tiyatro kalıntıları: Ege arkeolojik bölgeleri</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">3. Akdeniz Bölgesi: Turuncu Kiremit ve Kale</h2>
          <p className="text-gray-400 leading-relaxed">
            <Link href="/bolgeler/akdeniz" className="text-red-400 hover:text-red-300 transition-colors">Akdeniz Bölgesi</Link>&apos;nde göze çarpan ilk mimari unsur turuncu kiremit çatılardır. Sıcak iklim ve yoğun güneş ışığı, yapıların tasarımını derinden etkiler. Geniş saçaklar gölge sağlar, kalın taş duvarlar serinlik verir ve avlulu yapılar hava sirkülasyonunu kolaylaştırır. <Link href="/sehirler/kaleici-antalya" className="text-red-400 hover:text-red-300 transition-colors">Antalya Kaleiçi</Link>&apos;nin Osmanlı dönemi konakları bu tarzın en güzel örnekleridir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Akdeniz kıyısında kaleler ve surlar önemli mimari öğelerdir. Alanya Kalesi, Anamur Mamure Kalesi, Silifke Kalesi gibi ortaçağ yapıları kıyı manzarasına hakim konumdadır. Bu kalelerin yakınında genellikle dar sokaklı eski mahalleler bulunur. Seralar da Akdeniz sahilinin özellikle Antalya-Mersin arasındaki kıyı şeridinin belirgin öğesidir; cam ve plastik örtülü sera yapıları tarım arazilerinin büyük kısmını kaplar.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Toros Dağları&apos;nın yüksek kesimlerinde ise mimari tamamen değişir. Yörük yayla evleri, taş duvarlı basit yapılar ve mevsimlik kullanılan ahşap barakalar dağ köylerinin karakteristiğidir. Sahilden birkaç saat içeride, deniz etkisinden uzak alanlarda İç Anadolu&apos;ya benzer yapılar görülmeye başlar.
          </p>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">TürkiyeGuessr&apos;da Nasıl Tanırsın?</h3>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li>Turuncu kiremit çatılar + palmiye ağaçları: Akdeniz sahili</li>
              <li>Kaleiçi tarzı Osmanlı konakları + dar sokaklar: Antalya</li>
              <li>Seralar ve cam örtüler: Antalya-Mersin arası</li>
              <li>Sahil kenarında kale veya sur kalıntıları: Akdeniz kıyı şehirleri</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">4. Karadeniz Bölgesi: Ahşap ve Yayla</h2>
          <p className="text-gray-400 leading-relaxed">
            <Link href="/bolgeler/karadeniz" className="text-red-400 hover:text-red-300 transition-colors">Karadeniz Bölgesi</Link>&apos;nin mimarisi Türkiye&apos;nin en kendine özgü yapı geleneğine sahiptir. Yoğun yağış ve dik yamaçlar, yapıların tasarımını belirleyen iki temel faktördür. Dik çatılar yağmur ve kar birikimini önler, geniş saçaklar duvarları nemden korur. Ahşap, bölgenin zengin orman kaynakları sayesinde başlıca yapı malzemesidir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Serender veya nayla adı verilen yükseltilmiş ahşap ambarlar Karadeniz mimari kimliğinin en tanınan öğesidir. Ayaklar üzerinde yükseltilen bu yapılar, tahılı nemden ve kemirgenlerden korumak için tasarlanmıştır. Trabzon, Rize, Artvin ve Giresun kırsalında serenderler sıkça görülür. Yayla evleri ise yaz aylarında kullanılan ahşap veya taş yapılardır; genellikle yemyeşil çayırlar ortasında, sis bulutlarının arasında yer alır.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Doğu Karadeniz&apos;in dağ köylerinde çok katlı ahşap evler yamaçlara tutunur gibi inşa edilmiştir. Alt katlar taş duvarlı, üst katlar ahşap olan bu yapıların her katı farklı bir işlev görür: alt kat ahır veya depo, orta kat yaşam alanı, üst kat yatak odaları. Batı Karadeniz&apos;de ise Safranbolu ve Beypazarı&apos;nın Osmanlı dönemi ahşap konakları mimari koruma alanları olarak korunmaktadır. <Link href="/sehirler/uzungol-trabzon" className="text-red-400 hover:text-red-300 transition-colors">Uzungöl</Link> çevresindeki yayla evleri de bu bölgenin karakteristik yapılarındandır.
          </p>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">TürkiyeGuessr&apos;da Nasıl Tanırsın?</h3>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li>Ahşap evler + dik çatılar + yeşil yamaçlar: Karadeniz kıyısı</li>
              <li>Serender yapılar (yükseltilmiş ahşap ambarlar): Doğu Karadeniz kırsalı</li>
              <li>Çay bahçeleri arasında çok katlı evler: Rize, Artvin</li>
              <li>Ahşap Osmanlı konakları ve dar sokaklar: Safranbolu</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">5. İç Anadolu Bölgesi: Taş, Toprak ve Step</h2>
          <p className="text-gray-400 leading-relaxed">
            <Link href="/bolgeler/ic-anadolu" className="text-red-400 hover:text-red-300 transition-colors">İç Anadolu</Link>&apos;nun mimarisi sert karasal iklime uyum sağlamak üzerine şekillenmiştir. Sıcak yazlar ve soğuk kışlar, küçük pencereli, kalın duvarlı yapıları zorunlu kılar. Geleneksel kerpiç evler bölgenin kırsal kesimlerinde hala yaygındır. Kerpiç (güneşte kurutulmuş çamur tuğla), doğal bir yalıtım malzemesi olarak yazın serin, kışın sıcak tutar.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Kapadokya bölgesi mimari açıdan tamamen benzersizdir. Peri bacaları olarak bilinen volkanik tüf oluşumları içine oyulmuş konutlar, kiliseler ve yeraltı şehirleri dünyada başka hiçbir yerde bulunmaz. Göreme, Ürgüp ve Uçhisar&apos;da kayadan oyma yapılar hala kullanılır. Bu bölge TürkiyeGuessr&apos;da tanınması en kolay lokasyonlardan biridir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            <Link href="/sehirler/ulus-ankara" className="text-red-400 hover:text-red-300 transition-colors">Ankara</Link> ise başkent olarak farklı bir mimari kimlik taşır. Ulus çevresindeki tarihi doku, erken Cumhuriyet dönemi binaları ve Atatürk Bulvarı üzerindeki kamu yapıları devlet mimarisinin izlerini taşır. Konya&apos;da Selçuklu dönemi medrese ve camileri, Kayseri&apos;de tarihi hanlar ve bedestenler bölgenin köklü tarihini yansıtır. Kırsal kesimlerde düz çatılı, toprak sıvalı evler step arazisinin ortasında yer alır.
          </p>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">TürkiyeGuessr&apos;da Nasıl Tanırsın?</h3>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li>Kerpiç evler + düz çatılar + kurak arazi: İç Anadolu kırsalı</li>
              <li>Peri bacaları ve kayadan oyma yapılar: Kapadokya</li>
              <li>Selçuklu dönemi medreseler: Konya, Kayseri</li>
              <li>Geniş bulvarlar ve kamu binaları: Ankara</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">6. Doğu Anadolu Bölgesi: Taş Kale ve Yüksek Yapı</h2>
          <p className="text-gray-400 leading-relaxed">
            <Link href="/bolgeler/dogu-anadolu" className="text-red-400 hover:text-red-300 transition-colors">Doğu Anadolu</Link>&apos;da mimari en sert iklim koşullarına dayanmak üzere tasarlanmıştır. Uzun ve şiddetli kışlar, yoğun kar yağışı ve dondurucu soğuklar kalın taş duvarları, küçük pencereleri ve kompakt yapıları zorunlu kılar. Bazalt ve andezit gibi volkanik taşlar bölgenin başlıca yapı malzemesidir ve koyu renkli taş duvarlar Doğu Anadolu&apos;nun görsel kimliğini oluşturur.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Kars&apos;ta Rus dönemi mimarisi dikkat çeker. 19. yüzyılda Rusya egemenliğinde kalan Kars&apos;ta Baltık tarzı taş binalar, geniş caddeler ve grid planlı şehir dokusu Türkiye&apos;nin diğer şehirlerinden farklı bir atmosfer yaratır. Ani Harabeleri ise ortaçağ Ermeni mimarisinin dünya çapında önemli bir örneğidir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Van Gölü çevresinde Urartular&apos;dan kalma kale kalıntıları ve tarihi yapılar bölgenin antik geçmişini yansıtır. Erzurum&apos;da Selçuklu dönemi medreseleri, çifte minareli yapılar ve kışa dayanıklı taş konutlar şehrin karakteristiğidir. Kırsal kesimlerde basit taş evler, geniş otlaklar ve hayvan barınakları kırsal yaşamın mimari yansımasıdır. <Link href="/sehirler/agri-dagi-agri" className="text-red-400 hover:text-red-300 transition-colors">Ağrı</Link> çevresinde yaylacılık geleneğine bağlı geçici barınaklar da görülür.
          </p>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">TürkiyeGuessr&apos;da Nasıl Tanırsın?</h3>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li>Koyu renkli bazalt taş binalar + kar: Doğu Anadolu</li>
              <li>Baltık tarzı grid plan + Rus dönemi yapılar: Kars</li>
              <li>Çifte minareli medreseler: Erzurum</li>
              <li>Yüksek platolarda basit taş evler ve otlaklar: Doğu kırsalı</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">7. Güneydoğu Anadolu Bölgesi: Kesme Taş ve Avlu</h2>
          <p className="text-gray-400 leading-relaxed">
            <Link href="/bolgeler/guneydogu" className="text-red-400 hover:text-red-300 transition-colors">Güneydoğu Anadolu</Link>&apos;nun mimarisi Mezopotamya medeniyetlerinin binlerce yıllık mirasını taşır. Bölgenin en belirgin mimari özelliği kesme taş kullanımıdır. Sarı, bej ve bal rengi kireçtaşı bloklar düzgün bir şekilde kesilip dizilerek hem güzel hem dayanıklı duvarlar oluşturur. <Link href="/sehirler/artuklu-mardin" className="text-red-400 hover:text-red-300 transition-colors">Mardin</Link>&apos;in teraslı yapısı bu taş işçiliğinin en görkemli örneğidir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Avlulu ev geleneği Güneydoğu mimarisinin temelini oluşturur. Dış dünyaya kapalı, yüksek duvarlı yapıların ortasında geniş bir avlu bulunur. Bu avlu yaşamın merkezi ve aile mahremiyetinin korunduğu alandır. Eyvanlar (üç tarafı kapalı, bir tarafı avluya açık yarı açık mekanlar) sıcak iklimde gölge ve hava sirkülasyonu sağlar. Gaziantep, Şanlıurfa ve Diyarbakır&apos;da bu avlulu konak geleneği hala yaşar.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Düz damlar bölgenin bir diğer belirgin özelliğidir. Yağışın az olduğu Güneydoğu&apos;da çatılar düz yapılır ve üzerinde oturulabilir, uyunabilir veya ürün kurutulabilir. Diyarbakır&apos;ın ikonik bazalt surları ve içindeki dar sokaklı mahalleler, Şanlıurfa&apos;nın Balıklıgöl çevresindeki tarihi doku ve Gaziantep&apos;in bakır işçiliği kokan çarşıları bölgenin mimari zenginliğini oluşturur. Hasankeyf&apos;in kayadan oyma yapıları ve mağara konutları da bölgenin antik mimari mirasının bir parçasıdır.
          </p>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">TürkiyeGuessr&apos;da Nasıl Tanırsın?</h3>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li>Bal rengi kesme taş + düz dam + teraslı yapı: Mardin</li>
              <li>Bazalt surlar ve koyu taş sokaklar: Diyarbakır</li>
              <li>Avlulu konak yapıları: Gaziantep, Şanlıurfa</li>
              <li>Arapça tabelalar + taş işçiliği: Güneydoğu genel</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Genel Karşılaştırma Tablosu</h2>
          <div className="overflow-x-auto">
            <div className="space-y-2">
              {[
                { bolge: "Marmara", malzeme: "Ahşap + Taş", cati: "Kırma çatı", ozellik: "Cumba, yalı, gökdelen" },
                { bolge: "Ege", malzeme: "Beyaz taş", cati: "Kiremit", ozellik: "Mavi panjur, veranda" },
                { bolge: "Akdeniz", malzeme: "Taş + Sıva", cati: "Turuncu kiremit", ozellik: "Kale, sera, palmiye" },
                { bolge: "Karadeniz", malzeme: "Ahşap", cati: "Dik çatı", ozellik: "Serender, yayla evi" },
                { bolge: "İç Anadolu", malzeme: "Kerpiç + Taş", cati: "Düz / alçak", ozellik: "Küçük pencere, step" },
                { bolge: "Doğu Anadolu", malzeme: "Bazalt + Andezit", cati: "Düz / kalın", ozellik: "Kalın duvar, kompakt" },
                { bolge: "Güneydoğu", malzeme: "Kesme kireçtaşı", cati: "Düz dam", ozellik: "Avlu, eyvan, teraslı" },
              ].map((item) => (
                <div key={item.bolge} className="grid grid-cols-4 gap-2 bg-gray-800/40 border border-gray-700/30 rounded-lg p-3 text-sm">
                  <span className="text-red-400 font-medium">{item.bolge}</span>
                  <span className="text-gray-400">{item.malzeme}</span>
                  <span className="text-gray-400">{item.cati}</span>
                  <span className="text-gray-400">{item.ozellik}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-gray-200">Hızlı Mimari Karar Ağacı</h2>
          <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
            <li><strong className="text-gray-300">Ahşap baskın mı?</strong> → Karadeniz veya Marmara (tarihi)</li>
            <li><strong className="text-gray-300">Beyaz badana + mavi panjur mu?</strong> → Ege</li>
            <li><strong className="text-gray-300">Turuncu kiremit + palmiye mi?</strong> → Akdeniz</li>
            <li><strong className="text-gray-300">Kerpiç veya toprak sıva mı?</strong> → İç Anadolu kırsalı</li>
            <li><strong className="text-gray-300">Koyu bazalt taş mı?</strong> → Doğu Anadolu veya Diyarbakır</li>
            <li><strong className="text-gray-300">Bal rengi kesme taş + düz dam mı?</strong> → Güneydoğu</li>
            <li><strong className="text-gray-300">Kayadan oyma yapılar mı?</strong> → Kapadokya</li>
          </ul>
        </section>

        <section className="text-center py-6 space-y-3">
          <h2 className="text-2xl font-bold text-white">Mimari Bilgini Sahada Test Et!</h2>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Ücretsiz!
          </Link>
        </section>

        <nav className="flex flex-wrap gap-3 pt-4 border-t border-gray-700/50">
          <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-sm text-gray-400 hover:text-white transition-colors">
            Taktikler ve İpuçları →
          </Link>
          <Link href="/bolgeler" className="text-sm text-gray-400 hover:text-white transition-colors">
            Tüm Bölgeler →
          </Link>
          <Link href="/blog/turkiye-bolgeleri-rehberi" className="text-sm text-gray-400 hover:text-white transition-colors">
            Bölgeler Rehberi →
          </Link>
        </nav>

        <section className="space-y-4 pt-4 border-t border-gray-700/30">
          <h2 className="text-xl font-semibold text-red-400">İlgili İçerikler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-gray-400 hover:text-white text-sm transition-colors">
              → GeoGuessr Taktikleri ve İpuçları
            </Link>
            <Link href="/blog/turkiye-bolgeleri-rehberi" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye Bölgeleri Rehberi
            </Link>
            <Link href="/blog/sokaktan-sehir-nasil-taninir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Sokaktan Şehir Nasıl Tanınır?
            </Link>
            <Link href="/blog/turkiyeguessr-hikayesi" className="text-gray-400 hover:text-white text-sm transition-colors">
              → TürkiyeGuessr&apos;ın Hikayesi
            </Link>
            <Link href="/bolgeler/karadeniz" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Karadeniz Bölgesi
            </Link>
            <Link href="/bolgeler/ege" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Ege Bölgesi
            </Link>
            <Link href="/bolgeler/guneydogu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Güneydoğu Anadolu Bölgesi
            </Link>
            <Link href="/sehirler/artuklu-mardin" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Artuklu, Mardin Lokasyonları
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
