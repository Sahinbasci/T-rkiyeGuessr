import { RefObject } from "react";
import { RefreshCw, AlertTriangle, WifiOff, LogOut } from "lucide-react";
import { Room, Player, Coordinates, RoundResult } from "@/types";
import { GameNotification } from "@/hooks";
import { GameHeader } from "@/components/game/GameHeader";
import { PlayersSidebar } from "@/components/game/PlayersSidebar";
import { MiniMap } from "@/components/game/MiniMap";
import { MobileActionBar } from "@/components/game/MobileActionBar";
import { RoundEndModal } from "@/components/game/RoundEndModal";
import { GameOverModal } from "@/components/game/GameOverModal";
import { NotificationList } from "@/components/game/NotificationList";
import { Toast } from "@/components/shared/Toast";

interface GameScreenProps {
  room: Room | null;
  playerId: string;
  currentPlayer: Player | null;
  players: Player[];
  isHost: boolean;
  // Refs
  streetViewRef: RefObject<HTMLDivElement | null>;
  guessMapRef: RefObject<HTMLDivElement | null>;
  // Street View state
  streetViewLoading: boolean;
  navigationError: string | null;
  movesRemaining: number;
  isMovementLocked: boolean;
  showBudgetWarning: boolean;
  // Timer
  timeRemaining: number;
  formattedTime: string;
  // Map state
  mapExpanded: boolean;
  setMapExpanded: (expanded: boolean) => void;
  guessLocation: Coordinates | null;
  // Toast
  showToast: string | null;
  // Notifications
  notifications: GameNotification[];
  dismissNotification: (id: string) => void;
  // Connection
  connectionState: 'online' | 'reconnecting' | 'lost';
  // Handlers
  onSubmitGuess: () => void;
  onNextRound: () => void;
  onRestart: () => void;
  onLeaveRoom: () => void;
  returnToStart: () => void;
  onReturnToMenu: () => void;
  panoLoadFailed?: boolean;
}

export function GameScreen({
  room,
  playerId,
  currentPlayer,
  players,
  isHost,
  streetViewRef,
  guessMapRef,
  streetViewLoading,
  navigationError,
  movesRemaining,
  isMovementLocked,
  showBudgetWarning,
  timeRemaining,
  formattedTime,
  mapExpanded,
  setMapExpanded,
  guessLocation,
  showToast,
  notifications,
  dismissNotification,
  connectionState,
  onSubmitGuess,
  onNextRound,
  onRestart,
  onLeaveRoom,
  returnToStart,
  onReturnToMenu,
  panoLoadFailed,
}: GameScreenProps) {
  // Connection lost fallback
  if (!room) {
    return (
      <div className="error-screen">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <RefreshCw size={32} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">Bağlantı Koptu</h2>
        <p className="text-gray-400 mb-6">Oyun odasıyla bağlantı kesildi</p>
        <button onClick={onReturnToMenu} className="btn-primary">
          Ana Menüye Dön
        </button>
      </div>
    );
  }

  const hasRoundResults = Array.isArray(room.roundResults) && room.roundResults.length > 0;
  const isRoundEnd = room.status === "roundEnd" || (hasRoundResults && room.status === "playing");
  const isGameOver = room.status === "gameOver";
  const hasGuessed = currentPlayer?.hasGuessed || false;
  const waitingCount = players.filter((p) => !p.hasGuessed).length;
  const guessedCount = players.filter((p) => p.hasGuessed).length;

  const sortedResults = room.roundResults
    ? [...room.roundResults].sort((a, b) => a.distance - b.distance)
    : [];

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f]">
      <GameHeader
        room={room}
        currentPlayer={currentPlayer}
        timeRemaining={timeRemaining}
        formattedTime={formattedTime}
        movesRemaining={movesRemaining}
        isRoundEnd={isRoundEnd}
        isGameOver={isGameOver}
      />

      {/* Street View */}
      <div
        ref={streetViewRef as React.RefObject<HTMLDivElement>}
        className="absolute inset-0 z-0"
        style={{ width: "100%", height: "100%", background: "#1a1a24" }}
      />

      {/* Loading Overlay */}
      {streetViewLoading && (
        <div className="absolute inset-0 z-40 bg-black/80 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-300">Konum yükleniyor...</p>
          </div>
        </div>
      )}

      {/* Navigation Error Toast */}
      {navigationError && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm animate-pulse">
            {navigationError}
          </div>
        </div>
      )}

      {/* Players Sidebar */}
      {!isRoundEnd && !isGameOver && (
        <PlayersSidebar players={players} returnToStart={returnToStart} />
      )}

      {/* BUG-2 FIX: Pano load failure overlay — prevents silent black screen */}
      {panoLoadFailed && !isRoundEnd && !isGameOver && (
        <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Street View Yüklenemedi</h2>
            <p className="text-gray-400 mb-6">Panorama yüklenirken bir hata oluştu.</p>
            <button onClick={onLeaveRoom} className="btn-primary">
              Lobiye Dön
            </button>
          </div>
        </div>
      )}

      {/* Emergency exit button — visible after guessing, provides escape from stuck state */}
      {hasGuessed && !isRoundEnd && !isGameOver && !panoLoadFailed && (
        <button
          onClick={onLeaveRoom}
          className="absolute top-14 left-3 z-30 glass rounded-lg px-3 py-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Oyundan ayrıl"
          title="Oyundan Ayrıl"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Ayrıl</span>
        </button>
      )}

      {/* Mini Map */}
      {!isRoundEnd && !isGameOver && (
        <MiniMap
          guessMapRef={guessMapRef}
          mapExpanded={mapExpanded}
          setMapExpanded={setMapExpanded}
          hasGuessed={hasGuessed}
          guessLocation={guessLocation}
          guessedCount={guessedCount}
          waitingCount={waitingCount}
          playerCount={players.length}
          onSubmitGuess={onSubmitGuess}
        />
      )}

      {/* Mobile Action Bar */}
      {!isRoundEnd && !isGameOver && (
        <MobileActionBar
          hasGuessed={hasGuessed}
          guessLocation={guessLocation}
          guessedCount={guessedCount}
          playerCount={players.length}
          onSubmitGuess={onSubmitGuess}
        />
      )}

      {/* Round End Modal */}
      {isRoundEnd && (
        <RoundEndModal
          room={room}
          playerId={playerId}
          isHost={isHost}
          sortedResults={sortedResults}
          onNextRound={onNextRound}
        />
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <GameOverModal
          players={players}
          playerId={playerId}
          isHost={isHost}
          onRestart={onRestart}
          onLeave={onLeaveRoom}
        />
      )}

      <Toast message={showToast} />

      <NotificationList
        notifications={notifications}
        dismissNotification={dismissNotification}
      />

      {/* Budget Warning */}
      {showBudgetWarning && !isRoundEnd && !isGameOver && (
        <div className="warning-badge">
          <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2 bg-orange-500/20 border-orange-500/50 budget-warning">
            <AlertTriangle size={16} className="text-orange-400 flex-shrink-0" />
            <span className="text-sm text-orange-300 font-medium">Son hareket hakkın!</span>
          </div>
        </div>
      )}

      {/* Movement Locked Warning */}
      {isMovementLocked && !isRoundEnd && !isGameOver && !showBudgetWarning && (
        <div className="warning-badge">
          <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2 bg-red-500/20 border-red-500/50">
            <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-300 font-medium">Hareket hakkın bitti!</span>
          </div>
        </div>
      )}

      {/* Reconnecting Banner */}
      {connectionState === 'reconnecting' && (
        <div className="absolute top-14 inset-x-0 z-50 flex justify-center pointer-events-none" aria-live="polite">
          <div className="bg-yellow-500/90 text-black px-4 py-2 rounded-b-lg flex items-center gap-2 text-sm font-medium">
            <WifiOff size={16} />
            <span>Bağlantı yeniden kuruluyor...</span>
          </div>
        </div>
      )}

      {/* Connection Lost Modal */}
      {connectionState === 'lost' && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Bağlantı koptu">
          <div className="modal-content glass p-6 w-full sm:max-w-sm text-center">
            <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <WifiOff size={28} className="text-red-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Bağlantı Koptu</h2>
            <p className="text-gray-400 text-sm mb-6">Sunucuyla bağlantı kurulamıyor</p>
            <div className="flex gap-3">
              <button onClick={onReturnToMenu} className="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium text-sm transition-colors">
                Ana Menüye Dön
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
