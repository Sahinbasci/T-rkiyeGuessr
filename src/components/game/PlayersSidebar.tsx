import { Home } from "lucide-react";
import { Player } from "@/types";
import { PLAYER_COLORS } from "@/constants/playerColors";

interface PlayersSidebarProps {
  players: Player[];
  returnToStart: () => void;
}

export function PlayersSidebar({ players, returnToStart }: PlayersSidebarProps) {
  return (
    <div className="players-sidebar">
      <button
        onClick={returnToStart}
        className="glass rounded-xl p-2.5 sm:p-3 flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95 mb-2 touch-target"
        title="Başlangıca Dön"
        aria-label="Başlangıç noktasına dön"
      >
        <Home size={16} className="sm:w-[18px] sm:h-[18px] text-blue-400" />
        <span className="text-xs text-gray-300 hidden sm:inline">Başlangıç</span>
      </button>

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
  );
}
