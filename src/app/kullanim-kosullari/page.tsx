import { Metadata } from "next";
import { SeoLayout } from "@/components/seo/SeoLayout";

export const metadata: Metadata = {
  title: "Kullanim Kosullari",
  description:
    "TurkiyeGuessr kullanim kosullari. Hizmet sartlari, fikri mulkiyet, sorumluluk siniri ve kullanici yukumlulukleri.",
  alternates: { canonical: "/kullanim-kosullari" },
};

export default function KullanimKosullariPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Kullanim Kosullari", url: "/kullanim-kosullari" },
      ]}
    >
      <article className="space-y-8 max-w-3xl">
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Kullanim Kosullari
          </h1>
          <p className="text-gray-500 text-sm mt-2">Son guncelleme: 24 Subat 2026</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">1. Genel</h2>
          <p className="text-gray-400 leading-relaxed">
            TurkiyeGuessr (&quot;Site&quot;), bireysel bir gelistirici tarafindan isletilen
            ucretsiz bir web tabanli konum tahmin oyunudur. Siteyi kullanarak bu kosullari
            kabul etmis sayilirsiniz. Kosullari kabul etmiyorsaniz siteyi kullanmayiniz.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">2. Hizmet Tanimi</h2>
          <p className="text-gray-400 leading-relaxed">
            TurkiyeGuessr, Google Maps Street View kullanarak Turkiye icindeki konumlari
            tahmin etmeye dayanan multiplayer bir oyun sunmaktadir. Oyun tamamen ucretsizdir
            ve hesap olusturma gerektirmez.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">3. Kullanici Yukumlulukleri</h2>
          <ul className="space-y-2 text-gray-400 text-sm leading-relaxed">
            <li>&#8226; Siteyi yasal amaclarla kullanmak</li>
            <li>&#8226; Diger oyuncularin deneyimini bozmamak (spam, taciz, hile)</li>
            <li>&#8226; Oyuncu adi olarak kufur, nefret soylemi veya uygunsuz icerik kullanmamak</li>
            <li>&#8226; Sitenin teknik altyapisina zarar vermemek (DDoS, bot, exploit vb.)</li>
            <li>&#8226; Google Maps hizmet kosullarina uymak</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">4. Fikri Mulkiyet</h2>
          <p className="text-gray-400 leading-relaxed">
            TurkiyeGuessr markasi, logosu, ozgun tasarimi ve yazilim kodu site yoneticisine
            aittir. Google Maps gorselleri ve Street View icerikleri Google LLC&apos;ye ait
            olup Google Maps Platform Kullanim Kosullari cercevesinde kullanilmaktadir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Sitedeki iceriklerin izinsiz kopyalanmasi, dagitilmasi veya ticari amacla
            kullanilmasi yasaktir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">5. Reklamlar</h2>
          <p className="text-gray-400 leading-relaxed">
            TurkiyeGuessr, Google AdSense araciligiyla reklam gosterebilir. Reklamlar
            oyun deneyimini bozmayacak sekilde, yalnizca lobi, round sonu ve oyun sonu
            gibi uygun anlarda gosterilir. Aktif oyun sirasinda reklam gosterilmez.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">6. Sorumluluk Siniri</h2>
          <p className="text-gray-400 leading-relaxed">
            TurkiyeGuessr &quot;oldugu gibi&quot; sunulmaktadir. Site yoneticisi:
          </p>
          <ul className="space-y-2 text-gray-400 text-sm leading-relaxed">
            <li>&#8226; Hizmetin kesintisiz veya hatasiz olacagini garanti etmez</li>
            <li>&#8226; Google Maps verilerin dogrulugundan sorumlu degildir</li>
            <li>&#8226; Teknik arizalar veya ucuncu taraf hizmet kesintilerinden kaynaklanan
              zararlardan sorumlu tutulamaz</li>
            <li>&#8226; Oyuncular arasindaki etkilesimlerde araci veya taraf degildir</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">7. Hesap ve Veri</h2>
          <p className="text-gray-400 leading-relaxed">
            TurkiyeGuessr hesap olusturma gerektirmez. Firebase anonim kimlik dogrulama
            kullanilir. Oyun verileri (oda kodlari, skorlar) gecici olarak saklanir ve
            oyun bittikten sonra otomatik olarak temizlenir. Kisisel veri isleme
            hakkinda detayli bilgi icin{" "}
            <a href="/gizlilik-politikasi" className="text-red-400 hover:underline">
              Gizlilik Politikamizi
            </a>{" "}
            inceleyebilirsiniz.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">8. Degisiklikler</h2>
          <p className="text-gray-400 leading-relaxed">
            Bu kosullar zaman zaman guncellenebilir. Onemli degisikliklerde site
            uzerinden bilgilendirme yapilir. Guncelleme sonrasi siteyi kullanmaya
            devam etmeniz, yeni kosullari kabul ettiginiz anlamina gelir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">9. Iletisim</h2>
          <p className="text-gray-400 leading-relaxed">
            Kullanim kosullari hakkinda sorulariniz icin{" "}
            <a href="mailto:sahinbasci2002@gmail.com" className="text-red-400 hover:underline">
              sahinbasci2002@gmail.com
            </a>{" "}
            adresinden bize ulasabilirsiniz.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">10. Uygulanacak Hukuk</h2>
          <p className="text-gray-400 leading-relaxed">
            Bu kosullar Turkiye Cumhuriyeti kanunlarina tabidir. Uyusmazliklarda
            Turkiye mahkemeleri yetkilidir.
          </p>
        </section>
      </article>
    </SeoLayout>
  );
}
