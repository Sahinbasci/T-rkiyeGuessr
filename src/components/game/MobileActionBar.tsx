import { MapPin, Check } from "lucide-react";
import { Coordinates, Player } from "@/types";

interface MobileActionBarProps {
  hasGuessed: boolean;
  guessLocation: Coordinates | null;
  guessedCount: number;
  playerCount: number;
  onSubmitGuess: () => void;
}

export function MobileActionBar({
  hasGuessed,
  guessLocation,
  guessedCount,
  playerCount,
  onSubmitGuess,
}: MobileActionBarProps) {
  if (hasGuessed) {
    return (
      <div className="mobile-action-bar">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <Check size={20} className="text-white" />
            </div>
            <div>
              <p className="text-white font-medium">Tahmin gönderildi</p>
              <p className="text-gray-400 text-sm">
                {guessedCount}/{playerCount} bekleniyor
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-action-bar">
      <button
        onClick={onSubmitGuess}
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
  );
}
