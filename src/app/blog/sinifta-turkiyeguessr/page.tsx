import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SeoLayout } from "@/components/seo/SeoLayout";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Coğrafya Öğretmenleri İçin: TürkiyeGuessr'ı Sınıfta Kullanma Rehberi",
  description:
    "TürkiyeGuessr'ı coğrafya derslerinde nasıl kullanırsınız? 5 sınıf aktivitesi, adım adım kurulum ve MEB müfredatıyla uyum rehberi.",
  keywords: ["coğrafya dersi oyun", "interaktif coğrafya", "sınıfta harita oyunu", "coğrafya eğitimi"],
  alternates: { canonical: "/blog/sinifta-turkiyeguessr", languages: { "tr-TR": "/blog/sinifta-turkiyeguessr", "x-default": "/blog/sinifta-turkiyeguessr" } },
  openGraph: {
    type: "article",
    locale: "tr_TR",
    url: `${SITE_URL}/blog/sinifta-turkiyeguessr`,
    siteName: "TürkiyeGuessr",
    title: "Coğrafya Öğretmenleri İçin: TürkiyeGuessr'ı Sınıfta Kullanma Rehberi",
    description:
      "TürkiyeGuessr'ı coğrafya derslerinde nasıl kullanırsınız? 5 sınıf aktivitesi, adım adım kurulum ve MEB müfredatıyla uyum rehberi.",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Coğrafya Öğretmenleri İçin: TürkiyeGuessr'ı Sınıfta Kullanma Rehberi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Coğrafya Öğretmenleri İçin: TürkiyeGuessr'ı Sınıfta Kullanma Rehberi",
    description:
      "TürkiyeGuessr'ı coğrafya derslerinde nasıl kullanırsınız? 5 sınıf aktivitesi, adım adım kurulum ve MEB müfredatıyla uyum rehberi.",
  },
};

export default function SiniftaTurkiyeguessrPost() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: "Coğrafya Öğretmenleri İçin: TürkiyeGuessr'ı Sınıfta Kullanma Rehberi",
    datePublished: "2026-03-15",
    dateModified: "2026-03-15",
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
      "TürkiyeGuessr'ı coğrafya derslerinde nasıl kullanırsınız? 5 sınıf aktivitesi, adım adım kurulum ve MEB müfredatıyla uyum rehberi.",
    wordCount: 2000,
    mainEntityOfPage: `${SITE_URL}/blog/sinifta-turkiyeguessr`,
    image: `${SITE_URL}/og-image.png`,
  };

  return (
    <SeoLayout
      breadcrumbs={[
        { name: "Anasayfa", url: "/" },
        { name: "Blog", url: "/blog" },
        { name: "Sınıfta TürkiyeGuessr", url: "/blog/sinifta-turkiyeguessr" },
      ]}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <article className="prose-custom space-y-8 max-w-3xl">
        <header>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <time dateTime="2026-03-15">15 Mart 2026</time>
            <span>7 dk okuma</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
            Coğrafya Öğretmenleri İçin: TürkiyeGuessr&apos;ı Sınıfta Kullanma Rehberi
          </h1>
          <p className="text-gray-400 mt-3 text-lg">
            Geleneksel ezber yerine interaktif öğrenme. Öğrencileriniz Türkiye coğrafyasını oynayarak öğrensin.
          </p>
        </header>

        <figure className="my-8 rounded-xl overflow-hidden">
          <Image
            src="/images/blog/classroom.jpg"
            alt="Sumela Manastiri, Trabzon — kayaliklara oyulmus tarihi manastir"
            width={800}
            height={450}
            className="w-full h-auto rounded-xl"
            priority
          />
          <figcaption className="text-center text-sm text-gray-500 mt-2">Sumela Manastiri — Trabzon&apos;un kayalik yamaclarina oyulmus tarihi manastir</figcaption>
        </figure>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Geleneksel Coğrafya Eğitiminin Sınırları</h2>
          <p className="text-gray-400 leading-relaxed">
            Coğrafya dersleri yıllardır aynı kalıpla işleniyor: öğretmen tahtada haritayı gösterir, öğrenciler illerin isimlerini ve bölgelerin özelliklerini ezberler, sınavda soruları yanıtlar ve sonra çoğunu unutur. Bu geleneksel yöntem bilgiyi aktarmada bir ölçüde işe yarasa da kalıcı öğrenme sağlamada yetersiz kalıyor. Araştırmalar gösteriyor ki pasif dinleme yoluyla öğrenilen bilgilerin yalnızca küçük bir kısmı uzun vadeli bellekte kalır.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Oyun tabanlı öğrenme (game-based learning) ise tamamen farklı bir yaklaşım sunar. Öğrenci aktif katılımcıdır, kararlar alır, hatalarından öğrenir ve başarılarından motivasyon kazanır. Rekabet unsuru dikkat süresini artırır, görsel deneyim mekana bağlı hafızayı güçlendirir. Coğrafya gibi mekana dayalı bir ders için konum tahmin oyunları neredeyse mükemmel bir eğitim aracı oluşturur.
          </p>
          <p className="text-gray-400 leading-relaxed">
            İşte tam bu noktada <Link href="/" className="text-red-400 hover:text-red-300 transition-colors">TürkiyeGuessr</Link> devreye giriyor. Ücretsiz, kayıt gerektirmeyen, tamamen Türkçe ve Türkiye odaklı bir konum tahmin oyunu olarak sınıf ortamında kullanıma son derece uygun. Öğrencileriniz Street View panoramalarında gezinerek illeri, bölgeleri ve coğrafi özellikleri doğrudan deneyimliyor.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Neden TürkiyeGuessr?</h2>
          <div className="space-y-3">
            {[
              { baslik: "Tamamen Ücretsiz", aciklama: "Okul bütçesi gerektirmez. Öğrencilerin kendi cihazlarından veya sınıf bilgisayarından erişebilir." },
              { baslik: "Kayıt Gereksiz", aciklama: "Hesap oluşturma, e-posta doğrulama gibi adımlar yok. Tarayıcıyı aç ve oyna. KVKK endişesi yok." },
              { baslik: "Tamamen Türkçe", aciklama: "Arayüz, talimatlar ve tüm içerik Türkçe. Dil engeli olmadan her öğrenci rahatlıkla kullanabilir." },
              { baslik: "Müfredata Uygun", aciklama: "MEB coğrafya müfredatındaki Türkiye bölgeleri, iklim, bitki örtüsü ve nüfus konularıyla doğrudan örtüşür." },
              { baslik: "Multiplayer Desteği", aciklama: "Oda kodu ile arkadaşlarla oynama özelliği sınıf içi yarışmalar düzenlemeye olanak tanır." },
            ].map((item) => (
              <div key={item.baslik} className="flex gap-3 bg-gray-800/40 border border-gray-700/30 rounded-lg p-3">
                <span className="text-red-400 font-medium text-sm whitespace-nowrap min-w-[140px]">{item.baslik}</span>
                <span className="text-gray-400 text-sm">{item.aciklama}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-red-400">5 Sınıf Aktivitesi</h2>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Aktivite 1: Bölge Tanıma Yarışması</h3>
            <p className="text-gray-400 leading-relaxed">
              Sınıfı 7 gruba bölün ve her gruba Türkiye&apos;nin bir coğrafi bölgesini atayın: <Link href="/bolgeler/marmara" className="text-red-400 hover:text-red-300 transition-colors">Marmara</Link>, <Link href="/bolgeler/ege" className="text-red-400 hover:text-red-300 transition-colors">Ege</Link>, <Link href="/bolgeler/akdeniz" className="text-red-400 hover:text-red-300 transition-colors">Akdeniz</Link>, <Link href="/bolgeler/karadeniz" className="text-red-400 hover:text-red-300 transition-colors">Karadeniz</Link>, <Link href="/bolgeler/ic-anadolu" className="text-red-400 hover:text-red-300 transition-colors">İç Anadolu</Link>, <Link href="/bolgeler/dogu-anadolu" className="text-red-400 hover:text-red-300 transition-colors">Doğu Anadolu</Link>, <Link href="/bolgeler/guneydogu" className="text-red-400 hover:text-red-300 transition-colors">Güneydoğu Anadolu</Link>. Projeksiyonda TürkiyeGuessr oynayın. Her lokasyonda gruplar hangi bölgede olduklarını tahmin etsin. Kendi bölgelerindeki lokasyonları doğru bilen gruplara ekstra puan verin.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Bu aktivite öğrencilerin bölge özelliklerini (iklim, bitki örtüsü, arazi yapısı) gerçek görüntülerle ilişkilendirmesini sağlar. Her tur sonrası kısa bir tartışma yaparak doğru cevabın ipuçlarını analiz edin: neden buranın Karadeniz olduğunu nasıl anladık? Hangi görsel ipuçları bölgeyi ele verdi?
            </p>
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Öğrenme Hedefleri</h4>
              <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                <li>7 coğrafi bölgenin görsel özelliklerini tanıma</li>
                <li>Bölgelerin iklim ve bitki örtüsü farklarını ayırt etme</li>
                <li>Gözlem ve analiz becerilerini geliştirme</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Aktivite 2: Plaka Kodu Challenge</h3>
            <p className="text-gray-400 leading-relaxed">
              TürkiyeGuessr&apos;da oynanan her turda öğrencilerden sokak görünümünde araçların plaka kodlarını bulmasını isteyin. Plaka kodunu bulan ve doğru ili bilen öğrenci puan kazanır. Bu aktivite için öğrencilere öncesinde <Link href="/blog/plaka-kodlarindan-il-tahmini" className="text-red-400 hover:text-red-300 transition-colors">plaka kodları rehberimizi</Link> inceleme görevi verilebilir.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Zorluk seviyesini kademeli olarak artırabilirsiniz. İlk aşamada sadece plaka kodundan il adını bulmayı isteyin. İkinci aşamada, il adından bölgeyi söylemelerini isteyin. Üçüncü aşamada ise il hakkında bilgi paylaşımı yapın: nüfusu, komşu illeri, önemli coğrafi özellikleri. Bu şekilde basit bir plaka kodu oyunundan kapsamlı bir coğrafya alıştırmasına dönüşür.
            </p>
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Öğrenme Hedefleri</h4>
              <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                <li>81 ilin plaka kodlarını öğrenme</li>
                <li>İllerin bölgesel konumlarını bilme</li>
                <li>Gözlem ve hızlı düşünme becerisi</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Aktivite 3: Bitki Örtüsü ve İklim Dedektifliği</h3>
            <p className="text-gray-400 leading-relaxed">
              Her TürkiyeGuessr lokasyonunda öğrencilerden çevrelerinde gördükleri bitki örtüsünü analiz etmelerini isteyin. Çay bahçeleri mi var? Zeytinlik mi? Tahıl tarlası mı? Palmiye ağaçları mı? Çıplak step mi? Bu gözlemlerden yola çıkarak iklim tipini belirlemeleri ve bölgeyi daraltmaları gerekiyor.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Her turdan sonra bir tartışma yapın: gördüğümüz bitki örtüsü hangi iklim koşullarını gerektiriyor? Yağış miktarı ne olabilir? Sıcaklık aralığı ne? Bu bölgede hangi tarımsal ürünler yetişir? Öğrenciler farkında olmadan Türkiye&apos;nin iklim haritasını, tarımsal üretim dağılımını ve bitki coğrafyasını öğrenmiş olurlar. <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-red-400 hover:text-red-300 transition-colors">Taktikler rehberimizden</Link> bitki örtüsü ipuçlarını önceden paylaşabilirsiniz.
            </p>
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Öğrenme Hedefleri</h4>
              <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                <li>İklim-bitki örtüsü ilişkisini anlama</li>
                <li>Türkiye&apos;nin tarımsal üretim dağılımını kavrama</li>
                <li>Gözlemden çıkarım yapma becerisi</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Aktivite 4: Mimari Dedektifliği</h3>
            <p className="text-gray-400 leading-relaxed">
              <Link href="/blog/turkiye-mimari-farklari" className="text-red-400 hover:text-red-300 transition-colors">Mimari farklar rehberimizi</Link> ders materyali olarak kullanarak her bölgenin yapı tarzını öğretin. Ardından TürkiyeGuessr oynayarak öğrencilerden yapıların mimari özelliklerini analiz etmelerini isteyin: çatı şekli nasıl? Duvar malzemesi ne? Pencere boyutları büyük mü küçük mü? Avlu var mı?
            </p>
            <p className="text-gray-400 leading-relaxed">
              Her öğrenciye bir gözlem formu dağıtın. Formda çatı tipi, duvar malzemesi, kat sayısı, pencere büyüklüğü ve çevresel öğeler gibi kategoriler olsun. Her lokasyonda formu doldurup bölge tahmini yapsınlar. Bu aktivite hem gözlem becerisini hem de mimari-iklim ilişkisini anlama kapasitesini geliştirir. Öğrenciler zamanla bilinçaltında mimari kodları okumayı öğrenir.
            </p>
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Öğrenme Hedefleri</h4>
              <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                <li>Bölgesel mimari farkları tanıma</li>
                <li>İklim-malzeme-yapı ilişkisini kavrama</li>
                <li>Sistematik gözlem ve sınıflandırma becerisi</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Aktivite 5: Harita Okuma ve Mesafe Hesaplama</h3>
            <p className="text-gray-400 leading-relaxed">
              TürkiyeGuessr&apos;da her tur sonunda tahmin edilen nokta ile gerçek konum arasındaki mesafe gösterilir. Bu özelliği harita okuma ve mesafe kavramını öğretmek için kullanabilirsiniz. Öğrencilerden tahmin yapmadan önce koordinatları tahmin etmelerini isteyin. Enlem ve boylam kavramlarını pratik bir şekilde öğretmek için bunu düzenli olarak tekrarlayın.
            </p>
            <p className="text-gray-400 leading-relaxed">
              İleri seviye için öğrencilere harita üzerinde ölçek hesaplama görevi verin. İki şehir arasındaki kuş uçuşu mesafeyi tahmin etmeleri, yön (kuzey, güneydoğu vb.) belirlemeleri ve bunu haritadaki ölçekle karşılaştırmaları pratik beceriler kazandırır. TürkiyeGuessr&apos;ın puan sistemi de matematiksel düşünmeyi teşvik eder: neden 10 km sapma ile 100 km sapma arasında puan farkı bu kadar büyük?
            </p>
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Öğrenme Hedefleri</h4>
              <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                <li>Enlem-boylam koordinat sistemi</li>
                <li>Harita ölçeği ve mesafe hesaplama</li>
                <li>Yön kavramı ve pusula kullanımı</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Sınıfta Nasıl Başlanır? Adım Adım Kurulum</h2>
          <div className="space-y-3">
            {[
              { adim: "1", baslik: "Teknik Hazırlık", aciklama: "Sınıfta internet bağlantılı bir bilgisayar ve projeksiyon veya akıllı tahta hazırlayın. TürkiyeGuessr tarayıcı tabanlı çalışır, herhangi bir kurulum gerekmez." },
              { adim: "2", baslik: "TürkiyeGuessr'ı Açın", aciklama: "Tarayıcıda turkiyeguessr.com adresine gidin. Ana sayfada doğrudan oyun başlatabilirsiniz. Hesap oluşturmanıza gerek yok." },
              { adim: "3", baslik: "Oyun Modunu Seçin", aciklama: "Tek kişilik mod ile projeksiyonda tüm sınıfa gösterebilirsiniz. Multiplayer mod ile öğrenciler kendi cihazlarından katılabilir." },
              { adim: "4", baslik: "Multiplayer Oda Kurun", aciklama: "Multiplayer seçeneğinde bir oda kodu oluşturun ve bu kodu tahtaya yazın. Öğrenciler kendi telefonlarından veya tabletlerinden bu kodla odaya katılsın." },
              { adim: "5", baslik: "Kuralları Belirleyin", aciklama: "Her tur için süre limiti koyun (60-120 saniye önerilir). Tur aralarında tartışma zamanı ayırın. Puanlama sistemini açıklayın." },
            ].map((item) => (
              <div key={item.adim} className="flex gap-3 bg-gray-800/40 border border-gray-700/30 rounded-lg p-3">
                <span className="text-red-400 font-bold text-lg min-w-[24px]">{item.adim}</span>
                <div>
                  <span className="text-gray-200 font-medium text-sm block">{item.baslik}</span>
                  <span className="text-gray-400 text-sm">{item.aciklama}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">MEB Müfredatıyla Bağlantı</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr aktiviteleri, MEB coğrafya müfredatındaki pek çok kazanımla doğrudan örtüşür. Aşağıda hangi aktivitelerin hangi müfredat konularıyla eşleştiğini görebilirsiniz:
          </p>
          <div className="space-y-3">
            {[
              { konu: "Türkiye'nin Coğrafi Bölgeleri", sinif: "9-10. Sınıf", aktivite: "Bölge Tanıma Yarışması" },
              { konu: "Türkiye'de İklim ve Bitki Örtüsü", sinif: "9-10. Sınıf", aktivite: "Bitki Örtüsü ve İklim Dedektifliği" },
              { konu: "Türkiye'nin İdari Yapısı (İller)", sinif: "9. Sınıf", aktivite: "Plaka Kodu Challenge" },
              { konu: "Yerleşme ve Konut Tipleri", sinif: "11. Sınıf", aktivite: "Mimari Dedektifliği" },
              { konu: "Harita Bilgisi ve Koordinat Sistemi", sinif: "9. Sınıf", aktivite: "Harita Okuma ve Mesafe Hesaplama" },
              { konu: "Tarım Coğrafyası", sinif: "11. Sınıf", aktivite: "Bitki Örtüsü ve İklim Dedektifliği" },
              { konu: "Turizm Coğrafyası", sinif: "12. Sınıf", aktivite: "Bölge Tanıma Yarışması" },
            ].map((item) => (
              <div key={item.konu} className="grid grid-cols-3 gap-2 bg-gray-800/40 border border-gray-700/30 rounded-lg p-3 text-sm">
                <span className="text-gray-200 font-medium">{item.konu}</span>
                <span className="text-gray-500">{item.sinif}</span>
                <span className="text-red-400">{item.aktivite}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-red-400">Öğretmenlerden İpuçları</h2>
          <p className="text-gray-400 leading-relaxed">
            TürkiyeGuessr&apos;ı sınıfta kullanan öğretmenlerden aldığımız geri bildirimlere dayanarak bazı pratik öneriler sunabiliriz. Ders süresinin tamamını oyuna ayırmak yerine 15-20 dakikalık bloklar halinde kullanmak daha etkili oluyor. Geri kalan sürede tartışma, not alma ve analiz yapılabiliyor.
          </p>
          <p className="text-gray-400 leading-relaxed">
            Öğrencilerin rekabetçi doğasını olumlu yönde kullanın ama aşırı rekabetten kaçının. Takım çalışması odaklı aktiviteler bireysel yarışmadan daha iyi sonuç veriyor. Her takımda farklı seviyede öğrenciler olması, arkadaş öğretimini (peer learning) teşvik ediyor. Coğrafya bilgisi güçlü öğrenciler diğerlerine doğal olarak rehberlik ediyor.
          </p>
          <p className="text-gray-400 leading-relaxed">
            <Link href="/nasil-oynanir" className="text-red-400 hover:text-red-300 transition-colors">Nasıl oynanır rehberimizi</Link> öğrencilere ödev olarak okutabilirsiniz. Böylece ders zamanını kuralları açıklamak yerine doğrudan oynamak ve tartışmak için kullanabilirsiniz. Ayrıca <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-red-400 hover:text-red-300 transition-colors">taktikler rehberimiz</Link> öğrencilere stratejik düşünme becerisi kazandırır.
          </p>
        </section>

        <section className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-6 space-y-3">
          <h2 className="text-xl font-semibold text-gray-200">Hızlı Başlangıç Kontrol Listesi</h2>
          <ul className="text-gray-400 text-sm space-y-2 list-disc list-inside">
            <li><strong className="text-gray-300">Projeksiyon + internet:</strong> Sınıfta hazır mı?</li>
            <li><strong className="text-gray-300">Öğrenci cihazları:</strong> Multiplayer için telefon/tablet var mı?</li>
            <li><strong className="text-gray-300">Süre planı:</strong> 15-20 dk oyun + 10 dk tartışma ayırdınız mı?</li>
            <li><strong className="text-gray-300">Aktivite seçimi:</strong> Konuya uygun aktiviteyi belirlediniz mi?</li>
            <li><strong className="text-gray-300">Puan tablosu:</strong> Tahtada takım puanlarını yazacak yer var mı?</li>
            <li><strong className="text-gray-300">Ön okuma:</strong> Öğrencilere nasıl oynanır rehberini okuttunuz mu?</li>
          </ul>
        </section>

        <section className="text-center py-6 space-y-3">
          <h2 className="text-2xl font-bold text-white">Sınıfınızda TürkiyeGuessr&apos;ı Deneyin!</h2>
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
          <Link href="/blog/turkiye-cografya-quiz" className="text-sm text-gray-400 hover:text-white transition-colors">
            Coğrafya Quiz →
          </Link>
        </nav>

        <section className="space-y-4 pt-4 border-t border-gray-700/30">
          <h2 className="text-xl font-semibold text-red-400">İlgili İçerikler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link href="/nasil-oynanir" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Nasıl Oynanır?
            </Link>
            <Link href="/blog/geoguessr-taktikleri-ipuclari" className="text-gray-400 hover:text-white text-sm transition-colors">
              → GeoGuessr Taktikleri ve İpuçları
            </Link>
            <Link href="/blog/turkiye-mimari-farklari" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye Mimari Farkları
            </Link>
            <Link href="/blog/turkiye-cografya-quiz" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye Coğrafya Quiz
            </Link>
            <Link href="/blog/plaka-kodlarindan-il-tahmini" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Plaka Kodlarından İl Tahmini
            </Link>
            <Link href="/blog/turkiye-bolgeleri-rehberi" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Türkiye Bölgeleri Rehberi
            </Link>
            <Link href="/blog/turkiyeguessr-hikayesi" className="text-gray-400 hover:text-white text-sm transition-colors">
              → TürkiyeGuessr&apos;ın Hikayesi
            </Link>
            <Link href="/bolgeler" className="text-gray-400 hover:text-white text-sm transition-colors">
              → Tüm Bölgeler
            </Link>
          </div>
        </section>
      </article>
    </SeoLayout>
  );
}
