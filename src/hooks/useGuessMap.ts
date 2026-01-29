"use client";

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

  const initializeMap = useCallback(() => {
    if (!guessMapRef.current) return;
    if (typeof google === "undefined") return;

    // RoundEnd ekranında mini map component'i unmount oluyor.
    // Google Map instance'ı eski (DOM'dan silinmiş) div'e bağlı kalırsa
    // sonraki round'da harita tıklamaları çalışmıyor / harita donuk kalıyor.
    // Bu yüzden mevcut map'in bağlı olduğu div değiştiyse yeniden oluştur.
    if (mapRef.current) {
      const currentDiv = mapRef.current.getDiv();
      if (currentDiv !== guessMapRef.current) {
        mapRef.current = null;
      } else {
        const center = getTurkeyCenter();
        mapRef.current.setCenter({ lat: center.lat, lng: center.lng });
        mapRef.current.setZoom(getTurkeyZoom());
        return;
      }
    }

    const center = getTurkeyCenter();

    mapRef.current = new google.maps.Map(guessMapRef.current, {
      ...MAPS_CONFIG.guessMapOptions,
      center: { lat: center.lat, lng: center.lng },
      zoom: getTurkeyZoom(),
      styles: MAPS_CONFIG.darkMapStyles,
      restriction: {
        latLngBounds: TURKEY_MAP_RESTRICTION,
        strictBounds: false,
      },
    });

    mapRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      const coord: Coordinates = {
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      };

      setSelectedLocation(coord);
      onLocationSelect(coord);

      if (markerRef.current) {
        markerRef.current.setPosition(e.latLng);
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
    });
  }, [onLocationSelect]);

  const resetMap = useCallback(() => {
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (mapRef.current) {
      const center = getTurkeyCenter();
      mapRef.current.setCenter({ lat: center.lat, lng: center.lng });
      mapRef.current.setZoom(getTurkeyZoom());
    }

    setSelectedLocation(null);
    onLocationSelect(null);
  }, [onLocationSelect]);

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
      markersRef.current.push(line as any);
    });

    mapRef.current.fitBounds(bounds, 50);
  }, []);

  return {
    guessMapRef,
    selectedLocation,
    initializeMap,
    resetMap,
    showResults,
    map: mapRef.current,
  };
}
