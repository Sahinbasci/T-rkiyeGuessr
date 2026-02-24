export interface Coordinates {
  lat: number;
  lng: number;
}

// ==================== PANO PAKETİ ====================
// Firestore'dan gelen küratörlü pano dokümanı
export interface PanoData {
  panoId: string;
  lat: number;
  lng: number;
  heading: number;
}

export interface PanoPackage {
  id: string; // Firestore doc ID
  mode: "urban" | "geo";
  region: "marmara" | "ege" | "akdeniz" | "karadeniz" | "ic_anadolu" | "dogu_anadolu" | "guneydogu";
  roadType: "urban_street" | "highway" | "rural" | "village";
  hintTags: string[]; // ["signage", "exit", "tunnel", "viaduct", "mountain", "coast"]
  qualityScore: number; // 1-5
  blacklist: boolean;
  pano0: PanoData; // Merkez başlangıç
  pano1: PanoData; // Sol kol
  pano2: PanoData; // Sağ kol
  pano3: PanoData; // İleri kol
  locationName: string; // İl, İlçe
}

// ==================== OYUN MODLARI ====================
export type GameMode = "urban" | "geo";

export const GAME_MODE_CONFIG = {
  urban: {
    name: "Urban / Yerleşim",
    description: "Tabela, işletme adı, plaka ile bul",
    timeLimit: 90, // saniye
    moveLimit: 3, // dal hakkı
    icon: "🏙️",
  },
  geo: {
    name: "Geo / Coğrafya",
    description: "Bitki örtüsü, topoğrafya ile bul",
    timeLimit: 120, // saniye
    moveLimit: 4, // dal hakkı
    icon: "🏔️",
  },
} as const;

// ==================== PLAYER ====================
export type PlayerStatus = 'online' | 'offline' | 'disconnected';

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  totalScore: number;
  currentGuess: Coordinates | null;
  hasGuessed: boolean;
  roundScores: number[];
  // Server-side move enforcement
  movesUsed: number;             // Round başına kullanılan hareket (Firebase transaction ile artırılır)

  // Presence & Rejoin için yeni alanlar
  status: PlayerStatus;
  lastSeen: number;              // Server timestamp - son heartbeat
  disconnectedAt: number | null; // Disconnect zamanı (rejoin için)
  sessionToken: string;          // Stable identity - rejoin için
  joinedAt: number;              // Host migration için (en eski = yeni host)
}

// ==================== ROOM ====================
export interface Room {
  id: string;
  hostId: string;
  status: "waiting" | "playing" | "roundEnd" | "gameOver";
  currentRound: number;
  totalRounds: number;
  players: { [key: string]: Player };

  // Oyun modu
  gameMode: GameMode;
  timeLimit: number; // saniye
  moveLimit: number; // dal hakkı

  // Pano paketi
  currentPanoPackageId: string | null; // Firestore doc ID
  currentPanoPackage: PanoPackage | null; // Tam pano verisi
  currentLocation: Coordinates | null; // pano0 koordinatı (guess hesabı için)
  currentLocationName: string | null;

  // Round sonuçları
  roundResults: RoundResult[] | null;

  // Timer
  roundStartTime: number | null; // timestamp

  // Round State Machine - Disconnect handling için
  roundState: 'waiting' | 'active' | 'ending' | 'ended';
  roundVersion: number;             // Optimistic concurrency control
  gameInstanceId?: string;          // BUG-006 FIX: Unique per game session — stale listener guard
  activePlayerCount: number;        // Round başında snapshot
  expectedGuesses: number;          // Round başında online oyuncu sayısı
  currentGuesses: number;           // Atomic counter - kaç kişi guess yaptı
}

export interface RoundResult {
  playerId: string;
  playerName: string;
  guess: Coordinates;
  distance: number;
  score: number;
}

// ==================== SABİTLER ====================
export const TURKEY_BOUNDS = {
  north: 42.0,
  south: 36.0,
  east: 45.0,
  west: 26.0,
} as const;

export const SCORING = {
  maxScore: 5000,
  maxDistance: 500,
} as const;

// Reklam frekans limiti (ms)
export const AD_FREQUENCY_LIMIT = 10 * 60 * 1000; // 10 dakika
