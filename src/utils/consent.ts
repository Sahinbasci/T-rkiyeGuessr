/**
 * Cookie consent utility — localStorage-based.
 * Key: turkiyeguessr_consent
 * Categories: necessary (always on), analytics, marketing
 */

export interface ConsentState {
  necessary: boolean; // always true
  analytics: boolean;
  marketing: boolean;
  version?: number;    // schema version for future migrations
  updatedAt?: number;  // epoch ms — when consent was last set
}

const STORAGE_KEY = "turkiyeguessr_consent";
export const CONSENT_CHANGED_EVENT = "turkiyeguessr:consent-changed";

const DEFAULT_CONSENT: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
};

/* ─── Read ─── */

export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    // force necessary always true
    return { ...parsed, necessary: true };
  } catch {
    return null;
  }
}

export function hasConsented(): boolean {
  return getConsent() !== null;
}

export function isMarketingAllowed(): boolean {
  return getConsent()?.marketing ?? false;
}

export function isAnalyticsAllowed(): boolean {
  return getConsent()?.analytics ?? false;
}

/* ─── Write ─── */

export function setConsent(state: ConsentState): void {
  if (typeof window === "undefined") return;
  const safe: ConsentState = { ...state, necessary: true, version: 1, updatedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: safe }));

  // Signal Google Consent Mode v2
  import("./consentMode").then((m) => m.updateConsentMode(safe)).catch(() => {});
}

/* ─── Shorthand helpers ─── */

export function acceptAll(): void {
  setConsent({ necessary: true, analytics: true, marketing: true });
}

export function rejectOptional(): void {
  setConsent({ ...DEFAULT_CONSENT });
}
