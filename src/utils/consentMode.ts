/**
 * Google Consent Mode v2 bridge.
 *
 * Maps our localStorage-based consent categories to Google's consent signals:
 *   necessary  → functionality_storage (always granted)
 *   analytics  → analytics_storage
 *   marketing  → ad_storage + ad_user_data + ad_personalization
 *
 * ConsentModeInit.tsx sets 'denied' defaults in <head>.
 * This module updates the state once actual consent is known.
 */

import { getConsent, type ConsentState } from "./consent";
import { trackEvent } from "./telemetry";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

function ensureGtag(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.gtag !== "function") {
    // ConsentModeInit should have created gtag; if not, bail silently
    return false;
  }
  return true;
}

function mapConsent(state: ConsentState) {
  const ad = state.marketing ? "granted" : "denied";
  const analytics = state.analytics ? "granted" : "denied";
  return {
    ad_storage: ad,
    ad_user_data: ad,
    ad_personalization: ad,
    analytics_storage: analytics,
  } as const;
}

/**
 * Read stored consent and issue gtag('consent', 'update', {...}).
 * Call once on page load (after hydration).
 */
export function initConsentMode(): void {
  if (!ensureGtag()) return;

  const consent = getConsent();
  if (!consent) return; // No stored consent — defaults from ConsentModeInit stay

  window.gtag("consent", "update", mapConsent(consent));
  trackEvent("consentModeInit", { marketing: consent.marketing, analytics: consent.analytics });
}

/**
 * Signal consent change to Google. Called from setConsent().
 */
export function updateConsentMode(state: ConsentState): void {
  if (!ensureGtag()) return;

  window.gtag("consent", "update", mapConsent(state));
  trackEvent("consentModeUpdate", { marketing: state.marketing, analytics: state.analytics });
}
