"use client";

/**
 * useNotifications — Game notification system.
 *
 * Manages player join/leave/host-change notifications with auto-dismiss.
 * Extracted from useRoom.ts notification helpers.
 *
 * Pure React hook, no Firebase dependencies.
 */

import { useState, useCallback, useRef } from "react";
import type { GameNotification } from "@/utils/roomLogic";
import type { NotificationControls } from "./types";

// Re-export for backward compatibility
export type { GameNotification };

// Per-session counter for telemetry
let notificationFiredCount = 0;

export function useNotifications(): NotificationControls {
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const timerIdsRef = useRef<Set<NodeJS.Timeout>>(new Set());

  const addNotification = useCallback((
    type: GameNotification["type"],
    message: string,
    playerName?: string
  ) => {
    notificationFiredCount++;
    const notification: GameNotification = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      playerName,
      timestamp: Date.now(),
    };

    setNotifications(prev => [...prev, notification]);

    // Auto-dismiss after 5s (tracked for cleanup on unmount)
    const timerId = setTimeout(() => {
      timerIdsRef.current.delete(timerId);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
    timerIdsRef.current.add(timerId);
  }, []);

  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const cleanupTimers = useCallback(() => {
    timerIdsRef.current.forEach(clearTimeout);
    timerIdsRef.current.clear();
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    timerIdsRef.current.forEach(clearTimeout);
    timerIdsRef.current.clear();
  }, []);

  return {
    notifications,
    addNotification,
    dismissNotification,
    cleanupTimers,
    clearAll,
  };
}

/** Expose counter for telemetry/testing. */
export function getNotificationCount(): number {
  return notificationFiredCount;
}
