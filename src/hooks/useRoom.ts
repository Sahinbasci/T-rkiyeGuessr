"use client";

/**
 * useRoom Hook
 * Oda yönetimi - Mod seçimi, timer, pano paketi desteği
 *
 * PRODUCTION FEATURES:
 * - Rate limiting (oda oluşturma, katılma, tahmin)
 * - Room lifecycle management (zombie room cleanup)
 * - Player disconnect handling
 * - Timestamp tracking for analytics
 * - Coordinate validation
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { database, ref, set, get, onValue, update, remove, onDisconnect, runTransaction, serverTimestamp, getAuthUid } from "@/config/firebase";
import {
  Room,
  Player,
  PlayerStatus,
  Coordinates,
  GameMode,
  PanoPackage,
  GAME_MODE_CONFIG,
} from "@/types";
import {
  generateRoomCode,
  calculateDistance,
  calculateScore,
  canCreateRoom,
  canJoinRoom,
  canSubmitGuess,
  resetGuessLimit,
  getRoomCreateCooldown,
  generateSessionToken,
  saveSessionToken,
  getSessionToken,
  clearSessionToken,
} from "@/utils";
import {
  initTelemetry,
  setTelemetryContext,
  trackEvent,
  trackDuplicateAttempt,
  trackListener,
  trackError,
  cleanupTelemetry,
} from "@/utils/telemetry";
import {
  setupRoomCleanup,
  cleanupRoomData,
  recordPlayerActivity,
} from "@/services/roomLifecycle";
import {
  isValidTurkeyCoordinate,
  isValidPlayerName,
  ERROR_MESSAGES,
} from "@/config/production";

// Bildirim türleri
export interface GameNotification {
  id: string;
  type: "player_left" | "player_joined" | "host_changed" | "error";
  message: string;
  playerName?: string;
  timestamp: number;
}

export function useRoom() {
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Bildirim sistemi
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const previousPlayersRef = useRef<string[]>([]);
  const previousHostIdRef = useRef<string | null>(null);
  // Son bildirilen oyuncu ID'leri (tekrar bildirim önleme)
  const notifiedJoinedRef = useRef<Set<string>>(new Set());
  const notifiedLeftRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  // RACE CONDITION FIX: Round hesaplaması sırasında kilitle
  const isProcessingRoundRef = useRef<boolean>(false);
  const processingRoundIdRef = useRef<number | null>(null);

  // TIMER SPAM FIX: Status geçişlerinde bildirim gösterme
  const lastStatusRef = useRef<string | null>(null);

  // Bildirim ekle
  const addNotification = useCallback((
    type: GameNotification["type"],
    message: string,
    playerName?: string
  ) => {
    const notification: GameNotification = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      playerName,
      timestamp: Date.now(),
    };

    setNotifications(prev => [...prev, notification]);

    // 5 saniye sonra bildirimi kaldır
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  // Bildirimi manuel kaldır
  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Firebase Presence sistemi - Bağlantı yönetimi
  // GRACE PERIOD: Kısa süreli kopmalar için oyuncuyu hemen silme
  const DISCONNECT_GRACE_PERIOD = 15000; // 15 saniye grace period
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!room?.id || !playerId) return;

    const playerRef = ref(database, `rooms/${room.id}/players/${playerId}`);

    // Heartbeat: Her 5 saniyede bir lastSeen güncelle
    const updatePresence = async () => {
      try {
        await update(playerRef, {
          lastSeen: Date.now(),
          status: 'online' as PlayerStatus,
        });
        lastHeartbeatRef.current = Date.now();
      } catch (err) {
        console.warn("Presence update failed:", err);
      }
    };

    // Hemen bir kez güncelle
    updatePresence();

    // Her 5 saniyede heartbeat gönder
    presenceIntervalRef.current = setInterval(updatePresence, 5000);

    // onDisconnect: Oyuncuyu "disconnected" işaretle (silme, sadece işaretle)
    // NOT: serverTimestamp() burada kullanılamaz, Date.now() kullanıyoruz
    const disconnectHandler = onDisconnect(playerRef);
    disconnectHandler.update({
      status: 'disconnected' as PlayerStatus,
      disconnectedAt: Date.now(),
    });

    return () => {
      if (presenceIntervalRef.current) {
        clearInterval(presenceIntervalRef.current);
      }
      disconnectHandler.cancel();
    };
  }, [room?.id, playerId]);

  // Offline oyuncuları temizle ve round completion kontrolü (sadece host yapar)
  // NOT: isHost henüz tanımlanmadığı için doğrudan karşılaştırma kullanıyoruz
  useEffect(() => {
    const amIHost = playerId === room?.hostId;
    if (!room?.id || !amIHost || room.status === "waiting") return;

    const checkOfflinePlayers = async () => {
      if (!room?.players) return;

      const now = Date.now();
      let removedAny = false;

      for (const player of Object.values(room.players)) {
        // Kendi kendimizi silme
        if (player.id === playerId) continue;

        // status='disconnected' ve grace period geçmişse sil
        // Backward compat: status undefined = online (silme)
        const lastSeen = player.lastSeen || now;
        const isPlayerOnline = !player.status || player.status === 'online';
        const timeSinceLastSeen = now - lastSeen;

        // Sadece açıkça 'disconnected' olan ve grace period geçmiş oyuncuları sil
        if (player.status === 'disconnected' && timeSinceLastSeen > DISCONNECT_GRACE_PERIOD) {
          console.log(`Offline player removed: ${player.name} (${timeSinceLastSeen}ms)`);
          try {
            await remove(ref(database, `rooms/${room.id}/players/${player.id}`));
            removedAny = true;

            // Eğer oyun aktifse ve bu oyuncu guess yapmamışsa, expectedGuesses azalt
            if (room.status === "playing" && !player.hasGuessed) {
              const roomRef = ref(database, `rooms/${room.id}`);
              await runTransaction(roomRef, (currentRoom) => {
                if (!currentRoom) return currentRoom;
                return {
                  ...currentRoom,
                  expectedGuesses: Math.max(0, (currentRoom.expectedGuesses || 0) - 1),
                };
              });
            }
          } catch (err) {
            console.error("Failed to remove offline player:", err);
          }
        }
      }

      // Oyuncu silindiyse round completion kontrolü yap
      if (removedAny && room.status === "playing") {
        // Round completion'ı tetikle (allGuessed kontrolü otomatik listener'da)
        console.log("Offline player removed, checking round completion...");
      }
    };

    // Her 10 saniyede offline oyuncuları kontrol et
    const cleanupInterval = setInterval(checkOfflinePlayers, 10000);

    return () => clearInterval(cleanupInterval);
  }, [room?.id, room?.hostId, room?.players, room?.status, playerId]);

  // beforeunload event - sekme kapatılmadan önce cleanup
  useEffect(() => {
    if (!room?.id || !playerId) return;

    const handleBeforeUnload = async () => {
      // Senkron olarak oyuncuyu sil
      const playerRef = ref(database, `rooms/${room.id}/players/${playerId}`);

      try {
        // Navigator.sendBeacon kullanarak asenkron istek at
        // Bu sayede sekme kapansa bile istek tamamlanır
        await remove(playerRef);
      } catch (err) {
        console.error("beforeunload cleanup error:", err);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [room?.id, playerId]);

  // Telemetry başlat (component mount)
  useEffect(() => {
    initTelemetry();
    return () => {
      cleanupTelemetry();
    };
  }, []);

  // Odayı dinle ve otomatik tahmin kontrolü yap
  useEffect(() => {
    if (!room?.id) return;

    // Telemetry listener tracking
    trackListener("subscribe");

    const roomRef = ref(database, `rooms/${room.id}`);
    const unsubscribe = onValue(roomRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const roomData = data as Room;
        const currentPlayerIds = Object.keys(roomData.players || {});
        const currentPlayerNames = Object.values(roomData.players || {}).reduce(
          (acc, p) => ({ ...acc, [p.id]: p.name }),
          {} as Record<string, string>
        );

        // === OYUNCU AYRILDI/KATILDI KONTROLÜ ===
        // TIMER SPAM FIX: Status geçişlerinde (playing -> roundEnd) bildirim gösterme
        // Bu, timer bitiminde sahte "katıldı/ayrıldı" mesajlarını önler
        const isStatusTransition = lastStatusRef.current !== null &&
          lastStatusRef.current !== roomData.status;
        lastStatusRef.current = roomData.status;

        // İlk yüklemede veya status geçişinde bildirim gösterme (spam önleme)
        if (!isFirstLoadRef.current && previousPlayersRef.current.length > 0 && !isStatusTransition) {
          const leftPlayers = previousPlayersRef.current.filter(
            id => !currentPlayerIds.includes(id)
          );

          // Ayrılan oyuncular için bildirim (sadece 1 kez)
          leftPlayers.forEach(leftPlayerId => {
            if (leftPlayerId !== playerId && !notifiedLeftRef.current.has(leftPlayerId)) {
              const leftPlayerName = room?.players?.[leftPlayerId]?.name || "Bir oyuncu";
              addNotification("player_left", `${leftPlayerName} oyundan ayrıldı`, leftPlayerName);
              notifiedLeftRef.current.add(leftPlayerId);
              // 10 saniye sonra tekrar bildirim gösterilebilir
              setTimeout(() => notifiedLeftRef.current.delete(leftPlayerId), 10000);
            }
          });

          // Yeni katılan oyuncular için bildirim (sadece 1 kez)
          const joinedPlayers = currentPlayerIds.filter(
            id => !previousPlayersRef.current.includes(id)
          );

          joinedPlayers.forEach(joinedPlayerId => {
            if (joinedPlayerId !== playerId && !notifiedJoinedRef.current.has(joinedPlayerId)) {
              const joinedPlayerName = currentPlayerNames[joinedPlayerId] || "Bir oyuncu";
              addNotification("player_joined", `${joinedPlayerName} odaya katıldı`, joinedPlayerName);
              notifiedJoinedRef.current.add(joinedPlayerId);
              // 10 saniye sonra tekrar bildirim gösterilebilir
              setTimeout(() => notifiedJoinedRef.current.delete(joinedPlayerId), 10000);
            }
          });
        }

        // İlk yükleme tamamlandı
        if (isFirstLoadRef.current && previousPlayersRef.current.length > 0) {
          isFirstLoadRef.current = false;
        }

        // === HOST AYRILDI MI KONTROLÜ ===
        // Host artık oyuncular arasında değilse veya offline ise, yeni host ata
        const currentHost = roomData.players?.[roomData.hostId];
        const hostStillOnline = currentHost && currentHost.status === 'online';

        if ((!hostStillOnline || !currentPlayerIds.includes(roomData.hostId)) && currentPlayerIds.length > 0) {
          // Host ayrılmış/offline ve başka oyuncular var - yeni host ata
          // Deterministic seçim: en düşük joinedAt (en eski online oyuncu)
          const onlinePlayers = Object.values(roomData.players || {})
            .filter((p) => (!p.status || p.status === 'online') && p.id !== roomData.hostId)
            .sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0));

          const newHost = onlinePlayers[0];

          // Sadece yeni host olacak oyuncu güncelleme yapsın (race condition önleme)
          if (newHost && newHost.id === playerId) {
            console.log("Host ayrıldı/offline, yeni host atanıyor:", newHost.id);

            // Transaction ile atomic host değişimi
            const roomRefForMigration = ref(database, `rooms/${roomData.id}`);
            try {
              await runTransaction(roomRefForMigration, (currentRoom) => {
                if (!currentRoom) return currentRoom;

                // Host hala aynı mı kontrol et (başka biri zaten değiştirmiş olabilir)
                if (currentRoom.hostId !== roomData.hostId) {
                  return; // abort - başka biri zaten değiştirmiş
                }

                return {
                  ...currentRoom,
                  hostId: newHost.id,
                  players: {
                    ...currentRoom.players,
                    [newHost.id]: { ...currentRoom.players[newHost.id], isHost: true },
                    ...(currentRoom.players[roomData.hostId] ? {
                      [roomData.hostId]: { ...currentRoom.players[roomData.hostId], isHost: false }
                    } : {}),
                  },
                };
              });
            } catch (err) {
              console.error("Host migration transaction failed:", err);
            }
          }
        }

        // === HOST DEĞİŞTİ Mİ KONTROLÜ (bildirim için) ===
        if (previousHostIdRef.current && previousHostIdRef.current !== roomData.hostId) {
          const newHostName = currentPlayerNames[roomData.hostId] || "Yeni host";

          // Kendimiz yeni host olduk mu?
          if (roomData.hostId === playerId) {
            addNotification("host_changed", "Artık sen hostsun!", playerName);
          } else {
            addNotification("host_changed", `${newHostName} yeni host oldu`, newHostName);
          }
        }

        // Referansları güncelle
        previousPlayersRef.current = currentPlayerIds;
        previousHostIdRef.current = roomData.hostId;

        setRoom(roomData);

        // === OTOMATİK TAHMİN KONTROLÜ (sadece host) ===
        // RACE CONDITION FIX: İşlem zaten devam ediyorsa yeni işlem başlatma
        // DISCONNECT FIX: Sadece ONLINE oyuncuları say
        if (playerId === roomData.hostId && roomData.status === "playing" && roomData.players) {
          const playerList = Object.values(roomData.players);
          // CRITICAL: Sadece online oyuncuları filtrele
          // BACKWARD COMPAT: status undefined ise online kabul et (eski oyuncular)
          const onlinePlayers = playerList.filter((p) => !p.status || p.status === 'online');
          const allGuessed = onlinePlayers.length > 0 && onlinePlayers.every((p) => p.hasGuessed);

          if (allGuessed && roomData.currentLocation && !isProcessingRoundRef.current) {
            // Round işlemini kilitle
            isProcessingRoundRef.current = true;
            const currentRoundId = roomData.currentRound;
            processingRoundIdRef.current = currentRoundId;

            // SNAPSHOT AL: Bu noktadaki oyuncu listesini sakla
            // Sonraki değişiklikler bu hesaplamayı etkilemeyecek
            const snapshotPlayerIds = Object.keys(roomData.players);
            const snapshotPlayers = { ...roomData.players };
            const snapshotLocation = { ...roomData.currentLocation };

            // HIZLI SONUÇ: Gecikmeyi 100ms'e düşür (eskiden 500ms)
            setTimeout(async () => {
              try {
                // Round hala aynı mı kontrol et (başka bir işlem devreye girmiş olabilir)
                if (processingRoundIdRef.current !== currentRoundId) {
                  console.log("Round değişti, hesaplama iptal edildi");
                  return;
                }

                const freshSnap = await get(ref(database, `rooms/${roomData.id}`));
                const freshRoom = freshSnap.val() as Room | null;

                // Durum hala playing mi VE aynı round mu kontrol et
                if (freshRoom && freshRoom.status === "playing" && freshRoom.currentRound === currentRoundId) {
                  // SNAPSHOT'TAKİ OYUNCULARI KULLAN, yeni katılanları dahil etme
                  const playersToProcess = snapshotPlayerIds
                    .map(id => freshRoom.players?.[id])
                    .filter((p): p is Player => p !== undefined && p !== null);

                  const results = playersToProcess
                    .filter((player) => player && player.id && player.name)
                    .map((player) => {
                      const distance = player.currentGuess
                        ? calculateDistance(snapshotLocation, player.currentGuess)
                        : 9999;
                      const score = calculateScore(distance);

                      return {
                        odlayerId: player.id,
                        playerName: player.name || "Oyuncu",
                        guess: player.currentGuess || { lat: 0, lng: 0 },
                        distance,
                        score,
                      };
                    });

                  // Sadece snapshot'taki oyuncuları güncelle
                  const updatedPlayers: { [key: string]: Player } = {};

                  // Önce TÜM mevcut oyuncuları koru (yeni katılanlar dahil)
                  Object.values(freshRoom.players || {}).forEach((player) => {
                    updatedPlayers[player.id] = player;
                  });

                  // Sonra sadece snapshot'takilerin skorlarını güncelle
                  playersToProcess.forEach((player) => {
                    const result = results.find((r) => r.odlayerId === player.id);
                    const currentRoundScores = player.roundScores || [];
                    updatedPlayers[player.id] = {
                      ...player,
                      totalScore: (player.totalScore || 0) + (result?.score || 0),
                      roundScores: [...currentRoundScores, result?.score || 0],
                    };
                  });

                  await update(ref(database, `rooms/${freshRoom.id}`), {
                    status: "roundEnd",
                    roundState: 'ended',
                    roundResults: results,
                    players: updatedPlayers,
                  });

                  trackEvent("roundEnd", { roundId: currentRoundId, trigger: "allGuessed" });
                }
              } catch (err) {
                console.error("Round hesaplama hatası:", err);
                trackError(err instanceof Error ? err : String(err), "autoRoundEnd");
              } finally {
                // Kilidi aç
                isProcessingRoundRef.current = false;
                processingRoundIdRef.current = null;
              }
            }, 100); // 500ms -> 100ms (hızlı sonuç)
          }
        }
      } else {
        setRoom(null);
        setError("Oda silindi veya bulunamadı");
      }
    });

    return () => {
      unsubscribe();
      trackListener("unsubscribe");
    };
  }, [room?.id, playerId, playerName, addNotification]);

  // Oda oluştur (Rate Limited)
  const createRoom = useCallback(async (name: string, gameMode: GameMode = "urban") => {
    setIsLoading(true);
    setError(null);

    // Rate limit kontrolü
    if (!canCreateRoom()) {
      const cooldown = Math.ceil(getRoomCreateCooldown() / 1000);
      setError(`${ERROR_MESSAGES.RATE_LIMIT_EXCEEDED} (${cooldown}s)`);
      setIsLoading(false);
      return null;
    }

    // İsim validasyonu
    if (!isValidPlayerName(name)) {
      setError("Geçersiz oyuncu adı (1-20 karakter)");
      setIsLoading(false);
      return null;
    }

    try {
      const roomCode = generateRoomCode();
      const odlayerId = await getAuthUid();
      const sessionToken = generateSessionToken();
      const modeConfig = GAME_MODE_CONFIG[gameMode];
      const now = Date.now();

      const newPlayer: Player = {
        id: odlayerId,
        name: name.trim(),
        isHost: true,
        totalScore: 0,
        currentGuess: null,
        hasGuessed: false,
        movesUsed: 0,
        roundScores: [],
        // Yeni presence alanları
        status: 'online' as PlayerStatus,
        lastSeen: now,
        disconnectedAt: null,
        sessionToken: sessionToken,
        joinedAt: now,
      };

      const newRoom: Room = {
        id: roomCode,
        hostId: odlayerId,
        status: "waiting",
        currentRound: 0,
        totalRounds: 5,
        players: { [odlayerId]: newPlayer },
        gameMode: gameMode,
        timeLimit: modeConfig.timeLimit,
        moveLimit: modeConfig.moveLimit,
        currentPanoPackageId: null,
        currentPanoPackage: null,
        currentLocation: null,
        currentLocationName: null,
        roundResults: null,
        roundStartTime: null,
        // Round State Machine
        roundState: 'waiting',
        roundVersion: 0,
        activePlayerCount: 0,
        expectedGuesses: 0,
        currentGuesses: 0,
      };

      // Timestamp'leri ekle (Firebase rules'da optional)
      const roomWithTimestamps = {
        ...newRoom,
        createdAt: now,
        lastActivityAt: now,
      };

      await set(ref(database, `rooms/${roomCode}`), roomWithTimestamps);

      setPlayerId(odlayerId);
      setPlayerName(name.trim());
      setRoom(newRoom);

      // Session token'ı localStorage'a kaydet (rejoin için)
      saveSessionToken(roomCode, sessionToken);

      // Telemetry context ayarla
      setTelemetryContext({
        roomId: roomCode,
        playerId: odlayerId,
        playerName: name.trim(),
      });
      trackEvent("join", { action: "create", gameMode });

      // Referansları başlat (bildirim spam önleme)
      previousPlayersRef.current = [odlayerId];
      previousHostIdRef.current = odlayerId;
      isFirstLoadRef.current = true;
      notifiedJoinedRef.current.clear();
      notifiedLeftRef.current.clear();

      // Room lifecycle tracking
      setupRoomCleanup(newRoom);

      return roomCode;
    } catch (err) {
      console.error("Oda oluşturma hatası:", err);
      trackError(err instanceof Error ? err : String(err), "createRoom");
      setError("Oda oluşturulamadı. Lütfen tekrar deneyin.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Odaya katıl (Rate Limited) - Rejoin desteği ile
  const joinRoom = useCallback(async (roomCode: string, name: string) => {
    setIsLoading(true);
    setError(null);

    // Rate limit kontrolü
    if (!canJoinRoom()) {
      setError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
      setIsLoading(false);
      return false;
    }

    // İsim validasyonu
    if (!isValidPlayerName(name)) {
      setError("Geçersiz oyuncu adı (1-20 karakter)");
      setIsLoading(false);
      return false;
    }

    try {
      const normalizedRoomCode = roomCode.toUpperCase();
      const roomRef = ref(database, `rooms/${normalizedRoomCode}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        setError(ERROR_MESSAGES.ROOM_NOT_FOUND);
        return false;
      }

      const roomData = snapshot.val() as Room;

      // === REJOIN KONTROLÜ ===
      // localStorage'dan sessionToken al ve eşleşen oyuncu ara
      const existingSessionToken = getSessionToken(normalizedRoomCode);
      let rejoinedPlayer: Player | null = null;

      if (existingSessionToken && roomData.players) {
        // SessionToken ile eşleşen oyuncu bul
        const matchingPlayer = Object.values(roomData.players).find(
          (p) => p.sessionToken === existingSessionToken
        );

        if (matchingPlayer) {
          // Rejoin: Oyuncuyu online yap, state'i koru
          console.log(`Rejoin: ${matchingPlayer.name} geri döndü`);

          const now = Date.now();
          await update(ref(database, `rooms/${normalizedRoomCode}/players/${matchingPlayer.id}`), {
            status: 'online' as PlayerStatus,
            lastSeen: now,
            disconnectedAt: null,
            // İsim değişmişse güncelle
            name: name.trim(),
          });

          setPlayerId(matchingPlayer.id);
          setPlayerName(name.trim());
          setRoom({ ...roomData, id: normalizedRoomCode });

          // Telemetry
          setTelemetryContext({
            roomId: normalizedRoomCode,
            playerId: matchingPlayer.id,
            playerName: name.trim(),
          });
          trackEvent("join", { action: "rejoin" });

          // Referansları başlat
          previousPlayersRef.current = Object.keys(roomData.players || {});
          previousHostIdRef.current = roomData.hostId;
          isFirstLoadRef.current = true;
          notifiedJoinedRef.current.clear();
          notifiedLeftRef.current.clear();

          // Activity tracking
          recordPlayerActivity(normalizedRoomCode, matchingPlayer.id);

          setIsLoading(false);
          return true;
        }
      }

      // === YENİ OYUNCU KATILIMI ===
      // Oyun başlamışsa ve rejoin değilse, katılmayı engelle
      if (roomData.status !== "waiting") {
        setError(ERROR_MESSAGES.GAME_ALREADY_STARTED);
        return false;
      }

      const playerCount = Object.keys(roomData.players || {}).length;
      if (playerCount >= 8) {
        setError(ERROR_MESSAGES.ROOM_FULL);
        return false;
      }

      const odlayerId = await getAuthUid();
      const sessionToken = generateSessionToken();
      const now = Date.now();

      const newPlayer: Player = {
        id: odlayerId,
        name: name.trim(),
        isHost: false,
        totalScore: 0,
        currentGuess: null,
        hasGuessed: false,
        movesUsed: 0,
        roundScores: [],
        // Yeni presence alanları
        status: 'online' as PlayerStatus,
        lastSeen: now,
        disconnectedAt: null,
        sessionToken: sessionToken,
        joinedAt: now,
      };

      await update(ref(database, `rooms/${normalizedRoomCode}/players`), {
        [odlayerId]: newPlayer,
      });

      // Son aktivite güncelle
      await update(ref(database, `rooms/${normalizedRoomCode}`), {
        lastActivityAt: now,
      });

      // Session token'ı localStorage'a kaydet
      saveSessionToken(normalizedRoomCode, sessionToken);

      setPlayerId(odlayerId);
      setPlayerName(name.trim());
      setRoom({ ...roomData, id: normalizedRoomCode });

      // Telemetry context ayarla
      setTelemetryContext({
        roomId: normalizedRoomCode,
        playerId: odlayerId,
        playerName: name.trim(),
      });
      trackEvent("join", { action: "join" });

      // Referansları başlat (bildirim spam önleme)
      previousPlayersRef.current = [...Object.keys(roomData.players || {}), odlayerId];
      previousHostIdRef.current = roomData.hostId;
      isFirstLoadRef.current = true;
      notifiedJoinedRef.current.clear();
      notifiedLeftRef.current.clear();

      // Player activity tracking
      recordPlayerActivity(normalizedRoomCode, odlayerId);

      return true;
    } catch (err) {
      console.error("Odaya katılma hatası:", err);
      trackError(err instanceof Error ? err : String(err), "joinRoom");
      setError("Odaya katılınamadı. Lütfen tekrar deneyin.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Oyun modunu değiştir (sadece host, lobby'de)
  const setGameMode = useCallback(
    async (mode: GameMode) => {
      if (!room || playerId !== room.hostId || room.status !== "waiting") return;

      const modeConfig = GAME_MODE_CONFIG[mode];

      await update(ref(database, `rooms/${room.id}`), {
        gameMode: mode,
        timeLimit: modeConfig.timeLimit,
        moveLimit: modeConfig.moveLimit,
      });
    },
    [room, playerId]
  );

  // Oyunu başlat (sadece host) - Pano paketi ile
  const startGameWithPanoPackage = useCallback(
    async (panoPackage: PanoPackage) => {
      if (!room || playerId !== room.hostId) return;

      // Sadece ONLINE oyuncuları al (backward compat: status undefined = online)
      const onlinePlayers = Object.values(room.players || {}).filter(
        (p) => !p.status || p.status === 'online'
      );
      const onlinePlayerCount = onlinePlayers.length;

      const updatedPlayers: { [key: string]: Player } = {};
      Object.values(room.players || {}).forEach((player) => {
        updatedPlayers[player.id] = {
          ...player,
          currentGuess: null,
          hasGuessed: false,
        movesUsed: 0,
        };
      });

      const now = Date.now();

      await update(ref(database, `rooms/${room.id}`), {
        status: "playing",
        currentRound: 1,
        currentPanoPackageId: panoPackage.id,
        currentPanoPackage: panoPackage,
        currentLocation: { lat: panoPackage.pano0.lat, lng: panoPackage.pano0.lng },
        currentLocationName: panoPackage.locationName,
        players: updatedPlayers,
        roundResults: null,
        roundStartTime: now,
        // Round State Machine
        roundState: 'active',
        roundVersion: (room.roundVersion || 0) + 1,
        activePlayerCount: onlinePlayerCount,
        expectedGuesses: onlinePlayerCount,
        currentGuesses: 0,
      });

      trackEvent("roundStart", { roundId: 1, panoPackageId: panoPackage.id });
    },
    [room, playerId]
  );

  // Eski startGame (geriye uyumluluk için)
  const startGame = useCallback(
    async (location: Coordinates, panoId: string, locationName?: string) => {
      if (!room || playerId !== room.hostId) return;

      // Sadece ONLINE oyuncuları al (backward compat: status undefined = online)
      const onlinePlayers = Object.values(room.players || {}).filter(
        (p) => !p.status || p.status === 'online'
      );
      const onlinePlayerCount = onlinePlayers.length;

      const updatedPlayers: { [key: string]: Player } = {};
      Object.values(room.players || {}).forEach((player) => {
        updatedPlayers[player.id] = {
          ...player,
          currentGuess: null,
          hasGuessed: false,
        movesUsed: 0,
        };
      });

      const now = Date.now();

      await update(ref(database, `rooms/${room.id}`), {
        status: "playing",
        currentRound: 1,
        currentLocation: location,
        currentPanoPackageId: panoId,
        currentLocationName: locationName || null,
        players: updatedPlayers,
        roundResults: null,
        roundStartTime: now,
        // Round State Machine
        roundState: 'active',
        roundVersion: (room.roundVersion || 0) + 1,
        activePlayerCount: onlinePlayerCount,
        expectedGuesses: onlinePlayerCount,
        currentGuesses: 0,
      });
    },
    [room, playerId]
  );

  // Tahmin gönder (Rate Limited + Validated)
  const submitGuess = useCallback(
    async (guess: Coordinates) => {
      if (!room || !playerId) return;

      // Zaten tahmin yaptıysa çık
      const currentPlayer = room.players?.[playerId];
      if (currentPlayer?.hasGuessed) {
        console.log("submitGuess: Zaten tahmin yapılmış, atlanıyor");
        return;
      }

      // Rate limit kontrolü
      if (!canSubmitGuess(playerId, room.currentRound)) {
        setError(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
        return;
      }

      // Koordinat validasyonu (production config kullan)
      if (!isValidTurkeyCoordinate(guess.lat, guess.lng)) {
        setError(ERROR_MESSAGES.INVALID_COORDINATES);
        return;
      }

      // Player activity güncelle
      recordPlayerActivity(room.id, playerId);

      // Player güncelle
      await update(ref(database, `rooms/${room.id}/players/${playerId}`), {
        currentGuess: guess,
        hasGuessed: true,
        lastActiveAt: Date.now(),
      });

      // Atomic increment: currentGuesses++
      const roomRef = ref(database, `rooms/${room.id}`);
      await runTransaction(roomRef, (currentRoom) => {
        if (!currentRoom) return currentRoom;
        return {
          ...currentRoom,
          currentGuesses: (currentRoom.currentGuesses || 0) + 1,
        };
      });

      trackEvent("submitGuess", { roundId: room.currentRound, lat: guess.lat, lng: guess.lng });
    },
    [room, playerId]
  );

  // Tüm tahminler geldi mi kontrol et ve sonuçları hesapla
  const checkAllGuessed = useCallback(async () => {
    if (!room || playerId !== room.hostId) return;

    const latestSnap = await get(ref(database, `rooms/${room.id}`));
    const latestRoom = latestSnap.val() as Room | null;

    if (!latestRoom?.players) return;
    if (latestRoom.status !== "playing") return;

    const playerList = Object.values(latestRoom.players);
    // DISCONNECT FIX: Sadece online oyuncuları say (backward compat: status undefined = online)
    const onlinePlayers = playerList.filter((p) => !p.status || p.status === 'online');
    const allGuessed = onlinePlayers.length > 0 && onlinePlayers.every((p) => p.hasGuessed);

    if (allGuessed && latestRoom.currentLocation) {
      // Sadece online oyuncuların sonuçlarını hesapla
      const results = onlinePlayers.map((player) => {
        const distance = player.currentGuess
          ? calculateDistance(latestRoom.currentLocation!, player.currentGuess)
          : 9999;
        const score = calculateScore(distance);

        return {
          odlayerId: player.id,
          playerName: player.name || "Oyuncu",
          guess: player.currentGuess || { lat: 0, lng: 0 },
          distance,
          score,
        };
      }).filter((r) => r.odlayerId);

      // Tüm oyuncuları güncelle (disconnect olanlar dahil - skorlarını koru)
      const updatedPlayers: { [key: string]: Player } = {};
      playerList.forEach((player) => {
        const result = results.find((r) => r.odlayerId === player.id);
        const currentRoundScores = player.roundScores || [];
        // Sadece online oyuncuların skorlarını güncelle (backward compat: status undefined = online)
        if (!player.status || player.status === 'online') {
          updatedPlayers[player.id] = {
            ...player,
            totalScore: (player.totalScore || 0) + (result?.score || 0),
            roundScores: [...currentRoundScores, result?.score || 0],
          };
        } else {
          // Disconnect olan oyuncuların mevcut state'ini koru
          updatedPlayers[player.id] = {
            ...player,
            roundScores: [...currentRoundScores, 0], // 0 puan
          };
        }
      });

      await update(ref(database, `rooms/${latestRoom.id}`), {
        status: "roundEnd",
        roundState: 'ended',
        roundResults: results,
        players: updatedPlayers,
      });
    }
  }, [room, playerId]);

  // Süre doldu - otomatik tahmin gönder
  // TIMER SPAM FIX: handleTimeUp için idempotent guard
  const hasHandledTimeUpRef = useRef<number | null>(null);

  const handleTimeUp = useCallback(async () => {
    if (!room || playerId !== room.hostId) return;

    // IDEMPOTENT GUARD: Bu round için zaten işlem yapıldıysa çık
    if (hasHandledTimeUpRef.current === room.currentRound) {
      console.log("handleTimeUp: Bu round için zaten işlem yapıldı, atlanıyor");
      trackDuplicateAttempt("timeUp", room.currentRound);
      return;
    }

    // RACE CONDITION GUARD: Round hesaplaması zaten devam ediyorsa bekle
    if (isProcessingRoundRef.current) {
      console.log("handleTimeUp: İşlem devam ediyor, atlanıyor");
      trackDuplicateAttempt("timeUp", room.currentRound);
      return;
    }

    trackEvent("timeUp", { roundId: room.currentRound });

    // İşlemi kilitle
    isProcessingRoundRef.current = true;
    hasHandledTimeUpRef.current = room.currentRound;

    try {
      const latestSnap = await get(ref(database, `rooms/${room.id}`));
      const latestRoom = latestSnap.val() as Room | null;

      // Durum kontrolü - playing değilse veya round değiştiyse çık
      if (!latestRoom?.players || latestRoom.status !== "playing") {
        console.log("handleTimeUp: Room status playing değil, atlanıyor");
        return;
      }

      // Round eşleşmesi kontrolü
      if (latestRoom.currentRound !== room.currentRound) {
        console.log("handleTimeUp: Round değişti, atlanıyor");
        return;
      }

      const playerList = Object.values(latestRoom.players);

      const results = playerList.map((player) => {
        const distance = player.currentGuess
          ? calculateDistance(latestRoom.currentLocation!, player.currentGuess)
          : 9999;
        const score = player.hasGuessed ? calculateScore(distance) : 0;

        return {
          odlayerId: player.id,
          playerName: player.name || "Oyuncu",
          guess: player.currentGuess || { lat: 0, lng: 0 },
          distance: player.hasGuessed ? distance : 9999,
          score,
        };
      }).filter((r) => r.odlayerId);

      const updatedPlayers: { [key: string]: Player } = {};
      playerList.forEach((player) => {
        const result = results.find((r) => r.odlayerId === player.id);
        const currentRoundScores = player.roundScores || [];
        updatedPlayers[player.id] = {
          ...player,
          totalScore: (player.totalScore || 0) + (result?.score || 0),
          roundScores: [...currentRoundScores, result?.score || 0],
          hasGuessed: true,
        };
      });

      await update(ref(database, `rooms/${latestRoom.id}`), {
        status: "roundEnd",
        roundState: 'ended',
        roundResults: results,
        players: updatedPlayers,
      });

      trackEvent("roundEnd", { roundId: latestRoom.currentRound, trigger: "timeUp" });
    } catch (err) {
      console.error("handleTimeUp hatası:", err);
      trackError(err instanceof Error ? err : String(err), "handleTimeUp");
    } finally {
      // Kilidi aç
      isProcessingRoundRef.current = false;
    }
  }, [room, playerId]);

  // Sonraki tura geç - Pano paketi ile
  const nextRoundWithPanoPackage = useCallback(
    async (panoPackage: PanoPackage) => {
      if (!room || playerId !== room.hostId) return;

      const isGameOver = room.currentRound >= room.totalRounds;

      if (isGameOver) {
        await update(ref(database, `rooms/${room.id}`), {
          status: "gameOver",
          roundState: 'ended',
        });
        trackEvent("gameEnd", { totalRounds: room.totalRounds });
      } else {
        // Sadece ONLINE oyuncuları al (backward compat: status undefined = online)
        const onlinePlayers = Object.values(room.players || {}).filter(
          (p) => !p.status || p.status === 'online'
        );
        const onlinePlayerCount = onlinePlayers.length;

        const updatedPlayers: { [key: string]: Player } = {};
        Object.values(room.players || {}).forEach((player) => {
          updatedPlayers[player.id] = {
            ...player,
            currentGuess: null,
            hasGuessed: false,
        movesUsed: 0,
          };
        });

        const now = Date.now();

        await update(ref(database, `rooms/${room.id}`), {
          status: "playing",
          currentRound: room.currentRound + 1,
          currentPanoPackageId: panoPackage.id,
          currentPanoPackage: panoPackage,
          currentLocation: { lat: panoPackage.pano0.lat, lng: panoPackage.pano0.lng },
          currentLocationName: panoPackage.locationName,
          players: updatedPlayers,
          roundResults: null,
          roundStartTime: now,
          // Round State Machine
          roundState: 'active',
          roundVersion: (room.roundVersion || 0) + 1,
          activePlayerCount: onlinePlayerCount,
          expectedGuesses: onlinePlayerCount,
          currentGuesses: 0,
        });

        trackEvent("roundStart", { roundId: room.currentRound + 1, panoPackageId: panoPackage.id });
      }
    },
    [room, playerId]
  );

  // Eski nextRound (geriye uyumluluk için)
  const nextRound = useCallback(
    async (location: Coordinates, panoId: string, locationName?: string) => {
      if (!room || playerId !== room.hostId) return;

      const isGameOver = room.currentRound >= room.totalRounds;

      if (isGameOver) {
        await update(ref(database, `rooms/${room.id}`), {
          status: "gameOver",
          roundState: 'ended',
        });
      } else {
        // Sadece ONLINE oyuncuları al (backward compat: status undefined = online)
        const onlinePlayers = Object.values(room.players || {}).filter(
          (p) => !p.status || p.status === 'online'
        );
        const onlinePlayerCount = onlinePlayers.length;

        const updatedPlayers: { [key: string]: Player } = {};
        Object.values(room.players || {}).forEach((player) => {
          updatedPlayers[player.id] = {
            ...player,
            currentGuess: null,
            hasGuessed: false,
        movesUsed: 0,
          };
        });

        const now = Date.now();

        await update(ref(database, `rooms/${room.id}`), {
          status: "playing",
          currentRound: room.currentRound + 1,
          currentLocation: location,
          currentPanoPackageId: panoId,
          currentLocationName: locationName || null,
          players: updatedPlayers,
          roundResults: null,
          roundStartTime: now,
          // Round State Machine
          roundState: 'active',
          roundVersion: (room.roundVersion || 0) + 1,
          activePlayerCount: onlinePlayerCount,
          expectedGuesses: onlinePlayerCount,
          currentGuesses: 0,
        });
      }
    },
    [room, playerId]
  );

  // Odadan ayrıl
  const leaveRoom = useCallback(async () => {
    if (!room || !playerId) return;

    const playerList = Object.values(room.players || {});

    if (playerList.length === 1) {
      // Son oyuncu - odayı sil
      await remove(ref(database, `rooms/${room.id}`));
    } else {
      // Oyuncuyu çıkar
      await remove(ref(database, `rooms/${room.id}/players/${playerId}`));

      // Host ayrılıyorsa yeni host ata
      if (playerId === room.hostId) {
        const newHost = playerList.find((p) => p.id !== playerId);
        if (newHost) {
          await update(ref(database, `rooms/${room.id}`), {
            hostId: newHost.id,
          });
          await update(ref(database, `rooms/${room.id}/players/${newHost.id}`), {
            isHost: true,
          });
        }
      }

      // Oyun sırasında ayrılan oyuncu için round kontrolü
      // RACE CONDITION FIX: İşlem devam ediyorsa bekle
      // DISCONNECT FIX: Sadece online oyuncuları say
      if (room.status === "playing" && !isProcessingRoundRef.current) {
        const remainingPlayers = playerList.filter((p) => p.id !== playerId);
        // Sadece online oyuncuları say (backward compat: status undefined = online)
        const onlineRemainingPlayers = remainingPlayers.filter((p) => !p.status || p.status === 'online');
        const allRemainingGuessed =
          onlineRemainingPlayers.length > 0 &&
          onlineRemainingPlayers.every((p) => p.hasGuessed);

        if (allRemainingGuessed && room.currentLocation) {
          // Kilitle
          isProcessingRoundRef.current = true;

          try {
            const results = onlineRemainingPlayers.map((player) => {
              const distance = player.currentGuess
                ? calculateDistance(room.currentLocation!, player.currentGuess)
                : 9999;
              const score = calculateScore(distance);

              return {
                odlayerId: player.id,
                playerName: player.name || "Oyuncu",
                guess: player.currentGuess || { lat: 0, lng: 0 },
                distance,
                score,
              };
            }).filter((r) => r.odlayerId);

            const updatedPlayers: { [key: string]: Player } = {};
            remainingPlayers.forEach((player) => {
              const result = results.find((r) => r.odlayerId === player.id);
              const currentRoundScores = player.roundScores || [];
              // Backward compat: status undefined = online
              if (!player.status || player.status === 'online') {
                updatedPlayers[player.id] = {
                  ...player,
                  totalScore: (player.totalScore || 0) + (result?.score || 0),
                  roundScores: [...currentRoundScores, result?.score || 0],
                };
              } else {
                updatedPlayers[player.id] = {
                  ...player,
                  roundScores: [...currentRoundScores, 0],
                };
              }
            });

            await update(ref(database, `rooms/${room.id}`), {
              status: "roundEnd",
              roundState: 'ended',
              roundResults: results,
              players: updatedPlayers,
            });
          } finally {
            isProcessingRoundRef.current = false;
          }
        }
      }
    }

    // Cleanup
    if (room?.id) {
      cleanupRoomData(room.id);
      // Session token temizle (kalıcı ayrılma)
      clearSessionToken(room.id);
    }

    trackEvent("leave", { roomId: room?.id });

    setRoom(null);
    setPlayerId("");
    setNotifications([]);
    previousPlayersRef.current = [];
    previousHostIdRef.current = null;
    isFirstLoadRef.current = true;
    notifiedJoinedRef.current.clear();
    notifiedLeftRef.current.clear();
  }, [room, playerId]);

  // Yeni oyun (sadece host)
  const restartGame = useCallback(async () => {
    if (!room || playerId !== room.hostId) return;

    const updatedPlayers: { [key: string]: Player } = {};
    Object.values(room.players || {}).forEach((player) => {
      updatedPlayers[player.id] = {
        ...player,
        totalScore: 0,
        currentGuess: null,
        hasGuessed: false,
        movesUsed: 0,
        roundScores: [],
      };

      // Rate limit sıfırla
      resetGuessLimit(player.id);
    });

    await update(ref(database, `rooms/${room.id}`), {
      status: "waiting",
      currentRound: 0,
      currentLocation: null,
      currentPanoPackageId: null,
      currentPanoPackage: null,
      currentLocationName: null,
      roundResults: null,
      roundStartTime: null,
      players: updatedPlayers,
      lastActivityAt: Date.now(),
      // Round State Machine reset
      roundState: 'waiting',
      roundVersion: 0,
      activePlayerCount: 0,
      expectedGuesses: 0,
      currentGuesses: 0,
    });

    // Room lifecycle reset
    setupRoomCleanup({ ...room, status: "waiting" });
  }, [room, playerId]);

  const currentPlayer = room?.players?.[playerId] || null;
  const isHost = playerId === room?.hostId;
  const playersList = room?.players ? Object.values(room.players) : [];

  return {
    room,
    playerId,
    playerName,
    currentPlayer,
    isHost,
    players: playersList,
    error,
    isLoading,
    // Bildirim sistemi
    notifications,
    dismissNotification,
    // Aksiyonlar
    createRoom,
    joinRoom,
    setGameMode,
    startGame,
    startGameWithPanoPackage,
    submitGuess,
    checkAllGuessed,
    handleTimeUp,
    nextRound,
    nextRoundWithPanoPackage,
    leaveRoom,
    restartGame,
  };
}
