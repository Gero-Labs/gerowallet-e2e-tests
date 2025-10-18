import type { Page, BrowserContext } from '@playwright/test';

/**
 * Extension-specific utility functions
 */

/**
 * Wait for extension to be fully loaded
 */
export async function waitForExtensionReady(context: BrowserContext, timeout: number = 30000): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const serviceWorkers = context.serviceWorkers();
    if (serviceWorkers.length > 0) {
      console.log('✓ Extension service worker ready');
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error('Extension service worker did not load within timeout');
}

/**
 * Open extension popup
 */
export async function openPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  const popupUrl = `chrome-extension://${extensionId}/popup.html`;
  const page = await context.newPage();
  await page.goto(popupUrl);
  await page.waitForLoadState('domcontentloaded');
  return page;
}

/**
 * Open extension options page
 */
export async function openOptions(context: BrowserContext, extensionId: string): Promise<Page> {
  const optionsUrl = `chrome-extension://${extensionId}/options.html`;
  const page = await context.newPage();
  await page.goto(optionsUrl);
  await page.waitForLoadState('domcontentloaded');
  return page;
}

/**
 * Open extension side panel
 */
export async function openSidePanel(context: BrowserContext, extensionId: string): Promise<Page> {
  const sidePanelUrl = `chrome-extension://${extensionId}/sidepanel.html`;
  const page = await context.newPage();
  await page.goto(sidePanelUrl);
  await page.waitForLoadState('domcontentloaded');
  return page;
}

/**
 * Get extension local storage data
 */
export async function getExtensionStorage(page: Page, keys?: string[]): Promise<any> {
  return await page.evaluate((storageKeys) => {
    return new Promise((resolve) => {
      if (storageKeys && storageKeys.length > 0) {
        chrome.storage.local.get(storageKeys, (result) => resolve(result));
      } else {
        chrome.storage.local.get(null, (result) => resolve(result));
      }
    });
  }, keys);
}

/**
 * Set extension local storage data
 */
export async function setExtensionStorage(page: Page, data: Record<string, any>): Promise<void> {
  await page.evaluate((storageData) => {
    return new Promise<void>((resolve) => {
      chrome.storage.local.set(storageData, () => resolve());
    });
  }, data);
}

/**
 * Clear extension local storage
 */
export async function clearExtensionStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    return new Promise<void>((resolve) => {
      chrome.storage.local.clear(() => resolve());
    });
  });
}

/**
 * Wait for element with retry
 */
export async function waitForElementWithRetry(
  page: Page,
  selector: string,
  options: { timeout?: number; retries?: number } = {}
): Promise<void> {
  const { timeout = 5000, retries = 3 } = options;

  for (let i = 0; i < retries; i++) {
    try {
      await page.waitForSelector(selector, { timeout });
      return;
    } catch (error) {
      if (i === retries - 1) throw error;
      console.log(`Retry ${i + 1}/${retries} for selector: ${selector}`);
      await page.waitForTimeout(1000);
    }
  }
}

/**
 * Take screenshot with timestamp
 */
export async function takeScreenshot(page: Page, name: string, directory: string = 'screenshots'): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${directory}/${name}-${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  console.log(`Screenshot saved: ${filename}`);
  return filename;
}

/**
 * Simulate dApp connection request
 */
export async function simulateDAppConnection(
  context: BrowserContext,
  dappUrl: string = 'https://example.com'
): Promise<Page> {
  const dappPage = await context.newPage();
  await dappPage.goto(dappUrl);

  // Inject Cardano API request script
  await dappPage.evaluate(() => {
    return new Promise((resolve) => {
      if (window.cardano && window.cardano.gero) {
        window.cardano.gero.enable().then(resolve).catch(resolve);
      } else {
        resolve(null);
      }
    });
  });

  return dappPage;
}

/**
 * Wait for Chrome storage change
 */
export async function waitForStorageChange(
  page: Page,
  key: string,
  timeout: number = 10000
): Promise<any> {
  return await page.evaluate(({ storageKey, timeoutMs }) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        chrome.storage.onChanged.removeListener(listener);
        reject(new Error(`Storage change timeout for key: ${storageKey}`));
      }, timeoutMs);

      const listener = (changes: any, areaName: string) => {
        if (areaName === 'local' && changes[storageKey]) {
          clearTimeout(timeoutId);
          chrome.storage.onChanged.removeListener(listener);
          resolve(changes[storageKey].newValue);
        }
      };

      chrome.storage.onChanged.addListener(listener);
    });
  }, { storageKey: key, timeoutMs: timeout });
}

/**
 * Get console logs from page
 */
export function setupConsoleCapture(page: Page): void {
  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();

    // Filter out noise
    if (text.includes('DevTools') || text.includes('extension')) return;

    if (type === 'error') {
      console.error(`[PAGE ERROR] ${text}`);
    } else if (type === 'warning') {
      console.warn(`[PAGE WARN] ${text}`);
    } else if (process.env.DEBUG) {
      console.log(`[PAGE] ${text}`);
    }
  });

  page.on('pageerror', (error) => {
    console.error(`[PAGE EXCEPTION] ${error.message}`);
  });
}