/**
 * turkishFormat.ts — Turkish locale-safe text formatting utilities.
 *
 * Turkish has special casing rules:
 * - "i" uppercases to "İ" (not "I")
 * - "I" lowercases to "ı" (not "i")
 * - Standard JS .toUpperCase()/.toLowerCase() breaks these
 */

/** Turkish locale identifier */
const TR_LOCALE = "tr-TR";

/**
 * Turkish-safe uppercase conversion.
 * "istanbul" -> "İSTANBUL" (not "ISTANBUL")
 */
export function toTurkishUpperCase(str: string): string {
  return str.toLocaleUpperCase(TR_LOCALE);
}

/**
 * Turkish-safe lowercase conversion.
 * "İSTANBUL" -> "istanbul" (not "ıstanbul")
 */
export function toTurkishLowerCase(str: string): string {
  return str.toLocaleLowerCase(TR_LOCALE);
}

/**
 * Turkish-safe title case (first letter of each word uppercase).
 * "fatih, istanbul" -> "Fatih, İstanbul"
 */
export function toTurkishTitleCase(str: string): string {
  return str
    .toLocaleLowerCase(TR_LOCALE)
    .replace(/(^|\s|,\s*)(\S)/g, (match, prefix, char) => {
      return prefix + char.toLocaleUpperCase(TR_LOCALE);
    });
}

/**
 * Normalize Turkish text — NFC normalization + trim.
 * Handles copy-paste with decomposed Unicode (NFD) by converting to composed (NFC).
 */
export function normalizeTurkish(str: string): string {
  return str.normalize("NFC").trim();
}

/**
 * Format a location name for display.
 * Input: "Fatih, İstanbul" or "Fatih" or null/undefined
 * Output: { district: string; province: string; formatted: string }
 *
 * Rules:
 * - Split on comma to get district and province
 * - Apply Turkish title case to both parts
 * - Join as "İlce, İl"
 * - Graceful fallback if no comma (district = province = input)
 * - Graceful fallback if null/empty -> "Bilinmeyen Konum"
 */
export interface FormattedLocation {
  district: string;
  province: string;
  formatted: string;
}

export function formatLocationName(name: string | null | undefined): FormattedLocation {
  const FALLBACK: FormattedLocation = {
    district: "Bilinmeyen",
    province: "Konum",
    formatted: "Bilinmeyen Konum",
  };

  if (!name || typeof name !== "string") return FALLBACK;

  const normalized = normalizeTurkish(name);
  if (!normalized) return FALLBACK;

  const parts = normalized.split(",").map(s => s.trim()).filter(Boolean);

  if (parts.length === 0) return FALLBACK;

  const district = toTurkishTitleCase(parts[0]);
  const province = parts.length >= 2 ? toTurkishTitleCase(parts[1]) : district;

  return {
    district,
    province,
    formatted: parts.length >= 2 ? `${district}, ${province}` : district,
  };
}

/**
 * Turkish-safe string comparison (locale-aware collation).
 * Useful for sorting location names correctly.
 */
export function turkishCompare(a: string, b: string): number {
  return a.localeCompare(b, TR_LOCALE);
}
