import { Metadata } from "next";
import { SeoLayout } from "@/components/seo/SeoLayout";

export const metadata: Metadata = {
  title: "Cerez Politikasi",
  description:
    "TurkiyeGuessr cerez politikasi. Kullanilan cerez turleri, ucuncu taraf cerezleri ve cerez yonetimi hakkinda bilgi.",
  alternates: { canonical: "/cerez-politikasi" },
};

export default function CerezPolitikasiPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Cerez Politikasi", url: "/cerez-politikasi" },
      ]}
    >
      <article className="space-y-8 max-w-3xl">
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Cerez Politikasi
          </h1>
          <p className="text-gray-500 text-sm mt-2">Son guncelleme: 24 Subat 2026</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">1. Cerez Nedir?</h2>
          <p className="text-gray-400 leading-relaxed">
            Cerezler, web sitelerinin tarayiciniza kaydettiği kucuk metin dosyalaridir.
            TurkiyeGuessr, siteyi duzgun calistirmak, guvenligini saglamak ve kullanici
            deneyimini iyilestirmek icin cerezler ve benzer teknolojiler kullanir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">2. Kullandigimiz Cerez Turleri</h2>

          <div className="space-y-5">
            <div className="bg-gray-800/50 rounded-xl p-5">
              <h3 className="text-base font-medium text-green-400 mb-2">Zorunlu Cerezler (Her Zaman Aktif)</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Sitenin temel islevleri icin gereklidir. Oturum yonetimi, Firebase anonim
                kimlik dogrulama ve oyun durumu saklama bu kategoriye girer. Bu cerezler
                olmadan site duzgun calismaz.
              </p>
              <ul className="mt-3 space-y-1 text-gray-500 text-sm">
                <li>&#8226; Firebase Auth oturum cerezleri</li>
                <li>&#8226; Cerez tercih ayarlari (turkiyeguessr_consent)</li>
                <li>&#8226; localStorage uzerinden oyun durumu</li>
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-5">
              <h3 className="text-base font-medium text-blue-400 mb-2">Analitik Cerezler (Opsiyonel)</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Site kullanimini anlamamiza yardimci olur. Hangi sayfalarin ziyaret
                edildigini, kullanicilarin sitede ne kadar sure gecirdigini ve teknik
                hatalari olcmek icin kullanilir. Kisisel kimlik bilgisi icermez.
              </p>
              <ul className="mt-3 space-y-1 text-gray-500 text-sm">
                <li>&#8226; Firebase Analytics</li>
                <li>&#8226; Performans izleme metrikleri</li>
              </ul>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-5">
              <h3 className="text-base font-medium text-yellow-400 mb-2">Reklam / Pazarlama Cerezleri (Opsiyonel)</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Google AdSense araciligiyla reklam gosterimi icin kullanilir. Bu cerezler,
                ilgi alaniniza uygun reklamlar sunmak veya ayni reklamin kac kez
                gosterildigini sinirlamak icin kullanilabilir.
              </p>
              <ul className="mt-3 space-y-1 text-gray-500 text-sm">
                <li>&#8226; Google AdSense cerezleri</li>
                <li>&#8226; DoubleClick reklam cerezleri</li>
                <li>&#8226; Reklam kisiselleştirme tercihleri</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">3. Ucuncu Taraf Cerezleri</h2>
          <p className="text-gray-400 leading-relaxed">
            TurkiyeGuessr, asagidaki ucuncu taraf hizmetlerini kullanir. Bu hizmetler
            kendi cerez politikalarina tabidir:
          </p>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>
              <strong className="text-gray-300">Google Maps Platform:</strong>{" "}
              Harita ve Street View gosterimi icin. Cerez politikasi:{" "}
              <a href="https://policies.google.com/technologies/cookies" className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">
                Google Cerez Politikasi
              </a>
            </li>
            <li>
              <strong className="text-gray-300">Firebase (Google):</strong>{" "}
              Anonim kimlik dogrulama ve gercek zamanli veritabani. Cerez politikasi:{" "}
              <a href="https://firebase.google.com/support/privacy" className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">
                Firebase Gizlilik Politikasi
              </a>
            </li>
            <li>
              <strong className="text-gray-300">Google AdSense:</strong>{" "}
              Reklam gosterimi icin. Cerez politikasi:{" "}
              <a href="https://policies.google.com/technologies/ads" className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">
                Google Reklam Politikasi
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">4. Cerezleri Nasil Yonetebilirsiniz?</h2>
          <p className="text-gray-400 leading-relaxed">
            Sitemizi ilk ziyaretinizde gosterilen cerez bannerinden tercihlerinizi
            belirleyebilirsiniz. Istediginiz zaman sayfanin alt kismindaki
            &quot;Cerez Tercihleri&quot; baglantisindan ayarlarinizi degistirebilirsiniz.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Ayrica tarayicinizin ayarlarindan cerezleri silebilir veya engelleyebilirsiniz.
            Ancak zorunlu cerezlerin engellenmesi sitenin duzgun calismamarina neden olabilir.
          </p>
          <div className="bg-gray-800/50 rounded-xl p-5">
            <h3 className="text-base font-medium text-gray-300 mb-2">Tarayici Cerez Ayarlari</h3>
            <ul className="space-y-1 text-gray-500 text-sm">
              <li>&#8226; Chrome: Ayarlar &gt; Gizlilik ve guvenlik &gt; Cerezler</li>
              <li>&#8226; Firefox: Ayarlar &gt; Gizlilik &gt; Cerezler</li>
              <li>&#8226; Safari: Tercihler &gt; Gizlilik &gt; Cerezler</li>
              <li>&#8226; Edge: Ayarlar &gt; Cerezler ve site izinleri</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">5. Iletisim</h2>
          <p className="text-gray-400 leading-relaxed">
            Cerez politikamiz hakkinda sorulariniz icin{" "}
            <a href="mailto:sahinbasci2002@gmail.com" className="text-red-400 hover:underline">
              sahinbasci2002@gmail.com
            </a>{" "}
            adresinden bize ulasabilirsiniz.
          </p>
        </section>
      </article>
    </SeoLayout>
  );
}
