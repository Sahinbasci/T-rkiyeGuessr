"use client";

/**
 * TürkiyeGuessr - Ana Sayfa
 * Yeni kurgu: Mod seçimi, dal bazlı gezme, timer
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRoom, useStreetView, useGuessMap, useTimer } from "@/hooks";
import {
  Coordinates,
  GameMode,
  GAME_MODE_CONFIG,
  PanoPackage,
  AD_FREQUENCY_LIMIT,
} from "@/types";
import { formatDistance } from "@/utils";
import { getRandomPanoPackage, onNewGameStart, initStreetViewService } from "@/services/panoService";
import {
  MapPin,
  Users,
  Crown,
  Copy,
  Check,
  Play,
  Trophy,
  Target,
  Maximize2,
  Minimize2,
  Timer,
  ArrowRight,
  MessageCircle,
  RotateCcw,
  Footprints,
  Home,
  AlertTriangle,
  UserMinus,
  UserPlus,
  X,
  RefreshCw,
} from "lucide-react";

const PLAYER_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export default function HomePage() {
  // ==================== STATE ====================
  const [screen, setScreen] = useState<"menu" | "lobby" | "game">("menu");
  const [nameInput, setNameInput] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [selectedMode, setSelectedMode] = useState<GameMode>("urban");
  const [copied, setCopied] = useState(false);
  const [guessLocation, setGuessLocation] = useState<Coordinates | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [lastAdTime, setLastAdTime] = useState(0);

  // ==================== HOOKS ====================
  const {
    room,
    playerId,
    currentPlayer,
    isHost,
    players,
    error,
    isLoading,
    notifications,
    dismissNotification,
    createRoom,
    joinRoom,
    setGameMode,
    startGame,
    startGameWithPanoPackage,
    submitGuess,
    checkAllGuessed,
    handleTimeUp,
    nextRound,
    nextRoundWithPanoPackage,
    leaveRoom,
    restartGame,
  } = useRoom();

  const {
    isLoading: streetViewLoading,
    streetViewRef,
    loadNewLocation,
    showStreetView,
    showPanoPackage,
    initializeGoogleMaps,
    // Hareket sistemi
    setMoves,
    resetMoves,
    movesRemaining,
    movesUsed,
    isMovementLocked,
    showBudgetWarning,
    returnToStart,
    // Navigation feedback
    navigationError,
  } = useStreetView(room?.id, playerId);

  const { guessMapRef, initializeMap, resetMap } = useGuessMap(setGuessLocation);

  // Timer hook
  const {
    timeRemaining,
    formattedTime,
    isRunning: timerRunning,
    percentRemaining,
  } = useTimer({
    initialTime: room?.timeLimit || 90,
    onTimeUp: () => {
      // Süre dolduğunda otomatik tahmin gönder
      if (isHost) {
        handleTimeUp();
      }
    },
    // Server timestamp tabanlı timer - arka planda bile doğru süreyi hesaplar
    serverStartTime: room?.roundStartTime || null,
  });

  // ==================== REFS ====================
  // Round ve timer tracking (effects'lerden önce tanımlanmalı)
  const prevRoundRef = useRef<number | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  // timerStartedForRoundRef kaldırıldı — timer yönetimi useTimer hook'a devredildi

  // ==================== EFFECTS ====================

  // Oyun ekranına geçince Street View ve haritayı hazırla
  useEffect(() => {
    if (screen !== "game" || !room) return;
    if (room.status !== "playing") return;

    let cancelled = false;
    let tries = 0;

    const run = async () => {
      if (cancelled) return;

      if (!streetViewRef.current) {
        tries += 1;
        if (tries < 20) {
          setTimeout(run, 50);
        }
        return;
      }

      // ÖNCE Google Maps API'yi yükle (Player için de gerekli!)
      await initializeGoogleMaps();

      // Haritayı kur
      initializeMap();

      // Pano paketi varsa göster
      if (room.currentPanoPackage) {
        // Hareket hakkını ayarla (oda ayarlarından)
        setMoves(room.moveLimit || 3);
        await showPanoPackage(room.currentPanoPackage);
        // Timer yönetimi useTimer hook'una bırakıldı (serverStartTime tabanlı)
        // Manuel resetTimer/startTimer çağrılmaz — çift çağrı race condition yaratıyordu
      } else if (room.currentPanoPackageId) {
        // Eski sistem (geriye uyumluluk)
        setMoves(room.moveLimit || 3);
        await showStreetView(room.currentPanoPackageId);
      }
    };

    setTimeout(run, 0);

    return () => {
      cancelled = true;
    };
  }, [screen, room?.status, room?.currentRound]);

  // Round değiştiğinde state'leri sıfırla (PIN BUG FIX)
  // KRİTİK: Sadece currentRound değişikliğinde tetiklenmeli, status değişikliğinde DEĞİL
  useEffect(() => {
    // Sadece "playing" durumunda ve round gerçekten değiştiyse çalış
    if (room?.status === "playing" && room.currentRound !== prevRoundRef.current) {
      const isNewRound = prevRoundRef.current !== null; // İlk round değilse
      const wasRoundEnd = prevStatusRef.current === "roundEnd";

      prevRoundRef.current = room.currentRound;
      prevStatusRef.current = room.status;

      // Yeni round başladığında
      setGuessLocation(null);
      resetMap();
      resetMoves();
      setMoves(room.moveLimit || 3); // Oda ayarlarından hareket hakkı

      // Timer yönetimi useTimer hook'una bırakıldı (serverStartTime tabanlı)
      // useTimer, room.roundStartTime değiştiğinde otomatik olarak timer'ı başlatır
      // Manuel resetTimer/startTimer çağrılmaz — çift çağrı race condition yaratıyordu
      console.log(`Round ${room.currentRound} state reset done, timer managed by useTimer hook`);

      // Haritayı küçült
      setMapExpanded(false);
    }

    // Status değişikliğini takip et
    if (room?.status) {
      prevStatusRef.current = room.status;
    }

    // Status "waiting" olduğunda ref'leri sıfırla (yeni oyun için)
    if (room?.status === "waiting") {
      prevRoundRef.current = null;
      // Timer ref'leri useTimer hook'a devredildi
    }
  }, [room?.currentRound, room?.status, room?.timeLimit, room?.moveLimit, resetMap, resetMoves, setMoves]);

  // Lobby'ye git (oyun başladıysa)
  useEffect(() => {
    if (room?.status === "playing" || room?.status === "roundEnd") {
      setScreen("game");
    } else if (room?.status === "waiting" && screen === "game") {
      setScreen("lobby");
    }
  }, [room?.status, screen]);

  // Game ekranı için body class yönetimi (mobil scroll kontrolü)
  useEffect(() => {
    if (screen === "game") {
      document.body.classList.add("game-active");
    } else {
      document.body.classList.remove("game-active");
    }
    return () => {
      document.body.classList.remove("game-active");
    };
  }, [screen]);

  // Oda silindiğinde veya error durumunda ana menüye dön
  useEffect(() => {
    if (screen !== "menu" && !room && !isLoading) {
      // Oda silindi veya bulunamadı - ana menüye yönlendir
      setScreen("menu");
      resetMap();
      setGuessLocation(null);
      resetMoves();
      if (error) {
        setShowToast(error === "Oda silindi veya bulunamadı" ? "Oda kapatıldı" : error);
        setTimeout(() => setShowToast(null), 3000);
      }
    }
  }, [room, error, screen, isLoading]);

  // Visibility change handler - ekran kapandığında/açıldığında
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && screen === "game" && !room) {
        // Ekran açıldı ama room yok - ana menüye dön
        setScreen("menu");
        resetMap();
        setGuessLocation(null);
        resetMoves();
        setShowToast("Bağlantı koptu, yeniden bağlanın");
        setTimeout(() => setShowToast(null), 3000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [screen, room]);

  // ==================== HANDLERS ====================

  // Oda oluştur
  const handleCreateRoom = async () => {
    const roomCode = await createRoom(nameInput, selectedMode);
    if (roomCode) {
      setScreen("lobby");
    }
  };

  // Odaya katıl
  const handleJoinRoom = async () => {
    const success = await joinRoom(roomInput, nameInput);
    if (success) {
      setScreen("lobby");
    }
  };

  // Oyunu başlat
  const handleStartGame = async () => {
    if (!room) return;

    // ÖNCE Google Maps API'yi yükle
    await initializeGoogleMaps();

    // Sonra Street View servisini başlat (dinamik pano için)
    initStreetViewService();

    // Yeni oyun: kullanılmış lokasyonları sıfırla
    onNewGameStart();

    // Pano paketi al (dinamik + statik hibrit)
    const panoPackage = await getRandomPanoPackage(room.gameMode || "urban");
    if (panoPackage) {
      await startGameWithPanoPackage(panoPackage);
      setScreen("game");
    } else {
      // Fallback: eski sistem
      const location = await loadNewLocation();
      if (location) {
        await startGame(location.coordinates, location.panoId, location.locationName);
        setScreen("game");
      }
    }
  };

  // Tahmin gönder
  const handleSubmitGuess = async () => {
    if (!guessLocation) return;
    await submitGuess(guessLocation);
  };

  // Sonraki tur
  const handleNextRound = async () => {
    if (!room) return;

    // State'leri sıfırla
    resetMap();
    setGuessLocation(null);
    resetMoves();
    setMoves(room.moveLimit || 3); // Oda ayarlarından hareket hakkı

    // Yeni pano paketi al
    const panoPackage = await getRandomPanoPackage(room.gameMode || "urban");
    if (panoPackage) {
      await nextRoundWithPanoPackage(panoPackage);
    } else {
      const location = await loadNewLocation();
      if (location) {
        await nextRound(location.coordinates, location.panoId, location.locationName);
      }
    }

    // Reklam göster (frekans kontrolü ile)
    showAdIfNeeded();
  };

  // Yeni oyun
  const handleRestartGame = async () => {
    resetMap();
    setGuessLocation(null);
    resetMoves();
    await restartGame();
    setScreen("lobby");
  };

  // Odadan ayrıl ve ana menüye dön
  const handleLeaveRoom = async () => {
    await leaveRoom();
    setScreen("menu");
    resetMap();
    setGuessLocation(null);
    resetMoves();
  };

  // Kodu kopyala
  const copyRoomCode = () => {
    if (room?.id) {
      navigator.clipboard.writeText(room.id);
      setCopied(true);
      setShowToast("Kod kopyalandı!");
      setTimeout(() => {
        setCopied(false);
        setShowToast(null);
      }, 2000);
    }
  };

  // WhatsApp ile paylaş
  const shareWhatsApp = () => {
    if (room?.id) {
      const text = `🎯 TürkiyeGuessr'da bana katıl!\n\nOda Kodu: ${room.id}\n\nhttps://turkiyeguessr.xyz`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  // Reklam göster (interstitial)
  const showAdIfNeeded = () => {
    const now = Date.now();
    if (now - lastAdTime > AD_FREQUENCY_LIMIT) {
      // TODO: Google AdSense interstitial göster
      console.log("📺 Reklam gösterilecek");
      setLastAdTime(now);
    }
  };

  // ==================== RENDER ====================

  // ==================== MENU SCREEN ====================
  if (screen === "menu") {
    return (
      <main className="min-h-screen overflow-y-auto py-8 px-4 bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 mb-4 shadow-lg shadow-red-600/30">
              <MapPin size={40} className="text-white" />
            </div>
            <h1
              className="text-4xl sm:text-5xl font-bold tracking-wider"
              style={{ fontFamily: "var(--font-display)" }}
            >
              TürkiyeGuessr
            </h1>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">
              Arkadaşlarınla Türkiye'yi Keşfet!
            </p>
          </div>

          {/* Form */}
          <div className="glass rounded-2xl p-5 sm:p-6 space-y-4">
            {/* İsim Input */}
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

            {/* Mod Seçimi */}
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

            {/* Oda Oluştur Butonu */}
            <button
              onClick={handleCreateRoom}
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

            {/* Ayırıcı */}
            <div className="flex items-center gap-4 text-gray-500 py-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
              <span className="text-sm text-gray-500">veya odaya katıl</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent" />
            </div>

            {/* Oda Kodu Input */}
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

            {/* Odaya Katıl Butonu */}
            <button
              onClick={handleJoinRoom}
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

            {/* Hata Mesajı */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-center">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}
          </div>

          <p className="text-center text-gray-600 text-xs mt-4">
            Arkadaşların sana oda kodu versin veya kendi odanı oluştur!
          </p>
        </div>
      </main>
    );
  }

  // ==================== LOBBY SCREEN ====================
  if (screen === "lobby" && room) {
    const modeConfig = GAME_MODE_CONFIG[room.gameMode || "urban"];

    return (
      <main className="min-h-screen overflow-y-auto py-6 px-4 bg-gradient-to-br from-[#0a0a0f] via-[#12121a] to-[#0a0a0f]">
        <div className="w-full max-w-lg mx-auto">
          <div className="glass rounded-2xl p-5 sm:p-6">
            {/* Room Code */}
            <div
              className={`text-center mb-6 p-4 rounded-xl bg-gray-800/50 transition-all ${
                copied ? "copy-success" : ""
              }`}
            >
              <p className="text-gray-400 text-sm mb-2">Oda Kodu</p>
              <div className="flex items-center justify-center gap-3 mb-3">
                <span
                  className="text-3xl sm:text-4xl font-bold tracking-[0.3em] text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {room.id}
                </span>
              </div>

              {/* Paylaşım Butonları */}
              <div className="flex gap-2 justify-center">
                <button onClick={copyRoomCode} className="share-btn share-btn-copy flex-1 max-w-[140px]">
                  {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                  <span className="text-sm">{copied ? "Kopyalandı" : "Kopyala"}</span>
                </button>
                <button onClick={shareWhatsApp} className="share-btn share-btn-whatsapp flex-1 max-w-[140px]">
                  <MessageCircle size={18} />
                  <span className="text-sm">WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Oyun Modu */}
            <div className="mb-4 p-3 rounded-xl bg-gray-800/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{modeConfig.icon}</span>
                <div>
                  <p className="font-medium">{modeConfig.name}</p>
                  <p className="text-gray-500 text-xs">{modeConfig.description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">{modeConfig.timeLimit}sn</p>
                <p className="text-xs text-gray-500">{modeConfig.moveLimit} hareket</p>
              </div>
            </div>

            {/* Mod Değiştirme (Sadece Host) */}
            {isHost && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {(["urban", "geo"] as GameMode[]).map((mode) => {
                  const config = GAME_MODE_CONFIG[mode];
                  return (
                    <button
                      key={mode}
                      onClick={() => setGameMode(mode)}
                      className={`p-2 rounded-lg border transition-all text-sm ${
                        room.gameMode === mode
                          ? "border-red-500 bg-red-500/10"
                          : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      {config.icon} {config.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Players */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400 text-sm flex items-center gap-2">
                  <Users size={16} />
                  Oyuncular
                </p>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded-full">
                  {players.length}/8
                </span>
              </div>
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {players.map((player, i) => (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      player.id === playerId
                        ? "bg-red-500/10 border border-red-500/30"
                        : "bg-gray-800/50"
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{ backgroundColor: PLAYER_COLORS[i] }}
                    >
                      {(player.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{player.name || "Oyuncu"}</span>
                      {player.id === playerId && (
                        <span className="text-xs text-gray-400 ml-2">(Sen)</span>
                      )}
                    </div>
                    {player.isHost && (
                      <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-full">
                        <Crown size={14} className="text-yellow-400" />
                        <span className="text-xs text-yellow-400">Host</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {players.length === 1 && (
                <div className="mt-4 text-center p-4 border border-dashed border-gray-700 rounded-xl">
                  <div className="flex justify-center gap-1 mb-2">
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <p className="text-gray-500 text-sm">Oyuncu bekleniyor...</p>
                </div>
              )}
            </div>

            {/* Start Button */}
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={streetViewLoading}
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
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-3 bg-gray-800/50 px-6 py-3 rounded-xl">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                  <span className="text-gray-300">Host'un başlatması bekleniyor</span>
                </div>
              </div>
            )}

            <button
              onClick={handleLeaveRoom}
              className="w-full mt-3 py-2 text-gray-500 hover:text-red-400 transition text-sm"
            >
              Odadan Ayrıl
            </button>
          </div>
        </div>

        {showToast && <div className="toast">{showToast}</div>}
      </main>
    );
  }

  // Connection lost fallback - MUST be before game screen check
  if (screen === "game" && !room) {
    return (
      <div className="error-screen">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <RefreshCw size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Bağlantı Koptu</h2>
        <p className="text-gray-400 mb-6">Oyun odasıyla bağlantı kesildi</p>
        <button
          onClick={() => {
            setScreen("menu");
            resetMap();
            setGuessLocation(null);
            resetMoves();
          }}
          className="btn-primary"
        >
          Ana Menüye Dön
        </button>
      </div>
    );
  }

  // ==================== GAME SCREEN ====================
  if (screen === "game" && room) {
    const isRoundEnd = room.status === "roundEnd";
    const isGameOver = room.status === "gameOver";
    const hasGuessed = currentPlayer?.hasGuessed || false;
    const waitingCount = players.filter((p) => !p.hasGuessed).length;
    const guessedCount = players.filter((p) => p.hasGuessed).length;

    // Sonuçları sırala
    const sortedResults = room.roundResults
      ? [...room.roundResults].sort((a, b) => a.distance - b.distance)
      : [];

    const finalRankings = [...players].sort((a, b) => b.totalScore - a.totalScore);

    return (
      <main className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f]">
        {/* HEADER - Always visible, high z-index */}
        <header className="game-header">
          <div className="flex items-center justify-between">
            {/* Left: Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <MapPin size={16} className="text-white" />
              </div>
              <span className="text-base font-bold hidden sm:block" style={{ fontFamily: "var(--font-display)" }}>
                TürkiyeGuessr
              </span>
            </div>

            {/* Right: Stats */}
            <div className="flex items-center gap-2">
              {/* Timer - Always show during game */}
              {!isRoundEnd && !isGameOver && (
                <div className={`stat-badge ${timeRemaining <= 10 ? "countdown-critical" : ""}`}>
                  <Timer size={14} className={timeRemaining <= 10 ? "text-red-400" : "text-blue-400"} />
                  <span className={`font-mono ${timeRemaining <= 10 ? "text-red-400" : "text-white"}`}>
                    {formattedTime}
                  </span>
                </div>
              )}

              {/* Round */}
              <div className="stat-badge">
                <Target size={14} className="text-yellow-400" />
                <span>{room.currentRound}/{room.totalRounds}</span>
              </div>

              {/* Score */}
              <div className="stat-badge">
                <Trophy size={14} className="text-yellow-400" />
                <span>{currentPlayer?.totalScore || 0}</span>
              </div>

              {/* Moves - Only during game */}
              {!isRoundEnd && !isGameOver && (
                <div className={`stat-badge ${movesRemaining <= 1 ? "bg-orange-500/20 border-orange-500/50" : ""}`}>
                  <Footprints size={14} className={movesRemaining <= 1 ? "text-orange-400" : "text-green-400"} />
                  <span className={movesRemaining <= 1 ? "text-orange-400" : ""}>
                    {movesRemaining}/{room?.moveLimit || 3}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Street View */}
        <div
          ref={streetViewRef}
          className="absolute inset-0 z-0"
          style={{ width: "100%", height: "100%", background: "#1a1a24" }}
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

        {/* Navigation Error Toast */}
        {navigationError && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm animate-pulse">
              {navigationError}
            </div>
          </div>
        )}

        {/* Players Sidebar - Mobile optimized */}
        {!isRoundEnd && !isGameOver && (
          <div className="players-sidebar">
            {/* Return to Start Button */}
            <button
              onClick={returnToStart}
              className="glass rounded-xl p-2.5 sm:p-3 flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95 mb-2 touch-target"
              title="Başlangıca Dön"
            >
              <Home size={16} className="sm:w-[18px] sm:h-[18px] text-blue-400" />
              <span className="text-xs text-gray-300 hidden sm:inline">Başlangıç</span>
            </button>

            {/* Players - Compact on mobile */}
            <div className="glass rounded-xl p-2 sm:p-3">
              <p className="text-gray-400 text-[10px] sm:text-xs mb-1.5">Oyuncular</p>
              <div className="flex flex-wrap items-center gap-1">
                {players.map((p, i) => (
                  <div
                    key={p.id}
                    className={`player-badge w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                      p.hasGuessed
                        ? "guessed ring-2 ring-green-400 ring-offset-1 ring-offset-[#12121a]"
                        : "opacity-60"
                    }`}
                    style={{ backgroundColor: PLAYER_COLORS[i] }}
                    title={`${p.name || "Oyuncu"}${p.hasGuessed ? " ✓" : ""}`}
                  >
                    {(p.name || "?").charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mini Map */}
        {!isRoundEnd && !isGameOver && (
          <div
            className={`mini-map-container ${mapExpanded ? "expanded" : ""}`}
            onClick={() => !mapExpanded && setMapExpanded(true)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMapExpanded(!mapExpanded);
              }}
              className="map-expand-btn"
            >
              {mapExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            <div ref={guessMapRef} className="w-full h-full pointer-events-auto" />

            {!hasGuessed && (
              <div className="desktop-submit-btn absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                <button
                  onClick={handleSubmitGuess}
                  disabled={!guessLocation}
                  className="btn-primary w-full py-3 text-sm font-bold"
                >
                  {guessLocation ? "📍 TAHMİN ET" : "Haritaya Tıkla"}
                </button>
              </div>
            )}

            {hasGuessed && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check size={32} className="text-white" />
                  </div>
                  <p className="text-white font-bold text-lg">Tahmin Gönderildi!</p>
                  <p className="text-gray-300 text-sm mt-2">
                    {waitingCount > 0
                      ? `${guessedCount}/${players.length} oyuncu tahmin etti`
                      : "Sonuçlar hesaplanıyor..."}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile Action Bar */}
        {!isRoundEnd && !isGameOver && !hasGuessed && (
          <div className="mobile-action-bar">
            <button
              onClick={handleSubmitGuess}
              disabled={!guessLocation}
              className={`btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 ${
                guessLocation ? "" : "opacity-70"
              }`}
            >
              {guessLocation ? (
                <>
                  <MapPin size={20} />
                  TAHMİN ET
                </>
              ) : (
                "Haritadan konum seç"
              )}
            </button>
          </div>
        )}

        {/* Mobile: Tahmin gönderildi */}
        {!isRoundEnd && !isGameOver && hasGuessed && (
          <div className="mobile-action-bar">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Check size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-medium">Tahmin gönderildi</p>
                  <p className="text-gray-400 text-sm">
                    {guessedCount}/{players.length} bekleniyor
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Round End Modal - Mobile optimized bottom sheet */}
        {isRoundEnd && (
          <div className="modal-overlay">
            <div className="modal-content glass p-5 sm:p-6 w-full sm:max-w-md">
              <h2
                className="text-xl sm:text-2xl font-bold text-center mb-2"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Tur {room.currentRound} Sonuçları
              </h2>

              {room.currentLocationName && (
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/50 rounded-full px-4 py-2">
                    <MapPin size={16} className="text-green-400" />
                    <span className="text-green-300 font-medium text-sm sm:text-base">
                      {room.currentLocationName}
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2 sm:space-y-3 mb-5">
                {sortedResults.map((result, i) => (
                  <div
                    key={result.odlayerId}
                    className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl transition-all ${
                      i === 0 ? "bg-yellow-500/20 border border-yellow-500/50" : "bg-gray-800/50"
                    } ${result.odlayerId === playerId ? "ring-2 ring-red-500/50" : ""}`}
                  >
                    <span className="text-xl sm:text-2xl font-bold w-7 sm:w-8">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {result.playerName}
                        {result.odlayerId === playerId && (
                          <span className="text-gray-400 text-xs ml-1">(Sen)</span>
                        )}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        {formatDistance(result.distance)}
                      </p>
                    </div>
                    <span className="text-lg sm:text-xl font-bold text-yellow-400">
                      +{result.score}
                    </span>
                  </div>
                ))}
              </div>

              {isHost ? (
                <button
                  onClick={handleNextRound}
                  className="btn-primary w-full py-3.5 sm:py-4 flex items-center justify-center gap-2 text-base"
                >
                  {room.currentRound >= room.totalRounds ? "Sonuçları Gör" : "Sonraki Tur"}
                  <ArrowRight size={18} />
                </button>
              ) : (
                <div className="text-center py-3">
                  <div className="inline-flex items-center gap-2 text-gray-400">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <span className="text-sm">Host sonraki turu başlatacak</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Game Over Modal - Mobile optimized bottom sheet */}
        {isGameOver && (
          <div className="modal-overlay">
            <div className="modal-content glass p-5 sm:p-6 w-full sm:max-w-md">
              <div className="text-center mb-5">
                <div className="text-5xl sm:text-6xl mb-3">🏆</div>
                <h2
                  className="text-2xl sm:text-3xl font-bold"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Oyun Bitti!
                </h2>
                {finalRankings[0] && (
                  <p className="text-yellow-400 mt-2">🎉 {finalRankings[0].name} kazandı!</p>
                )}
              </div>

              <div className="space-y-2 sm:space-y-3 mb-5">
                {finalRankings.map((player, i) => {
                  const playerIndex = players.findIndex((p) => p.id === player.id);
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl transition-all ${
                        i === 0
                          ? "bg-gradient-to-r from-yellow-500/30 to-yellow-600/30 border border-yellow-500"
                          : "bg-gray-800/50"
                      } ${player.id === playerId ? "ring-2 ring-red-500/50" : ""}`}
                    >
                      <span className="text-2xl sm:text-3xl font-bold w-8 sm:w-10">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                      </span>
                      <div
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                        style={{ backgroundColor: PLAYER_COLORS[playerIndex >= 0 ? playerIndex : 0] }}
                      >
                        {(player.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-base sm:text-lg truncate">
                          {player.name || "Oyuncu"}
                          {player.id === playerId && (
                            <span className="text-gray-400 text-xs ml-1">(Sen)</span>
                          )}
                        </p>
                      </div>
                      <span className="text-xl sm:text-2xl font-bold text-yellow-400">
                        {player.totalScore}
                      </span>
                    </div>
                  );
                })}
              </div>

              {isHost ? (
                <div className="space-y-2">
                  <button
                    onClick={handleRestartGame}
                    className="btn-primary w-full py-3.5 sm:py-4 flex items-center justify-center gap-2 text-base"
                  >
                    <RotateCcw size={20} />
                    Tekrar Oyna
                  </button>
                  <button
                    onClick={handleLeaveRoom}
                    className="w-full py-2 text-gray-400 hover:text-white transition text-sm"
                  >
                    Lobiye Dön
                  </button>
                </div>
              ) : (
                <div className="text-center py-3">
                  <div className="inline-flex items-center gap-2 text-gray-400">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    <span className="text-sm">Host yeni oyun başlatabilir</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toast mesajı */}
        {showToast && <div className="toast">{showToast}</div>}

        {/* Player Notifications - positioned below header */}
        {notifications.length > 0 && (
          <div className="notification-badge flex flex-col gap-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`glass rounded-xl p-3 flex items-center gap-3 animate-slideDown ${
                  notification.type === "player_left"
                    ? "border-red-500/50 bg-red-500/10"
                    : notification.type === "player_joined"
                    ? "border-green-500/50 bg-green-500/10"
                    : notification.type === "host_changed"
                    ? "border-yellow-500/50 bg-yellow-500/10"
                    : "border-gray-500/50"
                }`}
              >
                {notification.type === "player_left" && (
                  <UserMinus size={16} className="text-red-400 flex-shrink-0" />
                )}
                {notification.type === "player_joined" && (
                  <UserPlus size={16} className="text-green-400 flex-shrink-0" />
                )}
                {notification.type === "host_changed" && (
                  <Crown size={16} className="text-yellow-400 flex-shrink-0" />
                )}
                <span className="text-sm flex-1">{notification.message}</span>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-gray-400 hover:text-white transition p-1.5 touch-target"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Budget Warning - positioned above map on mobile */}
        {showBudgetWarning && !isRoundEnd && !isGameOver && (
          <div className="warning-badge">
            <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2 bg-orange-500/20 border-orange-500/50 budget-warning">
              <AlertTriangle size={16} className="text-orange-400 flex-shrink-0" />
              <span className="text-sm text-orange-300 font-medium">Son hareket hakkın!</span>
            </div>
          </div>
        )}

        {/* Movement Locked Warning */}
        {isMovementLocked && !isRoundEnd && !isGameOver && !showBudgetWarning && (
          <div className="warning-badge">
            <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2 bg-red-500/20 border-red-500/50">
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
              <span className="text-sm text-red-300 font-medium">Hareket hakkın bitti!</span>
            </div>
          </div>
        )}
      </main>
    );
  }

  // Fallback
  return null;
}

