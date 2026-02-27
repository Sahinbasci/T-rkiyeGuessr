"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { ADSENSE_CLIENT, ADS_ENABLED } from "@/config/ads";
import { isMarketingAllowed, CONSENT_CHANGED_EVENT } from "@/utils/consent";

/**
 * Loads the AdSense pagead2 script **only** when:
 *  1. ADS_ENABLED (env)
 *  2. User consented to marketing cookies
 *
 * Once loaded, the Script tag stays in the DOM even if consent is revoked
 * (pagead2.js cannot be unloaded from memory). New ad requests are blocked
 * at the canShowAd() guard level instead.
 *
 * Place this once in layout.tsx.
 */
export function AdSenseScript() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!ADS_ENABLED) return;

    const check = () => setShouldLoad(isMarketingAllowed());
    check();

    window.addEventListener(CONSENT_CHANGED_EVENT, check);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, check);
  }, []);

  // Don't render until consent given; but once loaded, keep the tag
  if (!shouldLoad && !scriptLoadedRef.current) return null;

  return (
    <Script
      id="adsense-script"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
      onLoad={() => {
        scriptLoadedRef.current = true;
      }}
      onError={(e) => {
        // Ad blocker or network issue — log for debugging, don't crash
        if (process.env.NODE_ENV === "development") {
          console.warn("[AdSense] pagead2.js failed to load:", e);
        }
      }}
    />
  );
}
