/**
 * Server-rendered SEO content for homepage.
 * Google crawlers see this HTML on first paint — no JS needed.
 * Hidden during gameplay via CSS (body.game-active .home-seo).
 */

import Link from "next/link";
import { SeoFooter } from "./Footer";
import { getPopularCities, getAllRegions } from "@/data/seoData";

const REGIONS = getAllRegions().map((r) => ({
  slug: r.slug,
  name: r.name.replace(" Bölgesi", ""),
}));

const POPULAR_CITIES = getPopularCities().map((c) => ({
  slug: c.slug,
  name: c.district,
}));

const BLOG_LINKS = [
  { slug: "turkiye-guessr-nasil-oynanir", title: "TürkiyeGuessr Nasıl Oynanır?" },
  { slug: "turkiye-cografya-quiz", title: "Türkiye Coğrafya Quiz" },
  { slug: "turkiye-illeri-harita-oyunu", title: "Türkiye İlleri Harita Oyunu" },
  { slug: "online-harita-tahmin-oyunlari", title: "Online Harita Tahmin Oyunları" },
  { slug: "geoguessr-taktikleri-ipuclari", title: "GeoGuessr Taktikleri" },
];

export function HomeSEOContent() {
  return (
    <div className="home-seo bg-[#0a0a0f]">
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">

        {/* Açıklama */}
        <section className="text-center space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-200" style={{ fontFamily: "var(--font-display)" }}>
            TürkiyeGuessr — Türkiye Konum Tahmin Oyunu
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            TürkiyeGuessr ile Google Street View üzerinden Türkiye&apos;nin dört bir yanını keşfet.
            142+ lokasyon, 7 coğrafi bölge ve 2-8 kişilik multiplayer modlarla arkadaşlarınla yarış.
            Tamamen ücretsiz, kayıt gerektirmez. GeoGuessr&apos;ın en iyi Türkçe alternatifi.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link href="/nasil-oynanir" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
              Nasıl Oynanır?
            </Link>
            <Link href="/multiplayer" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
              Multiplayer
            </Link>
            <Link href="/geoguessr-alternatifi" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
              GeoGuessr Alternatifi
            </Link>
            <Link href="/turkiye-harita-oyunu" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
              Türkiye Harita Oyunu
            </Link>
            <Link href="/sehir-tahmin-oyunu" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
              Şehir Tahmin Oyunu
            </Link>
            <Link href="/ucretsiz-cografya-oyunu" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
              Ücretsiz Coğrafya Oyunu
            </Link>
            <Link href="/konum-tahmin-oyunu" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
              Konum Tahmin Oyunu
            </Link>
          </div>
        </section>

        {/* TürkiyeGuessr Nedir? */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-300">TürkiyeGuessr Nedir?</h2>
          <div className="text-gray-500 text-sm sm:text-base space-y-3 leading-relaxed">
            <p>
              TürkiyeGuessr, Google Street View panoramalarını kullanarak Türkiye genelinde konum tahmin
              ettiğin ücretsiz bir harita tahmin oyunudur. Oyunda karşına çıkan 360 derece sokak görünümünü
              inceleyerek bulunduğun şehri, ilçeyi veya bölgeyi harita üzerinde işaretlersin. Tahmininin gerçek
              konuma olan mesafesi puanını belirler — ne kadar yakınsan o kadar yüksek skor alırsın.
            </p>
            <p>
              142&apos;den fazla özenle seçilmiş lokasyonla Türkiye&apos;nin 7 coğrafi bölgesini kapsayan
              TürkiyeGuessr, hem eğlenceli bir konum tahmin oyunu hem de etkili bir coğrafya öğrenme aracıdır.
              İstanbul&apos;un tarihi sokaklarından Kapadokya&apos;nın peri bacalarına, Karadeniz&apos;in çay
              bahçelerinden Güneydoğu&apos;nun taş sokaklarına kadar Türkiye&apos;yi sanal olarak keşfet.
              Tamamen Türkçe arayüz, kayıt gerektirmez ve her cihazdan oynanabilir.
            </p>
          </div>
        </section>

        {/* Nasıl Oynanır? */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-300">
            <Link href="/nasil-oynanir" className="hover:text-white transition-colors">
              Nasıl Oynanır?
            </Link>
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { step: "1", title: "Panoramayı İncele", desc: "360° sokak görünümünde etrafına bak. Tabelalar, mimari, bitki örtüsü ve yol yapısı güçlü ipuçlarıdır." },
              { step: "2", title: "Haritada İşaretle", desc: "İpuçlarını değerlendirdikten sonra Türkiye haritası üzerinde tahmini konumunu seç." },
              { step: "3", title: "Puanını Öğren", desc: "Gerçek konumla tahmininin mesafesi hesaplanır. Yakın tahminler yüksek puan kazandırır." },
              { step: "4", title: "5 Tur Tamamla", desc: "Her oyun 5 turdan oluşur. Toplam skorunla arkadaşlarını geç veya kişisel rekorunu kır." },
            ].map((item) => (
              <div key={item.step} className="flex gap-3 bg-gray-800/40 border border-gray-700/30 rounded-lg p-3">
                <span className="flex-shrink-0 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-xs font-bold">{item.step}</span>
                <div>
                  <h3 className="text-gray-300 font-medium text-sm">{item.title}</h3>
                  <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Neden TürkiyeGuessr? */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-300">Neden TürkiyeGuessr?</h2>
          <div className="text-gray-500 text-sm sm:text-base space-y-3 leading-relaxed">
            <p>
              GeoGuessr gibi uluslararası harita tahmin oyunları genellikle ücretli abonelik gerektirir ve
              Türkiye lokasyonlarını sınırlı sunar. TürkiyeGuessr ise tamamen ücretsiz, Türkçe arayüzlü ve
              yalnızca Türkiye&apos;ye odaklanmış bir <Link href="/geoguessr-alternatifi" className="text-red-400 hover:text-red-300 underline">GeoGuessr alternatifidir</Link>.
              Her lokasyon kalitesi kontrol edilmiş Street View panoramalarından seçilmiştir.
            </p>
            <p>
              2-8 kişilik <Link href="/multiplayer" className="text-red-400 hover:text-red-300 underline">multiplayer modu</Link> sayesinde
              arkadaşlarınla aynı anda aynı lokasyonları tahmin ederek yarışabilirsin. Bölge modu ile
              spesifik bir coğrafi bölgede uzmanlaş, klasik modla tüm Türkiye&apos;yi keşfet.
              Hesap oluşturmana bile gerek yok — tarayıcını aç ve anında başla.
            </p>
          </div>
        </section>

        {/* Eğitim ve Öğrenme */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-300">Coğrafya Öğrenmenin En Eğlenceli Yolu</h2>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
            TürkiyeGuessr, Türkiye coğrafyasını oyun oynayarak öğrenmenin en etkili yoludur. Plaka kodlarını,
            bölgesel mimari farklılıklarını, bitki örtüsü değişimlerini ve iklim ipuçlarını keşfederek
            coğrafya bilgini doğal yollarla geliştirirsin. Öğrenciler için YKS ve KPSS coğrafya hazırlığına
            destek, öğretmenler için sınıf içi interaktif coğrafya etkinliği olarak kullanılabilir.
            <Link href="/blog/cografya-egitiminde-oyunlastirma" className="text-red-400 hover:text-red-300 underline ml-1">
              Coğrafya eğitiminde oyunlaştırma hakkında daha fazla bilgi →
            </Link>
          </p>
        </section>

        {/* Bölgeler */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-300 text-center">
            <Link href="/bolgeler" className="hover:text-white transition-colors">
              7 Coğrafi Bölge
            </Link>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {REGIONS.map((r) => (
              <Link
                key={r.slug}
                href={`/bolgeler/${r.slug}`}
                className="bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2 text-center text-sm text-gray-400 hover:text-white hover:border-red-500/30 transition-colors"
              >
                {r.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Popüler Şehirler */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-300 text-center">
            <Link href="/sehirler" className="hover:text-white transition-colors">
              Popüler Lokasyonlar
            </Link>
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {POPULAR_CITIES.map((c) => (
              <Link
                key={c.slug}
                href={`/sehirler/${c.slug}`}
                className="bg-gray-800/40 border border-gray-700/40 rounded-full px-3 py-1.5 text-xs text-gray-500 hover:text-white hover:border-red-500/30 transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Blog */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-300 text-center">
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BLOG_LINKS.map((b) => (
              <Link
                key={b.slug}
                href={`/blog/${b.slug}`}
                className="text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                &rarr; {b.title}
              </Link>
            ))}
          </div>
        </section>

      </div>

      {/* Full SEO Footer — 20+ internal links */}
      <SeoFooter />
    </div>
  );
}
