import { defineConfig, devices } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load .env.local so tests can check for API keys
const envPath = resolve(__dirname, '.env.local');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match && !process.env[match[1].trim()]) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Multiplayer testler sıralı çalışmalı
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 2,
  workers: 1, // Tek worker - multiplayer senkronizasyonu için
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 300000, // 5 dakika timeout (room setup retries + 90s timer + 30s cleanup + buffer)

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Dev server'ı otomatik başlat
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  projects: [
    // =========================================================
    // Navigation Engine Tests - Mobile Emulation
    // =========================================================
    {
      name: 'Navigation - iPhone 14',
      testMatch: 'navigation.spec.ts',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'Navigation - Pixel 7',
      testMatch: 'navigation.spec.ts',
      use: { ...devices['Pixel 7'] },
    },

    // =========================================================
    // Multiplayer & General Tests
    // =========================================================
    {
      name: 'Mobile Safari (iPhone 14)',
      testMatch: 'multiplayer.spec.ts',
      use: { ...devices['iPhone 14'] },
    },
    {
      name: 'Mobile Chrome (Pixel 7)',
      testMatch: 'multiplayer.spec.ts',
      use: { ...devices['Pixel 7'] },
    },
    // Desktop test
    {
      name: 'Desktop Chrome',
      testMatch: 'multiplayer.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // =========================================================
    // Production Hardening Tests (BUG fixes)
    // =========================================================
    {
      name: 'Hardening - Desktop',
      testMatch: 'hardening.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Hardening - Mobile',
      testMatch: 'hardening.spec.ts',
      use: { ...devices['iPhone 14'] },
    },

    // =========================================================
    // Resync / Reconnect / Desync Tests
    // =========================================================
    {
      name: 'Resync - Mobile',
      testMatch: 'resync.spec.ts',
      use: { ...devices['iPhone 14'] },
    },

    // =========================================================
    // Smoke Tests
    // =========================================================
    {
      name: 'Smoke - Mobile',
      testMatch: 'smoke.spec.ts',
      use: { ...devices['iPhone 14'] },
    },

    // =========================================================
    // Bug-Catcher E2E Tests
    // =========================================================
    {
      name: 'Bugcatcher - Desktop',
      testMatch: 'bugcatcher.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Bugcatcher - Mobile',
      testMatch: 'bugcatcher.spec.ts',
      use: { ...devices['iPhone 14'] },
    },

    // =========================================================
    // Stabilization Sprint Tests (A1-A4, B1-B4)
    // =========================================================
    {
      name: 'Stabilization - Desktop',
      testMatch: 'stabilization.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Stabilization - Mobile',
      testMatch: 'stabilization.spec.ts',
      use: { ...devices['iPhone 14'] },
    },

    // =========================================================
    // AdSense Readiness Audit (GAP #6)
    // =========================================================
    {
      name: 'AdSense Audit - Desktop',
      testMatch: 'adsense-audit.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'AdSense Audit - Mobile',
      testMatch: 'adsense-audit.spec.ts',
      use: { ...devices['iPhone 14'] },
    },
  ],
});
