import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock navigator
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
  },
});

// Mock Google Maps
(global as any).google = {
  maps: {
    StreetViewPanorama: vi.fn(),
    StreetViewService: vi.fn(),
    Map: vi.fn(),
    Marker: vi.fn(),
    event: {
      clearInstanceListeners: vi.fn(),
    },
    geometry: {
      spherical: {
        computeDistanceBetween: vi.fn(() => 1000),
      },
    },
    LatLng: vi.fn((lat, lng) => ({ lat: () => lat, lng: () => lng })),
  },
};

// Mock Firebase
vi.mock('@/config/firebase', () => ({
  database: {},
  ref: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  onValue: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  onDisconnect: vi.fn(() => ({ remove: vi.fn(), cancel: vi.fn() })),
  runTransaction: vi.fn(() => Promise.resolve({ committed: true, snapshot: { val: () => 1 } })),
  serverTimestamp: vi.fn(() => ({ '.sv': 'timestamp' })),
  push: vi.fn(),
}));
