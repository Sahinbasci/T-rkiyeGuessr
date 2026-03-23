import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "GeoGuessr Taktikleri ve İpuçları: Türkiye Özel",
  description:
    "Türkiye'de konum tahmin ederken işine yarayacak taktikler. Plaka kodları, tabela dili, bitki örtüsü, mimari ve bölgesel ipuçları.",
  keywords: ["geoguessr taktikleri", "konum tahmin ipuçları", "türkiye geoguessr ipuçları", "plaka kodları ipuçları"],
  alternates: { canonical: "/blog/geoguessr-taktikleri-ipuclari", languages: { "tr-TR": "/blog/geoguessr-taktikleri-ipuclari", "x-default": "/blog/geoguessr-taktikleri-ipuclari" } },
  openGraph: {
    type: "article",
    locale: "tr_TR",
    url: `${SITE_URL}/blog/geoguessr-taktikleri-ipuclari`,
    siteName: "TürkiyeGuessr",
    title: "GeoGuessr Taktikleri ve İpuçları: Türkiye Özel",
    description:
      "Türkiye'de konum tahmin ederken işine yarayacak taktikler. Plaka kodları, tabela dili, bitki örtüsü, mimari ve bölgesel ipuçları.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "GeoGuessr Taktikleri ve İpuçları: Türkiye Özel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GeoGuessr Taktikleri ve İpuçları: Türkiye Özel",
    description:
      "Türkiye'de konum tahmin ederken işine yarayacak taktikler. Plaka kodları, tabela dili, bitki örtüsü, mimari ve bölgesel ipuçları.",
  },
};

export default function GeoguessrTaktikleriPost() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "GeoGuessr Taktikleri ve İpuçları: Türkiye Özel",
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
      "Türkiye'de konum tahmin ederken işine yarayacak taktikler. Plaka kodları, tabela dili, bitki örtüsü, mimari ve bölgesel ipuçları.",
    mainEntityOfPage: `${SITE_URL}/blog/geoguessr-taktikleri-ipuclari`,
    image: `${SITE_URL}/og-image.png`,
  };

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: "Taktikler ve İpuçları", url: "/blog/geoguessr-taktikleri-ipuclari" },
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
            <span>7 dk okuma</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Türkiye&apos;de Konum Tahmin Taktikleri
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Sokak görünümünde Türkiye&apos;yi tanımanın altın kuralları.
          </p>
        </header>

        <figure className="my-8 rounded-xl overflow-hidden">
          <Image
            src="/images/blog/street-view-tips.jpg"
            alt="GeoGuessr taktikleri ve ipuçları rehberi"
            width={800}
            height={450}
            className="w-full h-auto rounded-xl"
            priority
          />
          <figcaption className="text-center text-sm text-gray-500 mt-2">GeoGuessr ve konum tahmin oyunlarında kullanabileceğiniz taktikler</figcaption>
        </figure>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">1. Plaka Kodlarını Öğren</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;de her ilin benzersiz bir plaka kodu vardır (01-81). Sokak görünümünde park halindeki araçların plakalarına bakarak hangi ilde olduğunu anında anlayabilirsin. Bu tek başına en güçlü ipucudur.
          </p>
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Kritik Plaka Kodları</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                ["01", "Adana"], ["06", "Ankara"], ["07", "Antalya"], ["10", "Balıkesir"],
                ["16", "Bursa"], ["20", "Denizli"], ["26", "Eskişehir"], ["27", "Gaziantep"],
                ["33", "Mersin"], ["34", "İstanbul"], ["35", "İzmir"], ["41", "Kocaeli"],
                ["42", "Konya"], ["48", "Muğla"], ["55", "Samsun"], ["61", "Trabzon"],
              ].map(([code, city]) => (
                <div key={code} className="flex justify-between bg-gray-800/50 rounded px-2 py-1">
                  <span className="text-red-400 font-mono font-bold">{code}</span>
                  <span className="text-gray-400">{city}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">2. Tabelaları Oku</h2>
          <p className="text-gray-400 leading-relaxed">
            Yol tabelaları en değerli bilgi kaynaklarından biridir. Yeşil tabelalar şehirlerarası yönleri gösterirken, mavi tabelalar şehir içi yönlendirmeleri sağlar. Tabelalardaki şehir isimleri ve mesafe bilgileri konumunu daraltmana yardımcı olur.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">3. Bölgesel İpuçlarını Tanı</h2>
          <div className="space-y-3">
            {[
              { bolge: "Karadeniz", ipucu: "Yeşil dağlar, çay bahçeleri, ahşap evler, sis, dik yamaçlar" },
              { bolge: "Akdeniz", ipucu: "Palmiyeler, narenciye bahçeleri, seralar, turkuaz deniz, Toros Dağları" },
              { bolge: "Ege", ipucu: "Zeytin ağaçları, taş evler, antik kalıntılar, kıyı kasabaları" },
              { bolge: "İç Anadolu", ipucu: "Düz step, tahıl tarlaları, kurak arazi, peri bacaları (Kapadokya)" },
              { bolge: "Marmara", ipucu: "Yoğun trafik, sanayi bölgeleri, modern binalar, Boğaz manzarası" },
              { bolge: "Doğu Anadolu", ipucu: "Yüksek platolar, karlı dağlar, taş yapılar, otlaklar" },
              { bolge: "Güneydoğu", ipucu: "Kireçtaşı yapılar, düz ovalar, Arapça tabelalar, sıcak iklim" },
            ].map((item) => (
              <div key={item.bolge} className="flex gap-3 bg-gray-800/40 border border-gray-700/30 rounded-lg p-3">
                <span className="text-red-400 font-medium text-sm whitespace-nowrap">{item.bolge}</span>
                <span className="text-gray-400 text-sm">{item.ipucu}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">4. Mimariyi Gözlemle</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;nin her bölgesinin kendine özgü mimari tarzı vardır. Karadeniz&apos;in ahşap yaylacı evleri, Güneydoğu&apos;nun kireçtaşı konakları, Ege&apos;nin beyaz badanalı taş evleri ve Kapadokya&apos;nın kayadan oyma yapıları hep birer ipucu. Camilerin minare sayısı ve stili bile bölgesel farklılıklar gösterir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">5. Bitki Örtüsünü Analiz Et</h2>
          <p className="text-gray-400 leading-relaxed">
            Bitki örtüsü bölgeyi daraltmanın en etkili yollarından biridir. Çay tarlaları Karadeniz, zeytinlikler Ege, narenciye bahçeleri Akdeniz, tahıl tarlaları İç Anadolu demektir. Kurak step arazi İç ve Doğu Anadolu&apos;yu, yemyeşil ormanlar Karadeniz&apos;i işaret eder.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">6. Güneş ve Gölgeyi Kullan</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye kuzey yarımkürede olduğu için güneş her zaman güneyden parlar. Gölgelerin yönüne bakarak kabaca hangi tarafa baktığını anlayabilirsin. Bu özellikle kırsal alanlarda yön bulmak için çok işe yarar.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">7. Araç Markalarını ve Türlerini Gözlemle</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;de araç türleri bölgeden bölgeye farklılık gösterir ve bu farklar konumunu daraltmana
            yardımcı olabilir. Büyük şehirlerde — özellikle{" "}
            <Link href="/sehirler/fatih-istanbul" className="text-red-400 hover:text-red-300 transition-colors">İstanbul</Link>
            {" "}ve{" "}
            <Link href="/sehirler/konak-izmir" className="text-red-400 hover:text-red-300 transition-colors">İzmir</Link>
            &apos;de — sarı ticari taksiler, minibüsler ve dolmuşlar yoğun olarak görülür. Kırsal bölgelerde
            ise traktörler, tarım araçları ve kamyonetler sokak manzarasına hakimdir. İç Anadolu&apos;nun
            buğday tarlalarında biçerdöverler,{" "}
            <Link href="/bolgeler/karadeniz" className="text-red-400 hover:text-red-300 transition-colors">Karadeniz</Link>
            &apos;in çay bahçelerinde küçük kamyonetler sıkça görülür.{" "}
            <Link href="/bolgeler/akdeniz" className="text-red-400 hover:text-red-300 transition-colors">Akdeniz</Link>
            {" "}sahillerinde turist transferi için midibüsler, doğu illerinde ise kışa dayanıklı
            SUV&apos;lar ve pikap araçlar yaygındır. Ayrıca TIR plakaları uzun yol güzergahlarını işaret
            eder; sık TIR trafiği genellikle E-5 veya otoyol kenarında olduğunu gösterir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">8. Semt Tabelalarına Dikkat Et</h2>
          <p className="text-gray-400 leading-relaxed">
            Belediye sınır tabelaları konumunu kesinleştirmenin en doğrudan yollarından biridir. Şehir ve
            ilçe girişlerinde bulunan mavi zemin üzerine beyaz yazılı tabelalar doğrudan il ve ilçe adını
            gösterir. Örneğin,{" "}
            <Link href="/sehirler/kaleici-antalya" className="text-red-400 hover:text-red-300 transition-colors">Kaleiçi</Link>
            &apos;ne girerken &quot;Muratpaşa&quot; ilçe tabelasını görebilirsin. Mahalle isimleri de
            bölgesel ipuçları taşır: &quot;Çarşı&quot; veya &quot;Pazar&quot; mahalleleri genellikle eski
            ticaret merkezlerini, &quot;Yeni&quot; ile başlayan isimler ise modern yerleşimleri gösterir.{" "}
            <Link href="/sehirler/ulus-ankara" className="text-red-400 hover:text-red-300 transition-colors">Ankara Ulus</Link>
            {" "}bölgesinde tarihi tabela yoğunluğu fazlayken,{" "}
            <Link href="/sehirler/uzungol-trabzon" className="text-red-400 hover:text-red-300 transition-colors">Uzungöl</Link>
            {" "}gibi turistik alanlarda çok dilli yönlendirme tabelaları bulunur.{" "}
            <Link href="/sehirler/artuklu-mardin" className="text-red-400 hover:text-red-300 transition-colors">Mardin Artuklu</Link>
            &apos;da Arapça ve Süryanice ek tabelalar,{" "}
            <Link href="/sehirler/agri-dagi-agri" className="text-red-400 hover:text-red-300 transition-colors">Ağrı</Link>
            {" "}civarında ise Kürtçe yer adları da görebilirsin. Bu çok dilli tabelalar bölgeyi
            daraltmada güçlü birer işarettir.
          </p>
        </section>

        <section className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-gray-200">Hızlı Referans: Bölge Tespit Listesi</h2>
          <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
            <li><strong className="text-gray-300">Deniz görüyorsan:</strong> Akdeniz, Ege, Karadeniz veya Marmara</li>
            <li><strong className="text-gray-300">Dağ + deniz:</strong> Akdeniz (Toros) veya Karadeniz (Kaçkar)</li>
            <li><strong className="text-gray-300">Düz arazi + kuru:</strong> İç Anadolu veya Güneydoğu</li>
            <li><strong className="text-gray-300">Yemyeşil + sis:</strong> Karadeniz</li>
            <li><strong className="text-gray-300">Antik kalıntı:</strong> Ege veya Akdeniz</li>
            <li><strong className="text-gray-300">Kar + yüksek:</strong> Doğu Anadolu</li>
            <li><strong className="text-gray-300">Taş mimari + sıcak:</strong> Güneydoğu</li>
          </ul>
        </section>

        <section className="text-center py-6 space-y-3">
          <h2 className="text-2xl font-bold text-white">Taktiklerini Sahada Dene!</h2>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Ücretsiz!
          </Link>
        </section>

        <nav className="flex flex-wrap gap-3 pt-4 border-t border-gray-700/50">
          <Link href="/nasil-oynanir" className="text-sm text-gray-400 hover:text-white transition-colors">
            Nasıl Oynanır Rehberi →
          </Link>
          <Link href="/bolgeler" className="text-sm text-gray-400 hover:text-white transition-colors">
            Tüm Bölgeler →
          </Link>
          <Link href="/blog/turkiye-cografya-quiz" className="text-sm text-gray-400 hover:text-white transition-colors">
            Coğrafya Quiz →
          </Link>
        </nav>

        {/* İlgili İçerikler */}
        <section className="space-y-4 pt-4 border-t border-gray-700/30">
          <h2 className="text-xl font-semibold text-red-400">İlgili İçerikler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/nasil-oynanir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Nasıl Oynanır?
            </Link>
            <Link href="/bolgeler" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Tüm Bölgeler
            </Link>
            <Link href="/blog/sokaktan-sehir-nasil-taninir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Sokaktan Şehir Nasıl Tanınır?
            </Link>
            <Link href="/blog/plaka-kodlarindan-il-tahmini" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Plaka Kodlarından İl Tahmini
            </Link>
            <Link href="/blog/turkiye-bolgeleri-rehberi" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye Bölgeleri Rehberi
            </Link>
            <Link href="/blog/turkiyenin-en-zor-10-lokasyonu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye&apos;nin En Zor 10 Lokasyonu
            </Link>
            <Link href="/sehirler/fatih-istanbul" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Fatih, İstanbul Lokasyonları
            </Link>
            <Link href="/sehirler/kaleici-antalya" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Kaleiçi, Antalya Lokasyonları
            </Link>
            <Link href="/bolgeler/karadeniz" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Karadeniz Bölgesi
            </Link>
            <Link href="/bolgeler/guneydogu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Güneydoğu Anadolu Bölgesi
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
