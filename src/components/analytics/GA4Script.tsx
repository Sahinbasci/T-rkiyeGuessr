"use client";

import Script from "next/script";
import {
  ANALYTICS_ENABLED,
  GA_MEASUREMENT_ID,
  GA_READY_EVENT,
} from "@/lib/analytics";
import { trackEvent, trackError } from "@/utils/telemetry";

/**
 * Loads the GA4 gtag.js script whenever analytics is enabled.
 *
 * ConsentModeInit sets `analytics_storage: denied` by default, so loading the
 * tag is safe before consent and lets Google's setup checker detect the tag.
 * Actual pageviews and custom events are still guarded by consent in
 * src/lib/analytics.ts.
 *
 * Place this once in layout.tsx, after ConsentModeInit.
 */
export function GA4Script() {
  if (!ANALYTICS_ENABLED) return null;

  return (
    <>
      <Script
        id="ga4-gtag"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onLoad={() => {
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
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.gtag('js', new Date());
          window.gtag('config', '${GA_MEASUREMENT_ID}', {
            send_page_view: false
          });
          window.__ga4Ready = true;
          window.dispatchEvent(new Event('${GA_READY_EVENT}'));
        `}
      </Script>
    </>
  );
}
