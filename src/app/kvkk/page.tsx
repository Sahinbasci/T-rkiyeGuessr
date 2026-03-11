import { Metadata } from "next";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description:
    "TürkiyeGuessr KVKK aydınlatma metni. 6698 sayılı Kanun kapsamında kişisel verilerin işlenmesine ilişkin bilgilendirme.",
  alternates: { canonical: "/kvkk" },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${SITE_URL}/kvkk`,
    siteName: "TürkiyeGuessr",
    title: "KVKK Aydınlatma Metni",
    description:
      "TürkiyeGuessr KVKK aydınlatma metni. 6698 sayılı Kanun kapsamında kişisel verilerin işlenmesine ilişkin bilgilendirme.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "KVKK Aydınlatma Metni - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "KVKK Aydınlatma Metni",
    description:
      "TürkiyeGuessr KVKK aydınlatma metni. 6698 sayılı Kanun kapsamında kişisel verilerin işlenmesine ilişkin bilgilendirme.",
  },
};

export default function KVKKPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "KVKK Aydınlatma Metni", url: "/kvkk" },
      ]}
    >
      <article className="space-y-8 max-w-3xl">
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            KVKK Aydınlatma Metni
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında Aydınlatma Metni
          </p>
          <p className="text-gray-500 text-sm mt-1">Son güncelleme: 24 Şubat 2026</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">1. Veri Sorumlusu</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr web sitesi (&quot;Site&quot;), bireysel bir geliştirici /
            proje yöneticisi tarafından işletilmektedir. Kişisel verileriniz, 6698 sayılı
            Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;) kapsamında aşağıda
            açıklanan amaçlar doğrultusunda işlenmektedir.
          </p>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-gray-400 text-sm">
              <strong className="text-gray-300">Veri Sorumlusu İletişim:</strong>{" "}
              <a href="mailto:sahinbasci2002@gmail.com" className="text-red-400 hover:underline">
                sahinbasci2002@gmail.com
              </a>
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">2. İşlenen Kişisel Veriler</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, minimum veri toplama ilkesiyle çalışmaktadır:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-400 border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Veri Kategorisi</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Detay</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4">Anonim Kimlik</td>
                  <td className="py-3 px-4">Firebase tarafından otomatik oluşturulan anonim UID</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4">Oyuncu Adı</td>
                  <td className="py-3 px-4">Oyun sırasında kullanıcının seçtiği takım adı (geçici)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4">Oyun Verileri</td>
                  <td className="py-3 px-4">Skor, tahmin koordinatları, oda kodları (geçici)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4">Teknik Veriler</td>
                  <td className="py-3 px-4">Tarayıcı türü, cihaz bilgisi, IP adresi (sunucu logları)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Çerez Verileri</td>
                  <td className="py-3 px-4">Oturum çerezleri, tercih çerezleri, reklam çerezleri (onaylı)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">3. Veri İşleme Amaçları</h2>
          <ul className="space-y-2 text-gray-400 text-sm leading-relaxed">
            <li>&#8226; Oyun hizmetinin sunulması ve teknik altyapının işletilmesi</li>
            <li>&#8226; Multiplayer oyun odalarının yönetilmesi</li>
            <li>&#8226; Site güvenliğinin sağlanması ve kötüye kullanımının önlenmesi</li>
            <li>&#8226; Site performansının izlenmesi ve iyileştirilmesi</li>
            <li>&#8226; Yasal yükümlülüklerin yerine getirilmesi</li>
            <li>&#8226; Reklam hizmetlerinin sunulması (onaylı)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">4. Hukuki Sebepler</h2>
          <p className="text-gray-400 leading-relaxed">
            Kişisel verileriniz, KVKK&apos;nın 5. maddesi kapsamında aşağıdaki hukuki
            sebeplere dayanılarak işlenmektedir:
          </p>
          <ul className="space-y-2 text-gray-400 text-sm leading-relaxed">
            <li>&#8226; <strong className="text-gray-300">Açık rıza:</strong> Reklam ve analitik çerezleri için (çerez banner&apos;ı üzerinden)</li>
            <li>&#8226; <strong className="text-gray-300">Sözleşmenin ifası:</strong> Oyun hizmetinin sunulması için gerekli teknik veriler</li>
            <li>&#8226; <strong className="text-gray-300">Meşru menfaat:</strong> Site güvenliği ve performans izleme</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">5. Veri Aktarımı</h2>
          <p className="text-gray-400 leading-relaxed">
            Kişisel verileriniz, hizmet sağlayıcılarımız aracılığıyla yurt dışına
            aktarılabilir:
          </p>
          <ul className="space-y-2 text-gray-400 text-sm leading-relaxed">
            <li>&#8226; <strong className="text-gray-300">Google LLC (ABD):</strong> Firebase, Google Maps, Google AdSense hizmetleri</li>
          </ul>
          <p className="text-gray-400 leading-relaxed text-sm">
            Google, AB-ABD Veri Gizliliği Çerçevesi (EU-US Data Privacy Framework)
            kapsamında yeterli koruma sağlamaktadır.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">6. Veri Saklama Süresi</h2>
          <ul className="space-y-2 text-gray-400 text-sm leading-relaxed">
            <li>&#8226; Oyun verileri (skor, oda): Oyun bittikten sonra otomatik silinir (dakikalar içinde)</li>
            <li>&#8226; Anonim UID: Tarayıcı oturumu süresince geçerli</li>
            <li>&#8226; Çerez tercihleri: 1 yıl</li>
            <li>&#8226; Sunucu logları: Maksimum 90 gün</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">7. KVKK Kapsamındaki Haklarınız</h2>
          <p className="text-gray-400 leading-relaxed">
            KVKK&apos;nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:
          </p>
          <div className="bg-gray-800/50 rounded-xl p-5 space-y-2">
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>&#8226; Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>&#8226; İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>&#8226; İşleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>&#8226; Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>&#8226; Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
              <li>&#8226; KVKK&apos;nın 7. maddesindeki şartlar çerçevesinde silinmesini isteme</li>
              <li>&#8226; Yapılan işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
              <li>&#8226; İşlenen verilerin otomatik sistemlerle analiz edilmesi sonucu aleyhinize
                bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>&#8226; Kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın
                giderilmesini talep etme</li>
            </ul>
          </div>
          <p className="text-gray-400 leading-relaxed text-sm">
            Haklarınızı kullanmak için{" "}
            <a href="mailto:sahinbasci2002@gmail.com" className="text-red-400 hover:underline">
              sahinbasci2002@gmail.com
            </a>{" "}
            adresine e-posta konu başlığına <code className="text-red-400 bg-red-500/10 px-1 rounded">[KVKK]</code> yazarak
            başvurabilirsiniz. Başvurunuz en geç 30 gün içinde yanıtlanacaktır.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">8. İlgili Politikalar</h2>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>
              &#8226;{" "}
              <a href="/gizlilik-politikasi" className="text-red-400 hover:underline">
                Gizlilik Politikası
              </a>
            </li>
            <li>
              &#8226;{" "}
              <a href="/cerez-politikasi" className="text-red-400 hover:underline">
                Çerez Politikası
              </a>
            </li>
            <li>
              &#8226;{" "}
              <a href="/kullanim-kosullari" className="text-red-400 hover:underline">
                Kullanım Koşulları
              </a>
            </li>
          </ul>
        </section>
      </article>
    </SeoLayout>
  );
}
