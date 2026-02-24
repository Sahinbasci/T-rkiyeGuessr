"use client";

import { useEffect, useState } from "react";
import { canShowAd, AD_SLOTS, isAdPreview } from "@/config/ads";
import { AdSlot } from "./AdSlot";

interface Props {
  /** Seconds before auto-dismiss (default 5) */
  duration?: number;
  /** Called when interstitial is dismissed / skipped */
  onDismiss: () => void;
}

/**
 * Full-screen interstitial ad overlay for game-over transitions.
 * Shows a countdown → auto-dismisses after `duration` seconds.
 * User can skip anytime.
 *
 * If ads can't show (no consent, env off, etc.) → calls onDismiss immediately.
 */
export function AdInterstitial({ duration = 5, onDismiss }: Props) {
  const [remaining, setRemaining] = useState(duration);

  // Guard — if can't show, dismiss immediately
  useEffect(() => {
    if (!canShowAd("gameOver")) {
      onDismiss();
    }
  }, [onDismiss]);

  // Countdown
  useEffect(() => {
    if (!canShowAd("gameOver")) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onDismiss]);

  if (!canShowAd("gameOver")) return null;

  return (
    <div className="fixed inset-0 z-[99998] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 p-6 w-full max-w-md text-center space-y-4">
        <p className="text-gray-500 text-xs uppercase tracking-wide">Reklam</p>

        {/* Ad content */}
        {isAdPreview() ? (
          <div className="bg-gray-800/40 border border-dashed border-gray-700 rounded-lg h-[250px] flex items-center justify-center text-gray-600 text-xs">
            Interstitial Ad Placeholder
          </div>
        ) : (
          <AdSlot
            slot={AD_SLOTS.interstitial}
            format="rectangle"
            roomStatus="gameOver"
          />
        )}

        {/* Controls */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600 text-sm">
            {remaining > 0
              ? `${remaining} saniye icinde kapanacak`
              : "Kapatiliyor..."}
          </span>
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 text-sm rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Atla
          </button>
        </div>
      </div>
    </div>
  );
}
