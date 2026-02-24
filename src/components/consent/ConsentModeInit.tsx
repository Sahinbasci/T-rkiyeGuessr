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
  const script = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      'ad_storage': 'denied',
      'ad_user_data': 'denied',
      'ad_personalization': 'denied',
      'analytics_storage': 'denied',
      'functionality_storage': 'granted',
      'security_storage': 'granted',
      'wait_for_update': 500
    });
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
