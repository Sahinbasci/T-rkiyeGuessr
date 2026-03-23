import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Sıkça Sorulan Sorular (SSS)",
  description:
    "TürkiyeGuessr hakkında sıkça sorulan sorular. Nasıl oynanır, ücretli mi, kaç kişi oynayabilir, hangi cihazlarda çalışır?",
  keywords: [
    "türkiyeguessr sss",
    "konum tahmin oyunu nasıl oynanır",
    "türkiye guessr ücretsiz mi",
  ],
  alternates: { canonical: "/sss", languages: { "tr-TR": "/sss", "x-default": "/sss" } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${SITE_URL}/sss`,
    siteName: "TürkiyeGuessr",
    title: "Sıkça Sorulan Sorular (SSS)",
    description:
      "TürkiyeGuessr hakkında sıkça sorulan sorular. Nasıl oynanır, ücretli mi, kaç kişi oynayabilir, hangi cihazlarda çalışır?",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Sıkça Sorulan Sorular (SSS) - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Sıkça Sorulan Sorular (SSS)",
    description:
      "TürkiyeGuessr hakkında sıkça sorulan sorular. Nasıl oynanır, ücretli mi, kaç kişi oynayabilir, hangi cihazlarda çalışır?",
  },
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
  {
    q: "TürkiyeGuessr'da puan nasıl hesaplanır?",
    a: "Puanlama, gerçek konum ile tahmininiz arasındaki mesafeye göre yapılır. Ne kadar yakın tahmin ederseniz o kadar çok puan alırsınız. 150 km altı mükemmel bir tahmin sayılır. Her oyun 5 turdan oluşur ve toplam puanınız tüm turların toplamıdır. Maksimum puan tur başına 5000'dir.",
  },
  {
    q: "Konum tahmin ederken hangi ipuçlarına dikkat etmeliyim?",
    a: (
      <>
        En güçlü ipuçları: araç plakaları (il kodları), yol tabelaları, bitki örtüsü,
        mimari tarz ve arazi yapısıdır. Örneğin çay bahçeleri Karadeniz&apos;i, zeytinlikler
        Ege&apos;yi, taş evler Güneydoğu&apos;yu işaret eder. Plaka kodlarını bilmek büyük avantaj sağlar.{" "}
        <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-red-400 hover:underline">
          Detaylı ipuçları rehberi
        </Link>.
      </>
    ),
  },
  {
    q: "Hesap oluşturmam gerekiyor mu?",
    a: "Hayır, TürkiyeGuessr'da hesap oluşturmanız veya kayıt olmanız gerekmez. Siteye girdiğinizde bir oyuncu adı yazmanız yeterlidir. Kişisel bilgi, e-posta adresi veya şifre istenmez. Anında oynamaya başlayabilirsiniz.",
  },
  {
    q: "Türkiye dışında da oynayabilir miyim?",
    a: "Evet! TürkiyeGuessr'a dünyanın herhangi bir yerinden erişebilirsiniz. İnternet bağlantınız ve Google Street View'ı destekleyen bir tarayıcınız olması yeterlidir. Oyunun arayüzü tamamen Türkçedir ancak herkes oynayabilir.",
  },
  {
    q: "Yeni lokasyonlar ne sıklıkla ekleniyor?",
    a: "Düzenli olarak yeni lokasyonlar eklenmektedir. Her lokasyon, Street View kalitesi kontrol edilerek ve coğrafi denge gözetilerek elle seçilir. Güncel lokasyon sayısı 142'nin üzerindedir ve sürekli artmaktadır.",
  },
  {
    q: "TürkiyeGuessr'ı okulda veya sınıfta kullanabilir miyim?",
    a: (
      <>
        Kesinlikle! TürkiyeGuessr, coğrafya derslerinde interaktif bir öğrenme aracı olarak
        kullanılabilir. Multiplayer özelliği sayesinde sınıf içi yarışmalar düzenleyebilirsiniz.
        Ücretsiz olması herhangi bir okul bütçesi gerektirmez.{" "}
        <Link href="/hakkimizda" className="text-red-400 hover:underline">
          Eğitimde TürkiyeGuessr
        </Link>.
      </>
    ),
  },
  {
    q: "Plaka kodlarını nasıl öğrenebilirim?",
    a: (
      <>
        Plaka kodları, konum tahmin oyunlarında en güçlü ipuçlarından biridir. 01 Adana&apos;dan
        81 Düzce&apos;ye kadar her ilin benzersiz bir plaka kodu vardır. Oyun oynayarak doğal
        yoldan öğrenebilir veya rehberimize göz atabilirsiniz.{" "}
        <Link href="/blog/plaka-kodlarindan-il-tahmini" className="text-red-400 hover:underline">
          Plaka kodları rehberi
        </Link>.
      </>
    ),
  },
  {
    q: "İnternet bağlantısı ne kadar gerekli?",
    a: "TürkiyeGuessr, Google Street View panoramalarını yüklediği için stabil bir internet bağlantısı gerektirir. 3G/4G mobil internet yeterlidir ancak Wi-Fi bağlantısı daha akıcı bir deneyim sunar. Panoramalar önbelleğe alınmadığı için sürekli internet erişimi gerekir.",
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
      { q: "TürkiyeGuessr'da puan nasıl hesaplanır?", a: "Puanlama, gerçek konum ile tahmininiz arasındaki mesafeye göre yapılır. 150 km altı mükemmel bir tahmindir. Her oyun 5 turdan oluşur, maksimum puan tur başına 5000'dir." },
      { q: "Konum tahmin ederken hangi ipuçlarına dikkat etmeliyim?", a: "En güçlü ipuçları araç plakaları, yol tabelaları, bitki örtüsü, mimari tarz ve arazi yapısıdır." },
      { q: "Hesap oluşturmam gerekiyor mu?", a: "Hayır, kayıt veya hesap oluşturmak gerekmez. Oyuncu adı yazmanız yeterlidir." },
      { q: "Türkiye dışında da oynayabilir miyim?", a: "Evet, dünyanın herhangi bir yerinden internet bağlantısıyla oynayabilirsiniz." },
      { q: "Yeni lokasyonlar ne sıklıkla ekleniyor?", a: "Düzenli olarak yeni lokasyonlar eklenmektedir. Her lokasyon elle seçilir ve kalitesi kontrol edilir." },
      { q: "TürkiyeGuessr'ı okulda kullanabilir miyim?", a: "Evet, coğrafya derslerinde interaktif öğrenme aracı olarak kullanılabilir. Ücretsizdir ve okul bütçesi gerektirmez." },
      { q: "Plaka kodlarını nasıl öğrenebilirim?", a: "01'den 81'e kadar her ilin benzersiz plaka kodu vardır. Oyun oynayarak doğal yoldan öğrenebilirsiniz." },
      { q: "İnternet bağlantısı ne kadar gerekli?", a: "Google Street View panoramalarını yüklemek için stabil internet bağlantısı gerekir. 3G/4G yeterlidir." },
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
