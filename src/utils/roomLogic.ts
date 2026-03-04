/**
 * Room Logic — Pure Functions
 *
 * useRoom.ts'den çıkarılmış, Firebase/React bağımlılığı OLMAYAN
 * saf fonksiyonlar. Tüm multiplayer mantığı burada test edilir.
 *
 * Invariant: Hiçbir fonksiyon side-effect üretmez veya dış state'e erişmez.
 */

import {
  Player,
  Room,
  Coordinates,
  RoundResult,
} from "@/types";
import { calculateDistance, calculateScore, isLikelyInTurkey } from "@/utils";
import { isValidPlayerName, isValidTurkeyCoordinate, ROOM_LIFECYCLE } from "@/config/production";

/** Shared constant: consecutive heartbeat failures before connection is declared "lost". */
export const HEARTBEAT_FAIL_THRESHOLD = 6;

// Re-export RoundEndLock type for use in tests
export interface RoundEndLock {
  lockedBy: string;
  roundId: number;
  lockedAt: number;
}

// ==================== HOST ELECTION ====================

/**
 * Deterministic host election: en düşük joinedAt'a sahip online oyuncu seçilir.
 * Dead host hariç tutulur.
 *
 * @returns Seçilen yeni host Player, veya null (hiç online aday yoksa)
 */
export function electNewHost(
  players: Record<string, Player>,
  deadHostId: string
): Player | null {
  const candidates = Object.values(players)
    .filter(
      (p) =>
        p.id !== deadHostId &&
        (p.status === "online" || !p.status)
    )
    .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

  return candidates.length > 0 ? candidates[0] : null;
}

// ==================== ONLINE PLAYER HELPERS ====================

/**
 * Online oyuncuları filtreler.
 * status === 'online' VEYA status undefined/null olan oyuncular "online" sayılır.
 */
export function filterOnlinePlayers(
  players: Record<string, Player>
): Player[] {
  return Object.values(players).filter(
    (p) => p.status === "online" || !p.status
  );
}

/**
 * Online oyuncu sayısını döner.
 */
export function countOnlinePlayers(
  players: Record<string, Player>
): number {
  return filterOnlinePlayers(players).length;
}

/**
 * Heartbeat'e göre stale (30s+ sessiz) oyuncuları tespit eder.
 */
export function findStalePlayers(
  players: Record<string, Player>,
  now: number,
  staleThresholdMs: number = 30000
): Player[] {
  return Object.values(players).filter((p) => {
    if (p.status === "disconnected") return false; // Zaten işaretlenmiş
    const lastSeen = p.lastSeen || 0;
    return now - lastSeen > staleThresholdMs;
  });
}

// ==================== ROUND RESULTS & SCORING ====================

/**
 * Round sonu sonuçlarını hesaplar.
 * Her oyuncu için mesafe ve skor hesaplanır.
 *
 * @param players    - Round'daki oyuncular
 * @param location   - Doğru konum
 * @returns RoundResult[] — skor tablosu
 */
export function computeRoundResults(
  players: Player[],
  location: Coordinates
): RoundResult[] {
  return players
    .filter((p) => p.id && p.name)
    .map((player) => {
      const distance =
        player.currentGuess && location
          ? calculateDistance(location, player.currentGuess)
          : 9999;
      const score = player.hasGuessed ? calculateScore(distance) : 0;
      return {
        playerId: player.id,
        playerName: player.name || "Oyuncu",
        guess: player.currentGuess || { lat: 0, lng: 0 },
        distance: player.hasGuessed ? distance : 9999,
        score,
      };
    });
}

/**
 * Round sonrası oyuncu skorlarını günceller.
 * Immutable: yeni Player nesneleri döner.
 */
export function updatePlayersAfterRound(
  players: Record<string, Player>,
  results: RoundResult[]
): Record<string, Player> {
  const updated: Record<string, Player> = {};

  // Önce tüm oyuncuları kopyala
  for (const [id, player] of Object.entries(players)) {
    updated[id] = { ...player };
  }

  // Sonuçlardan skor ekle
  for (const result of results) {
    const player = updated[result.playerId];
    if (!player) continue;

    const currentRoundScores = player.roundScores || [];
    updated[result.playerId] = {
      ...player,
      totalScore: (player.totalScore || 0) + result.score,
      roundScores: [...currentRoundScores, result.score],
      hasGuessed: true,
    };
  }

  return updated;
}

// ==================== PLAYER STATE RESET ====================

/**
 * Yeni round için oyuncu state'ini sıfırlar.
 * Immutable: yeni nesne döner.
 */
export function resetPlayerForNewRound(player: Player): Player {
  return {
    ...player,
    currentGuess: null,
    hasGuessed: false,
    movesUsed: 0,
  };
}

/**
 * Tüm oyuncuları yeni round için sıfırlar.
 */
export function resetAllPlayersForNewRound(
  players: Record<string, Player>
): Record<string, Player> {
  const updated: Record<string, Player> = {};
  for (const [id, player] of Object.entries(players)) {
    updated[id] = resetPlayerForNewRound(player);
  }
  return updated;
}

// ==================== ROUND STATE VALIDATION ====================

type RoomStatus = "waiting" | "playing" | "roundEnd" | "gameOver";

interface TransitionResult {
  valid: boolean;
  reason?: string;
}

/**
 * Round durumu geçişinin geçerli olup olmadığını kontrol eder.
 *
 * Geçerli geçişler:
 *   waiting   → playing   (host only, en az 1 oyuncu)
 *   playing   → roundEnd  (host only)
 *   roundEnd  → playing   (host only, oyun bitmemişse)
 *   roundEnd  → gameOver  (host only, son round)
 *
 * Geçersiz: gameOver → * (oyun bitti, geri dönülemez)
 */
export function validateRoundTransition(
  currentStatus: RoomStatus,
  targetStatus: RoomStatus,
  actingPlayerId: string,
  hostId: string,
  currentRound?: number,
  totalRounds?: number,
  onlinePlayerCount?: number
): TransitionResult {
  // Non-host cannot transition
  if (actingPlayerId !== hostId) {
    return { valid: false, reason: "Only host can change room status" };
  }

  // gameOver is terminal
  if (currentStatus === "gameOver") {
    return { valid: false, reason: "Game is already over, no transitions allowed" };
  }

  // Same status
  if (currentStatus === targetStatus) {
    return { valid: false, reason: `Already in ${currentStatus} status` };
  }

  // Valid transitions map
  const validTransitions: Record<RoomStatus, RoomStatus[]> = {
    waiting: ["playing"],
    playing: ["roundEnd"],
    roundEnd: ["playing", "gameOver"],
    gameOver: [],
  };

  if (!validTransitions[currentStatus].includes(targetStatus)) {
    return {
      valid: false,
      reason: `Invalid transition: ${currentStatus} → ${targetStatus}`,
    };
  }

  // Specific validations
  if (currentStatus === "waiting" && targetStatus === "playing") {
    if (onlinePlayerCount !== undefined && onlinePlayerCount < 1) {
      return { valid: false, reason: "Need at least 1 player to start" };
    }
  }

  if (currentStatus === "roundEnd" && targetStatus === "gameOver") {
    if (
      currentRound !== undefined &&
      totalRounds !== undefined &&
      currentRound < totalRounds
    ) {
      return {
        valid: false,
        reason: `Cannot end game: round ${currentRound} of ${totalRounds}`,
      };
    }
  }

  if (currentStatus === "roundEnd" && targetStatus === "playing") {
    if (
      currentRound !== undefined &&
      totalRounds !== undefined &&
      currentRound >= totalRounds
    ) {
      return {
        valid: false,
        reason: `Cannot start new round: all ${totalRounds} rounds completed`,
      };
    }
  }

  return { valid: true };
}

// ==================== LOCK MANAGEMENT ====================

/**
 * roundEndLock'un stale (bayat) olup olmadığını kontrol eder.
 * Stale lock = lock sahibi crash olmuş, 10s+ geçmiş.
 */
export function isLockStale(
  lock: RoundEndLock | undefined | null,
  expectedRoundId: number,
  currentTime: number,
  staleThresholdMs: number = 10000
): boolean {
  if (!lock) return false; // Lock yok = stale değil
  if (lock.roundId !== expectedRoundId) return false; // Farklı round
  return currentTime - lock.lockedAt > staleThresholdMs;
}

/**
 * Lock'un geçerli (aktif ve bu round için) olup olmadığını kontrol eder.
 */
export function isLockActiveForRound(
  lock: RoundEndLock | undefined | null,
  roundId: number
): boolean {
  if (!lock) return false;
  return lock.roundId === roundId;
}

// ==================== DESYNC DETECTION ====================

interface DesyncResult {
  isDesynced: boolean;
  reasons: string[];
}

/**
 * İki room snapshot arasında desync olup olmadığını tespit eder.
 * Client'ın yerel state'i ile Firebase'deki state uyuşmuyorsa
 * desync var demektir.
 */
export function detectDesync(
  localRoom: Pick<Room, "status" | "currentRound" | "roundResults">,
  remoteRoom: Pick<Room, "status" | "currentRound" | "roundResults">
): DesyncResult {
  const reasons: string[] = [];

  if (localRoom.status !== remoteRoom.status) {
    reasons.push(
      `Status mismatch: local=${localRoom.status}, remote=${remoteRoom.status}`
    );
  }

  if (localRoom.currentRound !== remoteRoom.currentRound) {
    reasons.push(
      `Round mismatch: local=${localRoom.currentRound}, remote=${remoteRoom.currentRound}`
    );
  }

  // roundResults var ama local'de yok
  const localHasResults = localRoom.roundResults !== null && localRoom.roundResults !== undefined;
  const remoteHasResults = remoteRoom.roundResults !== null && remoteRoom.roundResults !== undefined;
  if (!localHasResults && remoteHasResults) {
    reasons.push("Remote has roundResults but local does not");
  }

  return {
    isDesynced: reasons.length > 0,
    reasons,
  };
}

// ==================== ROUND TIME ====================

/**
 * Round süresinin dolup dolmadığını kontrol eder.
 *
 * @param roundStartTime  - Round başlangıç zamanı (ms timestamp)
 * @param timeLimitSec    - Süre limiti (saniye)
 * @param currentTime     - Şu anki zaman (ms timestamp)
 * @param gracePeriodSec  - Ek tolerans süresi (saniye, default 0)
 */
export function hasRoundTimeExpired(
  roundStartTime: number | null | undefined,
  timeLimitSec: number,
  currentTime: number,
  gracePeriodSec: number = 0
): boolean {
  if (!roundStartTime || roundStartTime <= 0) return false;
  const deadlineMs = roundStartTime + (timeLimitSec + gracePeriodSec) * 1000;
  return currentTime >= deadlineMs;
}

/**
 * Kalan süreyi saniye cinsinden hesaplar.
 * Negatif değer dönmez, minimum 0.
 */
export function calculateTimeRemaining(
  roundStartTime: number | null | undefined,
  timeLimitSec: number,
  currentTime: number
): number {
  if (!roundStartTime || roundStartTime <= 0) return timeLimitSec;
  const elapsed = (currentTime - roundStartTime) / 1000;
  return Math.max(0, timeLimitSec - elapsed);
}

// ==================== GUESS COUNTER ====================

/**
 * Tüm online oyuncuların tahmin yapıp yapmadığını kontrol eder.
 */
export function haveAllPlayersGuessed(
  players: Record<string, Player>
): boolean {
  const online = filterOnlinePlayers(players);
  if (online.length === 0) return false;
  return online.every((p) => p.hasGuessed);
}

// ==================== ROOM JOIN VALIDATION ====================

interface JoinValidation {
  allowed: boolean;
  reason?: string;
}

/**
 * Odaya katılım kurallarını kontrol eder.
 * Rejoin değil, yeni oyuncu katılımı.
 */
export function validateRoomJoin(
  room: Room | null,
  playerName: string,
  maxPlayers: number = ROOM_LIFECYCLE.MAX_PLAYERS_PER_ROOM
): JoinValidation {
  if (!room) {
    return { allowed: false, reason: "room_not_found" };
  }

  if (!isValidPlayerName(playerName)) {
    return { allowed: false, reason: "invalid_name" };
  }

  if (room.status !== "waiting") {
    return { allowed: false, reason: "game_already_started" };
  }

  const playerCount = Object.keys(room.players || {}).length;
  if (playerCount >= maxPlayers) {
    return { allowed: false, reason: "room_full" };
  }

  return { allowed: true };
}

/**
 * SessionToken ile rejoin eşleştirmesi yapar.
 * @returns Eşleşen Player veya null
 */
export function matchRejoinPlayer(
  players: Record<string, Player> | undefined,
  sessionToken: string | null
): Player | null {
  if (!players || !sessionToken) return null;
  return Object.values(players).find(
    (p) => p.sessionToken === sessionToken
  ) || null;
}

// ==================== GUESS VALIDATION ====================

interface GuessValidation {
  accepted: boolean;
  reason: string;
}

/**
 * Tahmin gönderimi için tüm validation kontrollerini yapar.
 * 5 katmanlı guard: room, player, duplicate, coordinates, time
 */
export function validateGuessSubmission(
  room: Room | null,
  playerId: string | null,
  guess: Coordinates,
  serverNowMs: number,
  isSubmitting: boolean
): GuessValidation {
  // Guard 1: Room/player check
  if (!room || !playerId) {
    return { accepted: false, reason: "no_room" };
  }

  // Guard 2: Double-submit
  if (isSubmitting) {
    return { accepted: false, reason: "in_flight" };
  }

  // Guard 3: Already guessed
  const currentPlayer = room.players?.[playerId];
  if (currentPlayer?.hasGuessed) {
    return { accepted: false, reason: "already_guessed" };
  }

  // Guard 4: 2-aşamalı coordinate bounds (pre-check + authoritative)
  if (!isValidTurkeyCoordinate(guess.lat, guess.lng)) {
    return { accepted: false, reason: "invalid_coords" };
  }
  if (!isLikelyInTurkey(guess)) {
    return { accepted: false, reason: "outside_turkey" };
  }

  // Guard 5: Room status
  if (room.status !== "playing") {
    return { accepted: false, reason: "not_playing" };
  }

  // Guard 6: Round state
  if (room.roundState !== "active") {
    return { accepted: false, reason: "round_not_active" };
  }

  // Guard 7: Server time check (3s grace — harmonized with useRoom GUESS_GRACE_PERIOD_MS)
  const GUESS_GRACE_MS = 3000;
  const timeLimit = room.timeLimit || 90;
  const roundEndMs = (room.roundStartTime || 0) + timeLimit * 1000;
  if (serverNowMs > roundEndMs + GUESS_GRACE_MS) {
    return { accepted: false, reason: "time_expired" };
  }

  return { accepted: true, reason: "ok" };
}

// ==================== TIME UP VALIDATION ====================

/**
 * HandleTimeUp için server time doğrulaması.
 * Client timer'ı biraz erken tetikleyebilir, 1s tolerans verilir.
 */
export function validateTimeUp(
  roundStartTime: number | null | undefined,
  timeLimitSec: number,
  serverNowMs: number,
  currentRound: number,
  alreadyHandledRound: number | null,
  isProcessing: boolean
): { valid: boolean; reason?: string } {
  // Duplicate guard
  if (alreadyHandledRound === currentRound) {
    return { valid: false, reason: "duplicate_timeup" };
  }

  if (isProcessing) {
    return { valid: false, reason: "already_processing" };
  }

  // Server time enforcement: 1s early tolerance
  const elapsedMs = serverNowMs - (roundStartTime || 0);
  const timeLimitMs = timeLimitSec * 1000;

  if (elapsedMs < timeLimitMs - 1000) {
    return { valid: false, reason: "not_expired_yet" };
  }

  return { valid: true };
}

// ==================== NEXT ROUND PAYLOAD ====================

/**
 * Oyunun bitip bitmediğini kontrol eder.
 */
export function isGameOver(currentRound: number, totalRounds: number): boolean {
  return currentRound >= totalRounds;
}

// ==================== LEAVE ROOM DECISIONS ====================

type LeaveAction =
  | { type: "delete_room" }
  | { type: "migrate_and_leave"; newHostId: string }
  | { type: "just_leave" };

/**
 * Odadan ayrılma aksiyonunu belirler.
 * Son oyuncuysa oda silinir, host ise migration yapılır.
 */
export function determineLeaveAction(
  players: Record<string, Player>,
  leavingPlayerId: string,
  hostId: string
): LeaveAction {
  const playerList = Object.values(players);

  // Son oyuncu: oda silinmeli
  if (playerList.length <= 1) {
    return { type: "delete_room" };
  }

  // Host ayrılıyorsa: migration gerekli
  if (leavingPlayerId === hostId) {
    // electNewHost leavingPlayerId'yi hariç tutar
    const newHost = electNewHost(players, leavingPlayerId);
    if (newHost) {
      return { type: "migrate_and_leave", newHostId: newHost.id };
    }
    // Hiç online aday yoksa, herhangi birini seç (offline bile olsa)
    const fallback = playerList.find((p) => p.id !== leavingPlayerId);
    if (fallback) {
      return { type: "migrate_and_leave", newHostId: fallback.id };
    }
  }

  return { type: "just_leave" };
}

/**
 * Ayrılan oyuncu guess yapmamışsa expectedGuesses düşürülmeli mi?
 */
export function shouldDecrementExpectedGuesses(
  roomStatus: string,
  leavingPlayer: Player | undefined
): boolean {
  if (roomStatus !== "playing") return false;
  if (!leavingPlayer) return false;
  return !leavingPlayer.hasGuessed;
}

// ==================== RESTART GAME PAYLOAD ====================

/**
 * Restart için oyuncu state'ini tamamen sıfırlar.
 * resetPlayerForNewRound'dan farklı: totalScore ve roundScores de sıfırlanır.
 */
export function resetPlayerForRestart(player: Player): Player {
  return {
    ...player,
    totalScore: 0,
    currentGuess: null,
    hasGuessed: false,
    movesUsed: 0,
    roundScores: [],
  };
}

// ==================== WATCHDOG DECISION ====================

/**
 * Watchdog'un müdahale edip etmemesi gerektiğini belirler.
 * Buffer süresi geçtiyse ve round hala 'playing' ise müdahale edilir.
 */
export function shouldWatchdogAct(
  roomStatus: string,
  roundStartTime: number | null | undefined,
  timeLimitSec: number,
  currentTime: number,
  watchdogBufferSec: number = 5,
  lock: RoundEndLock | undefined | null = null,
  currentRound: number = 0,
  lockStaleThresholdMs: number = 10000
): { shouldAct: boolean; reason?: string; shouldOverrideLock?: boolean } {
  if (roomStatus !== "playing") {
    return { shouldAct: false, reason: "not_playing" };
  }

  if (!roundStartTime || roundStartTime <= 0) {
    return { shouldAct: false, reason: "no_start_time" };
  }

  const elapsed = (currentTime - roundStartTime) / 1000;
  const deadline = timeLimitSec + watchdogBufferSec;

  if (elapsed < deadline) {
    return { shouldAct: false, reason: "time_not_expired" };
  }

  // Lock kontrolü
  if (lock && lock.roundId === currentRound) {
    // Lock var ama stale mi?
    if (isLockStale(lock, currentRound, currentTime, lockStaleThresholdMs)) {
      return { shouldAct: true, reason: "stale_lock_override", shouldOverrideLock: true };
    }
    // Lock fresh → başkası hallediyor
    return { shouldAct: false, reason: "lock_held_by_other" };
  }

  return { shouldAct: true, reason: "time_expired_no_lock" };
}

// ==================== NOTIFICATION CONSTRUCTION ====================

export interface GameNotification {
  id: string;
  type: "player_left" | "player_joined" | "host_changed" | "error";
  message: string;
  playerName?: string;
  timestamp: number;
}

/**
 * Snapshot diff ile notification oluşturur.
 * Önceki ve şimdiki oyuncu listelerini karşılaştırır.
 */
export function diffPlayerNotifications(
  previousPlayerIds: string[],
  currentPlayerIds: string[],
  currentPlayerNames: Record<string, string>,
  previousPlayerNames: Record<string, string>,
  selfPlayerId: string
): Array<{ type: "player_joined" | "player_left"; playerId: string; playerName: string }> {
  const notifications: Array<{ type: "player_joined" | "player_left"; playerId: string; playerName: string }> = [];

  // Yeni katılanlar
  const joined = currentPlayerIds.filter((id) => !previousPlayerIds.includes(id));
  for (const id of joined) {
    if (id !== selfPlayerId) {
      notifications.push({
        type: "player_joined",
        playerId: id,
        playerName: currentPlayerNames[id] || "Bir oyuncu",
      });
    }
  }

  // Ayrılanlar
  const left = previousPlayerIds.filter((id) => !currentPlayerIds.includes(id));
  for (const id of left) {
    if (id !== selfPlayerId) {
      notifications.push({
        type: "player_left",
        playerId: id,
        // Ayrılan oyuncunun adını PREVIOUS snapshot'tan al
        playerName: previousPlayerNames[id] || "Bir oyuncu",
      });
    }
  }

  return notifications;
}

// ==================== CONNECTION STATE ====================

/**
 * Heartbeat hatasına göre connection state belirler.
 */
export function classifyHeartbeatError(
  errorCode: string,
  errorMessage: string,
  consecutiveFails: number
): "online" | "reconnecting" | "lost" {
  if (errorCode === "PERMISSION_DENIED" || errorCode === "permission-denied") {
    return "lost";
  }
  if (errorMessage.includes("not found") || errorMessage.includes("deleted")) {
    return "lost";
  }
  // Network/transient error
  if (consecutiveFails >= HEARTBEAT_FAIL_THRESHOLD) {
    return "lost";
  }
  return "reconnecting";
}

// ==================== START GAME VALIDATION ====================

/**
 * Oyun başlatma koşullarını kontrol eder.
 */
export function validateStartGame(
  room: Room | null,
  actingPlayerId: string
): { valid: boolean; reason?: string } {
  if (!room) return { valid: false, reason: "no_room" };
  if (actingPlayerId !== room.hostId) return { valid: false, reason: "not_host" };
  if (room.status !== "waiting") return { valid: false, reason: "not_waiting" };

  const onlineCount = countOnlinePlayers(room.players || {});
  if (onlineCount < 1) return { valid: false, reason: "no_players" };

  return { valid: true };
}

/**
 * Next round koşullarını kontrol eder.
 */
export function validateNextRound(
  room: Room | null,
  actingPlayerId: string
): { valid: boolean; reason?: string; isGameOver?: boolean } {
  if (!room) return { valid: false, reason: "no_room" };
  if (actingPlayerId !== room.hostId) return { valid: false, reason: "not_host" };
  if (room.status !== "roundEnd") return { valid: false, reason: "not_round_end" };

  if (room.currentRound >= room.totalRounds) {
    return { valid: true, isGameOver: true };
  }

  return { valid: true, isGameOver: false };
}
