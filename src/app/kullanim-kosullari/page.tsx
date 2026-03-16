import { Metadata } from "next";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description:
    "TürkiyeGuessr kullanım koşulları. Hizmet şartları, fikri mülkiyet, sorumluluk sınırı ve kullanıcı yükümlülükleri.",
  alternates: { canonical: "/kullanim-kosullari", languages: { "tr-TR": "/kullanim-kosullari", "x-default": "/kullanim-kosullari" } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${SITE_URL}/kullanim-kosullari`,
    siteName: "TürkiyeGuessr",
    title: "Kullanım Koşulları",
    description:
      "TürkiyeGuessr kullanım koşulları. Hizmet şartları, fikri mülkiyet, sorumluluk sınırı ve kullanıcı yükümlülükleri.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Kullanım Koşulları - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Kullanım Koşulları",
    description:
      "TürkiyeGuessr kullanım koşulları. Hizmet şartları, fikri mülkiyet, sorumluluk sınırı ve kullanıcı yükümlülükleri.",
  },
};

export default function KullanimKosullariPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Kullanım Koşulları", url: "/kullanim-kosullari" },
      ]}
    >
      <article className="space-y-8 max-w-3xl">
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Kullanım Koşulları
          </h1>
          <p className="text-gray-500 text-sm mt-2">Son güncelleme: 24 Şubat 2026</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">1. Genel</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr (&quot;Site&quot;), bireysel bir geliştirici tarafından işletilen
            ücretsiz bir web tabanlı konum tahmin oyunudur. Siteyi kullanarak bu koşulları
            kabul etmiş sayılırsınız. Koşulları kabul etmiyorsanız siteyi kullanmayınız.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">2. Hizmet Tanımı</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, Google Maps Street View kullanarak Türkiye içindeki konumları
            tahmin etmeye dayanan multiplayer bir oyun sunmaktadır. Oyun tamamen ücretsizdir
            ve hesap oluşturma gerektirmez.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">3. Kullanıcı Yükümlülükleri</h2>
          <ul className="space-y-2 text-gray-400 text-sm leading-relaxed">
            <li>&#8226; Siteyi yasal amaçlarla kullanmak</li>
            <li>&#8226; Diğer oyuncuların deneyimini bozmamak (spam, taciz, hile)</li>
            <li>&#8226; Oyuncu adı olarak küfür, nefret söylemi veya uygunsuz içerik kullanmamak</li>
            <li>&#8226; Sitenin teknik altyapısına zarar vermemek (DDoS, bot, exploit vb.)</li>
            <li>&#8226; Google Maps hizmet koşullarına uymak</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">4. Fikri Mülkiyet</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr markası, logosu, özgün tasarımı ve yazılım kodu site yöneticisine
            aittir. Google Maps görselleri ve Street View içerikleri Google LLC&apos;ye ait
            olup Google Maps Platform Kullanım Koşulları çerçevesinde kullanılmaktadır.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Sitedeki içeriklerin izinsiz kopyalanması, dağıtılması veya ticari amaçla
            kullanılması yasaktır.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">5. Reklamlar</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, Google AdSense aracılığıyla reklam gösterebilir. Reklamlar
            oyun deneyimini bozmayacak şekilde, yalnızca lobi, round sonu ve oyun sonu
            gibi uygun anlarda gösterilir. Aktif oyun sırasında reklam gösterilmez.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">6. Sorumluluk Sınırı</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr &quot;olduğu gibi&quot; sunulmaktadır. Site yöneticisi:
          </p>
          <ul className="space-y-2 text-gray-400 text-sm leading-relaxed">
            <li>&#8226; Hizmetin kesintisiz veya hatasız olacağını garanti etmez</li>
            <li>&#8226; Google Maps verilerin doğruluğundan sorumlu değildir</li>
            <li>&#8226; Teknik arızalar veya üçüncü taraf hizmet kesintilerinden kaynaklanan
              zararlardan sorumlu tutulamaz</li>
            <li>&#8226; Oyuncular arasındaki etkileşimlerde aracı veya taraf değildir</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">7. Hesap ve Veri</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr hesap oluşturma gerektirmez. Firebase anonim kimlik doğrulama
            kullanılır. Oyun verileri (oda kodları, skorlar) geçici olarak saklanır ve
            oyun bittikten sonra otomatik olarak temizlenir. Kişisel veri işleme
            hakkında detaylı bilgi için{" "}
            <a href="/gizlilik-politikasi" className="text-red-400 hover:underline">
              Gizlilik Politikamızı
            </a>{" "}
            inceleyebilirsiniz.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">8. Değişiklikler</h2>
          <p className="text-gray-400 leading-relaxed">
            Bu koşullar zaman zaman güncellenebilir. Önemli değişikliklerde site
            üzerinden bilgilendirme yapılır. Güncelleme sonrası siteyi kullanmaya
            devam etmeniz, yeni koşulları kabul ettiğiniz anlamına gelir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">9. İletişim</h2>
          <p className="text-gray-400 leading-relaxed">
            Kullanım koşulları hakkında sorularınız için{" "}
            <a href="mailto:sahinbasci2002@gmail.com" className="text-red-400 hover:underline">
              sahinbasci2002@gmail.com
            </a>{" "}
            adresinden bize ulaşabilirsiniz.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">10. Uygulanacak Hukuk</h2>
          <p className="text-gray-400 leading-relaxed">
            Bu koşullar Türkiye Cumhuriyeti kanunlarına tabidir. Uyuşmazlıklarda
            Türkiye mahkemeleri yetkilidir.
          </p>
        </section>
      </article>
    </SeoLayout>
  );
}
