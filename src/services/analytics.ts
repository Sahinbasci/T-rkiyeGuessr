/**
 * GA4 Analytics Service.
 *
 * Keeps semantic event helpers in one place while delegating transport
 * to src/lib/analytics.ts.
 */

import { trackEvent } from "@/utils/telemetry";
import {
  ANALYTICS_ENABLED as analyticsEnabled,
  GA_MEASUREMENT_ID,
  canSendAnalytics as canTrackAnalytics,
  event as sendAnalyticsEvent,
  pageview,
} from "@/lib/analytics";

export const GA4_MEASUREMENT_ID = GA_MEASUREMENT_ID;
export const ANALYTICS_ENABLED = analyticsEnabled;
export const canSendAnalytics = canTrackAnalytics;

/* ─── Event Sender ─── */

type GA4EventParams = Record<string, string | number | boolean | undefined>;

/**
 * Send a GA4 event. Guards on consent + env.
 * Also forwards to internal telemetry for session debugging.
 */
function sendGA4Event(eventName: string, params?: GA4EventParams): void {
  sendAnalyticsEvent(eventName, params);
}

/* ─── Funnel Events ─── */

/** Player started a game (clicked "Oyuna Basla") */
export function trackGameStart(meta?: {
  gameMode?: string;
  roomId?: string;
  playerCount?: number;
}): void {
  sendGA4Event("game_start", {
    game_mode: meta?.gameMode,
    room_code: meta?.roomId,
    player_count: meta?.playerCount,
  });
  trackEvent("game_start", meta);
}

/** A round has been completed (guess submitted or time up) */
export function trackRoundComplete(meta?: {
  roundNumber?: number;
  score?: number;
  distanceKm?: number;
  timeSpentSeconds?: number;
  roomId?: string;
}): void {
  sendGA4Event("round_complete", {
    round_number: meta?.roundNumber,
    score: meta?.score,
    distance_km: meta?.distanceKm,
    time_spent_seconds: meta?.timeSpentSeconds,
    room_code: meta?.roomId,
  });
  trackEvent("round_complete", meta);
}

/** Entire game finished (all rounds done) */
export function trackGameComplete(meta?: {
  totalScore?: number;
  totalRounds?: number;
  roundCount?: number;
  averageDistanceKm?: number;
  totalTimeSeconds?: number;
  gameMode?: string;
  roomId?: string;
}): void {
  sendGA4Event("game_complete", {
    total_score: meta?.totalScore,
    total_rounds: meta?.totalRounds ?? meta?.roundCount,
    average_distance_km: meta?.averageDistanceKm,
    total_time_seconds: meta?.totalTimeSeconds,
    game_mode: meta?.gameMode,
    room_code: meta?.roomId,
  });
  trackEvent("game_complete", meta);
}

/** Room was created */
export function trackRoomCreated(meta?: {
  roomId?: string;
  gameMode?: string;
}): void {
  sendGA4Event("room_create", {
    room_code: meta?.roomId,
    game_mode: meta?.gameMode,
  });
  trackEvent("room_created", meta);
}

/** Player joined a room */
export function trackRoomJoined(meta?: {
  roomId?: string;
  playerCount?: number;
}): void {
  sendGA4Event("room_join", {
    room_code: meta?.roomId,
    player_count: meta?.playerCount,
  });
  trackEvent("room_joined", meta);
}

/** Player shared their result */
export function trackShareResult(meta?: {
  method?: "clipboard" | "twitter" | "whatsapp";
  totalScore?: number;
}): void {
  sendGA4Event("share_result", {
    method: meta?.method,
    total_score: meta?.totalScore,
  });
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
  pageview(path ?? window.location.pathname);
}
