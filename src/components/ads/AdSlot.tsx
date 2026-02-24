"use client";

import { useEffect, useRef } from "react";
import { canShowAd, isAdPreview, ADSENSE_CLIENT } from "@/config/ads";

interface Props {
  /** AdSense slot ID */
  slot: string;
  /** Ad format — responsive, horizontal, rectangle etc. */
  format?: "auto" | "horizontal" | "rectangle";
  /** Room status guard — won't render during "playing" */
  roomStatus?: "waiting" | "playing" | "roundEnd" | "gameOver" | null;
  /** Extra wrapper className */
  className?: string;
}

/**
 * Reusable AdSense display ad slot.
 * - Guards: env + consent + roomStatus
 * - Dev mode: shows placeholder
 * - Responsive by default
 */
export function AdSlot({
  slot,
  format = "auto",
  roomStatus,
  className = "",
}: Props) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    if (isAdPreview()) return;
    if (!canShowAd(roomStatus)) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
        {}
      );
      pushed.current = true;
    } catch {
      // AdSense not loaded yet — silently ignore
    }
  }, [roomStatus]);

  if (!canShowAd(roomStatus)) return null;

  // Development placeholder
  if (isAdPreview()) {
    return (
      <div
        className={`bg-gray-800/40 border border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-600 text-xs py-4 ${className}`}
      >
        Ad Slot: {slot} ({format})
      </div>
    );
  }

  const layoutAttrs: Record<string, string> =
    format === "auto"
      ? { "data-ad-format": "auto", "data-full-width-responsive": "true" }
      : format === "horizontal"
        ? { "data-ad-format": "horizontal", "data-full-width-responsive": "true" }
        : { "data-ad-format": "rectangle" };

  return (
    <div className={`overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        {...layoutAttrs}
      />
    </div>
  );
}
