import Link from "next/link";
import { MapPin, Users, ArrowRight } from "lucide-react";
import { GameMode, GAME_MODE_CONFIG } from "@/types";

interface MenuScreenProps {
  nameInput: string;
  setNameInput: (value: string) => void;
  roomInput: string;
  setRoomInput: (value: string) => void;
  selectedMode: GameMode;
  setSelectedMode: (mode: GameMode) => void;
  error: string | null;
  isLoading: boolean;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

/* ==========================================
   SEO LANDING CONTENT — On-Page SEO Power Section
   Keyword-dense, semantic, FAQ Schema goldmine
   ========================================== */
function SEOLandingContent() {
  return (
    <article className="mt-12 mb-6 w-full max-w-md mx-auto space-y-8">
      {/* Section Header */}
      <header className="text-center">
        <h2
          className="text-2xl sm:text-3xl font-bold text-white tracking-wide"
          style={{ fontFamily: "var(--font-display)" }}
        >
          En İyi Multiplayer Harita ve Konum Bilmece Oyunu
        </h2>
        <p className="text-gray-500 text-sm mt-2">
          Ücretsiz Geoguessr alternatifi — tamamen Türkçe, tamamen ücretsiz.
        </p>
      </header>

      {/* Section 1: The Hook */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🎯</span>
          Coğrafya Bilgini Test Et
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          TürkiyeGuessr, Türkiye&apos;nin dört bir yanından sokak görünümlerini
          karşına çıkaran bir <strong className="text-gray-300">coğrafya tahmin oyunu</strong>dur.
          Google Street View üzerinde rastgele bir noktaya düşersin; tabelaları,
          manzarayı ve ipuçlarını kullanarak haritada doğru konumu bulmaya çalışırsın.
          Hedefin basit: pini ne kadar yakına koyarsan o kadar çok puan kazanırsın!
          İster İstanbul&apos;un sokaklarını ister Karadeniz yaylalarını tanı —{" "}
          <strong className="text-gray-300">81 il gezgini</strong> olmanın tam zamanı.
        </p>
      </section>

      {/* Section 2: Multiplayer Focus */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">👥</span>
          Arkadaşınla Oyna — Online Multiplayer
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          TürkiyeGuessr bir{" "}
          <strong className="text-gray-300">online multiplayer harita oyunu</strong>dur.
          Arkadaşınla oynamak çok kolay: &quot;Yeni Oda Oluştur&quot; butonuna
          tıkla, ekranda beliren 6 haneli oda kodunu arkadaşınla paylaş ve
          birlikte aynı turda yarışmaya başlayın. Her turda aynı konuma
          düşersiniz; kim daha doğru tahmin ederse o kazanır.
          Tek başına pratik yap, ikili düello kur veya 8 kişilik büyük
          turnuvalar düzenle —{" "}
          <strong className="text-gray-300">arkadaşınla oyna</strong>,
          skor tablosunda zirveye çık!
        </p>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-300">Nasıl Başlanır?</h4>
          <ol className="text-gray-500 text-xs space-y-1 list-decimal list-inside">
            <li>Oyuncu adını yaz</li>
            <li>Oyun modunu seç (Şehir Kaşifi veya Coğrafya Modu)</li>
            <li>&quot;Yeni Oda Oluştur&quot; butonuna bas</li>
            <li>Oda kodunu arkadaşlarınla paylaş</li>
            <li>Herkes katılınca &quot;Oyunu Başlat&quot; de — ve keşfe çık!</li>
          </ol>
        </div>
      </section>

      {/* Section 3: Educational Value */}
      <section className="space-y-3">
        <h3 className="text-lg font-semibold text-red-400 flex items-center gap-2">
          <span className="text-xl" aria-hidden="true">🎓</span>
          Öğrenciler ve Coğrafya Tutkunları İçin
        </h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Sadece bir oyun değil, aynı zamanda bir öğrenme aracı.{" "}
          <strong className="text-gray-300">Türkiye harita konum bilmece</strong>{" "}
          formatıyla illeri, bölgeleri ve yöresel özellikleri oyun oynarken
          öğrenirsin. Öğretmenler sınıfta, öğrenciler ders aralarında, coğrafya
          meraklıları her an oynayabilir. TürkiyeGuessr,{" "}
          <strong className="text-gray-300">ücretsiz Geoguessr alternatifi</strong>{" "}
          olarak Türkiye&apos;ye özel içerikleriyle fark yaratır — kayıt
          gerektirmez, reklam yoktur, anında oynamaya başlarsın.
        </p>
      </section>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
        <span className="text-gray-600 text-xs">SSS</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
      </div>

      {/* FAQ Section */}
      <section className="space-y-3" aria-label="Sıkça Sorulan Sorular">
        <h3 className="text-lg font-semibold text-gray-300">Sıkça Sorulan Sorular</h3>

        <details className="group bg-gray-800/40 border border-gray-700/50 rounded-xl">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors list-none flex items-center justify-between">
            Arkadaşımla nasıl oynarım?
            <span className="text-gray-600 group-open:rotate-180 transition-transform" aria-hidden="true">▾</span>
          </summary>
          <div className="px-4 pb-3 text-gray-400 text-sm leading-relaxed">
            Çok basit! Ana ekranda adını yaz, oyun modunu seç ve &quot;Yeni Oda
            Oluştur&quot; butonuna tıkla. Ekranda çıkan 6 haneli oda kodunu
            arkadaşlarınla paylaş. Onlar da aynı kodu &quot;Oda Kodu&quot;
            alanına yazıp &quot;Odaya Katıl&quot; diyerek lobiye girer.
            Herkes hazır olduğunda host oyunu başlatır. Arkadaşınla oyna
            ve kimin Türkiye coğrafyasını daha iyi bildiğini kanıtla!
          </div>
        </details>

        <details className="group bg-gray-800/40 border border-gray-700/50 rounded-xl">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors list-none flex items-center justify-between">
            Oyun ücretli mi?
            <span className="text-gray-600 group-open:rotate-180 transition-transform" aria-hidden="true">▾</span>
          </summary>
          <div className="px-4 pb-3 text-gray-400 text-sm leading-relaxed">
            Hayır! TürkiyeGuessr %100 ücretsizdir. Kayıt, giriş veya ödeme
            gerektirmez. Tarayıcını aç, adını yaz ve oynamaya başla.
            Ücretsiz Geoguessr alternatifi arıyorsan doğru yerdesin.
          </div>
        </details>

        <details className="group bg-gray-800/40 border border-gray-700/50 rounded-xl">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors list-none flex items-center justify-between">
            Kaç kişi aynı anda oynayabilir?
            <span className="text-gray-600 group-open:rotate-180 transition-transform" aria-hidden="true">▾</span>
          </summary>
          <div className="px-4 pb-3 text-gray-400 text-sm leading-relaxed">
            Bir odada 2 ile 8 kişi arası aynı anda oynayabilir. Herkese
            aynı konum gösterilir ve süre bitene kadar tahminler yapılır.
            En yüksek puanı toplayan oyuncu kazanır. Online multiplayer
            harita oyunu deneyiminin tadını çıkar!
          </div>
        </details>

        <details className="group bg-gray-800/40 border border-gray-700/50 rounded-xl">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors list-none flex items-center justify-between">
            Hangi cihazlarda oynanabilir?
            <span className="text-gray-600 group-open:rotate-180 transition-transform" aria-hidden="true">▾</span>
          </summary>
          <div className="px-4 pb-3 text-gray-400 text-sm leading-relaxed">
            TürkiyeGuessr masaüstü, tablet ve mobil tarayıcılarda çalışır.
            Chrome, Safari, Firefox veya Edge — fark etmez. Uygulama
            indirmen gerekmez; tarayıcıdan doğrudan oynarsın.
          </div>
        </details>

        <details className="group bg-gray-800/40 border border-gray-700/50 rounded-xl">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors list-none flex items-center justify-between">
            Türkiye&apos;nin kaç ili var oyunda?
            <span className="text-gray-600 group-open:rotate-180 transition-transform" aria-hidden="true">▾</span>
          </summary>
          <div className="px-4 pb-3 text-gray-400 text-sm leading-relaxed">
            TürkiyeGuessr, Türkiye&apos;nin tüm bölgelerini kapsayan geniş bir
            konum havuzuna sahiptir. Marmara&apos;dan Güneydoğu&apos;ya, Ege&apos;den
            Karadeniz&apos;e kadar onlarca ilden sokak görünümleri bulunur.
            Gerçek bir 81 il gezgini olmak istiyorsan bu oyun tam sana göre.
          </div>
        </details>
      </section>

      {/* FAQ Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "Arkadaşımla nasıl oynarım?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Ana ekranda adını yaz, oyun modunu seç ve 'Yeni Oda Oluştur' butonuna tıkla. Ekranda çıkan 6 haneli oda kodunu arkadaşlarınla paylaş. Onlar da aynı kodu 'Oda Kodu' alanına yazıp 'Odaya Katıl' diyerek lobiye girer. Herkes hazır olduğunda host oyunu başlatır.",
                },
              },
              {
                "@type": "Question",
                name: "TürkiyeGuessr ücretli mi?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Hayır! TürkiyeGuessr %100 ücretsizdir. Kayıt, giriş veya ödeme gerektirmez. Tarayıcını aç, adını yaz ve oynamaya başla. Ücretsiz Geoguessr alternatifi arıyorsan doğru yerdesin.",
                },
              },
              {
                "@type": "Question",
                name: "Kaç kişi aynı anda oynayabilir?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Bir odada 2 ile 8 kişi arası aynı anda oynayabilir. Herkese aynı konum gösterilir ve süre bitene kadar tahminler yapılır. En yüksek puanı toplayan oyuncu kazanır.",
                },
              },
              {
                "@type": "Question",
                name: "Hangi cihazlarda oynanabilir?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "TürkiyeGuessr masaüstü, tablet ve mobil tarayıcılarda çalışır. Chrome, Safari, Firefox veya Edge — fark etmez. Uygulama indirmen gerekmez; tarayıcıdan doğrudan oynarsın.",
                },
              },
              {
                "@type": "Question",
                name: "Türkiye'nin kaç ili var oyunda?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "TürkiyeGuessr, Türkiye'nin tüm bölgelerini kapsayan geniş bir konum havuzuna sahiptir. Marmara'dan Güneydoğu'ya, Ege'den Karadeniz'e kadar onlarca ilden sokak görünümleri bulunur.",
                },
              },
            ],
          }),
        }}
      />
    </article>
  );
}

export function MenuScreen({
  nameInput,
  setNameInput,
  roomInput,
  setRoomInput,
  selectedMode,
  setSelectedMode,
  error,
  isLoading,
  onCreateRoom,
  onJoinRoom,
}: MenuScreenProps) {
  return (
    <main className="min-h-screen overflow-y-auto py-8 px-4 bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 mb-4 shadow-lg shadow-red-600/30"
            role="img"
            aria-label="TürkiyeGuessr logosu - Türkiye konum tahmin oyunu"
          >
            <MapPin size={40} className="text-white" aria-hidden="true" />
          </div>
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-wider"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TürkiyeGuessr
          </h1>
          <h2 className="text-gray-400 mt-2 text-sm sm:text-base font-normal">
            Arkadaşlarınla Türkiye&apos;yi Keşfet!
          </h2>
          <p className="text-gray-600 mt-1 text-xs">
            Multiplayer Konum Tahmin Oyunu - 81 İl, Sonsuz Keşif
          </p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-2">Oyuncu Adı</label>
            <input
              type="text"
              placeholder="Adını gir..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="input-dark text-lg"
              maxLength={15}
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Oyun Modu</label>
            <div className="grid grid-cols-2 gap-2">
              {(["urban", "geo"] as GameMode[]).map((mode) => {
                const config = GAME_MODE_CONFIG[mode];
                return (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={`p-3 rounded-xl border-2 transition-all text-left ${
                      selectedMode === mode
                        ? "border-red-500 bg-red-500/10"
                        : "border-gray-700 bg-gray-800/50 hover:border-gray-600"
                    }`}
                  >
                    <div className="text-2xl mb-1">{config.icon}</div>
                    <div className="font-medium text-sm">{config.name}</div>
                    <div className="text-gray-500 text-xs">{config.timeLimit}sn</div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={onCreateRoom}
            disabled={!nameInput.trim() || isLoading || roomInput.trim().length > 0}
            className={`w-full py-4 text-lg flex items-center justify-center gap-2 transition-all ${
              roomInput.trim().length > 0 ? "btn-secondary opacity-60" : "btn-primary"
            }`}
          >
            {isLoading && !roomInput.trim() ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                <Users size={20} />
                Yeni Oda Oluştur
              </>
            )}
          </button>

          <div className="flex items-center gap-4 text-gray-500 py-2">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
            <span className="text-sm text-gray-500">veya odaya katıl</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2">Oda Kodu</label>
            <input
              type="text"
              placeholder="ABC123"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              className={`input-dark text-xl uppercase tracking-[0.3em] text-center font-bold transition-all ${
                roomInput.trim() ? "border-red-500 bg-red-500/10" : ""
              }`}
              maxLength={6}
            />
          </div>

          <button
            onClick={onJoinRoom}
            disabled={!nameInput.trim() || !roomInput.trim() || isLoading}
            className={`w-full py-4 text-lg flex items-center justify-center gap-2 transition-all ${
              roomInput.trim().length > 0 ? "btn-primary" : "btn-secondary opacity-60"
            }`}
          >
            {isLoading && roomInput.trim() ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Katılınıyor...
              </>
            ) : (
              <>
                <ArrowRight size={20} />
                Odaya Katıl
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-center">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
        </div>

        <footer className="text-center text-gray-600 text-xs mt-4 space-y-3">
          <p>Arkadaşların sana oda kodu versin veya kendi odanı oluştur!</p>
          <nav className="flex flex-wrap justify-center gap-x-3 gap-y-1" aria-label="Site linkleri">
            <Link href="/nasil-oynanir" className="hover:text-gray-400 transition-colors">Nasıl Oynanır?</Link>
            <Link href="/multiplayer" className="hover:text-gray-400 transition-colors">Multiplayer</Link>
            <Link href="/bolgeler" className="hover:text-gray-400 transition-colors">Bölgeler</Link>
            <Link href="/sehirler" className="hover:text-gray-400 transition-colors">Şehirler</Link>
            <Link href="/geoguessr-alternatifi" className="hover:text-gray-400 transition-colors">GeoGuessr Alternatifi</Link>
            <Link href="/sss" className="hover:text-gray-400 transition-colors">SSS</Link>
            <Link href="/hakkimizda" className="hover:text-gray-400 transition-colors">Hakkımızda</Link>
          </nav>
          <p className="text-gray-700">
            TürkiyeGuessr - Türkiye Sokak Görünümü Konum Tahmin Oyunu
          </p>
        </footer>

        {/* SEO Power Section — On-Page Content for Google */}
        <SEOLandingContent />
      </div>
    </main>
  );
}
