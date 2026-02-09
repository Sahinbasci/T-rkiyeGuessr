import { RefObject } from "react";
import { Maximize2, Minimize2, Check } from "lucide-react";
import { Coordinates } from "@/types";

interface MiniMapProps {
  guessMapRef: RefObject<HTMLDivElement | null>;
  mapExpanded: boolean;
  setMapExpanded: (expanded: boolean) => void;
  hasGuessed: boolean;
  guessLocation: Coordinates | null;
  guessedCount: number;
  waitingCount: number;
  playerCount: number;
  onSubmitGuess: () => void;
}

export function MiniMap({
  guessMapRef,
  mapExpanded,
  setMapExpanded,
  hasGuessed,
  guessLocation,
  guessedCount,
  waitingCount,
  playerCount,
  onSubmitGuess,
}: MiniMapProps) {
  return (
    <div
      className={`mini-map-container ${mapExpanded ? "expanded" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        !mapExpanded && setMapExpanded(true);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setMapExpanded(!mapExpanded);
        }}
        className="map-expand-btn"
        aria-label={mapExpanded ? "Haritayı küçült" : "Haritayı büyüt"}
        aria-expanded={mapExpanded}
      >
        {mapExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
      </button>

      <div ref={guessMapRef as React.RefObject<HTMLDivElement>} className="w-full h-full pointer-events-auto" />

      {!hasGuessed && (
        <div className="desktop-submit-btn absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
          <button
            onClick={onSubmitGuess}
            disabled={!guessLocation}
            className="btn-primary w-full py-3 text-sm font-bold"
          >
            {guessLocation ? "📍 TAHMİN ET" : "Haritaya Tıkla"}
          </button>
        </div>
      )}

      {hasGuessed && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check size={32} className="text-white" />
            </div>
            <p className="text-white font-bold text-lg">Tahmin Gönderildi!</p>
            <p className="text-gray-300 text-sm mt-2">
              {waitingCount > 0
                ? `${guessedCount}/${playerCount} oyuncu tahmin etti`
                : "Sonuçlar hesaplanıyor..."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
