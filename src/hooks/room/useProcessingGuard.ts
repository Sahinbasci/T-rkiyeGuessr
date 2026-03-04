"use client";

/**
 * useProcessingGuard — Centralized round processing lock management.
 *
 * Prevents double-start, ensures consistent cleanup, adds debug tracing.
 * Extracted from useRoom.ts (A1 HARDENING section).
 *
 * This is a pure React hook with no Firebase dependencies.
 */

import { useRef, useCallback } from "react";
import { trackEvent } from "@/utils/telemetry";
import { logger } from "@/utils/logger";
import type { ProcessingGuard } from "./types";

export function useProcessingGuard(): ProcessingGuard {
  const isProcessingRef = useRef<boolean>(false);
  const processingRoundIdRef = useRef<number | null>(null);
  const processingStartTimeRef = useRef<number | null>(null);

  const startProcessing = useCallback((reason: string, roundId?: number): boolean => {
    if (isProcessingRef.current) {
      logger.debug(`[MP] startProcessing: already active, skipping (reason=${reason})`);
      return false;
    }
    isProcessingRef.current = true;
    processingStartTimeRef.current = Date.now();
    if (roundId !== undefined) {
      processingRoundIdRef.current = roundId;
    }
    trackEvent("processing_start", { reason, roundId });
    logger.debug(`[MP] startProcessing: reason=${reason} roundId=${roundId ?? "n/a"}`);
    return true;
  }, []);

  const stopProcessing = useCallback((reason: string): void => {
    const duration = processingStartTimeRef.current
      ? Date.now() - processingStartTimeRef.current
      : 0;
    isProcessingRef.current = false;
    processingStartTimeRef.current = null;
    trackEvent("processing_stop", { reason, durationMs: duration });
    logger.debug(`[MP] stopProcessing: reason=${reason} duration=${duration}ms`);
  }, []);

  const forceResetProcessing = useCallback((reason: string): void => {
    const wasProcessing = isProcessingRef.current;
    isProcessingRef.current = false;
    processingStartTimeRef.current = null;
    processingRoundIdRef.current = null;
    if (wasProcessing) {
      trackEvent("processing_force_reset", { reason });
      logger.warn(`[MP] forceResetProcessing: was stuck, forced reset (reason=${reason})`);
    }
  }, []);

  return {
    startProcessing,
    stopProcessing,
    forceResetProcessing,
    isProcessingRef,
    processingRoundIdRef,
    processingStartTimeRef,
  };
}
