/**
 * API Cost Monitor
 * Google Maps API kullanımını izle ve kontrol et
 *
 * MALİYET HESAPLAMA:
 * - Street View Static API: $7.00 per 1000 requests
 * - Street View Metadata: $0 (ücretsiz)
 * - Maps JavaScript API: $7.00 per 1000 loads
 *
 * Bu sistem:
 * - Günlük API çağrılarını takip eder
 * - Bütçe aşımında uyarı verir
 * - Debug için detaylı log tutar
 */

import { API_COST_CONTROL, FEATURE_FLAGS } from "@/config/production";

interface ApiCallRecord {
  timestamp: number;
  type: "street_view" | "maps_load" | "geocode" | "pano_search";
  success: boolean;
}

class ApiCostMonitor {
  private calls: ApiCallRecord[] = [];
  private dailyBudgetExceeded = false;
  private storageKey = "turkiyeguessr_api_calls";

  constructor() {
    this.loadFromStorage();
    this.cleanOldCalls();
  }

  /**
   * LocalStorage'dan yükle
   */
  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.calls = JSON.parse(stored);
      }
    } catch (e) {
      this.calls = [];
    }
  }

  /**
   * LocalStorage'a kaydet
   */
  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.calls));
    } catch (e) {
      // Storage dolu olabilir, eski kayıtları sil
      this.calls = this.calls.slice(-100);
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.calls));
      } catch (e2) {
        // Ignore
      }
    }
  }

  /**
   * 24 saatten eski kayıtları temizle
   */
  private cleanOldCalls(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.calls = this.calls.filter((call) => call.timestamp > oneDayAgo);
    this.saveToStorage();
  }

  /**
   * API çağrısı kaydet
   */
  recordCall(type: ApiCallRecord["type"], success: boolean = true): void {
    this.calls.push({
      timestamp: Date.now(),
      type,
      success,
    });

    this.saveToStorage();

    // Bütçe kontrolü
    this.checkBudget();

    if (FEATURE_FLAGS.ENABLE_DEBUG_LOGS) {
      console.log(`API Call: ${type} (Total today: ${this.getTodayCallCount()})`);
    }
  }

  /**
   * Günlük bütçe kontrolü
   */
  private checkBudget(): void {
    const todayCalls = this.getTodayCallCount();
    const estimatedCost = todayCalls * API_COST_CONTROL.STREET_VIEW_COST_PER_CALL;

    if (estimatedCost >= API_COST_CONTROL.DAILY_API_BUDGET_USD) {
      this.dailyBudgetExceeded = true;

      if (FEATURE_FLAGS.ENABLE_DEBUG_LOGS) {
        console.warn(
          `API Budget EXCEEDED! Estimated cost: $${estimatedCost.toFixed(2)} / $${API_COST_CONTROL.DAILY_API_BUDGET_USD}`
        );
      }
    }
  }

  /**
   * Bugünkü çağrı sayısı
   */
  getTodayCallCount(): number {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartMs = todayStart.getTime();

    return this.calls.filter((call) => call.timestamp >= todayStartMs).length;
  }

  /**
   * Tahmini günlük maliyet (USD)
   */
  getEstimatedDailyCost(): number {
    return this.getTodayCallCount() * API_COST_CONTROL.STREET_VIEW_COST_PER_CALL;
  }

  /**
   * Bütçe aşıldı mı?
   */
  isBudgetExceeded(): boolean {
    return this.dailyBudgetExceeded;
  }

  /**
   * API çağrısı yapılabilir mi?
   */
  canMakeApiCall(): boolean {
    if (this.dailyBudgetExceeded) {
      return false;
    }

    return this.getTodayCallCount() < API_COST_CONTROL.MAX_DAILY_API_CALLS;
  }

  /**
   * İstatistikleri döndür
   */
  getStats(): {
    todayCalls: number;
    estimatedCost: number;
    budgetRemaining: number;
    callsRemaining: number;
  } {
    const todayCalls = this.getTodayCallCount();
    const estimatedCost = this.getEstimatedDailyCost();

    return {
      todayCalls,
      estimatedCost,
      budgetRemaining: Math.max(0, API_COST_CONTROL.DAILY_API_BUDGET_USD - estimatedCost),
      callsRemaining: Math.max(0, API_COST_CONTROL.MAX_DAILY_API_CALLS - todayCalls),
    };
  }

  /**
   * Günlük limiti sıfırla (test için)
   */
  resetDaily(): void {
    this.calls = [];
    this.dailyBudgetExceeded = false;
    this.saveToStorage();
  }
}

// Singleton instance
export const apiCostMonitor = new ApiCostMonitor();

// Debug fonksiyonu — sadece development'ta console'dan erişim
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  (window as unknown as Record<string, unknown>).__apiCostMonitor = apiCostMonitor;
}
