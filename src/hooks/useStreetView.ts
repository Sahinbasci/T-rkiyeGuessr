"use client";

/**
 * useStreetView Hook
 * Street View yönetimi - Hareket limiti ve PANO CACHING ile maliyet kontrolü
 *
 * API MALİYET AZALTMA STRATEJİSİ:
 * 1. Ziyaret edilen pano'lar cache'lenir (visitedPanosRef)
 * 2. Aynı pano'ya tekrar gidildiğinde hareket bütçesi TÜKETMEZ
 * 3. Hareket bütçesi sadece YENİ (daha önce görülmemiş) pano ziyaretinde azalır
 * 4. Başlangıca dönüş her zaman serbesttir ve bütçe tüketmez
 * 5. Pano ID ile doğrudan gösterim API çağrısı yapmaz (setPano)
 *
 * Bu yaklaşım gerçek API kullanımını azaltır çünkü:
 * - Street View GÖRÜNTÜLEME ücretsizdir (pano ID ile)
 * - Sadece getPanorama() çağrıları ücretlidir (konum arama)
 * - Kullanıcı geri dönse bile yeni API çağrısı yapılmaz
 */

import { useState, useCallback, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Coordinates, PanoPackage } from "@/types";
import { GOOGLE_MAPS_API_KEY } from "@/config/maps";
import { generateRandomCoordinates, isLikelyInTurkey, getLocationName } from "@/utils";

// Sabitler
const MAX_ATTEMPTS = 50;
const BUDGET_WARNING_THRESHOLD = 1; // Son 1 hareket kaldığında uyarı göster

let globalLoader: Loader | null = null;
let isLoaded = false;

// Yön tipleri
type Direction = "forward" | "backward" | "left" | "right";

export function useStreetView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hareket limiti sistemi
  const [movesUsed, setMovesUsed] = useState(0);
  const [moveLimit, setMoveLimitState] = useState(3);
  const [usedDirections, setUsedDirections] = useState<Set<Direction>>(new Set());
  const [isMovementLocked, setIsMovementLocked] = useState(false);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);

  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const streetViewServiceRef = useRef<google.maps.StreetViewService | null>(null);

  // Başlangıç pozisyonu (geri dönüş için)
  const startPanoIdRef = useRef<string | null>(null);
  const startHeadingRef = useRef<number>(0);
  const lastPanoIdRef = useRef<string | null>(null);
  const lastHeadingRef = useRef<number>(0);

  // PANO CACHE - Ziyaret edilen pano ID'leri (API maliyet azaltma için kritik)
  const visitedPanosRef = useRef<Set<string>>(new Set());

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
    let diff = newHeading - oldHeading;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;

    if (Math.abs(diff) < 45) return "forward";
    if (Math.abs(diff) > 135) return "backward";
    if (diff > 0) return "right";
    return "left";
  }, []);

  /**
   * Hareket hakkı ayarla (yeni round başlangıcı)
   */
  const setMoves = useCallback((limit: number) => {
    setMoveLimitState(limit);
    setMovesUsed(0);
    setUsedDirections(new Set());
    setIsMovementLocked(false);
    setShowBudgetWarning(false);
  }, []);

  /**
   * Hareket sayısını ve cache'i sıfırla (yeni round)
   */
  const resetMoves = useCallback(() => {
    setMovesUsed(0);
    setUsedDirections(new Set());
    setIsMovementLocked(false);
    setShowBudgetWarning(false);
    startPanoIdRef.current = null;
    lastPanoIdRef.current = null;
    // Cache'i temizle - yeni round için
    visitedPanosRef.current.clear();
  }, []);

  /**
   * Başlangıca dön
   * NOT: Bu işlem hareket hakkı TÜKETMEZ ve cache'deki pano'ya gider
   */
  const returnToStart = useCallback(() => {
    if (panoramaRef.current && startPanoIdRef.current) {
      // Doğrudan setPano kullan - API çağrısı YAPMAZ
      panoramaRef.current.setPano(startPanoIdRef.current);
      panoramaRef.current.setPov({
        heading: startHeadingRef.current,
        pitch: 0,
      });
      lastPanoIdRef.current = startPanoIdRef.current;
      lastHeadingRef.current = startHeadingRef.current;

      // Hareket haklarını sıfırla - tekrar keşfedilebilsin
      setUsedDirections(new Set());
      setMovesUsed(0);
      setIsMovementLocked(false);
      setShowBudgetWarning(false);
    }
  }, []);

  /**
   * Street View'ı göster - Hareket limiti ve pano caching ile
   */
  const showStreetView = useCallback(
    async (panoId: string, heading: number = 0) => {
      await initializeGoogleMaps();

      if (!streetViewRef.current) {
        console.warn("streetViewRef is null");
        return;
      }

      // Başlangıç pozisyonunu kaydet
      startPanoIdRef.current = panoId;
      startHeadingRef.current = heading;
      lastPanoIdRef.current = panoId;
      lastHeadingRef.current = heading;

      // Başlangıç pano'sunu cache'e ekle
      visitedPanosRef.current.add(panoId);

      const streetViewOptions: google.maps.StreetViewPanoramaOptions = {
        pano: panoId,
        pov: { heading, pitch: 0 },
        addressControl: false,
        fullscreenControl: false,
        enableCloseButton: false,
        showRoadLabels: false,
        zoomControl: true,
        panControl: false,
        linksControl: true,
        motionTracking: false,
        motionTrackingControl: false,
        clickToGo: true,
        disableDefaultUI: false,
        scrollwheel: true,
      };

      // Mevcut panorama varsa temizle
      if (panoramaRef.current) {
        google.maps.event.clearInstanceListeners(panoramaRef.current);
      }

      panoramaRef.current = new google.maps.StreetViewPanorama(
        streetViewRef.current,
        streetViewOptions
      );

      // Hareket dinleyicisi - PANO CACHING ile
      panoramaRef.current.addListener("pano_changed", () => {
        if (!panoramaRef.current) return;

        const currentPanoId = panoramaRef.current.getPano();
        const currentPov = panoramaRef.current.getPov();

        // Aynı panoda kalınmışsa (sadece kamera döndürme)
        if (currentPanoId === lastPanoIdRef.current) {
          lastHeadingRef.current = currentPov.heading || 0;
          return;
        }

        // Başlangıca dönüş - her zaman serbest, bütçe tüketmez
        if (currentPanoId === startPanoIdRef.current) {
          lastPanoIdRef.current = currentPanoId;
          lastHeadingRef.current = currentPov.heading || 0;
          return;
        }

        // CACHE KONTROLÜ: Bu pano daha önce ziyaret edilmiş mi?
        const isPanoVisited = visitedPanosRef.current.has(currentPanoId);

        if (isPanoVisited) {
          // Daha önce görülmüş pano - BÜTÇE TÜKETMEZ
          lastPanoIdRef.current = currentPanoId;
          lastHeadingRef.current = currentPov.heading || 0;
          return;
        }

        // YENİ PANO - Hareket limiti kontrolü yap
        const direction = calculateDirection(lastHeadingRef.current, currentPov.heading || 0);

        if (direction) {
          setUsedDirections(prev => {
            const newSet = new Set(prev);

            // Bu yön zaten kullanıldı mı?
            if (newSet.has(direction)) {
              console.log(`${direction} yönü zaten kullanıldı`);
              if (panoramaRef.current && lastPanoIdRef.current) {
                panoramaRef.current.setPano(lastPanoIdRef.current);
              }
              return prev;
            }

            // Hareket limiti aşıldı mı?
            if (newSet.size >= moveLimit) {
              console.log("Hareket limiti aşıldı");
              if (panoramaRef.current && lastPanoIdRef.current) {
                panoramaRef.current.setPano(lastPanoIdRef.current);
              }
              setIsMovementLocked(true);
              return prev;
            }

            // YENİ HAREKET İZİN VERİLDİ
            newSet.add(direction);
            setMovesUsed(newSet.size);

            // Pano'yu cache'e ekle
            visitedPanosRef.current.add(currentPanoId);

            // Pozisyonu güncelle
            lastPanoIdRef.current = currentPanoId;
            lastHeadingRef.current = currentPov.heading || 0;

            // Uyarı kontrolü
            if (moveLimit - newSet.size <= BUDGET_WARNING_THRESHOLD) {
              setShowBudgetWarning(true);
            }

            if (newSet.size >= moveLimit) {
              setIsMovementLocked(true);
            }

            return newSet;
          });
        } else {
          // Yön belirlenemedi - cache'e ekle ve pozisyonu güncelle
          visitedPanosRef.current.add(currentPanoId);
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
   * Koordinattan Street View göster
   * NOT: Bu fonksiyon getPanorama() API çağrısı yapar (ücretli)
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
   * NOT: Her deneme için getPanorama() API çağrısı yapar (ücretli)
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
        console.log(`Konum arama denemesi ${attempt + 1} başarısız`);
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
    showBudgetWarning,
    setMoves,
    resetMoves,
    returnToStart,
    usedDirections,
    // Cache bilgisi (debug için)
    visitedPanoCount: visitedPanosRef.current.size,
  };
}
