/**
 * shareUtils.ts — Share message building and URL generation.
 *
 * Provides testable pure functions for:
 * - Building share messages with room code + URL
 * - Generating WhatsApp share URLs (api.whatsapp.com/send)
 * - Web Share API integration (navigator.share)
 *
 * GAP #3 FIX: Extracted from HomeClient.tsx inline handler for testability.
 */

/** The canonical site URL used in share messages */
export const SITE_URL = "https://turkiyeguessr.xyz";

/**
 * Build a share message with room code and join URL.
 * Returns { text, url, fullMessage } for use with Web Share API or WhatsApp.
 */
export function buildShareMessage(roomId: string): {
  text: string;
  url: string;
  fullMessage: string;
} {
  const url = `${SITE_URL}?room=${roomId}`;
  const text = `🎯 TürkiyeGuessr'da bana katıl!\n\nOda Kodu: ${roomId}`;
  const fullMessage = `${text}\n\n${url}`;
  return { text, url, fullMessage };
}

/**
 * Build a WhatsApp share URL.
 * Uses api.whatsapp.com/send which reliably opens the contact picker on most devices.
 * wa.me/?text= is NOT used because it often shows the main screen instead.
 */
export function buildWhatsAppUrl(roomId: string): string {
  const { fullMessage } = buildShareMessage(roomId);
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(fullMessage)}`;
}

/**
 * Execute share action.
 * 1. Tries navigator.share (Web Share API) for native contact picker on supported browsers.
 * 2. Falls back to opening WhatsApp URL in new tab.
 *
 * Returns: "webshare" | "whatsapp" | "cancelled" indicating which path was taken.
 */
export async function executeShare(
  roomId: string,
  navigatorShare?: typeof navigator.share,
  windowOpen?: typeof window.open,
): Promise<"webshare" | "whatsapp" | "cancelled"> {
  const { text, url } = buildShareMessage(roomId);

  // Try Web Share API first
  const shareFn = navigatorShare ?? (typeof navigator !== "undefined" ? navigator.share?.bind(navigator) : undefined);
  if (shareFn) {
    try {
      await shareFn({ title: "TürkiyeGuessr", text, url });
      return "webshare";
    } catch {
      // User cancelled or API unavailable — fall through to WhatsApp
    }
  }

  // Fallback to WhatsApp URL
  const whatsappUrl = buildWhatsAppUrl(roomId);
  const openFn = windowOpen ?? (typeof window !== "undefined" ? window.open.bind(window) : undefined);
  if (openFn) {
    openFn(whatsappUrl, "_blank");
  }
  return "whatsapp";
}
