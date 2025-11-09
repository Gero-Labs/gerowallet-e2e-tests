import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Environment variables
const extensionPath = path.resolve(process.env.EXTENSION_PATH || path.join(__dirname, '../../..', 'gerowallet/extension'));

export type ExtensionFixtures = {
  context: BrowserContext;
  extensionId: string;
  extensionUrl: (path: string) => string;
};

/**
 * Extension fixture for Playwright tests
 * Loads the GeroWallet Chrome extension and provides utilities
 */
export const test = base.extend<ExtensionFixtures>({
  /**
   * Browser context with the extension loaded
   */
  context: async ({}, use) => {
    // Create a temporary user data directory
    const userDataDir = path.join(__dirname, '../../tmp', `user-data-${Date.now()}`);

    // Launch browser with extension
    const context = await chromium.launchPersistentContext(userDataDir, {
      headless: false, // Extensions require headed mode
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
      viewport: { width: 1280, height: 720 },
      // Extension permissions are defined in manifest.json, not here
    });

    // Create a blank page to keep the browser open
    const pages = context.pages();
    if (pages.length === 0) {
      await context.newPage();
    }

    // Wait for extension to load
    // Try to get existing service worker or wait for it to load
    try {
      if (context.serviceWorkers().length === 0) {
        await context.waitForEvent('serviceworker', { timeout: 15000 });
      }
    } catch (error) {
      console.warn('Service worker did not load within timeout:', error);
      // Continue anyway - the test might still be able to find the extension
    }

    await use(context);

    // Cleanup
    await context.close();
  },

  /**
   * Extension ID extracted from the service worker URL
   */
  extensionId: async ({ context }, use) => {
    // Get the service worker (background script)
    let serviceWorker = context.serviceWorkers()[0];

    // If not available yet, wait for it
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker', { timeout: 10000 });
    }

    // Extract extension ID from the service worker URL
    // Format: chrome-extension://{extensionId}/background.js
    const extensionId = serviceWorker.url().split('/')[2];

    console.log(`✓ Extension loaded with ID: ${extensionId}`);

    await use(extensionId);
  },

  /**
   * Helper function to generate extension URLs
   */
  extensionUrl: async ({ extensionId }, use) => {
    const urlBuilder = (path: string) => {
      // Remove leading slash if present
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;
      return `chrome-extension://${extensionId}/${cleanPath}`;
    };

    await use(urlBuilder);
  },
});

export { expect } from '@playwright/test';