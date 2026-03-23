import { Metadata } from "next";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description:
    "TürkiyeGuessr çerez politikası. Kullanılan çerez türleri, üçüncü taraf çerezleri ve çerez yönetimi hakkında bilgi.",
  alternates: { canonical: "/cerez-politikasi", languages: { "tr-TR": "/cerez-politikasi", "x-default": "/cerez-politikasi" } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${SITE_URL}/cerez-politikasi`,
    siteName: "TürkiyeGuessr",
    title: "Çerez Politikası",
    description:
      "TürkiyeGuessr çerez politikası. Kullanılan çerez türleri, üçüncü taraf çerezleri ve çerez yönetimi hakkında bilgi.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Çerez Politikası - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Çerez Politikası",
    description:
      "TürkiyeGuessr çerez politikası. Kullanılan çerez türleri, üçüncü taraf çerezleri ve çerez yönetimi hakkında bilgi.",
  },
  robots: { index: false, follow: true },
};

export default function CerezPolitikasiPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Çerez Politikası", url: "/cerez-politikasi" },
      ]}
    >
      <article className="space-y-8 max-w-3xl">
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Çerez Politikası
          </h1>
          <p className="text-gray-500 text-sm mt-2">Son güncelleme: 25 Şubat 2026</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">1. Çerez Nedir?</h2>
          <p className="text-gray-400 leading-relaxed">
            Çerezler, web sitelerinin tarayıcınıza kaydettiği küçük metin dosyalarıdır.
            TürkiyeGuessr, siteyi düzgün çalıştırmak, güvenliğini sağlamak ve kullanıcı
            deneyimini iyileştirmek için çerezler ve benzer teknolojiler kullanır.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">2. Kullandığımız Çerez Türleri</h2>

          <div className="space-y-5">
            <div className="bg-gray-800/50 rounded-xl p-5">
              <h3 className="text-base font-medium text-green-400 mb-2">Zorunlu Çerezler (Her Zaman Aktif)</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Sitenin temel işlevleri için gereklidir. Oturum yönetimi, Firebase anonim
                kimlik doğrulama ve oyun durumu saklama bu kategoriye girer. Bu çerezler
                olmadan site düzgün çalışmaz.
              </p>
              <ul className="mt-3 space-y-1 text-gray-500 text-sm">
                <li>&#8226; Firebase Auth oturum çerezleri</li>
                <li>&#8226; Çerez tercih ayarları (turkiyeguessr_consent)</li>
                <li>&#8226; localStorage üzerinden oyun durumu</li>
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-5">
              <h3 className="text-base font-medium text-blue-400 mb-2">Analitik Çerezler (Opsiyonel)</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Site kullanımını anlamamıza yardımcı olur. Hangi sayfaların ziyaret
                edildiğini, kullanıcıların sitede ne kadar süre geçirdiğini ve teknik
                hataları ölçmek için kullanılır. Kişisel kimlik bilgisi içermez.
              </p>
              <ul className="mt-3 space-y-1 text-gray-500 text-sm">
                <li>&#8226; Firebase Analytics</li>
                <li>&#8226; Performans izleme metrikleri</li>
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-5">
              <h3 className="text-base font-medium text-yellow-400 mb-2">Reklam / Pazarlama Çerezleri (Opsiyonel)</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Google AdSense aracılığıyla reklam gösterimi için kullanılır. Bu çerezler,
                ilgi alanınıza uygun reklamlar sunmak veya aynı reklamın kaç kez
                gösterildiğini sınırlamak için kullanılabilir.
              </p>
              <ul className="mt-3 space-y-1 text-gray-500 text-sm">
                <li>&#8226; Google AdSense çerezleri</li>
                <li>&#8226; DoubleClick reklam çerezleri</li>
                <li>&#8226; Reklam kişiselleştirme tercihleri</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">3. Üçüncü Taraf Çerezleri</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, aşağıdaki üçüncü taraf hizmetlerini kullanır. Bu hizmetler
            kendi çerez politikalarına tabidir:
          </p>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>
              <strong className="text-gray-300">Google Maps Platform:</strong>{" "}
              Harita ve Street View gösterimi için. Çerez politikası:{" "}
              <a href="https://policies.google.com/technologies/cookies" className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">
                Google Çerez Politikası
              </a>
            </li>
            <li>
              <strong className="text-gray-300">Firebase (Google):</strong>{" "}
              Anonim kimlik doğrulama ve gerçek zamanlı veritabanı. Çerez politikası:{" "}
              <a href="https://firebase.google.com/support/privacy" className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">
                Firebase Gizlilik Politikası
              </a>
            </li>
            <li>
              <strong className="text-gray-300">Google AdSense:</strong>{" "}
              Reklam gösterimi için. Çerez politikası:{" "}
              <a href="https://policies.google.com/technologies/ads" className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">
                Google Reklam Politikası
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">4. Çerezleri Nasıl Yönetebilirsiniz?</h2>
          <p className="text-gray-400 leading-relaxed">
            Sitemizi ilk ziyaretinizde gösterilen çerez bannerinden tercihlerinizi
            belirleyebilirsiniz. İstediğiniz zaman sayfanın alt kısmındaki
            &quot;Çerez Tercihleri&quot; bağlantısından ayarlarınızı değiştirebilirsiniz.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Ayrıca tarayıcınızın ayarlarından çerezleri silebilir veya engelleyebilirsiniz.
            Ancak zorunlu çerezlerin engellenmesi sitenin düzgün çalışmamasına neden olabilir.
          </p>
          <div className="bg-gray-800/50 rounded-xl p-5">
            <h3 className="text-base font-medium text-gray-300 mb-2">Tarayıcı Çerez Ayarları</h3>
            <ul className="space-y-1 text-gray-500 text-sm">
              <li>&#8226; Chrome: Ayarlar &gt; Gizlilik ve güvenlik &gt; Çerezler</li>
              <li>&#8226; Firefox: Ayarlar &gt; Gizlilik &gt; Çerezler</li>
              <li>&#8226; Safari: Tercihler &gt; Gizlilik &gt; Çerezler</li>
              <li>&#8226; Edge: Ayarlar &gt; Çerezler ve site izinleri</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">5. İletişim</h2>
          <p className="text-gray-400 leading-relaxed">
            Çerez politikamız hakkında sorularınız için{" "}
            <a href="mailto:sahinbasci2002@gmail.com" className="text-red-400 hover:underline">
              sahinbasci2002@gmail.com
            </a>{" "}
            adresinden bize ulaşabilirsiniz.
          </p>
        </section>
      </article>
    </SeoLayout>
  );
}
