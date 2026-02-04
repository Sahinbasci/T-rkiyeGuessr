import { describe, it, expect } from 'vitest';
import {
  calculateDistance,
  calculateScore,
  formatDistance,
  generateRoomCode,
  generatePlayerId,
  isLikelyInTurkey,
  generateRandomCoordinates,
  getTurkeyCenter,
} from '@/utils';

describe('calculateDistance', () => {
  it('aynı nokta için 0 döndürmeli', () => {
    const coord = { lat: 41.0082, lng: 28.9784 }; // İstanbul
    expect(calculateDistance(coord, coord)).toBe(0);
  });

  it('İstanbul-Ankara arası ~350km olmalı', () => {
    const istanbul = { lat: 41.0082, lng: 28.9784 };
    const ankara = { lat: 39.9334, lng: 32.8597 };
    const distance = calculateDistance(istanbul, ankara);
    expect(distance).toBeGreaterThan(300);
    expect(distance).toBeLessThan(400);
  });

  it('İstanbul-Van arası ~1000km+ olmalı', () => {
    const istanbul = { lat: 41.0082, lng: 28.9784 };
    const van = { lat: 38.5012, lng: 43.4089 };
    const distance = calculateDistance(istanbul, van);
    expect(distance).toBeGreaterThan(1000);
    expect(distance).toBeLessThan(1500);
  });
});

describe('calculateScore', () => {
  it('0.1km altı için maksimum puan', () => {
    expect(calculateScore(0)).toBe(5000);
    expect(calculateScore(0.05)).toBe(5000);
    expect(calculateScore(0.1)).toBe(5000);
  });

  it('mesafe arttıkça puan azalmalı', () => {
    const score10km = calculateScore(10);
    const score100km = calculateScore(100);
    const score500km = calculateScore(500);

    expect(score10km).toBeGreaterThan(score100km);
    expect(score100km).toBeGreaterThan(score500km);
  });

  it('2000km+ için 0 puan', () => {
    expect(calculateScore(2000)).toBe(0);
    expect(calculateScore(3000)).toBe(0);
  });

  it('orta mesafede makul puan', () => {
    const score50km = calculateScore(50);
    expect(score50km).toBeGreaterThan(1000);
    expect(score50km).toBeLessThan(4000);
  });
});

describe('formatDistance', () => {
  it('tahmin yoksa "Tahmin yok" döndürmeli', () => {
    expect(formatDistance(9999)).toBe('Tahmin yok');
    expect(formatDistance(10000)).toBe('Tahmin yok');
  });

  it('1km altı için metre göstermeli', () => {
    expect(formatDistance(0.5)).toBe('500 m');
    expect(formatDistance(0.1)).toBe('100 m');
  });

  it('10km altı için ondalık göstermeli', () => {
    expect(formatDistance(5.3)).toBe('5.3 km');
    expect(formatDistance(9.9)).toBe('9.9 km');
  });

  it('10km üstü için tam sayı göstermeli', () => {
    expect(formatDistance(15.6)).toBe('16 km');
    expect(formatDistance(100.2)).toBe('100 km');
  });
});

describe('generateRoomCode', () => {
  it('6 karakter olmalı', () => {
    const code = generateRoomCode();
    expect(code.length).toBe(6);
  });

  it('sadece izin verilen karakterleri içermeli', () => {
    const allowedChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      for (const char of code) {
        expect(allowedChars).toContain(char);
      }
    }
  });

  it('karışık karakterler içermeli (I, O, 0, 1 yok)', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateRoomCode();
      expect(code).not.toContain('I');
      expect(code).not.toContain('O');
      expect(code).not.toContain('0');
      expect(code).not.toContain('1');
    }
  });
});

describe('generatePlayerId', () => {
  it('15 karakter olmalı', () => {
    const id = generatePlayerId();
    expect(id.length).toBe(15);
  });

  it('unique ID üretmeli', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      ids.add(generatePlayerId());
    }
    expect(ids.size).toBe(1000);
  });
});

describe('isLikelyInTurkey', () => {
  it('İstanbul için true', () => {
    expect(isLikelyInTurkey({ lat: 41.0082, lng: 28.9784 })).toBe(true);
  });

  it('Ankara için true', () => {
    expect(isLikelyInTurkey({ lat: 39.9334, lng: 32.8597 })).toBe(true);
  });

  it('Van için true', () => {
    expect(isLikelyInTurkey({ lat: 38.5012, lng: 43.4089 })).toBe(true);
  });

  it('Antalya için true', () => {
    expect(isLikelyInTurkey({ lat: 36.8969, lng: 30.7133 })).toBe(true);
  });

  it('Paris için false', () => {
    expect(isLikelyInTurkey({ lat: 48.8566, lng: 2.3522 })).toBe(false);
  });

  it('Rusya için false', () => {
    expect(isLikelyInTurkey({ lat: 55.7558, lng: 37.6173 })).toBe(false);
  });

  it('Karadeniz ortası için false', () => {
    expect(isLikelyInTurkey({ lat: 43.0, lng: 35.0 })).toBe(false);
  });
});

describe('generateRandomCoordinates', () => {
  it('Türkiye sınırları içinde koordinat üretmeli', () => {
    for (let i = 0; i < 100; i++) {
      const coord = generateRandomCoordinates();
      expect(coord.lat).toBeGreaterThanOrEqual(36);
      expect(coord.lat).toBeLessThanOrEqual(42);
      expect(coord.lng).toBeGreaterThanOrEqual(26);
      expect(coord.lng).toBeLessThanOrEqual(45);
    }
  });
});

describe('getTurkeyCenter', () => {
  it('Türkiye merkezi döndürmeli', () => {
    const center = getTurkeyCenter();
    expect(center.lat).toBe(39.0);
    expect(center.lng).toBe(35.0);
  });
});
