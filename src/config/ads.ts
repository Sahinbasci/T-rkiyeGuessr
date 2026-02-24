/**
 * AdSense configuration & guards.
 *
 * ENV:
 *  NEXT_PUBLIC_ADSENSE_CLIENT  — e.g. "ca-pub-4031611961368310"
 *  NEXT_PUBLIC_ENABLE_ADS      — "true" to enable (default "false")
 */

import { isMarketingAllowed } from "@/utils/consent";

/* ─── Environment ─── */

export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

export const ADS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_ADS === "true" && ADSENSE_CLIENT.length > 0;

/* ─── Slot IDs (placeholder — replace after AdSense approval) ─── */

export const AD_SLOTS = {
  /** Horizontal banner — menu, lobby, SEO pages footer */
  banner: "0000000000", // replace with real slot ID
  /** In-content — round end, game over */
  inContent: "0000000001", // replace with real slot ID
  /** Interstitial — game over */
  interstitial: "0000000002", // replace with real slot ID
} as const;

/* ─── Guard ─── */

type RoomStatus = "waiting" | "playing" | "roundEnd" | "gameOver" | null;

/**
 * Returns true if an ad can be displayed right now.
 * - ADS_ENABLED (env)
 * - User consented to marketing cookies
 * - Room is NOT in active playing state
 */
export function canShowAd(roomStatus?: RoomStatus): boolean {
  if (!ADS_ENABLED) return false;
  if (!isMarketingAllowed()) return false;
  if (roomStatus === "playing") return false;
  return true;
}

/**
 * Returns true only in dev/preview (no real ads, just placeholders).
 */
export function isAdPreview(): boolean {
  return process.env.NODE_ENV === "development";
}
