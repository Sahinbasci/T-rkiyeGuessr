"use client";

import { useEffect, useRef, useState } from "react";
import { canShowAd, isAdPreview, ADSENSE_CLIENT, AD_SIZE_RESERVATION } from "@/config/ads";
import { isPremiumUser } from "@/config/premium";
import { isMarketingAllowed, CONSENT_CHANGED_EVENT } from "@/utils/consent";
import { trackEvent } from "@/utils/telemetry";

type AdFormat = "auto" | "horizontal" | "rectangle";
type AdStatus = "loading" | "filled" | "unfilled" | "blocked" | "error";

interface Props {
  /** AdSense slot ID */
  slot: string;
  /** Ad format — responsive, horizontal, rectangle etc. */
  format?: AdFormat;
  /** Room status guard — won't render during "playing" */
  roomStatus?: "waiting" | "playing" | "roundEnd" | "gameOver" | null;
  /** Extra wrapper className */
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

/**
 * Reusable AdSense display ad slot.
 * - Guards: env + consent + roomStatus + slotConfigured
 * - CLS prevention: min-height reservation until ad loads
 * - Ad blocker detection: graceful collapse after 3s timeout
 * - Fill detection: MutationObserver on data-ad-status + childList
 * - Consent revoke: listens for consent changes, collapses if marketing denied
 * - Duplicate init guard via DOM data-attribute
 * - Dev mode: shows placeholder
 */
export function AdSlot({
  slot,
  format = "auto",
  roomStatus,
  className = "",
}: Props) {
  const insRef = useRef<HTMLModElement>(null);
  const [adStatus, setAdStatus] = useState<AdStatus>("loading");
  const premium = isPremiumUser();

  // Consent revoke listener — collapse if marketing denied after ad was displayed
  useEffect(() => {
    const handleConsentChange = () => {
      if (!isMarketingAllowed()) {
        setAdStatus("blocked");
      }
    };

    window.addEventListener(CONSENT_CHANGED_EVENT, handleConsentChange);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, handleConsentChange);
  }, []);

  useEffect(() => {
    if (premium) return;
    if (isAdPreview()) return;
    if (!canShowAd(roomStatus, slot)) return;

    const ins = insRef.current;
    if (!ins) return;

    // Duplicate init guard — survives React remounts
    if (ins.dataset.adInitialized === "true") return;

    // Ad blocker detection — if adsbygoogle is still undefined after 3s
    const blockerTimer = setTimeout(() => {
      if (!window.adsbygoogle) {
        setAdStatus("blocked");
        trackEvent("adBlockerDetected", { slot, format });
      }
    }, 3000);

    // Push ad request
    trackEvent("adRenderAttempt", { slot, format });

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      ins.dataset.adInitialized = "true";
    } catch {
      clearTimeout(blockerTimer);
      setAdStatus("error");
      trackEvent("adRenderFailed", { slot, format, reason: "push_error" });
      return;
    }

    // Fill detection via MutationObserver — watches data-ad-status attribute + childList
    let resolved = false;

    const resolve = (status: AdStatus) => {
      if (resolved) return;
      resolved = true;
      observer.disconnect();
      clearTimeout(fallbackTimer);
      setAdStatus(status);

      if (status === "filled") {
        trackEvent("adRenderSuccess", { slot, format });
        trackEvent("ad_impression", { slot, format });
      } else {
        trackEvent("adRenderFailed", { slot, format, reason: status });
      }
    };

    const observer = new MutationObserver(() => {
      const adStatusAttr = ins.getAttribute("data-ad-status");
      if (adStatusAttr === "filled") {
        resolve("filled");
      } else if (adStatusAttr === "unfilled") {
        resolve("unfilled");
      }
      // For childList: if children were added and data-ad-status is not set yet, wait
    });

    observer.observe(ins, {
      attributes: true,
      attributeFilter: ["data-ad-status"],
      childList: true,
      subtree: false,
    });

    // Fallback timeout — 5s for slow devices
    const fallbackTimer = setTimeout(() => {
      if (resolved) return;
      const adStatusAttr = ins.getAttribute("data-ad-status");
      if (adStatusAttr === "filled") {
        resolve("filled");
      } else if (ins.children.length > 0) {
        // Has content but no status attr — assume filled
        resolve("filled");
      } else {
        resolve("unfilled");
      }
    }, 5000);

    return () => {
      clearTimeout(blockerTimer);
      clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [premium, roomStatus, slot, format]);

  // Premium users see no ads at all
  if (premium) return null;

  if (!canShowAd(roomStatus, slot)) return null;

  // Development placeholder
  if (isAdPreview()) {
    const minH = AD_SIZE_RESERVATION[format]?.minH ?? 90;
    return (
      <div
        className={`bg-gray-800/40 border border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-600 text-xs ${className}`}
        style={{ minHeight: minH }}
      >
        Ad Slot: {slot} ({format})
      </div>
    );
  }

  // Failed states — collapse gracefully (no CLS since we never expanded)
  if (adStatus === "unfilled" || adStatus === "blocked" || adStatus === "error") return null;

  const minH = AD_SIZE_RESERVATION[format]?.minH ?? 90;

  const layoutAttrs: Record<string, string> =
    format === "auto"
      ? { "data-ad-format": "auto", "data-full-width-responsive": "true" }
      : format === "horizontal"
        ? { "data-ad-format": "horizontal", "data-full-width-responsive": "true" }
        : { "data-ad-format": "rectangle" };

  return (
    <div
      className={`overflow-hidden ${className}`}
      style={{ minHeight: adStatus === "loading" ? minH : undefined }}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        {...layoutAttrs}
      />
    </div>
  );
}
