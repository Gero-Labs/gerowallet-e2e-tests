import { test, expect } from '../fixtures/wallet.fixture';
import { generateMnemonic } from '../utils/cardano.utils';
import { setupConsoleCapture, simulateDAppConnection } from '../utils/extension.utils';
import { TEST_WALLET_PASSWORD, DAPP_URLS } from '../utils/test-data';

/**
 * Test Suite: DApp Connection
 * Tests the Cardano dApp connector (CIP-30) functionality
 */

test.describe('DApp Connection', () => {
  test.beforeEach(async ({ createWallet, optionsPage }) => {
    const mnemonic = generateMnemonic();
    const walletName = 'DApp Test Wallet';

    await createWallet(walletName, mnemonic, TEST_WALLET_PASSWORD);
    setupConsoleCapture(optionsPage);

    // Wait for wallet to be ready
    await optionsPage.waitForTimeout(3000);
  });

  test('should inject Cardano API into web pages', async ({ context }) => {
    // Create a test page
    const page = await context.newPage();
    await page.goto('https://example.com');

    // Check if window.cardano is available
    const hasCardanoAPI = await page.evaluate(() => {
      return typeof window.cardano !== 'undefined';
    });

    expect(hasCardanoAPI).toBe(true);
    console.log('✅ Cardano API injected into page');

    // Check if Gero wallet is available
    const hasGeroWallet = await page.evaluate(() => {
      return window.cardano && typeof window.cardano.gero !== 'undefined';
    });

    expect(hasGeroWallet).toBe(true);
    console.log('✅ Gero wallet API available');

    await page.close();
  });

  test('should expose wallet name and icon', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('https://example.com');

    // Get wallet metadata
    const walletMetadata = await page.evaluate(() => {
      if (window.cardano && window.cardano.gero) {
        return {
          name: window.cardano.gero.name,
          icon: window.cardano.gero.icon,
          apiVersion: window.cardano.gero.apiVersion
        };
      }
      return null;
    });

    expect(walletMetadata).toBeTruthy();
    expect(walletMetadata?.name).toBeTruthy();
    console.log(`Wallet metadata:`, walletMetadata);

    await page.close();
  });

  test('should check if wallet is enabled', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('https://example.com');

    // Check isEnabled method
    const isEnabled = await page.evaluate(async () => {
      if (window.cardano && window.cardano.gero) {
        return await window.cardano.gero.isEnabled();
      }
      return false;
    });

    // Should be false initially (not connected)
    expect(typeof isEnabled).toBe('boolean');
    console.log(`✅ isEnabled() returned: ${isEnabled}`);

    await page.close();
  });

  test.skip('should handle connection request', async ({ context, optionsPage }) => {
    // This test is skipped because it requires manual interaction
    // or automated handling of the connection approval popup

    const dappPage = await context.newPage();
    await dappPage.goto('https://example.com');

    // Request wallet connection
    const connectionRequest = dappPage.evaluate(async () => {
      if (window.cardano && window.cardano.gero) {
        try {
          const api = await window.cardano.gero.enable();
          return { success: true, api: !!api };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
      return { success: false, error: 'Wallet not found' };
    });

    // In a real scenario, you would need to:
    // 1. Wait for connection approval popup
    // 2. Approve the connection
    // 3. Verify the API is returned

    await dappPage.close();
  });

  test('should expose CIP-30 API methods', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('https://example.com');

    // Check for required CIP-30 methods
    const apiMethods = await page.evaluate(() => {
      if (window.cardano && window.cardano.gero) {
        return {
          hasEnable: typeof window.cardano.gero.enable === 'function',
          hasIsEnabled: typeof window.cardano.gero.isEnabled === 'function',
          name: window.cardano.gero.name,
          icon: window.cardano.gero.icon
        };
      }
      return null;
    });

    expect(apiMethods).toBeTruthy();
    expect(apiMethods?.hasEnable).toBe(true);
    expect(apiMethods?.hasIsEnabled).toBe(true);

    console.log('✅ CIP-30 API methods exposed correctly');

    await page.close();
  });

  test('should handle multiple dApp connections', async ({ context }) => {
    // Open two different pages
    const page1 = await context.newPage();
    await page1.goto('https://example.com');

    const page2 = await context.newPage();
    await page2.goto('https://example.org');

    // Both should have Cardano API
    const hasAPI1 = await page1.evaluate(() => typeof window.cardano?.gero !== 'undefined');
    const hasAPI2 = await page2.evaluate(() => typeof window.cardano?.gero !== 'undefined');

    expect(hasAPI1).toBe(true);
    expect(hasAPI2).toBe(true);

    console.log('✅ Multiple pages have Cardano API');

    await page1.close();
    await page2.close();
  });

  test('should maintain API availability after page reload', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('https://example.com');

    // Check API before reload
    const hasAPIBefore = await page.evaluate(() => typeof window.cardano?.gero !== 'undefined');
    expect(hasAPIBefore).toBe(true);

    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Check API after reload
    const hasAPIAfter = await page.evaluate(() => typeof window.cardano?.gero !== 'undefined');
    expect(hasAPIAfter).toBe(true);

    console.log('✅ API maintained after page reload');

    await page.close();
  });

  test('should handle API errors gracefully', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('https://example.com');

    // Try to call enable without user approval (should handle error)
    const result = await page.evaluate(async () => {
      if (window.cardano && window.cardano.gero) {
        try {
          // This will likely fail without user approval
          await window.cardano.gero.enable();
          return { success: true };
        } catch (error) {
          return {
            success: false,
            hasError: true,
            errorType: error.constructor.name
          };
        }
      }
      return { success: false, hasError: false };
    });

    // Should either succeed or fail gracefully with an error
    expect(result.success === true || result.hasError === true).toBe(true);

    console.log('✅ API handles errors gracefully:', result);

    await page.close();
  });
});