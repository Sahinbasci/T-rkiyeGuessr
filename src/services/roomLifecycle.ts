/**
 * Room Lifecycle Manager
 * Zombie room'ları önlemek için otomatik cleanup sistemi
 */

import { database, ref, remove, get } from "@/config/firebase";
import { Room } from "@/types";
import { ROOM_LIFECYCLE, FEATURE_FLAGS } from "@/config/production";

// Aktif cleanup timer'ları
const cleanupTimers: Map<string, NodeJS.Timeout> = new Map();

// Son aktivite zamanları
const lastActivityTimes: Map<string, number> = new Map();

function recordRoomActivity(roomId: string): void {
  lastActivityTimes.set(roomId, Date.now());
}

function startCleanupTimer(roomId: string, ttlMs: number, onCleanup: () => void): void {
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

function stopCleanupTimer(roomId: string): void {
  const timer = cleanupTimers.get(roomId);
  if (timer) {
    clearTimeout(timer);
    cleanupTimers.delete(roomId);
  }
}

async function checkAndCleanupEmptyRoom(roomId: string): Promise<boolean> {
  try {
    const roomRef = ref(database, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
      return true;
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

function cleanupFinishedGame(roomId: string): void {
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

  const keysToDelete: string[] = [];
  lastActivityTimes.forEach((_, key) => {
    if (key.startsWith(`${roomId}_`)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((key) => lastActivityTimes.delete(key));
}

/**
 * Oda durumuna göre uygun cleanup başlat
 */
export function setupRoomCleanup(room: Room): void {
  if (!room?.id) return;

  stopCleanupTimer(room.id);

  const playerCount = Object.keys(room.players || {}).length;

  if (playerCount === 0) {
    startCleanupTimer(
      room.id,
      ROOM_LIFECYCLE.EMPTY_ROOM_TTL_MS,
      () => checkAndCleanupEmptyRoom(room.id)
    );
  } else if (room.status === "gameOver") {
    cleanupFinishedGame(room.id);
  }

  recordRoomActivity(room.id);
}
