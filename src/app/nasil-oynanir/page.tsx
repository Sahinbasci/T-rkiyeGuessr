import { Metadata } from "next";
import { SeoLayout } from "@/components/seo/SeoLayout";

export const metadata: Metadata = {
  title: "Nasıl Oynanır? — TürkiyeGuessr Adım Adım Rehber",
  description:
    "TürkiyeGuessr nasıl oynanır? Oda kur, arkadaşlarını davet et, sokak görünümünde konumu tahmin et. Adım adım Türkçe rehber.",
  alternates: { canonical: "/nasil-oynanir" },
};

export default function NasilOynanirPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Nasıl Oynanır", url: "/nasil-oynanir" },
      ]}
    >
      <article className="space-y-10">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            TürkiyeGuessr Nasıl Oynanır?
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Türkiye&apos;nin sokak görünümlerinde konumunu tahmin et, en yüksek puanı topla!
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">1. Oyuncu Adını Gir</h2>
          <p className="text-gray-400 leading-relaxed">
            Ana ekranda oyuncu adını yaz. Kayıt, e-posta veya şifre gerekmez — sadece bir isim yeter.
            TürkiyeGuessr tamamen <strong className="text-gray-300">ücretsiz</strong> bir konum tahmin oyunudur.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">2. Oyun Modunu Seç</h2>
          <p className="text-gray-400 leading-relaxed">
            İki farklı mod arasından seçim yap:
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
              <div className="text-2xl mb-2">🏙️</div>
              <h3 className="font-semibold text-gray-200">Urban / Yerleşim</h3>
              <p className="text-gray-500 text-sm mt-1">
                Tabela, işletme adı ve plaka kodlarını kullanarak şehir merkezlerinde konumu bul. 90 saniye, 3 hareket hakkı.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
              <div className="text-2xl mb-2">🏔️</div>
              <h3 className="font-semibold text-gray-200">Geo / Coğrafya</h3>
              <p className="text-gray-500 text-sm mt-1">
                Bitki örtüsü, topoğrafya ve doğal ipuçlarıyla kırsal alanlarda konumu tahmin et. 120 saniye, 4 hareket hakkı.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">3. Oda Oluştur veya Katıl</h2>
          <p className="text-gray-400 leading-relaxed">
            <strong className="text-gray-300">&quot;Yeni Oda Oluştur&quot;</strong> butonuna tıklayarak bir oda kur.
            Ekranda 6 haneli bir oda kodu belirecek — bu kodu arkadaşlarınla paylaş.
            Onlar da aynı kodu &quot;Oda Kodu&quot; alanına yazıp <strong className="text-gray-300">&quot;Odaya Katıl&quot;</strong> diyerek
            lobiye girer. 2-8 kişi aynı anda oynayabilir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">4. Sokak Görünümünde Keşfet</h2>
          <p className="text-gray-400 leading-relaxed">
            Oyun başladığında Google Street View üzerinde Türkiye&apos;nin rastgele bir noktasına düşersin.
            Etrafına bak, hareket haklarını kullanarak çevreyi keşfet, tabelaları oku ve ipuçlarını topla.
            Süren dolmadan haritaya tıklayarak tahminin nereye olduğunu işaretle.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">5. Tahmin Et ve Puan Kazan</h2>
          <p className="text-gray-400 leading-relaxed">
            Haritada konumu işaretledikten sonra &quot;Tahmin Et&quot; butonuna bas.
            Pinin gerçek konuma ne kadar yakınsa o kadar yüksek puan alırsın.
            5 tur sonunda en yüksek toplam puana sahip oyuncu kazanır!
          </p>
        </section>

        <section className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-gray-200">İpuçları</h2>
          <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
            <li>Tabelalardaki il plaka kodlarına dikkat et (34 = İstanbul, 06 = Ankara)</li>
            <li>Dağ silüetleri, deniz kenarı ve bitki örtüsü bölgeyi daraltmana yardımcı olur</li>
            <li>Camilerin minareleri, yöresel mimari ve sokak desenleri güçlü ipuçlarıdır</li>
            <li>Hareket haklarını dikkatli kullan — her adım yeni bilgi getirir ama sınırlıdır</li>
          </ul>
        </section>
      </article>
    </SeoLayout>
  );
}
