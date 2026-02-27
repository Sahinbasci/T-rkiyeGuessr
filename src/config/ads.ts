/**
 * AdSense configuration & guards.
 *
 * ENV:
 *  NEXT_PUBLIC_ADSENSE_CLIENT      — e.g. "ca-pub-4031611961368310"
 *  NEXT_PUBLIC_ENABLE_ADS          — "true" to enable (default "false")
 *  NEXT_PUBLIC_AD_SLOT_BANNER      — horizontal banner slot ID
 *  NEXT_PUBLIC_AD_SLOT_IN_CONTENT  — in-content rectangle slot ID
 *  NEXT_PUBLIC_AD_SLOT_INTERSTITIAL — interstitial slot ID
 *  NEXT_PUBLIC_ENABLE_INTERSTITIAL_ADS — "true" to enable interstitial ads (default "false")
 */

import { isMarketingAllowed } from "@/utils/consent";
import { logger } from "@/utils/logger";

/* ─── Environment ─── */

export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

export const ADS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_ADS === "true" && ADSENSE_CLIENT.length > 0;

/** Interstitial ads require separate opt-in (default false during review). */
export const INTERSTITIAL_ADS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_INTERSTITIAL_ADS === "true";

/* ─── Slot IDs ─── */

const PLACEHOLDER_PREFIX = "000000000";

export const AD_SLOTS = {
  banner: process.env.NEXT_PUBLIC_AD_SLOT_BANNER ?? "0000000000",
  inContent: process.env.NEXT_PUBLIC_AD_SLOT_IN_CONTENT ?? "0000000001",
  interstitial: process.env.NEXT_PUBLIC_AD_SLOT_INTERSTITIAL ?? "0000000002",
} as const;

export type AdSlotKey = keyof typeof AD_SLOTS;

/** Returns true if the slot ID is a real one (not a placeholder). */
export function isSlotConfigured(slotId: string): boolean {
  return slotId.length > 0 && !slotId.startsWith(PLACEHOLDER_PREFIX);
}

/* ─── CLS Size Reservations ─── */

export const AD_SIZE_RESERVATION: Record<string, { minH: number }> = {
  horizontal: { minH: 90 },
  auto: { minH: 90 },
  rectangle: { minH: 250 },
};

/* ─── Guard ─── */

type RoomStatus = "waiting" | "playing" | "roundEnd" | "gameOver" | null;

/**
 * Returns true if an ad can be displayed right now.
 * - ADS_ENABLED (env)
 * - User consented to marketing cookies
 * - Room is NOT in active playing state
 * - (optional) slot is configured with a real ID
 *
 * BUG-005 FIX: During AdSense review, slot IDs are placeholders.
 * Google auto-ads work without real slot IDs (pagead2.js handles placement).
 * We allow placeholder slots so manual AdSlot components still render
 * and Google can fill them via auto-ads during the review period.
 */
export function canShowAd(roomStatus?: RoomStatus, slotId?: string): boolean {
  if (!ADS_ENABLED) return false;
  if (!isMarketingAllowed()) return false;
  if (roomStatus === "playing") return false;
  // BUG-005: Allow placeholder slots — Google auto-ads can fill them during review
  // Only reject truly invalid slots (empty string or unexpected values)
  if (slotId !== undefined && slotId.length === 0) return false;
  return true;
}

/**
 * Returns true if an interstitial ad can be displayed.
 * Extra gate: INTERSTITIAL_ADS_ENABLED must be true (env flag).
 * During AdSense review this is kept false → zero policy risk.
 */
export function canShowInterstitial(slotId?: string): boolean {
  if (!INTERSTITIAL_ADS_ENABLED) return false;
  return canShowAd("gameOver", slotId);
}

/**
 * Returns true only in dev/preview (no real ads, just placeholders).
 */
export function isAdPreview(): boolean {
  return process.env.NODE_ENV === "development";
}

/** Log ad config status — call once on app init (dev only). */
export function validateAdConfig(): void {
  if (process.env.NODE_ENV !== "development") return;

  logger.debug("[AdConfig] ADS_ENABLED:", ADS_ENABLED);
  logger.debug("[AdConfig] ADSENSE_CLIENT:", ADSENSE_CLIENT || "(empty)");
  for (const [key, id] of Object.entries(AD_SLOTS)) {
    const status = isSlotConfigured(id) ? "configured" : "placeholder";
    logger.debug(`[AdConfig] Slot ${key}: ${id} (${status})`);
  }
}
