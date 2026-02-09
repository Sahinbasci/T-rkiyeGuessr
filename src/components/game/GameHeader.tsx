import { MapPin, Timer, Target, Trophy, Footprints } from "lucide-react";
import { Room, Player } from "@/types";

interface GameHeaderProps {
  room: Room;
  currentPlayer: Player | null;
  timeRemaining: number;
  formattedTime: string;
  movesRemaining: number;
  isRoundEnd: boolean;
  isGameOver: boolean;
}

export function GameHeader({
  room,
  currentPlayer,
  timeRemaining,
  formattedTime,
  movesRemaining,
  isRoundEnd,
  isGameOver,
}: GameHeaderProps) {
  return (
    <header className="game-header">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <MapPin size={16} className="text-white" />
          </div>
          <span className="text-base font-bold hidden sm:block" style={{ fontFamily: "var(--font-display)" }}>
            TürkiyeGuessr
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isRoundEnd && !isGameOver && (
            <div
              className={`stat-badge ${timeRemaining <= 10 ? "countdown-critical" : ""}`}
              aria-live={timeRemaining <= 10 ? "assertive" : "off"}
              aria-label={`Kalan süre: ${formattedTime}`}
            >
              <Timer size={14} className={timeRemaining <= 10 ? "text-red-400" : "text-blue-400"} />
              <span className={`font-mono ${timeRemaining <= 10 ? "text-red-400" : "text-white"}`}>
                {formattedTime}
              </span>
            </div>
          )}

          <div className="stat-badge">
            <Target size={14} className="text-yellow-400" />
            <span>{room.currentRound}/{room.totalRounds}</span>
          </div>

          <div className="stat-badge">
            <Trophy size={14} className="text-yellow-400" />
            <span>{currentPlayer?.totalScore || 0}</span>
          </div>

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
  );
}
