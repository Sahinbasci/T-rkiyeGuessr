import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Nasıl Oynanır? — TürkiyeGuessr Adım Adım Rehber",
  description:
    "TürkiyeGuessr nasıl oynanır? Oda kur, arkadaşlarını davet et, sokak görünümünde konumu tahmin et. Adım adım Türkçe rehber.",
  keywords: [
    "türkiye guessr nasıl oynanır",
    "konum tahmin oyunu nasıl oynanır",
    "geoguessr nasıl oynanır türkçe",
  ],
  alternates: { canonical: "/nasil-oynanir", languages: { "tr-TR": "/nasil-oynanir", "x-default": "/nasil-oynanir" } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${SITE_URL}/nasil-oynanir`,
    siteName: "TürkiyeGuessr",
    title: "Nasıl Oynanır? — TürkiyeGuessr Adım Adım Rehber",
    description:
      "TürkiyeGuessr nasıl oynanır? Oda kur, arkadaşlarını davet et, sokak görünümünde konumu tahmin et. Adım adım Türkçe rehber.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Nasıl Oynanır? — TürkiyeGuessr Adım Adım Rehber - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Nasıl Oynanır? — TürkiyeGuessr Adım Adım Rehber",
    description:
      "TürkiyeGuessr nasıl oynanır? Oda kur, arkadaşlarını davet et, sokak görünümünde konumu tahmin et. Adım adım Türkçe rehber.",
  },
};

function HowToJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "TürkiyeGuessr Nasıl Oynanır?",
    description:
      "TürkiyeGuessr ile Türkiye konum tahmin oyunu oynamanın adım adım rehberi.",
    totalTime: "PT5M",
    tool: [{ "@type": "HowToTool", name: "Web tarayıcı (Chrome, Firefox, Safari)" }],
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Oyuncu adını gir",
        text: "Ana ekranda oyuncu adını yaz. Kayıt veya e-posta gerekmez.",
        url: `${SITE_URL}/nasil-oynanir`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Oyun modunu seç",
        text: "Urban (şehir) veya Geo (kırsal) modundan birini seç.",
        url: `${SITE_URL}/nasil-oynanir`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Oda oluştur veya katıl",
        text: "Yeni oda oluştur ve 6 haneli kodu arkadaşlarınla paylaş, ya da mevcut bir odaya katıl.",
        url: `${SITE_URL}/nasil-oynanir`,
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Sokak görünümünde keşfet",
        text: "Google Street View üzerinde Türkiye'nin rastgele bir noktasına düşersin. Etrafındaki ipuçlarını kullan.",
        url: `${SITE_URL}/nasil-oynanir`,
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Tahmin et ve puan kazan",
        text: "Haritada konumu işaretle ve tahmin et. Gerçek konuma ne kadar yakınsan o kadar çok puan alırsın.",
        url: `${SITE_URL}/nasil-oynanir`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function NasilOynanirPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Nasıl Oynanır", url: "/nasil-oynanir" },
      ]}
    >
      <HowToJsonLd />
      <article className="space-y-10">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            TürkiyeGuessr Nasıl Oynanır?
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Türkiye&apos;nin sokak görünümlerinde konumunu tahmin et, en yüksek puanı topla!
          </p>
        </header>

        <figure className="my-8 rounded-xl overflow-hidden">
          <Image
            src="/images/pages/nasil-oynanir-hero.jpg"
            alt="TürkiyeGuessr nasıl oynanır adım adım rehber"
            width={800}
            height={450}
            className="w-full h-auto rounded-xl"
            priority
          />
          <figcaption className="text-center text-sm text-gray-500 mt-2">TürkiyeGuessr adım adım oyun rehberi</figcaption>
        </figure>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">1. Oyuncu Adını Gir</h2>
          <p className="text-gray-400 leading-relaxed">
            Ana ekranda oyuncu adını yaz. Kayıt, e-posta veya şifre gerekmez — sadece bir isim yeter.
            TürkiyeGuessr tamamen <strong className="text-gray-300">ücretsiz</strong> bir konum tahmin oyunudur.
          </p>
        </section>

        <figure className="my-8 rounded-xl overflow-hidden">
          <Image
            src="/images/pages/step-1.jpg"
            alt="Adım 1: Bölge seçimi"
            width={800}
            height={450}
            className="w-full h-auto rounded-xl"
            priority
          />
          <figcaption className="text-center text-sm text-gray-500 mt-2">Adım 1: Bölge ve mod seçimi</figcaption>
        </figure>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">2. Oyun Modunu Seç</h2>
          <p className="text-gray-400 leading-relaxed">
            İki farklı mod arasından seçim yap:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
              <div className="text-2xl mb-2">🏙️</div>
              <h3 className="font-semibold text-gray-200">Urban / Yerleşim</h3>
              <p className="text-gray-500 text-sm mt-1">
                Tabela, işletme adı ve plaka kodlarını kullanarak şehir merkezlerinde konumu bul. 90 saniye, 3 hareket hakkı.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
              <div className="text-2xl mb-2">🏔️</div>
              <h3 className="font-semibold text-gray-200">Geo / Coğrafya</h3>
              <p className="text-gray-500 text-sm mt-1">
                Bitki örtüsü, topoğrafya ve doğal ipuçlarıyla kırsal alanlarda konumu tahmin et. 120 saniye, 4 hareket hakkı.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">3. Oda Oluştur veya Katıl</h2>
          <p className="text-gray-400 leading-relaxed">
            <strong className="text-gray-300">&quot;Yeni Oda Oluştur&quot;</strong> butonuna tıklayarak bir oda kur.
            Ekranda 6 haneli bir oda kodu belirecek — bu kodu arkadaşlarınla paylaş.
            Onlar da aynı kodu &quot;Oda Kodu&quot; alanına yazıp <strong className="text-gray-300">&quot;Odaya Katıl&quot;</strong> diyerek
            lobiye girer. 2-8 kişi aynı anda oynayabilir.
          </p>
        </section>

        <figure className="my-8 rounded-xl overflow-hidden">
          <Image
            src="/images/pages/step-2.jpg"
            alt="Adım 2: Konumu incele"
            width={800}
            height={450}
            className="w-full h-auto rounded-xl"
            priority
          />
          <figcaption className="text-center text-sm text-gray-500 mt-2">Adım 2: Sokak görünümünde konumu incele</figcaption>
        </figure>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">4. Sokak Görünümünde Keşfet</h2>
          <p className="text-gray-400 leading-relaxed">
            Oyun başladığında Google Street View üzerinde Türkiye&apos;nin rastgele bir noktasına düşersin.
            Etrafına bak, hareket haklarını kullanarak çevreyi keşfet, tabelaları oku ve ipuçlarını topla.
            Süren dolmadan haritaya tıklayarak tahminin nereye olduğunu işaretle.
          </p>
        </section>

        <figure className="my-8 rounded-xl overflow-hidden">
          <Image
            src="/images/pages/step-3.jpg"
            alt="Adım 3: Tahmini yap"
            width={800}
            height={450}
            className="w-full h-auto rounded-xl"
            priority
          />
          <figcaption className="text-center text-sm text-gray-500 mt-2">Adım 3: Haritada tahmini yap ve puan kazan</figcaption>
        </figure>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">5. Tahmin Et ve Puan Kazan</h2>
          <p className="text-gray-400 leading-relaxed">
            Haritada konumu işaretledikten sonra &quot;Tahmin Et&quot; butonuna bas.
            Pinin gerçek konuma ne kadar yakınsa o kadar yüksek puan alırsın.
            5 tur sonunda en yüksek toplam puana sahip oyuncu kazanır!
          </p>
        </section>

        <section className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-gray-200">İpuçları</h2>
          <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
            <li>Tabelalardaki il plaka kodlarına dikkat et (34 = İstanbul, 06 = Ankara)</li>
            <li>Dağ silüetleri, deniz kenarı ve bitki örtüsü bölgeyi daraltmana yardımcı olur</li>
            <li>Camilerin minareleri, yöresel mimari ve sokak desenleri güçlü ipuçlarıdır</li>
            <li>Hareket haklarını dikkatli kullan — her adım yeni bilgi getirir ama sınırlıdır</li>
          </ul>
        </section>

        {/* YouTube video buraya eklenecek - Video ID gerekli */}
        <div className="my-8 rounded-xl overflow-hidden bg-gray-800 aspect-video flex items-center justify-center">
          <div className="text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium">TürkiyeGuessr Tanıtım Videosu</p>
            <p className="text-sm">Yakında yayında!</p>
          </div>
        </div>

        {/* İlgili İçerikler */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">İlgili İçerikler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/multiplayer" className="bg-gray-800/40 border border-gray-700/30 rounded-lg px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors">
              → Multiplayer Modu
            </Link>
            <Link href="/geoguessr-alternatifi" className="bg-gray-800/40 border border-gray-700/30 rounded-lg px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors">
              → GeoGuessr Alternatifi
            </Link>
            <Link href="/bolgeler" className="bg-gray-800/40 border border-gray-700/30 rounded-lg px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors">
              → Tüm Bölgeler
            </Link>
            <Link href="/blog/geoguessr-taktikleri-ipuclari" className="bg-gray-800/40 border border-gray-700/30 rounded-lg px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors">
              → GeoGuessr Taktikleri ve İpuçları
            </Link>
            <Link href="/blog/sokaktan-sehir-nasil-taninir" className="bg-gray-800/40 border border-gray-700/30 rounded-lg px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors">
              → Sokaktan Şehir Nasıl Tanınır?
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
