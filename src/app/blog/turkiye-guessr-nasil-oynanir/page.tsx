import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "TürkiyeGuessr Nasıl Oynanır? Detaylı Rehber",
  description:
    "TürkiyeGuessr'da konum tahmin etmenin tüm detayları. Oda kurma, mod seçimi, ipuçları ve strateji rehberi. Adım adım anlatım.",
  keywords: ["türkiye guessr nasıl oynanır", "geoguessr türkiye rehber", "konum tahmin oyunu rehber"],
  alternates: { canonical: "/blog/turkiye-guessr-nasil-oynanir" },
  openGraph: {
    type: "article",
    locale: "tr_TR",
    url: `${SITE_URL}/blog/turkiye-guessr-nasil-oynanir`,
    siteName: "TürkiyeGuessr",
    title: "TürkiyeGuessr Nasıl Oynanır? Detaylı Rehber",
    description:
      "TürkiyeGuessr'da konum tahmin etmenin tüm detayları. Oda kurma, mod seçimi, ipuçları ve strateji rehberi. Adım adım anlatım.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "TürkiyeGuessr Nasıl Oynanır? Detaylı Rehber",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TürkiyeGuessr Nasıl Oynanır? Detaylı Rehber",
    description:
      "TürkiyeGuessr'da konum tahmin etmenin tüm detayları. Oda kurma, mod seçimi, ipuçları ve strateji rehberi. Adım adım anlatım.",
  },
};

export default function TurkiyeGuessrNasilOynanirPost() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "TürkiyeGuessr Nasıl Oynanır? Detaylı Rehber",
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
      "TürkiyeGuessr'da konum tahmin etmenin tüm detayları. Oda kurma, mod seçimi, ipuçları ve strateji rehberi. Adım adım anlatım.",
    mainEntityOfPage: `${SITE_URL}/blog/turkiye-guessr-nasil-oynanir`,
    image: `${SITE_URL}/og-image.png`,
  };

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: "Nasıl Oynanır?", url: "/blog/turkiye-guessr-nasil-oynanir" },
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
            TürkiyeGuessr Nasıl Oynanır?
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Türkiye&apos;nin sokak görünümlerinde konum tahmin etmenin eksiksiz rehberi.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">TürkiyeGuessr Nedir?</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, Google Street View kullanarak Türkiye&apos;nin farklı noktalarında konum tahmin ettiğin ücretsiz bir multiplayer coğrafya oyunudur. 142&apos;den fazla küratörlü lokasyon, 7 bölge ve 2 farklı oyun moduyla Türkiye coğrafyasını eğlenceli bir şekilde keşfetmeni sağlar.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Adım 1: Oyuncu Adını Gir</h2>
          <p className="text-gray-400 leading-relaxed">
            Ana ekrandaki metin kutusuna oyuncu adını yaz. Kayıt, e-posta veya şifre gerekmez. TürkiyeGuessr&apos;a giriş yapmak bu kadar basit — herhangi bir isim yeterli.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Adım 2: Oyun Modunu Seç</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr&apos;da iki farklı oyun modu bulunur:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-200">Urban / Yerleşim</h3>
              <p className="text-gray-500 text-sm mt-1">
                Şehir merkezlerinde tabela, işletme adı ve plaka kodlarını kullanarak konumu bul. 90 saniye süre, 3 hareket hakkı.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-200">Geo / Coğrafya</h3>
              <p className="text-gray-500 text-sm mt-1">
                Kırsal alanlarda bitki örtüsü, topoğrafya ve doğal ipuçlarıyla konumu tahmin et. 120 saniye süre, 4 hareket hakkı.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Adım 3: Oda Kur veya Katıl</h2>
          <p className="text-gray-400 leading-relaxed">
            Tek başına oynamak istiyorsan &quot;Yeni Oda Oluştur&quot; butonuna tıkla. Arkadaşlarınla oynamak istiyorsan ekranda beliren 6 haneli oda kodunu paylaş. Diğer oyuncular bu kodu girerek lobiye katılır. Bir odada 2-8 kişi arası aynı anda oynayabilir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Adım 4: Sokak Görünümünde Keşfet</h2>
          <p className="text-gray-400 leading-relaxed">
            Oyun başladığında Türkiye&apos;nin rastgele bir noktasına düşersin. Etrafına bak, hareket haklarını kullanarak sokakta ilerle ve ipuçlarını topla. Tabelalar, plaka kodları, cami minareleri, dağ silüetleri ve bitki örtüsü hep birer ipucu.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Adım 5: Tahmin Et ve Puan Kazan</h2>
          <p className="text-gray-400 leading-relaxed">
            Haritaya tıklayarak pin koy ve &quot;Tahmin Et&quot; butonuna bas. Pinin gerçek konuma ne kadar yakınsa o kadar yüksek puan alırsın. Maksimum puan 5000. 5 tur sonunda en yüksek toplam puana sahip oyuncu kazanır!
          </p>
        </section>

        <section className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-gray-200">Pro İpuçları</h2>
          <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
            <li>Plaka kodlarına dikkat et — her il benzersiz bir koda sahip (34=İstanbul, 06=Ankara)</li>
            <li>Güneşin konumuna bak — Türkiye&apos;de güney güneşli, kuzey gölgeli</li>
            <li>Kıyı çizgisi görüyorsan hangi denize baktığını düşün</li>
            <li>Dağ silüetleri bölgeyi daraltmana yardımcı olur</li>
            <li>Hareket haklarını dikkatli kullan — her adım değerli bilgi getirir</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Bölge Bazlı Oynama Stratejileri</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye 7 coğrafi bölgeye ayrılır ve her bölgenin kendine özgü görsel ipuçları vardır. Bu ipuçlarını tanımak tahmin doğruluğunu önemli ölçüde artırır.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-200">
                <Link href="/bolgeler/marmara" className="hover:text-red-400 transition-colors">Marmara Bölgesi</Link>
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Şehir tabelaları ve yoğun trafik en belirgin ipuçlarıdır. Özellikle{" "}
                <Link href="/sehirler/fatih-istanbul" className="text-red-400 hover:text-red-300 transition-colors">İstanbul</Link>
                {" "}çevresinde sanayi bölgeleri ve büyük otoyol kavşakları dikkat çeker.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-200">
                <Link href="/bolgeler/ege" className="hover:text-red-400 transition-colors">Ege Bölgesi</Link>
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Zeytinlikler ve kıyı kasabaları bu bölgenin imzasıdır.{" "}
                <Link href="/sehirler/alsancak-izmir" className="text-red-400 hover:text-red-300 transition-colors">İzmir</Link>
                {" "}kıyı şeridinde deniz havası hissedilir.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-200">
                <Link href="/bolgeler/akdeniz" className="hover:text-red-400 transition-colors">Akdeniz Bölgesi</Link>
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Turist bölgeleri, palmiyeler ve narenciye bahçeleri sık görülür.{" "}
                <Link href="/sehirler/kaleici-antalya" className="text-red-400 hover:text-red-300 transition-colors">Antalya Kaleiçi</Link>
                {" "}gibi tarihi merkezler belirgin ipuçları sunar.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-200">
                <Link href="/bolgeler/karadeniz" className="hover:text-red-400 transition-colors">Karadeniz Bölgesi</Link>
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Yeşil dağlar ve çay bahçeleri bu bölgenin karakteristiğidir.{" "}
                <Link href="/sehirler/uzungol-trabzon" className="text-red-400 hover:text-red-300 transition-colors">Uzungöl</Link>
                {" "}gibi yaylalar sisli havalarıyla tanınır.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-200">
                <Link href="/bolgeler/ic-anadolu" className="hover:text-red-400 transition-colors">İç Anadolu Bölgesi</Link>
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Düz step arazileri ve tahıl tarlaları hakimdir.{" "}
                <Link href="/sehirler/goreme-nevsehir" className="text-red-400 hover:text-red-300 transition-colors">Ürgüp / Nevşehir</Link>
                {" "}bölgesinde peri bacaları benzersiz bir manzara sunar.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-200">
                <Link href="/bolgeler/dogu-anadolu" className="hover:text-red-400 transition-colors">Doğu Anadolu Bölgesi</Link>
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Yüksek dağlar ve geniş ovalar bu bölgenin öne çıkan özellikleridir. Karlı zirveler ve sert kış manzaraları güçlü ipuçları sağlar.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 sm:col-span-2">
              <h3 className="font-semibold text-gray-200">
                <Link href="/bolgeler/guneydogu-anadolu" className="hover:text-red-400 transition-colors">Güneydoğu Anadolu Bölgesi</Link>
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Tarihi yapılar ve taş evler bölgenin en belirgin görsel ipuçlarıdır.{" "}
                <Link href="/sehirler/halfeti-sanliurfa" className="text-red-400 hover:text-red-300 transition-colors">Halfeti</Link>
                {" "}gibi Fırat kıyısındaki kasabalar kendine özgü bir atmosfere sahiptir.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Popüler Başlangıç Lokasyonları</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr&apos;a yeni başlıyorsan tanınması kolay ve ipucu bakımından zengin bu lokasyonlarla pratik yapabilirsin:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/sehirler/fatih-istanbul" className="block bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-red-500/50 transition-colors">
              <h3 className="font-semibold text-gray-200">Sultanahmet, İstanbul</h3>
              <p className="text-gray-500 text-sm mt-1">
                Tanınması kolay, tabelalar çok. Tarihi yarımadanın ikonik silueti ilk bakışta belli eder.
              </p>
            </Link>
            <Link href="/sehirler/kaleici-antalya" className="block bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-red-500/50 transition-colors">
              <h3 className="font-semibold text-gray-200">Kaleiçi, Antalya</h3>
              <p className="text-gray-500 text-sm mt-1">
                Turistik bölge, belirgin ipuçları. Dar sokaklar ve Osmanlı mimarisi hemen fark edilir.
              </p>
            </Link>
            <Link href="/sehirler/alsancak-izmir" className="block bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-red-500/50 transition-colors">
              <h3 className="font-semibold text-gray-200">Alsancak, İzmir</h3>
              <p className="text-gray-500 text-sm mt-1">
                Kıyı lokasyonu, Ege havası. Kordon boyunca deniz manzarası ve modern yapılar dikkat çeker.
              </p>
            </Link>
            <Link href="/sehirler/kizilay-ankara" className="block bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-red-500/50 transition-colors">
              <h3 className="font-semibold text-gray-200">Kızılay, Ankara</h3>
              <p className="text-gray-500 text-sm mt-1">
                Başkent, devlet binaları. Geniş bulvarlar ve resmi tabelalar konumu ele verir.
              </p>
            </Link>
            <Link href="/sehirler/goreme-nevsehir" className="block bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-red-500/50 transition-colors">
              <h3 className="font-semibold text-gray-200">Göreme, Nevşehir</h3>
              <p className="text-gray-500 text-sm mt-1">
                Peri bacaları, turistik. Kapadokya&apos;nın benzersiz kayalık yapıları başka hiçbir yere benzemez.
              </p>
            </Link>
            <Link href="/sehirler/uzungol-trabzon" className="block bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 hover:border-red-500/50 transition-colors">
              <h3 className="font-semibold text-gray-200">Uzungöl, Trabzon</h3>
              <p className="text-gray-500 text-sm mt-1">
                Yeşil doğa, Karadeniz. Göl kıyısındaki ahşap yapılar ve sisle kaplı dağlar karakteristiktir.
              </p>
            </Link>
          </div>
        </section>

        <section className="text-center py-6 space-y-3">
          <h2 className="text-2xl font-bold text-white">Hazır Mısın?</h2>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Ücretsiz!
          </Link>
        </section>

        <nav className="flex flex-wrap gap-3 pt-4 border-t border-gray-700/50">
          <Link href="/nasil-oynanir" className="text-sm text-gray-400 hover:text-white transition-colors">
            Nasıl Oynanır Sayfası →
          </Link>
          <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-sm text-gray-400 hover:text-white transition-colors">
            Taktikler ve İpuçları →
          </Link>
          <Link href="/multiplayer" className="text-sm text-gray-400 hover:text-white transition-colors">
            Multiplayer Rehberi →
          </Link>
        </nav>

        {/* İlgili İçerikler */}
        <section className="space-y-4 pt-4 border-t border-gray-700/30">
          <h2 className="text-xl font-semibold text-red-400">İlgili İçerikler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/nasil-oynanir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Nasıl Oynanır?
            </Link>
            <Link href="/multiplayer" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Multiplayer Modu
            </Link>
            <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-gray-400 hover:text-white text-sm transition-colors">
              → GeoGuessr Taktikleri ve İpuçları
            </Link>
            <Link href="/blog/sokaktan-sehir-nasil-taninir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Sokaktan Şehir Nasıl Tanınır?
            </Link>
            <Link href="/blog/turkiye-bolgeleri-rehberi" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye Bölgeleri Rehberi
            </Link>
            <Link href="/blog/plaka-kodlarindan-il-tahmini" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Plaka Kodlarından İl Tahmini
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
