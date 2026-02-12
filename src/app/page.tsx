"use client";

import { useState, useEffect, useRef } from "react";
import { useRoom, useStreetView, useGuessMap, useTimer } from "@/hooks";
import { Coordinates, GameMode, AD_FREQUENCY_LIMIT } from "@/types";
import { getRandomPanoPackage, onNewGameStart, initStreetViewService } from "@/services/panoService";
import { MenuScreen } from "@/components/screens/MenuScreen";
import { LobbyScreen } from "@/components/screens/LobbyScreen";
import { GameScreen } from "@/components/screens/GameScreen";
import { GameErrorBoundary } from "@/components/shared/ErrorBoundary";
import { trackError } from "@/utils/telemetry";

export default function HomePage() {
  // ==================== STATE ====================
  const [screen, setScreen] = useState<"menu" | "lobby" | "game">("menu");
  const [nameInput, setNameInput] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [selectedMode, setSelectedMode] = useState<GameMode>("urban");
  const [copied, setCopied] = useState(false);
  const [guessLocation, setGuessLocation] = useState<Coordinates | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [lastAdTime, setLastAdTime] = useState(0);

  // ==================== HOOKS ====================
  const {
    room, playerId, currentPlayer, isHost, players, error, isLoading,
    connectionState, notifications, dismissNotification,
    createRoom, joinRoom, setGameMode, startGame, startGameWithPanoPackage,
    submitGuess, checkAllGuessed, handleTimeUp, nextRound, nextRoundWithPanoPackage,
    leaveRoom, restartGame,
  } = useRoom();

  const {
    isLoading: streetViewLoading, streetViewRef, loadNewLocation,
    showStreetView, showPanoPackage, initializeGoogleMaps,
    setMoves, resetMoves, movesRemaining, movesUsed,
    isMovementLocked, showBudgetWarning, returnToStart,
    navigationError,
  } = useStreetView(room?.id, playerId);

  const { guessMapRef, initializeMap, resetMap } = useGuessMap(setGuessLocation);

  const { timeRemaining, formattedTime, isRunning: timerRunning, percentRemaining } = useTimer({
    initialTime: room?.timeLimit || 90,
    onTimeUp: () => {
      if (isHost) handleTimeUp();
    },
    serverStartTime: room?.roundStartTime || null,
  });

  // ==================== REFS ====================
  const prevRoundRef = useRef<number | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const lastShownPanoRoundRef = useRef<string | null>(null);

  // ==================== EFFECTS ====================

  // Initialize Street View and map when game starts
  useEffect(() => {
    if (screen !== "game" || !room) return;
    if (room.status !== "playing") return;

    // DEDUP GUARD: Prevents useEffect double-fire race condition
    const panoKey = room.currentPanoPackage?.id || room.currentPanoPackageId || "";
    const dedupKey = `${room.currentRound}_${panoKey}`;
    if (lastShownPanoRoundRef.current === dedupKey) {
      console.log(`[Effect] Skipping duplicate effect for ${dedupKey}`);
      return;
    }
    lastShownPanoRoundRef.current = dedupKey;

    let cancelled = false;
    let tries = 0;

    const run = async () => {
      if (cancelled) return;

      if (!streetViewRef.current) {
        tries += 1;
        if (tries < 20) setTimeout(run, 50);
        return;
      }

      await initializeGoogleMaps();
      initializeMap();

      if (room.currentPanoPackage) {
        setMoves(room.moveLimit || 3);
        await showPanoPackage(room.currentPanoPackage);
      } else if (room.currentPanoPackageId) {
        setMoves(room.moveLimit || 3);
        await showStreetView(room.currentPanoPackageId);
      }
    };

    setTimeout(run, 0);

    return () => { cancelled = true; };
  }, [screen, room?.status, room?.currentRound]);

  // Reset state on round change
  useEffect(() => {
    if (room?.status === "playing" && room.currentRound !== prevRoundRef.current) {
      prevRoundRef.current = room.currentRound;
      prevStatusRef.current = room.status;

      setGuessLocation(null);
      resetMap();
      resetMoves();
      setMoves(room.moveLimit || 3);

      console.log(`Round ${room.currentRound} state reset done, timer managed by useTimer hook`);
      setMapExpanded(false);
    }

    if (room?.status) prevStatusRef.current = room.status;

    if (room?.status === "waiting") {
      prevRoundRef.current = null;
    }
  }, [room?.currentRound, room?.status, room?.timeLimit, room?.moveLimit, resetMap, resetMoves, setMoves]);

  // Navigate to game/lobby on status change
  useEffect(() => {
    if (room?.status === "playing" || room?.status === "roundEnd") {
      setScreen("game");
    } else if (room?.status === "waiting" && screen === "game") {
      setScreen("lobby");
    }
  }, [room?.status, screen]);

  // Body class for mobile scroll control
  useEffect(() => {
    if (screen === "game") {
      document.body.classList.add("game-active");
    } else {
      document.body.classList.remove("game-active");
    }
    return () => { document.body.classList.remove("game-active"); };
  }, [screen]);

  // Return to menu on room deletion or error
  useEffect(() => {
    if (screen !== "menu" && !room && !isLoading) {
      setScreen("menu");
      resetMap();
      setGuessLocation(null);
      resetMoves();
      if (error) {
        setShowToast(error === "Oda silindi veya bulunamadı" ? "Oda kapatıldı" : error);
        setTimeout(() => setShowToast(null), 3000);
      }
    }
  }, [room, error, screen, isLoading]);

  // Visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && screen === "game" && !room) {
        setScreen("menu");
        resetMap();
        setGuessLocation(null);
        resetMoves();
        setShowToast("Bağlantı koptu, yeniden bağlanın");
        setTimeout(() => setShowToast(null), 3000);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [screen, room]);

  // Global unhandled promise rejection handler
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const error = event.reason;

      // WHITELIST: Firebase RTDB internal transaction abort
      // When update() and runTransaction() target overlapping paths concurrently,
      // Firebase SDK internally calls repoAbortTransactionsOnNode which creates
      // Error("set") and rejects the transaction's internal promise. This is NOT
      // catchable by our code — it's a Firebase SDK implementation detail.
      // Stack: repoAbortTransactionsOnNode → repoAbortTransactions → repoUpdate → update → updatePresence
      // Match criteria: Error with message "set" AND stack containing "repoAbortTransactionsOnNode"
      const isFirebaseInternalAbort =
        error instanceof Error &&
        error.message === "set" &&
        error.stack?.includes("repoAbortTransactionsOnNode");

      if (isFirebaseInternalAbort) {
        // Count separately — not an app error
        if ((window as any).__mpCounters) {
          (window as any).__mpCounters.firebaseInternalAbortCount++;
        }
        console.warn("[FirebaseInternalAbort] SDK transaction abort (safe to ignore)", error.stack?.split("\n")[1]?.trim());
        event.preventDefault(); // Suppress browser error reporting for this known SDK behavior
        return;
      }

      console.error("[UnhandledRejection]", error);
      trackError(error instanceof Error ? error : String(error), "unhandledRejection");
      // Increment CHAOS counter if available
      if ((window as any).__mpCounters) {
        (window as any).__mpCounters.unhandledRejectionCount++;
      }
      setShowToast("Beklenmeyen bir hata oluştu");
      setTimeout(() => setShowToast(null), 3000);
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  // ==================== HANDLERS ====================

  const handleCreateRoom = async () => {
    const roomCode = await createRoom(nameInput, selectedMode);
    if (roomCode) setScreen("lobby");
  };

  const handleJoinRoom = async () => {
    const success = await joinRoom(roomInput, nameInput);
    if (success) setScreen("lobby");
  };

  const gameStartingRef = useRef(false);
  const handleStartGame = async () => {
    if (!room) return;
    if (gameStartingRef.current) return;
    gameStartingRef.current = true;

    try {
      await initializeGoogleMaps();
      initStreetViewService();
      await onNewGameStart();
      lastShownPanoRoundRef.current = null;

      const panoPackage = await getRandomPanoPackage(room.gameMode || "urban");
      if (panoPackage) {
        await startGameWithPanoPackage(panoPackage);
        setScreen("game");
      } else {
        const location = await loadNewLocation();
        if (location) {
          await startGame(location.coordinates, location.panoId, location.locationName);
          setScreen("game");
        }
      }
    } finally {
      gameStartingRef.current = false;
    }
  };

  const handleSubmitGuess = async () => {
    if (!guessLocation) return;
    await submitGuess(guessLocation);
  };

  const showAdIfNeeded = () => {
    const now = Date.now();
    if (now - lastAdTime > AD_FREQUENCY_LIMIT) {
      console.log("📺 Reklam gösterilecek");
      setLastAdTime(now);
    }
  };

  const handleNextRound = async () => {
    if (!room) return;

    resetMap();
    setGuessLocation(null);
    resetMoves();
    setMoves(room.moveLimit || 3);

    const panoPackage = await getRandomPanoPackage(room.gameMode || "urban");
    if (panoPackage) {
      await nextRoundWithPanoPackage(panoPackage);
    } else {
      const location = await loadNewLocation();
      if (location) {
        await nextRound(location.coordinates, location.panoId, location.locationName);
      }
    }

    showAdIfNeeded();
  };

  const handleRestartGame = async () => {
    resetMap();
    setGuessLocation(null);
    resetMoves();
    await restartGame();
    setScreen("lobby");
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    setScreen("menu");
    resetMap();
    setGuessLocation(null);
    resetMoves();
  };

  const copyRoomCode = () => {
    if (room?.id) {
      navigator.clipboard.writeText(room.id);
      setCopied(true);
      setShowToast("Kod kopyalandı!");
      setTimeout(() => {
        setCopied(false);
        setShowToast(null);
      }, 2000);
    }
  };

  const shareWhatsApp = () => {
    if (room?.id) {
      const text = `🎯 TürkiyeGuessr'da bana katıl!\n\nOda Kodu: ${room.id}\n\nhttps://turkiyeguessr.xyz`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    }
  };

  const handleReturnToMenu = () => {
    setScreen("menu");
    resetMap();
    setGuessLocation(null);
    resetMoves();
  };

  // ==================== RENDER ====================

  if (screen === "menu") {
    return (
      <MenuScreen
        nameInput={nameInput}
        setNameInput={setNameInput}
        roomInput={roomInput}
        setRoomInput={setRoomInput}
        selectedMode={selectedMode}
        setSelectedMode={setSelectedMode}
        error={error}
        isLoading={isLoading}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
      />
    );
  }

  if (screen === "lobby" && room) {
    return (
      <GameErrorBoundary onReturnToMenu={handleReturnToMenu}>
        <LobbyScreen
          room={room}
          playerId={playerId}
          players={players}
          isHost={isHost}
          streetViewLoading={streetViewLoading}
          copied={copied}
          showToast={showToast}
          onCopyRoomCode={copyRoomCode}
          onShareWhatsApp={shareWhatsApp}
          onSetGameMode={setGameMode}
          onStartGame={handleStartGame}
          onLeaveRoom={handleLeaveRoom}
        />
      </GameErrorBoundary>
    );
  }

  if (screen === "game") {
    return (
      <GameErrorBoundary onReturnToMenu={handleReturnToMenu}>
        <GameScreen
        room={room}
        playerId={playerId}
        currentPlayer={currentPlayer}
        players={players}
        isHost={isHost}
        streetViewRef={streetViewRef}
        guessMapRef={guessMapRef}
        streetViewLoading={streetViewLoading}
        navigationError={navigationError}
        movesRemaining={movesRemaining}
        isMovementLocked={isMovementLocked}
        showBudgetWarning={showBudgetWarning}
        timeRemaining={timeRemaining}
        formattedTime={formattedTime}
        mapExpanded={mapExpanded}
        setMapExpanded={setMapExpanded}
        guessLocation={guessLocation}
        showToast={showToast}
        connectionState={connectionState}
        notifications={notifications}
        dismissNotification={dismissNotification}
        onSubmitGuess={handleSubmitGuess}
        onNextRound={handleNextRound}
        onRestart={handleRestartGame}
        onLeaveRoom={handleLeaveRoom}
        returnToStart={returnToStart}
        onReturnToMenu={handleReturnToMenu}
      />
      </GameErrorBoundary>
    );
  }

  return null;
}
