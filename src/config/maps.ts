// Google Maps API Key
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Maps configuration
export const MAPS_CONFIG = {
  darkMapStyles: [
    { elementType: "geometry", stylers: [{ color: "#1a1a24" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a24" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8a8a9a" }] },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: "#3a3a4a" }],
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#b5b5c5" }],
    },
    {
      featureType: "administrative.country",
      elementType: "geometry.stroke",
      stylers: [{ color: "#ef4444" }, { weight: 2 }],
    },
    {
      featureType: "poi",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#2a2a38" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#3a3a4a" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0e1a2a" }],
    },
  ],

  streetViewOptions: {
    addressControl: false,
    fullscreenControl: false,
    enableCloseButton: false,
    showRoadLabels: false,
    zoomControl: false,
    panControl: false,
    // CRITICAL: linksControl must be false — Google's native arrow overlays bypass
    // the custom navigation system in useStreetView.ts (move budget, rate limiting, etc.)
    // The actual StreetView is initialized in useStreetView.ts with its own options object.
    // This config serves as reference documentation only.
    linksControl: false,
    motionTracking: false,
    motionTrackingControl: false,
  },

  guessMapOptions: {
    disableDefaultUI: true,
    zoomControl: true,
    scrollwheel: true,
    gestureHandling: "greedy" as const,
    clickableIcons: false,
    minZoom: 5,
    maxZoom: 18,
  },

  markers: {
    guess: {
      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
      fillColor: "#ef4444",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      scale: 2,
    },
    actual: {
      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
      fillColor: "#22c55e",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 2,
      scale: 2,
    },
  },

  polyline: {
    strokeColor: "#fbbf24",
    strokeOpacity: 0.9,
    strokeWeight: 3,
    geodesic: true,
  },
};

export const TURKEY_MAP_RESTRICTION = {
  north: 43.0,
  south: 35.0,
  east: 46.0,
  west: 25.0,
};
