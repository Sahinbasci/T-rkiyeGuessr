import { MapPin, ArrowRight } from "lucide-react";
import { Room, RoundResult } from "@/types";
import { formatDistance } from "@/utils";

interface RoundEndModalProps {
  room: Room;
  playerId: string;
  isHost: boolean;
  sortedResults: RoundResult[];
  onNextRound: () => void;
}

export function RoundEndModal({ room, playerId, isHost, sortedResults, onNextRound }: RoundEndModalProps) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={`Tur ${room.currentRound} Sonuçları`}>
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
            onClick={onNextRound}
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
  );
}
