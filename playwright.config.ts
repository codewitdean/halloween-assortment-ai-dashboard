import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3100',
    browserName: 'chromium',
    viewport: { width: 1920, height: 1080 },
  },
  webServer: {
    command: 'npm run dev -- --port 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      NEXT_DIST_DIR: '.next-e2e',
      RATIONALE_DATA_DIR: 'test-results/rationale-store',
      OPENAI_API_KEY: '',
      OPENAI_MODEL: '',
    },
  },
  outputDir: 'test-results',
});
