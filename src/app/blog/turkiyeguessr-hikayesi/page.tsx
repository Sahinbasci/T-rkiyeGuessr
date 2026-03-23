import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "TürkiyeGuessr'ın Hikayesi: Neden Bu Oyunu Yaptık?",
  description:
    "TürkiyeGuessr'ın kuruluş hikayesi. Bir yazılım geliştirici GeoGuessr'da Türkiye lokasyonlarının yetersizliğinden yola çıkarak nasıl Türkiye'ye özel bir konum tahmin oyunu yarattı?",
  keywords: ["türkiyeguessr hikayesi", "türkiyeguessr nedir", "konum tahmin oyunu hikayesi"],
  alternates: { canonical: "/blog/turkiyeguessr-hikayesi", languages: { "tr-TR": "/blog/turkiyeguessr-hikayesi", "x-default": "/blog/turkiyeguessr-hikayesi" } },
  openGraph: {
    type: "article",
    locale: "tr_TR",
    url: `${SITE_URL}/blog/turkiyeguessr-hikayesi`,
    siteName: "TürkiyeGuessr",
    title: "TürkiyeGuessr'ın Hikayesi: Neden Bu Oyunu Yaptık?",
    description:
      "TürkiyeGuessr'ın kuruluş hikayesi. Bir yazılım geliştirici GeoGuessr'da Türkiye lokasyonlarının yetersizliğinden yola çıkarak nasıl Türkiye'ye özel bir konum tahmin oyunu yarattı?",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "TürkiyeGuessr'ın Hikayesi: Neden Bu Oyunu Yaptık?",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TürkiyeGuessr'ın Hikayesi: Neden Bu Oyunu Yaptık?",
    description:
      "TürkiyeGuessr'ın kuruluş hikayesi. Bir yazılım geliştirici GeoGuessr'da Türkiye lokasyonlarının yetersizliğinden yola çıkarak nasıl Türkiye'ye özel bir konum tahmin oyunu yarattı?",
  },
};

export default function TurkiyeguessrHikayesiPost() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "TürkiyeGuessr'ın Hikayesi: Neden Bu Oyunu Yaptık?",
    datePublished: "2026-03-20",
    dateModified: "2026-03-20",
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
      "TürkiyeGuessr'ın kuruluş hikayesi. Bir yazılım geliştirici GeoGuessr'da Türkiye lokasyonlarının yetersizliğinden yola çıkarak nasıl Türkiye'ye özel bir konum tahmin oyunu yarattı?",
    mainEntityOfPage: `${SITE_URL}/blog/turkiyeguessr-hikayesi`,
    image: `${SITE_URL}/og-image.png`,
  };

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: "TürkiyeGuessr'ın Hikayesi", url: "/blog/turkiyeguessr-hikayesi" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="prose-custom space-y-8 max-w-3xl">
        <header>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <time dateTime="2026-03-20">20 Mart 2026</time>
            <span>8 dk okuma</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            TürkiyeGuessr&apos;ın Hikayesi: Neden Bu Oyunu Yaptık?
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Bir yazılım geliştirici, GeoGuessr&apos;da Türkiye lokasyonlarının yetersizliğinden yola çıkarak nasıl Türkiye&apos;ye özel bir konum tahmin oyunu yarattı?
          </p>
        </header>

        <figure className="my-8 rounded-xl overflow-hidden">
          <Image
            src="/images/blog/istanbul-skyline.jpg"
            alt="TürkiyeGuessr'ın hikayesi"
            width={800}
            height={450}
            className="w-full h-auto rounded-xl"
            priority
          />
          <figcaption className="text-center text-sm text-gray-500 mt-2">TürkiyeGuessr&apos;ın kuruluş hikayesi</figcaption>
        </figure>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Her Şey Bir Hayal Kırıklığıyla Başladı</h2>
          <p className="text-gray-400 leading-relaxed">
            2024 yılının sonlarında, saatlerimi GeoGuessr oynayarak geçiriyordum. Dünya haritasında rastgele bir noktaya bırakılıp konumunu tahmin etmek inanılmaz bağımlılık yapan bir deneyimdi. Fransa&apos;nın kır yollarında kaybolmak, Japonya&apos;nın neon ışıklı sokaklarında gezinmek, Brezilya&apos;nın tropikal ormanlarında yön bulmaya çalışmak... Her tur yeni bir macera gibiydi.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Ama bir sorun vardı. Türkiye lokasyonlarına düştüğümde genellikle aynı birkaç yeri görüyordum: İstanbul&apos;un merkezi, Antalya sahili, belki Kapadokya. Oysa Türkiye, 783.562 kilometrekarelik yüzölçümüyle Avrupa&apos;nın en büyük ülkelerinden biri. 81 il, 7 farklı coğrafi bölge, denizden 5.137 metreye kadar yükselen dağlar, steplerden yağmur ormanlarına uzanan inanılmaz bir çeşitlilik. Ama GeoGuessr&apos;da bunların çoğu yoktu.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Bir gece, Artvin&apos;in Kaçkar Dağları eteklerindeki bir yaylayı Google Street View&apos;da keşfederken düşündüm: Bu kadar zengin bir coğrafyaya sahip ülkenin neden kendi özel konum tahmin oyunu yok? İşte TürkiyeGuessr fikri o gece doğdu.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Neden Türkiye&apos;ye Özel Bir Oyun?</h2>
          <p className="text-gray-400 leading-relaxed">
            Türkiye, coğrafi çeşitlilik açısından dünyanın en benzersiz ülkelerinden biridir. Tek bir ülke sınırları içinde hem Akdeniz iklimi hem karasal iklim hem de okyanusal iklim bir arada bulunur. <Link href="/bolgeler/karadeniz" className="text-red-400 hover:text-red-300 transition-colors">Karadeniz</Link> kıyılarında yılda 2.000 mm üzeri yağış alırsın, birkaç yüz kilometre güneyde <Link href="/bolgeler/ic-anadolu" className="text-red-400 hover:text-red-300 transition-colors">İç Anadolu</Link>&apos;da kurak step arazisi seni karşılar. Doğuda Ağrı Dağı&apos;nın 5.137 metrelik zirvesi karlarla kaplıyken, güneyde <Link href="/bolgeler/akdeniz" className="text-red-400 hover:text-red-300 transition-colors">Akdeniz</Link> sahillerinde kışın bile yüzebilirsin.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Bu çeşitlilik, konum tahmin oyunu için mükemmel bir zemin oluşturuyor. Dünya genelinde oynanan GeoGuessr&apos;da Türkiye sadece birkaç yüz lokasyonla temsil edilirken, biz yüzlerce özenle seçilmiş lokasyonla Türkiye&apos;nin her köşesini oyuna taşımak istedik. <Link href="/bolgeler/ege" className="text-red-400 hover:text-red-300 transition-colors">Ege</Link>&apos;nin beyaz badanalı köylerinden <Link href="/bolgeler/guneydogu" className="text-red-400 hover:text-red-300 transition-colors">Güneydoğu</Link>&apos;nun taş evlerine, <Link href="/bolgeler/marmara" className="text-red-400 hover:text-red-300 transition-colors">Marmara</Link>&apos;nın sanayi kentlerinden <Link href="/bolgeler/dogu-anadolu" className="text-red-400 hover:text-red-300 transition-colors">Doğu Anadolu</Link>&apos;nun yaylalarına kadar her bölge oyunda temsil ediliyor.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Ayrıca Türkiye&apos;de yaşayan 85 milyondan fazla insan için coğrafya bilgisi sadece bir hobi değil, gerçek hayatta da işe yarayan bir beceri. Plaka kodlarından il tanıma, tabela okuma, bölgesel mimariyi anlama gibi yetenekler günlük yaşamda bile faydalı. TürkiyeGuessr bu bilgiyi eğlenceli bir şekilde kazandırıyor.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Lokasyonları Tek Tek Seçme Süreci</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr&apos;ın en emek yoğun aşaması lokasyon seçimiydi. Rastgele koordinatlar kullanmak yerine her lokasyonu tek tek seçtik. Neden mi? Çünkü rastgele seçim yapıldığında çoğu nokta boş bir otoyolun ortasına veya hiçbir ipucu olmayan bir araziye düşüyor. Bu da oyuncular için sıkıcı ve sinir bozucu bir deneyim yaratıyor.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Bizim yaklaşımımız farklıydı. Her lokasyon için şu kriterleri kontrol ettik: Street View görüntüsünün kalitesi yeterli mi? Oyuncunun etrafına bakarak ipucu bulabileceği bir nokta mı? Zorluk seviyesi dengeli mi? Bölgesel çeşitlilik sağlanıyor mu? Bu kriterleri karşılamayan yüzlerce potansiyel noktayı eledik.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Lokasyon seçerken Türkiye&apos;nin her ilinden en az birkaç nokta olmasına dikkat ettik. <Link href="/sehirler/fatih-istanbul" className="text-red-400 hover:text-red-300 transition-colors">İstanbul&apos;un Fatih ilçesi</Link>ndeki tarihi sokaklardan <Link href="/sehirler/artuklu-mardin" className="text-red-400 hover:text-red-300 transition-colors">Mardin&apos;in taş sokaklarına</Link>, <Link href="/sehirler/uzungol-trabzon" className="text-red-400 hover:text-red-300 transition-colors">Uzungöl&apos;ün yemyeşil vadisinden</Link> <Link href="/sehirler/kaleici-antalya" className="text-red-400 hover:text-red-300 transition-colors">Antalya Kaleiçi&apos;nin dar sokaklarına</Link> kadar her nokta özenle seçildi. Bazı lokasyonlar kolay (büyük şehir merkezleri, tanınmış turistik yerler), bazıları orta zorlukta (küçük kasabalar, kırsal alanlar), bazıları ise gerçekten zor (birbirine benzeyen kırsal yollar, ipucu fakiri noktalar).
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Teknik Zorluklar ve Çözümler</h2>
          <p className="text-gray-400 leading-relaxed">
            Bir konum tahmin oyunu geliştirmek, görünüşte basit ama teknik açıdan zorlu bir süreç. İlk ve en büyük zorluk Google Maps API entegrasyonuydu. Street View panoramalarını oyun içinde sorunsuz göstermek, kullanıcının 360 derece bakınabilmesini sağlamak ve bunu performanslı bir şekilde yapmak ciddi mühendislik gerektirdi.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Performans optimizasyonu bir diğer kritik alandı. Street View panoramaları ağır dosyalar ve yavaş bir yüklenme oyuncunun sabrını zorlardı. Lazy loading, önbellekleme stratejileri ve görüntü optimizasyonu ile yükleme sürelerini minimuma indirdik. Ayrıca mobil cihazlarda da akıcı bir deneyim sunmak için responsive tasarım ve dokunmatik kontroller üzerinde uzun süre çalıştık.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Multiplayer altyapısı belki de en heyecan verici ama en zorlu kısımdı. Birden fazla oyuncunun aynı anda aynı lokasyona bakıp tahmin yapabilmesi, puanların anlık güncellenmesi ve bağlantı sorunlarının zarif bir şekilde yönetilmesi gerekiyordu. WebSocket tabanlı gerçek zamanlı iletişim altyapısı kurduk ve bu sayede arkadaşlarınla veya rastgele eşleştiğin oyuncularla aynı anda yarışabiliyorsun.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Puan hesaplama sistemi de dikkatli bir dengeleme gerektirdi. Tahmin edilen nokta ile gerçek konum arasındaki mesafeyi hesaplarken Haversine formülünü kullanıyoruz. Bu formül, dünya yüzeyinin küresel yapısını hesaba katarak iki koordinat arasındaki gerçek mesafeyi verir. Daha yakın tahminlerin çok daha yüksek puan alması için logaritmik bir puanlama eğrisi tasarladık. Böylece 10 km sapma ile 50 km sapma arasındaki puan farkı, 200 km ile 240 km arasındaki farktan çok daha büyük oluyor.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Topluluk: Oyuncularımız Bize Yol Gösteriyor</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr&apos;ı en değerli kılan şeylerden biri de topluluk. Oyuncularımız sadece oynamıyor, aynı zamanda oyunun gelişmesine aktif olarak katkıda bulunuyor. Geri bildirim formları aracılığıyla yüzlerce yeni lokasyon önerisi aldık. Bir oyuncu Kastamonu&apos;nun bilinmeyen bir köyünü önerirken, başka bir oyuncu Hatay&apos;ın tarihi sokaklarının eklenmesini istedi.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Oyuncularımızdan gelen en yaygın geri bildirim, oyunun onlara Türkiye&apos;yi yeniden keşfettirdiğiydi. Bir öğretmen, öğrencileriyle sınıfta oynadığını ve çocukların coğrafya dersine olan ilgisinin arttığını yazdı. Bir gurbet oyuncu, memleketi olan Trabzon lokasyonlarına düştüğünde duygusal anlar yaşadığını paylaştı. Bu tür hikayeler bizi motive eden en büyük güç.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Ayrıca oyuncularımızın rekabetçi ruhu bizi şaşırttı. Multiplayer modunda oynanan binlerce tur, liderlik tablosu sıralamaları için verilen mücadele ve sosyal medyada paylaşılan rekor skorlar... TürkiyeGuessr sadece bir oyun olmaktan çıkıp bir topluluğa dönüştü.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Gelecek Planları: Daha Büyük Hedefler</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr henüz başlangıç aşamasında. Önümüzdeki dönemde büyük planlarımız var. İlk olarak, lokasyon sayısını sürekli artırmaya devam edeceğiz. Hedefimiz Türkiye&apos;nin her ilçesinden en az birkaç lokasyon eklemek. Özellikle <Link href="/bolgeler/dogu-anadolu" className="text-red-400 hover:text-red-300 transition-colors">Doğu Anadolu</Link> ve <Link href="/bolgeler/karadeniz" className="text-red-400 hover:text-red-300 transition-colors">Karadeniz</Link> iç kesimlerindeki lokasyon çeşitliliğini artırmak istiyoruz.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Yeni oyun modları da geliştirme listemizin başında. Şu anda tek oyunculu ve çok oyunculu modlar mevcut, ancak zamana karşı yarış, bölge odaklı turlar, il şampiyonası ve günlük challenge gibi modlar üzerinde çalışıyoruz. Her gün aynı 5 lokasyonun tüm oyunculara sunulduğu günlük challenge modu, topluluk etkileşimini artıracak heyecan verici bir özellik olacak.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Eğitim alanında da büyük potansiyel görüyoruz. Coğrafya öğretmenleriyle iş birliği yaparak sınıf içi kullanıma uygun özel bir mod geliştirmeyi planlıyoruz. Öğretmenler kendi lokasyon setlerini oluşturabilecek, öğrenci ilerlemesini takip edebilecek ve müfredata uygun turlar hazırlayabilecek.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Mobil uygulama da yol haritamızda. Şu anda TürkiyeGuessr web tarayıcısında mükemmel çalışıyor, ancak özel bir mobil uygulama ile bildirimler, offline oyun ve daha akıcı bir dokunmatik deneyim sunabileceğiz. Yolda, otobüste veya kafede kısa bir tur oynamak çok daha kolay olacak.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Bu Oyun Neden Önemli?</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr sadece bir oyun değil. Türkiye&apos;nin coğrafi zenginliğini kutlayan, insanların kendi ülkelerini daha iyi tanımalarını sağlayan ve bunu eğlenceli bir yolla yapan bir platform. Her oynanan turda oyuncular farkında olmadan coğrafya öğreniyor, farklı bölgelerin kültürel özelliklerini keşfediyor ve Türkiye&apos;nin ne kadar çeşitli bir ülke olduğunu görüyor.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Bugün TürkiyeGuessr&apos;ı <Link href="/" className="text-red-400 hover:text-red-300 transition-colors">ücretsiz olarak</Link> oynayabilir, <Link href="/nasil-oynanir" className="text-red-400 hover:text-red-300 transition-colors">nasıl oynanır rehberimizden</Link> başlayabilir veya doğrudan bir tura atlayabilirsin. Tek ihtiyacın bir tarayıcı ve Türkiye&apos;yi keşfetme merakı. Biz bu oyunu severek yapıyoruz ve umarız sen de severek oynarsın.
          </p>
        </section>

        <section className="text-center py-6 space-y-3">
          <h2 className="text-2xl font-bold text-white">Hikayemizin Parçası Ol!</h2>
          <Link
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-xl text-lg font-bold transition-colors"
          >
            Hemen Oyna — Ücretsiz!
          </Link>
        </section>

        <nav className="flex flex-wrap gap-3 pt-4 border-t border-gray-700/50">
          <Link href="/nasil-oynanir" className="text-sm text-gray-400 hover:text-white transition-colors">
            Nasıl Oynanır Rehberi →
          </Link>
          <Link href="/bolgeler" className="text-sm text-gray-400 hover:text-white transition-colors">
            Tüm Bölgeler →
          </Link>
          <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-sm text-gray-400 hover:text-white transition-colors">
            Taktikler ve İpuçları →
          </Link>
        </nav>

        <section className="space-y-4 pt-4 border-t border-gray-700/30">
          <h2 className="text-xl font-semibold text-red-400">İlgili İçerikler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/nasil-oynanir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Nasıl Oynanır?
            </Link>
            <Link href="/bolgeler" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Tüm Bölgeler
            </Link>
            <Link href="/blog/geoguessr-vs-turkiyeguessr" className="text-gray-400 hover:text-white text-sm transition-colors">
              → GeoGuessr vs TürkiyeGuessr
            </Link>
            <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-gray-400 hover:text-white text-sm transition-colors">
              → GeoGuessr Taktikleri ve İpuçları
            </Link>
            <Link href="/blog/turkiye-mimari-farklari" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye Mimari Farkları
            </Link>
            <Link href="/blog/sinifta-turkiyeguessr" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Sınıfta TürkiyeGuessr Kullanma Rehberi
            </Link>
            <Link href="/sehirler/fatih-istanbul" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Fatih, İstanbul Lokasyonları
            </Link>
            <Link href="/bolgeler/karadeniz" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Karadeniz Bölgesi
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
