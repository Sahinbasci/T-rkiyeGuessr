"use client";

import { useState, useCallback, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Coordinates } from "@/types";
import { GOOGLE_MAPS_API_KEY, MAPS_CONFIG } from "@/config/maps";
import { generateRandomCoordinates, isLikelyInTurkey } from "@/utils";

const MAX_ATTEMPTS = 50;

let globalLoader: Loader | null = null;
let isLoaded = false;

export function useStreetView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const streetViewServiceRef = useRef<google.maps.StreetViewService | null>(null);

  const initializeGoogleMaps = useCallback(async () => {
    if (isLoaded) return;

    if (!globalLoader) {
      globalLoader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: "weekly",
        libraries: ["geometry"],
      });
    }

    await globalLoader.load();
    isLoaded = true;
    streetViewServiceRef.current = new google.maps.StreetViewService();
  }, []);

  const findRandomLocation = useCallback(async (): Promise<{ coordinates: Coordinates; panoId: string } | null> => {
    await initializeGoogleMaps();

    if (!streetViewServiceRef.current) {
      streetViewServiceRef.current = new google.maps.StreetViewService();
    }

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const randomCoord = generateRandomCoordinates();

      if (!isLikelyInTurkey(randomCoord)) continue;

      try {
        const result = await new Promise<google.maps.StreetViewPanoramaData | null>((resolve) => {
          streetViewServiceRef.current!.getPanorama(
            {
              location: { lat: randomCoord.lat, lng: randomCoord.lng },
              radius: 5000,
              preference: google.maps.StreetViewPreference.BEST,
              source: google.maps.StreetViewSource.OUTDOOR,
            },
            (data, status) => {
              if (status === google.maps.StreetViewStatus.OK && data) {
                resolve(data);
              } else {
                resolve(null);
              }
            }
          );
        });

        if (result?.location?.latLng) {
          const coords = {
            lat: result.location.latLng.lat(),
            lng: result.location.latLng.lng(),
          };

          if (isLikelyInTurkey(coords)) {
            return {
              coordinates: coords,
              panoId: result.location.pano || "",
            };
          }
        }
      } catch (err) {
        console.log(`Attempt ${attempt + 1} failed`);
      }
    }

    return null;
  }, [initializeGoogleMaps]);

  const showStreetView = useCallback(async (panoId: string) => {
    await initializeGoogleMaps();

    if (!streetViewRef.current) {
      console.log("streetViewRef is null");
      return;
    }

    // Her seferinde yeni panorama oluştur (eski sorunları önlemek için)
    panoramaRef.current = new google.maps.StreetViewPanorama(streetViewRef.current, {
      ...MAPS_CONFIG.streetViewOptions,
      pano: panoId,
    });

    // Bazen container ölçüsü / ilk render yüzünden siyah ekran kalabiliyor.
    // Mikro bir refresh ile panoramayı tekrar tetikle.
    setTimeout(() => {
      if (panoramaRef.current) {
        panoramaRef.current.setPano(panoId);
      }
    }, 0);
}, [initializeGoogleMaps]);

  const loadNewLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const location = await findRandomLocation();

      if (location) {
        await showStreetView(location.panoId);
        setIsLoading(false);
        return location;
      } else {
        setError("Konum bulunamadı");
        setIsLoading(false);
        return null;
      }
    } catch (err) {
      setError("Bir hata oluştu");
      setIsLoading(false);
      return null;
    }
  }, [findRandomLocation, showStreetView]);

  return {
    isLoading,
    error,
    streetViewRef,
    loadNewLocation,
    showStreetView,
    initializeGoogleMaps,
  };
}
