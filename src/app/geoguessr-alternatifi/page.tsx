import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

const faqItems = [
  {
    question: "TürkiyeGuessr gerçekten ücretsiz mi?",
    answer:
      "Evet, TürkiyeGuessr tamamen ücretsizdir. Gizli ücret, abonelik veya uygulama içi satın alım yoktur. Tarayıcınızı açıp anında oynamaya başlayabilirsiniz.",
  },
  {
    question: "GeoGuessr hesabım var, neden TürkiyeGuessr kullanayım?",
    answer:
      "GeoGuessr dünya genelinde harika bir deneyim sunar ancak Türkiye lokasyonları sınırlıdır ve otomatik olarak seçilir. TürkiyeGuessr'da ise 142'den fazla elle seçilmiş Türkiye lokasyonu, Türkçe arayüz ve Türkiye'nin 7 bölgesine odaklanan özel içerik bulunur. İki platformu birlikte kullanabilirsiniz.",
  },
  {
    question: "TürkiyeGuessr telefondan oynanır mı?",
    answer:
      "Evet, TürkiyeGuessr tamamen responsive tasarıma sahiptir. iPhone, Android veya tablet fark etmez; herhangi bir modern tarayıcıda sorunsuz çalışır. Uygulama indirmenize gerek yoktur.",
  },
  {
    question: "Kaç kişi aynı anda oynayabilir?",
    answer:
      "Multiplayer modunda aynı anda birden fazla oyuncu yarışabilir. Arkadaşlarınızla oda oluşturup davet linki paylaşmanız yeterli. Herkes aynı lokasyonu aynı anda tahmin eder.",
  },
  {
    question: "TürkiyeGuessr'da kaç lokasyon var?",
    answer:
      "Şu anda 142'den fazla küratörlü lokasyon bulunmaktadır. Bu lokasyonlar Türkiye'nin 7 coğrafi bölgesinden dengeli bir şekilde seçilmiştir ve düzenli olarak yeni lokasyonlar eklenmektedir.",
  },
  {
    question: "GeoGuessr'dan temel farkı nedir?",
    answer:
      "En büyük farklar şunlardır: TürkiyeGuessr tamamen ücretsiz ve kayıt gerektirmez, arayüz Türkçe'dir, lokasyonlar otomatik değil elle seçilmiştir ve içerik yalnızca Türkiye'ye odaklanır. Ayrıca kolay, orta ve zor olmak üzere üç farklı zorluk seviyesi sunar.",
  },
  {
    question: "İnternet bağlantısı ne kadar gerekli?",
    answer:
      "TürkiyeGuessr web tabanlı bir oyun olduğu için internet bağlantısı gereklidir. Ancak Google Street View görüntüleri optimize edilmiştir; ortalama bir mobil bağlantı bile yeterlidir. Yüksek hızlı internet zorunlu değildir.",
  },
  {
    question: "Yeni lokasyonlar ekleniyor mu?",
    answer:
      "Evet, düzenli olarak yeni lokasyonlar eklenmektedir. Topluluk geri bildirimleri doğrultusunda az bilinen turistik noktalar, tarihi yerler ve doğal güzellikler sürekli olarak lokasyon havuzuna dahil edilir.",
  },
];

export const metadata: Metadata = {
  title: "Ücretsiz GeoGuessr Alternatifi — Türkiye Konum Tahmin Oyunu",
  description:
    "GeoGuessr'a ücretsiz Türkçe alternatif arıyorsan TürkiyeGuessr tam sana göre. Kayıt yok, ödeme yok. 142+ Türkiye lokasyonu, multiplayer, anında oyna.",
  keywords: [
    "ücretsiz geoguessr alternatifi",
    "geoguessr türkiye",
    "geoguessr ücretsiz",
    "geoguessr benzeri oyunlar",
    "türkiye konum tahmin oyunu",
    "bedava geoguessr",
    "geotastic alternatifi",
    "geotastic türkiye",
    "geoguessr türkçe",
    "geoguessr türkiye ücretsiz",
    "geoguessr türkiye oyna",
    "geoguessr ücretsiz oyna",
    "neredeyim ben alternatifi",
  ],
  alternates: { canonical: "/geoguessr-alternatifi", languages: { "tr-TR": "/geoguessr-alternatifi", "x-default": "/geoguessr-alternatifi" } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${SITE_URL}/geoguessr-alternatifi`,
    siteName: "TürkiyeGuessr",
    title: "Ücretsiz GeoGuessr Alternatifi — Türkiye Konum Tahmin Oyunu",
    description:
      "GeoGuessr'a ücretsiz Türkçe alternatif arıyorsan TürkiyeGuessr tam sana göre. Kayıt yok, ödeme yok. 142+ Türkiye lokasyonu, multiplayer, anında oyna.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Ücretsiz GeoGuessr Alternatifi — Türkiye Konum Tahmin Oyunu - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Ücretsiz GeoGuessr Alternatifi — Türkiye Konum Tahmin Oyunu",
    description:
      "GeoGuessr'a ücretsiz Türkçe alternatif arıyorsan TürkiyeGuessr tam sana göre. Kayıt yok, ödeme yok. 142+ Türkiye lokasyonu, multiplayer, anında oyna.",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function GeoguessrAlternatifiPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "GeoGuessr Alternatifi", url: "/geoguessr-alternatifi" },
      ]}
    >
      {/* FAQPage JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <article className="space-y-10">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Ücretsiz GeoGuessr Alternatifi: TürkiyeGuessr
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            GeoGuessr&apos;ın ücretli duvarına takılmadan Türkiye&apos;yi keşfet.
            Kayıt yok, ödeme yok, sadece coğrafya.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Neden TürkiyeGuessr?</h2>
          <p className="text-gray-400 leading-relaxed">
            GeoGuessr harika bir oyun ama aylık $3.99 abonelik ücreti, zorunlu kayıt ve
            sınırlı Türkiye içeriğiyle herkes için ideal değil. <strong className="text-gray-300">TürkiyeGuessr</strong>,
            özellikle Türkiye coğrafyasına odaklanan, tamamen ücretsiz ve Türkçe bir alternatif olarak
            fark yaratıyor. Mobil cihazdan <strong className="text-gray-300">GeoGuessr Türkçe</strong> bir
            deneyim arıyorsan veya &quot;Neredeyim Ben&quot; uygulamasının web alternatifini
            istiyorsan, TürkiyeGuessr tam aradığın çözüm.
          </p>
        </section>

        {/* GeoGuessr Neden Pahalılaştı? */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">GeoGuessr Neden Pahalılaştı?</h2>
          <p className="text-gray-400 leading-relaxed">
            GeoGuessr 2013 yılında İsveçli bir geliştirici tarafından tamamen ücretsiz bir hobi projesi olarak hayata geçti.
            Google Maps API&apos;sini kullanan platform, başlangıçta herkesin sınırsızca oynayabildiği bir yapıdaydı.
            Ancak Google, 2018 yılında Maps API fiyatlandırmasını köklü bir şekilde değiştirdi. Önceden büyük ölçüde
            ücretsiz olan API çağrıları, kullanım bazlı ücretlendirmeye geçti. Bu değişiklik GeoGuessr&apos;ın
            işletme maliyetlerini katladı.
          </p>
          <p className="text-gray-400 leading-relaxed">
            2022 yılında GeoGuessr, ücretsiz oyuncuların günlük oyun hakkını ciddi oranda kısıtladı. Ardından ücretsiz
            modda Street View yerine düşük çözünürlüklü görüntülere geçildi. Pro abonelik $3.99/ay olarak belirlendi
            ve multiplayer gibi popüler özellikler ücretli duvarın arkasına alındı. Bu adımlar platformun sürdürülebilirliği
            için gerekli olsa da, özellikle Türkiye gibi yerel pazarlardaki oyuncular için erişim zorlaştı.
          </p>
          <p className="text-gray-400 leading-relaxed">
            İşte bu noktada ücretsiz ve yerel alternatifler önem kazandı. TürkiyeGuessr, Google Street View
            altyapısını verimli bir şekilde kullanarak ve yalnızca Türkiye&apos;ye odaklanarak API maliyetlerini düşük tutar.
            Böylece kayıt veya ödeme gerektirmeden kaliteli bir coğrafya oyunu deneyimi sunabilir.
          </p>
        </section>

        {/* TürkiyeGuessr'ı Kim İçin Öneriyoruz? */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">TürkiyeGuessr&apos;ı Kim İçin Öneriyoruz?</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-5 space-y-2">
              <h3 className="text-gray-200 font-semibold">🎓 Öğrenciler</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Coğrafya derslerinde Türkiye&apos;nin bölgelerini, şehirlerini ve doğal yapısını ezberlemek yerine
                görsel olarak öğrenmek isteyen öğrenciler için idealdir. Sınav öncesi tekrar yaparken harita
                bilgisini pekiştirmenin en eğlenceli yolu.
              </p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-5 space-y-2">
              <h3 className="text-gray-200 font-semibold">🧳 Gezginler</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Türkiye&apos;yi henüz keşfetmemiş veya bir sonraki seyahatini planlayanlar için sanal bir tur rehberi
                görevi görür. Az bilinen kasabaları, tarihi mekanları ve doğa harikalarını evden keşfedebilirsiniz.
              </p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-5 space-y-2">
              <h3 className="text-gray-200 font-semibold">👩‍🏫 Öğretmenler</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Sınıfta projeksiyon veya akıllı tahtayla interaktif coğrafya dersi vermek isteyen öğretmenler
                TürkiyeGuessr&apos;ı doğrudan müfredata entegre edebilir. Multiplayer moduyla sınıf içi
                yarışma düzenlemek mümkün.
              </p>
            </div>
            <div className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-5 space-y-2">
              <h3 className="text-gray-200 font-semibold">🎮 Arkadaş Grupları</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Akşam buluşmalarında veya uzaktan bağlantıda eğlenceli bir yarışma arayanlar için birebir.
                Multiplayer oda kurarak arkadaşlarınızla Türkiye bilginizi test edin, skorlarınızı karşılaştırın.
              </p>
            </div>
          </div>
        </section>

        {/* Detaylı Özellik Karşılaştırması */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Detaylı Özellik Karşılaştırması</h2>
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
                  ["Türkiye İçerik", "Sınırlı", "142+ Küratörlü Lokasyon"],
                  ["Multiplayer", "Ücretli", "Ücretsiz"],
                  ["Odak", "Dünya geneli", "Türkiye özelleşmiş"],
                  ["Mobil Destek", "Uygulama gerekli", "Tarayıcıda çalışır"],
                  ["Bölge Çeşitliliği", "Rastgele", "7 Bölge, dengeli dağılım"],
                  ["Lokasyon Kalitesi", "Otomatik seçim", "Elle seçilmiş, küratörlü"],
                  ["Bölge Odağı", "50+ ülke", "Türkiye'nin 7 bölgesi"],
                  ["Zorluk Seviyeleri", "Yok", "Kolay, Orta, Zor"],
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
          <p className="text-gray-500 text-xs">
            * GeoGuessr fiyatlandırması Mart 2026 itibarıyla günceldir. TürkiyeGuessr her zaman ücretsizdir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Türkiye&apos;ye Özel İçerik</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, Marmara&apos;dan Güneydoğu&apos;ya kadar Türkiye&apos;nin
            <strong className="text-gray-300"> 7 coğrafi bölgesinden</strong> titizlikle seçilmiş lokasyonlar sunar.
            İstanbul&apos;un tarihi sokaklarından Kapadokya&apos;nın peri bacalarına,
            Karadeniz yaylalarından Akdeniz sahillerine kadar gerçek Türkiye deneyimi.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Marmara", "Ege", "Akdeniz", "Karadeniz", "İç Anadolu", "Doğu Anadolu", "Güneydoğu"].map((r) => (
              <span key={r} className="bg-gray-800/60 border border-gray-700/40 rounded-lg px-3 py-1.5 text-xs text-gray-400">
                {r}
              </span>
            ))}
          </div>
        </section>

        {/* Kullanıcı Deneyimleri */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Kullanıcı Deneyimleri</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <blockquote className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-5 space-y-3">
              <p className="text-gray-400 text-sm leading-relaxed italic">
                &quot;Coğrafya sınavına çalışırken TürkiyeGuessr&apos;ı keşfettim. Bölgeleri ve şehirleri haritadan
                ezberlemeye çalışmak yerine görsel olarak tanımak çok daha kalıcı oldu. Sınavda
                Türkiye&apos;nin fiziki coğrafyası bölümünden tam puan aldım.&quot;
              </p>
              <footer className="text-gray-500 text-xs">— Elif K., Üniversite Öğrencisi, Ankara</footer>
            </blockquote>
            <blockquote className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-5 space-y-3">
              <p className="text-gray-400 text-sm leading-relaxed italic">
                &quot;Coğrafya derslerini daha etkileşimli hale getirmek istiyordum. TürkiyeGuessr ile
                sınıfta multiplayer yarışma düzenliyorum; öğrenciler ders boyunca ilgiyle katılıyor.
                Geleneksel yöntemlerle kıyaslanamayacak bir motivasyon artışı sağladı.&quot;
              </p>
              <footer className="text-gray-500 text-xs">— Mehmet A., Coğrafya Öğretmeni, İzmir</footer>
            </blockquote>
            <blockquote className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-5 space-y-3">
              <p className="text-gray-400 text-sm leading-relaxed italic">
                &quot;Almanya&apos;da yaşıyorum ve Türkiye&apos;yi çok özlüyorum. TürkiyeGuessr sayesinde
                memleketimin sokaklarını sanal olarak dolaşabiliyorum. Geçen hafta memleketime ait bir
                lokasyon geldi, gözlerim doldu. Gurbet hasretine birebir.&quot;
              </p>
              <footer className="text-gray-500 text-xs">— Ayşe T., Gurbetçi, Berlin</footer>
            </blockquote>
            <blockquote className="bg-gray-800/40 border border-gray-700/40 rounded-xl p-5 space-y-3">
              <p className="text-gray-400 text-sm leading-relaxed italic">
                &quot;Her Cuma akşamı arkadaşlarla TürkiyeGuessr oynuyoruz. Kim daha iyi biliyor diye
                yarışıyoruz. Multiplayer modu çok akıcı, hiç donma veya bekleme yok.
                GeoGuessr&apos;a para vermeden aynı eğlenceyi yaşıyoruz.&quot;
              </p>
              <footer className="text-gray-500 text-xs">— Can D., Yazılımcı, İstanbul</footer>
            </blockquote>
          </div>
        </section>

        <section className="text-center py-8 space-y-4">
          <h2 className="text-2xl font-bold text-white">GeoGuessr&apos;a Para Verme, TürkiyeGuessr Oyna!</h2>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Ücretsiz Oyna — Hemen Başla
          </Link>
          <p className="text-gray-600 text-sm">Kayıt yok. Kredi kartı yok. Sadece coğrafya.</p>
        </section>

        {/* Sıkça Sorulan Sorular */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-red-400">Sıkça Sorulan Sorular</h2>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <details
                key={item.question}
                className="group bg-gray-800/40 border border-gray-700/40 rounded-xl overflow-hidden"
              >
                <summary className="cursor-pointer px-5 py-4 text-gray-200 font-medium text-sm flex items-center justify-between hover:bg-gray-800/60 transition-colors">
                  <span>{item.question}</span>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform ml-3">▼</span>
                </summary>
                <div className="px-5 pb-4">
                  <p className="text-gray-400 text-sm leading-relaxed">{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Daha Fazlasını Keşfet</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/nasil-oynanir" className="text-sm text-gray-400 hover:text-white underline transition-colors">
              Nasıl Oynanır?
            </Link>
            <Link href="/multiplayer" className="text-sm text-gray-400 hover:text-white underline transition-colors">
              Multiplayer Modu
            </Link>
            <Link href="/bolgeler" className="text-sm text-gray-400 hover:text-white underline transition-colors">
              Tüm Bölgeler
            </Link>
            <Link href="/sehirler" className="text-sm text-gray-400 hover:text-white underline transition-colors">
              Tüm Şehirler
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
