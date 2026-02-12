/**
 * useTimer Hook
 * Round bazlı geri sayım timer'ı
 *
 * SERVER TIMESTAMP TABANLI:
 * - Tab arka planda olsa bile doğru süreyi hesaplar
 * - roundStartTime (server timestamp) + timeLimit'e göre kalan süreyi hesaplar
 * - Page Visibility API ile arka plandan döndüğünde sync olur
 */

import { useState, useEffect, useCallback, useRef } from "react";

interface UseTimerProps {
  initialTime: number; // saniye
  onTimeUp: () => void;
  autoStart?: boolean;
  // YENİ: Server timestamp tabanlı timer için
  serverStartTime?: number | null; // Firebase roundStartTime (ms)
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
  serverStartTime = null,
}: UseTimerProps): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const onTimeUpRef = useRef(onTimeUp);
  const hasCalledTimeUp = useRef(false);
  const localStartTimeRef = useRef<number | null>(null);

  // onTimeUp callback'ini güncelle
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Server timestamp'a göre kalan süreyi hesapla
  const calculateRemainingTime = useCallback(() => {
    if (!serverStartTime) return initialTime; // timeRemaining yerine initialTime

    const now = Date.now();
    const elapsed = Math.floor((now - serverStartTime) / 1000);
    const remaining = Math.max(0, initialTime - elapsed);
    return remaining;
  }, [serverStartTime, initialTime]); // timeRemaining kaldırıldı - dependency cycle önleme

  // Local fallback: compute remaining from Date.now() instead of decrement
  const calculateLocalRemainingTime = useCallback(() => {
    if (!localStartTimeRef.current) return initialTime;
    const elapsed = Math.floor((Date.now() - localStartTimeRef.current) / 1000);
    return Math.max(0, initialTime - elapsed);
  }, [initialTime]);

  // Page Visibility API - arka plandan döndüğünde sync ol
  useEffect(() => {
    if (!isRunning) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Arka plandan döndük - sync ol
        const remaining = serverStartTime
          ? calculateRemainingTime()
          : calculateLocalRemainingTime();
        setTimeRemaining(remaining);

        // Süre bittiyse onTimeUp çağır
        if (remaining <= 0 && !hasCalledTimeUp.current) {
          hasCalledTimeUp.current = true;
          setIsRunning(false);
          setIsTimeUp(true);
          queueMicrotask(() => {
            onTimeUpRef.current();
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [serverStartTime, isRunning, calculateRemainingTime, calculateLocalRemainingTime]);

  // serverStartTime değiştiğinde timer'ı sync et ve YENİDEN BAŞLAT
  // Bu effect yeni round başladığında timer'ı otomatik olarak başlatır
  const prevServerStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // serverStartTime değiştiyse (yeni round başladı)
    if (serverStartTime && serverStartTime !== prevServerStartTimeRef.current) {
      prevServerStartTimeRef.current = serverStartTime;

      // Timer'ı sıfırla ve yeniden başlat
      hasCalledTimeUp.current = false;
      setIsTimeUp(false);
      localStartTimeRef.current = Date.now();

      const remaining = calculateRemainingTime();
      setTimeRemaining(remaining);

      // Timer'ı başlat (eğer süre kaldıysa)
      if (remaining > 0) {
        setIsRunning(true);
      } else if (!hasCalledTimeUp.current) {
        hasCalledTimeUp.current = true;
        setIsRunning(false);
        setIsTimeUp(true);
        queueMicrotask(() => {
          onTimeUpRef.current();
        });
      }
    }
  }, [serverStartTime, initialTime]); // calculateRemainingTime dependency kaldırıldı - sonsuz döngü önleme

  // Timer effect - her saniye güncelle
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Server timestamp varsa ona göre hesapla, yoksa local countdown
      if (serverStartTime) {
        const remaining = calculateRemainingTime();
        setTimeRemaining(remaining);

        if (remaining <= 0 && !hasCalledTimeUp.current) {
          hasCalledTimeUp.current = true;
          setIsRunning(false);
          setIsTimeUp(true);
          queueMicrotask(() => {
            onTimeUpRef.current();
          });
        }
      } else {
        // Fallback: Date.now()-based countdown (drift-proof in background tabs)
        const remaining = calculateLocalRemainingTime();
        setTimeRemaining(remaining);

        if (remaining <= 0 && !hasCalledTimeUp.current) {
          hasCalledTimeUp.current = true;
          setIsRunning(false);
          setIsTimeUp(true);
          queueMicrotask(() => {
            onTimeUpRef.current();
          });
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isRunning, serverStartTime, calculateRemainingTime, calculateLocalRemainingTime]);

  // Formatlanmış zaman (MM:SS)
  const formattedTime = `${Math.floor(timeRemaining / 60)
    .toString()
    .padStart(2, "0")}:${(timeRemaining % 60).toString().padStart(2, "0")}`;

  // Kalan yüzde
  const percentRemaining = (timeRemaining / initialTime) * 100;

  // Başlat
  const start = useCallback(() => {
    if (timeRemaining > 0) {
      localStartTimeRef.current = Date.now();
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
      localStartTimeRef.current = null;
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
