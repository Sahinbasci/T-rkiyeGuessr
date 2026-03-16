import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Türkiye Sokak Görünümünden Şehir Nasıl Tanınır?",
  description:
    "Sokak görünümünde Türkiye şehirlerini tanımanın ipuçları. Tabelalar, mimari, bitki örtüsü ve coğrafi işaretler.",
  keywords: [
    "sokak görünümü şehir tanıma",
    "türkiye şehir ipuçları",
    "street view ipuçları",
    "coğrafi işaretler türkiye",
    "bölge tanıma rehberi",
  ],
  alternates: { canonical: "/blog/sokaktan-sehir-nasil-taninir", languages: { "tr-TR": "/blog/sokaktan-sehir-nasil-taninir", "x-default": "/blog/sokaktan-sehir-nasil-taninir" } },
  openGraph: {
    type: "article",
    locale: "tr_TR",
    url: `${SITE_URL}/blog/sokaktan-sehir-nasil-taninir`,
    siteName: "TürkiyeGuessr",
    title: "Türkiye Sokak Görünümünden Şehir Nasıl Tanınır?",
    description:
      "Sokak görünümünde Türkiye şehirlerini tanımanın ipuçları. Tabelalar, mimari, bitki örtüsü ve coğrafi işaretler.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Türkiye Sokak Görünümünden Şehir Nasıl Tanınır?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Türkiye Sokak Görünümünden Şehir Nasıl Tanınır?",
    description:
      "Sokak görünümünde Türkiye şehirlerini tanımanın ipuçları. Tabelalar, mimari, bitki örtüsü ve coğrafi işaretler.",
  },
};

export default function SoraktanSehirTaninirPost() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "Türkiye Sokak Görünümünden Şehir Nasıl Tanınır?",
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
      "Sokak görünümünde Türkiye şehirlerini tanımanın ipuçları. Tabelalar, mimari, bitki örtüsü ve coğrafi işaretler.",
    mainEntityOfPage: `${SITE_URL}/blog/sokaktan-sehir-nasil-taninir`,
    image: `${SITE_URL}/og-image.png`,
  };

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: "Şehir Nasıl Tanınır?", url: "/blog/sokaktan-sehir-nasil-taninir" },
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
            <span>7 dk okuma</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Sokak Görünümünde Türkiye Şehirlerini Tanıma Rehberi
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Tabelalardan mimariye, bitkilerden coğrafi şekillere: her ipucu seni doğru şehre yaklaştırır.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Tabelalar ve Yazılar</h2>
          <p className="text-gray-400 leading-relaxed">
            Sokak görünümünde en hızlı ve güvenilir ipucu kaynağı tabelalar ve yazılardır. Yol tabelaları
            konumunu daraltmanın en etkili yoludur. Yeşil tabelalar şehirlerarası yönleri gösterirken, mavi
            tabelalar şehir içi yönlendirmeler sunar. Tabelalardaki mesafe bilgileri ve şehir isimleri
            konumunu büyük ölçüde netleştirir. Dükkan tabelaları da çok değerli ipuçları taşır: yerel iş
            yeri isimleri, telefon alan kodları ve hatta bazen adres bilgileri bile bulabilirsin. Özellikle
            eczane, market ve kamu binalarının tabelaları şehir ve ilçe isimlerini açıkça yazar. Belediye
            otobüs duraklarında da şehir ve hat bilgisi bulunur. Cami isimlerindeki mahalle adları da
            ipucu olabilir. Tüm bu yazılı ipuçlarını dikkatle tarayarak konumunu hızla daraltabilirsin.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Mimari İpuçları</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;nin mimari çeşitliliği bölgesel kimliğin güçlü bir yansımasıdır. Osmanlı dönemi
            ahşap konaklarını genellikle Batı ve Kuzey Anadolu&apos;da görürsün: çıkmalı pencereler, geniş
            saçaklar ve iki-üç katlı yapılar. Ege ve Akdeniz kıyılarında beyaz badanalı taş evler, dar
            sokaklar ve begonvil sarmaşıkları tipiktir. Güneydoğu Anadolu&apos;da kireçtaşından yapılmış
            karakteristik sarı-bej tonlu yapılar, avlulu evler ve sivri kemerli kapılar dikkat çeker.
            Karadeniz bölgesinde ise ahşap yaylacı evler, serender adı verilen yükseltilmiş ambarlar ve dik
            çatılar yaygındır. Modern şehirlerde betonarme apartman blokları yaygın olsa da kentlerin
            tarihi merkezlerinde bölgesel mimari özellikler hala korunur. Minare stilleri de ipucu verir:
            tek minareli küçük camiler kırsal alanları, çok minareli büyük camiler ise il merkezlerini
            işaret eder.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Bitki Örtüsü</h2>
          <p className="text-gray-400 leading-relaxed">
            Bitki örtüsü, bulunduğun bölgeyi hızlıca belirlemenin en etkili yollarından biridir.
            Akdeniz bölgesinde palmiyeler, narenciye ağaçları, zakkum çiçekleri ve muz seralarıyla
            karşılaşırsın. Ege&apos;de zeytinlikler, incir ağaçları ve bağlar baskın bitki örtüsüdür.
            Karadeniz bölgesi çay bahçeleri, fındık ağaçları ve yoğun yeşil ormanlarıyla hemen
            ayırt edilir; her yer yemyeşildir ve sıklıkla sis bulunur. İç Anadolu&apos;da kurak
            bozkır arazisi, tahıl tarlaları ve seyrek otlaklar hakimdir. Doğu Anadolu&apos;da yüksek
            rakımlı otlaklar, dağ çayırları ve sert kış koşullarına uyum sağlamış bodur bitki örtüsü
            görülür. Güneydoğu Anadolu ise sıcak ve kurak iklimiyle fıstık bahçeleri, üzüm bağları
            ve kuru tarım alanlarına ev sahipliği yapar. Marmara bölgesinde ise karma yapraklı ormanlar,
            sanayi bölgeleri arasında kalan tarım alanları ve Trakya&apos;nın ayçiçeği tarlaları
            karakteristik özelliklerdir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Coğrafi Şekiller</h2>
          <p className="text-gray-400 leading-relaxed">
            Arazi yapısı bölge tespitinde kritik bir ipucudur. Deniz görüyorsan zaten üç olasılık var:
            Akdeniz, Ege veya Karadeniz kıyısı (Marmara da dahil). Dik dağlarla denizin bir arada
            olduğu manzaralar genellikle Karadeniz&apos;e veya Akdeniz&apos;in Toros eteklerine
            işaret eder. Engebesiz düz ovalar İç Anadolu&apos;nun step arazisini veya Güneydoğu&apos;nun
            Mezopotamya düzlüklerini gösterir. Volkanik yapılar ve peri bacaları Kapadokya&apos;yı,
            yüksek karlı platolar Doğu Anadolu&apos;yu hemen ele verir. Vadiler ve kanyonlar ise
            özellikle İç ve Batı Anadolu geçiş bölgelerinde yaygındır. Göl görüyorsan Burdur, Van
            veya Tuz Gölü gibi belirgin ipuçlarına dikkat et. Nehir yatakları ve baraj gölleri de
            bölgesel ipuçları sağlar.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Plaka Kodları</h2>
          <p className="text-gray-400 leading-relaxed">
            Sokak görünümünde park halindeki araçların plakalarına bakmak en kesin ipuçlarından biridir.
            Türkiye&apos;de her ilin 01&apos;den 81&apos;e kadar benzersiz bir plaka kodu vardır.
            Plakadaki ilk iki rakam doğrudan ili gösterir. Yoğun trafikli bölgelerde birden fazla
            plaka görebilirsin; en sık tekrarlanan kod genellikle bulunduğun ildir. Ancak büyük
            şehirlerde (özellikle İstanbul, Ankara, İzmir) farklı illerden gelen araçlar da sıkça
            görülür. Kırsal bölgelerde ve küçük ilçelerde ise plakalar çok daha güvenilir bir
            göstergedir. Plaka kodlarını ezberlemek, TürkiyeGuessr&apos;da en büyük avantajlarından
            biri olacaktır.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Bölgesel İpuçları: Hızlı Rehber</h2>
          <div className="space-y-3">
            {[
              { bolge: "Marmara", ipucu: "Yoğun trafik, sanayi alanları, modern şehirleşme, Boğaz ve deniz manzaraları, Trakya'da düz tarım arazileri" },
              { bolge: "Ege", ipucu: "Zeytinlikler, taş evler, antik harabe kalıntıları, turkuaz koylar, turizm altyapısı" },
              { bolge: "Akdeniz", ipucu: "Palmiyeler, seralar, narenciye bahçeleri, Toros Dağları, sahil kasabaları" },
              { bolge: "Karadeniz", ipucu: "Yemyeşil dağlar, çay tarlaları, sis, ahşap evler, dik yamaçlar, fındık bahçeleri" },
              { bolge: "İç Anadolu", ipucu: "Düz bozkır, kurak arazi, tahıl tarlaları, peri bacaları, geniş ovalar" },
              { bolge: "Doğu Anadolu", ipucu: "Yüksek dağlar, kar, otlaklar, Van Gölü, taş yapılar, sert iklim" },
              { bolge: "Güneydoğu Anadolu", ipucu: "Kireçtaşı mimari, düz ovalar, sıcak iklim, fıstık bahçeleri, tarihi yapılar" },
            ].map((item) => (
              <div key={item.bolge} className="flex gap-3 bg-gray-800/40 border border-gray-700/30 rounded-lg p-3">
                <span className="text-red-400 font-medium text-sm whitespace-nowrap">{item.bolge}</span>
                <span className="text-gray-400 text-sm">{item.ipucu}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-400 leading-relaxed">
            Bu ipuçlarını birleştirerek sokak görünümündeki konumunu hızla daraltabilirsin. Tek bir
            ipucu yeterli olmayabilir ama birden fazla ipucunu bir araya getirdiğinde doğru bölgeyi
            bulmak çok kolaylaşır. Pratik yaptıkça bu ipuçlarını otomatik olarak fark etmeye
            başlayacaksın.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Deniz Kenarı Şehirler vs İç Anadolu</h2>
          <p className="text-gray-400 leading-relaxed">
            Kıyı şehirleri ile iç kesim şehirleri arasındaki farklar Street View&apos;da hemen göze çarpar.{" "}
            <Link href="/sehirler/bodrum-mugla" className="text-red-400 hover:text-red-300 transition-colors">Bodrum</Link>
            {" "}ve{" "}
            <Link href="/sehirler/fethiye-mugla" className="text-red-400 hover:text-red-300 transition-colors">Fethiye</Link>
            {" "}gibi{" "}
            <Link href="/bolgeler/ege" className="text-red-400 hover:text-red-300 transition-colors">Ege</Link>
            {" "}kıyı kasabalarında beyaz badanalı evler, dar sokaklar, marina ve tekne manzaraları,
            begonvil sarmaşıkları ve turizm tabelaları baskın unsurlardır. Sahil yollarında palmiye
            dizileri, balık restoranları ve su sporları tabelaları görürsün. Buna karşın{" "}
            <Link href="/sehirler/selcuklu-konya" className="text-red-400 hover:text-red-300 transition-colors">Konya Selçuklu</Link>
            {" "}gibi{" "}
            <Link href="/bolgeler/ic-anadolu" className="text-red-400 hover:text-red-300 transition-colors">İç Anadolu</Link>
            {" "}şehirlerinde geniş bulvarlar, düz arazi, kurak toprak ve modern konut siteleri hakimdir.
            Kıyı şehirlerinde hava daha nemli ve puslu olabilirken, step şehirlerinde gökyüzü masmavi
            ve berrak olur.{" "}
            <Link href="/sehirler/pamukkale-denizli" className="text-red-400 hover:text-red-300 transition-colors">Pamukkale</Link>
            {" "}gibi geçiş noktaları ise her iki karakteri de taşıyabilir. Bu kıyı-iç ayrımını
            tanımak, tahminin hata payını ciddi ölçüde azaltır.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Gece ve Gündüz Farkları</h2>
          <p className="text-gray-400 leading-relaxed">
            Street View görüntüleri farklı saatlerde çekilebilir ve bu durum ipuçlarını etkiler.
            Gündüz çekimlerinde tabelalar, plakalar ve mimari detaylar net olarak okunabilirken,
            alacakaranlık veya gece çekimlerinde sokak aydınlatması ve ışıklı tabelalar ön plana çıkar.{" "}
            <Link href="/sehirler/goreme-nevsehir" className="text-red-400 hover:text-red-300 transition-colors">Göreme</Link>
            {" "}gibi turistik bölgelerde gece aydınlatması dekoratif ve belirgin olabilirken, kırsal
            alanlarda karanlık yollar ve tek tük sokak lambaları görürsün. Gece görüntülerinde
            dükkan vitrinlerinin ışığı, neon tabelalar ve cami aydınlatmaları önemli ipuçları sunar.
            Gölge analizini yalnızca gündüz çekimlerinde kullanabilirsin; güneşin açısı kabaca kuzey-güney
            yönünü verir. Ayrıca gündüz çekimlerinde araç yoğunluğu ve yaya trafiği, bulunduğun yerin
            merkez mi yoksa kenar mahalle mi olduğunu anlamana yardımcı olur. Düşük ışıkta detaylar
            kaybolsa da, ışıklı tabela ve reklam panolarını yakalayarak konumunu belirleyebilirsin.
          </p>
        </section>

        <section className="text-center py-6 space-y-3">
          <h2 className="text-2xl font-bold text-white">İpuçlarını Pratikte Dene!</h2>
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
            <Link href="/blog/plaka-kodlarindan-il-tahmini" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Plaka Kodlarından İl Tahmini
            </Link>
            <Link href="/blog/turkiye-bolgeleri-rehberi" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye Bölgeleri Rehberi
            </Link>
            <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-gray-400 hover:text-white text-sm transition-colors">
              → GeoGuessr Taktikleri ve İpuçları
            </Link>
            <Link href="/sehir-tahmin-oyunu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Şehir Tahmin Oyunu
            </Link>
            <Link href="/blog/turkiyenin-en-zor-10-lokasyonu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye&apos;nin En Zor 10 Lokasyonu
            </Link>
            <Link href="/sehirler/bodrum-mugla" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Bodrum, Muğla Lokasyonları
            </Link>
            <Link href="/sehirler/goreme-nevsehir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Göreme, Nevşehir Lokasyonları
            </Link>
            <Link href="/bolgeler/ege" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Ege Bölgesi
            </Link>
            <Link href="/bolgeler/ic-anadolu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → İç Anadolu Bölgesi
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
