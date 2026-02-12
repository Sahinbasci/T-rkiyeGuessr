/**
 * Production-Safe PanoId Refresh Migration Script (P2.1) — v3 FINAL
 *
 * Tüm 142 paket için expired CAoSLEFG panoId'leri yeniler.
 * Google Maps StreetViewService kullanarak pano0 koordinatından
 * en yakın geçerli panoramayı bulur.
 *
 * Kullanım:
 *   1. npm run dev ile uygulamayı başlat
 *   2. Tarayıcıda aç, Google Maps'in yüklendiğinden emin ol
 *   3. DevTools Console'u aç (F12 → Console)
 *   4. Bu script'in TAMAMINI yapıştır ve Enter'a bas
 *   5. ~2-3 dakika bekle (142 paket × ~1s)
 *   6. İndirilen JSON dosyalarını kaydet
 *   7. Sonra çalıştır: node scripts/applyPanoIdMapping.js ~/Downloads/panoId_mapping.json
 *
 * Güvenlik:
 *   - Double-paste koruması (global guard)
 *   - Exponential backoff ile retry (OVER_QUERY_LIMIT, UNKNOWN_ERROR)
 *   - Progressive radius [25, 50, 100, 200, 500] (pano drift önlemi)
 *   - OUTDOOR önce, DEFAULT fallback ONLY if all Phase1 = ZERO_RESULTS
 *   - Koordinat DEĞİŞTİRMEZ — sadece id → panoId mapping
 *   - Çift artifact: panoId_mapping.json + panoId_results.json
 *   - Enum-safe status comparisons (no string coercion)
 *   - Accurate API call counting (includes retries)
 */

(async function refreshPanoIds() {
  // ═══════════════════════════════════════════════════════
  // GUARD: Prevent double paste
  // ═══════════════════════════════════════════════════════
  if (window.__PANO_REFRESH_RUNNING) {
    console.error("❌ Script zaten çalışıyor! Sayfayı yenile ve tekrar dene.");
    return;
  }
  window.__PANO_REFRESH_RUNNING = true;

  // ═══════════════════════════════════════════════════════
  // VERIFY: Google Maps API loaded
  // ═══════════════════════════════════════════════════════
  if (typeof google === "undefined" || !google.maps || !google.maps.StreetViewService) {
    console.error("❌ Google Maps API yüklü değil! Uygulamayı açıp tekrar dene.");
    window.__PANO_REFRESH_RUNNING = false;
    return;
  }

  const sv = new google.maps.StreetViewService();

  // ═══════════════════════════════════════════════════════
  // ENUM ALIASES (FIX 2 — enum-safe, no toString())
  // ═══════════════════════════════════════════════════════
  const SV_STATUS = google.maps.StreetViewStatus;
  // Build reverse lookup: enum value → readable string
  const STATUS_NAME = {};
  for (const [key, val] of Object.entries(SV_STATUS)) {
    STATUS_NAME[val] = key;
  }
  function statusToString(s) {
    return STATUS_NAME[s] || String(s);
  }

  // ═══════════════════════════════════════════════════════
  // CONSTANTS
  // ═══════════════════════════════════════════════════════
  const RADII = [25, 50, 100, 200, 500];
  const MAX_RETRIES = 3;
  const RETRY_DELAYS = [500, 1000, 2000]; // exponential backoff ms
  const INTER_PACKAGE_DELAY = 300; // ms between packages

  // ═══════════════════════════════════════════════════════
  // ALL 142 PACKAGE COORDINATES (pano0 from panoPackages.ts)
  // Format: { id, lat, lng }
  // ═══════════════════════════════════════════════════════
  const packages = [
    // URBAN PACKAGES (86)
    { id: "ist_fatih_1", lat: 41.0086, lng: 28.9802 },
    { id: "ist_kadikoy_1", lat: 40.9903, lng: 29.024 },
    { id: "ist_besiktas_1", lat: 41.043, lng: 29.007 },
    { id: "ist_taksim_1", lat: 41.037, lng: 28.985 },
    { id: "ist_uskudar_1", lat: 41.0262, lng: 29.0155 },
    { id: "ist_bakirkoy_1", lat: 40.98, lng: 28.872 },
    { id: "ank_kizilay_1", lat: 39.9208, lng: 32.8541 },
    { id: "ank_ulus_1", lat: 39.9414, lng: 32.8543 },
    { id: "ank_cankaya_1", lat: 39.9, lng: 32.86 },
    { id: "izm_alsancak_1", lat: 38.435, lng: 27.1428 },
    { id: "izm_konak_1", lat: 38.4189, lng: 27.1287 },
    { id: "brs_osmangazi_1", lat: 40.1826, lng: 29.0665 },
    { id: "ant_muratpasa_1", lat: 36.8841, lng: 30.7056 },
    { id: "ant_kaleici_1", lat: 36.885, lng: 30.704 },
    { id: "adn_seyhan_1", lat: 36.9914, lng: 35.3308 },
    { id: "gaz_sahinbey_1", lat: 37.0662, lng: 37.3833 },
    { id: "kny_selcuklu_1", lat: 37.8713, lng: 32.4846 },
    { id: "kys_melikgazi_1", lat: 38.7312, lng: 35.4787 },
    { id: "esk_tepebasi_1", lat: 39.7767, lng: 30.5206 },
    { id: "sms_ilkadim_1", lat: 41.2867, lng: 36.33 },
    { id: "dnz_merkezefendi_1", lat: 37.7765, lng: 29.0864 },
    { id: "sur_haliliye_1", lat: 37.1591, lng: 38.7969 },
    { id: "trb_ortahisar_1", lat: 41.0015, lng: 39.7178 },
    { id: "mal_battalgazi_1", lat: 38.3552, lng: 38.3095 },
    { id: "erz_yakutiye_1", lat: 39.9, lng: 41.27 },
    { id: "diy_baglar_1", lat: 37.91, lng: 40.23 },
    { id: "van_ipekyolu_1", lat: 38.4942, lng: 43.38 },
    { id: "ist_sariyer_1", lat: 41.1667, lng: 29.05 },
    { id: "ist_maltepe_1", lat: 40.9333, lng: 29.1333 },
    { id: "ist_beyoglu_1", lat: 41.032, lng: 28.977 },
    { id: "ist_sisli_1", lat: 41.06, lng: 28.987 },
    { id: "ist_eminonu_1", lat: 41.017, lng: 28.97 },
    { id: "ist_pendik_1", lat: 40.875, lng: 29.2333 },
    { id: "ist_avcilar_1", lat: 40.98, lng: 28.72 },
    { id: "ist_kartal_1", lat: 40.89, lng: 29.19 },
    { id: "ank_etimesgut_1", lat: 39.95, lng: 32.68 },
    { id: "ank_kecioren_1", lat: 39.97, lng: 32.86 },
    { id: "ank_mamak_1", lat: 39.92, lng: 32.92 },
    { id: "ank_yenimahalle_1", lat: 39.965, lng: 32.81 },
    { id: "ank_sincan_1", lat: 39.975, lng: 32.585 },
    { id: "izm_bornova_1", lat: 38.467, lng: 27.22 },
    { id: "izm_karsiyaka_1", lat: 38.456, lng: 27.11 },
    { id: "izm_buca_1", lat: 38.388, lng: 27.175 },
    { id: "izm_cesme_1", lat: 38.324, lng: 26.303 },
    { id: "ant_konyaalti_1", lat: 36.865, lng: 30.63 },
    { id: "ant_lara_1", lat: 36.85, lng: 30.79 },
    { id: "ant_alanya_1", lat: 36.544, lng: 32 },
    { id: "ant_manavgat_1", lat: 36.787, lng: 31.443 },
    { id: "ant_side_1", lat: 36.767, lng: 31.388 },
    { id: "mug_bodrum_1", lat: 37.034, lng: 27.428 },
    { id: "mug_marmaris_1", lat: 36.851, lng: 28.272 },
    { id: "mug_fethiye_1", lat: 36.651, lng: 29.117 },
    { id: "mug_dalaman_1", lat: 36.767, lng: 28.799 },
    { id: "mer_yenisehir_1", lat: 36.8, lng: 34.63 },
    { id: "mer_tarsus_1", lat: 36.917, lng: 34.893 },
    { id: "koc_izmit_1", lat: 40.765, lng: 29.94 },
    { id: "koc_gebze_1", lat: 40.802, lng: 29.431 },
    { id: "ayd_kusadasi_1", lat: 37.86, lng: 27.26 },
    { id: "ayd_didim_1", lat: 37.38, lng: 27.27 },
    { id: "tek_corlu_1", lat: 41.16, lng: 27.8 },
    { id: "edi_merkez_1", lat: 41.677, lng: 26.556 },
    { id: "hat_antakya_1", lat: 36.202, lng: 36.16 },
    { id: "hat_iskenderun_1", lat: 36.587, lng: 36.17 },
    { id: "mrd_artuklu_1", lat: 37.313, lng: 40.735 },
    { id: "ord_altinordu_1", lat: 40.984, lng: 37.879 },
    { id: "gir_merkez_1", lat: 40.912, lng: 38.39 },
    { id: "riz_merkez_1", lat: 41.021, lng: 40.522 },
    { id: "can_merkez_1", lat: 40.155, lng: 26.414 },
    { id: "bal_karesi_1", lat: 39.648, lng: 27.886 },
    { id: "zon_merkez_1", lat: 41.453, lng: 31.783 },
    { id: "bol_merkez_1", lat: 40.735, lng: 31.61 },
    { id: "sak_adapazari_1", lat: 40.74, lng: 30.405 },
    { id: "man_yunusemre_1", lat: 38.612, lng: 27.426 },
    { id: "afy_merkez_1", lat: 38.75, lng: 30.54 },
    { id: "isp_merkez_1", lat: 37.764, lng: 30.556 },
    { id: "btm_merkez_1", lat: 37.881, lng: 41.132 },
    { id: "elz_merkez_1", lat: 38.675, lng: 39.223 },
    { id: "svs_merkez_1", lat: 39.748, lng: 37.015 },
    { id: "ams_merkez_1", lat: 40.654, lng: 35.833 },
    { id: "kmr_onikisubat_1", lat: 37.586, lng: 36.937 },
    { id: "ady_merkez_1", lat: 37.764, lng: 38.276 },
    { id: "nvs_merkez_1", lat: 38.625, lng: 34.712 },
    { id: "aks_merkez_1", lat: 38.369, lng: 34.029 },
    { id: "art_merkez_1", lat: 41.182, lng: 41.818 },
    { id: "krs_merkez_1", lat: 40.608, lng: 43.095 },
    { id: "ylv_merkez_1", lat: 40.655, lng: 29.275 },
    // GEO PACKAGES (56)
    { id: "geo_kapadokya_1", lat: 38.6431, lng: 34.8289 },
    { id: "geo_kapadokya_2", lat: 38.65, lng: 34.82 },
    { id: "geo_pamukkale_1", lat: 37.9204, lng: 29.1212 },
    { id: "geo_ayder_1", lat: 40.95, lng: 41.1 },
    { id: "geo_uzungol_1", lat: 40.6167, lng: 40.2833 },
    { id: "geo_sumela_1", lat: 40.69, lng: 39.66 },
    { id: "geo_oludeniz_1", lat: 36.55, lng: 29.12 },
    { id: "geo_kekova_1", lat: 36.19, lng: 29.86 },
    { id: "geo_kaputas_1", lat: 36.23, lng: 29.43 },
    { id: "geo_nemrut_1", lat: 37.9814, lng: 38.7411 },
    { id: "geo_agri_1", lat: 39.7, lng: 44.3 },
    { id: "geo_vangolu_1", lat: 38.6, lng: 43 },
    { id: "geo_efes_1", lat: 37.939, lng: 27.341 },
    { id: "geo_toros_1", lat: 36.75, lng: 32.5 },
    { id: "geo_bolu_1", lat: 40.7333, lng: 31.6 },
    { id: "geo_uludag_1", lat: 40.0667, lng: 29.1167 },
    { id: "geo_safranbolu_1", lat: 41.2544, lng: 32.6917 },
    { id: "geo_salda_1", lat: 37.5333, lng: 29.6667 },
    { id: "geo_pokut_1", lat: 40.92, lng: 41.05 },
    { id: "geo_hamsikoy_1", lat: 40.78, lng: 39.42 },
    { id: "geo_zilkale_1", lat: 40.94, lng: 40.93 },
    { id: "geo_camlihemsin_1", lat: 41.01, lng: 41.02 },
    { id: "geo_firtina_vadisi_1", lat: 40.97, lng: 40.95 },
    { id: "geo_cirali_1", lat: 36.41, lng: 30.47 },
    { id: "geo_patara_1", lat: 36.27, lng: 29.32 },
    { id: "geo_butterfly_valley_1", lat: 36.53, lng: 29.11 },
    { id: "geo_olimpos_1", lat: 36.4, lng: 30.49 },
    { id: "geo_saklikent_1", lat: 36.47, lng: 29.42 },
    { id: "geo_ishakpasa_1", lat: 39.49, lng: 44.07 },
    { id: "geo_ani_1", lat: 40.51, lng: 43.57 },
    { id: "geo_akdamar_1", lat: 38.34, lng: 43.03 },
    { id: "geo_muradiye_selalesi_1", lat: 39.07, lng: 43.76 },
    { id: "geo_tuz_golu_1", lat: 38.75, lng: 33.4 },
    { id: "geo_ihlara_1", lat: 38.25, lng: 34.3 },
    { id: "geo_derinkuyu_1", lat: 38.37, lng: 34.73 },
    { id: "geo_erciyes_1", lat: 38.53, lng: 35.45 },
    { id: "geo_sirince_1", lat: 37.95, lng: 27.43 },
    { id: "geo_priene_1", lat: 37.66, lng: 27.3 },
    { id: "geo_bafa_golu_1", lat: 37.5, lng: 27.5 },
    { id: "geo_bergama_1", lat: 39.12, lng: 27.18 },
    { id: "geo_gelibolu_1", lat: 40.22, lng: 26.28 },
    { id: "geo_troya_1", lat: 39.96, lng: 26.24 },
    { id: "geo_cumalikizik_1", lat: 40.17, lng: 29.22 },
    { id: "geo_halfeti_1", lat: 37.25, lng: 37.87 },
    { id: "geo_zeugma_1", lat: 37.05, lng: 37.88 },
    { id: "geo_gobekli_tepe_1", lat: 37.22, lng: 38.92 },
    { id: "geo_hasankeyf_1", lat: 37.71, lng: 41.41 },
    { id: "geo_yedigollert_1", lat: 40.94, lng: 31.72 },
    { id: "geo_limni_golu_1", lat: 40.78, lng: 31.85 },
    { id: "geo_egirdir_1", lat: 37.89, lng: 30.86 },
    { id: "geo_koprulu_kanyon_1", lat: 37.2, lng: 31.18 },
    { id: "geo_tortum_selalesi_1", lat: 40.66, lng: 41.55 },
    { id: "geo_dilek_yarimadasi_1", lat: 37.7, lng: 27.15 },
    { id: "geo_termessos_1", lat: 36.97, lng: 30.47 },
    { id: "geo_aspendos_1", lat: 36.94, lng: 31.17 },
    { id: "geo_hierapolis_1", lat: 37.93, lng: 29.13 },
  ];

  // ═══════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /**
   * Single getPanorama call with retry for transient errors.
   * FIX 2: Enum-safe — compares status via === against SV_STATUS enums.
   * FIX 3: Returns callsMade (total getPanorama invocations including retries).
   *
   * Returns { panoId, statusName, radius, callsMade }
   */
  async function fetchPano(location, radius, source) {
    const request = { location, radius };
    if (source) request.source = source;

    let callsMade = 0;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      callsMade++;
      const result = await new Promise((resolve) => {
        sv.getPanorama(request, (data, status) => {
          resolve({ data, status }); // FIX 2: keep raw enum, no toString()
        });
      });

      // FIX 2: Compare with enum directly
      if (result.status === SV_STATUS.OK && result.data?.location?.pano) {
        const panoId = result.data.location.pano;
        if (typeof panoId === "string" && panoId.length > 0) {
          return { panoId, statusName: "OK", radius, callsMade };
        }
      }

      // ZERO_RESULTS is permanent for this radius — don't retry
      if (result.status === SV_STATUS.ZERO_RESULTS) {
        return { panoId: null, statusName: "ZERO_RESULTS", radius, callsMade };
      }

      // Retryable: OVER_QUERY_LIMIT, UNKNOWN_ERROR
      const name = statusToString(result.status);
      const isRetryable =
        result.status === SV_STATUS.OVER_QUERY_LIMIT ||
        name === "OVER_QUERY_LIMIT" ||
        result.status === SV_STATUS.UNKNOWN_ERROR ||
        name === "UNKNOWN_ERROR";

      if (isRetryable && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] || 2000;
        console.warn(
          `  ⏳ ${name} — retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`
        );
        await sleep(delay);
        continue;
      }

      // Permanent failure (REQUEST_DENIED, or retries exhausted)
      return { panoId: null, statusName: name, radius, callsMade };
    }

    return { panoId: null, statusName: "MAX_RETRIES_EXHAUSTED", radius: -1, callsMade };
  }

  /**
   * Run a single phase (all radii) for a given source constraint.
   * Returns { panoId, statusName, radius, source, callsMade, radiiTried, firstTransientError }
   */
  async function runPhase(location, source, sourceLabel) {
    let totalCalls = 0;
    let allZero = true;
    let firstTransientError = null;
    const radiiTried = [];

    for (const radius of RADII) {
      const result = await fetchPano(location, radius, source);
      totalCalls += result.callsMade;
      radiiTried.push(radius);

      if (result.panoId) {
        return {
          panoId: result.panoId,
          statusName: "OK",
          radius: result.radius,
          source: sourceLabel,
          callsMade: totalCalls,
          radiiTried,
          firstTransientError: null,
        };
      }

      // Track whether we saw anything other than ZERO_RESULTS
      if (result.statusName !== "ZERO_RESULTS") {
        allZero = false;
        if (!firstTransientError) {
          firstTransientError = result.statusName;
        }
      }
    }

    return {
      panoId: null,
      statusName: allZero ? "ALL_ZERO_RESULTS" : firstTransientError,
      radius: -1,
      source: sourceLabel,
      callsMade: totalCalls,
      radiiTried,
      firstTransientError,
    };
  }

  /**
   * Resolve panoId for a package using progressive radius + source fallback.
   *
   * FIX 1: Phase 2 runs ONLY if Phase 1 exhausted all radii with ALL ZERO_RESULTS.
   *         If Phase 1 had any transient/permission error, skip Phase 2 immediately.
   * FIX 3: apiCalls = sum of all getPanorama invocations (including retries).
   * FIX 4: Failure entries include finalStatus, phaseReached, radiiTried, reason.
   */
  async function resolvePackage(pkg) {
    const location = { lat: pkg.lat, lng: pkg.lng };

    // Phase 1: OUTDOOR source
    const p1 = await runPhase(location, google.maps.StreetViewSource.OUTDOOR, "OUTDOOR");

    if (p1.panoId) {
      return {
        id: pkg.id,
        panoId: p1.panoId,
        finalStatus: "OK",
        radius: p1.radius,
        source: "OUTDOOR",
        phaseReached: 1,
        radiiTried: { phase1: p1.radiiTried },
        reason: null,
        apiCalls: p1.callsMade,
      };
    }

    // FIX 1: Phase 2 ONLY if Phase 1 was all ZERO_RESULTS
    if (p1.statusName !== "ALL_ZERO_RESULTS") {
      // Transient/permission error in Phase 1 — DO NOT proceed to Phase 2
      return {
        id: pkg.id,
        panoId: null,
        finalStatus: p1.firstTransientError || "TRANSIENT_FAILURE_PHASE1",
        radius: -1,
        source: "OUTDOOR",
        phaseReached: 1,
        radiiTried: { phase1: p1.radiiTried },
        reason: `Phase1 transient error: ${p1.firstTransientError}, skipping Phase2`,
        apiCalls: p1.callsMade,
      };
    }

    // Phase 2: No source constraint (all Phase 1 = ZERO_RESULTS)
    const p2 = await runPhase(location, null, "DEFAULT");

    if (p2.panoId) {
      return {
        id: pkg.id,
        panoId: p2.panoId,
        finalStatus: "OK",
        radius: p2.radius,
        source: "DEFAULT",
        phaseReached: 2,
        radiiTried: { phase1: p1.radiiTried, phase2: p2.radiiTried },
        reason: null,
        apiCalls: p1.callsMade + p2.callsMade,
      };
    }

    // Both phases exhausted
    const failStatus = p2.firstTransientError || "ZERO_RESULTS_ALL_RADII";
    const failReason = p2.firstTransientError
      ? `Phase1 all ZERO_RESULTS; Phase2 transient error: ${p2.firstTransientError}`
      : "Zero results all radii in both OUTDOOR and DEFAULT phases";

    return {
      id: pkg.id,
      panoId: null,
      finalStatus: failStatus,
      radius: -1,
      source: "NONE",
      phaseReached: 2,
      radiiTried: { phase1: p1.radiiTried, phase2: p2.radiiTried },
      reason: failReason,
      apiCalls: p1.callsMade + p2.callsMade,
    };
  }

  // ═══════════════════════════════════════════════════════
  // MAIN LOOP
  // ═══════════════════════════════════════════════════════

  console.log(`\n🚀 PanoId Refresh v3 FINAL — ${packages.length} paket`);
  console.log(`   Radius stratejisi: ${RADII.join(", ")}m (progressive)`);
  console.log(`   Source stratejisi: OUTDOOR → DEFAULT fallback (only if all Phase1=ZERO)`);
  console.log(`   Retry: max ${MAX_RETRIES} (exponential backoff)`);
  console.log(`   API calls include retries\n`);

  const results = [];
  const statusCounts = {};
  let successCount = 0;
  let failedCount = 0;
  let totalApiCalls = 0;
  const startTime = Date.now();

  for (let i = 0; i < packages.length; i++) {
    const pkg = packages[i];
    const result = await resolvePackage(pkg);
    results.push(result);
    totalApiCalls += result.apiCalls;

    // Track status distribution
    const key = result.finalStatus;
    statusCounts[key] = (statusCounts[key] || 0) + 1;

    if (result.panoId) {
      successCount++;
    } else {
      failedCount++;
    }

    // Progress every 10 items
    if ((i + 1) % 10 === 0 || i === packages.length - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(
        `  [${i + 1}/${packages.length}] ` +
          `OK=${successCount} FAIL=${failedCount} ` +
          `APICalls=${totalApiCalls} (${elapsed}s)`
      );
    }

    // Inter-package delay (rate limiting)
    if (i < packages.length - 1) {
      await sleep(INTER_PACKAGE_DELAY);
    }
  }

  // ═══════════════════════════════════════════════════════
  // BUILD MAPPING (id → { panoId }) — coordinates NOT included
  // ═══════════════════════════════════════════════════════

  const mapping = {};
  for (const r of results) {
    if (r.panoId) {
      mapping[r.id] = { panoId: r.panoId };
    }
  }

  // ═══════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${"═".repeat(50)}`);
  console.log(`📊 SONUÇ RAPORU`);
  console.log(`${"═".repeat(50)}`);
  console.log(`  Toplam paket:     ${packages.length}`);
  console.log(`  Başarılı:         ${successCount}`);
  console.log(`  Başarısız:        ${failedCount}`);
  console.log(`  Toplam API call:  ${totalApiCalls} (retries dahil)`);
  console.log(`  Süre:             ${elapsed}s`);
  console.log(`\n  Status dağılımı:`);
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`    ${status}: ${count}`);
  }

  if (failedCount > 0) {
    console.log(`\n  ⚠️ Başarısız paketler:`);
    results
      .filter((r) => !r.panoId)
      .forEach((r) => {
        console.log(`    - ${r.id} [${r.finalStatus}] phase=${r.phaseReached} — ${r.reason}`);
      });
  }

  // ═══════════════════════════════════════════════════════
  // DOWNLOAD ARTIFACTS
  // ═══════════════════════════════════════════════════════

  function downloadJSON(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Artifact 1: Mapping (for apply script)
  downloadJSON(mapping, "panoId_mapping.json");
  console.log(`\n📁 panoId_mapping.json indirildi (${Object.keys(mapping).length} paket)`);

  // Artifact 2: Full results (for audit/debug)
  downloadJSON(results, "panoId_results.json");
  console.log(`📁 panoId_results.json indirildi (${results.length} kayıt)`);

  // Store in window for immediate console access
  window.__PANO_MAPPING = mapping;
  window.__PANO_RESULTS = results;

  // ═══════════════════════════════════════════════════════
  // NEXT STEPS
  // ═══════════════════════════════════════════════════════

  console.log(`\n${"═".repeat(50)}`);
  console.log(`📌 SONRAKİ ADIM:`);
  console.log(`${"═".repeat(50)}`);
  console.log(`  node scripts/applyPanoIdMapping.js ~/Downloads/panoId_mapping.json`);
  console.log(`${"═".repeat(50)}\n`);

  window.__PANO_REFRESH_RUNNING = false;
  return mapping;
})();
