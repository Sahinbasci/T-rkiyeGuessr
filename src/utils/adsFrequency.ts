/**
 * Interstitial frequency cap — sessionStorage-based (per tab).
 *
 * Rules:
 *  - Max 1 interstitial per session (tab)
 *  - Minimum 3 rounds must be played before showing
 */

const KEY_SHOWN_AT = "tg_interstitial_shown";
const KEY_ROUNDS = "tg_rounds_played";
const MIN_ROUNDS = 3;

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

/** Returns true if an interstitial can be shown right now. */
export function canShowInterstitialNow(): boolean {
  const s = getStorage();
  if (!s) return false;

  // Already shown this session
  if (s.getItem(KEY_SHOWN_AT)) return false;

  // Not enough rounds played
  const rounds = parseInt(s.getItem(KEY_ROUNDS) ?? "0", 10);
  if (rounds < MIN_ROUNDS) return false;

  return true;
}

/** Mark that the interstitial was shown (blocks further shows this session). */
export function markInterstitialShown(): void {
  getStorage()?.setItem(KEY_SHOWN_AT, String(Date.now()));
}

/** Increment rounds-played counter. Call at end of each round. */
export function incrementRoundsPlayed(): void {
  const s = getStorage();
  if (!s) return;
  const current = parseInt(s.getItem(KEY_ROUNDS) ?? "0", 10);
  s.setItem(KEY_ROUNDS, String(current + 1));
}
