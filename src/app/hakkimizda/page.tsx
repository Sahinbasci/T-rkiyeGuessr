import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";

export const metadata: Metadata = {
  title: "Hakkımızda — TürkiyeGuessr Konum Tahmin Oyunu",
  description:
    "TürkiyeGuessr, Türkiye'ye odaklanan ücretsiz multiplayer konum tahmin oyunudur. Misyonumuz, Türk coğrafyasını eğlenceli ve eğitici bir şekilde keşfettirmek.",
  keywords: [
    "türkiyeguessr hakkında",
    "konum tahmin oyunu",
    "türkiye coğrafya oyunu",
    "turkiyeguessr nedir",
  ],
  alternates: { canonical: "/hakkimizda" },
};

export default function HakkimizdaPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Hakkımızda", url: "/hakkimizda" },
      ]}
    >
      <article className="space-y-8 max-w-3xl">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Hakkımızda
          </h1>
          <p className="text-gray-400 mt-3 leading-relaxed">
            TürkiyeGuessr, Türkiye coğrafyasını eğlenceli ve eğitici bir şekilde keşfetmenizi sağlayan
            bağımsız bir web projesidir.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">TürkiyeGuessr Nedir?</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, Google Street View kullanarak Türkiye&apos;nin dört bir yanından
            sokak görünümlerinde konum tahmin ettiğiniz ücretsiz bir multiplayer coğrafya oyunudur.
            142&apos;den fazla küratörlü lokasyon, 7 coğrafi bölge ve 2 farklı oyun moduyla
            Türkiye coğrafyasını eğlenceli ve rekabetçi bir şekilde keşfetmenizi sağlar.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Oyuncular, rastgele bir Türkiye lokasyonuna düşürülür ve çevredeki ipuçlarını
            kullanarak (tabelalar, plaka kodları, mimari, bitki örtüsü) konumlarını tahmin ederler.
            Tek başınıza oynayabilir veya arkadaşlarınızla 2-8 kişilik odalar kurarak
            rekabetçi bir şekilde yarışabilirsiniz.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Misyonumuz</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;nin zengin coğrafyasını, kültürel çeşitliliğini ve doğal güzelliklerini
            herkes için erişilebilir, ücretsiz ve eğlenceli bir platform üzerinden tanıtmak.
            Öğrencilerden coğrafya tutkunlarına, arkadaş gruplarından öğretmenlere kadar herkesin
            Türkiye&apos;yi oyun oynayarak keşfetmesini istiyoruz.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Türkiye, yedi farklı coğrafi bölgesiyle inanılmaz bir çeşitlilik sunar.
            Karadeniz&apos;in yemyeşil yaylaları, Ege&apos;nin zeytin ağaçlı kıyıları,
            Kapadokya&apos;nın peri bacaları, Güneydoğu&apos;nun tarihi yapıları...
            TürkiyeGuessr, tüm bu zenginliği bir oyun formatında sunarak coğrafya öğrenmeyi
            keyifli hale getirir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Nasıl Çalışır?</h2>
          <div className="space-y-3">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <h3 className="font-medium text-gray-300 mb-1">1. Adını Gir ve Oda Oluştur</h3>
              <p className="text-gray-500 text-sm">Kayıt gerekmez. Bir oyuncu adı gir, mod seç ve odanı oluştur.</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <h3 className="font-medium text-gray-300 mb-1">2. Sokak Görünümünde Keşfet</h3>
              <p className="text-gray-500 text-sm">Google Street View üzerinde Türkiye&apos;nin rastgele bir noktasına düşersin. Çevrendeki ipuçlarını kullan.</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <h3 className="font-medium text-gray-300 mb-1">3. Konumunu Tahmin Et</h3>
              <p className="text-gray-500 text-sm">Haritada tahminin nereye olduğunu işaretle. Gerçek konuma ne kadar yakınsan o kadar çok puan alırsın.</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
              <h3 className="font-medium text-gray-300 mb-1">4. Arkadaşlarınla Yarış</h3>
              <p className="text-gray-500 text-sm">5 tur sonunda en yüksek puanı toplayan oyuncu kazanır. Oda kodunu paylaşarak arkadaşlarını davet et.</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Oyun Modları</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-200 mb-2">Urban / Yerleşim Modu</h3>
              <p className="text-gray-500 text-sm">
                Şehir merkezlerinde tabela, plaka kodu ve işletme adlarını kullanarak konum bulun.
                90 saniye süre, 3 hareket hakkı.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-5">
              <h3 className="font-semibold text-gray-200 mb-2">Geo / Coğrafya Modu</h3>
              <p className="text-gray-500 text-sm">
                Kırsal alanlarda bitki örtüsü, topoğrafya ve doğal ipuçlarıyla tahmin yapın.
                120 saniye süre, 4 hareket hakkı.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Neden Ücretsiz?</h2>
          <p className="text-gray-400 leading-relaxed">
            Coğrafya bilgisinin herkes için erişilebilir olması gerektiğine inanıyoruz.
            TürkiyeGuessr kayıt gerektirmez ve tüm özellikleri ücretsizdir. Platformumuzu sürdürülebilir kılmak
            için Google AdSense aracılığıyla minimum düzeyde, kullanıcı deneyimini bozmayan reklamlar gösteriyoruz.
            Hiçbir özellik reklam duvarı arkasında değildir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            GeoGuessr gibi benzer platformlar aylık abonelik ücreti talep ederken, TürkiyeGuessr
            tamamen ücretsiz olarak Türkiye&apos;ye özel, yüksek kaliteli bir deneyim sunmaya devam etmektedir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Rakamlarla TürkiyeGuessr</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { n: "142+", l: "Lokasyon" },
              { n: "7", l: "Bölge" },
              { n: "8", l: "Maks Oyuncu" },
              { n: "0₺", l: "Fiyat" },
            ].map((s) => (
              <div key={s.l} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{s.n}</div>
                <div className="text-gray-500 text-sm mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Teknik Altyapı</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, modern web teknolojileri kullanılarak geliştirilmiş bir uygulamadır.
            Next.js framework&apos;ü üzerinde çalışır, Firebase Realtime Database ile anlık multiplayer
            deneyimi sunar ve Google Maps Platform ile sokak görünümü hizmeti sağlar.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Kullanıcı güvenliği ve gizliliği en büyük önceliklerimizden biridir. HTTPS şifreleme,
            Content Security Policy, Firebase güvenlik kuralları ve KVKK uyumlu veri işleme
            politikaları ile verileriniz korunmaktadır.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Proje Hakkında</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, bireysel bir geliştirici tarafından geliştirilen ve işletilen
            bağımsız bir web projesidir. Bir şirket veya ticari kuruluşla bağlantılı değildir.
            Proje, Türkiye coğrafyasını eğlenceli bir şekilde öğretme tutkusuyla hayata geçirilmiştir.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">İletişim</h2>
          <p className="text-gray-400 leading-relaxed">
            Soru, öneri veya geri bildirimleriniz için{" "}
            <a href="mailto:sahinbasci2002@gmail.com" className="text-red-400 hover:underline">
              sahinbasci2002@gmail.com
            </a>{" "}
            adresinden bize ulaşabilirsiniz. Daha fazla bilgi için{" "}
            <Link href="/iletisim" className="text-red-400 hover:underline">
              İletişim
            </Link>{" "}
            sayfamızı ziyaret edebilirsiniz.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-red-400">Daha Fazlasını Keşfet</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/nasil-oynanir" className="text-sm text-gray-400 hover:text-white underline transition-colors">
              Nasıl Oynanır?
            </Link>
            <Link href="/bolgeler" className="text-sm text-gray-400 hover:text-white underline transition-colors">
              Bölgeler
            </Link>
            <Link href="/sehirler" className="text-sm text-gray-400 hover:text-white underline transition-colors">
              Şehirler
            </Link>
            <Link href="/blog" className="text-sm text-gray-400 hover:text-white underline transition-colors">
              Blog
            </Link>
            <Link href="/sss" className="text-sm text-gray-400 hover:text-white underline transition-colors">
              SSS
            </Link>
            <Link href="/gizlilik-politikasi" className="text-sm text-gray-400 hover:text-white underline transition-colors">
              Gizlilik Politikası
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
