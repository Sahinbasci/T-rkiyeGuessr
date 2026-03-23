import { MapPin, ArrowRight } from "lucide-react";
import { Room, RoundResult } from "@/types";
import { formatDistance } from "@/utils";
import { formatLocationName, normalizeTurkish } from "@/utils/turkishFormat";
import { AdSlot } from "@/components/ads/AdSlot";
import { AD_SLOTS } from "@/config/ads";

interface RoundEndModalProps {
  room: Room;
  playerId: string;
  isHost: boolean;
  sortedResults: RoundResult[];
  onNextRound: () => void;
  // BUG-004: Loading state for next round button
  isNextRoundLoading?: boolean;
}

export function RoundEndModal({ room, playerId, isHost, sortedResults, onNextRound, isNextRoundLoading }: RoundEndModalProps) {
  const buttonLabel = room.currentRound >= room.totalRounds ? "Sonuçları Gör" : "Sonraki Tur";

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={`Tur ${room.currentRound} Sonuçları`}>
      <div className="modal-content glass p-5 sm:p-6 w-full sm:max-w-md">
        <h2
          className="text-xl sm:text-2xl font-bold text-center mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Tur {room.currentRound} Sonuçları
        </h2>

        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/50 rounded-full px-4 py-2">
            <MapPin size={16} className="text-green-400" />
            <span className="text-green-300 font-medium text-sm sm:text-base">
              {formatLocationName(room.currentLocationName ? normalizeTurkish(room.currentLocationName) : null).formatted}
            </span>
          </div>
        </div>

        {/* BUG-012: Improved results layout for 375px */}
        <div className="space-y-2 sm:space-y-3 mb-5" aria-live="polite">
          {sortedResults.map((result, i) => (
            <div
              key={result.playerId}
              className={`flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl transition-all ${
                i === 0 ? "bg-yellow-500/20 border border-yellow-500/50" : "bg-gray-800/50"
              } ${result.playerId === playerId ? "ring-2 ring-red-500/50" : ""}`}
            >
              <span className="text-xl sm:text-2xl font-bold w-7 sm:w-8 flex-shrink-0">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm sm:text-base truncate" title={result.playerName}>
                  {result.playerName}
                  {result.playerId === playerId && (
                    <span className="text-gray-400 text-xs ml-1">(Sen)</span>
                  )}
                </p>
                <p className="text-xs sm:text-sm text-gray-400">
                  {formatDistance(result.distance)}
                </p>
              </div>
              <span className="text-lg sm:text-xl font-bold text-yellow-400 flex-shrink-0">
                +{result.score}
              </span>
            </div>
          ))}
        </div>

        {/* Ad — round end banner */}
        <div className="mb-4">
          <AdSlot slot={AD_SLOTS.inContent} format="horizontal" roomStatus="roundEnd" />
        </div>

        {isHost ? (
          <button
            onClick={onNextRound}
            disabled={!!isNextRoundLoading}
            className="btn-primary w-full py-3.5 sm:py-4 flex items-center justify-center gap-2 text-base"
            aria-busy={!!isNextRoundLoading}
          >
            {isNextRoundLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Yükleniyor...
              </>
            ) : (
              <>
                {buttonLabel}
                <ArrowRight size={18} />
              </>
            )}
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
