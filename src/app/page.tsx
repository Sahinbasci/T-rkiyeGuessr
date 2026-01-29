"use client";

import { useState, useEffect, useCallback } from "react";
import { useRoom, useStreetView, useGuessMap } from "@/hooks";
import { Coordinates } from "@/types";
import { formatDistance } from "@/utils";
import { 
  MapPin, Users, Crown, Copy, Check, Play, 
  Trophy, Target, Clock, ArrowRight, RotateCcw 
} from "lucide-react";

const PLAYER_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#f59e0b", 
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"
];

export default function Home() {
  const [screen, setScreen] = useState<"menu" | "lobby" | "game">("menu");
  const [nameInput, setNameInput] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [guessLocation, setGuessLocation] = useState<Coordinates | null>(null);

  const {
    room,
    playerId,
    currentPlayer,
    isHost,
    players,
    error,
    isLoading,
    createRoom,
    joinRoom,
    startGame,
    submitGuess,
    checkAllGuessed,
    nextRound,
    leaveRoom,
    restartGame,
  } = useRoom();

  const { isLoading: streetViewLoading, streetViewRef, loadNewLocation, showStreetView } = useStreetView();
  const { guessMapRef, selectedLocation, initializeMap, resetMap, showResults } = useGuessMap(setGuessLocation);

  // Oyun ekranına geçince Street View'ı yükle
  useEffect(() => {
    if (screen !== "game" || !room?.currentPanoId) return;

    let cancelled = false;
    let tries = 0;

    const run = async () => {
      if (cancelled) return;

      // İlk turda bazen ref henüz hazır olmuyor; kısa retry ile bekle
      if (!streetViewRef.current) {
        tries += 1;
        if (tries < 20) {
          setTimeout(run, 50);
        }
        return;
      }

      // Haritayı kur (ref hazır olduktan sonra)
      initializeMap();

      // Street View'ı kur
      await showStreetView(room.currentPanoId!);
    };

    const t = setTimeout(run, 0);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [screen, room?.currentPanoId, room?.currentRound, showStreetView, initializeMap]);

  // Join olan oyuncularda mini-harita bazen geç mount olduğu için
  // initializeMap() ilk çağrıda guessMapRef null kalabiliyor. Bu effect
  // oyun "playing" durumundayken haritayı tekrar init ederek tıklamaları garanti eder.
  useEffect(() => {
    if (screen !== "game" || !room) return;
    if (room.status !== "playing") return;

    let cancelled = false;
    let tries = 0;

    const run = () => {
      if (cancelled) return;
      tries += 1;

      // Non-host/join oyuncularda Google Maps script'i bazen geç geliyor.
      // google.maps hazır olana kadar kısa aralıklarla tekrar dene.
      const hasGoogleMaps =
        typeof window !== "undefined" &&
        (window as any).google &&
        (window as any).google.maps;

      if (!hasGoogleMaps) {
        if (tries < 60) setTimeout(run, 50); // ~3 saniyeye kadar retry
        return;
      }

      initializeMap();
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [screen, room?.status, room?.currentRound, initializeMap]);




  // Tüm tahminler geldi mi kontrol et
  useEffect(() => {
    if (room?.status === "playing" && isHost) {
      const allGuessed = players.every((p) => p.hasGuessed);
      if (allGuessed && players.length > 0) {
        checkAllGuessed();
      }
    }
  }, [room?.status, players, isHost, checkAllGuessed]);

  // Tur sonu - sonuçları göster
  useEffect(() => {
    if (room?.status === "roundEnd" && room.roundResults && room.currentLocation) {
      const guesses = room.roundResults.map((r, i) => ({
        playerName: r.playerName,
        guess: r.guess,
        color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      }));
      showResults(room.currentLocation, guesses);
    }
  }, [room?.status, room?.roundResults, room?.currentLocation, showResults]);

  // Oda oluştur
  const handleCreateRoom = async () => {
    if (!nameInput.trim()) return;
    const code = await createRoom(nameInput.trim());
    if (code) setScreen("lobby");
  };

  // Odaya katıl
  const handleJoinRoom = async () => {
    if (!nameInput.trim() || !roomInput.trim()) return;
    const success = await joinRoom(roomInput.trim().toUpperCase(), nameInput.trim());
    if (success) setScreen("lobby");
  };

  // Oyunu başlat
  const handleStartGame = async () => {
    // Önce konum bul
    const location = await loadNewLocation();
    if (location) {
      // Firebase'e kaydet
      await startGame(location.coordinates, location.panoId);
      // Sonra ekrana geç (useEffect Street View'ı yükleyecek)
      setScreen("game");
    }
  };

  // Tahmin gönder
  const handleSubmitGuess = async () => {
    if (!guessLocation) return;

    await submitGuess(guessLocation);

    // Host için: özellikle tek kişilik / gecikmeli senaryolarda roundEnd'e geçişi kaçırmamak adına
    // kısa bir gecikme ile tekrar kontrol ettir.
    if (isHost) {
      setTimeout(() => {
        checkAllGuessed();
      }, 300);
    }
  };


  // Sonraki tur
  const handleNextRound = async () => {
    // Önce haritayı resetle
    resetMap();
    setGuessLocation(null);
    
    // Yeni konum bul
    const location = await loadNewLocation();
    if (location) {
      // Firebase'e kaydet (useEffect Street View'ı yükleyecek)
      await nextRound(location.coordinates, location.panoId);
    }
  };

  // Yeni oyun
  const handleRestartGame = async () => {
    resetMap();
    setGuessLocation(null);
    await restartGame();
    setScreen("lobby");
  };

  // Kodu kopyala
  const copyRoomCode = () => {
    if (room?.id) {
      navigator.clipboard.writeText(room.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Lobby'ye git (oyun başladıysa)
  useEffect(() => {
    if (room?.status === "playing" || room?.status === "roundEnd") {
      setScreen("game");
    } else if (room?.status === "waiting" && screen === "game") {
      setScreen("lobby");
    }
  }, [room?.status, screen]);

  // ==================== MENU SCREEN ====================
  if (screen === "menu") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 mb-4">
              <MapPin size={40} className="text-white" />
            </div>
            <h1 className="text-5xl font-bold tracking-wider" style={{ fontFamily: "var(--font-display)" }}>
              TürkiyeGuessr
            </h1>
            <p className="text-gray-400 mt-2">Arkadaşlarınla Türkiye'yi Keşfet!</p>
          </div>

          {/* Form */}
          <div className="glass rounded-2xl p-6 space-y-4">
            <input
              type="text"
              placeholder="Adını gir..."
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="input-dark text-lg"
              maxLength={15}
            />

            <button
              onClick={handleCreateRoom}
              disabled={!nameInput.trim() || isLoading}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
            >
              <Users size={20} />
              Oda Oluştur
            </button>

            <div className="flex items-center gap-4 text-gray-500">
              <div className="flex-1 h-px bg-gray-700" />
              <span className="text-sm">veya</span>
              <div className="flex-1 h-px bg-gray-700" />
            </div>

            <input
              type="text"
              placeholder="Oda kodu (örn: ABC123)"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              className="input-dark text-lg uppercase tracking-widest text-center"
              maxLength={6}
            />

            <button
              onClick={handleJoinRoom}
              disabled={!nameInput.trim() || !roomInput.trim() || isLoading}
              className="btn-secondary w-full py-4 text-lg"
            >
              Odaya Katıl
            </button>

            {error && (
              <p className="text-red-400 text-center text-sm">{error}</p>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ==================== LOBBY SCREEN ====================
  if (screen === "lobby" && room) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]">
        <div className="w-full max-w-lg">
          <div className="glass rounded-2xl p-6">
            {/* Room Code */}
            <div className="text-center mb-6">
              <p className="text-gray-400 text-sm mb-2">Oda Kodu</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-bold tracking-[0.3em]" style={{ fontFamily: "var(--font-display)" }}>
                  {room.id}
                </span>
                <button
                  onClick={copyRoomCode}
                  className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition"
                >
                  {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-2">Bu kodu arkadaşlarınla paylaş!</p>
            </div>

            {/* Players */}
            <div className="mb-6">
              <p className="text-gray-400 text-sm mb-3 flex items-center gap-2">
                <Users size={16} />
                Oyuncular ({players.length}/8)
              </p>
              <div className="space-y-2">
                {players.map((player, i) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: PLAYER_COLORS[i] }}
                    >
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="flex-1 font-medium">{player.name}</span>
                    {player.isHost && (
                      <Crown size={18} className="text-yellow-400" />
                    )}
                    {player.id === playerId && (
                      <span className="text-xs text-gray-400">(Sen)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Start Button (Host only) */}
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={players.length < 1 || streetViewLoading}
                className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
              >
                {streetViewLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Konum Aranıyor...
                  </>
                ) : (
                  <>
                    <Play size={20} />
                    Oyunu Başlat
                  </>
                )}
              </button>
            ) : (
              <div className="text-center py-4 text-gray-400">
                <Clock size={24} className="mx-auto mb-2 animate-pulse" />
                Host'un oyunu başlatması bekleniyor...
              </div>
            )}

            <button
              onClick={leaveRoom}
              className="w-full mt-3 py-2 text-gray-400 hover:text-white transition text-sm"
            >
              Odadan Ayrıl
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ==================== GAME SCREEN ====================
  if (screen === "game" && room) {
    const isRoundEnd = room.status === "roundEnd";
    const isGameOver = room.status === "gameOver";
    const hasGuessed = currentPlayer?.hasGuessed || false;
    const waitingCount = players.filter((p) => !p.hasGuessed).length;

    // Sonuçları sırala
    const sortedResults = room.roundResults
      ? [...room.roundResults].sort((a, b) => a.distance - b.distance)
      : [];

    // Final sıralaması
    const finalRankings = [...players].sort((a, b) => b.totalScore - a.totalScore);

    return (
      <main className="relative w-screen h-screen overflow-hidden">
        {/* Header */}
        <header className="absolute top-0 left-0 right-0 z-30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-600 p-2 rounded-xl">
                <MapPin size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                TürkiyeGuessr
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
                <Target size={18} className="text-yellow-400" />
                <span className="font-bold">{room.currentRound} / {room.totalRounds}</span>
              </div>
              <div className="glass rounded-xl px-4 py-2 flex items-center gap-2">
                <Trophy size={18} className="text-yellow-400" />
                <span className="font-bold">{currentPlayer?.totalScore || 0}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Street View */}
        <div 
          ref={streetViewRef} 
          className="absolute inset-0 z-0" 
          style={{ width: '100%', height: '100%', background: '#1a1a24' }}
        />

        {/* Loading Overlay */}
        {streetViewLoading && (
          <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-300">Konum yükleniyor...</p>
            </div>
          </div>
        )}

        {/* Mini Map */}
        {!isRoundEnd && !isGameOver && (
          <div className="absolute bottom-6 right-6 z-20 w-80 h-52 glass rounded-2xl overflow-hidden transition-all hover:w-[450px] hover:h-[350px]">
            <div ref={guessMapRef} className="w-full h-full pointer-events-auto" />

            {!hasGuessed && (
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <button
                  onClick={handleSubmitGuess}
                  disabled={!guessLocation}
                  className="btn-primary w-full py-3 text-sm"
                >
                  {guessLocation ? "TAHMİN ET" : "Haritaya Tıkla"}
                </button>
              </div>
            )}

            {hasGuessed && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center">
                  <Check size={40} className="text-green-400 mx-auto mb-2" />
                  <p className="text-white font-medium">Tahmin Gönderildi!</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {waitingCount > 0 ? `${waitingCount} kişi bekleniyor...` : "Sonuçlar hesaplanıyor..."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Players Status */}
        {!isRoundEnd && !isGameOver && (
          <div className="absolute bottom-6 left-6 z-20 glass rounded-xl p-3">
            <div className="flex items-center gap-2 text-sm">
              {players.map((p, i) => (
                <div
                  key={p.id}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    p.hasGuessed ? "ring-2 ring-green-400" : "opacity-50"
                  }`}
                  style={{ backgroundColor: PLAYER_COLORS[i] }}
                  title={p.name}
                >
                  {p.hasGuessed ? "✓" : p.name.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Round End Modal */}
        {isRoundEnd && (
          <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="glass rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-center mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Tur {room.currentRound} Sonuçları
              </h2>

              <div className="space-y-3 mb-6">
                {sortedResults.map((result, i) => (
                  <div
                    key={result.odlayerId}
                    className={`flex items-center gap-3 p-3 rounded-xl ${
                      i === 0 ? "bg-yellow-500/20 border border-yellow-500/50" : "bg-gray-800/50"
                    }`}
                  >
                    <span className="text-2xl font-bold w-8">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
                    <div className="flex-1">
                      <p className="font-medium">{result.playerName}</p>
                      <p className="text-sm text-gray-400">{formatDistance(result.distance)}</p>
                    </div>
                    <span className="text-xl font-bold text-yellow-400">+{result.score}</span>
                  </div>
                ))}
              </div>

              {isHost && (
                <button onClick={handleNextRound} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {room.currentRound >= room.totalRounds ? "Sonuçları Gör" : "Sonraki Tur"}
                  <ArrowRight size={18} />
                </button>
              )}

              {!isHost && (
                <p className="text-center text-gray-400">Host sonraki turu başlatacak...</p>
              )}
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {isGameOver && (
          <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="glass rounded-2xl p-6 w-full max-w-md">
              <div className="text-center mb-6">
                <div className="text-6xl mb-2">🏆</div>
                <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  Oyun Bitti!
                </h2>
              </div>

              <div className="space-y-3 mb-6">
                {finalRankings.map((player, i) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-4 rounded-xl ${
                      i === 0 ? "bg-gradient-to-r from-yellow-500/30 to-yellow-600/30 border border-yellow-500" : "bg-gray-800/50"
                    }`}
                  >
                    <span className="text-3xl font-bold w-10">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                    </span>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: PLAYER_COLORS[players.findIndex(p => p.id === player.id)] }}
                    >
                      {player.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-lg">{player.name}</p>
                    </div>
                    <span className="text-2xl font-bold text-yellow-400">{player.totalScore}</span>
                  </div>
                ))}
              </div>

              {isHost && (
                <button onClick={handleRestartGame} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                  <RotateCcw size={20} />
                  Yeni Oyun
                </button>
              )}

              {!isHost && (
                <p className="text-center text-gray-400">Host yeni oyun başlatabilir...</p>
              )}
            </div>
          </div>
        )}
      </main>
    );
  }

  return null;
}
