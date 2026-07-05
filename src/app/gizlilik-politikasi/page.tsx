import { Metadata } from "next";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description:
    "TürkiyeGuessr gizlilik politikası. Kişisel verilerin korunması, çerez kullanımı ve KVKK hakları hakkında bilgi.",
  alternates: { canonical: "/gizlilik-politikasi", languages: { "tr-TR": "/gizlilik-politikasi", "x-default": "/gizlilik-politikasi" } },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${SITE_URL}/gizlilik-politikasi`,
    siteName: "TürkiyeGuessr",
    title: "Gizlilik Politikası",
    description:
      "TürkiyeGuessr gizlilik politikası. Kişisel verilerin korunması, çerez kullanımı ve KVKK hakları hakkında bilgi.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Gizlilik Politikası - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Gizlilik Politikası",
    description:
      "TürkiyeGuessr gizlilik politikası. Kişisel verilerin korunması, çerez kullanımı ve KVKK hakları hakkında bilgi.",
  },
  robots: { index: false, follow: true },
};

export default function GizlilikPolitikasiPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Gizlilik Politikası", url: "/gizlilik-politikasi" },
      ]}
    >
      <article className="space-y-8 max-w-3xl">
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Gizlilik Politikası
          </h1>
          <p className="text-gray-500 text-sm mt-2">Son güncelleme: 9 Nisan 2026</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">1. Genel Bakış</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr (&quot;Uygulama&quot;), kullanıcılarının gizliliğine saygı gösterir.
            Bu politika, hangi verilerin toplandığını, nasıl kullanıldığını ve
            6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamındaki
            haklarınızı açıklar.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">2. Toplanan Veriler</h2>

          <div className="space-y-3">
            <h3 className="text-base font-medium text-gray-300">2.1 Anonim Kimlik Doğrulama</h3>
            <p className="text-gray-400 leading-relaxed">
              Uygulama, Firebase Anonymous Authentication kullanır. Bu sistem sizin adınıza
              bir anonim kullanıcı kimliği (UID) oluşturur. Ad, e-posta veya şifre gibi
              kişisel bilgiler istenmez ve saklanmaz.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-medium text-gray-300">2.2 Oyun Verileri</h3>
            <p className="text-gray-400 leading-relaxed">
              Multiplayer oyun sırasında Firebase Realtime Database&apos;te geçici olarak
              saklanan veriler: oyuncu takma adı, tahmin koordinatları, skor ve oda bilgileri.
              Bu veriler oyun bittikten kısa süre sonra otomatik olarak silinir.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-medium text-gray-300">2.3 Tarayıcı Yerel Depolama (localStorage)</h3>
            <p className="text-gray-400 leading-relaxed">
              Daha iyi bir deneyim için tarayıcınızda yerel olarak saklanan veriler:
              oyuncu adı tercihi, konum tekrar önleme geçmişi (anonim pano ID&apos;leri)
              ve oturum bilgileri. Bu veriler sunucuya gönderilmez ve yalnızca
              cihazınızda tutulur. Tarayıcı ayarlarından istediğiniz zaman silebilirsiniz.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-medium text-gray-300">2.4 Google Maps API</h3>
            <p className="text-gray-400 leading-relaxed">
              Uygulama, Google Maps Platform hizmetlerini (Maps JavaScript API,
              Street View API) kullanır. Google, bu hizmetler aracılığıyla kendi
              gizlilik politikası kapsamında veri toplayabilir. Detaylar için{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-400 hover:text-red-300 underline"
              >
                Google Gizlilik Politikası
              </a>
              &apos;na bakabilirsiniz.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">3. Çerez Kullanımı</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr zorunlu çerezler (oturum yönetimi, Firebase kimlik doğrulama),
            analitik çerezler ve reklam çerezleri kullanmaktadır. Analitik ve reklam çerezleri
            yalnızca çerez banneri üzerinden onayı verdiğinizde etkinleştirilir. Detaylı bilgi
            için{" "}
            <a href="/cerez-politikasi" className="text-red-400 hover:text-red-300 underline">
              Çerez Politikamızı
            </a>{" "}
            inceleyebilirsiniz.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">4. Reklam Teknolojileri</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, Google AdSense altyapısını kullanabilir. Reklam amaçlı veri işleme,
            Google Consent Mode üzerinden varsayılan olarak kısıtlı başlatılır ve tercihlerinize göre güncellenir.
            Görsel reklam alanları yalnızca editoryal, bilgi ve rehber niteliğindeki sayfalarda gösterilir.
            Aktif oyun akışı, sonuç ekranı ve geçiş butonlarının çevresinde reklam yerleştirmemeyi tercih ederiz.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Google AdSense, ilgi alanınıza uygun reklamlar sunmak için çerezler kullanabilir.
            Bu çerezler yalnızca çerez tercihlerinizde &quot;Reklam / Pazarlama Çerezleri&quot;ni
            kabul ettiğinizde etkinleştirilir. Bu izni vermediğiniz durumda reklam amaçlı depolama ve
            kişiselleştirme etkinleşmez.
          </p>
          <p className="text-gray-400 leading-relaxed text-sm">
            Google reklam politikaları hakkında detaylı bilgi:{" "}
            <a
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-400 hover:text-red-300 underline"
            >
              Google Reklam Politikası
            </a>
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">5. Verilerin Paylaşımı</h2>
          <p className="text-gray-400 leading-relaxed">
            Kişisel verileriniz üçüncü taraflarla paylaşılmaz, satılmaz veya kiralanmaz.
            Veriler yalnızca oyun işlevselliği için kullanılır ve yukarıda belirtilen
            teknik altyapı sağlayıcıları (Google Firebase, Google Maps) tarafından
            işlenebilir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">6. KVKK Kapsamındaki Haklarınız</h2>
          <p className="text-gray-400 leading-relaxed">
            6698 sayılı KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
          </p>
          <ul className="list-disc list-inside text-gray-400 space-y-2 ml-2">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
            <li>KVKK&apos;nın 7. maddesinde öngörülen koşullar çerçevesinde silinmesini isteme</li>
            <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi
                suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">7. Veri Güvenliği</h2>
          <p className="text-gray-400 leading-relaxed">
            Verilerinizin güvenliği için HTTPS şifreleme, Firebase güvenlik kuralları,
            Content Security Policy (CSP) ve input doğrulama gibi teknik önlemler
            uygulanmaktadır.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">8. Çocukların Gizliliği</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr bilerek 13 yaş altı çocuklardan kişisel veri toplamaz.
            Anonim kimlik doğrulama sistemi sayesinde yaş bilgisi dahil hiçbir
            kişisel bilgi istenmez.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">9. Değişiklikler</h2>
          <p className="text-gray-400 leading-relaxed">
            Bu gizlilik politikası zaman zaman güncellenebilir. Önemli değişiklikler
            bu sayfada yayınlanacaktır. Sayfanın üst kısmındaki &quot;Son güncelleme&quot;
            tarihini kontrol ederek en güncel versiyonu takip edebilirsiniz.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">10. İletişim</h2>
          <p className="text-gray-400 leading-relaxed">
            Gizlilik politikamız veya kişisel verilerinizle ilgili sorularınız için{" "}
            <a href="mailto:sahinbasci2002@gmail.com" className="text-red-400 hover:underline">
              sahinbasci2002@gmail.com
            </a>{" "}
            adresinden bize ulaşabilirsiniz.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <a href="/cerez-politikasi" className="text-red-400 hover:underline">Çerez Politikası</a>
            <a href="/kullanim-kosullari" className="text-red-400 hover:underline">Kullanım Koşulları</a>
            <a href="/kvkk" className="text-red-400 hover:underline">KVKK Aydınlatma Metni</a>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
