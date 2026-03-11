import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Multiplayer Konum Tahmin Oyunu — Arkadaşlarınla Oyna",
  description:
    "TürkiyeGuessr ile arkadaşlarınla online multiplayer konum tahmin oyunu oyna. 2-8 kişi, ücretsiz, kayıt gerektirmez. Oda kur, kodu paylaş, yarış!",
  keywords: [
    "multiplayer harita oyunu",
    "online multiplayer coğrafya",
    "arkadaşlarla harita oyunu",
    "çok oyunculu konum tahmin",
  ],
  alternates: { canonical: "/multiplayer" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${SITE_URL}/multiplayer`,
    siteName: "TürkiyeGuessr",
    title: "Multiplayer Konum Tahmin Oyunu — Arkadaşlarınla Oyna",
    description:
      "TürkiyeGuessr ile arkadaşlarınla online multiplayer konum tahmin oyunu oyna. 2-8 kişi, ücretsiz, kayıt gerektirmez. Oda kur, kodu paylaş, yarış!",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Multiplayer Konum Tahmin Oyunu — Arkadaşlarınla Oyna - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Multiplayer Konum Tahmin Oyunu — Arkadaşlarınla Oyna",
    description:
      "TürkiyeGuessr ile arkadaşlarınla online multiplayer konum tahmin oyunu oyna. 2-8 kişi, ücretsiz, kayıt gerektirmez. Oda kur, kodu paylaş, yarış!",
  },
};

const MULTIPLAYER_FAQ = [
  { q: "Multiplayer oynamak ücretli mi?", a: "Hayır, TürkiyeGuessr tamamen ücretsizdir. Kayıt, e-posta veya ödeme gerekmez." },
  { q: "Maksimum kaç kişi oynayabilir?", a: "Bir odada 2 ile 8 kişi arasında oyuncu yarışabilir." },
  { q: "Oda kodu nasıl paylaşılır?", a: "Oda oluşturulduktan sonra 6 haneli kod ekranda görünür. Bu kodu arkadaşlarınıza WhatsApp, SMS veya herhangi bir mesajlaşma uygulaması ile gönderebilirsiniz." },
  { q: "Oyun ortasında katılabilir miyim?", a: "Oyun başladıktan sonra yeni oyuncu katılamaz. Herkesin lobiye girmesi gerekir." },
];

function MultiplayerFaqJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: MULTIPLAYER_FAQ.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function MultiplayerPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Multiplayer", url: "/multiplayer" },
      ]}
    >
      <MultiplayerFaqJsonLd />
      <article className="space-y-10">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Online Multiplayer Harita Oyunu
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Arkadaşlarınla aynı anda aynı konuma düşün, kim daha iyi bilecek?
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Nasıl Çalışır?</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr&apos;da multiplayer oynamak çok basit. Bir oyuncu oda kurar,
            diğerleri 6 haneli kodu girerek katılır. Her turda tüm oyunculara
            <strong className="text-gray-300"> aynı konum</strong> gösterilir — kim daha doğru tahmin ederse
            o daha çok puan kazanır. Kayıt, e-posta veya ödeme gerekmez.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Özellikler</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "2-8 Kişi", desc: "İkili düellodan büyük turnuvalara kadar" },
              { title: "Gerçek Zamanlı", desc: "Tüm oyuncular aynı anda yarışır" },
              { title: "Skor Tablosu", desc: "Her tur sonunda canlı sıralama" },
              { title: "%100 Ücretsiz", desc: "Kayıt yok, ödeme yok, reklam yok" },
              { title: "Oda Kodu Sistemi", desc: "6 haneli kod ile anında davet" },
              { title: "5 Tur Maç", desc: "Her tur farklı konum, toplam puan belirler" },
            ].map((f) => (
              <div key={f.title} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-200">{f.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Adım Adım</h2>
          <ol className="text-gray-400 space-y-3 list-decimal list-inside">
            <li>Oyuncu adını yaz ve oyun modunu seç</li>
            <li><strong className="text-gray-300">&quot;Yeni Oda Oluştur&quot;</strong> butonuna tıkla</li>
            <li>Ekrandaki 6 haneli oda kodunu arkadaşlarınla paylaş</li>
            <li>Herkes lobiye girince <strong className="text-gray-300">&quot;Oyunu Başlat&quot;</strong> de</li>
            <li>5 tur boyunca Türkiye&apos;yi keşfet ve tahminlerini yap</li>
            <li>En yüksek toplam puana sahip oyuncu kazanır!</li>
          </ol>
        </section>

        <section className="text-center py-6">
          <a
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Ücretsiz!
          </a>
          <p className="text-gray-600 text-sm mt-3">Kayıt gerektirmez. Tarayıcını aç ve başla.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Multiplayer İpuçları</h2>
          <div className="space-y-3 text-gray-400 leading-relaxed">
            <p>
              Multiplayer modda başarılı olmak için birkaç strateji öne çıkar. İlk olarak,
              <strong className="text-gray-300"> süreyi verimli kullanın</strong>: Sokak
              görünümünde etrafınıza bakarak plaka kodu, tabela veya doğal ipuçları arayın.
              İlk 10 saniyede hızlıca etrafı tarayıp bir hipotez oluşturun.
            </p>
            <p>
              İkinci olarak, <strong className="text-gray-300">hareket haklarınızı stratejik kullanın</strong>.
              Urban modda 3, Geo modda 4 hareket hakkınız var. Her adımda yeni bilgi elde etmeye
              çalışın — aynı yönde ilerlemeye devam etmek yerine, farklı yönlere bakarak
              daha fazla ipucu toplayabilirsiniz.
            </p>
            <p>
              Son olarak, <strong className="text-gray-300">yaklaşık tahmin yapmaktan korkmayın</strong>.
              Hiç tahmin yapmamanız 0 puan demektir. Bölgeyi doğru tahmin etmek bile
              ciddi puan getirir — mükemmel konum bilmek şart değil.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Sık Sorulan Sorular</h2>
          <div className="space-y-3">
            {MULTIPLAYER_FAQ.map((faq) => (
              <div key={faq.q} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-200 text-sm">{faq.q}</h3>
                <p className="text-gray-500 text-sm mt-1">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* İlgili İçerikler */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">İlgili İçerikler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/nasil-oynanir" className="bg-gray-800/40 border border-gray-700/30 rounded-lg px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors">
              → Nasıl Oynanır?
            </Link>
            <Link href="/geoguessr-alternatifi" className="bg-gray-800/40 border border-gray-700/30 rounded-lg px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors">
              → GeoGuessr Alternatifi
            </Link>
            <Link href="/sehirler" className="bg-gray-800/40 border border-gray-700/30 rounded-lg px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors">
              → 142+ Şehir Lokasyonu
            </Link>
            <Link href="/blog/turkiye-guessr-nasil-oynanir" className="bg-gray-800/40 border border-gray-700/30 rounded-lg px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors">
              → TürkiyeGuessr Nasıl Oynanır? (Blog)
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
