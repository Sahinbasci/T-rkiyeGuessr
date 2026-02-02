/**
 * Production Configuration
 * Tüm sistem sabitleri ve limitleri tek yerde
 *
 * ÖNEMLİ: Bu değerler production için optimize edilmiştir.
 * Değiştirmeden önce maliyet etkisini hesaplayın.
 */

// ==================== RATE LIMITING ====================
export const RATE_LIMITS = {
  // Oda oluşturma: IP başına dakikada max
  ROOM_CREATION_PER_MINUTE: 3,

  // Odaya katılma: IP başına dakikada max
  ROOM_JOIN_PER_MINUTE: 10,

  // Tahmin gönderme: Oyuncu başına round'da max
  GUESS_PER_ROUND: 5,

  // API çağrısı: Oyuncu başına dakikada max
  API_CALLS_PER_MINUTE: 30,
} as const;

// ==================== ROOM LIFECYCLE ====================
export const ROOM_LIFECYCLE = {
  // Boş oda otomatik silme süresi (ms)
  EMPTY_ROOM_TTL_MS: 5 * 60 * 1000, // 5 dakika

  // Oyun bittikten sonra oda silme süresi (ms)
  FINISHED_GAME_TTL_MS: 30 * 60 * 1000, // 30 dakika

  // İnaktif oyuncu timeout (ms)
  PLAYER_INACTIVE_TIMEOUT_MS: 3 * 60 * 1000, // 3 dakika

  // Maksimum oda sayısı (abuse prevention)
  MAX_ACTIVE_ROOMS: 1000,

  // Oda başına maksimum oyuncu
  MAX_PLAYERS_PER_ROOM: 8,
} as const;

// ==================== GAME SETTINGS ====================
export const GAME_SETTINGS = {
  // Round ayarları
  MIN_ROUNDS: 1,
  MAX_ROUNDS: 10,
  DEFAULT_ROUNDS: 5,

  // Hareket limitleri
  MIN_MOVES: 1,
  MAX_MOVES: 10,
  URBAN_DEFAULT_MOVES: 3,
  GEO_DEFAULT_MOVES: 4,

  // Süre limitleri (saniye)
  MIN_TIME_LIMIT: 30,
  MAX_TIME_LIMIT: 300,
  URBAN_DEFAULT_TIME: 90,
  GEO_DEFAULT_TIME: 120,

  // Skor ayarları
  MAX_SCORE_PER_ROUND: 5000,
  MAX_DISTANCE_KM: 500,
} as const;

// ==================== API COST CONTROL ====================
export const API_COST_CONTROL = {
  // Street View API çağrısı başına tahmini maliyet (USD)
  STREET_VIEW_COST_PER_CALL: 0.007,

  // Günlük maksimum API bütçesi (USD)
  DAILY_API_BUDGET_USD: 50,

  // Günlük maksimum API çağrısı
  MAX_DAILY_API_CALLS: Math.floor(50 / 0.007), // ~7142 çağrı

  // Pano cache süresi (ms)
  PANO_CACHE_TTL_MS: 24 * 60 * 60 * 1000, // 24 saat

  // Dinamik pano üretimi denemesi
  MAX_PANO_GENERATION_ATTEMPTS: 10,
} as const;

// ==================== SECURITY ====================
export const SECURITY = {
  // Player ID uzunluk aralığı
  PLAYER_ID_MIN_LENGTH: 10,
  PLAYER_ID_MAX_LENGTH: 20,

  // Oda kodu uzunluğu
  ROOM_CODE_LENGTH: 6,

  // İsim uzunluk aralığı
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 20,

  // Türkiye koordinat sınırları (genişletilmiş)
  TURKEY_BOUNDS: {
    MIN_LAT: 35.0,
    MAX_LAT: 43.0,
    MIN_LNG: 25.0,
    MAX_LNG: 46.0,
  },
} as const;

// ==================== PERFORMANCE ====================
export const PERFORMANCE = {
  // Firebase listener debounce (ms)
  LISTENER_DEBOUNCE_MS: 100,

  // UI güncelleme throttle (ms)
  UI_UPDATE_THROTTLE_MS: 50,

  // Maksimum concurrent listener sayısı
  MAX_CONCURRENT_LISTENERS: 5,

  // Bundle size uyarı limiti (KB)
  BUNDLE_SIZE_WARNING_KB: 200,
} as const;

// ==================== FEATURE FLAGS ====================
export const FEATURE_FLAGS = {
  // Dinamik pano üretimi aktif mi
  ENABLE_DYNAMIC_PANO_GENERATION: true,

  // Debug logları aktif mi
  ENABLE_DEBUG_LOGS: process.env.NODE_ENV !== "production",

  // Analytics aktif mi
  ENABLE_ANALYTICS: process.env.NODE_ENV === "production",

  // Error reporting aktif mi
  ENABLE_ERROR_REPORTING: process.env.NODE_ENV === "production",
} as const;

// ==================== ERROR MESSAGES ====================
export const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: "Oda bulunamadı",
  ROOM_FULL: "Oda dolu (max 8 kişi)",
  GAME_ALREADY_STARTED: "Oyun zaten başlamış",
  INVALID_COORDINATES: "Geçersiz koordinatlar",
  RATE_LIMIT_EXCEEDED: "Çok fazla istek. Lütfen bekleyin.",
  CONNECTION_ERROR: "Bağlantı hatası. Tekrar deneyin.",
  PLAYER_KICKED: "Oyundan çıkarıldınız",
  SESSION_EXPIRED: "Oturum süresi doldu",
  MOVE_LIMIT_REACHED: "Hareket hakkınız bitti",
  TIME_UP: "Süre doldu",
} as const;

// ==================== VALIDATION HELPERS ====================

/**
 * Koordinatların Türkiye sınırları içinde olup olmadığını kontrol et
 */
export function isValidTurkeyCoordinate(lat: number, lng: number): boolean {
  const { MIN_LAT, MAX_LAT, MIN_LNG, MAX_LNG } = SECURITY.TURKEY_BOUNDS;
  return lat >= MIN_LAT && lat <= MAX_LAT && lng >= MIN_LNG && lng <= MAX_LNG;
}

/**
 * Oda kodunun geçerli formatda olup olmadığını kontrol et
 */
export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Player ID'nin geçerli formatda olup olmadığını kontrol et
 */
export function isValidPlayerId(id: string): boolean {
  const { PLAYER_ID_MIN_LENGTH, PLAYER_ID_MAX_LENGTH } = SECURITY;
  return (
    /^[a-z0-9]+$/.test(id) &&
    id.length >= PLAYER_ID_MIN_LENGTH &&
    id.length <= PLAYER_ID_MAX_LENGTH
  );
}

/**
 * İsmin geçerli olup olmadığını kontrol et
 */
export function isValidPlayerName(name: string): boolean {
  const { NAME_MIN_LENGTH, NAME_MAX_LENGTH } = SECURITY;
  const trimmed = name.trim();
  return trimmed.length >= NAME_MIN_LENGTH && trimmed.length <= NAME_MAX_LENGTH;
}

/**
 * Skorun geçerli aralıkta olup olmadığını kontrol et
 */
export function isValidScore(score: number): boolean {
  return score >= 0 && score <= GAME_SETTINGS.MAX_SCORE_PER_ROUND * GAME_SETTINGS.MAX_ROUNDS;
}
