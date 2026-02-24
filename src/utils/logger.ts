/**
 * Centralized Logger Utility
 *
 * Production'da konum adı, koordinat ve algoritma detayları gibi
 * hassas bilgilerin konsola sızmasını engeller.
 *
 * - logger.debug(): Sadece development'ta çalışır (ENABLE_DEBUG_LOGS)
 * - logger.warn(): Sadece development'ta çalışır
 * - logger.error(): HER ZAMAN çalışır (hata kaybetme riski)
 */

import { FEATURE_FLAGS } from "@/config/production";

const IS_DEV = FEATURE_FLAGS.ENABLE_DEBUG_LOGS;

export const logger = {
  /** Development-only debug log. Production'da tamamen sessiz. */
  debug: (...args: unknown[]): void => {
    if (IS_DEV) console.log(...args);
  },

  /** Development-only warning. Production'da tamamen sessiz. */
  warn: (...args: unknown[]): void => {
    if (IS_DEV) console.warn(...args);
  },

  /** Always-on error log. Hatalar asla yutulmaz. */
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
};
