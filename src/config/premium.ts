/**
 * Premium (ads-free) feature flag.
 *
 * ENV:
 *  NEXT_PUBLIC_ENABLE_PREMIUM — "true" to enable premium mode (default "false")
 *
 * When premium is active:
 *  - All ad slots are suppressed (no AdSense render)
 *  - Premium CTA is hidden (user is already premium)
 *
 * This is a feature-flag-only gate. No payment integration yet.
 * Rollback: set NEXT_PUBLIC_ENABLE_PREMIUM=false in env.
 */

export const PREMIUM_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_PREMIUM === "true";

/**
 * Returns true if ads should be suppressed for the current user.
 * Currently a global flag; later this will check user auth state.
 */
export function isPremiumUser(): boolean {
  return PREMIUM_ENABLED;
}
