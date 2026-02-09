/**
 * Client-Side Rate Limiter
 * Abuse prevention için istemci tarafı rate limiting
 *
 * NOT: Bu güvenlik katmanı değil, UX ve maliyet optimizasyonu içindir.
 * Gerçek güvenlik Firebase Security Rules ile sağlanır.
 */

import { RATE_LIMITS, FEATURE_FLAGS } from "@/config/production";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  check(key: string, maxRequests: number, windowMs: number = 60000): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now >= entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (entry.count >= maxRequests) {
      if (FEATURE_FLAGS.ENABLE_DEBUG_LOGS) {
        console.warn(`Rate limit aşıldı: ${key} (${entry.count}/${maxRequests})`);
      }
      return false;
    }

    entry.count++;
    return true;
  }

  getTimeUntilReset(key: string): number {
    const entry = this.limits.get(key);
    if (!entry) return 0;
    return Math.max(0, entry.resetTime - Date.now());
  }

  reset(key: string): void {
    this.limits.delete(key);
  }

  clear(): void {
    this.limits.clear();
  }
}

const rateLimiter = new RateLimiter();

export function canCreateRoom(): boolean {
  return rateLimiter.check("room_create", RATE_LIMITS.ROOM_CREATION_PER_MINUTE);
}

export function canJoinRoom(): boolean {
  return rateLimiter.check("room_join", RATE_LIMITS.ROOM_JOIN_PER_MINUTE);
}

export function canSubmitGuess(playerId: string, round: number): boolean {
  const key = `guess_${playerId}_${round}`;
  return rateLimiter.check(key, RATE_LIMITS.GUESS_PER_ROUND, 5 * 60 * 1000);
}

export function resetGuessLimit(playerId: string): void {
  for (let i = 0; i <= 10; i++) {
    rateLimiter.reset(`guess_${playerId}_${i}`);
  }
}

export function getRoomCreateCooldown(): number {
  return rateLimiter.getTimeUntilReset("room_create");
}

export default rateLimiter;
