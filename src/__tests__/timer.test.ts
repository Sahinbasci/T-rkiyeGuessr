import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '@/hooks/useTimer';

describe('useTimer Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('başlangıç değerleri doğru olmalı', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ initialTime: 90, onTimeUp }));

    expect(result.current.timeRemaining).toBe(90);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isTimeUp).toBe(false);
    expect(result.current.formattedTime).toBe('01:30');
  });

  it('start ile timer başlamalı', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ initialTime: 90, onTimeUp }));

    act(() => {
      result.current.start();
    });

    expect(result.current.isRunning).toBe(true);
  });

  it('her saniye azalmalı', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ initialTime: 10, onTimeUp }));

    act(() => {
      result.current.start();
    });

    expect(result.current.timeRemaining).toBe(10);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.timeRemaining).toBe(9);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.timeRemaining).toBe(6);
  });

  it('pause ile durmalı', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ initialTime: 10, onTimeUp }));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.timeRemaining).toBe(7);

    act(() => {
      result.current.pause();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // Pause'dan sonra azalmamalı
    expect(result.current.timeRemaining).toBe(7);
  });

  it('reset yeni değere sıfırlamalı', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ initialTime: 10, onTimeUp }));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.timeRemaining).toBe(5);

    act(() => {
      result.current.reset(30);
    });

    expect(result.current.timeRemaining).toBe(30);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.isTimeUp).toBe(false);
  });

  it('0\'a düşünce onTimeUp SADECE 1 KEZ çağrılmalı', async () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ initialTime: 3, onTimeUp }));

    act(() => {
      result.current.start();
    });

    // 3 saniye ilerle
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Microtask'ları çalıştır
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.timeRemaining).toBe(0);
    expect(result.current.isTimeUp).toBe(true);
    expect(result.current.isRunning).toBe(false);

    // KRİTİK: onTimeUp SADECE 1 KEZ çağrılmalı
    expect(onTimeUp).toHaveBeenCalledTimes(1);

    // Ekstra zaman geçse bile tekrar çağrılmamalı
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });

  it('reset sonrası onTimeUp tekrar çağrılabilmeli', async () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ initialTime: 2, onTimeUp }));

    // İlk round
    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onTimeUp).toHaveBeenCalledTimes(1);

    // Reset ve yeni round
    act(() => {
      result.current.reset(2);
    });

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    // İkinci kez de çağrılmalı
    expect(onTimeUp).toHaveBeenCalledTimes(2);
  });

  it('formattedTime doğru format göstermeli', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ initialTime: 125, onTimeUp }));

    expect(result.current.formattedTime).toBe('02:05');

    act(() => {
      result.current.reset(5);
    });
    expect(result.current.formattedTime).toBe('00:05');

    act(() => {
      result.current.reset(0);
    });
    expect(result.current.formattedTime).toBe('00:00');
  });

  it('percentRemaining doğru hesaplanmalı', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ initialTime: 100, onTimeUp }));

    expect(result.current.percentRemaining).toBe(100);

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(50000);
    });

    expect(result.current.percentRemaining).toBe(50);
  });

  it('autoStart true ise otomatik başlamalı', () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() =>
      useTimer({ initialTime: 10, onTimeUp, autoStart: true })
    );

    expect(result.current.isRunning).toBe(true);
  });

  it('interval düzgün temizlenmeli (memory leak yok)', () => {
    const onTimeUp = vi.fn();
    const { result, unmount } = renderHook(() =>
      useTimer({ initialTime: 10, onTimeUp })
    );

    act(() => {
      result.current.start();
    });

    // Component unmount
    unmount();

    // Unmount sonrası timer çalışmamalı
    const activeTimers = vi.getTimerCount();
    expect(activeTimers).toBe(0);
  });
});

describe('Timer Spam Bug Prevention', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('hızlı round döngüsünde onTimeUp spam olmamalı', async () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ initialTime: 1, onTimeUp }));

    // 5 round simülasyonu
    for (let round = 0; round < 5; round++) {
      // Reset ayrı act bloğunda
      act(() => {
        result.current.reset(1);
      });

      // Start ayrı act bloğunda (state güncellemesi için)
      act(() => {
        result.current.start();
      });

      // Timer ilerlet
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Microtask'ları çalıştır
      await act(async () => {
        await vi.runAllTimersAsync();
      });
    }

    // Her round için sadece 1 kez = toplam 5 kez
    expect(onTimeUp).toHaveBeenCalledTimes(5);
  });

  it('aynı round\'da çoklu start çağrısı duplicate tetiklememeli', async () => {
    const onTimeUp = vi.fn();
    const { result } = renderHook(() => useTimer({ initialTime: 2, onTimeUp }));

    // Aynı anda birden fazla start çağrısı
    act(() => {
      result.current.start();
      result.current.start();
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });
});
