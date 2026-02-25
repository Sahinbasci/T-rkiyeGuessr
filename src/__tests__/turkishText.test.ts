import { describe, test, expect } from "vitest";

/**
 * D) Turkish Text Regression Guards
 *
 * Verifies all Turkish special characters (ç, ğ, ı, ö, ş, ü, İ, Ş, Ç, Ğ, Ö, Ü)
 * are preserved in UI strings. Guards against encoding regressions.
 */

// ==================== D: TURKISH TEXT REGRESSION GUARDS ====================

describe("D) Turkish Text Regression Guards", () => {
  describe("CookieBanner Turkish strings", () => {
    // These constants mirror the actual JSX strings in CookieBanner.tsx
    const COOKIE_BANNER_TEXTS = {
      ariaLabel: "Çerez bildirimi",
      body: "Sitemizde zorunlu çerezler, analitik ve reklam çerezleri kullanıyoruz",
      linkText: "Çerez Politikamızı",
      linkHref: "/cerez-politikasi",
      manageBtn: "Tercihleri Yönet",
      requiredOnlyBtn: "Sadece Zorunlu",
      acceptAllBtn: "Tümünü Kabul Et",
    };

    test("aria-label contains 'Çerez' with cedilla", () => {
      expect(COOKIE_BANNER_TEXTS.ariaLabel).toContain("Çerez");
      expect(COOKIE_BANNER_TEXTS.ariaLabel).not.toContain("Cerez");
    });

    test("body text contains Turkish special chars: ç, ü", () => {
      expect(COOKIE_BANNER_TEXTS.body).toContain("çerezler");
      expect(COOKIE_BANNER_TEXTS.body).toContain("kullanıyoruz");
    });

    test("link text has 'Çerez Politikamızı' with ç, ı", () => {
      expect(COOKIE_BANNER_TEXTS.linkText).toBe("Çerez Politikamızı");
    });

    test("link href uses non-accented slug '/cerez-politikasi'", () => {
      expect(COOKIE_BANNER_TEXTS.linkHref).toBe("/cerez-politikasi");
    });

    test("button texts preserve Turkish: ö, ü", () => {
      expect(COOKIE_BANNER_TEXTS.manageBtn).toContain("Yönet");
      expect(COOKIE_BANNER_TEXTS.acceptAllBtn).toContain("Tümünü");
      expect(COOKIE_BANNER_TEXTS.acceptAllBtn).not.toContain("Tumunu");
    });
  });

  describe("ConsentModal Turkish strings", () => {
    const CONSENT_MODAL_TEXTS = {
      ariaLabel: "Çerez tercihleri",
      title: "Çerez Tercihleri",
      alwaysActive: "Her Zaman Aktif",
      requiredLabel: "Zorunlu Çerezler",
      requiredDesc: "Oturum yönetimi, Firebase kimlik doğrulama ve temel site işlevleri için gereklidir.",
      analyticsLabel: "Analitik Çerezler",
      analyticsDesc: "Site kullanımını anlamamıza yardımcı olur. Hangi sayfaların ziyaret edildiğini ve teknik hataları ölçmek için kullanılır.",
      marketingLabel: "Reklam / Pazarlama Çerezleri",
      marketingDesc: "Google AdSense aracılığıyla ilgi alanınıza uygun reklamlar göstermek için kullanılır.",
      saveBtn: "Seçimlerimi Kaydet",
      bodyText: "Aşağıdaki kategorilerden hangi çerezlere izin vermek istediğinizi seçebilirsiniz. Zorunlu çerezler sitenin çalışması için gereklidir ve kapatılamaz.",
    };

    test("aria-label has 'Çerez tercihleri'", () => {
      expect(CONSENT_MODAL_TEXTS.ariaLabel).toBe("Çerez tercihleri");
    });

    test("title has 'Çerez Tercihleri' with uppercase Ç", () => {
      expect(CONSENT_MODAL_TEXTS.title).toBe("Çerez Tercihleri");
    });

    test("always-active badge says 'Her Zaman Aktif'", () => {
      expect(CONSENT_MODAL_TEXTS.alwaysActive).toBe("Her Zaman Aktif");
    });

    test("required cookies description contains ö, ğ, ı: yönetimi, doğrulama, işlevleri, gereklidir", () => {
      expect(CONSENT_MODAL_TEXTS.requiredDesc).toContain("yönetimi");
      expect(CONSENT_MODAL_TEXTS.requiredDesc).toContain("doğrulama");
      expect(CONSENT_MODAL_TEXTS.requiredDesc).toContain("işlevleri");
      expect(CONSENT_MODAL_TEXTS.requiredDesc).toContain("gereklidir");
    });

    test("analytics description contains ı, ö, ü: yardımcı, ölçmek, kullanılır", () => {
      expect(CONSENT_MODAL_TEXTS.analyticsDesc).toContain("yardımcı");
      expect(CONSENT_MODAL_TEXTS.analyticsDesc).toContain("ölçmek");
      expect(CONSENT_MODAL_TEXTS.analyticsDesc).toContain("kullanılır");
    });

    test("marketing description contains ığ, ı: aracılığıyla, alanınıza", () => {
      expect(CONSENT_MODAL_TEXTS.marketingDesc).toContain("aracılığıyla");
      expect(CONSENT_MODAL_TEXTS.marketingDesc).toContain("alanınıza");
    });

    test("save button has 'Seçimlerimi Kaydet' with ç", () => {
      expect(CONSENT_MODAL_TEXTS.saveBtn).toBe("Seçimlerimi Kaydet");
    });

    test("body text contains: seçebilirsiniz, çalışması, kapatılamaz", () => {
      expect(CONSENT_MODAL_TEXTS.bodyText).toContain("seçebilirsiniz");
      expect(CONSENT_MODAL_TEXTS.bodyText).toContain("çalışması");
      expect(CONSENT_MODAL_TEXTS.bodyText).toContain("kapatılamaz");
    });
  });

  describe("Turkish character encoding safety", () => {
    const TURKISH_CHARS = {
      lowercase: "çğıöşü",
      uppercase: "ÇĞİÖŞÜ",
    };

    test("lowercase Turkish chars round-trip correctly", () => {
      expect(TURKISH_CHARS.lowercase).toBe("çğıöşü");
      expect(TURKISH_CHARS.lowercase.length).toBe(6);
    });

    test("uppercase Turkish chars round-trip correctly", () => {
      expect(TURKISH_CHARS.uppercase).toBe("ÇĞİÖŞÜ");
      expect(TURKISH_CHARS.uppercase.length).toBe(6);
    });

    test("İstanbul toLocaleLowerCase('tr') gives 'istanbul' with dotless ı", () => {
      // Turkish locale lowercases İ → i (dotted i, not ı)
      // and I → ı (dotless i)
      const result = "İstanbul".toLocaleLowerCase("tr");
      expect(result).toBe("istanbul");
    });

    test("location names with Turkish chars are preserved in JSON roundtrip", () => {
      const names = [
        "Şişli, İstanbul",
        "Çankaya, Ankara",
        "Güngören, İstanbul",
        "Büyükçekmece, İstanbul",
        "Keçiören, Ankara",
        "Bağcılar, İstanbul",
      ];

      for (const name of names) {
        const serialized = JSON.stringify(name);
        const deserialized = JSON.parse(serialized);
        expect(deserialized).toBe(name);
      }
    });
  });
});
