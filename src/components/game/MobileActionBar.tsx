import { MapPin, Check } from "lucide-react";
import { Coordinates } from "@/types";

interface MobileActionBarProps {
  hasGuessed: boolean;
  guessLocation: Coordinates | null;
  guessedCount: number;
  playerCount: number;
  onSubmitGuess: () => void;
  // BUG-002/004: submit state
  isTimeCritical?: boolean;
  isSubmitting?: boolean;
}

export function MobileActionBar({
  hasGuessed,
  guessLocation,
  guessedCount,
  playerCount,
  onSubmitGuess,
  isTimeCritical,
  isSubmitting,
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

  // BUG-002/004: Disable submit when time critical or submitting
  const isSubmitDisabled = !guessLocation || !!isTimeCritical || !!isSubmitting;

  let buttonLabel: React.ReactNode = "Haritadan konum seç";
  if (guessLocation && isSubmitting) {
    buttonLabel = (
      <>
        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        Gönderiliyor...
      </>
    );
  } else if (guessLocation && isTimeCritical) {
    buttonLabel = "Süre dolmak üzere!";
  } else if (guessLocation) {
    buttonLabel = (
      <>
        <MapPin size={20} />
        TAHMİN ET
      </>
    );
  }

  return (
    <div className="mobile-action-bar">
      <button
        onClick={onSubmitGuess}
        disabled={isSubmitDisabled}
        className={`btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2 ${
          guessLocation && !isSubmitDisabled ? "" : "opacity-70"
        }`}
        aria-busy={!!isSubmitting}
        aria-disabled={isSubmitDisabled}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
