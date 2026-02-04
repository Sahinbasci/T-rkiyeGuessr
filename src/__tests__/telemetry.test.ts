import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  initTelemetry,
  setTelemetryContext,
  trackEvent,
  trackDuplicateAttempt,
  trackListener,
  trackError,
  getTelemetrySummary,
  cleanupTelemetry,
  getSession,
} from '@/utils/telemetry';

describe('Telemetry Module', () => {
  beforeEach(() => {
    // Her testten önce telemetry'i yeniden başlat
    cleanupTelemetry();
    initTelemetry();
  });

  describe('initTelemetry', () => {
    it('session oluşturmalı', () => {
      const session = getSession();
      expect(session).not.toBeNull();
      expect(session?.sessionId).toMatch(/^ses_\d+_[a-z0-9]+$/);
    });

    it('counters sıfır olmalı', () => {
      const session = getSession();
      expect(session?.counters.join).toBe(0);
      expect(session?.counters.leave).toBe(0);
      expect(session?.counters.roundStart).toBe(0);
      expect(session?.counters.roundEnd).toBe(0);
    });
  });

  describe('setTelemetryContext', () => {
    it('context ayarlamalı', () => {
      setTelemetryContext({
        roomId: 'ABC123',
        playerId: 'player1',
        playerName: 'TestPlayer',
      });

      const session = getSession();
      expect(session?.roomId).toBe('ABC123');
      expect(session?.playerId).toBe('player1');
      expect(session?.playerName).toBe('TestPlayer');
    });

    it('kısmi context güncellemeli', () => {
      setTelemetryContext({ roomId: 'ABC123' });
      setTelemetryContext({ playerId: 'player1' });

      const session = getSession();
      expect(session?.roomId).toBe('ABC123');
      expect(session?.playerId).toBe('player1');
    });
  });

  describe('trackEvent', () => {
    it('event sayacını artırmalı', () => {
      trackEvent('join');
      trackEvent('join');
      trackEvent('roundStart');

      const session = getSession();
      expect(session?.counters.join).toBe(2);
      expect(session?.counters.roundStart).toBe(1);
    });

    it('event listesine eklemeli', () => {
      trackEvent('submitGuess', { roundId: 1, lat: 39.0, lng: 35.0 });

      const session = getSession();
      expect(session?.events.length).toBe(1);
      expect(session?.events[0].event).toBe('submitGuess');
      expect(session?.events[0].metadata?.roundId).toBe(1);
    });

    it('100 event limitini aşmamalı', () => {
      for (let i = 0; i < 150; i++) {
        trackEvent('join');
      }

      const session = getSession();
      expect(session?.events.length).toBe(100);
      expect(session?.counters.join).toBe(150); // Sayaç hala doğru
    });
  });

  describe('trackDuplicateAttempt', () => {
    it('duplicate attempt kaydetmeli', () => {
      trackDuplicateAttempt('roundEnd', 1);
      trackDuplicateAttempt('roundEnd', 1);
      trackDuplicateAttempt('timeUp', 2);

      const session = getSession();
      expect(session?.duplicateAttempts.roundEnd).toEqual([1, 1]);
      expect(session?.duplicateAttempts.timeUp).toEqual([2]);
    });
  });

  describe('trackListener', () => {
    it('subscribe/unsubscribe saymalı', () => {
      trackListener('subscribe');
      trackListener('subscribe');
      trackListener('unsubscribe');

      const session = getSession();
      expect(session?.listenerCounts.subscriptions).toBe(2);
      expect(session?.listenerCounts.unsubscriptions).toBe(1);
    });
  });

  describe('trackError', () => {
    it('error kaydetmeli', () => {
      trackError('Test error', 'testContext');
      trackError(new Error('Error object'), 'anotherContext');

      const session = getSession();
      expect(session?.errors.length).toBe(2);
      expect(session?.errors[0].message).toBe('Test error');
      expect(session?.errors[0].context).toBe('testContext');
      expect(session?.errors[1].message).toBe('Error object');
      expect(session?.counters.error).toBe(2);
    });

    it('50 error limitini aşmamalı', () => {
      for (let i = 0; i < 60; i++) {
        trackError(`Error ${i}`);
      }

      const session = getSession();
      expect(session?.errors.length).toBe(50);
      expect(session?.counters.error).toBe(60); // Sayaç hala doğru
    });
  });

  describe('getTelemetrySummary', () => {
    it('doğru özet döndürmeli', () => {
      setTelemetryContext({ roomId: 'TEST123' });
      trackEvent('join');
      trackEvent('roundStart');
      trackEvent('roundEnd');
      trackDuplicateAttempt('timeUp', 1);
      trackListener('subscribe');
      trackError('Test error');

      const summary = getTelemetrySummary();

      expect(summary).not.toBeNull();
      expect(summary?.counters.join).toBe(1);
      expect(summary?.counters.roundStart).toBe(1);
      expect(summary?.counters.roundEnd).toBe(1);
      expect(summary?.duplicateAttempts.timeUp).toBe(1);
      expect(summary?.listenerBalance).toBe(1);
      expect(summary?.errorCount).toBe(1);
    });

    it('listener balance doğru hesaplanmalı', () => {
      trackListener('subscribe');
      trackListener('subscribe');
      trackListener('subscribe');
      trackListener('unsubscribe');
      trackListener('unsubscribe');

      const summary = getTelemetrySummary();
      expect(summary?.listenerBalance).toBe(1);
    });
  });

  describe('cleanupTelemetry', () => {
    it('session temizlemeli', () => {
      trackEvent('join');
      cleanupTelemetry();

      const session = getSession();
      expect(session).toBeNull();
    });
  });
});

describe('Telemetry Bug Prevention', () => {
  beforeEach(() => {
    cleanupTelemetry();
    initTelemetry();
  });

  it('timer spam tespiti - çoklu timeUp aynı round', () => {
    // Simülasyon: Timer 0'da spam olursa aynı round için
    // birden fazla timeUp attempt olur
    trackDuplicateAttempt('timeUp', 1);
    trackDuplicateAttempt('timeUp', 1);
    trackDuplicateAttempt('timeUp', 1);

    const session = getSession();
    const round1Attempts = session?.duplicateAttempts.timeUp.filter(
      (r) => r === 1
    ).length;

    expect(round1Attempts).toBe(3);
    // Bu durumda spam var demektir
    expect(round1Attempts).toBeGreaterThan(1);
  });

  it('roundEnd spam tespiti', () => {
    trackDuplicateAttempt('roundEnd', 2);
    trackDuplicateAttempt('roundEnd', 2);

    const summary = getTelemetrySummary();
    expect(summary?.duplicateAttempts.roundEnd).toBe(2);
  });

  it('listener leak tespiti', () => {
    // Subscribe fazlaysa leak var
    trackListener('subscribe');
    trackListener('subscribe');
    trackListener('subscribe');
    trackListener('subscribe');
    // Sadece 1 unsubscribe

    const summary = getTelemetrySummary();
    expect(summary?.listenerBalance).toBe(4);
    // 3'ten fazla = potansiyel leak
    expect(summary?.listenerBalance).toBeGreaterThan(3);
  });
});
