import { Metadata } from "next";
import { SeoLayout } from "@/components/seo/SeoLayout";

export const metadata: Metadata = {
  title: "KVKK Aydinlatma Metni",
  description:
    "TurkiyeGuessr KVKK aydinlatma metni. 6698 sayili Kanun kapsaminda kisisel verilerin islenmesine iliskin bilgilendirme.",
  alternates: { canonical: "/kvkk" },
};

export default function KVKKPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "KVKK Aydinlatma Metni", url: "/kvkk" },
      ]}
    >
      <article className="space-y-8 max-w-3xl">
        <header>
          <h1
            className="text-3xl sm:text-4xl font-bold tracking-wide"
            style={{ fontFamily: "var(--font-display)" }}
          >
            KVKK Aydinlatma Metni
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            6698 Sayili Kisisel Verilerin Korunmasi Kanunu Kapsaminda Aydinlatma Metni
          </p>
          <p className="text-gray-500 text-sm mt-1">Son guncelleme: 24 Subat 2026</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">1. Veri Sorumlusu</h2>
          <p className="text-gray-400 leading-relaxed">
            TurkiyeGuessr web sitesi (&quot;Site&quot;), bireysel bir gelistirici /
            proje yoneticisi tarafindan isletilmektedir. Kisisel verileriniz, 6698 sayili
            Kisisel Verilerin Korunmasi Kanunu (&quot;KVKK&quot;) kapsaminda asagida
            aciklanan amaclar dogrultusunda islenmektedir.
          </p>
          <div className="bg-gray-800/50 rounded-xl p-4">
            <p className="text-gray-400 text-sm">
              <strong className="text-gray-300">Veri Sorumlusu Iletisim:</strong>{" "}
              <a href="mailto:sahinbasci2002@gmail.com" className="text-red-400 hover:underline">
                sahinbasci2002@gmail.com
              </a>
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">2. Islenen Kisisel Veriler</h2>
          <p className="text-gray-400 leading-relaxed">
            TurkiyeGuessr, minimum veri toplama ilkesiyle calismaktadir:
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
                  <td className="py-3 px-4">Firebase tarafindan otomatik olusturulan anonim UID</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4">Oyuncu Adi</td>
                  <td className="py-3 px-4">Oyun sirasinda kullanicinin sectigi takim adi (gecici)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4">Oyun Verileri</td>
                  <td className="py-3 px-4">Skor, tahmin koordinatlari, oda kodlari (gecici)</td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-3 px-4">Teknik Veriler</td>
                  <td className="py-3 px-4">Tarayici turu, cihaz bilgisi, IP adresi (sunucu loglari)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">Cerez Verileri</td>
                  <td className="py-3 px-4">Oturum cerezleri, tercih cerezleri, reklam cerezleri (onayla)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">3. Veri Isleme Amaclari</h2>
          <ul className="space-y-2 text-gray-400 text-sm leading-relaxed">
            <li>&#8226; Oyun hizmetinin sunulmasi ve teknik altyapinin isletilmesi</li>
            <li>&#8226; Multiplayer oyun odalarinin yonetilmesi</li>
            <li>&#8226; Site guvenliginin saglanmasi ve kotuye kullaniminin onlenmesi</li>
            <li>&#8226; Site performansinin izlenmesi ve iyilestirilmesi</li>
            <li>&#8226; Yasal yukumluluklerin yerine getirilmesi</li>
            <li>&#8226; Reklam hizmetlerinin sunulmasi (onayla)</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">4. Hukuki Sebepler</h2>
          <p className="text-gray-400 leading-relaxed">
            Kisisel verileriniz, KVKK&apos;nin 5. maddesi kapsaminda asagidaki hukuki
            sebeplere dayanilarak islenmektedir:
          </p>
          <ul className="space-y-2 text-gray-400 text-sm leading-relaxed">
            <li>&#8226; <strong className="text-gray-300">Acik riza:</strong> Reklam ve analitik cerezleri icin (cerez banneri uzerinden)</li>
            <li>&#8226; <strong className="text-gray-300">Sozlesmenin ifasi:</strong> Oyun hizmetinin sunulmasi icin gerekli teknik veriler</li>
            <li>&#8226; <strong className="text-gray-300">Mesru menfaat:</strong> Site guvenligi ve performans izleme</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">5. Veri Aktarimi</h2>
          <p className="text-gray-400 leading-relaxed">
            Kisisel verileriniz, hizmet saglayicilarimiz araciligiyla yurt disina
            aktarilabilir:
          </p>
          <ul className="space-y-2 text-gray-400 text-sm leading-relaxed">
            <li>&#8226; <strong className="text-gray-300">Google LLC (ABD):</strong> Firebase, Google Maps, Google AdSense hizmetleri</li>
          </ul>
          <p className="text-gray-400 leading-relaxed text-sm">
            Google, AB-ABD Veri Gizliligi Cercevesi (EU-US Data Privacy Framework)
            kapsaminda yeterli koruma saglamaktadir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">6. Veri Saklama Suresi</h2>
          <ul className="space-y-2 text-gray-400 text-sm leading-relaxed">
            <li>&#8226; Oyun verileri (skor, oda): Oyun bittikten sonra otomatik silinir (dakikalar icinde)</li>
            <li>&#8226; Anonim UID: Tarayici oturumu suresince gecerli</li>
            <li>&#8226; Cerez tercihleri: 1 yil</li>
            <li>&#8226; Sunucu loglari: Maksimum 90 gun</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">7. KVKK Kapsamindaki Haklariniz</h2>
          <p className="text-gray-400 leading-relaxed">
            KVKK&apos;nin 11. maddesi kapsaminda asagidaki haklara sahipsiniz:
          </p>
          <div className="bg-gray-800/50 rounded-xl p-5 space-y-2">
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>&#8226; Kisisel verilerinizin islenip islenmedigini ogrenme</li>
              <li>&#8226; Islenmisse buna iliskin bilgi talep etme</li>
              <li>&#8226; Isleme amacini ve amacina uygun kullanilip kullanilmadigini ogrenme</li>
              <li>&#8226; Yurt icinde veya yurt disinda aktarildigi ucuncu kisileri bilme</li>
              <li>&#8226; Eksik veya yanlis islenmisse duzeltilmesini isteme</li>
              <li>&#8226; KVKK&apos;nin 7. maddesindeki sartlar cercevesinde silinmesini isteme</li>
              <li>&#8226; Yapilan islemlerin aktarildigi ucuncu kisilere bildirilmesini isteme</li>
              <li>&#8226; Islenen verilerin otomatik sistemlerle analiz edilmesi sonucu aleyhinize
                bir sonucun ortaya cikmasina itiraz etme</li>
              <li>&#8226; Kanuna aykiri islenmesi sebebiyle zarara ugramaniz halinde zararin
                giderilmesini talep etme</li>
            </ul>
          </div>
          <p className="text-gray-400 leading-relaxed text-sm">
            Haklarinizi kullanmak icin{" "}
            <a href="mailto:sahinbasci2002@gmail.com" className="text-red-400 hover:underline">
              sahinbasci2002@gmail.com
            </a>{" "}
            adresine e-posta konu basligina <code className="text-red-400 bg-red-500/10 px-1 rounded">[KVKK]</code> yazarak
            basvurabilirsiniz. Basvurunuz en gec 30 gun icinde yanitlanacaktir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">8. Ilgili Politikalar</h2>
          <ul className="space-y-2 text-gray-400 text-sm">
            <li>
              &#8226;{" "}
              <a href="/gizlilik-politikasi" className="text-red-400 hover:underline">
                Gizlilik Politikasi
              </a>
            </li>
            <li>
              &#8226;{" "}
              <a href="/cerez-politikasi" className="text-red-400 hover:underline">
                Cerez Politikasi
              </a>
            </li>
            <li>
              &#8226;{" "}
              <a href="/kullanim-kosullari" className="text-red-400 hover:underline">
                Kullanim Kosullari
              </a>
            </li>
          </ul>
        </section>
      </article>
    </SeoLayout>
  );
}
