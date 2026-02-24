"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { ADSENSE_CLIENT, ADS_ENABLED } from "@/config/ads";
import { isMarketingAllowed, CONSENT_CHANGED_EVENT } from "@/utils/consent";

/**
 * Loads the AdSense pagead2 script **only** when:
 *  1. ADS_ENABLED (env)
 *  2. User consented to marketing cookies
 *
 * Place this once in layout.tsx.
 */
export function AdSenseScript() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (!ADS_ENABLED) return;

    const check = () => setShouldLoad(isMarketingAllowed());
    check(); // initial

    // Re-check when consent changes
    window.addEventListener(CONSENT_CHANGED_EVENT, check);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, check);
  }, []);

  if (!shouldLoad) return null;

  return (
    <Script
      id="adsense-script"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
