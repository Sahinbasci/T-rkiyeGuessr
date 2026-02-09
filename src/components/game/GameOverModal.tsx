import { RotateCcw } from "lucide-react";
import { Player } from "@/types";
import { PLAYER_COLORS } from "@/constants/playerColors";

interface GameOverModalProps {
  players: Player[];
  playerId: string;
  isHost: boolean;
  onRestart: () => void;
  onLeave: () => void;
}

export function GameOverModal({ players, playerId, isHost, onRestart, onLeave }: GameOverModalProps) {
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

        {isHost ? (
          <div className="space-y-2">
            <button
              onClick={onRestart}
              className="btn-primary w-full py-3.5 sm:py-4 flex items-center justify-center gap-2 text-base"
            >
              <RotateCcw size={20} />
              Tekrar Oyna
            </button>
            <button
              onClick={onLeave}
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
  );
}
