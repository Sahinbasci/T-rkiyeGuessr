/**
 * BagSelector — Fisher-Yates Shuffle Bag for O(1) Location Selection
 *
 * "Yerine koymadan rastgele seçim" (Random without replacement):
 * Tüm lokasyonları bir kart destesi gibi karıştır, sırayla çek.
 * Deste bitince yeniden karıştır. Tekrar olasılığı sıfır (deste bitmeden).
 *
 * Defense-in-depth: persistentHistory kontrolü ek güvenlik katmanı olarak korunur.
 */

import { PrecomputedLocation } from "@/types/precomputed";
import { GameMode } from "@/types";
import { checkPersistentHistory } from "./persistentHistory";
import { logger } from "@/utils/logger";

// ==================== TYPES ====================

export interface BagState {
  /** Shuffled index order */
  order: number[];
  /** Current draw pointer */
  pointer: number;
  /** Last drawn province (for boundary guard on reshuffle) */
  lastProvince: string | null;
  /** Generation counter (increments on each reshuffle) */
  generation: number;
  /** Pool version this bag was created for */
  poolVersion: number;
}

interface SerializedBagSelector {
  urban: BagState;
  geo: BagState;
}

// ==================== CONSTANTS ====================

/** Maximum skip attempts before returning null (prevents infinite loop) */
const MAX_SKIP_ATTEMPTS = 50;

/** localStorage key for solo mode persistence */
const STORAGE_KEY = "turkiye_guessr_bag_v1";

// ==================== FISHER-YATES SHUFFLE ====================

/** In-place Fisher-Yates shuffle. O(n). */
function fisherYatesShuffle(arr: number[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j];
    arr[j] = temp;
  }
}

// ==================== BAG SELECTOR ====================

export class BagSelector {
  private urbanPool: PrecomputedLocation[] = [];
  private geoPool: PrecomputedLocation[] = [];
  private urbanBag: BagState = this.emptyBag();
  private geoBag: BagState = this.emptyBag();

  // ==================== POOL MANAGEMENT ====================

  /**
   * Load locations into a pool and initialize bag.
   * Can be called multiple times as chunks arrive — appends to existing pool.
   */
  setPool(mode: GameMode, locations: PrecomputedLocation[]): void {
    if (mode === "urban") {
      this.urbanPool = locations;
    } else {
      this.geoPool = locations;
    }
    // Reset bag when pool changes (new data invalidates old order)
    this.resetBag(mode);
  }

  /**
   * Append new locations to pool (called as chunks load incrementally).
   * Does NOT reset bag — new entries will be available on next reshuffle.
   */
  appendToPool(mode: GameMode, newLocations: PrecomputedLocation[]): void {
    if (mode === "urban") {
      this.urbanPool.push(...newLocations);
    } else {
      this.geoPool.push(...newLocations);
    }
    // Don't reset bag — continue drawing from current order.
    // New locations become available on next reshuffle.
  }

  // ==================== DRAW ====================

  /**
   * O(1) amortized draw. Returns the next PrecomputedLocation from the bag.
   *
   * Guards:
   * 1. Province back-to-back prevention (skip if same as last)
   * 2. Persistent history check (skip if panoId or locationHash seen before)
   *
   * Returns null if:
   * - Pool is empty
   * - All candidates rejected after MAX_SKIP_ATTEMPTS
   */
  draw(mode: GameMode): PrecomputedLocation | null {
    const pool = this.getPool(mode);
    const bag = this.getBag(mode);

    if (pool.length === 0) return null;

    // Ensure bag is initialized
    if (bag.order.length === 0) {
      this.reshuffle(mode);
    }

    for (let skip = 0; skip < MAX_SKIP_ATTEMPTS; skip++) {
      // Reshuffle if exhausted
      if (bag.pointer >= bag.order.length) {
        this.reshuffle(mode);
      }

      const idx = bag.order[bag.pointer++];

      // Bounds check (pool may have shrunk)
      if (idx >= pool.length) continue;

      const loc = pool[idx];

      // Guard 1: Province back-to-back prevention
      if (loc.province === bag.lastProvince && pool.length > 1) {
        continue;
      }

      // Guard 2: Persistent history check (defense-in-depth)
      const historyReject = checkPersistentHistory(loc.panoId, loc.locationHash);
      if (historyReject) {
        continue;
      }

      // Accepted
      bag.lastProvince = loc.province;
      return loc;
    }

    // All attempts exhausted — return null, caller uses fallback
    logger.warn(`[BagSelector] All ${MAX_SKIP_ATTEMPTS} skip attempts exhausted for mode=${mode}`);
    return null;
  }

  // ==================== RESHUFFLE ====================

  private reshuffle(mode: GameMode): void {
    const pool = this.getPool(mode);
    const bag = this.getBag(mode);

    // Create index array [0, 1, 2, ..., n-1]
    const order = Array.from({ length: pool.length }, (_, i) => i);

    // Fisher-Yates shuffle
    fisherYatesShuffle(order);

    // Boundary guard: first element province != last drawn province
    if (bag.lastProvince && order.length > 1) {
      const firstProvince = pool[order[0]]?.province;
      if (firstProvince === bag.lastProvince) {
        // Find first non-matching province and swap
        for (let i = 1; i < order.length; i++) {
          if (pool[order[i]]?.province !== bag.lastProvince) {
            const temp = order[0];
            order[0] = order[i];
            order[i] = temp;
            break;
          }
        }
      }
    }

    bag.order = order;
    bag.pointer = 0;
    bag.generation++;

    logger.debug(
      `[BagSelector] Reshuffled mode=${mode}: ${order.length} entries, gen=${bag.generation}, lastProvince=${bag.lastProvince}`
    );
  }

  // ==================== STATE PERSISTENCE ====================

  /** Serialize bag state for storage (localStorage or Firebase). */
  exportState(): SerializedBagSelector {
    return {
      urban: { ...this.urbanBag },
      geo: { ...this.geoBag },
    };
  }

  /** Restore bag state from storage. Validates pool version match. */
  importState(state: SerializedBagSelector, poolVersion: number): boolean {
    // Validate pool version — if data changed, bag state is invalid
    if (state.urban.poolVersion !== poolVersion || state.geo.poolVersion !== poolVersion) {
      logger.debug("[BagSelector] Pool version mismatch — discarding saved state");
      return false;
    }

    // Validate pointer bounds
    if (state.urban.pointer <= state.urban.order.length) {
      this.urbanBag = { ...state.urban };
    }
    if (state.geo.pointer <= state.geo.order.length) {
      this.geoBag = { ...state.geo };
    }

    return true;
  }

  /** Save to localStorage (solo mode). */
  saveToLocalStorage(): void {
    try {
      const data = JSON.stringify(this.exportState());
      localStorage.setItem(STORAGE_KEY, data);
    } catch {
      // localStorage full or unavailable
    }
  }

  /** Load from localStorage (solo mode). Returns true if restored. */
  loadFromLocalStorage(poolVersion: number): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const state = JSON.parse(raw) as SerializedBagSelector;
      return this.importState(state, poolVersion);
    } catch {
      return false;
    }
  }

  // ==================== RESET ====================

  /** Reset bags for new game session. */
  reset(): void {
    this.urbanBag = this.emptyBag();
    this.geoBag = this.emptyBag();
    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  /** Reset only the bag for a specific mode (pool stays). */
  private resetBag(mode: GameMode): void {
    if (mode === "urban") {
      this.urbanBag = this.emptyBag();
    } else {
      this.geoBag = this.emptyBag();
    }
  }

  // ==================== HELPERS ====================

  private getPool(mode: GameMode): PrecomputedLocation[] {
    return mode === "urban" ? this.urbanPool : this.geoPool;
  }

  private getBag(mode: GameMode): BagState {
    return mode === "urban" ? this.urbanBag : this.geoBag;
  }

  private emptyBag(): BagState {
    return {
      order: [],
      pointer: 0,
      lastProvince: null,
      generation: 0,
      poolVersion: 0,
    };
  }

  // ==================== DEBUG / TELEMETRY ====================

  /** Get current bag stats for debugging. */
  getStats(mode: GameMode): {
    poolSize: number;
    bagSize: number;
    pointer: number;
    remaining: number;
    generation: number;
    lastProvince: string | null;
  } {
    const pool = this.getPool(mode);
    const bag = this.getBag(mode);
    return {
      poolSize: pool.length,
      bagSize: bag.order.length,
      pointer: bag.pointer,
      remaining: Math.max(0, bag.order.length - bag.pointer),
      generation: bag.generation,
      lastProvince: bag.lastProvince,
    };
  }
}
