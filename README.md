# TürkiyeGuessr (v1)

Türkiye odaklı GeoGuessr tarzı tahmin oyunu — Next.js + Google Maps JS API + Firebase (RTDB, anonim auth). Şu an **bakım modunda** (503 — Maps API harcamasını durdurmak için). Yeniden platformlanmış v2 için `turkiyeguessr-v2` reposuna bak.

## Clean Setup

Gereksinimler: Node.js 20+ (LTS), npm.

```bash
npm install

# Ortam değişkenleri: şablonu kopyala, değerleri doldur
cp .env.example .env.local
# Değerler Google Cloud Console (Maps API key) ve Firebase Console'dan
# (proje: turkiye-guessr) alınır. AdSense/GA4 opsiyoneldir.

npm run dev        # geliştirme
npm run build      # production build
npm start          # production sunucu
npm test           # birim testleri (vitest)
npm run test:e2e   # e2e (playwright)
npm run ci         # typecheck + test + build
```

## Veritabanı

Sunucu tarafı DB yok; Firebase Realtime Database kullanılır. Kurallar `database.rules.json` içinde, deploy: `firebase deploy --only database` (firebase.json bu repoda).

`e2e/test-rules.mjs` çalıştırmak için `NEXT_PUBLIC_FIREBASE_API_KEY` ortam değişkeni gerekir (örn. `node --env-file=.env.local e2e/test-rules.mjs`).

## Deploy

Firebase RTDB kuralları + Next.js hosting. Maintenance mode `main`'de aktif; kaldırmadan önce Maps API bütçe/kısıtlarını kontrol et.
