"use client";

/**
 * useAsyncLock — Reusable async-lock hook for debouncing critical actions.
 *
 * BUG-004 FIX: Prevents double-clicks, rapid spam, and concurrent async operations.
 *
 * Usage:
 *   const { isLocked, run } = useAsyncLock();
 *   <button disabled={isLocked} onClick={() => run(async () => { ... })}>
 *
 * Features:
 * - Blocks repeated triggers while async action is pending
 * - Supports per-action keys (startGame, submitGuess, nextRound, leaveRoom)
 * - Returns isLocked state for UI binding (disabled, spinner)
 * - Automatically unlocks on completion or error
 */

import { useState, useCallback, useRef } from "react";
import { logger } from "@/utils/logger";

interface UseAsyncLockReturn {
  /** Whether any action is currently locked/pending */
  isLocked: boolean;
  /** Run an async action with lock protection. Returns the action's result or undefined if locked. Optional timeoutMs auto-releases lock. */
  run: <T>(action: () => Promise<T>, key?: string, timeoutMs?: number) => Promise<T | undefined>;
  /** Check if a specific key is locked */
  isKeyLocked: (key: string) => boolean;
  /** Reset all locks (emergency escape hatch) */
  resetAll: () => void;
}

export function useAsyncLock(): UseAsyncLockReturn {
  const [lockedKeys, setLockedKeys] = useState<Set<string>>(new Set());
  const lockedKeysRef = useRef<Set<string>>(new Set());

  const isLocked = lockedKeys.size > 0;

  // BUG-F FIX: Read from reactive state (not ref) so components re-render
  // when lock status changes. Ref is for synchronous guards in run().
  const isKeyLocked = useCallback((key: string): boolean => {
    return lockedKeys.has(key);
  }, [lockedKeys]);

  const run = useCallback(async <T>(
    action: () => Promise<T>,
    key: string = "__default__",
    timeoutMs?: number
  ): Promise<T | undefined> => {
    // Synchronous check via ref (immune to stale closures)
    if (lockedKeysRef.current.has(key)) {
      logger.debug(`[AsyncLock] Action "${key}" blocked — already in flight`);
      return undefined;
    }

    // Acquire lock
    lockedKeysRef.current.add(key);
    setLockedKeys(new Set(lockedKeysRef.current));

    const releaseLock = () => {
      lockedKeysRef.current.delete(key);
      setLockedKeys(new Set(lockedKeysRef.current));
    };

    // Safety timeout: auto-release lock if action hangs (e.g. Firebase offline)
    let safetyTimer: NodeJS.Timeout | null = null;
    if (timeoutMs) {
      safetyTimer = setTimeout(() => {
        if (lockedKeysRef.current.has(key)) {
          logger.warn(`[AsyncLock] Action "${key}" timed out after ${timeoutMs}ms — force releasing lock`);
          releaseLock();
        }
      }, timeoutMs);
    }

    try {
      const result = await action();
      return result;
    } finally {
      if (safetyTimer) clearTimeout(safetyTimer);
      releaseLock();
    }
  }, []);

  const resetAll = useCallback(() => {
    lockedKeysRef.current.clear();
    setLockedKeys(new Set());
  }, []);

  return { isLocked, run, isKeyLocked, resetAll };
}
