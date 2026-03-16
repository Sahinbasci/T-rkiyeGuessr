import { Metadata } from "next";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Plaka Kodlarından İl Nasıl Anlaşılır?",
  description:
    "Türkiye plaka kodları rehberi. 01'den 81'e kadar plaka kodlarını ezberle, sokak görünümünde avantaj kazan.",
  keywords: [
    "türkiye plaka kodları",
    "il plaka numaraları",
    "plaka kodları listesi",
    "plaka ile il bulma",
    "sokak görünümü plaka ipucu",
    "plaka quiz",
    "plaka oyunu",
  ],
  alternates: { canonical: "/blog/plaka-kodlarindan-il-tahmini", languages: { "tr-TR": "/blog/plaka-kodlarindan-il-tahmini", "x-default": "/blog/plaka-kodlarindan-il-tahmini" } },
  openGraph: {
    type: "article",
    locale: "tr_TR",
    url: `${SITE_URL}/blog/plaka-kodlarindan-il-tahmini`,
    siteName: "TürkiyeGuessr",
    title: "Plaka Kodlarından İl Nasıl Anlaşılır?",
    description:
      "Türkiye plaka kodları rehberi. 01'den 81'e kadar plaka kodlarını ezberle, sokak görünümünde avantaj kazan.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Plaka Kodlarından İl Nasıl Anlaşılır?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Plaka Kodlarından İl Nasıl Anlaşılır?",
    description:
      "Türkiye plaka kodları rehberi. 01'den 81'e kadar plaka kodlarını ezberle, sokak görünümünde avantaj kazan.",
  },
};

export default function PlakaKodlariPost() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "Plaka Kodlarından İl Nasıl Anlaşılır?",
    datePublished: "2026-02-25",
    dateModified: "2026-03-12",
    author: { "@type": "Organization", name: "TürkiyeGuessr" },
    publisher: {
      "@type": "Organization",
      name: "TürkiyeGuessr",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon-512.png`,
      },
    },
    description:
      "Türkiye plaka kodları rehberi. 01'den 81'e kadar plaka kodlarını ezberle, sokak görünümünde avantaj kazan.",
    mainEntityOfPage: `${SITE_URL}/blog/plaka-kodlarindan-il-tahmini`,
    image: `${SITE_URL}/og-image.png`,
  };

  const bolgeler = [
    {
      name: "Marmara Bölgesi",
      plakalar: [
        ["10", "Balıkesir"], ["11", "Bilecik"], ["16", "Bursa"], ["17", "Çanakkale"],
        ["22", "Edirne"], ["34", "İstanbul"], ["39", "Kırklareli"], ["41", "Kocaeli"],
        ["54", "Sakarya"], ["59", "Tekirdağ"], ["77", "Yalova"],
      ],
    },
    {
      name: "Ege Bölgesi",
      plakalar: [
        ["03", "Afyonkarahisar"], ["09", "Aydın"], ["20", "Denizli"], ["35", "İzmir"],
        ["43", "Kütahya"], ["45", "Manisa"], ["48", "Muğla"], ["64", "Uşak"],
      ],
    },
    {
      name: "Akdeniz Bölgesi",
      plakalar: [
        ["01", "Adana"], ["07", "Antalya"], ["15", "Burdur"], ["32", "Isparta"],
        ["33", "Mersin"], ["46", "Kahramanmaraş"], ["31", "Hatay"], ["80", "Osmaniye"],
      ],
    },
    {
      name: "Karadeniz Bölgesi",
      plakalar: [
        ["05", "Amasya"], ["08", "Artvin"], ["14", "Bolu"], ["18", "Çankırı"],
        ["28", "Giresun"], ["29", "Gümüşhane"], ["37", "Kastamonu"], ["52", "Ordu"],
        ["53", "Rize"], ["55", "Samsun"], ["57", "Sinop"], ["60", "Tokat"],
        ["61", "Trabzon"], ["67", "Zonguldak"], ["78", "Karabük"], ["74", "Bartın"],
        ["19", "Çorum"], ["66", "Yozgat"],
      ],
    },
    {
      name: "İç Anadolu Bölgesi",
      plakalar: [
        ["06", "Ankara"], ["26", "Eskişehir"], ["38", "Kayseri"], ["40", "Kırşehir"],
        ["42", "Konya"], ["50", "Nevşehir"], ["51", "Niğde"], ["58", "Sivas"],
        ["68", "Aksaray"], ["70", "Karaman"], ["71", "Kırıkkale"],
      ],
    },
    {
      name: "Doğu Anadolu Bölgesi",
      plakalar: [
        ["04", "Ağrı"], ["12", "Bingöl"], ["13", "Bitlis"], ["23", "Elazığ"],
        ["24", "Erzincan"], ["25", "Erzurum"], ["30", "Hakkari"], ["36", "Kars"],
        ["44", "Malatya"], ["49", "Muş"], ["62", "Tunceli"], ["65", "Van"],
        ["75", "Ardahan"], ["76", "Iğdır"],
      ],
    },
    {
      name: "Güneydoğu Anadolu Bölgesi",
      plakalar: [
        ["02", "Adıyaman"], ["21", "Diyarbakır"], ["27", "Gaziantep"], ["47", "Mardin"],
        ["56", "Siirt"], ["63", "Şanlıurfa"], ["72", "Batman"], ["73", "Şırnak"],
        ["79", "Kilis"],
      ],
    },
  ];

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: "Plaka Kodları Rehberi", url: "/blog/plaka-kodlarindan-il-tahmini" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="prose-custom space-y-8 max-w-3xl">
        <header>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <time dateTime="2026-02-25">25 Şubat 2026</time>
            <span>6 dk okuma</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Plaka Kodları Rehberi: 81 İl
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Türkiye&apos;nin plaka sistemini öğren, sokak görünümünde rakiplerinden bir adım önde ol.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Plaka Kodu Nedir?</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye&apos;de her ilin kendine özgü bir plaka kodu vardır. Bu kodlar 01&apos;den başlar
            ve 81&apos;e kadar devam eder. Plaka kodları illerin alfabetik sıralamasına göre verilmiştir:
            01 Adana, 02 Adıyaman, 03 Afyonkarahisar... şeklinde ilerler. 1989 sonrasında kurulan yeni
            iller ise 67&apos;den itibaren sırayla numara almıştır. Her Türk aracının plakasında ilk
            iki rakam tescil edildiği ili gösterir. Bu sistem 1926&apos;dan beri kullanılmaktadır ve
            dünyada en uzun süredir kesintisiz uygulanan plaka sistemlerinden biridir.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Sokak görünümünde park halindeki araçların plakalarını okuyarak bulunduğun ili doğrudan
            tespit edebilirsin. Bu, TürkiyeGuessr&apos;da en hızlı ve en güvenilir ipuçlarından biridir.
            Özellikle kırsal bölgelerde ve küçük ilçelerde plakalar neredeyse her zaman yerel ile aittir.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-red-400">Bölgelere Göre Plaka Kodları</h2>
          <p className="text-gray-400 leading-relaxed">
            Plaka kodlarını bölgelere göre gruplandırarak öğrenmek çok daha kolaydır. İşte Türkiye&apos;nin
            7 bölgesine göre tüm plaka kodları:
          </p>

          {bolgeler.map((bolge) => (
            <div key={bolge.name} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-300">{bolge.name}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {bolge.plakalar.map(([code, city]) => (
                  <div key={code} className="flex justify-between bg-gray-800/50 border border-gray-700/40 rounded px-3 py-2">
                    <span className="text-red-400 font-mono font-bold">{code}</span>
                    <span className="text-gray-400">{city}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Konum Tahminde Plaka Kullanımı</h2>
          <p className="text-gray-400 leading-relaxed">
            Sokak görünümünde plaka aramak bir sanattır. Park halindeki araçlar en kolay hedeflerdir;
            özellikle marketlerin, camilerin ve kamu binalarının önündeki araçlara bak. Yakınlaştırma
            (zoom) yaparak plaka numarasını okumaya çalış. Hareket halindeki araçların plakaları bulanık
            olabilir ama park halindekiler genellikle okunabilir durumdadır. Birden fazla araç görüyorsan
            en sık tekrarlanan plaka kodunu not et; bu büyük olasılıkla bulunduğun ilin kodudur.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Büyük şehirlerde farklı illerden gelen araçlar çok olduğu için tek bir plaka yeterli
            olmayabilir. Örneğin İstanbul&apos;da 34 plaka en yaygın olsa da neredeyse her ilden
            araç görebilirsin. Bu durumda plakayı diğer ipuçlarıyla (mimari, bitki örtüsü, tabelalar)
            birleştirmek en doğru sonucu verir.
          </p>
        </section>

        <section className="space-y-4 bg-gray-800/30 border border-gray-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-200">Pro İpuçları</h2>
          <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
            <li>
              <strong className="text-gray-300">Ezber kolaylığı:</strong> Büyük şehirlerin kodlarını
              önce öğren (06-Ankara, 34-İstanbul, 35-İzmir, 16-Bursa, 07-Antalya). Bunlar en sık
              karşılaşacağın kodlardır.
            </li>
            <li>
              <strong className="text-gray-300">Bölgesel gruplama:</strong> Kodları tek tek değil,
              bölge bölge ezberle. Karadeniz illeri, Ege illeri gibi gruplar oluştur.
            </li>
            <li>
              <strong className="text-gray-300">Kamyon ve TIR&apos;lar:</strong> Şehirlerarası yollarda
              kamyon plakalarına dikkat et; genellikle büyük şehir kodları taşırlar ama güzergah hakkında
              ipucu verebilirler.
            </li>
            <li>
              <strong className="text-gray-300">Taksi ve minibüsler:</strong> Toplu taşıma araçları
              neredeyse her zaman yerel ilden tescillidir ve en güvenilir plaka ipucudur.
            </li>
            <li>
              <strong className="text-gray-300">Ticari araçlar:</strong> Dükkan isimleri yazılı ticari
              araçlar hem plaka hem de işletme adresini gösterebilir.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Plaka Kodları İle Bölge Tahmini</h2>
          <p className="text-gray-400 leading-relaxed">
            Plaka kodlarını ezberlemeye başladığında belirli aralıkların belirli bölgelere denk geldiğini
            fark edeceksin. 01&ndash;33 arası kodlar genel olarak alfabetik sıranın ilk yarısına düşer ve
            Akdeniz, Ege, Doğu Anadolu ile İç Anadolu illerinin önemli bir kısmını kapsar. 34&ndash;67
            arası kodlarda{" "}
            <Link href="/sehirler/fatih-istanbul" className="text-red-400 hover:text-red-300 transition-colors">
              İstanbul (34)
            </Link>,{" "}
            <Link href="/sehirler/konak-izmir" className="text-red-400 hover:text-red-300 transition-colors">
              İzmir (35)
            </Link>{" "}
            ve{" "}
            <Link href="/sehirler/osmangazi-bursa" className="text-red-400 hover:text-red-300 transition-colors">
              Bursa (16)
            </Link>{" "}
            gibi büyük metropoller yer alır. 68&ndash;81 arası plakalar ise 1989 sonrasında il olan yeni
            illere aittir ve genellikle daha küçük nüfuslu{" "}
            <Link href="/bolgeler/karadeniz" className="text-red-400 hover:text-red-300 transition-colors">
              Karadeniz
            </Link>{" "}
            ve{" "}
            <Link href="/bolgeler/guneydogu" className="text-red-400 hover:text-red-300 transition-colors">
              Güneydoğu Anadolu
            </Link>{" "}
            illerini içerir. Bu bölgesel kalıpları öğrenmek, plaka numarasının sadece ilk rakamına bakarak
            bile hangi bölgede olduğun hakkında güçlü bir fikir edinmeni sağlar.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">En Çok Karşılaşılan Plaka Kodları</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr&apos;da en sık karşılaşacağın plaka kodları nüfusu ve araç sayısı yüksek olan
            büyükşehirlere aittir. Listenin başında açık ara{" "}
            <Link href="/sehirler/fatih-istanbul" className="text-red-400 hover:text-red-300 transition-colors">
              34 - İstanbul
            </Link>{" "}
            gelir; Türkiye&apos;deki her beş araçtan biri İstanbul plakalıdır.{" "}
            <Link href="/sehirler/cankaya-ankara" className="text-red-400 hover:text-red-300 transition-colors">
              06 - Ankara
            </Link>{" "}
            ikinci sırada yer alırken{" "}
            <Link href="/sehirler/konak-izmir" className="text-red-400 hover:text-red-300 transition-colors">
              35 - İzmir
            </Link>,{" "}
            <Link href="/sehirler/kaleici-antalya" className="text-red-400 hover:text-red-300 transition-colors">
              07 - Antalya
            </Link>{" "}
            ve{" "}
            <Link href="/sehirler/osmangazi-bursa" className="text-red-400 hover:text-red-300 transition-colors">
              16 - Bursa
            </Link>{" "}
            da üst sıralardadır. Bu beş ilin plaka kodlarını bilmek, sokak görünümünde gördüğün araçların
            büyük çoğunluğunu anında tanımanı sağlar. Ayrıca{" "}
            <Link href="/sehirler/kadikoy-istanbul" className="text-red-400 hover:text-red-300 transition-colors">
              Kadıköy
            </Link>{" "}
            ve{" "}
            <Link href="/sehirler/ulus-ankara" className="text-red-400 hover:text-red-300 transition-colors">
              Ulus
            </Link>{" "}
            gibi merkezi semtlerde çevre illerden gelen araçlara da sıkça rastlarsın; bu nedenle tek bir
            plakaya güvenmek yerine birden fazla aracı kontrol etmek her zaman daha güvenilir bir stratejidir.
          </p>
        </section>

        <section className="text-center py-6 space-y-3">
          <h2 className="text-2xl font-bold text-white">Plaka Bilgini Test Et!</h2>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Ücretsiz!
          </Link>
        </section>

        <nav className="flex flex-wrap gap-3 pt-4 border-t border-gray-700/50">
          <Link href="/sehirler" className="text-sm text-gray-400 hover:text-white transition-colors">
            Tüm Şehirler →
          </Link>
          <Link href="/bolgeler" className="text-sm text-gray-400 hover:text-white transition-colors">
            Tüm Bölgeler →
          </Link>
          <Link href="/nasil-oynanir" className="text-sm text-gray-400 hover:text-white transition-colors">
            Nasıl Oynanır? →
          </Link>
        </nav>

        {/* İlgili İçerikler */}
        <section className="space-y-4 pt-4 border-t border-gray-700/30">
          <h2 className="text-xl font-semibold text-red-400">İlgili İçerikler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/blog/sokaktan-sehir-nasil-taninir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Sokaktan Şehir Nasıl Tanınır?
            </Link>
            <Link href="/blog/turkiye-bolgeleri-rehberi" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye Bölgeleri Rehberi
            </Link>
            <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-gray-400 hover:text-white text-sm transition-colors">
              → GeoGuessr Taktikleri ve İpuçları
            </Link>
            <Link href="/turkiye-harita-oyunu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye Harita Oyunu
            </Link>
            <Link href="/blog/turkiye-illeri-harita-oyunu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye İlleri Harita Oyunu
            </Link>
            <Link href="/blog/turkiyenin-en-zor-10-lokasyonu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → En Zor 10 Lokasyon
            </Link>
            <Link href="/bolgeler/marmara" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Marmara Bölgesi Rehberi
            </Link>
            <Link href="/bolgeler/ic-anadolu" className="text-gray-400 hover:text-white text-sm transition-colors">
              → İç Anadolu Bölgesi Rehberi
            </Link>
            <Link href="/sehirler/fatih-istanbul" className="text-gray-400 hover:text-white text-sm transition-colors">
              → İstanbul Lokasyonları
            </Link>
            <Link href="/sehirler/cankaya-ankara" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Ankara Lokasyonları
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
