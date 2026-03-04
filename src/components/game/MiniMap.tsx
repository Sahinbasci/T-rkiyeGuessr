import { RefObject, useRef, useCallback, useState } from "react";
import { Maximize2, Minimize2, Check, MapPin } from "lucide-react";
import { Coordinates } from "@/types";
import { PROVINCE_CENTROIDS } from "@/data/provinceCentroids";

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
  const isTogglingRef = useRef(false);
  // GAP #4: Province selector state
  const [showProvinceSelector, setShowProvinceSelector] = useState(false);

  const triggerMapResize = useCallback(() => {
    if (typeof google !== "undefined" && guessMapRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapInstance = (guessMapRef.current as any).__gm_map;
      if (mapInstance) {
        google.maps.event.trigger(mapInstance, "resize");
      }
    }
  }, [guessMapRef]);

  // BUG-003 FIX: Simple timeout-based debounce instead of unreliable transitionend.
  const handleToggle = useCallback(() => {
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;
    setMapExpanded(!mapExpanded);
    setTimeout(() => {
      isTogglingRef.current = false;
      triggerMapResize();
    }, 350);
  }, [mapExpanded, setMapExpanded, triggerMapResize]);

  // GAP #4: Jump to province centroid on map
  const handleProvinceSelect = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const province = PROVINCE_CENTROIDS.find(p => p.name === e.target.value);
    if (!province || typeof google === "undefined" || !guessMapRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapInstance = (guessMapRef.current as any).__gm_map as google.maps.Map | undefined;
    if (mapInstance) {
      mapInstance.setCenter({ lat: province.lat, lng: province.lng });
      mapInstance.setZoom(9);
    }
    // Reset dropdown to placeholder
    e.target.value = "";
    setShowProvinceSelector(false);
  }, [guessMapRef]);

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
      className={`mini-map-container ${mapExpanded ? "expanded" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        // BUG-007: Only expand the map, do NOT let click propagate to guess map
        if (!mapExpanded) {
          setMapExpanded(true);
          setTimeout(() => triggerMapResize(), 50);
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

      {/* GAP #4: Province selector button — only visible when map is expanded and not guessed */}
      {mapExpanded && !hasGuessed && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowProvinceSelector(!showProvinceSelector);
          }}
          className="province-selector-btn"
          aria-label="İl seç"
          title="İl seç — haritayı hızlıca bir ile odakla"
        >
          <MapPin size={14} />
          <span className="hidden sm:inline ml-1 text-xs">İl Seç</span>
        </button>
      )}

      {/* GAP #4: Province dropdown */}
      {showProvinceSelector && mapExpanded && !hasGuessed && (
        <div className="province-dropdown" onClick={(e) => e.stopPropagation()}>
          <select
            onChange={handleProvinceSelect}
            defaultValue=""
            className="w-full bg-gray-900/95 text-white text-xs border border-gray-600 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
            aria-label="İl seçin"
          >
            <option value="" disabled>İl seçin...</option>
            {PROVINCE_CENTROIDS.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* B2-FIX v2: Map div — no overlays, attribution fully clickable */}
      <div ref={guessMapRef as React.RefObject<HTMLDivElement>} className="minimap-inner w-full h-full pointer-events-auto" />

      {!hasGuessed && (
        <div className="desktop-submit-btn absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
          <button
            onClick={() => {
              if (navigator.vibrate) navigator.vibrate(50);
              onSubmitGuess();
            }}
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
