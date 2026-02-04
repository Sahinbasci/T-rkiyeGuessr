/**
 * useTimer Hook
 * Round bazlı geri sayım timer'ı
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface UseTimerProps {
  initialTime: number; // saniye
  onTimeUp: () => void;
  autoStart?: boolean;
}

interface UseTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  isTimeUp: boolean;
  formattedTime: string;
  start: () => void;
  pause: () => void;
  reset: (newTime?: number) => void;
  percentRemaining: number;
}

export function useTimer({
  initialTime,
  onTimeUp,
  autoStart = false,
}: UseTimerProps): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const onTimeUpRef = useRef(onTimeUp);
  const hasCalledTimeUp = useRef(false);

  // onTimeUp callback'ini güncelle
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Timer effect - KRİTİK FIX: timeRemaining dependency kaldırıldı
  // Bu, her saniye yeni interval oluşturulmasını önler
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        // Zaten 0 veya negatifse işlem yapma
        if (prev <= 0) {
          return 0;
        }

        const newTime = prev - 1;

        if (newTime <= 0) {
          setIsRunning(false);
          setIsTimeUp(true);

          // Sadece bir kez çağır - çift tetikleme önleme
          if (!hasCalledTimeUp.current) {
            hasCalledTimeUp.current = true;
            // setTimeout yerine queueMicrotask kullan (daha güvenilir)
            queueMicrotask(() => {
              onTimeUpRef.current();
            });
          }

          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isRunning]); // KRİTİK: timeRemaining kaldırıldı!

  // Formatlanmış zaman (MM:SS)
  const formattedTime = `${Math.floor(timeRemaining / 60)
    .toString()
    .padStart(2, "0")}:${(timeRemaining % 60).toString().padStart(2, "0")}`;

  // Kalan yüzde
  const percentRemaining = (timeRemaining / initialTime) * 100;

  // Başlat
  const start = useCallback(() => {
    if (timeRemaining > 0) {
      setIsRunning(true);
      setIsTimeUp(false);
    }
  }, [timeRemaining]);

  // Duraklat
  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Sıfırla
  const reset = useCallback(
    (newTime?: number) => {
      setTimeRemaining(newTime ?? initialTime);
      setIsRunning(false);
      setIsTimeUp(false);
      hasCalledTimeUp.current = false;
    },
    [initialTime]
  );

  return {
    timeRemaining,
    isRunning,
    isTimeUp,
    formattedTime,
    start,
    pause,
    reset,
    percentRemaining,
  };
}
