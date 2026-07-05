import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Yayın İlkeleri",
  description:
    "TürkiyeGuessr yayın ilkeleri. İçeriklerin nasıl hazırlandığı, ne sıklıkla güncellendiği, düzeltme süreci ve reklam şeffaflığı hakkında bilgi.",
  alternates: {
    canonical: "/yayin-ilkeleri",
    languages: { "tr-TR": "/yayin-ilkeleri", "x-default": "/yayin-ilkeleri" },
  },
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: `${SITE_URL}/yayin-ilkeleri`,
    siteName: "TürkiyeGuessr",
    title: "Yayın İlkeleri",
    description:
      "TürkiyeGuessr yayın ilkeleri. İçeriklerin nasıl hazırlandığı, ne sıklıkla güncellendiği, düzeltme süreci ve reklam şeffaflığı hakkında bilgi.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Yayın İlkeleri - TürkiyeGuessr",
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Yayın İlkeleri",
    description:
      "TürkiyeGuessr yayın ilkeleri. İçeriklerin nasıl hazırlandığı, ne sıklıkla güncellendiği, düzeltme süreci ve reklam şeffaflığı hakkında bilgi.",
  },
};

export default function YayinIlkeleriPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "TürkiyeGuessr Yayın İlkeleri",
    url: `${SITE_URL}/yayin-ilkeleri`,
    description:
      "TürkiyeGuessr içerik üretim yaklaşımı, reklam şeffaflığı ve düzeltme ilkeleri.",
  };

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Yayın İlkeleri", url: "/yayin-ilkeleri" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="space-y-8 max-w-3xl">
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Yayın İlkeleri
          </h1>
          <p className="text-gray-400 mt-3 leading-relaxed">
            TürkiyeGuessr&apos;daki bilgi sayfaları, şehir ve bölge içerikleri ile blog yazıları rastgele
            doldurulmuş boş şablonlardan değil; editoryal kontrol, içerik güncellemesi ve kullanıcı deneyimi
            odaklı bir süreçten geçer. Bu sayfa, içerikleri nasıl hazırladığımızı ve hangi şeffaflık
            ilkelerine bağlı kaldığımızı açıklar.
          </p>
          <p className="text-gray-500 text-sm mt-2">Son güncelleme: 9 Nisan 2026</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">1. Hangi İçerikleri Yayınlıyoruz?</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr üç ana içerik katmanından oluşur: oyun deneyimiyle bağlantılı lokasyon ve şehir sayfaları,
            keşif ve öğrenme amaçlı bölge / rehber sayfaları ve daha geniş bağlam sunan blog yazıları. Her katman
            kullanıcıya farklı bir değer sunar. Şehir sayfaları belirli bir lokasyonun ayırt edici ipuçlarını,
            bölge sayfaları coğrafi farklılıkları, blog yazıları ise yöntem, karşılaştırma, eğitim ve strateji tarafını
            açıklar.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Amacımız tek bir anahtar kelime için çok sayıda kopya sayfa üretmek değil; aynı oyunun farklı kullanım
            senaryolarına cevap veren, birbirine bağlı ama işlevsel olarak ayrışan sayfalar oluşturmaktır.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">2. İçerikleri Nasıl Hazırlıyoruz?</h2>
          <p className="text-gray-400 leading-relaxed">
            Lokasyon ve şehir sayfalarında kullandığımız metinler; Street View panoramalarının oynanış açısından
            ne tür ipuçları sunduğu, bölgesel mimari farklar, doğal çevre ve Türkiye&apos;deki gerçek coğrafi bağlam
            göz önüne alınarak hazırlanır. Blog içeriklerinde ise ürün deneyimi, kullanıcı geri bildirimi, oyun içi
            gözlem ve Türkiye coğrafyasıyla ilgili editoryal değerlendirme bir araya getirilir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Otomatik doldurulan yüzeysel metinlerden kaçınır, sayfanın amacıyla uyumlu açıklamalar yazmaya çalışırız.
            Yeni bir içerik üretirken önce kullanıcının o sayfaya neden geldiğini, sonra da o sayfanın ona hangi
            pratik faydayı sağlayacağını belirleriz.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">3. Güncelleme ve Düzeltme Politikası</h2>
          <p className="text-gray-400 leading-relaxed">
            İçerikler düzenli aralıklarla gözden geçirilir. Özellikle oyun modları, lokasyon sayısı, navigasyon yapısı
            ve politika sayfaları; ürün değişiklikleri olduğunda aynı gün veya en kısa sürede güncellenir. Tarihsel
            anlatım içeren blog yazılarında ise ana iskelet sabit kalsa bile bağlantılar, öneriler ve yönlendirmeler
            periyodik olarak tazelenir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Bir hata, kırık bağlantı veya eksik bilgi tespit edildiğinde bunu önceliklendirilmiş bir düzeltme olarak ele
            alırız. Kullanıcılardan gelen haklı düzeltme talepleri, içerik güncelleme planına dahil edilir. Düzeltme
            göndermek için{" "}
            <Link href="/iletisim" className="text-red-400 hover:underline">
              İletişim
            </Link>{" "}
            sayfasını veya e-posta adresimizi kullanabilirsiniz.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">4. Reklam ve Editoryal Şeffaflık</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr ücretsiz bir proje olduğu için reklam gelirleri sürdürülebilirlik açısından önemlidir; ancak
            editoryal kararları reklamverenlere göre şekillendirmeyiz. Şehir, bölge veya blog içerikleri ücret karşılığı
            sıralanmaz; sponsorlu bir içerik veya iş birliği olursa açık şekilde etiketlenir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Reklam yerleşiminde temel ilkemiz, kullanıcının içerik veya oyun akışıyla reklamı karıştırmamasıdır.
            Bu nedenle aktif oyun ekranında, geçiş düğmelerinin yanında veya yanlış tıklamaya yol açabilecek agresif
            bölgelerde standart içerik reklamı göstermemeyi tercih ederiz. Reklamların içerikten daha baskın hale gelmesi
            bizim için kabul edilebilir bir gelir modeli değildir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">5. Kaynak ve Bağlam Kullanımı</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, Google Maps ve Street View altyapısını kullanır; ancak oyuna ve içerik sayfalarına eklediğimiz
            açıklamalar, ilişkilendirmeler ve kullanıcıya dönük rehberlik bize aittir. Üçüncü taraf içerikleri kopyalayıp
            aynen yayınlamak yerine, onları anlamlı hale getiren bağlam ve yorum katmanı üretmeye çalışırız.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Özellikle rehber ve blog sayfalarında başka bir kaynağın tekrarını yapmak yerine, ürünü kullanan bir yayıncı
            olarak pratik gözlem, taktik, sınıf içi kullanım örneği veya karşılaştırmalı deneyim sunmayı hedefleriz.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">6. Bize Nasıl Ulaşabilirsiniz?</h2>
          <p className="text-gray-400 leading-relaxed">
            İçerik, reklam ayrımı, veri kullanımı veya düzeltme talepleriyle ilgili her konuda{" "}
            <a href="mailto:sahinbasci2002@gmail.com" className="text-red-400 hover:underline">
              sahinbasci2002@gmail.com
            </a>{" "}
            adresinden ulaşabilirsiniz. Daha fazla bağlam için aşağıdaki sayfalar da açıktır:
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/hakkimizda" className="text-red-400 hover:underline">
              Hakkımızda
            </Link>
            <Link href="/iletisim" className="text-red-400 hover:underline">
              İletişim
            </Link>
            <Link href="/gizlilik-politikasi" className="text-red-400 hover:underline">
              Gizlilik Politikası
            </Link>
            <Link href="/kullanim-kosullari" className="text-red-400 hover:underline">
              Kullanım Koşulları
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
