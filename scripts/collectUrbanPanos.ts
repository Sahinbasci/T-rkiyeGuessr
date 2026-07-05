#!/usr/bin/env npx ts-node
/**
 * collectUrbanPanos.ts — Collect verified Street View panoIds for new urban locations
 *
 * Queries Google Street View Metadata API to find real panoramas near target coordinates.
 * Outputs TypeScript PanoPackage entries ready to paste into panoPackages.ts.
 *
 * Usage:
 *   GOOGLE_MAPS_API_KEY=xxx npx ts-node scripts/collectUrbanPanos.ts
 */

import * as fs from "fs";
import * as path from "path";

const API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

interface Candidate {
  id: string;
  lat: number;
  lng: number;
  region: string;
  hintTags: string[];
  locationName: string;
  comment?: string; // Group comment (e.g., "// TOKAT")
}

interface SVMetadata {
  status: string;
  pano_id?: string;
  location?: { lat: number; lng: number };
  date?: string;
}

// ==================== CANDIDATE LOCATIONS ====================
// ~80 candidates (more than 64 needed, to account for gaps in coverage)

const candidates: Candidate[] = [
  // === NEW CITIES (33 cities not yet in URBAN_PACKAGES) ===
  { id: "tok_merkez_1", lat: 40.3140, lng: 36.5530, region: "karadeniz", hintTags: ["signage", "historic", "bazaar"], locationName: "Merkez, Tokat", comment: "// TOKAT" },
  { id: "kas_merkez_1", lat: 41.3780, lng: 33.7750, region: "karadeniz", hintTags: ["signage", "historic", "castle"], locationName: "Merkez, Kastamonu", comment: "// KASTAMONU" },
  { id: "cor_merkez_1", lat: 40.5490, lng: 34.9530, region: "karadeniz", hintTags: ["signage", "mosque", "bazaar"], locationName: "Merkez, Çorum", comment: "// ÇORUM" },
  { id: "yoz_merkez_1", lat: 39.8200, lng: 34.8080, region: "ic_anadolu", hintTags: ["signage", "clock_tower", "bazaar"], locationName: "Merkez, Yozgat", comment: "// YOZGAT" },
  { id: "nig_merkez_1", lat: 37.9700, lng: 34.6790, region: "ic_anadolu", hintTags: ["signage", "castle", "bazaar"], locationName: "Merkez, Niğde", comment: "// NİĞDE" },
  { id: "krm_merkez_1", lat: 37.1810, lng: 33.2290, region: "ic_anadolu", hintTags: ["signage", "mosque", "residential"], locationName: "Merkez, Karaman", comment: "// KARAMAN" },
  { id: "snp_merkez_1", lat: 42.0270, lng: 35.1510, region: "karadeniz", hintTags: ["signage", "harbor", "sea"], locationName: "Merkez, Sinop", comment: "// SİNOP" },
  { id: "brt_merkez_1", lat: 41.6360, lng: 32.3350, region: "karadeniz", hintTags: ["signage", "river", "residential"], locationName: "Merkez, Bartın", comment: "// BARTIN" },
  { id: "dzc_merkez_1", lat: 40.8440, lng: 31.1620, region: "karadeniz", hintTags: ["signage", "park", "residential"], locationName: "Merkez, Düzce", comment: "// DÜZCE" },
  { id: "blc_merkez_1", lat: 40.0590, lng: 30.0170, region: "marmara", hintTags: ["signage", "train", "historic"], locationName: "Merkez, Bilecik", comment: "// BİLECİK" },
  { id: "usk_merkez_1", lat: 38.6740, lng: 29.4050, region: "ege", hintTags: ["signage", "residential", "bazaar"], locationName: "Merkez, Uşak", comment: "// UŞAK" },
  { id: "kut_merkez_1", lat: 39.4240, lng: 29.9710, region: "ege", hintTags: ["signage", "tile", "historic"], locationName: "Merkez, Kütahya", comment: "// KÜTAHYA" },
  { id: "brd_merkez_1", lat: 37.7210, lng: 30.2880, region: "akdeniz", hintTags: ["signage", "lake", "residential"], locationName: "Merkez, Burdur", comment: "// BURDUR" },
  { id: "srt_merkez_1", lat: 37.9270, lng: 41.9430, region: "guneydogu", hintTags: ["signage", "mosque", "residential"], locationName: "Merkez, Siirt", comment: "// SİİRT" },
  { id: "srn_merkez_1", lat: 37.4130, lng: 42.4610, region: "guneydogu", hintTags: ["signage", "mountain", "residential"], locationName: "Merkez, Şırnak", comment: "// ŞIRNAK" },
  { id: "mus_merkez_1", lat: 38.7480, lng: 41.4910, region: "dogu_anadolu", hintTags: ["signage", "mosque", "residential"], locationName: "Merkez, Muş", comment: "// MUŞ" },
  { id: "bng_merkez_1", lat: 38.8850, lng: 40.4930, region: "dogu_anadolu", hintTags: ["signage", "river", "residential"], locationName: "Merkez, Bingöl", comment: "// BİNGÖL" },
  { id: "tnc_merkez_1", lat: 39.1080, lng: 39.5480, region: "dogu_anadolu", hintTags: ["signage", "valley", "residential"], locationName: "Merkez, Tunceli", comment: "// TUNCELİ" },
  { id: "btl_merkez_1", lat: 38.3940, lng: 42.1080, region: "dogu_anadolu", hintTags: ["signage", "lake", "historic"], locationName: "Merkez, Bitlis", comment: "// BİTLİS" },
  { id: "hkr_merkez_1", lat: 37.5740, lng: 43.7410, region: "dogu_anadolu", hintTags: ["signage", "mountain", "residential"], locationName: "Merkez, Hakkari", comment: "// HAKKARİ" },
  { id: "igd_merkez_1", lat: 39.9210, lng: 44.0460, region: "dogu_anadolu", hintTags: ["signage", "plain", "residential"], locationName: "Merkez, Iğdır", comment: "// IĞDIR" },
  { id: "agr_merkez_1", lat: 39.7230, lng: 43.0510, region: "dogu_anadolu", hintTags: ["signage", "mountain", "residential"], locationName: "Merkez, Ağrı", comment: "// AĞRI" },
  { id: "ard_merkez_1", lat: 41.1130, lng: 42.7020, region: "dogu_anadolu", hintTags: ["signage", "highland", "residential"], locationName: "Merkez, Ardahan", comment: "// ARDAHAN" },
  { id: "byb_merkez_1", lat: 40.2560, lng: 40.2280, region: "karadeniz", hintTags: ["signage", "river", "residential"], locationName: "Merkez, Bayburt", comment: "// BAYBURT" },
  { id: "gms_merkez_1", lat: 40.4600, lng: 39.4810, region: "karadeniz", hintTags: ["signage", "valley", "residential"], locationName: "Merkez, Gümüşhane", comment: "// GÜMÜŞHANE" },
  { id: "krb_merkez_1", lat: 41.2000, lng: 32.6250, region: "karadeniz", hintTags: ["signage", "industry", "residential"], locationName: "Merkez, Karabük", comment: "// KARABÜK" },
  { id: "krl_merkez_1", lat: 41.7350, lng: 27.2250, region: "marmara", hintTags: ["signage", "border", "residential"], locationName: "Merkez, Kırklareli", comment: "// KIRKLARELİ" },
  { id: "osm_merkez_1", lat: 37.0700, lng: 36.2500, region: "akdeniz", hintTags: ["signage", "castle", "residential"], locationName: "Merkez, Osmaniye", comment: "// OSMANİYE" },
  { id: "kls_merkez_1", lat: 36.7160, lng: 37.1150, region: "guneydogu", hintTags: ["signage", "border", "bazaar"], locationName: "Merkez, Kilis", comment: "// KİLİS" },
  { id: "ezc_merkez_1", lat: 39.7520, lng: 39.4920, region: "dogu_anadolu", hintTags: ["signage", "river", "residential"], locationName: "Merkez, Erzincan", comment: "// ERZİNCAN" },
  { id: "krs_merkez_2", lat: 39.1460, lng: 34.1640, region: "ic_anadolu", hintTags: ["signage", "thermal", "residential"], locationName: "Merkez, Kırşehir", comment: "// KIRŞEHİR" },
  { id: "krk_merkez_1", lat: 39.8450, lng: 33.5060, region: "ic_anadolu", hintTags: ["signage", "industry", "residential"], locationName: "Merkez, Kırıkkale", comment: "// KIRIKKALE" },
  { id: "cnk_merkez_1", lat: 40.6070, lng: 33.6190, region: "ic_anadolu", hintTags: ["signage", "rock_salt", "residential"], locationName: "Merkez, Çankırı", comment: "// ÇANKIRI" },

  // === EXPANSIONS (31 locations for existing cities) ===

  // İSTANBUL +6
  { id: "ist_zeytinburnu_1", lat: 41.0040, lng: 28.9020, region: "marmara", hintTags: ["signage", "tram", "shop"], locationName: "Zeytinburnu, İstanbul", comment: "// İSTANBUL (ek lokasyonlar)" },
  { id: "ist_sultanahmet_2", lat: 41.0080, lng: 28.9750, region: "marmara", hintTags: ["signage", "historic", "tourist"], locationName: "Sultanahmet Çevresi, İstanbul" },
  { id: "ist_moda_1", lat: 40.9835, lng: 29.0260, region: "marmara", hintTags: ["signage", "sea", "residential"], locationName: "Moda, İstanbul" },
  { id: "ist_cengelkoy_1", lat: 41.0490, lng: 29.0540, region: "marmara", hintTags: ["signage", "bosphorus", "historic"], locationName: "Çengelköy, İstanbul" },
  { id: "ist_beylikduzu_1", lat: 41.0050, lng: 28.6430, region: "marmara", hintTags: ["signage", "residential", "modern"], locationName: "Beylikdüzü, İstanbul" },
  { id: "ist_atasehir_1", lat: 40.9870, lng: 29.1180, region: "marmara", hintTags: ["signage", "modern", "business"], locationName: "Ataşehir, İstanbul" },

  // ANKARA +4
  { id: "ank_tunali_1", lat: 39.9110, lng: 32.8580, region: "ic_anadolu", hintTags: ["signage", "shop", "cafe"], locationName: "Tunalı Hilmi, Ankara", comment: "// ANKARA (ek lokasyonlar)" },
  { id: "ank_bahcelievler_1", lat: 39.9220, lng: 32.8280, region: "ic_anadolu", hintTags: ["signage", "residential", "park"], locationName: "Bahçelievler, Ankara" },
  { id: "ank_eryaman_1", lat: 39.9500, lng: 32.6530, region: "ic_anadolu", hintTags: ["signage", "residential", "modern"], locationName: "Eryaman, Ankara" },
  { id: "ank_golbasi_1", lat: 39.7850, lng: 32.8010, region: "ic_anadolu", hintTags: ["signage", "lake", "residential"], locationName: "Gölbaşı, Ankara" },

  // İZMİR +3
  { id: "izm_gaziemir_1", lat: 38.3240, lng: 27.1280, region: "ege", hintTags: ["signage", "airport", "residential"], locationName: "Gaziemir, İzmir", comment: "// İZMİR (ek lokasyonlar)" },
  { id: "izm_balcova_1", lat: 38.3880, lng: 27.0670, region: "ege", hintTags: ["signage", "thermal", "residential"], locationName: "Balçova, İzmir" },
  { id: "izm_bayrakli_1", lat: 38.4590, lng: 27.1630, region: "ege", hintTags: ["signage", "modern", "business"], locationName: "Bayraklı, İzmir" },

  // BURSA +3
  { id: "brs_nilufer_1", lat: 40.2080, lng: 28.9750, region: "marmara", hintTags: ["signage", "modern", "university"], locationName: "Nilüfer, Bursa", comment: "// BURSA (ek lokasyonlar)" },
  { id: "brs_yildirim_1", lat: 40.1960, lng: 29.0820, region: "marmara", hintTags: ["signage", "mosque", "residential"], locationName: "Yıldırım, Bursa" },
  { id: "brs_mudanya_1", lat: 40.3770, lng: 28.8800, region: "marmara", hintTags: ["signage", "sea", "ferry"], locationName: "Mudanya, Bursa" },

  // ANTALYA +2
  { id: "ant_kepez_1", lat: 36.9320, lng: 30.6380, region: "akdeniz", hintTags: ["signage", "residential", "modern"], locationName: "Kepez, Antalya", comment: "// ANTALYA (ek lokasyonlar)" },
  { id: "ant_serik_1", lat: 36.9200, lng: 31.1000, region: "akdeniz", hintTags: ["signage", "agricultural", "residential"], locationName: "Serik, Antalya" },

  // ADANA +2
  { id: "adn_cukurova_1", lat: 36.9780, lng: 35.3580, region: "akdeniz", hintTags: ["signage", "modern", "university"], locationName: "Çukurova, Adana", comment: "// ADANA (ek lokasyonlar)" },
  { id: "adn_yuregir_1", lat: 37.0050, lng: 35.3630, region: "akdeniz", hintTags: ["signage", "residential", "mosque"], locationName: "Yüreğir, Adana" },

  // GAZİANTEP +2
  { id: "gaz_sehitkamil_1", lat: 37.0840, lng: 37.3540, region: "guneydogu", hintTags: ["signage", "modern", "residential"], locationName: "Şehitkâmil, Gaziantep", comment: "// GAZİANTEP (ek lokasyonlar)" },
  { id: "gaz_nizip_1", lat: 37.0090, lng: 37.7960, region: "guneydogu", hintTags: ["signage", "bazaar", "residential"], locationName: "Nizip, Gaziantep" },

  // KONYA +2
  { id: "kny_meram_1", lat: 37.8500, lng: 32.4560, region: "ic_anadolu", hintTags: ["signage", "residential", "park"], locationName: "Meram, Konya", comment: "// KONYA (ek lokasyonlar)" },
  { id: "kny_karatay_1", lat: 37.8780, lng: 32.5130, region: "ic_anadolu", hintTags: ["signage", "historic", "bazaar"], locationName: "Karatay, Konya" },

  // KAYSERİ +1
  { id: "kys_kocasinan_1", lat: 38.7410, lng: 35.4590, region: "ic_anadolu", hintTags: ["signage", "modern", "residential"], locationName: "Kocasinan, Kayseri", comment: "// KAYSERİ (ek lokasyon)" },

  // MERSİN +1
  { id: "mer_akdeniz_1", lat: 36.8020, lng: 34.6040, region: "akdeniz", hintTags: ["signage", "harbor", "bazaar"], locationName: "Akdeniz, Mersin", comment: "// MERSİN (ek lokasyon)" },

  // SAMSUN +1
  { id: "sms_atakum_1", lat: 41.3290, lng: 36.2760, region: "karadeniz", hintTags: ["signage", "sea", "modern"], locationName: "Atakum, Samsun", comment: "// SAMSUN (ek lokasyon)" },

  // TRABZON +1
  { id: "trb_akcaabat_1", lat: 41.0220, lng: 39.5840, region: "karadeniz", hintTags: ["signage", "sea", "residential"], locationName: "Akçaabat, Trabzon", comment: "// TRABZON (ek lokasyon)" },

  // DENİZLİ +1
  { id: "dnz_pamukkale_1", lat: 37.7680, lng: 29.0980, region: "ege", hintTags: ["signage", "residential", "bazaar"], locationName: "Pamukkale İlçe, Denizli", comment: "// DENİZLİ (ek lokasyon)" },

  // ESKİŞEHİR +1
  { id: "esk_odunpazari_1", lat: 39.7700, lng: 30.5300, region: "ic_anadolu", hintTags: ["signage", "historic", "art"], locationName: "Odunpazarı, Eskişehir", comment: "// ESKİŞEHİR (ek lokasyon)" },

  // DİYARBAKIR +1
  { id: "diy_sur_1", lat: 37.9120, lng: 40.2370, region: "guneydogu", hintTags: ["signage", "walls", "historic"], locationName: "Sur, Diyarbakır", comment: "// DİYARBAKIR (ek lokasyon)" },

  // === BACKUP CANDIDATES (in case some above fail) ===
  { id: "ist_kagithane_1", lat: 41.0780, lng: 28.9730, region: "marmara", hintTags: ["signage", "valley", "modern"], locationName: "Kağıthane, İstanbul", comment: "// YEDEK LOKASYONLAR" },
  { id: "ank_pursaklar_1", lat: 40.0420, lng: 32.8960, region: "ic_anadolu", hintTags: ["signage", "residential", "modern"], locationName: "Pursaklar, Ankara" },
  { id: "izm_menemen_1", lat: 38.6080, lng: 27.0690, region: "ege", hintTags: ["signage", "agricultural", "residential"], locationName: "Menemen, İzmir" },
  { id: "ant_dosemealti_1", lat: 37.0150, lng: 30.6240, region: "akdeniz", hintTags: ["signage", "residential", "mountain"], locationName: "Döşemealtı, Antalya" },
  { id: "koc_derince_1", lat: 40.7530, lng: 29.8150, region: "marmara", hintTags: ["signage", "harbor", "industry"], locationName: "Derince, Kocaeli" },
  { id: "mug_datca_1", lat: 36.7260, lng: 27.6870, region: "ege", hintTags: ["signage", "sea", "marina"], locationName: "Datça, Muğla" },
  { id: "hat_samandag_1", lat: 36.0840, lng: 35.9770, region: "akdeniz", hintTags: ["signage", "sea", "residential"], locationName: "Samandağ, Hatay" },
  { id: "brs_inegol_1", lat: 40.0790, lng: 29.5130, region: "marmara", hintTags: ["signage", "industry", "residential"], locationName: "İnegöl, Bursa" },
  { id: "ayd_nazilli_1", lat: 37.9120, lng: 28.3220, region: "ege", hintTags: ["signage", "textile", "bazaar"], locationName: "Nazilli, Aydın" },
  { id: "tek_cerkezkoy_1", lat: 41.2860, lng: 28.0020, region: "marmara", hintTags: ["signage", "industry", "residential"], locationName: "Çerkezköy, Tekirdağ" },
];

// ==================== API CALL ====================

async function fetchSVMetadata(lat: number, lng: number): Promise<SVMetadata> {
  const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&radius=500&source=outdoor&key=${API_KEY}`;
  const resp = await fetch(url);
  return resp.json() as Promise<SVMetadata>;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== GENERATE PACKAGE ENTRY ====================

function generatePackageTS(c: Candidate, panoId: string, lat: number, lng: number): string {
  const heading = Math.floor(Math.random() * 360);
  const h0 = heading;
  const h1 = (heading + 270) % 360;  // left
  const h2 = (heading + 90) % 360;   // right
  const h3 = heading;                 // forward

  // Small offsets for pano1-3 (same panorama, slightly different position)
  const latOff = 0.0005;
  const lngOff = 0.0005;

  return `  {
    id: "${c.id}",
    mode: "urban",
    region: "${c.region}",
    roadType: "urban_street",
    hintTags: ${JSON.stringify(c.hintTags)},
    qualityScore: 4,
    blacklist: false,
    pano0: { panoId: "${panoId}", lat: ${lat.toFixed(4)}, lng: ${lng.toFixed(4)}, heading: ${h0} },
    pano1: { panoId: "${panoId}", lat: ${(lat + latOff).toFixed(4)}, lng: ${(lng - lngOff).toFixed(4)}, heading: ${h1} },
    pano2: { panoId: "${panoId}", lat: ${(lat + latOff).toFixed(4)}, lng: ${(lng + lngOff).toFixed(4)}, heading: ${h2} },
    pano3: { panoId: "${panoId}", lat: ${(lat - latOff).toFixed(4)}, lng: ${lng.toFixed(4)}, heading: ${h3} },
    locationName: "${c.locationName}",
  },`;
}

// ==================== MAIN ====================

async function main() {
  if (!API_KEY) {
    console.error("ERROR: GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY required.");
    console.error("Usage: GOOGLE_MAPS_API_KEY=xxx npx ts-node scripts/collectUrbanPanos.ts");
    process.exit(1);
  }

  console.log(`\n🔍 Collecting Street View panoIds for ${candidates.length} candidate locations...\n`);

  const results: { candidate: Candidate; panoId: string; lat: number; lng: number }[] = [];
  const failures: string[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    process.stdout.write(`[${i + 1}/${candidates.length}] ${c.locationName}... `);

    try {
      const meta = await fetchSVMetadata(c.lat, c.lng);
      if (meta.status === "OK" && meta.pano_id && meta.location) {
        console.log(`✅ ${meta.pano_id} (${meta.date || "n/a"})`);
        results.push({
          candidate: c,
          panoId: meta.pano_id,
          lat: meta.location.lat,
          lng: meta.location.lng,
        });
      } else {
        console.log(`❌ ${meta.status}`);
        failures.push(c.locationName);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`⚠️  Error: ${msg}`);
      failures.push(c.locationName);
    }

    // Rate limit: 50ms between calls
    await sleep(50);
  }

  console.log(`\n📊 Results: ${results.length} found, ${failures.length} failed`);
  if (failures.length > 0) {
    console.log(`❌ Failed locations: ${failures.join(", ")}`);
  }

  // Generate TypeScript output
  let tsOutput = `\n  // ==================== YENİ URBAN PAKETLER (${results.length} lokasyon) ====================\n`;

  let currentComment = "";
  for (const r of results) {
    if (r.candidate.comment && r.candidate.comment !== currentComment) {
      currentComment = r.candidate.comment;
      tsOutput += `\n  ${currentComment}\n`;
    }
    tsOutput += generatePackageTS(r.candidate, r.panoId, r.lat, r.lng) + "\n";
  }

  // Write to output file
  const outPath = path.join(__dirname, "newUrbanPackages.ts");
  fs.writeFileSync(outPath, tsOutput, "utf-8");
  console.log(`\n✅ Output written to: ${outPath}`);
  console.log(`   Total verified locations: ${results.length}`);

  // Also write a JSON for reference
  const jsonPath = path.join(__dirname, "newUrbanPackages.json");
  fs.writeFileSync(jsonPath, JSON.stringify(results.map(r => ({
    id: r.candidate.id,
    panoId: r.panoId,
    lat: r.lat,
    lng: r.lng,
    locationName: r.candidate.locationName,
  })), null, 2), "utf-8");
  console.log(`   JSON reference: ${jsonPath}`);
}

main().catch(console.error);
