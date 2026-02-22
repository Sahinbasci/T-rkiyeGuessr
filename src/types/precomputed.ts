// ==================== PRE-COMPUTED LOCATION POOL ====================
// Offline olarak toplanan, doğrulanan ve sınıflandırılan lokasyonlar.
// Runtime'da sıfır API maliyetiyle kullanılır.

export interface PrecomputedLocation {
  /** Unique stable ID, e.g., "pc_istanbul_fatih_001" */
  id: string;

  /** Validated Google Street View panorama ID */
  panoId: string;

  /** Resolved coordinates of the panorama */
  lat: number;
  lng: number;

  /** Default road-facing heading (0-360 degrees) */
  heading: number;

  /** Province name, e.g., "Istanbul" */
  province: string;

  /** District name, e.g., "Fatih" */
  district: string;

  /** Region code matching PanoPackage.region */
  region:
    | "marmara"
    | "ege"
    | "akdeniz"
    | "karadeniz"
    | "ic_anadolu"
    | "dogu_anadolu"
    | "guneydogu";

  /** Mode classification determined offline by OSM polygon check */
  classification: "urban" | "geo";

  /** Road type from OSM highway tags */
  roadType: "urban_street" | "highway" | "rural" | "village";

  /** Quality score 1-5, computed during offline validation */
  qualityScore: number;

  /** Grid hash at 3-decimal precision (~111m cells), pre-computed: "41.008_28.978" */
  locationHash: string;

  /** Province + grid hash: "Istanbul__41.008_28.978" */
  clusterId: string;

  /** ISO date of when this panorama was validated */
  validatedAt: string;

  /** OpenStreetMap classification metadata */
  osmMeta: {
    /** Whether point falls inside a city/district admin boundary polygon */
    insideCityBoundary: boolean;
    /** Nearest OSM highway tag value: "primary", "residential", "track", etc. */
    nearestRoadClass: string;
    /** Building density proxy (0-1): 0 = no buildings, 1 = dense urban */
    buildingDensity: number;
  };
}

/** A chunk of pre-computed locations loaded from a JSON file */
export interface PrecomputedChunk {
  /** Chunk identifier, e.g., "urban_0", "geo_1" */
  chunkId: string;
  /** Mode for all locations in this chunk */
  mode: "urban" | "geo";
  /** Locations in this chunk */
  locations: PrecomputedLocation[];
  /** Data format version */
  version: number;
  /** ISO date of generation */
  generatedAt: string;
}

/** Manifest file listing all available chunks */
export interface PoolManifest {
  /** Data format version — bag state is invalidated if this changes */
  version: number;
  /** ISO date of generation */
  generatedAt: string;
  /** List of available chunks */
  chunks: ChunkMeta[];
  /** Total urban locations across all chunks */
  totalUrban: number;
  /** Total geo locations across all chunks */
  totalGeo: number;
}

export interface ChunkMeta {
  /** Chunk identifier */
  id: string;
  /** Mode for this chunk */
  mode: "urban" | "geo";
  /** Number of locations in this chunk */
  count: number;
  /** Relative URL path: "/data/pool/urban_chunk_0.json" */
  url: string;
  /** SHA-256 hash for cache-busting */
  hash: string;
}
