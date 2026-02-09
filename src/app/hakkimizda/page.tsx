import { Metadata } from "next";
import { SeoLayout } from "@/components/seo/SeoLayout";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "TürkiyeGuessr, Türkiye'ye odaklanan ücretsiz multiplayer konum tahmin oyunudur. Misyonumuz, Türk coğrafyasını eğlenceli ve eğitici bir şekilde keşfettirmek.",
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
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">TürkiyeGuessr Nedir?</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr, Google Street View kullanarak Türkiye&apos;nin dört bir yanından
            sokak görünümlerinde konum tahmin ettiğiniz ücretsiz bir multiplayer coğrafya oyunudur.
            142&apos;den fazla küratörlü lokasyon, 7 coğrafi bölge ve 2 farklı oyun moduyla
            Türkiye coğrafyasını eğlenceli ve rekabetçi bir şekilde keşfetmenizi sağlar.
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
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Neden Ücretsiz?</h2>
          <p className="text-gray-400 leading-relaxed">
            Coğrafya bilgisinin herkes için erişilebilir olması gerektiğine inanıyoruz.
            TürkiyeGuessr, kayıt gerektirmez, reklam göstermez ve hiçbir özelliği ücretli değildir.
            Tamamen açık, tamamen ücretsiz.
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
      </article>
    </SeoLayout>
  );
}
