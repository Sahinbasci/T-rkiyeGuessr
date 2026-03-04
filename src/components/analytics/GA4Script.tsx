"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { GA4_MEASUREMENT_ID, ANALYTICS_ENABLED } from "@/services/analytics";
import { isAnalyticsAllowed, CONSENT_CHANGED_EVENT } from "@/utils/consent";
import { trackEvent, trackError } from "@/utils/telemetry";

/**
 * Loads the GA4 gtag.js script **only** when:
 *  1. ANALYTICS_ENABLED (env)
 *  2. User consented to analytics cookies
 *
 * Once loaded, the Script tag stays in the DOM even if consent is revoked.
 * Consent Mode v2 handles signal suppression at the Google side.
 *
 * Place this once in layout.tsx, after ConsentModeInit.
 */
export function GA4Script() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;

    const check = () => setShouldLoad(isAnalyticsAllowed());
    check();

    window.addEventListener(CONSENT_CHANGED_EVENT, check);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, check);
  }, []);

  // Don't render until consent given; but once loaded, keep the tag
  if (!shouldLoad && !scriptLoadedRef.current) return null;

  return (
    <>
      <Script
        id="ga4-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onLoad={() => {
          scriptLoadedRef.current = true;
          // Initialize gtag config (ConsentModeInit already created the gtag function)
          if (typeof window.gtag === "function") {
            window.gtag("js", new Date());
            window.gtag("config", GA4_MEASUREMENT_ID, {
              send_page_view: true,
            });
          }
          trackEvent("ga4ScriptLoaded");
        }}
        onError={(e) => {
          trackError(
            typeof e === "string" ? e : "GA4 gtag.js failed to load",
            "GA4Script.onError"
          );
          trackEvent("ga4ScriptFailed");
        }}
      />
    </>
  );
}
