import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";

export const metadata: Metadata = {
  title: "Ücretsiz GeoGuessr Alternatifi — Türkiye Konum Tahmin Oyunu",
  description:
    "GeoGuessr'a ücretsiz Türkçe alternatif arıyorsan TürkiyeGuessr tam sana göre. Kayıt yok, ödeme yok. 142+ Türkiye lokasyonu, multiplayer, anında oyna.",
  keywords: [
    "ücretsiz geoguessr alternatifi",
    "geoguessr türkiye",
    "geoguessr ücretsiz",
    "geoguessr benzeri oyunlar",
    "türkiye konum tahmin oyunu",
    "bedava geoguessr",
  ],
  alternates: { canonical: "/geoguessr-alternatifi" },
};

export default function GeoguessrAlternatifiPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "GeoGuessr Alternatifi", url: "/geoguessr-alternatifi" },
      ]}
    >
      <article className="space-y-10">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Ücretsiz GeoGuessr Alternatifi: TürkiyeGuessr
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            GeoGuessr&apos;ın ücretli duvarına takılmadan Türkiye&apos;yi keşfet.
            Kayıt yok, ödeme yok, sadece coğrafya.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Neden TürkiyeGuessr?</h2>
          <p className="text-gray-400 leading-relaxed">
            GeoGuessr harika bir oyun ama aylık $3.99 abonelik ücreti, zorunlu kayıt ve
            sınırlı Türkiye içeriğiyle herkes için ideal değil. <strong className="text-gray-300">TürkiyeGuessr</strong>,
            özellikle Türkiye coğrafyasına odaklanan, tamamen ücretsiz ve Türkçe bir alternatif olarak
            fark yaratıyor.
          </p>
        </section>

        {/* Comparison Table */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Karşılaştırma</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-700/50 rounded-xl overflow-hidden">
              <thead className="bg-gray-800/80">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-300 font-medium">Özellik</th>
                  <th className="text-center px-4 py-3 text-gray-300 font-medium">GeoGuessr</th>
                  <th className="text-center px-4 py-3 text-red-400 font-medium">TürkiyeGuessr</th>
                </tr>
              </thead>
              <tbody className="text-gray-400">
                {[
                  ["Fiyat", "$3.99/ay", "Ücretsiz"],
                  ["Kayıt", "Zorunlu", "Gerekmez"],
                  ["Dil", "İngilizce", "Türkçe"],
                  ["Türkiye İçerik", "Sınırlı", "142+ Küratörlü Lokasyon"],
                  ["Multiplayer", "Ücretli", "Ücretsiz"],
                  ["Odak", "Dünya geneli", "Türkiye özelleşmiş"],
                  ["Mobil Destek", "Uygulama gerekli", "Tarayıcıda çalışır"],
                  ["Bölge Çeşitliliği", "Rastgele", "7 Bölge, dengeli dağılım"],
                ].map(([feature, geo, tr]) => (
                  <tr key={feature} className="border-t border-gray-700/30">
                    <td className="px-4 py-3 text-gray-300">{feature}</td>
                    <td className="px-4 py-3 text-center">{geo}</td>
                    <td className="px-4 py-3 text-center text-green-400 font-medium">{tr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Türkiye&apos;ye Özel İçerik</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, Marmara&apos;dan Güneydoğu&apos;ya kadar Türkiye&apos;nin
            <strong className="text-gray-300"> 7 coğrafi bölgesinden</strong> titizlikle seçilmiş lokasyonlar sunar.
            İstanbul&apos;un tarihi sokaklarından Kapadokya&apos;nın peri bacalarına,
            Karadeniz yaylalarından Akdeniz sahillerine kadar gerçek Türkiye deneyimi.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Marmara", "Ege", "Akdeniz", "Karadeniz", "İç Anadolu", "Doğu Anadolu", "Güneydoğu"].map((r) => (
              <span key={r} className="bg-gray-800/60 border border-gray-700/40 rounded-lg px-3 py-1.5 text-xs text-gray-400">
                {r}
              </span>
            ))}
          </div>
        </section>

        <section className="text-center py-8 space-y-4">
          <h2 className="text-2xl font-bold text-white">GeoGuessr&apos;a Para Verme, TürkiyeGuessr Oyna!</h2>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Ücretsiz Oyna — Hemen Başla
          </Link>
          <p className="text-gray-600 text-sm">Kayıt yok. Kredi kartı yok. Sadece coğrafya.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Daha Fazlasını Keşfet</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/nasil-oynanir" className="text-sm text-gray-400 hover:text-white underline transition-colors">
              Nasıl Oynanır?
            </Link>
            <Link href="/multiplayer" className="text-sm text-gray-400 hover:text-white underline transition-colors">
              Multiplayer Modu
            </Link>
            <Link href="/bolgeler" className="text-sm text-gray-400 hover:text-white underline transition-colors">
              Tüm Bölgeler
            </Link>
            <Link href="/sehirler" className="text-sm text-gray-400 hover:text-white underline transition-colors">
              Tüm Şehirler
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
