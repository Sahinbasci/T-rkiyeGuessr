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

export function useStreetView() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hareket limiti sistemi - TOPLAM hareket sayısı (yön fark etmez)
  const [movesUsed, setMovesUsed] = useState(0);
  const [moveLimit, setMoveLimitState] = useState(3);
  const [isMovementLocked, setIsMovementLocked] = useState(false);
  const [showBudgetWarning, setShowBudgetWarning] = useState(false);

  // Hareket sayısını ref olarak da tut (listener içinde güncel değere erişim için)
  const movesUsedRef = useRef(0);
  const moveLimitRef = useRef(3);

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

  // KAMERA GÖĞE BAKMA BUG FIX: Pano değişimi sırasında aktif drag'i takip et
  const isPanoChangingRef = useRef<boolean>(false);
  const pendingPitchResetRef = useRef<boolean>(false);

  // iPhone FIX: Touch event sırasında pitch kilitlenmesi
  const isTouchActiveRef = useRef<boolean>(false);
  const lastValidPitchRef = useRef<number>(0);
  const pitchResetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
   * Hareket hakkı ayarla (yeni round başlangıcı)
   */
  const setMoves = useCallback((limit: number) => {
    setMoveLimitState(limit);
    moveLimitRef.current = limit;
    setMovesUsed(0);
    movesUsedRef.current = 0;
    setIsMovementLocked(false);
    setShowBudgetWarning(false);
  }, []);

  /**
   * Hareket sayısını ve cache'i sıfırla (yeni round)
   */
  const resetMoves = useCallback(() => {
    setMovesUsed(0);
    movesUsedRef.current = 0;
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
      // Pano değişimi flag'ini set et - pitch drift'i önlemek için
      isPanoChangingRef.current = true;

      // Doğrudan setPano kullan - API çağrısı YAPMAZ
      panoramaRef.current.setPano(startPanoIdRef.current);
      panoramaRef.current.setPov({
        heading: startHeadingRef.current,
        pitch: 0, // ZORLA 0
      });
      lastPanoIdRef.current = startPanoIdRef.current;
      lastHeadingRef.current = startHeadingRef.current;

      // Flag'i resetle
      setTimeout(() => {
        isPanoChangingRef.current = false;
      }, 100);
      // NOT: Başlangıca dönünce hareket hakları SIFIRLANMAZ
      // Kullanıcı toplam 3 hak kullanabilir, başlangıca dönse bile
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

      // Mobil cihaz tespiti
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      const streetViewOptions: google.maps.StreetViewPanoramaOptions = {
        pano: panoId,
        pov: { heading, pitch: 0 },
        addressControl: false,
        fullscreenControl: false,
        enableCloseButton: false,
        showRoadLabels: false,
        zoomControl: true,
        panControl: isMobile, // Mobilde pan kontrolü göster
        linksControl: true,
        // MOBİL İÇİN KRİTİK: Motion tracking KAPALI olmalı
        // Bu özellik açık olduğunda cihaz gyroscope ile hareket ediyor
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

      // ============================================
      // KAMERA GÖĞE BAKMA BUG FIX
      // ============================================
      // Problem: Pano değişirken pitch rastgele değerlere kayıyor
      // Çözüm: Her pano değişiminde pitch'i 0'a zorla resetle
      // ============================================

      // Hareket dinleyicisi - TOPLAM HAREKET SAYISI (yön fark etmez)
      panoramaRef.current.addListener("pano_changed", () => {
        if (!panoramaRef.current) return;

        const currentPanoId = panoramaRef.current.getPano();
        const currentPov = panoramaRef.current.getPov();

        // Aynı panoda kalınmışsa (sadece kamera döndürme)
        if (currentPanoId === lastPanoIdRef.current) {
          lastHeadingRef.current = currentPov.heading || 0;
          return;
        }

        // ============================================
        // KRİTİK FIX: Pano değiştiğinde PITCH'i ZORLA RESETLE
        // ============================================
        // Bu, "göğe bakma" bug'ını çözer
        // Heading korunur, sadece pitch 0'a alınır
        isPanoChangingRef.current = true;
        pendingPitchResetRef.current = true;

        // Pitch'i 0'a resetle - heading'i koru
        const safeHeading = currentPov.heading || lastHeadingRef.current || 0;

        // requestAnimationFrame ile bir sonraki frame'de resetle
        // Bu, Google Maps'in kendi POV güncellemesini bekler
        requestAnimationFrame(() => {
          if (panoramaRef.current && pendingPitchResetRef.current) {
            panoramaRef.current.setPov({
              heading: safeHeading,
              pitch: 0, // ZORLA 0'a al
            });
            pendingPitchResetRef.current = false;
          }
          // Kısa bir gecikme sonra flag'i kapat
          setTimeout(() => {
            isPanoChangingRef.current = false;
          }, 100);
        });

        // Başlangıca dönüş - her zaman serbest, bütçe tüketmez
        if (currentPanoId === startPanoIdRef.current) {
          lastPanoIdRef.current = currentPanoId;
          lastHeadingRef.current = safeHeading;
          return;
        }

        // CACHE KONTROLÜ: Bu pano daha önce ziyaret edilmiş mi?
        const isPanoVisited = visitedPanosRef.current.has(currentPanoId);

        if (isPanoVisited) {
          // Daha önce görülmüş pano - BÜTÇE TÜKETMEZ
          lastPanoIdRef.current = currentPanoId;
          lastHeadingRef.current = safeHeading;
          return;
        }

        // YENİ PANO - Hareket limiti kontrolü yap (TOPLAM hareket)
        const currentMoves = movesUsedRef.current;
        const limit = moveLimitRef.current;

        // Hareket limiti aşıldı mı?
        if (currentMoves >= limit) {
          console.log("Hareket limiti aşıldı - geri dönülüyor");
          if (panoramaRef.current && lastPanoIdRef.current) {
            isPanoChangingRef.current = true;
            panoramaRef.current.setPano(lastPanoIdRef.current);
            panoramaRef.current.setPov({
              heading: lastHeadingRef.current,
              pitch: 0,
            });
            setTimeout(() => {
              isPanoChangingRef.current = false;
            }, 100);
          }
          setIsMovementLocked(true);
          return;
        }

        // YENİ HAREKET İZİN VERİLDİ
        const newMoveCount = currentMoves + 1;
        movesUsedRef.current = newMoveCount;
        setMovesUsed(newMoveCount);

        // Pano'yu cache'e ekle
        visitedPanosRef.current.add(currentPanoId);

        // Pozisyonu güncelle
        lastPanoIdRef.current = currentPanoId;
        lastHeadingRef.current = safeHeading;

        // Uyarı kontrolü
        if (limit - newMoveCount <= BUDGET_WARNING_THRESHOLD) {
          setShowBudgetWarning(true);
        }

        if (newMoveCount >= limit) {
          setIsMovementLocked(true);
        }

        console.log(`Hareket: ${newMoveCount}/${limit}`);
      });

      // ============================================
      // POV DEĞİŞİM DİNLEYİCİSİ - iPhone pitch bug fix
      // ============================================
      // Problem: iPhone'da ekrana dokunulduğunda pitch aniden -90'a (gökyüzü) atlıyor
      // Çözüm: Ani pitch değişimlerini tespit edip önceki değere geri al
      panoramaRef.current.addListener("pov_changed", () => {
        if (!panoramaRef.current) return;

        const currentPov = panoramaRef.current.getPov();

        // Pano değişimi sırasında pitch drift'ini önle
        if (isPanoChangingRef.current) {
          if (Math.abs(currentPov.pitch) > 45) {
            panoramaRef.current.setPov({
              heading: currentPov.heading,
              pitch: 0,
            });
          }
          return;
        }

        // ============================================
        // iPHONE BUG FIX: Ani pitch sıçramalarını tespit et ve düzelt
        // Normal kullanımda pitch yavaş yavaş değişir (drag ile)
        // Bug durumunda pitch aniden -90'a veya +90'a atlıyor
        // ============================================
        const pitchDelta = Math.abs(currentPov.pitch - lastValidPitchRef.current);

        // Ani sıçrama tespiti: 25+ derece ani değişim VE pitch çok yüksek/düşük = bug
        const isAbnormalJump = pitchDelta > 25 && (currentPov.pitch < -70 || currentPov.pitch > 70);

        if (isAbnormalJump) {
          console.warn("iPhone pitch bug detected:", currentPov.pitch, "-> reverting to:", lastValidPitchRef.current);
          panoramaRef.current.setPov({
            heading: currentPov.heading,
            pitch: lastValidPitchRef.current,
          });
          return;
        }

        // Geçerli pitch'i kaydet
        lastValidPitchRef.current = currentPov.pitch;
      });

      // ============================================
      // iPHONE TAP-TO-GO PITCH BUG FIX
      // ============================================
      // Problem: iPhone'da ileri gitmek için tıklayınca pitch de değişiyor
      // Her tıklamada pitch biraz daha artıyor ve sonunda gökyüzüne bakıyor
      // Çözüm: Kısa dokunuşlarda (tap) pitch değişimini tamamen engelle
      const container = streetViewRef.current;
      if (container) {
        let touchStartPitch = 0;
        let touchStartTime = 0;
        let touchStartHeading = 0;
        let isSingleTouch = false;

        const handleTouchStart = (e: TouchEvent) => {
          isTouchActiveRef.current = true;
          touchStartTime = Date.now();
          isSingleTouch = e.touches.length === 1; // Tek parmak = tap veya pan

          // Touch başında mevcut POV'u kaydet
          if (panoramaRef.current) {
            const pov = panoramaRef.current.getPov();
            touchStartPitch = pov.pitch || 0;
            touchStartHeading = pov.heading || 0;
          }

          // Önceki timeout'u temizle
          if (pitchResetTimeoutRef.current) {
            clearTimeout(pitchResetTimeoutRef.current);
          }
        };

        const handleTouchEnd = (e: TouchEvent) => {
          const touchDuration = Date.now() - touchStartTime;

          // Touch bittikten hemen sonra kontrol et
          pitchResetTimeoutRef.current = setTimeout(() => {
            isTouchActiveRef.current = false;

            if (panoramaRef.current && isSingleTouch) {
              const currentPov = panoramaRef.current.getPov();
              const pitchChange = Math.abs(currentPov.pitch - touchStartPitch);
              const headingChange = Math.abs(currentPov.heading - touchStartHeading);

              // KISA DOKUNUŞ (TAP) = ileri gitme amaçlı
              // Tap sırasında pitch değişmemeli, sadece pano değişmeli
              // 400ms altı = tap, heading de fazla değişmemiş = kullanıcı sürüklemedi
              const isTap = touchDuration < 400 && headingChange < 30;

              if (isTap && pitchChange > 5) {
                // Tap sırasında pitch değişmiş = BUG!
                // Pitch'i eski haline getir
                console.log("iPhone tap bug fix: pitch changed during tap", currentPov.pitch, "->", touchStartPitch);
                panoramaRef.current.setPov({
                  heading: currentPov.heading, // Heading'i koru (pano değişmiş olabilir)
                  pitch: touchStartPitch,      // Pitch'i eski haline getir
                });
                lastValidPitchRef.current = touchStartPitch;
              }
            }
          }, 50);
        };

        const handleTouchMove = (e: TouchEvent) => {
          // Çoklu parmak = pinch/zoom, tek parmak değil
          if (e.touches.length > 1) {
            isSingleTouch = false;
          }
        };

        container.addEventListener("touchstart", handleTouchStart, { passive: true });
        container.addEventListener("touchmove", handleTouchMove, { passive: true });
        container.addEventListener("touchend", handleTouchEnd, { passive: true });
      }
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
    // Cache bilgisi (debug için)
    visitedPanoCount: visitedPanosRef.current.size,
  };
}
