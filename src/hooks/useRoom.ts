"use client";

/**
 * useRoom Hook
 * Oda yönetimi - Mod seçimi, timer, pano paketi desteği
 */

import { useState, useEffect, useCallback } from "react";
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
} from "@/utils";

export function useRoom() {
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Odayı dinle ve otomatik tahmin kontrolü yap
  useEffect(() => {
    if (!room?.id) return;

    const roomRef = ref(database, `rooms/${room.id}`);
    const unsubscribe = onValue(roomRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const roomData = data as Room;
        setRoom(roomData);

        // Sadece host otomatik kontrol yapsın (race condition önleme)
        // Ve sadece "playing" durumundayken
        if (playerId === roomData.hostId && roomData.status === "playing" && roomData.players) {
          const playerList = Object.values(roomData.players);
          const allGuessed = playerList.length > 0 && playerList.every((p) => p.hasGuessed);

          if (allGuessed && roomData.currentLocation) {
            // Kısa bir gecikme ile sonuçları hesapla (Firebase sync için)
            setTimeout(async () => {
              // Tekrar kontrol et (status değişmiş olabilir)
              const freshSnap = await get(ref(database, `rooms/${roomData.id}`));
              const freshRoom = freshSnap.val() as Room | null;

              if (freshRoom && freshRoom.status === "playing") {
                // Sonuçları hesapla
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

                // Skorları güncelle
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

                console.log("Tüm oyuncular tahmin etti - sonuçlar hesaplandı");
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
  }, [room?.id, playerId]);

  // Oda oluştur
  const createRoom = useCallback(async (name: string, gameMode: GameMode = "urban") => {
    setIsLoading(true);
    setError(null);

    try {
      const roomCode = generateRoomCode();
      const odlayerId = generatePlayerId();
      const modeConfig = GAME_MODE_CONFIG[gameMode];

      const newPlayer: Player = {
        id: odlayerId,
        name: name,
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

        // Oyun modu
        gameMode: gameMode,
        timeLimit: modeConfig.timeLimit,
        moveLimit: modeConfig.moveLimit,

        // Pano paketi
        currentPanoPackageId: null,
        currentPanoPackage: null,
        currentLocation: null,
        currentLocationName: null,

        // Round
        roundResults: null,
        roundStartTime: null,
      };

      await set(ref(database, `rooms/${roomCode}`), newRoom);

      setPlayerId(odlayerId);
      setPlayerName(name);
      setRoom(newRoom);

      return roomCode;
    } catch (err) {
      console.error("Oda oluşturma hatası:", err);
      setError("Oda oluşturulamadı. Lütfen tekrar deneyin.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Odaya katıl
  const joinRoom = useCallback(async (roomCode: string, name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const roomRef = ref(database, `rooms/${roomCode}`);
      const snapshot = await get(roomRef);

      if (!snapshot.exists()) {
        setError("Oda bulunamadı");
        return false;
      }

      const roomData = snapshot.val() as Room;

      if (roomData.status !== "waiting") {
        setError("Oyun zaten başlamış");
        return false;
      }

      const playerCount = Object.keys(roomData.players || {}).length;
      if (playerCount >= 8) {
        setError("Oda dolu (max 8 kişi)");
        return false;
      }

      const odlayerId = generatePlayerId();

      const newPlayer: Player = {
        id: odlayerId,
        name: name,
        isHost: false,
        totalScore: 0,
        currentGuess: null,
        hasGuessed: false,
        roundScores: [],
      };

      await update(ref(database, `rooms/${roomCode}/players`), {
        [odlayerId]: newPlayer,
      });

      setPlayerId(odlayerId);
      setPlayerName(name);
      setRoom({ ...roomData, id: roomCode });

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

      // Tüm oyuncuların guess'lerini sıfırla
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

  // Tahmin gönder
  const submitGuess = useCallback(
    async (guess: Coordinates) => {
      if (!room || !playerId) return;

      await update(ref(database, `rooms/${room.id}/players/${playerId}`), {
        currentGuess: guess,
        hasGuessed: true,
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

    // Zaten roundEnd veya gameOver durumundaysa tekrar hesaplama yapma
    if (latestRoom.status !== "playing") return;

    const playerList = Object.values(latestRoom.players);
    const allGuessed =
      playerList.length > 0 && playerList.every((p) => p.hasGuessed);

    if (allGuessed && latestRoom.currentLocation) {
      // Sonuçları hesapla
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

      // Skorları güncelle
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

  // Süre doldu - otomatik tahmin gönder (tahmin yapmayanlar için 0 puan)
  const handleTimeUp = useCallback(async () => {
    if (!room || playerId !== room.hostId) return;

    const latestSnap = await get(ref(database, `rooms/${room.id}`));
    const latestRoom = latestSnap.val() as Room | null;

    if (!latestRoom?.players || latestRoom.status !== "playing") return;

    const playerList = Object.values(latestRoom.players);

    // Sonuçları hesapla (tahmin yapmayanlar 0 puan)
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

    // Skorları güncelle
    const updatedPlayers: { [key: string]: Player } = {};
    playerList.forEach((player) => {
      const result = results.find((r) => r.odlayerId === player.id);
      const currentRoundScores = player.roundScores || [];
      updatedPlayers[player.id] = {
        ...player,
        totalScore: (player.totalScore || 0) + (result?.score || 0),
        roundScores: [...currentRoundScores, result?.score || 0],
        hasGuessed: true, // Süre dolduğunda herkes "tahmin yapmış" sayılır
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
      await remove(ref(database, `rooms/${room.id}`));
    } else {
      await remove(ref(database, `rooms/${room.id}/players/${playerId}`));

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

      // Oyun sırasında birisi ayrılırsa kontrol et
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

    setRoom(null);
    setPlayerId("");
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
    });
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
