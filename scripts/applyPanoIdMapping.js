#!/usr/bin/env node
/**
 * Production-Safe PanoId Mapping Applicator (P2.1)
 *
 * refreshPanoIds.js'den indirilen panoId_mapping.json'ı
 * panoPackages.ts dosyasına uygular.
 *
 * Güvenlik:
 *   - .bak yedek oluşturur (yazmadan önce)
 *   - Multi-pano detection: Paket içinde farklı panoId varsa ATLAR
 *   - Sadece eşleşen paket ID'leri için panoId değiştirir
 *   - Koordinatları, heading'i, formatting'i DEĞİŞTİRMEZ
 *   - Bulunamayan ID'leri listeler
 *
 * Kullanım:
 *   node scripts/applyPanoIdMapping.js <panoId_mapping.json yolu>
 *
 * Örnek:
 *   node scripts/applyPanoIdMapping.js ~/Downloads/panoId_mapping.json
 */

const fs = require("fs");
const path = require("path");

// ═══════════════════════════════════════════════════════
// ARGS
// ═══════════════════════════════════════════════════════

const mappingPath = process.argv[2];
if (!mappingPath) {
  console.error("Kullanım: node scripts/applyPanoIdMapping.js <panoId_mapping.json yolu>");
  process.exit(1);
}

if (!fs.existsSync(mappingPath)) {
  console.error(`HATA: Dosya bulunamadı: ${mappingPath}`);
  process.exit(1);
}

const PANO_PACKAGES_PATH = path.join(__dirname, "..", "src", "data", "panoPackages.ts");

if (!fs.existsSync(PANO_PACKAGES_PATH)) {
  console.error(`HATA: panoPackages.ts bulunamadı: ${PANO_PACKAGES_PATH}`);
  process.exit(1);
}

// ═══════════════════════════════════════════════════════
// LOAD MAPPING
// ═══════════════════════════════════════════════════════

let mapping;
try {
  mapping = JSON.parse(fs.readFileSync(mappingPath, "utf-8"));
} catch (e) {
  console.error(`HATA: JSON parse hatası: ${e.message}`);
  process.exit(1);
}

const mappingKeys = Object.keys(mapping);
console.log(`Mapping dosyası yüklendi: ${mappingKeys.length} paket`);

// Validate mapping structure
for (const [id, data] of Object.entries(mapping)) {
  if (!data.panoId || typeof data.panoId !== "string" || data.panoId.length === 0) {
    console.error(`HATA: Geçersiz panoId — id="${id}", panoId="${data.panoId}"`);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════
// BACKUP
// ═══════════════════════════════════════════════════════

const backupPath = PANO_PACKAGES_PATH + ".bak";
fs.copyFileSync(PANO_PACKAGES_PATH, backupPath);
console.log(`Yedek oluşturuldu: ${backupPath}`);

// ═══════════════════════════════════════════════════════
// LOAD SOURCE FILE
// ═══════════════════════════════════════════════════════

let content = fs.readFileSync(PANO_PACKAGES_PATH, "utf-8");
const originalContent = content;

// ═══════════════════════════════════════════════════════
// PROCESS EACH PACKAGE
// ═══════════════════════════════════════════════════════

let replacedCount = 0;
let skippedNotFound = 0;
let skippedMultiPano = 0;
const notFoundIds = [];
const multiPanoIds = [];

for (const [pkgId, data] of Object.entries(mapping)) {
  const { panoId: newPanoId } = data;

  // Find the package block by its id
  const idPattern = `id: "${pkgId}"`;
  const idIndex = content.indexOf(idPattern);

  if (idIndex === -1) {
    console.warn(`  UYARI: "${pkgId}" dosyada bulunamadı, atlanıyor`);
    notFoundIds.push(pkgId);
    skippedNotFound++;
    continue;
  }

  // Find the end of this package block (next package's "id:" or closing bracket)
  const nextIdIndex = content.indexOf('id: "', idIndex + idPattern.length);
  const packageEnd = nextIdIndex === -1 ? content.length : nextIdIndex;

  // Extract the package block
  const packageBlock = content.substring(idIndex, packageEnd);

  // ── Multi-pano detection ──
  // Extract ALL panoId values in this block
  const panoIdRegex = /panoId: "([^"]+)"/g;
  const existingPanoIds = new Set();
  let match;
  while ((match = panoIdRegex.exec(packageBlock)) !== null) {
    existingPanoIds.add(match[1]);
  }

  if (existingPanoIds.size === 0) {
    console.warn(`  UYARI: "${pkgId}" için panoId bulunamadı, atlanıyor`);
    skippedNotFound++;
    notFoundIds.push(pkgId);
    continue;
  }

  if (existingPanoIds.size > 1) {
    console.warn(
      `  ATLA: "${pkgId}" birden fazla benzersiz panoId içeriyor (${existingPanoIds.size} adet) — multi-pano paketi, elle kontrol et`
    );
    multiPanoIds.push(pkgId);
    skippedMultiPano++;
    continue;
  }

  // ── Replace all panoId values in this block ──
  // All 4 panos (pano0-pano3) share the same panoId, replace all
  const newBlock = packageBlock.replace(
    /panoId: "[^"]+"/g,
    `panoId: "${newPanoId}"`
  );

  // Replace the block in content
  content = content.substring(0, idIndex) + newBlock + content.substring(packageEnd);
  replacedCount++;

  if (replacedCount % 20 === 0) {
    console.log(`  ${replacedCount} paket güncellendi...`);
  }
}

// ═══════════════════════════════════════════════════════
// VERIFY & WRITE
// ═══════════════════════════════════════════════════════

if (content === originalContent) {
  console.error("\nHATA: Dosyada hiçbir değişiklik yapılmadı!");
  console.log("  Mapping'teki ID'ler dosyadakilerle eşleşmiyor olabilir.");
  process.exit(1);
}

// Count remaining old panoIds (CAoSLEFG...)
const remainingOld = (content.match(/CAoSLEFG/g) || []).length;

// Write back
fs.writeFileSync(PANO_PACKAGES_PATH, content, "utf-8");

// ═══════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════

console.log(`\n${"═".repeat(50)}`);
console.log(`📊 SONUÇ RAPORU`);
console.log(`${"═".repeat(50)}`);
console.log(`  Mapping'teki paket:     ${mappingKeys.length}`);
console.log(`  Güncellenen paketler:   ${replacedCount}`);
console.log(`  Bulunamayan ID'ler:     ${skippedNotFound}`);
console.log(`  Multi-pano (atlanan):   ${skippedMultiPano}`);
console.log(`  Kalan eski panoId'ler:  ${remainingOld}`);

if (notFoundIds.length > 0) {
  console.log(`\n  ⚠️ Bulunamayan ID'ler:`);
  notFoundIds.forEach((id) => console.log(`    - ${id}`));
}

if (multiPanoIds.length > 0) {
  console.log(`\n  ⚠️ Multi-pano paketler (elle kontrol et):`);
  multiPanoIds.forEach((id) => console.log(`    - ${id}`));
}

if (remainingOld > 0) {
  console.log(
    `\n  ⚠️ ${remainingOld} adet eski CAoSLEFG panoId kaldı (mapping'te karşılığı yok)`
  );
}

console.log(`\n  Dosya güncellendi: ${PANO_PACKAGES_PATH}`);
console.log(`  Yedek: ${backupPath}`);
console.log(`${"═".repeat(50)}\n`);
