"use client";

import { useState, useEffect, useCallback } from "react";
import { database, ref, set, get, onValue, update, remove } from "@/config/firebase";
import { Room, Player, Coordinates } from "@/types";
import { generateRoomCode, generatePlayerId, calculateDistance, calculateScore } from "@/utils";

export function useRoom() {
  const [room, setRoom] = useState<Room | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [playerName, setPlayerName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Odayı dinle
  useEffect(() => {
    if (!room?.id) return;

    const roomRef = ref(database, `rooms/${room.id}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoom(data as Room);
      } else {
        setRoom(null);
        setError("Oda silindi veya bulunamadı");
      }
    });

    return () => unsubscribe();
  }, [room?.id]);

  // Oda oluştur
  const createRoom = useCallback(async (name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const roomCode = generateRoomCode();
      const odlayerId = generatePlayerId();

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
        currentLocation: null,
        currentPanoId: null,
        roundResults: null,
      };

      await set(ref(database, `rooms/${roomCode}`), newRoom);

      setPlayerId(odlayerId);
      setPlayerName(name);
      setRoom(newRoom);

      return roomCode;
    } catch (err) {
      setError("Oda oluşturulamadı");
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
      setError("Odaya katılınamadı");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Oyunu başlat (sadece host)
  const startGame = useCallback(async (location: Coordinates, panoId: string) => {
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
      currentLocation: location,
      currentPanoId: panoId,
      players: updatedPlayers,
      roundResults: null,
    });
  }, [room, playerId]);

  // Tahmin gönder
  const submitGuess = useCallback(async (guess: Coordinates) => {
    if (!room || !playerId) return;

    await update(ref(database, `rooms/${room.id}/players/${playerId}`), {
      currentGuess: guess,
      hasGuessed: true,
    });
  }, [room, playerId]);

  // Tüm tahminler geldi mi kontrol et ve sonuçları hesapla
  const checkAllGuessed = useCallback(async () => {
    if (!room || playerId !== room.hostId) return;

    // State bazen gecikmeli güncellenebildiği için en güncel odayı DB'den çek
    const latestSnap = await get(ref(database, `rooms/${room.id}`));
    const latestRoom = latestSnap.val() as Room | null;

    if (!latestRoom?.players) return;

    const playerList = Object.values(latestRoom.players);
    const allGuessed = playerList.length > 0 && playerList.every((p) => p.hasGuessed);

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


  // Sonraki tura geç (sadece host)
  const nextRound = useCallback(async (location: Coordinates, panoId: string) => {
    if (!room || playerId !== room.hostId) return;

    const isGameOver = room.currentRound >= room.totalRounds;

    if (isGameOver) {
      await update(ref(database, `rooms/${room.id}`), {
        status: "gameOver",
      });
    } else {
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
        currentRound: room.currentRound + 1,
        currentLocation: location,
        currentPanoId: panoId,
        players: updatedPlayers,
        roundResults: null,
      });
    }
  }, [room, playerId]);

  // Odadan ayrıl
  const leaveRoom = useCallback(async () => {
    if (!room || !playerId || !room.players) return;

    const playerList = Object.values(room.players);

    if (playerList.length === 1) {
      // Son kişiysen odayı sil
      await remove(ref(database, `rooms/${room.id}`));
    } else {
      // Oyuncuyu sil
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
      currentPanoId: null,
      roundResults: null,
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
    startGame,
    submitGuess,
    checkAllGuessed,
    nextRound,
    leaveRoom,
    restartGame,
  };
}
