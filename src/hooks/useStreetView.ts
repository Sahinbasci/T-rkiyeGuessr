"use client";

/**
 * useStreetView Hook
 * Street View yönetimi - Normal gezinti AMA sınırlı hareket hakkı
 */

import { useState, useCallback, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Coordinates, PanoPackage } from "@/types";
import { GOOGLE_MAPS_API_KEY } from "@/config/maps";
import { generateRandomCoordinates, isLikelyInTurkey, getLocationName } from "@/utils";

const MAX_ATTEMPTS = 50;

let globalLoader: Loader | null = null;
let isLoaded = false;

export function useStreetView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [movesUsed, setMovesUsed] = useState(0);
  const [moveLimit, setMoveLimit] = useState(4);
  const [isMovementLocked, setIsMovementLocked] = useState(false);

  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const streetViewServiceRef = useRef<google.maps.StreetViewService | null>(null);

  // Ref'ler - closure sorununu çözmek için
  const movesUsedRef = useRef(0);
  const moveLimitRef = useRef(4);
  const isMovementLockedRef = useRef(false);
  const visitedPanosRef = useRef<Set<string>>(new Set());
  const startPanoIdRef = useRef<string>("");

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

  /**
   * Hareket hakkı ayarla
   */
  const setMoves = useCallback((limit: number) => {
    setMoveLimit(limit);
    moveLimitRef.current = limit;
    setMovesUsed(0);
    movesUsedRef.current = 0;
    setIsMovementLocked(false);
    isMovementLockedRef.current = false;
    visitedPanosRef.current = new Set();
  }, []);

  /**
   * Hareket sayısını sıfırla (yeni round)
   */
  const resetMoves = useCallback(() => {
    setMovesUsed(0);
    movesUsedRef.current = 0;
    setIsMovementLocked(false);
    isMovementLockedRef.current = false;
    visitedPanosRef.current = new Set();
  }, []);

  /**
   * Street View'ı göster - Normal gezinti AMA sınırlı hareket
   */
  const showStreetView = useCallback(
    async (panoId: string, heading: number = 0) => {
      await initializeGoogleMaps();

      if (!streetViewRef.current) {
        console.log("streetViewRef is null");
        return;
      }

      // Başlangıç pano'sunu kaydet
      startPanoIdRef.current = panoId;
      visitedPanosRef.current = new Set([panoId]);

      // Street View seçenekleri - NORMAL GEZİNTİ
      const streetViewOptions: google.maps.StreetViewPanoramaOptions = {
        pano: panoId,
        pov: {
          heading: heading,
          pitch: 0,
        },
        // Kontroller
        addressControl: false,
        fullscreenControl: false,
        enableCloseButton: false,
        showRoadLabels: false,
        zoomControl: true,
        panControl: false,
        linksControl: true, // OKLAR AÇIK - Normal gezinti
        motionTracking: false,
        motionTrackingControl: false,
        clickToGo: true, // Tıklayarak ilerleme AÇIK
        disableDefaultUI: false,
        scrollwheel: true,
      };

      // Yeni panorama oluştur
      panoramaRef.current = new google.maps.StreetViewPanorama(
        streetViewRef.current,
        streetViewOptions
      );

      // Pano değişikliğini dinle - hareket hakkı kontrolü
      panoramaRef.current.addListener("pano_changed", () => {
        if (!panoramaRef.current) return;

        // Zaten kilitliyse hiçbir şey yapma
        if (isMovementLockedRef.current) {
          return;
        }

        const newPanoId = panoramaRef.current.getPano();

        // Daha önce ziyaret edilmiş mi? (geri dönüş - hak harcamaz)
        if (visitedPanosRef.current.has(newPanoId)) {
          console.log("Geri dönüş - hak harcanmadı");
          return;
        }

        // Yeni yer - hareket hakkı harca
        visitedPanosRef.current.add(newPanoId);
        movesUsedRef.current += 1;
        setMovesUsed(movesUsedRef.current);

        console.log(`Hareket: ${movesUsedRef.current}/${moveLimitRef.current}`);

        // Hareket hakkı bitti mi?
        if (movesUsedRef.current >= moveLimitRef.current) {
          console.log("Hareket hakkı bitti - kilitlendi!");
          isMovementLockedRef.current = true;
          setIsMovementLocked(true);

          // Kontrolleri kapat
          if (panoramaRef.current) {
            panoramaRef.current.setOptions({
              linksControl: false,
              clickToGo: false,
            });
          }
        }
      });
    },
    [initializeGoogleMaps]
  );

  /**
   * Pano paketinden başlangıç noktasını göster
   */
  const showPanoPackage = useCallback(
    async (panoPackage: PanoPackage) => {
      setIsLoading(true);
      try {
        // Hareket hakkını sıfırla
        resetMoves();
        await showStreetView(panoPackage.pano0.panoId, panoPackage.pano0.heading);
        setIsLoading(false);
      } catch (err) {
        setError("Konum yüklenemedi");
        setIsLoading(false);
      }
    },
    [showStreetView, resetMoves]
  );

  /**
   * Koordinattan Street View göster (eski sistem uyumluluğu)
   */
  const showStreetViewFromCoords = useCallback(
    async (coords: Coordinates) => {
      await initializeGoogleMaps();

      if (!streetViewServiceRef.current) {
        streetViewServiceRef.current = new google.maps.StreetViewService();
      }

      return new Promise<string | null>((resolve) => {
        streetViewServiceRef.current!.getPanorama(
          {
            location: { lat: coords.lat, lng: coords.lng },
            radius: 500,
            preference: google.maps.StreetViewPreference.NEAREST,
            source: google.maps.StreetViewSource.OUTDOOR,
          },
          async (data, status) => {
            if (status === google.maps.StreetViewStatus.OK && data?.location?.pano) {
              await showStreetView(data.location.pano);
              resolve(data.location.pano);
            } else {
              resolve(null);
            }
          }
        );
      });
    },
    [initializeGoogleMaps, showStreetView]
  );

  /**
   * Rastgele konum bul
   */
  const findRandomLocation = useCallback(async (): Promise<{
    coordinates: Coordinates;
    panoId: string;
    locationName: string;
  } | null> => {
    await initializeGoogleMaps();

    if (!streetViewServiceRef.current) {
      streetViewServiceRef.current = new google.maps.StreetViewService();
    }

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const randomCoord = generateRandomCoordinates();

      if (!isLikelyInTurkey(randomCoord)) continue;

      try {
        const result = await new Promise<google.maps.StreetViewPanoramaData | null>(
          (resolve) => {
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
          }
        );

        if (result?.location?.latLng) {
          const coords = {
            lat: result.location.latLng.lat(),
            lng: result.location.latLng.lng(),
          };

          if (isLikelyInTurkey(coords)) {
            const locationName = await getLocationName(coords);

            return {
              coordinates: coords,
              panoId: result.location.pano || "",
              locationName,
            };
          }
        }
      } catch (err) {
        console.log(`Attempt ${attempt + 1} failed`);
      }
    }

    return null;
  }, [initializeGoogleMaps]);

  const loadNewLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const location = await findRandomLocation();

      if (location) {
        resetMoves();
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
  }, [findRandomLocation, showStreetView, resetMoves]);

  // Kalan hareket hakkı
  const movesRemaining = moveLimit - movesUsed;

  return {
    isLoading,
    error,
    streetViewRef,
    panoramaRef,
    loadNewLocation,
    showStreetView,
    showPanoPackage,
    showStreetViewFromCoords,
    initializeGoogleMaps,
    // Hareket sistemi
    movesUsed,
    movesRemaining,
    moveLimit,
    isMovementLocked,
    setMoves,
    resetMoves,
  };
}
