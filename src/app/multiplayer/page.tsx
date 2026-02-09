import { Metadata } from "next";
import { SeoLayout } from "@/components/seo/SeoLayout";

export const metadata: Metadata = {
  title: "Multiplayer Konum Tahmin Oyunu — Arkadaşlarınla Oyna",
  description:
    "TürkiyeGuessr ile arkadaşlarınla online multiplayer konum tahmin oyunu oyna. 2-8 kişi, ücretsiz, kayıt gerektirmez. Oda kur, kodu paylaş, yarış!",
  alternates: { canonical: "/multiplayer" },
};

export default function MultiplayerPage() {
  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Multiplayer", url: "/multiplayer" },
      ]}
    >
      <article className="space-y-10">
        <header>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Online Multiplayer Harita Oyunu
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Arkadaşlarınla aynı anda aynı konuma düşün, kim daha iyi bilecek?
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Nasıl Çalışır?</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr&apos;da multiplayer oynamak çok basit. Bir oyuncu oda kurar,
            diğerleri 6 haneli kodu girerek katılır. Her turda tüm oyunculara
            <strong className="text-gray-300"> aynı konum</strong> gösterilir — kim daha doğru tahmin ederse
            o daha çok puan kazanır. Kayıt, e-posta veya ödeme gerekmez.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Özellikler</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { title: "2-8 Kişi", desc: "İkili düellodan büyük turnuvalara kadar" },
              { title: "Gerçek Zamanlı", desc: "Tüm oyuncular aynı anda yarışır" },
              { title: "Skor Tablosu", desc: "Her tur sonunda canlı sıralama" },
              { title: "%100 Ücretsiz", desc: "Kayıt yok, ödeme yok, reklam yok" },
              { title: "Oda Kodu Sistemi", desc: "6 haneli kod ile anında davet" },
              { title: "5 Tur Maç", desc: "Her tur farklı konum, toplam puan belirler" },
            ].map((f) => (
              <div key={f.title} className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-200">{f.title}</h3>
                <p className="text-gray-500 text-sm mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Adım Adım</h2>
          <ol className="text-gray-400 space-y-3 list-decimal list-inside">
            <li>Oyuncu adını yaz ve oyun modunu seç</li>
            <li><strong className="text-gray-300">&quot;Yeni Oda Oluştur&quot;</strong> butonuna tıkla</li>
            <li>Ekrandaki 6 haneli oda kodunu arkadaşlarınla paylaş</li>
            <li>Herkes lobiye girince <strong className="text-gray-300">&quot;Oyunu Başlat&quot;</strong> de</li>
            <li>5 tur boyunca Türkiye&apos;yi keşfet ve tahminlerini yap</li>
            <li>En yüksek toplam puana sahip oyuncu kazanır!</li>
          </ol>
        </section>

        <section className="text-center py-6">
          <a
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Ücretsiz!
          </a>
          <p className="text-gray-600 text-sm mt-3">Kayıt gerektirmez. Tarayıcını aç ve başla.</p>
        </section>
      </article>
    </SeoLayout>
  );
}
