# TürkiyeGuessr Test Raporu

**Tarih:** 2026-02-04
**Versiyon:** 2.0.0
**Test Framework:** Vitest 4.0.18 + Playwright 1.58.1

---

## Genel Durum

| Kategori | Durum | Detay |
|----------|-------|-------|
| Unit Testler | ✅ PASS | 55/55 test geçti |
| E2E Testler | ✅ HAZIR | 6 oyuncu multiplayer spec yazıldı |
| Telemetry | ✅ ENTEGRE | Event tracking, error boundary, duplicate guard |
| Timer 0 Bug | ✅ FIX | 3 root cause çözüldü |

---

## 1. Unit Test Sonuçları

### Utils Testleri (25 test) ✅

| Test | Durum | Açıklama |
|------|-------|----------|
| calculateDistance | ✅ | Haversine formula doğru çalışıyor |
| calculateScore | ✅ | Exponential decay scoring |
| formatDistance | ✅ | m/km formatlama |
| generateRoomCode | ✅ | 6 karakter, benzersiz |
| isLikelyInTurkey | ✅ | Türkiye sınır kontrolü |

### Timer Hook Testleri (13 test) ✅

| Test | Durum | Açıklama |
|------|-------|----------|
| Başlangıç değerleri | ✅ | initialTime, isRunning, formattedTime |
| start/pause/reset | ✅ | Kontrol fonksiyonları |
| Her saniye azalma | ✅ | Countdown çalışıyor |
| **onTimeUp SADECE 1 KEZ** | ✅ | **KRİTİK: Spam bug önlendi** |
| Reset sonrası tekrar çağrı | ✅ | Round geçişinde yeniden aktif |
| Memory leak yok | ✅ | Interval cleanup |
| Hızlı round döngüsü | ✅ | 5 round = 5 onTimeUp |
| Çoklu start duplicate yok | ✅ | İdempotent guard |

### Telemetry Testleri (17 test) ✅

| Test | Durum | Açıklama |
|------|-------|----------|
| Session oluşturma | ✅ | Unique session ID |
| Context ayarlama | ✅ | roomId, playerId, playerName |
| Event tracking | ✅ | join, leave, roundStart, roundEnd, submitGuess |
| 100 event limit | ✅ | Memory protection |
| Duplicate attempt | ✅ | Spam tespiti |
| Listener balance | ✅ | Memory leak tespiti |
| Error tracking | ✅ | 50 error limit |
| Cleanup | ✅ | Session temizleme |

---

## 2. E2E Test Senaryoları

### Ana Senaryo: 6 Oyuncu 5 Round (multiplayer.spec.ts)

```
1. 6 mobil oyuncu oluştur (iPhone 14: 390x844)
2. Host oda oluşturur → roomCode (6 karakter)
3. 5 oyuncu sırayla katılır
4. Tüm oyuncular lobby'de: "6/8" gösterilir
5. Host oyunu başlatır
6. 5 round döngüsü:
   - Pano yüklenmesi beklenir
   - Timer görünür (00:00 formatında)
   - Tüm oyuncular tahmin yapar
   - Round sonuçları gösterilir
   - Konum badge + puan görünür
7. Oyun sonu: "Oyun Bitti", 🏆, "kazandı"
```

### Timer Bug Testi

```
- Tek oyuncu hızlı test
- Console mesajları dinlenir
- handleTimeUp duplicate kontrolü
- Max 1 timeUp per round
```

### Bildirim Spam Testi

```
- Host + 3 oyuncu hızlı katılım
- "odaya katıldı" bildirim sayısı
- Tolerans: max 6 bildirim (3 katılım x 2)
```

### Mobil UI Testi

```
- Viewport: 390x844 (iPhone 14)
- Tüm ana menü elementleri görünür
- Scroll çalışıyor
- Oyun butonları kesilmiyor
```

---

## 3. Bug Fix Detayları

### Timer 0 Spam Bug 🔥 → ✅ FİX

**Semptomlar:**
- Timer 0'da onlarca bildirim spam
- "Oyuncu katıldı/ayrıldı" mesajları (gerçek olmayan)
- Round sonucu birden fazla hesaplama
- UI freeze

**Root Cause (3 adet):**

1. **useTimer.ts - Dependency Array Bug**
   ```typescript
   // ÖNCE (HATALI)
   useEffect(() => { ... }, [isRunning, timeRemaining])

   // SONRA (DOĞRU)
   useEffect(() => { ... }, [isRunning])
   ```
   - timeRemaining dependency her saniye interval yeniden oluşturuyordu
   - Fix: timeRemaining kaldırıldı, setInterval stabil

2. **page.tsx - Status Triggered Effect**
   ```typescript
   // ÖNCE (HATALI)
   useEffect(() => { ... }, [room?.currentRound, room?.status])

   // SONRA (DOĞRU)
   const prevRoundRef = useRef<number | null>(null);
   // Sadece gerçek round değişikliğinde tetikle
   if (room.currentRound !== prevRoundRef.current) { ... }
   ```

3. **useRoom.ts - Non-idempotent handleTimeUp**
   ```typescript
   // ÖNCE (HATALI)
   const handleTimeUp = async () => { ... }

   // SONRA (DOĞRU)
   const hasHandledTimeUpRef = useRef<number | null>(null);
   if (hasHandledTimeUpRef.current === room.currentRound) {
     trackDuplicateAttempt("timeUp", room.currentRound);
     return; // SKIP
   }
   ```

**Doğrulama:**
- Unit test: "onTimeUp SADECE 1 KEZ çağrılmalı" ✅
- Unit test: "hızlı round döngüsünde onTimeUp spam olmamalı" ✅
- Telemetry: duplicate attempt tracking aktif

---

## 4. Telemetry Sistemi

### Event Types

| Event | Açıklama | Metadata |
|-------|----------|----------|
| join | Oda oluşturma/katılma | action, gameMode |
| leave | Odadan ayrılma | roomId |
| roundStart | Tur başlangıcı | roundId, panoPackageId |
| roundEnd | Tur bitişi | roundId, trigger |
| submitGuess | Tahmin gönderme | roundId, lat, lng |
| timeUp | Süre dolması | roundId |
| gameEnd | Oyun bitişi | totalRounds |
| error | Hata | context |

### Bug Detection Metrics

```typescript
// Telemetry Summary
{
  duplicateAttempts: {
    roundEnd: number,  // >0 = bug var
    timeUp: number     // >0 = spam var
  },
  listenerBalance: number,  // >3 = memory leak
  errorCount: number
}
```

### Kullanım

```typescript
// Console'da rapor görüntüle
import { printTelemetryReport } from '@/utils/telemetry';
printTelemetryReport();

// veya browser console'da:
// window.__telemetry__ = getTelemetrySummary();
```

---

## 5. Risk Değerlendirmesi

| Risk | Seviye | Mitigation |
|------|--------|------------|
| Timer spam | 🟢 LOW | 3 fix + telemetry |
| Memory leak | 🟢 LOW | Listener tracking |
| Race condition | 🟢 LOW | Processing lock |
| Mobile UI | 🟢 LOW | Viewport testleri |
| 6+ oyuncu sync | 🟡 MEDIUM | Firebase snapshot |

---

## 6. Test Komuları

```bash
# Unit testler
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E testler (Playwright)
npm run test:e2e

# E2E UI mode
npm run test:e2e:ui
```

---

## 7. Dosya Yapısı

```
src/
├── __tests__/
│   ├── setup.ts          # Test setup, mocks
│   ├── utils.test.ts     # 25 test
│   ├── timer.test.ts     # 13 test
│   └── telemetry.test.ts # 17 test
├── hooks/
│   ├── useTimer.ts       # Fixed timer hook
│   └── useRoom.ts        # Telemetry entegre
├── utils/
│   └── telemetry.ts      # Telemetry module
e2e/
└── multiplayer.spec.ts   # 6 player E2E

vitest.config.ts
playwright.config.ts
```

---

## 8. Sonuç

✅ **READY FOR 6-PLAYER MOBILE MULTIPLAYER TEST**

- 55 unit test geçti
- Timer 0 spam bug fixlendi
- Telemetry aktif (prod monitoring için)
- E2E senaryolar hazır
- Mobile viewport testleri yazıldı

**Öneriler:**
1. E2E testleri gerçek tarayıcıda çalıştır: `npm run test:e2e`
2. Test sırasında console'u izle: telemetry logları görünür
3. Oyun sonunda `printTelemetryReport()` çağır
