import { MapPin, Timer, Target, Trophy, Footprints, AlertTriangle } from "lucide-react";
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
  const isUrgent = timeRemaining <= 10;
  const isAlmostUp = timeRemaining <= 2;

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

        {/* BUG-011: header-stats class enables flex-wrap on mobile */}
        <div className="flex items-center gap-2 header-stats">
          {!isRoundEnd && !isGameOver && (
            <div
              className={`stat-badge ${isUrgent ? "countdown-critical" : ""}`}
              role="timer"
              aria-live={isUrgent ? "assertive" : "off"}
              aria-label={`Kalan süre: ${formattedTime}`}
              aria-atomic="true"
            >
              {/* BUG-017: Non-color cue for low time */}
              {isUrgent ? (
                <AlertTriangle size={14} className="text-red-400 animate-pulse" aria-hidden="true" />
              ) : (
                <Timer size={14} className="text-blue-400" aria-hidden="true" />
              )}
              <span className={`font-mono ${isUrgent ? "text-red-400" : "text-white"}`}>
                {formattedTime}
              </span>
              {/* BUG-017: Text cue visible at <= 2s */}
              {isAlmostUp && (
                <span className="text-red-400 text-xs font-bold ml-1">Acil!</span>
              )}
            </div>
          )}

          <div className="stat-badge" aria-label={`Tur ${room.currentRound}/${room.totalRounds}`}>
            <Target size={14} className="text-yellow-400" aria-hidden="true" />
            <span>{room.currentRound}/{room.totalRounds}</span>
          </div>

          {/* BUG-011: Score always visible (even on mobile) */}
          <div className="stat-badge" aria-live="polite" aria-label={`Puan: ${currentPlayer?.totalScore || 0}`}>
            <Trophy size={14} className="text-yellow-400" aria-hidden="true" />
            <span>{currentPlayer?.totalScore || 0}</span>
          </div>

          {/* BUG-011: Moves always visible (even on mobile) */}
          {!isRoundEnd && !isGameOver && (
            <div
              className={`stat-badge ${movesRemaining <= 1 ? "bg-orange-500/20 border-orange-500/50" : ""}`}
              aria-label={`Hareket: ${movesRemaining}/${room?.moveLimit || 3}`}
            >
              <Footprints size={14} className={movesRemaining <= 1 ? "text-orange-400" : "text-green-400"} aria-hidden="true" />
              <span className={movesRemaining <= 1 ? "text-orange-400" : ""}>
                {movesRemaining}/{room?.moveLimit || 3}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* BUG-013: Aria-live region for round transitions */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isRoundEnd && `Tur ${room.currentRound} bitti.`}
        {isGameOver && "Oyun bitti!"}
      </div>
    </header>
  );
}
