import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/pages',
  workers: 1,
  use: {
    baseURL: process.env.PAGES_URL || 'http://127.0.0.1:3200/halloween-assortment-ai-dashboard/',
    viewport: { width: 1920, height: 1080 },
  },
  webServer: process.env.PAGES_URL
    ? undefined
    : {
        command: 'node scripts/serve-pages.mjs',
        url: 'http://127.0.0.1:3200/halloween-assortment-ai-dashboard/',
        reuseExistingServer: false,
      },
  outputDir: 'test-results/pages',
});
