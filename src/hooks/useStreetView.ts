"use client";

/**
 * useStreetView Hook
 * Street View yönetimi - Yön bazlı hareket limiti
 *
 * Her yöne (ileri, geri, sağ, sol) sadece 1 kez hareket edilebilir
 * Başlangıca dönüş her zaman serbesttir
 */

import { useState, useCallback, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Coordinates, PanoPackage } from "@/types";
import { GOOGLE_MAPS_API_KEY } from "@/config/maps";
import { generateRandomCoordinates, isLikelyInTurkey, getLocationName } from "@/utils";

const MAX_ATTEMPTS = 50;

let globalLoader: Loader | null = null;
let isLoaded = false;

// Yön tipleri
type Direction = "forward" | "backward" | "left" | "right";

export function useStreetView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hareket limiti sistemi
  const [movesUsed, setMovesUsed] = useState(0);
  const [moveLimit, setMoveLimitState] = useState(4);
  const [usedDirections, setUsedDirections] = useState<Set<Direction>>(new Set());
  const [isMovementLocked, setIsMovementLocked] = useState(false);

  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const streetViewServiceRef = useRef<google.maps.StreetViewService | null>(null);

  // Başlangıç pozisyonu (geri dönüş için)
  const startPanoIdRef = useRef<string | null>(null);
  const startHeadingRef = useRef<number>(0);
  const lastPanoIdRef = useRef<string | null>(null);
  const lastHeadingRef = useRef<number>(0);

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
   * Heading değişikliğinden yön hesapla
   */
  const calculateDirection = useCallback((oldHeading: number, newHeading: number): Direction | null => {
    // Heading farkını normalize et (-180 ile 180 arasında)
    let diff = newHeading - oldHeading;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;

    // Yön belirle (45 derecelik tolerans)
    if (Math.abs(diff) < 45) {
      return "forward";
    } else if (Math.abs(diff) > 135) {
      return "backward";
    } else if (diff > 0) {
      return "right";
    } else {
      return "left";
    }
  }, []);

  /**
   * Hareket hakkı ayarla
   */
  const setMoves = useCallback((limit: number) => {
    setMoveLimitState(limit);
    setMovesUsed(0);
    setUsedDirections(new Set());
    setIsMovementLocked(false);
  }, []);

  /**
   * Hareket sayısını sıfırla
   */
  const resetMoves = useCallback(() => {
    setMovesUsed(0);
    setUsedDirections(new Set());
    setIsMovementLocked(false);
    startPanoIdRef.current = null;
    lastPanoIdRef.current = null;
  }, []);

  /**
   * Başlangıca dön
   */
  const returnToStart = useCallback(() => {
    if (panoramaRef.current && startPanoIdRef.current) {
      panoramaRef.current.setPano(startPanoIdRef.current);
      panoramaRef.current.setPov({
        heading: startHeadingRef.current,
        pitch: 0,
      });
      lastPanoIdRef.current = startPanoIdRef.current;
      lastHeadingRef.current = startHeadingRef.current;
    }
  }, []);

  /**
   * Street View'ı göster - Yön bazlı hareket limiti
   */
  const showStreetView = useCallback(
    async (panoId: string, heading: number = 0) => {
      await initializeGoogleMaps();

      if (!streetViewRef.current) {
        console.log("streetViewRef is null");
        return;
      }

      // Başlangıç pozisyonunu kaydet
      startPanoIdRef.current = panoId;
      startHeadingRef.current = heading;
      lastPanoIdRef.current = panoId;
      lastHeadingRef.current = heading;

      // Street View seçenekleri - Hareket kontrollü
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
        linksControl: true, // Oklar açık - ama hareket kontrol edilecek
        motionTracking: false,
        motionTrackingControl: false,
        clickToGo: true, // Tıklayarak ilerleme açık - ama hareket kontrol edilecek
        disableDefaultUI: false,
        scrollwheel: true,
      };

      // Yeni panorama oluştur
      panoramaRef.current = new google.maps.StreetViewPanorama(
        streetViewRef.current,
        streetViewOptions
      );

      // Hareket dinleyicisi ekle
      panoramaRef.current.addListener("pano_changed", () => {
        if (!panoramaRef.current) return;

        const currentPanoId = panoramaRef.current.getPano();
        const currentPov = panoramaRef.current.getPov();

        // Aynı panoda kalınmışsa (sadece kamera döndürme) - izin ver
        if (currentPanoId === lastPanoIdRef.current) {
          lastHeadingRef.current = currentPov.heading || 0;
          return;
        }

        // Başlangıca dönüş - her zaman serbest
        if (currentPanoId === startPanoIdRef.current) {
          lastPanoIdRef.current = currentPanoId;
          lastHeadingRef.current = currentPov.heading || 0;
          return;
        }

        // Yön hesapla
        const direction = calculateDirection(lastHeadingRef.current, currentPov.heading || 0);

        if (direction) {
          // Bu yön daha önce kullanılmış mı?
          setUsedDirections(prev => {
            const newSet = new Set(prev);

            if (newSet.has(direction)) {
              // Bu yön zaten kullanıldı - geri al
              console.log(`${direction} yönü zaten kullanıldı, hareket engelleniyor`);
              if (panoramaRef.current && lastPanoIdRef.current) {
                panoramaRef.current.setPano(lastPanoIdRef.current);
              }
              return prev;
            }

            // Hareket limiti kontrolü
            if (newSet.size >= moveLimit) {
              // Limit aşıldı - geri al
              console.log("Hareket limiti aşıldı");
              if (panoramaRef.current && lastPanoIdRef.current) {
                panoramaRef.current.setPano(lastPanoIdRef.current);
              }
              setIsMovementLocked(true);
              return prev;
            }

            // Yeni yön - izin ver ve kaydet
            console.log(`${direction} yönüne hareket edildi`);
            newSet.add(direction);
            setMovesUsed(newSet.size);

            // Son pozisyonu güncelle
            lastPanoIdRef.current = currentPanoId;
            lastHeadingRef.current = currentPov.heading || 0;

            if (newSet.size >= moveLimit) {
              setIsMovementLocked(true);
            }

            return newSet;
          });
        } else {
          // Yön belirlenemedi - pozisyonu güncelle
          lastPanoIdRef.current = currentPanoId;
          lastHeadingRef.current = currentPov.heading || 0;
        }
      });
    },
    [initializeGoogleMaps, calculateDirection, moveLimit]
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
    returnToStart,
    usedDirections,
  };
}
