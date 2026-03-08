import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Ücretsiz Coğrafya Oyunu — Türkiye'yi Keşfet",
  description:
    "Kayıt olmadan ücretsiz coğrafya oyunu oyna. Sokak görünümünde Türkiye'nin 7 bölgesini keşfet.",
  keywords: [
    "ücretsiz coğrafya oyunu",
    "coğrafya oyunu online",
    "bedava coğrafya oyunu",
    "türkiye coğrafya quiz",
    "coğrafya bilgi yarışması",
    "harita bilmece oyunu",
    "coğrafya testi türkiye",
  ],
  alternates: { canonical: "/ucretsiz-cografya-oyunu" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://turkiyeguessr.xyz/ucretsiz-cografya-oyunu",
    siteName: "TürkiyeGuessr",
    title: "Ücretsiz Coğrafya Oyunu — Türkiye'yi Keşfet",
    description:
      "Kayıt olmadan ücretsiz coğrafya oyunu oyna. Sokak görünümünde Türkiye'nin 7 bölgesini keşfet.",
    images: [
      {
        url: "https://turkiyeguessr.xyz/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ücretsiz Coğrafya Oyunu — Türkiye'yi Keşfet - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Ücretsiz Coğrafya Oyunu — Türkiye'yi Keşfet",
    description:
      "Kayıt olmadan ücretsiz coğrafya oyunu oyna. Sokak görünümünde Türkiye'nin 7 bölgesini keşfet.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "TürkiyeGuessr — Ücretsiz Coğrafya Oyunu",
  url: SITE_URL,
  applicationCategory: "GameApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "TRY",
  },
  inLanguage: "tr",
  description:
    "Kayıt olmadan ücretsiz coğrafya oyunu oyna. Sokak görünümünde Türkiye'nin 7 bölgesini keşfet.",
};

const features = [
  {
    icon: "📍",
    title: "142+ Lokasyon",
    desc: "Türkiye genelinden özenle seçilmiş 142'den fazla gerçek sokak görünümü noktası.",
  },
  {
    icon: "🗺️",
    title: "7 Bölge",
    desc: "Marmara'dan Güneydoğu Anadolu'ya kadar tüm coğrafi bölgeler temsil ediliyor.",
  },
  {
    icon: "👥",
    title: "Multiplayer (2-8 Kişi)",
    desc: "Arkadaşlarınla oda oluştur, gerçek zamanlı yarış. Tamamen ücretsiz.",
  },
  {
    icon: "📱",
    title: "Mobil Uyumlu",
    desc: "Uygulama indirmeye gerek yok. Telefon, tablet veya bilgisayardan tarayıcıda oyna.",
  },
];

export default function UcretsizCografyaOyunuPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Ücretsiz Coğrafya Oyunu", url: "/ucretsiz-cografya-oyunu" },
      ]}
    >
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="space-y-10">
        {/* H1 + Intro */}
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Ücretsiz Coğrafya Oyunu — Türkiye&apos;yi Keşfet
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            <strong className="text-gray-300">TürkiyeGuessr</strong>, hiçbir ücret ödemeden
            ve kayıt olmadan oynayabileceğin tamamen ücretsiz bir coğrafya oyunudur. Google
            Sokak Görünümü üzerinden Türkiye&apos;nin dört bir yanını keşfederek coğrafya
            bilgini test et. Ödeme duvarı yok, reklam duvarı yok — tarayıcını aç ve
            hemen oynamaya başla.
          </p>
        </header>

        {/* Neden Ücretsiz? */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Neden Ücretsiz?</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, coğrafya eğitiminin ve eğlencesinin herkes için erişilebilir olması
            gerektiğine inanan bir topluluk projesidir. Kayıt zorunluluğu yoktur, aylık abonelik
            ücreti yoktur ve gizli bir ödeme duvarı yoktur. Oyun tamamen ücretsiz olarak
            sunulmaktadır ve bu şekilde kalmaya devam edecektir. Projemiz açık topluluk desteğiyle
            gelişmeye devam ediyor; her yeni lokasyon ve özellik, Türkiye coğrafyasını seven
            kullanıcıların katkılarıyla şekilleniyor.
          </p>
        </section>

        {/* Karşılaştırma Tablosu */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">GeoGuessr ile Karşılaştırma</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-700/50 rounded-xl overflow-hidden">
              <thead className="bg-gray-800/80">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-300 font-medium">Özellik</th>
                  <th className="text-center px-4 py-3 text-gray-300 font-medium">GeoGuessr</th>
                  <th className="text-center px-4 py-3 text-red-400 font-medium">TürkiyeGuessr</th>
                </tr>
              </thead>
              <tbody className="text-gray-400">
                {[
                  ["Fiyat", "$3.99/ay", "Ücretsiz"],
                  ["Kayıt", "Zorunlu", "Gerekmez"],
                  ["Dil", "İngilizce", "Türkçe"],
                  ["Türkiye Lokasyonlar", "Sınırlı", "142+"],
                  ["Multiplayer", "Ücretli", "Ücretsiz"],
                ].map(([feature, geo, tr]) => (
                  <tr key={feature} className="border-t border-gray-700/30">
                    <td className="px-4 py-3 text-gray-300">{feature}</td>
                    <td className="px-4 py-3 text-center">{geo}</td>
                    <td className="px-4 py-3 text-center text-green-400 font-medium">{tr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Özellikler */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Özellikler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-gray-800/50 rounded-xl p-6 space-y-2"
              >
                <div className="text-3xl" aria-hidden="true">{f.icon}</div>
                <h3 className="text-lg font-semibold text-gray-200">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Eğitim İçin İdeal */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Eğitim İçin İdeal</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr yalnızca bir eğlence aracı değil, aynı zamanda güçlü bir eğitim
            kaynağıdır. Öğretmenler, coğrafya derslerini interaktif hale getirmek için
            TürkiyeGuessr&apos;ı sınıflarında kullanabilir. Öğrenciler, Türkiye&apos;nin
            bölgelerini, şehirlerini ve doğal güzelliklerini sokak görünümünde keşfederek
            ezberden uzak, deneyime dayalı bir öğrenme süreci yaşar.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Multiplayer modu sayesinde sınıf içi yarışmalar düzenlenebilir; öğrenciler
            takımlar halinde ya da bireysel olarak coğrafya bilgilerini test edebilir.
            Ücretsiz olması, hiçbir okulun bütçe kısıtlaması nedeniyle bu araçtan
            mahrum kalmaması anlamına gelir. KPSS, YKS ve LGS sınavlarına hazırlanan
            öğrenciler için de Türkiye coğrafyasını pratik yaparak öğrenmenin en
            etkili yollarından biridir.
          </p>
        </section>

        {/* CTA */}
        <section className="text-center py-8 space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Hemen Ücretsiz Oynamaya Başla!
          </h2>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Ücretsiz Oyna — Hemen Başla
          </Link>
          <p className="text-gray-600 text-sm">
            Kayıt yok. Kredi kartı yok. Sadece coğrafya.
          </p>
        </section>

        {/* Keşfetmeye Devam Et */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Keşfetmeye Devam Et</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/geoguessr-alternatifi"
              className="text-sm text-gray-400 hover:text-white underline transition-colors"
            >
              GeoGuessr Alternatifi
            </Link>
            <Link
              href="/nasil-oynanir"
              className="text-sm text-gray-400 hover:text-white underline transition-colors"
            >
              Nasıl Oynanır?
            </Link>
            <Link
              href="/bolgeler"
              className="text-sm text-gray-400 hover:text-white underline transition-colors"
            >
              Tüm Bölgeler
            </Link>
            <Link
              href="/sehirler"
              className="text-sm text-gray-400 hover:text-white underline transition-colors"
            >
              Tüm Şehirler
            </Link>
            <Link
              href="/blog"
              className="text-sm text-gray-400 hover:text-white underline transition-colors"
            >
              Blog
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
