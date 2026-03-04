"use client";

import Script from "next/script";
import { ADSENSE_CLIENT, ADS_ENABLED } from "@/config/ads";
import { trackEvent, trackError } from "@/utils/telemetry";

/**
 * Loads the AdSense pagead2 script when ADS_ENABLED (env).
 *
 * CRITICAL FOR ADSENSE APPROVAL:
 * The script is loaded UNCONDITIONALLY (regardless of consent state).
 * Google Consent Mode v2 (initialized in ConsentModeInit.tsx) sets default
 * consent to 'denied'. The pagead2.js script reads these signals internally
 * and will NOT collect personal data or serve personalized ads until consent
 * is granted. This is Google's recommended approach:
 *   - Script always present → AdSense crawler can verify ad code
 *   - Consent Mode defaults to denied → GDPR/ePrivacy compliant
 *   - AdSlot guard (canShowAd) still blocks ad rendering until consent
 *
 * Place this once in layout.tsx.
 */
export function AdSenseScript() {
  if (!ADS_ENABLED || !ADSENSE_CLIENT) return null;

  return (
    <Script
      id="adsense-script"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onLoad={() => {
        trackEvent("adSenseScriptLoaded");
      }}
      onError={(e) => {
        trackError(
          typeof e === "string" ? e : "AdSense pagead2.js failed to load",
          "AdSenseScript.onError"
        );
        trackEvent("adSenseScriptFailed");
      }}
    />
  );
}
