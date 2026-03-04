"use client";

/**
 * useGoogleMapsLoader — Google Maps JS API script loading + readiness state.
 *
 * Extracted from useStreetView.ts. Manages the global Loader singleton
 * and ensures the API is loaded exactly once per session.
 */

import { useCallback, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { GOOGLE_MAPS_API_KEY } from "@/config/maps";

let globalLoader: Loader | null = null;
let isLoaded = false;

export interface GoogleMapsLoaderResult {
  /** Ensure Google Maps API is loaded. Idempotent. */
  initializeGoogleMaps: () => Promise<void>;
  /** Ref to the StreetViewService instance (created on first init). */
  streetViewServiceRef: React.MutableRefObject<google.maps.StreetViewService | null>;
}

/**
 * Hook that manages Google Maps JS API loading.
 *
 * - Uses a module-level Loader singleton (shared across all hook instances)
 * - Creates a StreetViewService on first load
 * - Idempotent: calling initializeGoogleMaps() multiple times is safe
 */
export function useGoogleMapsLoader(): GoogleMapsLoaderResult {
  const streetViewServiceRef = useRef<google.maps.StreetViewService | null>(null);

  const initializeGoogleMaps = useCallback(async () => {
    if (isLoaded) return;

    if (!globalLoader) {
      globalLoader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: "weekly",
        // BUG-006: "marker" library loaded for future AdvancedMarkerElement migration.
        libraries: ["geometry", "marker"],
      });
    }

    await globalLoader.load();
    isLoaded = true;
    streetViewServiceRef.current = new google.maps.StreetViewService();
  }, []);

  return {
    initializeGoogleMaps,
    streetViewServiceRef,
  };
}

/**
 * Reset loader state — for testing only.
 * @internal
 */
export function _resetLoaderForTest(): void {
  globalLoader = null;
  isLoaded = false;
}
