import { Metadata } from "next";
import Image from "next/image";
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
  alternates: { canonical: "/ucretsiz-cografya-oyunu", languages: { "tr-TR": "/ucretsiz-cografya-oyunu", "x-default": "/ucretsiz-cografya-oyunu" } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${SITE_URL}/ucretsiz-cografya-oyunu`,
    siteName: "TürkiyeGuessr",
    title: "Ücretsiz Coğrafya Oyunu — Türkiye'yi Keşfet",
    description:
      "Kayıt olmadan ücretsiz coğrafya oyunu oyna. Sokak görünümünde Türkiye'nin 7 bölgesini keşfet.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
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
  "@graph": [
    {
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
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Ücretsiz coğrafya oyunu gerçekten tamamen ücretsiz mi?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Evet, TürkiyeGuessr %100 ücretsizdir. Kayıt gerektirmez, kredi kartı bilgisi istemez ve hiçbir özellik ödeme duvarının arkasında değildir. Multiplayer modu dahil tüm özellikler ücretsiz sunulmaktadır.",
          },
        },
        {
          "@type": "Question",
          name: "Öğrenciler coğrafya sınavlarına hazırlanmak için bu oyunu kullanabilir mi?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Evet, TürkiyeGuessr özellikle YKS, LGS ve KPSS coğrafya konularına hazırlık için idealdir. Türkiye'nin 7 bölgesini, il konumlarını, bitki örtüsünü ve iklim özelliklerini interaktif olarak öğrenebilirsiniz.",
          },
        },
        {
          "@type": "Question",
          name: "Öğretmenler bu oyunu sınıfta nasıl kullanabilir?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Öğretmenler projeksiyon üzerinden sınıf yarışması düzenleyebilir, bölge bazlı ödevler verebilir, takım çalışması aktiviteleri oluşturabilir veya multiplayer modda tüm sınıfı aynı anda oynatabilir. Ücretsiz olması okul bütçesine yük getirmez.",
          },
        },
        {
          "@type": "Question",
          name: "Ücretsiz coğrafya oyunları ücretli olanlardan daha mı kötü?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Hayır, TürkiyeGuessr özellikle Türkiye coğrafyası konusunda ücretli alternatiflerden daha kapsamlıdır. 142+ özenle seçilmiş lokasyon, Türkçe arayüz, multiplayer modu ve bölge bazlı oyun seçenekleri sunar.",
          },
        },
        {
          "@type": "Question",
          name: "Coğrafya olimpiyatlarına hazırlıkta bu oyun faydalı mı?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Evet, coğrafya olimpiyatlarında sıklıkla sorulan Türkiye fiziki coğrafyası, bölge özellikleri ve il konumları konularında pratik yapmanın en etkili yollarından biridir. Görsel hafıza ve mekansal muhakeme becerilerinizi geliştirir.",
          },
        },
      ],
    },
  ],
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

        <figure className="my-8 rounded-xl overflow-hidden">
          <Image
            src="/images/pages/ucretsiz-cografya-hero.jpg"
            alt="Ücretsiz coğrafya oyunu ile Türkiye'yi keşfedin"
            width={800}
            height={450}
            className="w-full h-auto rounded-xl"
            priority
          />
          <figcaption className="text-center text-sm text-gray-500 mt-2">TürkiyeGuessr ile ücretsiz coğrafya öğrenme deneyimi</figcaption>
        </figure>

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

        <figure className="my-6 rounded-lg overflow-hidden">
          <Image
            src="/images/blog/classroom.jpg"
            alt="Sınıfta coğrafya eğitimi"
            width={600}
            height={340}
            className="w-full h-auto rounded-lg"
          />
          <figcaption className="text-center text-sm text-gray-500 mt-2">Interaktif coğrafya oyunları ile sınıf içi eğitim</figcaption>
        </figure>

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

        {/* Ücretsiz Coğrafya Oyunlarının Önemi */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Ücretsiz Coğrafya Oyunlarının Önemi</h2>
          <p className="text-gray-400 leading-relaxed">
            Coğrafya eğitimi, dijital çağda giderek daha fazla interaktif araçlara ihtiyaç duymaktadır.
            Ancak kaliteli eğitim araçlarının büyük çoğunluğu ücretli abonelik modeliyle sunulmaktadır
            ve bu durum, özellikle ekonomik zorluk yaşayan aileler ve kısıtlı bütçeli devlet okulları
            için ciddi bir erişim engeli oluşturur. Ücretsiz coğrafya oyunları bu engeli ortadan kaldırarak
            eğitimde fırsat eşitliği sağlar. Bir öğrencinin coğrafya bilgisini geliştirmesi, ailesinin
            aylık abonelik ödeyip ödeyememesine bağlı olmamalıdır.
          </p>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, bu ilkeyi temel alarak geliştirilmiştir. Türkiye&apos;nin herhangi bir
            köşesindeki bir öğrenci, internet erişimi olan bir cihazla — ister akıllı telefon ister
            okul bilgisayarı olsun — aynı kaliteli coğrafya deneyimine ulaşabilir. Bu demokratik
            yaklaşım, coğrafya eğitiminin yalnızca büyük şehirlerdeki özel okulların ayrıcalığı
            olmaktan çıkıp herkesin yararlanabileceği bir kaynak haline gelmesini sağlar.
          </p>
        </section>

        {/* Öğrenciler İçin Coğrafya Pratik Rehberi */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Öğrenciler İçin Coğrafya Pratik Rehberi</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr&apos;ı sınav hazırlığınızda etkili bir şekilde kullanmak için sistematik
            bir yaklaşım benimsemeniz önemlidir. İşte adım adım bir pratik planı:
          </p>
          <p className="text-gray-400 leading-relaxed">
            <strong className="text-gray-300">YKS/LGS hazırlığı</strong> için öncelikle bölge modunu kullanarak
            her bölgeyi ayrı ayrı çalışın. Marmara Bölgesi ile başlayıp sırasıyla diğer bölgelere geçin.
            Her bölgede en az 10 tur oynayarak o bölgenin bitki örtüsünü, arazi yapısını ve kentsel
            dokusunu görsel olarak öğrenin. Yanlış tahminlerinizi not alın — hangi bölgeleri karıştırdığınızı
            analiz etmek, zayıf noktalarınızı belirlemenizi sağlar.
          </p>
          <p className="text-gray-400 leading-relaxed">
            <strong className="text-gray-300">KPSS hazırlığı</strong> için ise klasik modda oynayarak tüm
            Türkiye genelinde pratik yapın. KPSS coğrafya sorularında sıklıkla sorulan il konumları,
            bölge sınırları ve iklim-bitki örtüsü ilişkilerini oyun üzerinden pekiştirebilirsiniz.
            Her turdan sonra doğru konumu inceleyerek o bölgenin coğrafi özelliklerini zihninizde kodlayın.
            Günde 15-20 dakikalık düzenli pratik, sınav performansınızda belirgin bir fark yaratacaktır.
          </p>
        </section>

        {/* Öğretmenler İçin Sınıf Aktivitesi Fikirleri */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Öğretmenler İçin Sınıf Aktivitesi Fikirleri</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr&apos;ı sınıfınızda kullanmanın yaratıcı yolları:
          </p>
          <ol className="space-y-3 text-gray-400 leading-relaxed">
            <li className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">1. Bölge Keşif Yarışması</h3>
              <p className="text-sm mt-1">
                Sınıfı 7 takıma bölün ve her takıma bir coğrafi bölge atayın. Takımlar kendi bölgelerinde
                5 tur oynar ve en yüksek toplam puanı alan takım kazanır. Yarışma sonrasında her takım
                bölgelerinin özelliklerini sınıfa sunar — bu hem rekabeti hem işbirlikçi öğrenmeyi teşvik eder.
              </p>
            </li>
            <li className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">2. Coğrafi Dedektif Günlüğü</h3>
              <p className="text-sm mt-1">
                Öğrenciler her turda gördükleri ipuçlarını (bitki örtüsü, mimari, iklim işaretleri) bir
                günlüğe not eder. Hafta sonunda günlükler toplanır ve en detaylı gözlem yapan öğrenci
                ödüllendirilir. Bu aktivite, gözlem becerisini ve yazılı ifade yeteneğini aynı anda geliştirir.
              </p>
            </li>
            <li className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">3. Haftalık Coğrafya Turnuvası</h3>
              <p className="text-sm mt-1">
                Her hafta multiplayer modda bir sınıf turnuvası düzenleyin. Öğrenciler bireysel olarak
                yarışır, haftalık ve dönemlik sıralamalar tutulur. Dönem sonu şampiyonuna küçük bir ödül
                vermek, tüm dönem boyunca motivasyonu yüksek tutar.
              </p>
            </li>
            <li className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">4. Karşılaştırmalı Bölge Analizi</h3>
              <p className="text-sm mt-1">
                İki farklı bölgede birer tur oynayın ve öğrencilerden bu bölgeler arasındaki farkları
                (iklim, bitki örtüsü, arazi yapısı, mimari) karşılaştıran bir tablo hazırlamalarını isteyin.
                Bu aktivite, analitik düşünme ve karşılaştırma becerilerini güçlendirir.
              </p>
            </li>
            <li className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">5. Sanal Gezi Projesi</h3>
              <p className="text-sm mt-1">
                Öğrenciler TürkiyeGuessr üzerinden bir bölgeyi keşfettikten sonra, o bölge hakkında
                bir sunum hazırlar. Sunumda oyun sırasında edindikleri gözlemleri, bölgenin coğrafi
                özelliklerini ve kültürel unsurlarını birleştirirler. Bu proje tabanlı öğrenme
                yaklaşımı, araştırma ve sunum becerilerini de geliştirir.
              </p>
            </li>
          </ol>
        </section>

        {/* Coğrafya Olimpiyatlarına Hazırlık */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Coğrafya Olimpiyatlarına Hazırlık</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye Coğrafya Olimpiyatı ve uluslararası coğrafya yarışmalarında başarılı olmak için
            teorik bilginin yanı sıra güçlü bir görsel coğrafya hafızası gereklidir. TürkiyeGuessr,
            olimpiyat hazırlığında özellikle Türkiye fiziki coğrafyası alanında pratik yapmanın en
            etkili yollarından biridir. Olimpiyat sorularında sıklıkla karşılaşılan bölge tanıma,
            iklim-bitki örtüsü eşleştirme ve topoğrafik analiz konularını oyun üzerinden
            pekiştirebilirsiniz.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Olimpiyata hazırlanan öğrenciler için önerilen strateji şudur: her gün en az 3 tam oyun
            (15 tur) oynayın, her yanlış tahminizde doğru konumun coğrafi özelliklerini araştırın
            ve bir hata günlüğü tutun. Bölge modunu sırayla kullanarak her bölgenin ayırt edici
            özelliklerini sistematik olarak öğrenin. Multiplayer modda arkadaşlarınızla yarışmak,
            olimpiyat sınavının rekabetçi ortamına hazırlanmanıza da yardımcı olur. Ücretsiz
            olması sayesinde hazırlık sürecinize hiçbir ek maliyet getirmeden sınırsız pratik
            yapabilirsiniz.
          </p>
        </section>

        {/* Ücretli vs Ücretsiz Coğrafya Oyunları */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Ücretli vs Ücretsiz Coğrafya Oyunları</h2>
          <p className="text-gray-400 leading-relaxed">
            Piyasadaki coğrafya oyunlarının çoğu freemium veya tam ücretli modellere sahiptir.
            Freemium oyunlarda genellikle günlük oyun sayısı sınırlıdır, multiplayer modu ücretlidir
            veya belirli bölgeler kilit altındadır. Tam ücretli oyunlar ise aylık 3-10 dolar arasında
            abonelik gerektirir. Bu modeller, özellikle öğrenciler ve eğitim kurumları için ciddi
            dezavantajlar yaratır: bir sınıftaki 30 öğrenciye bireysel abonelik almak pratik değildir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr ise tamamen ücretsiz bir model benimser. Tüm lokasyonlar, tüm oyun modları
            ve multiplayer özelliği herhangi bir ödeme veya kayıt gerektirmeden erişilebilir durumdadır.
            Bu yaklaşımın en büyük avantajı, eğitim amaçlı kullanımda herhangi bir sınırlama olmamasıdır.
            Bir öğretmen, sınıfındaki tüm öğrencilere anında erişim sağlayabilir; bir öğrenci, sınav
            hazırlığında sınırsız pratik yapabilir. Ücretli oyunların sunduğu dünya genelindeki
            lokasyonlar TürkiyeGuessr&apos;da bulunmaz, ancak Türkiye coğrafyasına odaklanmak
            isteyenler için 142&apos;den fazla özenle seçilmiş lokasyon, ücretli alternatiflerin
            Türkiye kapsamından çok daha geniştir.
          </p>
        </section>

        {/* SSS */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Sıkça Sorulan Sorular</h2>
          <div className="space-y-4">
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">Ücretsiz coğrafya oyunu gerçekten tamamen ücretsiz mi?</h3>
              <p className="text-gray-400 text-sm mt-2">
                Evet, TürkiyeGuessr %100 ücretsizdir. Kayıt gerektirmez, kredi kartı bilgisi istemez ve
                hiçbir özellik ödeme duvarının arkasında değildir. Multiplayer modu dahil tüm özellikler
                ücretsiz sunulmaktadır.
              </p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">Öğrenciler coğrafya sınavlarına hazırlanmak için bu oyunu kullanabilir mi?</h3>
              <p className="text-gray-400 text-sm mt-2">
                Evet, TürkiyeGuessr özellikle YKS, LGS ve KPSS coğrafya konularına hazırlık için idealdir.
                Türkiye&apos;nin 7 bölgesini, il konumlarını, bitki örtüsünü ve iklim özelliklerini
                interaktif olarak öğrenebilirsiniz.
              </p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">Öğretmenler bu oyunu sınıfta nasıl kullanabilir?</h3>
              <p className="text-gray-400 text-sm mt-2">
                Öğretmenler projeksiyon üzerinden sınıf yarışması düzenleyebilir, bölge bazlı ödevler
                verebilir, takım çalışması aktiviteleri oluşturabilir veya multiplayer modda tüm sınıfı
                aynı anda oynatabilir. Ücretsiz olması okul bütçesine yük getirmez.
              </p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">Ücretsiz coğrafya oyunları ücretli olanlardan daha mı kötü?</h3>
              <p className="text-gray-400 text-sm mt-2">
                Hayır, TürkiyeGuessr özellikle Türkiye coğrafyası konusunda ücretli alternatiflerden
                daha kapsamlıdır. 142+ özenle seçilmiş lokasyon, Türkçe arayüz, multiplayer modu ve
                bölge bazlı oyun seçenekleri sunar.
              </p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-4">
              <h3 className="text-gray-200 font-medium">Coğrafya olimpiyatlarına hazırlıkta bu oyun faydalı mı?</h3>
              <p className="text-gray-400 text-sm mt-2">
                Evet, coğrafya olimpiyatlarında sıklıkla sorulan Türkiye fiziki coğrafyası, bölge
                özellikleri ve il konumları konularında pratik yapmanın en etkili yollarından biridir.
                Görsel hafıza ve mekansal muhakeme becerilerinizi geliştirir.
              </p>
            </div>
          </div>
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
