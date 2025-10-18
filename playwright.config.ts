import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Path to the built GeroWallet extension
const extensionPath = process.env.EXTENSION_PATH || path.join(__dirname, '../gerowallet/extension');

export default defineConfig({
  testDir: './tests/specs',

  // Maximum time one test can run
  timeout: 120 * 1000,

  // Test execution settings
  fullyParallel: false, // Run tests serially to avoid wallet state conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to prevent database conflicts

  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  // Shared settings for all projects
  use: {
    // Base URL for the extension (will be set dynamically in fixtures)
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Slower actions for stability
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
  },

  // Configure projects for Chromium with extension
  projects: [
    {
      name: 'chromium-extension',
      use: {
        ...devices['Desktop Chrome'],
        // Extension-specific settings will be applied in fixtures
        headless: false, // Extensions require headed mode
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // Global setup/teardown
  globalSetup: './tests/utils/global-setup.ts',
  globalTeardown: './tests/utils/global-teardown.ts',
});

// Export extension path for use in tests
export { extensionPath };