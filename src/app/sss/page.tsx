import { Metadata } from "next";
import { SeoLayout } from "@/components/seo/SeoLayout";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular (SSS)",
  description:
    "TürkiyeGuessr hakkında sıkça sorulan sorular. Nasıl oynanır, ücretli mi, kaç kişi oynayabilir, hangi cihazlarda çalışır?",
  alternates: { canonical: "/sss" },
};

const FAQ_ITEMS = [
  {
    q: "TürkiyeGuessr nedir?",
    a: "TürkiyeGuessr, Google Street View kullanarak Türkiye'nin farklı lokasyonlarında konumunuzu tahmin ettiğiniz ücretsiz bir multiplayer coğrafya oyunudur. Arkadaşlarınızla oda kurarak birlikte oynayabilirsiniz.",
  },
  {
    q: "Arkadaşımla nasıl oynarım?",
    a: "Ana ekranda adınızı yazın, oyun modunu seçin ve 'Yeni Oda Oluştur' butonuna tıklayın. Ekranda çıkan 6 haneli oda kodunu arkadaşlarınızla paylaşın. Onlar da aynı kodu 'Oda Kodu' alanına yazıp 'Odaya Katıl' diyerek lobiye girer. Herkes hazır olduğunda host oyunu başlatır.",
  },
  {
    q: "Oyun ücretli mi?",
    a: "Hayır! TürkiyeGuessr %100 ücretsizdir. Kayıt, giriş veya ödeme gerektirmez. Tarayıcınızı açın, adınızı yazın ve oynamaya başlayın.",
  },
  {
    q: "Kaç kişi aynı anda oynayabilir?",
    a: "Bir odada 2 ile 8 kişi arası aynı anda oynayabilir. Herkese aynı konum gösterilir ve süre bitene kadar tahminler yapılır. En yüksek puanı toplayan oyuncu kazanır.",
  },
  {
    q: "Hangi cihazlarda oynanabilir?",
    a: "TürkiyeGuessr masaüstü, tablet ve mobil tarayıcılarda çalışır. Chrome, Safari, Firefox veya Edge — fark etmez. Uygulama indirmeniz gerekmez; tarayıcıdan doğrudan oynarsınız.",
  },
  {
    q: "Oyunda kaç lokasyon var?",
    a: "TürkiyeGuessr'da Türkiye'nin 7 bölgesinden 142'den fazla küratörlü lokasyon bulunmaktadır. Marmara'dan Güneydoğu'ya, Ege'den Karadeniz'e kadar geniş bir coğrafi yelpaze sunuyoruz.",
  },
  {
    q: "GeoGuessr'dan farkı ne?",
    a: "TürkiyeGuessr tamamen ücretsiz, tamamen Türkçe ve Türkiye'ye özel içerik sunar. GeoGuessr aylık $3.99 ücretli ve dünya geneline odaklıdır. TürkiyeGuessr'da kayıt gerekmez ve multiplayer ücretsizdir.",
  },
  {
    q: "Oyun modları arasındaki fark nedir?",
    a: "Urban/Yerleşim modunda şehir merkezlerinde tabela ve plaka kodlarını kullanarak konum bulursunuz (90sn, 3 hamle). Geo/Coğrafya modunda kırsal alanlarda bitki örtüsü ve topoğrafya ile tahmin yaparsınız (120sn, 4 hamle).",
  },
];

export default function SSSPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
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
