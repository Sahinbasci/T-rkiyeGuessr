import { RefObject, useRef, useCallback, useEffect } from "react";
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
  // BUG-002/004: submit state props
  isTimeCritical?: boolean;
  isSubmitting?: boolean;
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
  isTimeCritical,
  isSubmitting,
}: MiniMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isTogglingRef = useRef(false);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerMapResize = useCallback(() => {
    if (typeof google !== "undefined" && guessMapRef.current) {
      const mapInstance = (guessMapRef.current as any).__gm_map;
      if (mapInstance) {
        google.maps.event.trigger(mapInstance, "resize");
      }
    }
  }, [guessMapRef]);

  const finishToggle = useCallback(() => {
    isTogglingRef.current = false;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    triggerMapResize();
  }, [triggerMapResize]);

  // Listen for transitionend on the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTransitionEnd = (e: TransitionEvent) => {
      if (e.target === container) {
        finishToggle();
      }
    };

    container.addEventListener("transitionend", handleTransitionEnd);
    return () => container.removeEventListener("transitionend", handleTransitionEnd);
  }, [finishToggle]);

  const handleToggle = useCallback(() => {
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;
    setMapExpanded(!mapExpanded);

    fallbackTimerRef.current = setTimeout(() => {
      fallbackTimerRef.current = null;
      if (isTogglingRef.current) {
        finishToggle();
      }
    }, 350);
  }, [mapExpanded, setMapExpanded, finishToggle]);

  // BUG-002/004: Determine if submit should be disabled
  const isSubmitDisabled = !guessLocation || !!isTimeCritical || !!isSubmitting;

  // Submit button label
  let submitLabel = "Haritaya Tıkla";
  if (guessLocation && isSubmitting) {
    submitLabel = "Gönderiliyor...";
  } else if (guessLocation && isTimeCritical) {
    submitLabel = "Süre dolmak üzere!";
  } else if (guessLocation) {
    submitLabel = "📍 TAHMİN ET";
  }

  return (
    <div
      ref={containerRef}
      className={`mini-map-container ${mapExpanded ? "expanded" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        // BUG-007: Only expand the map, do NOT let click propagate to guess map
        if (!mapExpanded) {
          e.preventDefault();
          handleToggle();
        }
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
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
            disabled={isSubmitDisabled}
            className="btn-primary w-full py-3 text-sm font-bold"
            aria-busy={!!isSubmitting}
            aria-disabled={isSubmitDisabled}
          >
            {isSubmitting && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
            )}
            {submitLabel}
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
