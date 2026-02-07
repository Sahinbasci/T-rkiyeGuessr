import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Multiplayer testler sıralı çalışmalı
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Tek worker - multiplayer senkronizasyonu için
  reporter: process.env.CI ? 'github' : 'html',
  timeout: 120000, // 2 dakika timeout

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
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
  ],
});
