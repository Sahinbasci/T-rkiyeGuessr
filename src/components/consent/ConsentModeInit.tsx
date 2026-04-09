import Script from "next/script";

/**
 * Inline script that initializes Google Consent Mode v2 defaults.
 * Must render in <head> BEFORE any ad/analytics scripts.
 *
 * Sets all optional consent categories to 'denied' by default (safe EEA default).
 * The actual stored consent is hydrated later by initConsentMode() in CookieBanner.
 *
 * Server component — no "use client".
 */
export function ConsentModeInit() {
  const debugLog =
    process.env.NODE_ENV !== "production"
      ? `
          try {
            var args = Array.prototype.slice.call(arguments);
            console.info.apply(console, ["[GA4]"].concat(args));
          } catch (error) {}
        `
      : "";

  return (
    <Script id="consent-mode-init" strategy="beforeInteractive">
      {`
        window.__ga4Ready = false;
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function() {
          window.dataLayer.push(arguments);
          ${debugLog}
        };
        window.gtag('consent', 'default', {
          'ad_storage': 'denied',
          'ad_user_data': 'denied',
          'ad_personalization': 'denied',
          'analytics_storage': 'denied',
          'functionality_storage': 'granted',
          'security_storage': 'granted',
          'wait_for_update': 500
        });
      `}
    </Script>
  );
}
