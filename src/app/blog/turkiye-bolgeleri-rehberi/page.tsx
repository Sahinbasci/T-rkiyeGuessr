import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";

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
  alternates: { canonical: "/blog/turkiye-bolgeleri-rehberi" },
};

export default function TurkiyeBolgeleriRehberiPost() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "Türkiye Bölgeleri Rehberi: 7 Bölgenin Farkları",
    datePublished: "2026-02-25",
    author: { "@type": "Organization", name: "TürkiyeGuessr" },
    publisher: { "@type": "Organization", name: "TürkiyeGuessr" },
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
          <Link href="/bolgeler/ic_anadolu" className="inline-block text-sm text-red-400 hover:text-red-300 transition-colors">
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
          <Link href="/bolgeler/dogu_anadolu" className="inline-block text-sm text-red-400 hover:text-red-300 transition-colors">
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
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
