/**
 * Security Hardening Test Suite — Claude #8
 *
 * Validates security posture: headers, strict mode, env config,
 * Firebase config safety, and absence of sensitive data in logs.
 */

import { describe, test, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "../..");

// ==================== HELPERS ====================

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf-8");
}

// ==================== 1. next.config.js — Security Headers ====================

describe("next.config.js — Security Headers", () => {
  let configContent: string;

  beforeAll(() => {
    configContent = readFile("next.config.js");
  });

  test("reactStrictMode is enabled", () => {
    expect(configContent).toContain("reactStrictMode: true");
    expect(configContent).not.toContain("reactStrictMode: false");
  });

  test("X-Content-Type-Options: nosniff is set", () => {
    expect(configContent).toContain("X-Content-Type-Options");
    expect(configContent).toContain("nosniff");
  });

  test("X-Frame-Options: DENY is set", () => {
    expect(configContent).toContain("X-Frame-Options");
    expect(configContent).toContain("DENY");
  });

  test("X-XSS-Protection header is set", () => {
    expect(configContent).toContain("X-XSS-Protection");
    expect(configContent).toContain("1; mode=block");
  });

  test("Referrer-Policy is set to strict-origin-when-cross-origin", () => {
    expect(configContent).toContain("Referrer-Policy");
    expect(configContent).toContain("strict-origin-when-cross-origin");
  });

  test("Strict-Transport-Security (HSTS) is configured", () => {
    expect(configContent).toContain("Strict-Transport-Security");
    expect(configContent).toContain("max-age=");
    expect(configContent).toContain("includeSubDomains");
  });

  test("Permissions-Policy denies camera, microphone, geolocation", () => {
    expect(configContent).toContain("Permissions-Policy");
    expect(configContent).toContain("camera=()");
    expect(configContent).toContain("microphone=()");
    expect(configContent).toContain("geolocation=()");
  });

  test("Content-Security-Policy is present with default-src 'self'", () => {
    expect(configContent).toContain("Content-Security-Policy");
    expect(configContent).toContain("default-src 'self'");
  });

  test("CSP includes required Google Maps domains in script-src", () => {
    expect(configContent).toContain("https://maps.googleapis.com");
  });

  test("CSP includes required Firebase domains in connect-src", () => {
    expect(configContent).toContain("https://*.firebaseio.com");
    expect(configContent).toContain("wss://*.firebaseio.com");
  });

  test("CSP includes frame-src for Google ad frames", () => {
    expect(configContent).toContain("frame-src");
    expect(configContent).toContain("https://googleads.g.doubleclick.net");
  });

  test("CSP includes worker-src for blob: workers", () => {
    expect(configContent).toContain("worker-src 'self' blob:");
  });

  // Ensure all 7 security headers are present
  const REQUIRED_HEADERS = [
    "X-Content-Type-Options",
    "X-Frame-Options",
    "X-XSS-Protection",
    "Referrer-Policy",
    "Strict-Transport-Security",
    "Permissions-Policy",
    "Content-Security-Policy",
  ];

  test.each(REQUIRED_HEADERS)("header %s is configured", (header) => {
    expect(configContent).toContain(header);
  });
});

// ==================== 2. .env.example — Required Environment Variables ====================

describe(".env.example — Required Env Vars", () => {
  let envContent: string;

  beforeAll(() => {
    envContent = readFile(".env.example");
  });

  const REQUIRED_ENV_VARS = [
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    "NEXT_PUBLIC_FIREBASE_API_KEY",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    "NEXT_PUBLIC_FIREBASE_APP_ID",
    "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
    "NEXT_PUBLIC_ADSENSE_CLIENT",
    "NEXT_PUBLIC_ENABLE_ADS",
    "NEXT_PUBLIC_GA4_MEASUREMENT_ID",
    "NEXT_PUBLIC_ENABLE_ANALYTICS",
  ];

  test.each(REQUIRED_ENV_VARS)("documents %s", (envVar) => {
    expect(envContent).toContain(envVar);
  });

  test("does not contain real API keys (only placeholders)", () => {
    // Firebase API keys follow the pattern AIzaSy...
    expect(envContent).not.toMatch(/AIzaSy[A-Za-z0-9_-]{33}/);
    // Google Maps API keys also follow AIzaSy pattern
    expect(envContent).not.toMatch(/AIzaSy/);
    // Firebase App IDs follow the pattern 1:DIGITS:web:HEX
    expect(envContent).not.toMatch(/1:\d{10,}:web:[a-f0-9]{20,}/);
  });

  test("uses placeholder values for secrets", () => {
    // .env.example should have placeholder-style values
    expect(envContent).toMatch(/your_/i);
  });
});

// ==================== 3. Firebase Config — No Hardcoded Secrets ====================

describe("Firebase config — No Hardcoded Secrets", () => {
  let firebaseConfig: string;

  beforeAll(() => {
    firebaseConfig = readFile("src/config/firebase.ts");
  });

  test("reads all config values from process.env", () => {
    expect(firebaseConfig).toContain("process.env.NEXT_PUBLIC_FIREBASE_API_KEY");
    expect(firebaseConfig).toContain("process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
    expect(firebaseConfig).toContain("process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID");
    expect(firebaseConfig).toContain("process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL");
  });

  test("does not contain hardcoded API keys", () => {
    // No AIzaSy pattern (Google API key format)
    expect(firebaseConfig).not.toMatch(/AIzaSy[A-Za-z0-9_-]{33}/);
    // No hardcoded Firebase project IDs (typical format: word-word-hexid)
    expect(firebaseConfig).not.toMatch(/["'][\w-]+-[\w-]+-[a-f0-9]{5,}["']/);
  });

  test("does not export raw config object (only database, auth, ref, etc.)", () => {
    // The firebaseConfig const should NOT be exported
    expect(firebaseConfig).not.toMatch(/export\s+(const|let|var)\s+firebaseConfig/);
  });
});

// ==================== 4. No Sensitive Data in Console Logs ====================

describe("No Sensitive Data in Console Logs", () => {
  const SOURCE_DIRS = ["src/config", "src/services", "src/hooks", "src/components"];

  // Collect all .ts/.tsx files from source directories
  function collectSourceFiles(dirs: string[]): string[] {
    const files: string[] = [];
    for (const dir of dirs) {
      const fullDir = path.join(ROOT, dir);
      if (!fs.existsSync(fullDir)) continue;
      const entries = fs.readdirSync(fullDir, { recursive: true }) as string[];
      for (const entry of entries) {
        if (/\.(ts|tsx)$/.test(entry) && !entry.includes("__tests__")) {
          files.push(path.join(fullDir, entry));
        }
      }
    }
    return files;
  }

  test("no console.log statements that might leak API keys", () => {
    const files = collectSourceFiles(SOURCE_DIRS);
    const sensitivePatterns = [
      /console\.log\(.*api[_-]?key/i,
      /console\.log\(.*secret/i,
      /console\.log\(.*password/i,
      /console\.log\(.*token(?!s?\.)/i, // token but not "tokens" in comments
      /console\.log\(.*credential/i,
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      for (const pattern of sensitivePatterns) {
        const match = content.match(pattern);
        expect(
          match,
          `Sensitive data pattern found in ${path.relative(ROOT, file)}: ${match?.[0]}`
        ).toBeNull();
      }
    }
  });

  test("no hardcoded API keys in source files", () => {
    const files = collectSourceFiles(SOURCE_DIRS);
    for (const file of files) {
      const content = fs.readFileSync(file, "utf-8");
      // Google API keys: AIzaSy followed by 33 chars
      const match = content.match(/AIzaSy[A-Za-z0-9_-]{33}/);
      expect(
        match,
        `Hardcoded Google API key found in ${path.relative(ROOT, file)}`
      ).toBeNull();
    }
  });
});

// ==================== 5. package.json — Security Audit Script ====================

describe("package.json — Security Configuration", () => {
  let pkgJson: Record<string, unknown>;

  beforeAll(() => {
    pkgJson = JSON.parse(readFile("package.json"));
  });

  test("has audit:security script", () => {
    const scripts = pkgJson.scripts as Record<string, string>;
    expect(scripts["audit:security"]).toBeDefined();
    expect(scripts["audit:security"]).toContain("npm audit");
    expect(scripts["audit:security"]).toContain("--audit-level=high");
  });

  test("has typecheck script for CI", () => {
    const scripts = pkgJson.scripts as Record<string, string>;
    expect(scripts["typecheck"]).toContain("tsc --noEmit");
  });

  test("has CI script that includes type checking", () => {
    const scripts = pkgJson.scripts as Record<string, string>;
    expect(scripts["ci"]).toContain("tsc --noEmit");
    expect(scripts["ci"]).toContain("vitest run");
    expect(scripts["ci"]).toContain("next build");
  });
});

// ==================== 6. Type Safety — No any in Critical Paths ====================

describe("Type Safety — Critical Service Files", () => {
  const CRITICAL_FILES = [
    "src/services/roomStateMachine.ts",
    "src/services/locationEngine.ts",
    "src/config/firebase.ts",
    "src/config/production.ts",
    "src/config/ads.ts",
    "src/config/maps.ts",
    "src/config/site.ts",
    "src/utils/roomLogic.ts",
  ];

  test.each(CRITICAL_FILES)("%s has no 'as any' casts", (filePath) => {
    const fullPath = path.join(ROOT, filePath);
    if (!fs.existsSync(fullPath)) return; // skip if file doesn't exist
    const content = fs.readFileSync(fullPath, "utf-8");
    const matches = content.match(/as any/g);
    expect(
      matches,
      `Found ${matches?.length ?? 0} 'as any' casts in ${filePath}`
    ).toBeNull();
  });

  test.each(CRITICAL_FILES)("%s has no ': any' type annotations", (filePath) => {
    const fullPath = path.join(ROOT, filePath);
    if (!fs.existsSync(fullPath)) return; // skip if file doesn't exist
    const content = fs.readFileSync(fullPath, "utf-8");
    // Match `: any` that's not in a comment (simple heuristic: line doesn't start with // or *)
    const lines = content.split("\n");
    const anyLines = lines.filter(
      (line) =>
        /:\s*any\b/.test(line) &&
        !line.trim().startsWith("//") &&
        !line.trim().startsWith("*") &&
        !line.trim().startsWith("/*")
    );
    expect(
      anyLines.length,
      `Found ${anyLines.length} ': any' annotations in ${filePath}: ${anyLines[0]?.trim()}`
    ).toBe(0);
  });
});
