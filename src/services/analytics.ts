/**
 * GA4 Analytics Service.
 *
 * ENV:
 *  NEXT_PUBLIC_GA4_MEASUREMENT_ID  — e.g. "G-XXXXXXXXXX"
 *  NEXT_PUBLIC_ENABLE_ANALYTICS    — "true" to enable (default "false")
 *
 * All events respect consent state (analytics_storage via Consent Mode v2).
 * gtag is initialized by GA4Script.tsx and ConsentModeInit.tsx.
 *
 * Uses window.gtag pattern — no direct GA4 SDK dependency.
 */

import { isAnalyticsAllowed } from "@/utils/consent";
import { trackEvent } from "@/utils/telemetry";

/* ─── Environment ─── */

export const GA4_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "";

export const ANALYTICS_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true" &&
  GA4_MEASUREMENT_ID.length > 0;

/* ─── Gtag Helpers ─── */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function ensureGtag(): boolean {
  if (typeof window === "undefined") return false;
  return typeof window.gtag === "function";
}

/**
 * Returns true if GA4 events can be sent right now.
 * - ANALYTICS_ENABLED (env flag)
 * - User consented to analytics cookies
 * - gtag function is available
 */
export function canSendAnalytics(): boolean {
  if (!ANALYTICS_ENABLED) return false;
  if (!isAnalyticsAllowed()) return false;
  if (!ensureGtag()) return false;
  return true;
}

/* ─── Event Sender ─── */

type GA4EventParams = Record<string, string | number | boolean | undefined>;

/**
 * Send a GA4 event. Guards on consent + env.
 * Also forwards to internal telemetry for session debugging.
 */
function sendGA4Event(eventName: string, params?: GA4EventParams): void {
  if (!canSendAnalytics()) return;

  try {
    window.gtag("event", eventName, params);
  } catch {
    // Swallow — gtag should never crash the app
  }
}

/* ─── Funnel Events ─── */

/** Player started a game (clicked "Oyuna Basla") */
export function trackGameStart(meta?: {
  gameMode?: string;
  roomId?: string;
  playerCount?: number;
}): void {
  sendGA4Event("game_start", meta);
  trackEvent("game_start", meta);
}

/** A round has been completed (guess submitted or time up) */
export function trackRoundComplete(meta?: {
  roundNumber?: number;
  score?: number;
  distanceKm?: number;
  roomId?: string;
}): void {
  sendGA4Event("round_complete", meta);
  trackEvent("round_complete", meta);
}

/** Entire game finished (all rounds done) */
export function trackGameComplete(meta?: {
  totalScore?: number;
  roundCount?: number;
  gameMode?: string;
  roomId?: string;
}): void {
  sendGA4Event("game_complete", meta);
  trackEvent("game_complete", meta);
}

/** Room was created */
export function trackRoomCreated(meta?: {
  roomId?: string;
  gameMode?: string;
}): void {
  sendGA4Event("room_created", meta);
  trackEvent("room_created", meta);
}

/** Player joined a room */
export function trackRoomJoined(meta?: {
  roomId?: string;
  playerCount?: number;
}): void {
  sendGA4Event("room_joined", meta);
  trackEvent("room_joined", meta);
}

/** An ad was displayed and filled */
export function trackAdImpression(meta?: {
  slot?: string;
  format?: string;
}): void {
  sendGA4Event("ad_impression", meta);
  // ad_impression is already tracked in AdSlot via trackEvent
}

/** User clicked the premium CTA */
export function trackPremiumCtaClick(meta?: {
  location?: string;
}): void {
  sendGA4Event("premium_cta_click", meta);
  trackEvent("premium_cta_click", meta);
}

/** Generic page view — called automatically by GA4 but can be manual */
export function trackPageView(path?: string): void {
  if (!canSendAnalytics()) return;

  try {
    window.gtag("config", GA4_MEASUREMENT_ID, {
      page_path: path ?? window.location.pathname,
    });
  } catch {
    // Swallow
  }
}
