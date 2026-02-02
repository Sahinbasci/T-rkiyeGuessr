/**
 * Room Lifecycle Manager
 * Zombie room'ları önlemek için otomatik cleanup sistemi
 *
 * MALIYET ÖNEMİ:
 * - Her aktif Firebase listener kaynak tüketir
 * - Zombie room'lar gereksiz bandwidth kullanır
 * - Bu sistem otomatik temizlik yaparak maliyeti düşürür
 */

import { database, ref, onValue, update, remove, get } from "@/config/firebase";
import { Room } from "@/types";
import { ROOM_LIFECYCLE, FEATURE_FLAGS } from "@/config/production";

// Aktif cleanup timer'ları
const cleanupTimers: Map<string, NodeJS.Timeout> = new Map();

// Son aktivite zamanları
const lastActivityTimes: Map<string, number> = new Map();

/**
 * Oda aktivitesini kaydet
 */
export function recordRoomActivity(roomId: string): void {
  lastActivityTimes.set(roomId, Date.now());
}

/**
 * Odanın son aktivite zamanını al
 */
export function getLastActivity(roomId: string): number {
  return lastActivityTimes.get(roomId) || 0;
}

/**
 * Oda için cleanup timer başlat
 */
export function startCleanupTimer(roomId: string, ttlMs: number, onCleanup: () => void): void {
  // Önceki timer varsa iptal et
  stopCleanupTimer(roomId);

  const timer = setTimeout(() => {
    if (FEATURE_FLAGS.ENABLE_DEBUG_LOGS) {
      console.log(`Room cleanup triggered: ${roomId}`);
    }
    onCleanup();
    cleanupTimers.delete(roomId);
  }, ttlMs);

  cleanupTimers.set(roomId, timer);
}

/**
 * Cleanup timer'ı durdur
 */
export function stopCleanupTimer(roomId: string): void {
  const timer = cleanupTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    cleanupTimers.delete(roomId);
  }
}

/**
 * Boş oda kontrolü ve otomatik silme
 */
export async function checkAndCleanupEmptyRoom(roomId: string): Promise<boolean> {
  try {
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return true; // Zaten silinmiş
    }

    const room = snapshot.val() as Room;
    const playerCount = Object.keys(room.players || {}).length;

    if (playerCount === 0) {
      await remove(roomRef);
      if (FEATURE_FLAGS.ENABLE_DEBUG_LOGS) {
        console.log(`Empty room deleted: ${roomId}`);
      }
      return true;
    }

    return false;
  } catch (error) {
    console.error("Room cleanup error:", error);
    return false;
  }
}

/**
 * Tamamlanmış oyun cleanup'ı
 */
export async function cleanupFinishedGame(roomId: string): Promise<void> {
  startCleanupTimer(
    roomId,
    ROOM_LIFECYCLE.FINISHED_GAME_TTL_MS,
    async () => {
      try {
        const roomRef = ref(database, `rooms/${roomId}`);
        await remove(roomRef);
        if (FEATURE_FLAGS.ENABLE_DEBUG_LOGS) {
          console.log(`Finished game room deleted: ${roomId}`);
        }
      } catch (error) {
        console.error("Finished game cleanup error:", error);
      }
    }
  );
}

/**
 * İnaktif oyuncu tespiti ve işaretleme
 */
export async function checkInactivePlayers(roomId: string): Promise<string[]> {
  try {
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return [];
    }

    const room = snapshot.val() as Room;
    const now = Date.now();
    const inactivePlayers: string[] = [];

    // Her oyuncunun son aktivitesini kontrol et
    for (const [playerId, player] of Object.entries(room.players || {})) {
      const lastActivity = getLastActivity(`${roomId}_${playerId}`);

      // Son aktivite çok eskiyse veya hiç kaydedilmemişse
      if (lastActivity > 0 && now - lastActivity > ROOM_LIFECYCLE.PLAYER_INACTIVE_TIMEOUT_MS) {
        inactivePlayers.push(playerId);
      }
    }

    return inactivePlayers;
  } catch (error) {
    console.error("Inactive player check error:", error);
    return [];
  }
}

/**
 * Oyuncu aktivitesini kaydet
 */
export function recordPlayerActivity(roomId: string, playerId: string): void {
  lastActivityTimes.set(`${roomId}_${playerId}`, Date.now());
}

/**
 * Oda silindiğinde cleanup
 */
export function cleanupRoomData(roomId: string): void {
  stopCleanupTimer(roomId);
  lastActivityTimes.delete(roomId);

  // Tüm oyuncu aktivite kayıtlarını temizle
  const keysToDelete: string[] = [];
  lastActivityTimes.forEach((_, key) => {
    if (key.startsWith(`${roomId}_`)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => lastActivityTimes.delete(key));
}

/**
 * Tüm cleanup'ları temizle (unmount için)
 */
export function clearAllCleanups(): void {
  cleanupTimers.forEach((timer) => clearTimeout(timer));
  cleanupTimers.clear();
  lastActivityTimes.clear();
}

/**
 * Oda durumuna göre uygun cleanup başlat
 */
export function setupRoomCleanup(room: Room): void {
  if (!room?.id) return;

  // Önceki cleanup'ı iptal et
  stopCleanupTimer(room.id);

  const playerCount = Object.keys(room.players || {}).length;

  if (playerCount === 0) {
    // Boş oda - kısa sürede sil
    startCleanupTimer(
      room.id,
      ROOM_LIFECYCLE.EMPTY_ROOM_TTL_MS,
      () => checkAndCleanupEmptyRoom(room.id)
    );
  } else if (room.status === "gameOver") {
    // Oyun bitti - uzun sürede sil
    cleanupFinishedGame(room.id);
  }

  // Aktiviteyi kaydet
  recordRoomActivity(room.id);
}
