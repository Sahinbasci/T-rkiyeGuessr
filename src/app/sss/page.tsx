import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular (SSS)",
  description:
    "TürkiyeGuessr hakkında sıkça sorulan sorular. Nasıl oynanır, ücretli mi, kaç kişi oynayabilir, hangi cihazlarda çalışır?",
  keywords: [
    "türkiyeguessr sss",
    "konum tahmin oyunu nasıl oynanır",
    "türkiye guessr ücretsiz mi",
  ],
  alternates: { canonical: "/sss" },
};

const FAQ_ITEMS: { q: string; a: React.ReactNode }[] = [
  {
    q: "TürkiyeGuessr nedir?",
    a: (
      <>
        TürkiyeGuessr, Google Street View kullanarak Türkiye&apos;nin farklı lokasyonlarında
        konumunuzu tahmin ettiğiniz ücretsiz bir multiplayer coğrafya oyunudur.
        Arkadaşlarınızla oda kurarak birlikte oynayabilirsiniz.{" "}
        <Link href="/hakkimizda" className="text-red-400 hover:underline">
          Proje hakkında daha fazla bilgi
        </Link>.
      </>
    ),
  },
  {
    q: "Arkadaşımla nasıl oynarım?",
    a: (
      <>
        Ana ekranda adınızı yazın, oyun modunu seçin ve &quot;Yeni Oda Oluştur&quot; butonuna tıklayın.
        Ekranda çıkan 6 haneli oda kodunu arkadaşlarınızla paylaşın. Onlar da aynı kodu
        &quot;Oda Kodu&quot; alanına yazıp &quot;Odaya Katıl&quot; diyerek lobiye girer.
        Herkes hazır olduğunda host oyunu başlatır.{" "}
        <Link href="/nasil-oynanir" className="text-red-400 hover:underline">
          Adım adım rehber
        </Link>.
      </>
    ),
  },
  {
    q: "Oyun ücretli mi?",
    a: (
      <>
        Hayır! TürkiyeGuessr %100 ücretsizdir. Kayıt, giriş veya ödeme gerektirmez.
        Tarayıcınızı açın, adınızı yazın ve oynamaya başlayın. GeoGuessr&apos;ın aksine
        herhangi bir abonelik ücreti yoktur.{" "}
        <Link href="/ucretsiz-cografya-oyunu" className="text-red-400 hover:underline">
          Neden ücretsiz?
        </Link>
      </>
    ),
  },
  {
    q: "Kaç kişi aynı anda oynayabilir?",
    a: (
      <>
        Bir odada 2 ile 8 kişi arası aynı anda oynayabilir. Herkese aynı konum gösterilir
        ve süre bitene kadar tahminler yapılır. En yüksek puanı toplayan oyuncu kazanır.{" "}
        <Link href="/multiplayer" className="text-red-400 hover:underline">
          Multiplayer modu hakkında
        </Link>.
      </>
    ),
  },
  {
    q: "Hangi cihazlarda oynanabilir?",
    a: "TürkiyeGuessr masaüstü, tablet ve mobil tarayıcılarda çalışır. Chrome, Safari, Firefox veya Edge — fark etmez. Uygulama indirmeniz gerekmez; tarayıcıdan doğrudan oynarsınız.",
  },
  {
    q: "Oyunda kaç lokasyon var?",
    a: (
      <>
        TürkiyeGuessr&apos;da Türkiye&apos;nin{" "}
        <Link href="/bolgeler" className="text-red-400 hover:underline">
          7 bölgesinden
        </Link>{" "}
        <Link href="/sehirler" className="text-red-400 hover:underline">
          142&apos;den fazla küratörlü lokasyon
        </Link>{" "}
        bulunmaktadır. Marmara&apos;dan Güneydoğu&apos;ya, Ege&apos;den Karadeniz&apos;e
        kadar geniş bir coğrafi yelpaze sunuyoruz.
      </>
    ),
  },
  {
    q: "GeoGuessr'dan farkı ne?",
    a: (
      <>
        TürkiyeGuessr tamamen ücretsiz, tamamen Türkçe ve Türkiye&apos;ye özel içerik sunar.
        GeoGuessr aylık $3.99 ücretli ve dünya geneline odaklıdır. TürkiyeGuessr&apos;da
        kayıt gerekmez ve multiplayer ücretsizdir.{" "}
        <Link href="/geoguessr-alternatifi" className="text-red-400 hover:underline">
          Detaylı karşılaştırma
        </Link>.
      </>
    ),
  },
  {
    q: "Oyun modları arasındaki fark nedir?",
    a: (
      <>
        Urban/Yerleşim modunda şehir merkezlerinde tabela ve plaka kodlarını kullanarak
        konum bulursunuz (90sn, 3 hamle). Geo/Coğrafya modunda kırsal alanlarda bitki
        örtüsü ve topoğrafya ile tahmin yaparsınız (120sn, 4 hamle).{" "}
        <Link href="/nasil-oynanir" className="text-red-400 hover:underline">
          Detaylı mod açıklamaları
        </Link>.
      </>
    ),
  },
];

export default function SSSPage() {
  // JSON-LD için sadece metin versiyonlarını kullan
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { q: "TürkiyeGuessr nedir?", a: "TürkiyeGuessr, Google Street View kullanarak Türkiye'nin farklı lokasyonlarında konumunuzu tahmin ettiğiniz ücretsiz bir multiplayer coğrafya oyunudur." },
      { q: "Arkadaşımla nasıl oynarım?", a: "Ana ekranda adınızı yazın, oyun modunu seçin ve 'Yeni Oda Oluştur' butonuna tıklayın. Ekranda çıkan 6 haneli oda kodunu arkadaşlarınızla paylaşın." },
      { q: "Oyun ücretli mi?", a: "Hayır! TürkiyeGuessr %100 ücretsizdir. Kayıt, giriş veya ödeme gerektirmez." },
      { q: "Kaç kişi aynı anda oynayabilir?", a: "Bir odada 2 ile 8 kişi arası aynı anda oynayabilir." },
      { q: "Hangi cihazlarda oynanabilir?", a: "TürkiyeGuessr masaüstü, tablet ve mobil tarayıcılarda çalışır." },
      { q: "Oyunda kaç lokasyon var?", a: "TürkiyeGuessr'da Türkiye'nin 7 bölgesinden 142'den fazla küratörlü lokasyon bulunmaktadır." },
      { q: "GeoGuessr'dan farkı ne?", a: "TürkiyeGuessr tamamen ücretsiz, tamamen Türkçe ve Türkiye'ye özel içerik sunar." },
      { q: "Oyun modları arasındaki fark nedir?", a: "Urban modunda şehir merkezlerinde konum bulursunuz. Geo modunda kırsal alanlarda tahmin yaparsınız." },
    ].map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "SSS", url: "/sss" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <article className="space-y-8">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Sıkça Sorulan Sorular
          </h1>
          <p className="text-gray-400 mt-3">
            TürkiyeGuessr hakkında merak edilen her şey.
          </p>
        </header>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <details
              key={item.q}
              className="group bg-gray-800/40 border border-gray-700/50 rounded-xl"
            >
              <summary className="cursor-pointer px-5 py-4 text-sm sm:text-base font-medium text-gray-200 hover:text-white transition-colors list-none flex items-center justify-between">
                {item.q}
                <span className="text-gray-600 group-open:rotate-180 transition-transform ml-4 shrink-0" aria-hidden="true">
                  ▾
                </span>
              </summary>
              <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </article>
    </SeoLayout>
  );
}
