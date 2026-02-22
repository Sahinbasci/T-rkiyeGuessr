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
  // BUG-005: validation error for name
  nameError?: string | null;
}

/* ==========================================
   SEO LANDING TEASER — Kompakt on-page SEO
   ========================================== */
function SEOLandingContent() {
  return (
    <section className="mt-8 mb-4 w-full max-w-md mx-auto text-center space-y-3">
      <h2 className="text-base font-semibold text-gray-400">
        Türkiye&apos;nin Ücretsiz Konum Tahmin Oyunu
      </h2>
      <p className="text-gray-600 text-xs leading-relaxed">
        142+ lokasyon, 7 bölge, 2-8 kişi multiplayer.
        Sokak görünümünde Türkiye&apos;yi keşfet, haritada konumu bul.
      </p>
      <nav className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-[11px] text-gray-600" aria-label="Keşfet">
        <Link href="/nasil-oynanir" className="hover:text-gray-400 transition-colors">Nasıl Oynanır?</Link>
        <span aria-hidden="true">·</span>
        <Link href="/bolgeler" className="hover:text-gray-400 transition-colors">Bölgeler</Link>
        <span aria-hidden="true">·</span>
        <Link href="/sehirler" className="hover:text-gray-400 transition-colors">Şehirler</Link>
        <span aria-hidden="true">·</span>
        <Link href="/blog" className="hover:text-gray-400 transition-colors">Blog</Link>
        <span aria-hidden="true">·</span>
        <Link href="/sss" className="hover:text-gray-400 transition-colors">SSS</Link>
      </nav>
    </section>
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
  nameError,
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
          {/* BUG-014: Proper label association with htmlFor + id */}
          <div>
            <label htmlFor="player-name-input" className="block text-gray-400 text-sm mb-2">Oyuncu Adı</label>
            <input
              id="player-name-input"
              type="text"
              placeholder="Adını gir..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className={`input-dark text-lg ${nameError ? "border-red-500" : ""}`}
              maxLength={20}
              aria-invalid={!!nameError}
              aria-describedby={nameError ? "name-error" : undefined}
            />
            {/* BUG-005: Explicit validation error for empty name */}
            {nameError && (
              <p id="name-error" className="text-red-400 text-xs mt-1" role="alert">
                {nameError}
              </p>
            )}
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-2" id="game-mode-label">Oyun Modu</label>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby="game-mode-label">
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
                    role="radio"
                    aria-checked={selectedMode === mode}
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

          {/* BUG-014: Proper label association */}
          <div>
            <label htmlFor="room-code-input" className="block text-gray-400 text-sm mb-2">Oda Kodu</label>
            <input
              id="room-code-input"
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
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-center" role="alert">
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

        {/* SEO Power Section */}
        <SEOLandingContent />
      </div>
    </main>
  );
}
