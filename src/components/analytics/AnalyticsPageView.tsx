"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { GA_READY_EVENT, pageview } from "@/lib/analytics";
import { CONSENT_CHANGED_EVENT, isAnalyticsAllowed } from "@/utils/consent";

export function AnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams?.toString() ?? "";
  const [gaReady, setGaReady] = useState(false);
  const [consentVersion, setConsentVersion] = useState(0);

  useEffect(() => {
    const handleReady = () => setGaReady(window.__ga4Ready === true);
    const handleConsentChange = () => {
      setConsentVersion((current) => current + 1);
    };

    handleReady();
    window.addEventListener(GA_READY_EVENT, handleReady);
    window.addEventListener(CONSENT_CHANGED_EVENT, handleConsentChange);

    return () => {
      window.removeEventListener(GA_READY_EVENT, handleReady);
      window.removeEventListener(CONSENT_CHANGED_EVENT, handleConsentChange);
    };
  }, []);

  useEffect(() => {
    if (!gaReady || !isAnalyticsAllowed()) return;

    const url = pathname + (queryString ? `?${queryString}` : "");
    pageview(url);
  }, [gaReady, pathname, queryString, consentVersion]);

  return null;
}
