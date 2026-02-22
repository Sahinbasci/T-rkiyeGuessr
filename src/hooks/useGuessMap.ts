"use client";

/**
 * useGuessMap Hook
 * Tahmin haritası yönetimi - Pin yerleştirme ve sonuç gösterimi
 *
 * FIX: Round 1+ pin placement bug - non-host oyuncularda pin görünmüyordu
 * Sorun: initializeMap erken return yapıyordu, listener kaybediliyordu
 */

import { useState, useCallback, useRef } from "react";
import { Coordinates } from "@/types";
import { MAPS_CONFIG, TURKEY_MAP_RESTRICTION } from "@/config/maps";
import { getTurkeyCenter, getTurkeyZoom } from "@/utils";

export function useGuessMap(onLocationSelect: (coord: Coordinates | null) => void) {
  const [selectedLocation, setSelectedLocation] = useState<Coordinates | null>(null);

  const guessMapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const onLocationSelectRef = useRef(onLocationSelect);

  // Callback'i ref'te tut - listener her zaman güncel fonksiyonu çağırır
  onLocationSelectRef.current = onLocationSelect;

  /**
   * Click handler - ayrı fonksiyon olarak tanımla (listener rebind için)
   */
  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !mapRef.current) return;

    const coord: Coordinates = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    };

    setSelectedLocation(coord);
    onLocationSelectRef.current(coord);

    // Marker güncelle veya oluştur
    if (markerRef.current) {
      markerRef.current.setPosition(e.latLng);
      markerRef.current.setMap(mapRef.current);
    } else {
      markerRef.current = new google.maps.Marker({
        position: e.latLng,
        map: mapRef.current,
        icon: {
          path: MAPS_CONFIG.markers.guess.path,
          fillColor: MAPS_CONFIG.markers.guess.fillColor,
          fillOpacity: MAPS_CONFIG.markers.guess.fillOpacity,
          strokeColor: MAPS_CONFIG.markers.guess.strokeColor,
          strokeWeight: MAPS_CONFIG.markers.guess.strokeWeight,
          scale: MAPS_CONFIG.markers.guess.scale,
          anchor: new google.maps.Point(12, 24),
        },
        animation: google.maps.Animation.DROP,
      });
    }
  }, []);

  /**
   * Harita başlat - HER ROUND'DA ÇAĞRILMALI
   * FIX: Artık listener her zaman yeniden bağlanıyor
   */
  const initializeMap = useCallback(() => {
    if (!guessMapRef.current) return;

    // Google Maps API kontrolü
    if (typeof google === "undefined" || !google.maps || !google.maps.Map) {
      console.warn("Google Maps API henüz yüklenmedi");
      return;
    }

    const center = getTurkeyCenter();

    // Map yoksa veya div değişmişse yeniden oluştur
    if (!mapRef.current || mapRef.current.getDiv() !== guessMapRef.current) {
      // Eski listener'ı temizle
      if (clickListenerRef.current) {
        google.maps.event.removeListener(clickListenerRef.current);
        clickListenerRef.current = null;
      }

      mapRef.current = new google.maps.Map(guessMapRef.current, {
        ...MAPS_CONFIG.guessMapOptions,
        center: { lat: center.lat, lng: center.lng },
        zoom: getTurkeyZoom(),
        styles: MAPS_CONFIG.darkMapStyles,
        restriction: {
          latLngBounds: TURKEY_MAP_RESTRICTION,
          strictBounds: true, // BUG-008: Strict Turkey bounds restriction
        },
      });
    }

    // KRITIK FIX: Listener'ı HER ZAMAN yeniden bağla
    // Bu, yeni round'da non-host oyuncuların pin yerleştirebilmesini sağlar
    if (clickListenerRef.current) {
      google.maps.event.removeListener(clickListenerRef.current);
    }

    clickListenerRef.current = mapRef.current.addListener("click", handleMapClick);
  }, [handleMapClick]);

  /**
   * Harita sıfırla - Yeni round için
   * Marker'ları temizle, merkeze al, listener'ı koru
   */
  const resetMap = useCallback(() => {
    // Tahmin marker'ını temizle
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }

    // Sonuç marker'larını temizle
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    // Polyline'ları temizle
    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // Map'i merkeze al
    if (mapRef.current) {
      const center = getTurkeyCenter();
      mapRef.current.setCenter({ lat: center.lat, lng: center.lng });
      mapRef.current.setZoom(getTurkeyZoom());
    }

    // State sıfırla
    setSelectedLocation(null);
    onLocationSelectRef.current(null);

    // NOT: Click listener'ı KORUYORUZ - initializeMap'te yeniden bağlanacak
  }, []);

  const showResults = useCallback((
    actualLocation: Coordinates,
    guesses: { playerName: string; guess: Coordinates; color: string }[]
  ) => {
    if (!mapRef.current) return;

    // Gerçek konum marker'ı
    const actualMarker = new google.maps.Marker({
      position: actualLocation,
      map: mapRef.current,
      icon: {
        path: MAPS_CONFIG.markers.actual.path,
        fillColor: MAPS_CONFIG.markers.actual.fillColor,
        fillOpacity: MAPS_CONFIG.markers.actual.fillOpacity,
        strokeColor: MAPS_CONFIG.markers.actual.strokeColor,
        strokeWeight: MAPS_CONFIG.markers.actual.strokeWeight,
        scale: 2,
        anchor: new google.maps.Point(12, 24),
      },
      zIndex: 1000,
      title: "Gerçek Konum",
    });
    markersRef.current.push(actualMarker);

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(actualLocation);

    // Her oyuncunun tahmini
    guesses.forEach((g) => {
      const marker = new google.maps.Marker({
        position: g.guess,
        map: mapRef.current,
        icon: {
          path: MAPS_CONFIG.markers.guess.path,
          fillColor: g.color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 1.5,
          anchor: new google.maps.Point(12, 24),
        },
        title: g.playerName,
      });
      markersRef.current.push(marker);
      bounds.extend(g.guess);

      // Çizgi
      const line = new google.maps.Polyline({
        path: [g.guess, actualLocation],
        strokeColor: g.color,
        strokeOpacity: 0.7,
        strokeWeight: 2,
        map: mapRef.current,
      });
      polylinesRef.current.push(line);
    });

    mapRef.current.fitBounds(bounds, 50);
  }, []);

  return {
    guessMapRef,
    selectedLocation,
    initializeMap,
    resetMap,
    showResults,
  };
}
