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
 * iOS CUSTOM NAVIGATION:
 * - clickToGo: false - Google'ın pitch bug'lı native click handling'i kapalı
 * - Custom click handler ile sadece pano değiştirme, pitch KORUNUYOR
 * - Bu yaklaşım iPhone'da "ileri giderken gökyüzüne bakma" bug'ını tamamen çözer
 */

import { useState, useCallback, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Coordinates, PanoPackage } from "@/types";
import { GOOGLE_MAPS_API_KEY } from "@/config/maps";
import { generateRandomCoordinates, isLikelyInTurkey, getLocationName } from "@/utils";

// Sabitler
const MAX_ATTEMPTS = 50;
const BUDGET_WARNING_THRESHOLD = 1;

// Custom Navigation Sabitleri
const DRAG_THRESHOLD_PX = 10; // Bu kadar piksel hareket = drag, click değil
const CLICK_COOLDOWN_MS = 300; // Double-fire önleme
const HEADING_CONFIDENCE_THRESHOLD = 60; // Derece cinsinden - bu açıdan uzak link'lere gitme

let globalLoader: Loader | null = null;
let isLoaded = false;

// Toast notification için basit state
let toastCallback: ((message: string) => void) | null = null;

export function useStreetView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navigationError, setNavigationError] = useState<string | null>(null);

  // Hareket limiti sistemi
  const [movesUsed, setMovesUsed] = useState(0);
  const [moveLimit, setMoveLimitState] = useState(3);
  const [isMovementLocked, setIsMovementLocked] = useState(false);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);

  // Ref'ler
  const movesUsedRef = useRef(0);
  const moveLimitRef = useRef(3);
  const streetViewRef = useRef<HTMLDivElement>(null);
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const streetViewServiceRef = useRef<google.maps.StreetViewService | null>(null);

  // Pozisyon tracking
  const startPanoIdRef = useRef<string | null>(null);
  const startHeadingRef = useRef<number>(0);
  const lastPanoIdRef = useRef<string | null>(null);
  const lastHeadingRef = useRef<number>(0);

  // Pano cache
  const visitedPanosRef = useRef<Set<string>>(new Set());

  // Custom navigation için ref'ler
  const pendingPitchRef = useRef<number>(0); // Pano değişimi sonrası restore edilecek pitch
  const lastClickTimeRef = useRef<number>(0); // Double-fire önleme
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null); // Drag detection

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

  const setMoves = useCallback((limit: number) => {
    setMoveLimitState(limit);
    moveLimitRef.current = limit;
    setMovesUsed(0);
    movesUsedRef.current = 0;
    setIsMovementLocked(false);
    setShowBudgetWarning(false);
  }, []);

  const resetMoves = useCallback(() => {
    setMovesUsed(0);
    movesUsedRef.current = 0;
    setIsMovementLocked(false);
    setShowBudgetWarning(false);
    startPanoIdRef.current = null;
    lastPanoIdRef.current = null;
    visitedPanosRef.current.clear();
  }, []);

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
   * Tıklama koordinatından heading hesapla
   * Container'ın merkezinden tıklama noktasına olan açıyı hesaplar
   */
  const calculateClickHeading = useCallback((
    clickX: number,
    clickY: number,
    container: HTMLElement,
    currentHeading: number
  ): number => {
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Normalize: merkeze göre koordinatlar
    const relX = clickX - rect.left - centerX;
    const relY = clickY - rect.top - centerY;

    // Açı hesapla (yukarı = 0, saat yönünde pozitif)
    // atan2 kullanarak x,y'den açı al
    // Not: Street View'da yatay FOV yaklaşık 90-100 derece
    const horizontalFOV = 90; // Yaklaşık değer
    const angleFromCenter = (relX / centerX) * (horizontalFOV / 2);

    // Mevcut heading'e ekle
    let targetHeading = currentHeading + angleFromCenter;

    // 0-360 arasına normalize et
    while (targetHeading < 0) targetHeading += 360;
    while (targetHeading >= 360) targetHeading -= 360;

    return targetHeading;
  }, []);

  /**
   * En yakın navigation link'i bul
   * Tıklama heading'ine en yakın link'i döndürür
   */
  const findNearestLink = useCallback((
    targetHeading: number,
    links: (google.maps.StreetViewLink | null)[] | null
  ): google.maps.StreetViewLink | null => {
    if (!links || links.length === 0) return null;

    let nearestLink: google.maps.StreetViewLink | null = null;
    let minDiff = Infinity;

    for (const link of links) {
      // Null check
      if (!link || !link.heading) continue;

      // Açı farkını hesapla (0-180 arası)
      let diff = Math.abs(targetHeading - link.heading);
      if (diff > 180) diff = 360 - diff;

      if (diff < minDiff) {
        minDiff = diff;
        nearestLink = link;
      }
    }

    // Confidence threshold kontrolü
    if (minDiff > HEADING_CONFIDENCE_THRESHOLD) {
      console.log(`No confident link found. Min diff: ${minDiff}°, threshold: ${HEADING_CONFIDENCE_THRESHOLD}°`);
      return null;
    }

    return nearestLink;
  }, []);

  /**
   * Custom navigation: Tıklama ile ileri gitme
   * Google'ın clickToGo'su yerine kendi implementasyonumuz
   * PITCH KORUNUYOR - bu iOS bug'ını tamamen çözer
   */
  const navigateToLink = useCallback((link: google.maps.StreetViewLink) => {
    if (!panoramaRef.current || !link.pano) return;

    // Mevcut pitch'i kaydet - pano değişimi sonrası restore edilecek
    const currentPov = panoramaRef.current.getPov();
    pendingPitchRef.current = currentPov.pitch || 0;

    // Sadece pano'yu değiştir
    // pano_changed event'i tetiklenecek ve orada pitch restore edilecek
    panoramaRef.current.setPano(link.pano);
  }, []);

  /**
   * Street View'ı göster
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
      pendingPitchRef.current = 0;

      // Başlangıç pano'sunu cache'e ekle
      visitedPanosRef.current.add(panoId);

      // Mobil cihaz tespiti
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      const streetViewOptions: google.maps.StreetViewPanoramaOptions = {
        pano: panoId,
        pov: { heading, pitch: 0 },
        addressControl: false,
        fullscreenControl: false,
        enableCloseButton: false,
        showRoadLabels: false,
        zoomControl: true,
        panControl: isMobile,
        linksControl: true, // Ok işaretleri görünsün
        motionTracking: false,
        motionTrackingControl: false,
        // KRİTİK: iOS'ta clickToGo kapalı - custom navigation kullanacağız
        // Desktop'ta da kapalı tutuyoruz tutarlılık için
        clickToGo: false,
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

      // ============================================
      // PANO_CHANGED EVENT - Hareket limiti + Pitch restore
      // ============================================
      panoramaRef.current.addListener("pano_changed", () => {
        if (!panoramaRef.current) return;

        const currentPanoId = panoramaRef.current.getPano();
        const currentPov = panoramaRef.current.getPov();

        // Aynı panoda kalınmışsa
        if (currentPanoId === lastPanoIdRef.current) {
          lastHeadingRef.current = currentPov.heading || 0;
          return;
        }

        // ============================================
        // KRİTİK: Pitch'i RESTORE ET
        // Custom navigation ile pano değiştiğinde pitch korunmalı
        // ============================================
        const targetHeading = currentPov.heading || lastHeadingRef.current || 0;
        const targetPitch = pendingPitchRef.current;

        // Pitch'i geri yükle
        requestAnimationFrame(() => {
          if (panoramaRef.current) {
            panoramaRef.current.setPov({
              heading: targetHeading,
              pitch: targetPitch,
            });
          }
        });

        // Başlangıca dönüş kontrolü
        if (currentPanoId === startPanoIdRef.current) {
          lastPanoIdRef.current = currentPanoId;
          lastHeadingRef.current = targetHeading;
          return;
        }

        // Cache kontrolü
        const isPanoVisited = visitedPanosRef.current.has(currentPanoId);
        if (isPanoVisited) {
          lastPanoIdRef.current = currentPanoId;
          lastHeadingRef.current = targetHeading;
          return;
        }

        // Hareket limiti kontrolü
        const currentMoves = movesUsedRef.current;
        const limit = moveLimitRef.current;

        if (currentMoves >= limit) {
          console.log("Hareket limiti aşıldı - geri dönülüyor");
          if (panoramaRef.current && lastPanoIdRef.current) {
            panoramaRef.current.setPano(lastPanoIdRef.current);
            panoramaRef.current.setPov({
              heading: lastHeadingRef.current,
              pitch: targetPitch,
            });
          }
          setIsMovementLocked(true);
          return;
        }

        // Yeni hareket
        const newMoveCount = currentMoves + 1;
        movesUsedRef.current = newMoveCount;
        setMovesUsed(newMoveCount);
        visitedPanosRef.current.add(currentPanoId);
        lastPanoIdRef.current = currentPanoId;
        lastHeadingRef.current = targetHeading;

        if (limit - newMoveCount <= BUDGET_WARNING_THRESHOLD) {
          setShowBudgetWarning(true);
        }

        if (newMoveCount >= limit) {
          setIsMovementLocked(true);
        }

        console.log(`Hareket: ${newMoveCount}/${limit}`);
      });

      // ============================================
      // CUSTOM CLICK NAVIGATION
      // ============================================
      const container = streetViewRef.current;

      // Pointer event handlers (touch ve mouse için birleşik)
      const handlePointerDown = (e: PointerEvent) => {
        pointerStartRef.current = { x: e.clientX, y: e.clientY };
      };

      const handlePointerUp = (e: PointerEvent) => {
        // Drag threshold kontrolü
        if (pointerStartRef.current) {
          const dx = Math.abs(e.clientX - pointerStartRef.current.x);
          const dy = Math.abs(e.clientY - pointerStartRef.current.y);
          const moved = Math.sqrt(dx * dx + dy * dy);

          if (moved > DRAG_THRESHOLD_PX) {
            // Bu bir drag, click değil - navigation yapma
            pointerStartRef.current = null;
            return;
          }
        }

        pointerStartRef.current = null;

        // Double-fire önleme (cooldown)
        const now = Date.now();
        if (now - lastClickTimeRef.current < CLICK_COOLDOWN_MS) {
          console.log("Click ignored - cooldown active");
          return;
        }
        lastClickTimeRef.current = now;

        // Hareket kilitliyse işlem yapma
        if (isMovementLocked) {
          console.log("Movement locked");
          return;
        }

        // Panorama yoksa işlem yapma
        if (!panoramaRef.current) return;

        // Mevcut POV ve link'leri al
        const currentPov = panoramaRef.current.getPov();
        const links = panoramaRef.current.getLinks();

        if (!links || links.length === 0) {
          setNavigationError("Bu yönde gidilebilecek yol yok");
          setTimeout(() => setNavigationError(null), 2000);
          return;
        }

        // Tıklama heading'ini hesapla
        const clickHeading = calculateClickHeading(
          e.clientX,
          e.clientY,
          container,
          currentPov.heading || 0
        );

        // En yakın link'i bul
        const nearestLink = findNearestLink(clickHeading, links);

        if (!nearestLink) {
          setNavigationError("Bu yönde gidilebilecek yol yok");
          setTimeout(() => setNavigationError(null), 2000);
          return;
        }

        // Navigate!
        console.log(`Navigating to link: heading=${nearestLink.heading}, pano=${nearestLink.pano}`);
        navigateToLink(nearestLink);
        setNavigationError(null);
      };

      // Event listener'ları ekle
      container.addEventListener("pointerdown", handlePointerDown);
      container.addEventListener("pointerup", handlePointerUp);

      // Cleanup için ref'e kaydet (opsiyonel - şimdilik yok)
    },
    [initializeGoogleMaps, calculateClickHeading, findNearestLink, navigateToLink, isMovementLocked]
  );

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
    navigationError, // Toast için
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
    // Cache bilgisi
    visitedPanoCount: visitedPanosRef.current.size,
  };
}
