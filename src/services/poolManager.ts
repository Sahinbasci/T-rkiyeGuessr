/**
 * PoolManager — Chunked Lazy-Loading + PanoPackage Dönüşümü
 *
 * Pre-computed lokasyon havuzunu chunk'lar halinde yükler,
 * BagSelector ile O(1) çekim yapar ve PanoPackage'e dönüştürür.
 *
 * Akış:
 * 1. ensurePoolLoaded(mode) → manifest fetch → ilk chunk blocking → geri kalan arka plan
 * 2. drawPackage(mode) → BagSelector.draw() → toPackage() → PanoPackage
 *
 * Singleton: Uygulama genelinde tek instance.
 */

import { PanoPackage, PanoData, GameMode } from "@/types";
import {
  PrecomputedLocation,
  PrecomputedChunk,
  PoolManifest,
  ChunkMeta,
} from "@/types/precomputed";
import { BagSelector } from "./bagSelector";
import { recordPersistentLocation, LocationFingerprint } from "./persistentHistory";
import { logger } from "@/utils/logger";

// ==================== CONSTANTS ====================

/** Base path for pool data files */
const POOL_BASE_PATH = "/data/pool";

/** Manifest file name */
const MANIFEST_FILE = "manifest.json";

/** Fetch timeout in ms */
const FETCH_TIMEOUT_MS = 10_000;

/** Retry count for failed chunk loads */
const MAX_CHUNK_RETRIES = 2;

// ==================== TYPES ====================

interface PoolModeState {
  /** Whether the manifest has been fetched */
  manifestLoaded: boolean;
  /** Which chunk IDs have been loaded */
  loadedChunkIds: Set<string>;
  /** Whether the first (critical) chunk is loaded */
  firstChunkReady: boolean;
  /** Promise for first-chunk loading (allows awaiting from multiple callers) */
  firstChunkPromise: Promise<void> | null;
  /** Whether background loading is in progress */
  backgroundLoading: boolean;
  /** Total locations loaded */
  totalLoaded: number;
}

// ==================== POOL MANAGER ====================

export class PoolManager {
  private bagSelector: BagSelector;
  private manifest: PoolManifest | null = null;

  private urbanState: PoolModeState = this.emptyModeState();
  private geoState: PoolModeState = this.emptyModeState();

  /** Current room ID (for persistent history recording) */
  private roomId: string | undefined;

  constructor() {
    this.bagSelector = new BagSelector();
  }

  // ==================== PUBLIC API ====================

  /**
   * Ensure pool is loaded for a given mode.
   *
   * First call: fetches manifest → loads first chunk (blocking) → starts background loading.
   * Subsequent calls: returns immediately if first chunk is ready.
   *
   * @returns true if pool has locations available
   */
  async ensurePoolLoaded(mode: GameMode): Promise<boolean> {
    const state = this.getModeState(mode);

    // Already have first chunk — return immediately
    if (state.firstChunkReady) {
      return state.totalLoaded > 0;
    }

    // Already loading — await existing promise
    if (state.firstChunkPromise) {
      await state.firstChunkPromise;
      return state.totalLoaded > 0;
    }

    // Start loading
    state.firstChunkPromise = this.loadFirstChunk(mode);
    await state.firstChunkPromise;

    return state.totalLoaded > 0;
  }

  /**
   * Draw a PanoPackage from the pre-computed pool.
   *
   * @returns PanoPackage or null if pool is empty/exhausted
   */
  async drawPackage(mode: GameMode): Promise<PanoPackage | null> {
    // Ensure pool is loaded
    const hasData = await this.ensurePoolLoaded(mode);
    if (!hasData) return null;

    // Draw from bag
    const loc = this.bagSelector.draw(mode);
    if (!loc) return null;

    // Convert to PanoPackage
    const pkg = this.toPackage(loc);

    // Record in persistent history
    const fingerprint: LocationFingerprint = {
      panoId: loc.panoId,
      locationHash: loc.locationHash,
      province: loc.province,
      clusterId: loc.clusterId,
      timestamp: Date.now(),
    };
    recordPersistentLocation(fingerprint, this.roomId);

    // Save bag state (solo mode)
    if (!this.roomId) {
      this.bagSelector.saveToLocalStorage();
    }

    logger.debug(
      `[PoolManager] Drew ${mode} package: [REDACTED] (pool remaining: ${this.bagSelector.getStats(mode).remaining})`
    );

    return pkg;
  }

  /**
   * Set room ID for multiplayer persistent history.
   */
  setRoomId(roomId: string | undefined): void {
    this.roomId = roomId;
  }

  /**
   * Reset all state for a new game.
   */
  reset(): void {
    this.bagSelector.reset();
    // Don't reset pool data — keep loaded chunks in memory
    // Only reset the bag draw order
    logger.debug("[PoolManager] Reset bag state for new game");
  }

  /**
   * Full reset — clears pool data and bag state.
   * Used when data version changes or for testing.
   */
  fullReset(): void {
    // Create a fresh BagSelector to clear all pool arrays AND bag state
    this.bagSelector = new BagSelector();
    this.manifest = null;
    this.urbanState = this.emptyModeState();
    this.geoState = this.emptyModeState();
    logger.debug("[PoolManager] Full reset — pool data cleared");
  }

  /**
   * Get current stats for debugging / telemetry.
   */
  getStats(mode: GameMode) {
    const state = this.getModeState(mode);
    const bagStats = this.bagSelector.getStats(mode);
    return {
      ...bagStats,
      manifestLoaded: this.manifest !== null,
      chunksLoaded: state.loadedChunkIds.size,
      totalLoaded: state.totalLoaded,
      firstChunkReady: state.firstChunkReady,
      backgroundLoading: state.backgroundLoading,
      manifestVersion: this.manifest?.version ?? null,
    };
  }

  // ==================== LOADING ====================

  /**
   * Load manifest + first chunk for a mode.
   */
  private async loadFirstChunk(mode: GameMode): Promise<void> {
    const state = this.getModeState(mode);

    try {
      // Step 1: Load manifest (shared between modes)
      if (!this.manifest) {
        this.manifest = await this.fetchManifest();
        if (!this.manifest) {
          logger.warn("[PoolManager] Failed to load manifest");
          return;
        }
        logger.debug(
          `[PoolManager] Manifest loaded: v${this.manifest.version}, ${this.manifest.totalUrban} urban, ${this.manifest.totalGeo} geo`
        );

        // Try to restore bag state from localStorage
        this.bagSelector.loadFromLocalStorage(this.manifest.version);
      }

      // Step 2: Find chunks for this mode
      const modeChunks = this.manifest.chunks.filter((c) => c.mode === mode);
      if (modeChunks.length === 0) {
        logger.warn(`[PoolManager] No chunks found for mode=${mode}`);
        return;
      }

      // Step 3: Load first chunk (blocking)
      const firstChunk = modeChunks[0];
      await this.loadChunk(firstChunk, mode);
      state.firstChunkReady = true;

      logger.debug(
        `[PoolManager] First chunk loaded for ${mode}: ${firstChunk.id} (${firstChunk.count} locations)`
      );

      // Step 4: Load remaining chunks in background
      if (modeChunks.length > 1) {
        this.loadRemainingChunks(modeChunks.slice(1), mode);
      }
    } catch (err) {
      logger.error(`[PoolManager] Error loading pool for ${mode}:`, err);
    }
  }

  /**
   * Load remaining chunks in the background (non-blocking).
   */
  private async loadRemainingChunks(chunks: ChunkMeta[], mode: GameMode): Promise<void> {
    const state = this.getModeState(mode);
    if (state.backgroundLoading) return;
    state.backgroundLoading = true;

    for (const chunk of chunks) {
      if (state.loadedChunkIds.has(chunk.id)) continue;

      try {
        await this.loadChunk(chunk, mode);
      } catch (err) {
        logger.warn(`[PoolManager] Background chunk load failed: ${chunk.id}`, err);
      }

      // Small delay between chunks to avoid blocking main thread
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    state.backgroundLoading = false;
    logger.debug(
      `[PoolManager] Background loading complete for ${mode}: ${state.totalLoaded} total locations`
    );
  }

  /**
   * Fetch and parse a single chunk, feeding locations into BagSelector.
   */
  private async loadChunk(chunkMeta: ChunkMeta, mode: GameMode): Promise<void> {
    const state = this.getModeState(mode);

    if (state.loadedChunkIds.has(chunkMeta.id)) return;

    let lastError: Error | null = null;

    for (let retry = 0; retry <= MAX_CHUNK_RETRIES; retry++) {
      try {
        const url = `${POOL_BASE_PATH}/${chunkMeta.url.replace(/^\/data\/pool\//, "")}`;
        const response = await this.fetchWithTimeout(url, FETCH_TIMEOUT_MS);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const chunk: PrecomputedChunk = await response.json();

        // Validate chunk
        if (!chunk.locations || !Array.isArray(chunk.locations)) {
          throw new Error(`Invalid chunk format: ${chunkMeta.id}`);
        }

        // Feed locations into BagSelector
        if (state.loadedChunkIds.size === 0) {
          // First chunk — setPool (initializes bag)
          this.bagSelector.setPool(mode, chunk.locations);
        } else {
          // Subsequent chunks — append (available on next reshuffle)
          this.bagSelector.appendToPool(mode, chunk.locations);
        }

        state.loadedChunkIds.add(chunkMeta.id);
        state.totalLoaded += chunk.locations.length;

        return; // Success
      } catch (err) {
        lastError = err as Error;
        if (retry < MAX_CHUNK_RETRIES) {
          // Exponential backoff
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, retry) * 500)
          );
        }
      }
    }

    logger.error(
      `[PoolManager] Failed to load chunk ${chunkMeta.id} after ${MAX_CHUNK_RETRIES + 1} attempts:`,
      lastError
    );
  }

  /**
   * Fetch the pool manifest file.
   */
  private async fetchManifest(): Promise<PoolManifest | null> {
    try {
      const url = `${POOL_BASE_PATH}/${MANIFEST_FILE}`;
      const response = await this.fetchWithTimeout(url, FETCH_TIMEOUT_MS);

      if (!response.ok) {
        logger.warn(`[PoolManager] Manifest fetch failed: HTTP ${response.status}`);
        return null;
      }

      return (await response.json()) as PoolManifest;
    } catch (err) {
      logger.warn("[PoolManager] Manifest fetch error:", err);
      return null;
    }
  }

  /**
   * Fetch with timeout support.
   */
  private async fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ==================== CONVERSION ====================

  /**
   * Convert PrecomputedLocation → PanoPackage.
   *
   * Uses the same pattern as dynamicUrbanGenerator.buildPanoPackage():
   * - pano0: center with stored heading
   * - pano1: same panoId, heading - 90° (left)
   * - pano2: same panoId, heading + 90° (right)
   * - pano3: same panoId, heading + 180° (behind)
   */
  private toPackage(loc: PrecomputedLocation): PanoPackage {
    const heading0 = loc.heading;

    const makeBranch = (headingOffset: number): PanoData => ({
      panoId: loc.panoId,
      lat: loc.lat,
      lng: loc.lng,
      heading: (heading0 + headingOffset + 360) % 360,
    });

    const locationName = loc.district
      ? `${loc.district}, ${loc.province}`
      : loc.province;

    // Map hint tags based on classification and road type
    const hintTags = this.getHintTags(loc);

    return {
      id: `pool_${loc.id}`,
      mode: loc.classification,
      region: loc.region,
      roadType: loc.roadType,
      hintTags,
      qualityScore: loc.qualityScore,
      blacklist: false,
      pano0: {
        panoId: loc.panoId,
        lat: loc.lat,
        lng: loc.lng,
        heading: heading0,
      },
      pano1: makeBranch(-90),  // Sol
      pano2: makeBranch(90),   // Sağ
      pano3: makeBranch(180),  // Arkası
      locationName,
    };
  }

  /**
   * Generate hint tags based on location metadata.
   */
  private getHintTags(loc: PrecomputedLocation): string[] {
    const tags: string[] = ["precomputed"];

    if (loc.classification === "urban") {
      tags.push("signage");
      if (loc.osmMeta.buildingDensity > 0.7) {
        tags.push("dense_urban");
      }
      if (loc.roadType === "urban_street") {
        tags.push("shop");
      }
    } else {
      tags.push("nature");
      if (loc.roadType === "highway") {
        tags.push("highway");
      } else if (loc.roadType === "rural" || loc.roadType === "village") {
        tags.push("landscape");
      }
    }

    return tags;
  }

  // ==================== HELPERS ====================

  private getModeState(mode: GameMode): PoolModeState {
    return mode === "urban" ? this.urbanState : this.geoState;
  }

  private emptyModeState(): PoolModeState {
    return {
      manifestLoaded: false,
      loadedChunkIds: new Set(),
      firstChunkReady: false,
      firstChunkPromise: null,
      backgroundLoading: false,
      totalLoaded: 0,
    };
  }
}

// ==================== SINGLETON ====================

let _instance: PoolManager | null = null;

/**
 * Get the singleton PoolManager instance.
 */
export function getPoolManager(): PoolManager {
  if (!_instance) {
    _instance = new PoolManager();
  }
  return _instance;
}

/**
 * Reset the singleton (for testing).
 */
export function resetPoolManagerSingleton(): void {
  if (_instance) {
    _instance.fullReset();
  }
  _instance = null;
}
