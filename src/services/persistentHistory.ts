/**
 * Persistent Anti-Repeat History Module
 *
 * Stores location fingerprints across sessions to prevent repeats between days.
 *
 * Storage backends:
 * - Solo play: localStorage ring buffer (N=200)
 * - Multiplayer: Firebase room history (host-only, N=200 per room)
 *
 * Fingerprint format:
 * - panoId: string
 * - locationHash: string (3 decimals ~111m grid)
 * - province: string
 * - clusterId: string (province + grid cell)
 * - timestamp: number (for age-based eviction if needed)
 */

// ==================== TYPES ====================

export interface LocationFingerprint {
  panoId: string;
  locationHash: string;
  province: string;
  clusterId: string;
  timestamp: number;
}

export interface PersistentHistoryState {
  fingerprints: LocationFingerprint[];
  version: number;  // For migration
}

// ==================== CONSTANTS ====================

const HISTORY_WINDOW = 200;  // Ring buffer size
const STORAGE_KEY = "turkiye_guesser_history_v1";
const HISTORY_VERSION = 1;

// ==================== IN-MEMORY STATE ====================

let inMemoryHistory: LocationFingerprint[] = [];
let isInitialized = false;

// ==================== LOCAL STORAGE BACKEND ====================

/**
 * Load history from localStorage.
 * Returns empty array if not available (SSR, privacy mode, etc.)
 */
function loadFromLocalStorage(): LocationFingerprint[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed: PersistentHistoryState = JSON.parse(raw);
    if (parsed.version !== HISTORY_VERSION) {
      // Version mismatch — clear and start fresh
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    return parsed.fingerprints || [];
  } catch {
    return [];
  }
}

/**
 * Save history to localStorage.
 */
function saveToLocalStorage(fingerprints: LocationFingerprint[]): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    const state: PersistentHistoryState = {
      fingerprints: fingerprints.slice(-HISTORY_WINDOW),
      version: HISTORY_VERSION,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — silent fail
  }
}

// ==================== FIREBASE BACKEND ====================

/**
 * Load history from Firebase room.
 * This is called by the host when a multiplayer room starts.
 * The room path: rooms/{roomId}/locationHistory
 */
export async function loadFromFirebase(roomId: string): Promise<LocationFingerprint[]> {
  if (typeof window === "undefined") return [];

  try {
    // Dynamic import to avoid SSR issues
    const { getDatabase, ref, get } = await import("firebase/database");
    const db = getDatabase();
    const historyRef = ref(db, `rooms/${roomId}/locationHistory`);
    const snapshot = await get(historyRef);

    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    if (Array.isArray(data)) {
      return data as LocationFingerprint[];
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Save history to Firebase room.
 * Host-only operation — called after each round.
 */
export async function saveToFirebase(
  roomId: string,
  fingerprints: LocationFingerprint[]
): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const { getDatabase, ref, set } = await import("firebase/database");
    const db = getDatabase();
    const historyRef = ref(db, `rooms/${roomId}/locationHistory`);
    await set(historyRef, fingerprints.slice(-HISTORY_WINDOW));
  } catch {
    // Firebase unavailable — silent fail
  }
}

// ==================== PUBLIC API ====================

/**
 * Initialize persistent history.
 * - Solo mode: loads from localStorage
 * - Multiplayer: loads from Firebase (if roomId provided)
 *
 * Must be called before any check/record operations.
 */
export async function initPersistentHistory(roomId?: string): Promise<void> {
  if (roomId) {
    inMemoryHistory = await loadFromFirebase(roomId);
  } else {
    inMemoryHistory = loadFromLocalStorage();
  }
  isInitialized = true;
}

/**
 * Initialize with an explicit fingerprint array (for testing).
 */
export function initPersistentHistoryFromArray(fingerprints: LocationFingerprint[]): void {
  inMemoryHistory = [...fingerprints];
  isInitialized = true;
}

/**
 * Check if a panoId has been seen in persistent history (last N=200).
 */
export function isPanoIdInHistory(panoId: string): boolean {
  return inMemoryHistory.some(fp => fp.panoId === panoId);
}

/**
 * Check if a locationHash has been seen in persistent history (last N=200).
 */
export function isLocationHashInHistory(locationHash: string): boolean {
  return inMemoryHistory.some(fp => fp.locationHash === locationHash);
}

/**
 * Check if a location passes persistent anti-repeat checks.
 * Returns rejection reason or null if passes.
 */
export function checkPersistentHistory(
  panoId: string,
  locationHash: string
): string | null {
  if (!isInitialized) return null; // Not initialized — skip checks

  if (isPanoIdInHistory(panoId)) {
    return "persistent_panoId";
  }
  if (isLocationHashInHistory(locationHash)) {
    return "persistent_locationHash";
  }

  return null;
}

/**
 * Record a location in persistent history.
 * Saves to both in-memory and appropriate backend.
 */
export function recordPersistentLocation(
  fingerprint: LocationFingerprint,
  roomId?: string
): void {
  inMemoryHistory.push(fingerprint);

  // Trim to window size
  while (inMemoryHistory.length > HISTORY_WINDOW) {
    inMemoryHistory.shift();
  }

  // Persist
  if (roomId) {
    // Async save to Firebase — fire and forget
    saveToFirebase(roomId, inMemoryHistory).catch(() => {});
  } else {
    saveToLocalStorage(inMemoryHistory);
  }
}

/**
 * Get current persistent history length.
 */
export function getPersistentHistoryLength(): number {
  return inMemoryHistory.length;
}

/**
 * Get a readonly copy of the persistent history (for testing/debugging).
 */
export function getPersistentHistory(): readonly LocationFingerprint[] {
  return [...inMemoryHistory];
}

/**
 * Clear all persistent history (both in-memory and storage).
 */
export function clearPersistentHistory(roomId?: string): void {
  inMemoryHistory = [];
  isInitialized = false;

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  if (roomId) {
    saveToFirebase(roomId, []).catch(() => {});
  }
}

/**
 * Reset persistent history to uninitialized state.
 * Does NOT clear storage — just resets in-memory state.
 * Use for testing.
 */
export function resetPersistentHistoryState(): void {
  inMemoryHistory = [];
  isInitialized = false;
}

// ==================== EXPORTS FOR TESTING ====================

export const _testExports = {
  HISTORY_WINDOW,
  STORAGE_KEY,
  getInMemoryHistory: () => inMemoryHistory,
  setInMemoryHistory: (h: LocationFingerprint[]) => { inMemoryHistory = h; },
  getIsInitialized: () => isInitialized,
  setIsInitialized: (v: boolean) => { isInitialized = v; },
};
