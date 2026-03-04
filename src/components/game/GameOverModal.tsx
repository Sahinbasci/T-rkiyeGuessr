import { RotateCcw, LogOut } from "lucide-react";
import { Player } from "@/types";
import { PLAYER_COLORS } from "@/constants/playerColors";
import { AdSlot } from "@/components/ads/AdSlot";
import { AD_SLOTS } from "@/config/ads";

interface GameOverModalProps {
  players: Player[];
  playerId: string;
  isHost: boolean;
  onRestart: () => void;
  onReturnToLobby: () => void;
  onLeave: () => void;
  isTransitioning?: boolean;
}

export function GameOverModal({ players, playerId, isHost, onRestart: _onRestart, onReturnToLobby, onLeave, isTransitioning }: GameOverModalProps) {
  const finalRankings = [...players].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Oyun Bitti">
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

        {/* Ad — game over banner */}
        <div className="mb-4">
          <AdSlot slot={AD_SLOTS.inContent} format="horizontal" roomStatus="gameOver" />
        </div>

        {isHost ? (
          <div className="space-y-2">
            {/* P1+P2 FIX: Primary action is "Lobiye Dön" (return to lobby).
                Preserves room, resets game state. Works for both single & multiplayer. */}
            <button
              onClick={onReturnToLobby}
              disabled={!!isTransitioning}
              className="btn-primary w-full py-3.5 sm:py-4 flex items-center justify-center gap-2 text-base"
              aria-busy={!!isTransitioning}
            >
              {isTransitioning ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <RotateCcw size={20} />
              )}
              {isTransitioning ? "Lobiye dönülüyor..." : "Lobiye Dön"}
            </button>
            <button
              onClick={onLeave}
              disabled={!!isTransitioning}
              className="w-full py-2 text-gray-400 hover:text-white transition text-sm flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
            >
              <LogOut size={14} />
              Odadan Ayrıl
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-center py-3">
            <div className="inline-flex items-center gap-2 text-gray-400">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-sm">Host yeni oyun başlatabilir</span>
            </div>
            <button
              onClick={onLeave}
              disabled={!!isTransitioning}
              className="w-full py-2 text-gray-400 hover:text-white transition text-sm flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
            >
              <LogOut size={14} />
              Odadan Ayrıl
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
