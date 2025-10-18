import { test as base, type Page } from '@playwright/test';
import { test as extensionTest } from './extension.fixture';
import type { ExtensionFixtures } from './extension.fixture';

export type WalletFixtures = ExtensionFixtures & {
  optionsPage: Page;
  createWallet: (name: string, mnemonic: string, password: string) => Promise<void>;
  loginWallet: (password: string) => Promise<void>;
  getWalletAddress: () => Promise<string>;
};

/**
 * Wallet fixture extending extension fixture
 * Provides wallet-specific operations and helpers
 */
export const test = extensionTest.extend<WalletFixtures>({
  /**
   * Options page (main wallet interface)
   */
  optionsPage: async ({ context, extensionUrl }, use) => {
    // Create new page and navigate to options
    const page = await context.newPage();
    await page.goto(extensionUrl('options.html'));

    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');

    await use(page);

    await page.close();
  },

  /**
   * Create a new wallet
   */
  createWallet: async ({ optionsPage }, use) => {
    const createWalletFn = async (name: string, mnemonic: string, password: string) => {
      console.log(`Creating wallet: ${name}`);

      // Wait for welcome/onboarding screen
      await optionsPage.waitForSelector('[data-testid="welcome-screen"], .welcome-container', {
        timeout: 10000
      });

      // Click "Create Wallet" or "Import Wallet" based on page structure
      const importButton = optionsPage.locator('button:has-text("Import Wallet"), button:has-text("Restore Wallet")');
      if (await importButton.isVisible({ timeout: 2000 })) {
        await importButton.click();
      }

      // Enter wallet name
      const nameInput = optionsPage.locator('input[type="text"]:visible, input[placeholder*="name" i]:visible').first();
      await nameInput.fill(name);

      // Enter mnemonic phrase
      const mnemonicInput = optionsPage.locator('textarea:visible, input[placeholder*="phrase" i]:visible').first();
      await mnemonicInput.fill(mnemonic);

      // Enter password (first field)
      const passwordInputs = optionsPage.locator('input[type="password"]:visible');
      await passwordInputs.nth(0).fill(password);

      // Confirm password (second field)
      await passwordInputs.nth(1).fill(password);

      // Accept terms if present
      const termsCheckbox = optionsPage.locator('input[type="checkbox"]:visible').first();
      if (await termsCheckbox.isVisible({ timeout: 1000 })) {
        await termsCheckbox.check();
      }

      // Click create/import button
      const submitButton = optionsPage.locator('button:has-text("Create"), button:has-text("Import"), button[type="submit"]:visible').last();
      await submitButton.click();

      // Wait for wallet to be created (dashboard should appear)
      await optionsPage.waitForSelector('[data-testid="dashboard"], .dashboard-container', {
        timeout: 30000
      });

      console.log(`✓ Wallet created: ${name}`);
    };

    await use(createWalletFn);
  },

  /**
   * Login to existing wallet
   */
  loginWallet: async ({ optionsPage }, use) => {
    const loginWalletFn = async (password: string) => {
      console.log('Logging into wallet...');

      // Wait for login screen
      await optionsPage.waitForSelector('[data-testid="login-screen"], .login-container, input[type="password"]:visible', {
        timeout: 10000
      });

      // Enter password
      const passwordInput = optionsPage.locator('input[type="password"]:visible').first();
      await passwordInput.fill(password);

      // Click login button
      const loginButton = optionsPage.locator('button:has-text("Login"), button:has-text("Unlock"), button[type="submit"]:visible').first();
      await loginButton.click();

      // Wait for dashboard
      await optionsPage.waitForSelector('[data-testid="dashboard"], .dashboard-container', {
        timeout: 30000
      });

      console.log('✓ Logged in successfully');
    };

    await use(loginWalletFn);
  },

  /**
   * Get wallet address from UI
   */
  getWalletAddress: async ({ optionsPage }, use) => {
    const getAddressFn = async (): Promise<string> => {
      // Look for receive button/address display
      const addressElement = optionsPage.locator('[data-testid="wallet-address"], .wallet-address, .receive-address').first();

      if (await addressElement.isVisible({ timeout: 5000 })) {
        return await addressElement.textContent() || '';
      }

      // Try clicking "Receive" button to show address
      const receiveButton = optionsPage.locator('button:has-text("Receive")').first();
      if (await receiveButton.isVisible({ timeout: 2000 })) {
        await receiveButton.click();
        await optionsPage.waitForTimeout(1000);

        const addressInModal = optionsPage.locator('[data-testid="wallet-address"], .wallet-address, .receive-address').first();
        return await addressInModal.textContent() || '';
      }

      throw new Error('Could not find wallet address in UI');
    };

    await use(getAddressFn);
  },
});

export { expect } from '@playwright/test';