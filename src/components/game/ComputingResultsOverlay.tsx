"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

/**
 * A4 HARDENING: Escalating overlay shown when timer expires but roundEnd hasn't arrived yet.
 * Phase 1 (0-8s): "Sonuçlar hesaplanıyor..."
 * Phase 2 (8s+): "Bağlantı yavaş, sonuçlar yeniden senkronize ediliyor..."
 *
 * Resets automatically when unmounted (roundEnd arrives / game state changes).
 */

const ESCALATION_DELAY_MS = 8000;

export function ComputingResultsOverlay() {
  const [escalated, setEscalated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setEscalated(true);
    }, ESCALATION_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[1000008] pointer-events-none">
      <div className={`glass rounded-xl px-6 py-3 flex items-center gap-3 ${
        escalated
          ? "bg-orange-900/80 border-orange-500/50"
          : "bg-gray-900/80 border-gray-600/50"
      }`}>
        <RefreshCw size={18} className={`animate-spin ${
          escalated ? "text-orange-400" : "text-yellow-400"
        }`} />
        <span className={`text-sm font-medium ${
          escalated ? "text-orange-200" : "text-gray-200"
        }`}>
          {escalated
            ? "Bağlantı yavaş, sonuçlar yeniden senkronize ediliyor..."
            : "Sonuçlar hesaplanıyor..."}
        </span>
      </div>
    </div>
  );
}
