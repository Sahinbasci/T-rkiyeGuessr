"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRoom, useStreetView, useGuessMap, useTimer, useAsyncLock } from "@/hooks";
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
  // BUG-005: Name validation error state
  const [nameError, setNameError] = useState<string | null>(null);

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
    navigationError, panoLoadFailed,
  } = useStreetView(room?.id, playerId);

  const { guessMapRef, initializeMap, resetMap } = useGuessMap(setGuessLocation);

  const { timeRemaining, formattedTime, isRunning: timerRunning, percentRemaining } = useTimer({
    initialTime: room?.timeLimit || 90,
    onTimeUp: () => {
      if (isHost) handleTimeUp();
    },
    serverStartTime: room?.roundStartTime || null,
  });

  // BUG-004: Async lock for all critical actions
  const { isLocked, run: runLocked, isKeyLocked } = useAsyncLock();

  // ==================== REFS ====================
  const prevRoundRef = useRef<number | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const lastShownPanoRoundRef = useRef<string | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ==================== HELPERS ====================

  const showTrackedToast = useCallback((msg: string, duration = 3000) => {
    setShowToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      toastTimerRef.current = null;
      setShowToast(null);
    }, duration);
  }, []);

  // BUG-005: Name validation
  const validateName = useCallback((name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Lütfen bir oyuncu adı girin");
      // Focus input
      document.getElementById("player-name-input")?.focus();
      return false;
    }
    if (trimmed.length > 20) {
      setNameError("İsim en fazla 20 karakter olabilir");
      return false;
    }
    setNameError(null);
    return true;
  }, []);

  // Clear name error on input change
  useEffect(() => {
    if (nameInput.trim()) setNameError(null);
  }, [nameInput]);

  // ==================== EFFECTS ====================

  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // BUG-003: Session persistence — read room code from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get("room");
    if (urlRoom && urlRoom.match(/^[A-Z0-9]{6}$/)) {
      setRoomInput(urlRoom);
      // Check localStorage for saved session
      const savedName = localStorage.getItem("turkiye_guessr_player_name");
      if (savedName) {
        setNameInput(savedName);
        // Auto-rejoin attempt
        joinRoom(urlRoom, savedName).then((success) => {
          if (success) {
            setScreen("lobby");
          }
        }).catch(() => {
          showTrackedToast("Yeniden bağlanılamadı");
        });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // BUG-003: Update URL when room is active
  useEffect(() => {
    if (room?.id && screen !== "menu") {
      const url = new URL(window.location.href);
      url.searchParams.set("room", room.id);
      window.history.replaceState({}, "", url.toString());
    } else if (screen === "menu") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("room")) {
        url.searchParams.delete("room");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [room?.id, screen]);

  // BUG-003: Save player name to localStorage
  useEffect(() => {
    if (nameInput.trim()) {
      localStorage.setItem("turkiye_guessr_player_name", nameInput.trim());
    }
  }, [nameInput]);

  // BUG-003: beforeunload guard when game is active
  useEffect(() => {
    if (screen !== "game" || !room) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Oyun devam ediyor. Ayrılmak istediğinize emin misiniz?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [screen, room]);

  // Initialize Street View and map when game starts
  useEffect(() => {
    if (screen !== "game" || !room) return;
    if (room.status !== "playing") return;

    // DEDUP GUARD
    const panoKey = room.currentPanoPackage?.id || room.currentPanoPackageId || "";
    const dedupKey = `${room.currentRound}_${panoKey}`;
    if (lastShownPanoRoundRef.current === dedupKey) {
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
  }, [screen, room?.status, room?.currentRound]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset state on round change
  useEffect(() => {
    if (room?.status === "playing" && room.currentRound !== prevRoundRef.current) {
      prevRoundRef.current = room.currentRound;
      prevStatusRef.current = room.status;

      setGuessLocation(null);
      resetMap();
      resetMoves();
      setMoves(room.moveLimit || 3);
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
        showTrackedToast(error === "Oda silindi veya bulunamadı" ? "Oda kapatıldı" : error);
      }
    }
  }, [room, error, screen, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Visibility change handler
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && screen === "game" && !room) {
        setScreen("menu");
        resetMap();
        setGuessLocation(null);
        resetMoves();
        showTrackedToast("Bağlantı koptu, yeniden bağlanın");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [screen, room]); // eslint-disable-line react-hooks/exhaustive-deps

  // Global unhandled promise rejection handler
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const error = event.reason;

      const isFirebaseInternalAbort =
        error instanceof Error &&
        error.message === "set" &&
        error.stack?.includes("repoAbortTransactionsOnNode");

      if (isFirebaseInternalAbort) {
        if ((window as any).__mpCounters) {
          (window as any).__mpCounters.firebaseInternalAbortCount++;
        }
        console.warn("[FirebaseInternalAbort] SDK transaction abort (safe to ignore)", error.stack?.split("\n")[1]?.trim());
        event.preventDefault();
        return;
      }

      console.error("[UnhandledRejection]", error);
      trackError(error instanceof Error ? error : String(error), "unhandledRejection");
      if ((window as any).__mpCounters) {
        (window as any).__mpCounters.unhandledRejectionCount++;
      }
      showTrackedToast("Beklenmeyen bir hata oluştu");
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ==================== HANDLERS ====================

  // BUG-005: Validate name before creating/joining
  const handleCreateRoom = async () => {
    if (!validateName(nameInput)) return;
    await runLocked(async () => {
      const roomCode = await createRoom(nameInput, selectedMode);
      if (roomCode) setScreen("lobby");
    }, "createRoom");
  };

  const handleJoinRoom = async () => {
    if (!validateName(nameInput)) return;
    await runLocked(async () => {
      const success = await joinRoom(roomInput, nameInput);
      if (success) setScreen("lobby");
    }, "joinRoom");
  };

  // BUG-004: startGame with async lock (replaces gameStartingRef)
  const handleStartGame = async () => {
    if (!room) return;
    await runLocked(async () => {
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
    }, "startGame");
  };

  // BUG-002/004: submitGuess with lock + time check
  const handleSubmitGuess = async () => {
    if (!guessLocation) return;
    // BUG-002: Client-side time check (defense in depth, server is authoritative)
    if (timeRemaining <= 0) {
      showTrackedToast("Süre doldu! Tahmin kabul edilmedi.");
      return;
    }
    await runLocked(async () => {
      const result = await submitGuess(guessLocation);
      if (!result.accepted && result.reason === "time_expired") {
        showTrackedToast("Süre doldu! Tahmin kabul edilmedi.");
      } else if (!result.accepted && result.reason !== "already_guessed" && result.reason !== "already_guessed_db" && result.reason !== "in_flight") {
        showTrackedToast("Tahmin gönderilemedi.");
      }
    }, "submitGuess");
  };

  const showAdIfNeeded = () => {
    const now = Date.now();
    if (now - lastAdTime > AD_FREQUENCY_LIMIT) {
      setLastAdTime(now);
    }
  };

  // BUG-004: nextRound with async lock (prevents double-advance)
  const handleNextRound = async () => {
    if (!room) return;
    await runLocked(async () => {
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
    }, "nextRound");
  };

  // BUG-009: Skip round when pano fails — gives 0 points to all
  const handleSkipRound = async () => {
    if (!room || !isHost) return;
    await runLocked(async () => {
      // Trigger roundEnd with 0 scores, then advance
      handleTimeUp();
    }, "skipRound");
  };

  const handleRestartGame = async () => {
    await runLocked(async () => {
      lastShownPanoRoundRef.current = null;
      resetMap();
      setGuessLocation(null);
      resetMoves();
      await restartGame();
      setScreen("lobby");
    }, "restartGame");
  };

  const handleLeaveRoom = async () => {
    await runLocked(async () => {
      await leaveRoom();
      setScreen("menu");
      resetMap();
      setGuessLocation(null);
      resetMoves();
    }, "leaveRoom");
  };

  const copyRoomCode = () => {
    if (room?.id) {
      navigator.clipboard.writeText(room.id);
      setCopied(true);
      setShowToast("Kod kopyalandı!");
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        toastTimerRef.current = null;
        setCopied(false);
        setShowToast(null);
      }, 2000);
    }
  };

  const shareWhatsApp = () => {
    if (room?.id) {
      const text = `🎯 TürkiyeGuessr'da bana katıl!\n\nOda Kodu: ${room.id}\n\nhttps://turkiyeguessr.xyz?room=${room.id}`;
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
        nameError={nameError}
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
          panoLoadFailed={panoLoadFailed}
          onSkipRound={handleSkipRound}
          isSubmitting={isKeyLocked("submitGuess")}
          isNextRoundLoading={isKeyLocked("nextRound")}
        />
      </GameErrorBoundary>
    );
  }

  return null;
}
