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
import { database, ref, set, get, onValue, update, remove } from "@/config/firebase";
import {
  Room,
  Player,
  Coordinates,
  GameMode,
  PanoPackage,
  GAME_MODE_CONFIG,
} from "@/types";
import {
  generateRoomCode,
  generatePlayerId,
  calculateDistance,
  calculateScore,
  canCreateRoom,
  canJoinRoom,
  canSubmitGuess,
  resetGuessLimit,
  getRoomCreateCooldown,
} from "@/utils";
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

  // Odayı dinle ve otomatik tahmin kontrolü yap
  useEffect(() => {
    if (!room?.id) return;

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

        // === OYUNCU AYRILDI MI KONTROLÜ ===
        if (previousPlayersRef.current.length > 0) {
          const leftPlayers = previousPlayersRef.current.filter(
            id => !currentPlayerIds.includes(id)
          );

          // Ayrılan oyuncular için bildirim
          leftPlayers.forEach(leftPlayerId => {
            if (leftPlayerId !== playerId) {
              // Sadece başkası ayrıldıysa bildirim göster
              const leftPlayerName = room.players?.[leftPlayerId]?.name || "Bir oyuncu";
              addNotification("player_left", `${leftPlayerName} oyundan ayrıldı`, leftPlayerName);
            }
          });

          // Yeni katılan oyuncular için bildirim
          const joinedPlayers = currentPlayerIds.filter(
            id => !previousPlayersRef.current.includes(id)
          );

          joinedPlayers.forEach(joinedPlayerId => {
            if (joinedPlayerId !== playerId) {
              const joinedPlayerName = currentPlayerNames[joinedPlayerId] || "Bir oyuncu";
              addNotification("player_joined", `${joinedPlayerName} odaya katıldı`, joinedPlayerName);
            }
          });
        }

        // === HOST DEĞİŞTİ Mİ KONTROLÜ ===
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
        if (playerId === roomData.hostId && roomData.status === "playing" && roomData.players) {
          const playerList = Object.values(roomData.players);
          const allGuessed = playerList.length > 0 && playerList.every((p) => p.hasGuessed);

          if (allGuessed && roomData.currentLocation) {
            // Kısa bir gecikme ile sonuçları hesapla
            setTimeout(async () => {
              const freshSnap = await get(ref(database, `rooms/${roomData.id}`));
              const freshRoom = freshSnap.val() as Room | null;

              if (freshRoom && freshRoom.status === "playing") {
                const freshPlayers = Object.values(freshRoom.players || {});
                const results = freshPlayers.map((player) => {
                  const distance = player.currentGuess
                    ? calculateDistance(freshRoom.currentLocation!, player.currentGuess)
                    : 9999;
                  const score = calculateScore(distance);

                  return {
                    odlayerId: player.id,
                    playerName: player.name,
                    guess: player.currentGuess || { lat: 0, lng: 0 },
                    distance,
                    score,
                  };
                });

                const updatedPlayers: { [key: string]: Player } = {};
                freshPlayers.forEach((player) => {
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
                  roundResults: results,
                  players: updatedPlayers,
                });
              }
            }, 500);
          }
        }
      } else {
        setRoom(null);
        setError("Oda silindi veya bulunamadı");
      }
    });

    return () => unsubscribe();
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
      const odlayerId = generatePlayerId();
      const modeConfig = GAME_MODE_CONFIG[gameMode];
      const now = Date.now();

      const newPlayer: Player = {
        id: odlayerId,
        name: name.trim(),
        isHost: true,
        totalScore: 0,
        currentGuess: null,
        hasGuessed: false,
        roundScores: [],
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

      // Referansları başlat
      previousPlayersRef.current = [odlayerId];
      previousHostIdRef.current = odlayerId;

      // Room lifecycle tracking
      setupRoomCleanup(newRoom);

      return roomCode;
    } catch (err) {
      console.error("Oda oluşturma hatası:", err);
      setError("Oda oluşturulamadı. Lütfen tekrar deneyin.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Odaya katıl (Rate Limited)
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
      const roomRef = ref(database, `rooms/${roomCode.toUpperCase()}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        setError(ERROR_MESSAGES.ROOM_NOT_FOUND);
        return false;
      }

      const roomData = snapshot.val() as Room;

      if (roomData.status !== "waiting") {
        setError(ERROR_MESSAGES.GAME_ALREADY_STARTED);
        return false;
      }

      const playerCount = Object.keys(roomData.players || {}).length;
      if (playerCount >= 8) {
        setError(ERROR_MESSAGES.ROOM_FULL);
        return false;
      }

      const odlayerId = generatePlayerId();
      const normalizedRoomCode = roomCode.toUpperCase();

      const newPlayer: Player = {
        id: odlayerId,
        name: name.trim(),
        isHost: false,
        totalScore: 0,
        currentGuess: null,
        hasGuessed: false,
        roundScores: [],
      };

      // Timestamp ile kaydet
      const playerWithTimestamp = {
        ...newPlayer,
        joinedAt: Date.now(),
      };

      await update(ref(database, `rooms/${normalizedRoomCode}/players`), {
        [odlayerId]: playerWithTimestamp,
      });

      // Son aktivite güncelle
      await update(ref(database, `rooms/${normalizedRoomCode}`), {
        lastActivityAt: Date.now(),
      });

      setPlayerId(odlayerId);
      setPlayerName(name.trim());
      setRoom({ ...roomData, id: normalizedRoomCode });

      // Referansları başlat
      previousPlayersRef.current = [...Object.keys(roomData.players || {}), odlayerId];
      previousHostIdRef.current = roomData.hostId;

      // Player activity tracking
      recordPlayerActivity(normalizedRoomCode, odlayerId);

      return true;
    } catch (err) {
      console.error("Odaya katılma hatası:", err);
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

      const updatedPlayers: { [key: string]: Player } = {};
      Object.values(room.players).forEach((player) => {
        updatedPlayers[player.id] = {
          ...player,
          currentGuess: null,
          hasGuessed: false,
        };
      });

      await update(ref(database, `rooms/${room.id}`), {
        status: "playing",
        currentRound: 1,
        currentPanoPackageId: panoPackage.id,
        currentPanoPackage: panoPackage,
        currentLocation: { lat: panoPackage.pano0.lat, lng: panoPackage.pano0.lng },
        currentLocationName: panoPackage.locationName,
        players: updatedPlayers,
        roundResults: null,
        roundStartTime: Date.now(),
      });
    },
    [room, playerId]
  );

  // Eski startGame (geriye uyumluluk için)
  const startGame = useCallback(
    async (location: Coordinates, panoId: string, locationName?: string) => {
      if (!room || playerId !== room.hostId) return;

      const updatedPlayers: { [key: string]: Player } = {};
      Object.values(room.players).forEach((player) => {
        updatedPlayers[player.id] = {
          ...player,
          currentGuess: null,
          hasGuessed: false,
        };
      });

      await update(ref(database, `rooms/${room.id}`), {
        status: "playing",
        currentRound: 1,
        currentLocation: location,
        currentPanoPackageId: panoId,
        currentLocationName: locationName || null,
        players: updatedPlayers,
        roundResults: null,
        roundStartTime: Date.now(),
      });
    },
    [room, playerId]
  );

  // Tahmin gönder (Rate Limited + Validated)
  const submitGuess = useCallback(
    async (guess: Coordinates) => {
      if (!room || !playerId) return;

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

      await update(ref(database, `rooms/${room.id}/players/${playerId}`), {
        currentGuess: guess,
        hasGuessed: true,
        lastActiveAt: Date.now(),
      });
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
    const allGuessed = playerList.length > 0 && playerList.every((p) => p.hasGuessed);

    if (allGuessed && latestRoom.currentLocation) {
      const results = playerList.map((player) => {
        const distance = player.currentGuess
          ? calculateDistance(latestRoom.currentLocation!, player.currentGuess)
          : 9999;
        const score = calculateScore(distance);

        return {
          odlayerId: player.id,
          playerName: player.name,
          guess: player.currentGuess || { lat: 0, lng: 0 },
          distance,
          score,
        };
      });

      const updatedPlayers: { [key: string]: Player } = {};
      playerList.forEach((player) => {
        const result = results.find((r) => r.odlayerId === player.id);
        const currentRoundScores = player.roundScores || [];
        updatedPlayers[player.id] = {
          ...player,
          totalScore: (player.totalScore || 0) + (result?.score || 0),
          roundScores: [...currentRoundScores, result?.score || 0],
        };
      });

      await update(ref(database, `rooms/${latestRoom.id}`), {
        status: "roundEnd",
        roundResults: results,
        players: updatedPlayers,
      });
    }
  }, [room, playerId]);

  // Süre doldu - otomatik tahmin gönder
  const handleTimeUp = useCallback(async () => {
    if (!room || playerId !== room.hostId) return;

    const latestSnap = await get(ref(database, `rooms/${room.id}`));
    const latestRoom = latestSnap.val() as Room | null;

    if (!latestRoom?.players || latestRoom.status !== "playing") return;

    const playerList = Object.values(latestRoom.players);

    const results = playerList.map((player) => {
      const distance = player.currentGuess
        ? calculateDistance(latestRoom.currentLocation!, player.currentGuess)
        : 9999;
      const score = player.hasGuessed ? calculateScore(distance) : 0;

      return {
        odlayerId: player.id,
        playerName: player.name,
        guess: player.currentGuess || { lat: 0, lng: 0 },
        distance: player.hasGuessed ? distance : 9999,
        score,
      };
    });

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
      roundResults: results,
      players: updatedPlayers,
    });
  }, [room, playerId]);

  // Sonraki tura geç - Pano paketi ile
  const nextRoundWithPanoPackage = useCallback(
    async (panoPackage: PanoPackage) => {
      if (!room || playerId !== room.hostId) return;

      const isGameOver = room.currentRound >= room.totalRounds;

      if (isGameOver) {
        await update(ref(database, `rooms/${room.id}`), {
          status: "gameOver",
        });
      } else {
        const updatedPlayers: { [key: string]: Player } = {};
        Object.values(room.players).forEach((player) => {
          updatedPlayers[player.id] = {
            ...player,
            currentGuess: null,
            hasGuessed: false,
          };
        });

        await update(ref(database, `rooms/${room.id}`), {
          status: "playing",
          currentRound: room.currentRound + 1,
          currentPanoPackageId: panoPackage.id,
          currentPanoPackage: panoPackage,
          currentLocation: { lat: panoPackage.pano0.lat, lng: panoPackage.pano0.lng },
          currentLocationName: panoPackage.locationName,
          players: updatedPlayers,
          roundResults: null,
          roundStartTime: Date.now(),
        });
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
        });
      } else {
        const updatedPlayers: { [key: string]: Player } = {};
        Object.values(room.players).forEach((player) => {
          updatedPlayers[player.id] = {
            ...player,
            currentGuess: null,
            hasGuessed: false,
          };
        });

        await update(ref(database, `rooms/${room.id}`), {
          status: "playing",
          currentRound: room.currentRound + 1,
          currentLocation: location,
          currentPanoPackageId: panoId,
          currentLocationName: locationName || null,
          players: updatedPlayers,
          roundResults: null,
          roundStartTime: Date.now(),
        });
      }
    },
    [room, playerId]
  );

  // Odadan ayrıl
  const leaveRoom = useCallback(async () => {
    if (!room || !playerId || !room.players) return;

    const playerList = Object.values(room.players);

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
      if (room.status === "playing") {
        const remainingPlayers = playerList.filter((p) => p.id !== playerId);
        const allRemainingGuessed =
          remainingPlayers.length > 0 &&
          remainingPlayers.every((p) => p.hasGuessed);

        if (allRemainingGuessed && room.currentLocation) {
          const results = remainingPlayers.map((player) => {
            const distance = player.currentGuess
              ? calculateDistance(room.currentLocation!, player.currentGuess)
              : 9999;
            const score = calculateScore(distance);

            return {
              odlayerId: player.id,
              playerName: player.name,
              guess: player.currentGuess || { lat: 0, lng: 0 },
              distance,
              score,
            };
          });

          const updatedPlayers: { [key: string]: Player } = {};
          remainingPlayers.forEach((player) => {
            const result = results.find((r) => r.odlayerId === player.id);
            const currentRoundScores = player.roundScores || [];
            updatedPlayers[player.id] = {
              ...player,
              totalScore: (player.totalScore || 0) + (result?.score || 0),
              roundScores: [...currentRoundScores, result?.score || 0],
            };
          });

          await update(ref(database, `rooms/${room.id}`), {
            status: "roundEnd",
            roundResults: results,
            players: updatedPlayers,
          });
        }
      }
    }

    // Cleanup
    if (room?.id) {
      cleanupRoomData(room.id);
    }

    setRoom(null);
    setPlayerId("");
    setNotifications([]);
    previousPlayersRef.current = [];
    previousHostIdRef.current = null;
  }, [room, playerId]);

  // Yeni oyun (sadece host)
  const restartGame = useCallback(async () => {
    if (!room || playerId !== room.hostId) return;

    const updatedPlayers: { [key: string]: Player } = {};
    Object.values(room.players).forEach((player) => {
      updatedPlayers[player.id] = {
        ...player,
        totalScore: 0,
        currentGuess: null,
        hasGuessed: false,
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
