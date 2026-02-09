import { Users, Crown, Copy, Check, Play, MessageCircle } from "lucide-react";
import { Room, Player, GameMode, GAME_MODE_CONFIG } from "@/types";
import { PLAYER_COLORS } from "@/constants/playerColors";
import { Toast } from "@/components/shared/Toast";

interface LobbyScreenProps {
  room: Room;
  playerId: string;
  players: Player[];
  isHost: boolean;
  streetViewLoading: boolean;
  copied: boolean;
  showToast: string | null;
  onCopyRoomCode: () => void;
  onShareWhatsApp: () => void;
  onSetGameMode: (mode: GameMode) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export function LobbyScreen({
  room,
  playerId,
  players,
  isHost,
  streetViewLoading,
  copied,
  showToast,
  onCopyRoomCode,
  onShareWhatsApp,
  onSetGameMode,
  onStartGame,
  onLeaveRoom,
}: LobbyScreenProps) {
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

            <div className="flex gap-2 justify-center">
              <button onClick={onCopyRoomCode} className="share-btn share-btn-copy flex-1 max-w-[140px]">
                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                <span className="text-sm">{copied ? "Kopyalandı" : "Kopyala"}</span>
              </button>
              <button onClick={onShareWhatsApp} className="share-btn share-btn-whatsapp flex-1 max-w-[140px]">
                <MessageCircle size={18} />
                <span className="text-sm">WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Game Mode Info */}
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

          {/* Mode Selection (Host only) */}
          {isHost && (
            <div className="mb-4 grid grid-cols-2 gap-2">
              {(["urban", "geo"] as GameMode[]).map((mode) => {
                const config = GAME_MODE_CONFIG[mode];
                return (
                  <button
                    key={mode}
                    onClick={() => onSetGameMode(mode)}
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
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
                <p className="text-gray-500 text-sm">Oyuncu bekleniyor...</p>
              </div>
            )}
          </div>

          {/* Start / Waiting */}
          {isHost ? (
            <button
              onClick={onStartGame}
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
            onClick={onLeaveRoom}
            className="w-full mt-3 py-2 text-gray-500 hover:text-red-400 transition text-sm"
          >
            Odadan Ayrıl
          </button>
        </div>
      </div>

      <Toast message={showToast} />
    </main>
  );
}
