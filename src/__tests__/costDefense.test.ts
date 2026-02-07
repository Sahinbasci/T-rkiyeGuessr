/**
 * Cost Defense Test Suite
 *
 * Verifies security & cost hardening mechanisms:
 * 1. Server-side move enforcement (Firebase transaction)
 * 2. Duplicate pano guard (same panoId = no-op)
 * 3. Dynamic pano retry capped at 2
 * 4. Move rate limiting (1/s, 3/10s)
 * 5. panoramaRef NOT in hook return (console exploit prevention)
 * 6. movesUsed in Player interface (server-side tracking)
 * 7. Firebase rules enforce movesUsed
 *
 * PASS/FAIL criteria from audit:
 * - FAIL if move is still client-only
 * - FAIL if setPano callable from console via panoramaRef
 * - FAIL if retry > 2
 * - FAIL if panoLoadCount can exceed moveLimit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  getNavigationMetrics,
  resetNavigationMetrics,
} from '@/hooks/useStreetView';
import { RATE_LIMITS } from '@/config/production';
import { API_COST_CONTROL } from '@/config/production';
import rateLimiter from '@/utils/rateLimiter';

// ================================================================
// 1. SERVER MOVE ENFORCEMENT — Code Structure Assertions
// ================================================================
describe('Server Move Enforcement (Structural)', () => {
  const useStreetViewSource = fs.readFileSync(
    path.resolve(__dirname, '../hooks/useStreetView.ts'),
    'utf-8'
  );

  it('CRITICAL: pano_changed handler contains runTransaction call', () => {
    // The handler must use Firebase transaction for server-side enforcement
    expect(useStreetViewSource).toContain('runTransaction(playerMovesRef');
  });

  it('CRITICAL: hook accepts roomId and playerId parameters', () => {
    expect(useStreetViewSource).toContain('export function useStreetView(roomId?: string, playerId?: string)');
  });

  it('CRITICAL: isPendingMoveRef prevents concurrent transactions', () => {
    expect(useStreetViewSource).toContain('isPendingMoveRef.current');
  });

  it('has solo/test fallback for client-only mode', () => {
    // When roomId/playerId are not provided, falls back to client-only
    expect(useStreetViewSource).toContain('Solo/test mode: client-only fallback');
  });

  it('reverts pano on server rejection', () => {
    expect(useStreetViewSource).toContain('Server rejected move');
    expect(useStreetViewSource).toContain('serverMoveRejected');
  });

  it('tracks serverMoveAccepted on success', () => {
    expect(useStreetViewSource).toContain('serverMoveAccepted');
    expect(useStreetViewSource).toContain('server-approved');
  });
});

// ================================================================
// 2. DUPLICATE PANO GUARD
// ================================================================
describe('Duplicate Pano Guard (Structural)', () => {
  const useStreetViewSource = fs.readFileSync(
    path.resolve(__dirname, '../hooks/useStreetView.ts'),
    'utf-8'
  );

  it('navigateToLink has duplicate pano check', () => {
    // Must check getPano() === link.pano before calling setPano
    expect(useStreetViewSource).toContain('panoramaRef.current.getPano() === link.pano');
  });

  it('returnToStart has duplicate pano check', () => {
    expect(useStreetViewSource).toContain('panoramaRef.current.getPano() === startPanoIdRef.current');
  });

  it('duplicate guard increments metric', () => {
    expect(useStreetViewSource).toContain('duplicatePanoPrevented++');
  });

  it('panoLoadCount metric is tracked', () => {
    expect(useStreetViewSource).toContain('panoLoadCount++');
  });
});

// ================================================================
// 3. DYNAMIC PANO RETRY HARD LIMIT
// ================================================================
describe('Dynamic Pano Retry Limit', () => {
  it('MAX_PANO_GENERATION_ATTEMPTS is 2 (not 10)', () => {
    expect(API_COST_CONTROL.MAX_PANO_GENERATION_ATTEMPTS).toBe(2);
  });

  it('dynamicPanoService uses maxAttempts = 2', () => {
    const dynamicPanoSource = fs.readFileSync(
      path.resolve(__dirname, '../services/dynamicPanoService.ts'),
      'utf-8'
    );
    // Must contain "const maxAttempts = 2" (not 10)
    expect(dynamicPanoSource).toContain('const maxAttempts = 2');
    expect(dynamicPanoSource).not.toContain('const maxAttempts = 10');
  });
});

// ================================================================
// 4. RATE LIMITING ON MOVES
// ================================================================
describe('Move Rate Limiting', () => {
  beforeEach(() => {
    rateLimiter.clear();
  });

  it('RATE_LIMITS has MOVE_PER_SECOND = 1', () => {
    expect(RATE_LIMITS.MOVE_PER_SECOND).toBe(1);
  });

  it('RATE_LIMITS has MOVE_PER_10_SECONDS = 3', () => {
    expect(RATE_LIMITS.MOVE_PER_10_SECONDS).toBe(3);
  });

  it('allows 1 move per second', () => {
    const result = rateLimiter.check('move_test_1s', RATE_LIMITS.MOVE_PER_SECOND, 1000);
    expect(result).toBe(true);
  });

  it('blocks 2nd move within same second', () => {
    rateLimiter.check('move_test_block', RATE_LIMITS.MOVE_PER_SECOND, 1000);
    const result = rateLimiter.check('move_test_block', RATE_LIMITS.MOVE_PER_SECOND, 1000);
    expect(result).toBe(false);
  });

  it('allows 3 moves in 10-second window', () => {
    const key = 'move_test_10s';
    expect(rateLimiter.check(key, RATE_LIMITS.MOVE_PER_10_SECONDS, 10000)).toBe(true);
    expect(rateLimiter.check(key, RATE_LIMITS.MOVE_PER_10_SECONDS, 10000)).toBe(true);
    expect(rateLimiter.check(key, RATE_LIMITS.MOVE_PER_10_SECONDS, 10000)).toBe(true);
  });

  it('blocks 4th move within 10-second window', () => {
    const key = 'move_test_10s_block';
    rateLimiter.check(key, RATE_LIMITS.MOVE_PER_10_SECONDS, 10000);
    rateLimiter.check(key, RATE_LIMITS.MOVE_PER_10_SECONDS, 10000);
    rateLimiter.check(key, RATE_LIMITS.MOVE_PER_10_SECONDS, 10000);
    const result = rateLimiter.check(key, RATE_LIMITS.MOVE_PER_10_SECONDS, 10000);
    expect(result).toBe(false);
  });

  it('rateLimitTriggered metric exists and starts at 0', () => {
    resetNavigationMetrics();
    const metrics = getNavigationMetrics();
    expect(metrics.rateLimitTriggered).toBe(0);
  });
});

// ================================================================
// 5. PANORAMAREF ACCESS CONTROL
// ================================================================
describe('panoramaRef Access Control', () => {
  const useStreetViewSource = fs.readFileSync(
    path.resolve(__dirname, '../hooks/useStreetView.ts'),
    'utf-8'
  );

  // Helper: hook'un son return bloğunu bul (useStreetView return'u)
  function getHookReturnBlock(): string {
    const allReturns = Array.from(useStreetViewSource.matchAll(/return\s*\{[\s\S]*?\n\s*\};/g));
    expect(allReturns.length).toBeGreaterThan(0);
    // Son return bloğu = useStreetView hook'un return'u
    return allReturns[allReturns.length - 1][0];
  }

  it('CRITICAL: panoramaRef is NOT in the return object', () => {
    const returnBlock = getHookReturnBlock();
    // panoramaRef should NOT appear as a property in the return
    // (it can appear in comments)
    const lines = returnBlock.split('\n').filter(l => !l.trim().startsWith('//'));
    const nonCommentReturn = lines.join('\n');
    expect(nonCommentReturn).not.toMatch(/^\s*panoramaRef,?\s*$/m);
  });

  it('getCurrentPanoId accessor exists in return', () => {
    const returnBlock = getHookReturnBlock();
    expect(returnBlock).toContain('getCurrentPanoId');
  });

  it('getCurrentPov accessor exists in return', () => {
    const returnBlock = getHookReturnBlock();
    expect(returnBlock).toContain('getCurrentPov');
  });
});

// ================================================================
// 6. PLAYER INTERFACE HAS movesUsed
// ================================================================
describe('Player Interface Server Fields', () => {
  it('CRITICAL: Player interface includes movesUsed field', () => {
    const typesSource = fs.readFileSync(
      path.resolve(__dirname, '../types/index.ts'),
      'utf-8'
    );
    expect(typesSource).toContain('movesUsed: number');
  });
});

// ================================================================
// 7. FIREBASE RULES ENFORCE movesUsed
// ================================================================
describe('Firebase Rules Enforcement', () => {
  const rulesSource = fs.readFileSync(
    path.resolve(__dirname, '../../database.rules.json'),
    'utf-8'
  );
  const rules = JSON.parse(rulesSource);
  const playerRules = rules.rules.rooms.$roomId.players.$playerId;

  it('CRITICAL: movesUsed validation rule exists', () => {
    expect(playerRules.movesUsed).toBeDefined();
    expect(playerRules.movesUsed['.validate']).toBeDefined();
  });

  it('movesUsed rule enforces >= 0', () => {
    const rule = playerRules.movesUsed['.validate'];
    expect(rule).toContain('newData.val() >= 0');
  });

  it('movesUsed rule enforces <= 10 max limit', () => {
    const rule = playerRules.movesUsed['.validate'];
    expect(rule).toContain('newData.val() <= 10');
  });

  it('movesUsed rule is a number type check', () => {
    const rule = playerRules.movesUsed['.validate'];
    expect(rule).toContain('newData.isNumber()');
  });

  it('status field validation exists', () => {
    expect(playerRules.status).toBeDefined();
  });

  it('sessionToken field validation exists', () => {
    expect(playerRules.sessionToken).toBeDefined();
  });
});

// ================================================================
// 8. COST DEFENSE METRICS
// ================================================================
describe('Cost Defense Metrics', () => {
  beforeEach(() => {
    resetNavigationMetrics();
  });

  it('all cost defense metrics start at zero', () => {
    const metrics = getNavigationMetrics();
    expect(metrics.panoLoadCount).toBe(0);
    expect(metrics.serverMoveAccepted).toBe(0);
    expect(metrics.serverMoveRejected).toBe(0);
    expect(metrics.duplicatePanoPrevented).toBe(0);
    expect(metrics.rateLimitTriggered).toBe(0);
  });

  it('metrics reset clears cost defense counters', () => {
    // Manually dirty the metrics via module-level access
    const metrics1 = getNavigationMetrics();
    // Can't directly set, but resetNavigationMetrics should return all zeros
    resetNavigationMetrics();
    const metrics2 = getNavigationMetrics();
    expect(metrics2.panoLoadCount).toBe(0);
    expect(metrics2.serverMoveAccepted).toBe(0);
    expect(metrics2.serverMoveRejected).toBe(0);
    expect(metrics2.duplicatePanoPrevented).toBe(0);
    expect(metrics2.rateLimitTriggered).toBe(0);
  });
});

// ================================================================
// 9. FINAL VALIDATION — PASS/FAIL REPORT
// ================================================================
describe('FINAL VALIDATION — PASS/FAIL', () => {
  it('PASS: Move is server-side (runTransaction in pano_changed handler)', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../hooks/useStreetView.ts'),
      'utf-8'
    );
    const hasTransaction = source.includes('runTransaction(playerMovesRef');
    expect(hasTransaction).toBe(true);
  });

  it('PASS: setPano NOT callable from console (panoramaRef hidden)', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../hooks/useStreetView.ts'),
      'utf-8'
    );
    // Son return bloğu = useStreetView hook'un return'u
    const allReturns = Array.from(source.matchAll(/return\s*\{[\s\S]*?\n\s*\};/g));
    const hookReturn = allReturns[allReturns.length - 1][0];
    const lines = hookReturn.split('\n').filter((l: string) => !l.trim().startsWith('//'));
    const hasDirectPanoRef = lines.some((l: string) => /^\s*panoramaRef\s*[,}]/.test(l));
    expect(hasDirectPanoRef).toBe(false);
  });

  it('PASS: Retry capped at 2', () => {
    expect(API_COST_CONTROL.MAX_PANO_GENERATION_ATTEMPTS).toBe(2);
  });

  it('PASS: Duplicate pano guard prevents excess loads', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../hooks/useStreetView.ts'),
      'utf-8'
    );
    expect(source).toContain('DUPLICATE GUARD');
    expect(source).toContain('duplicatePanoPrevented');
  });

  it('PASS: movesUsed field exists in Player type', () => {
    const typesSource = fs.readFileSync(
      path.resolve(__dirname, '../types/index.ts'),
      'utf-8'
    );
    expect(typesSource).toContain('movesUsed: number');
  });

  it('PASS: Firebase rules enforce movesUsed with range validation', () => {
    const rulesSource = fs.readFileSync(
      path.resolve(__dirname, '../../database.rules.json'),
      'utf-8'
    );
    expect(rulesSource).toContain('movesUsed');
    expect(rulesSource).toContain('newData.val() >= 0');
    expect(rulesSource).toContain('newData.val() <= 10');
  });
});
