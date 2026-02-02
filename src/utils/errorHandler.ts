/**
 * Production Error Handler
 * Merkezi hata yönetimi ve kullanıcı dostu mesajlar
 */

import { ERROR_MESSAGES, FEATURE_FLAGS } from "@/config/production";

// Hata türleri
export type ErrorType =
  | "NETWORK"
  | "FIREBASE"
  | "MAPS_API"
  | "VALIDATION"
  | "RATE_LIMIT"
  | "UNKNOWN";

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  originalError?: unknown;
  timestamp: number;
}

// Son hatalar (debug için)
const errorLog: AppError[] = [];
const MAX_ERROR_LOG = 50;

/**
 * Hata oluştur ve logla
 */
export function createError(
  type: ErrorType,
  message: string,
  userMessage?: string,
  originalError?: unknown
): AppError {
  const error: AppError = {
    type,
    message,
    userMessage: userMessage || getDefaultUserMessage(type),
    originalError,
    timestamp: Date.now(),
  };

  // Log'a ekle
  errorLog.push(error);
  if (errorLog.length > MAX_ERROR_LOG) {
    errorLog.shift();
  }

  // Console'a yaz (sadece development'ta)
  if (FEATURE_FLAGS.ENABLE_DEBUG_LOGS) {
    console.error(`[${type}] ${message}`, originalError);
  }

  return error;
}

/**
 * Varsayılan kullanıcı mesajı
 */
function getDefaultUserMessage(type: ErrorType): string {
  switch (type) {
    case "NETWORK":
      return ERROR_MESSAGES.CONNECTION_ERROR;
    case "FIREBASE":
      return ERROR_MESSAGES.CONNECTION_ERROR;
    case "MAPS_API":
      return "Harita yüklenemedi. Sayfayı yenileyin.";
    case "VALIDATION":
      return "Geçersiz veri. Lütfen kontrol edin.";
    case "RATE_LIMIT":
      return ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
    default:
      return "Bir hata oluştu. Lütfen tekrar deneyin.";
  }
}

/**
 * Firebase hatasını işle
 */
export function handleFirebaseError(error: unknown): AppError {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Bilinen Firebase hata kodları
  if (errorMessage.includes("PERMISSION_DENIED")) {
    return createError(
      "FIREBASE",
      "Firebase permission denied",
      "Bu işlem için yetkiniz yok.",
      error
    );
  }

  if (errorMessage.includes("NETWORK_ERROR") || errorMessage.includes("network")) {
    return createError(
      "NETWORK",
      "Firebase network error",
      ERROR_MESSAGES.CONNECTION_ERROR,
      error
    );
  }

  return createError(
    "FIREBASE",
    errorMessage,
    ERROR_MESSAGES.CONNECTION_ERROR,
    error
  );
}

/**
 * Google Maps hatasını işle
 */
export function handleMapsError(error: unknown): AppError {
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (errorMessage.includes("ZERO_RESULTS")) {
    return createError(
      "MAPS_API",
      "No street view available",
      "Bu konumda Street View bulunmuyor.",
      error
    );
  }

  if (errorMessage.includes("OVER_QUERY_LIMIT")) {
    return createError(
      "MAPS_API",
      "Maps API quota exceeded",
      "API limiti aşıldı. Lütfen bekleyin.",
      error
    );
  }

  return createError(
    "MAPS_API",
    errorMessage,
    "Harita yüklenemedi. Sayfayı yenileyin.",
    error
  );
}

/**
 * Genel hata işleme
 */
export function handleError(error: unknown): AppError {
  if (error instanceof Error) {
    // Firebase hatası mı?
    if (error.message.includes("Firebase") || error.message.includes("firebase")) {
      return handleFirebaseError(error);
    }

    // Maps hatası mı?
    if (error.message.includes("google") || error.message.includes("maps")) {
      return handleMapsError(error);
    }
  }

  return createError(
    "UNKNOWN",
    error instanceof Error ? error.message : String(error),
    undefined,
    error
  );
}

/**
 * Son hataları getir (debug için)
 */
export function getErrorLog(): AppError[] {
  return [...errorLog];
}

/**
 * Hata logunu temizle
 */
export function clearErrorLog(): void {
  errorLog.length = 0;
}

// Global error handler (production için)
if (typeof window !== "undefined" && FEATURE_FLAGS.ENABLE_ERROR_REPORTING) {
  window.addEventListener("error", (event) => {
    createError("UNKNOWN", event.message, undefined, event.error);
  });

  window.addEventListener("unhandledrejection", (event) => {
    createError("UNKNOWN", "Unhandled promise rejection", undefined, event.reason);
  });
}
