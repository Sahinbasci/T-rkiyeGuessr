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

interface UseAsyncLockReturn {
  /** Whether any action is currently locked/pending */
  isLocked: boolean;
  /** Run an async action with lock protection. Returns the action's result or undefined if locked. */
  run: <T>(action: () => Promise<T>, key?: string) => Promise<T | undefined>;
  /** Check if a specific key is locked */
  isKeyLocked: (key: string) => boolean;
  /** Reset all locks (emergency escape hatch) */
  resetAll: () => void;
}

export function useAsyncLock(): UseAsyncLockReturn {
  const [lockedKeys, setLockedKeys] = useState<Set<string>>(new Set());
  const lockedKeysRef = useRef<Set<string>>(new Set());

  const isLocked = lockedKeys.size > 0;

  const isKeyLocked = useCallback((key: string): boolean => {
    return lockedKeysRef.current.has(key);
  }, []);

  const run = useCallback(async <T>(
    action: () => Promise<T>,
    key: string = "__default__"
  ): Promise<T | undefined> => {
    // Synchronous check via ref (immune to stale closures)
    if (lockedKeysRef.current.has(key)) {
      console.log(`[AsyncLock] Action "${key}" blocked — already in flight`);
      return undefined;
    }

    // Acquire lock
    lockedKeysRef.current.add(key);
    setLockedKeys(new Set(lockedKeysRef.current));

    try {
      const result = await action();
      return result;
    } finally {
      // Release lock
      lockedKeysRef.current.delete(key);
      setLockedKeys(new Set(lockedKeysRef.current));
    }
  }, []);

  const resetAll = useCallback(() => {
    lockedKeysRef.current.clear();
    setLockedKeys(new Set());
  }, []);

  return { isLocked, run, isKeyLocked, resetAll };
}
