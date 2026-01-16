import { test as base, type Page } from '@playwright/test';
import { test as extensionTest } from './extension.fixture';
import type { ExtensionFixtures } from './extension.fixture';

export type WalletFixtures = ExtensionFixtures & {
  optionsPage: Page;
  createWallet: (name: string, mnemonic: string, password: string) => Promise<void>;
  restoreWallet: (name: string, mnemonic: string, password: string) => Promise<void>;
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
    await page.goto(extensionUrl('index.html'));

    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');

    // Wait for the Vue app to initialize
    await page.waitForTimeout(3000);

    await use(page);

    await page.close();
  },

  /**
   * Create a new wallet (generates mnemonic automatically)
   */
  createWallet: async ({ optionsPage }, use) => {
    const createWalletFn = async (name: string, mnemonic: string, password: string) => {
      console.log(`Creating wallet: ${name}`);

      // First, select the preprod network (for testing)
      const networkSelector = optionsPage.locator('button:has-text("Cardano Mainnet")');
      await networkSelector.waitFor({ timeout: 10000 });
      await networkSelector.click();

      // Wait for dropdown to open and select preprod
      await optionsPage.waitForTimeout(1000);
      // Try multiple selectors for preprod option
      const preprodOption = optionsPage.locator('.v-list-item:has-text("preprod"), .v-list-item:has-text("Preprod"), [role="option"]:has-text("preprod")').first();
      if (await preprodOption.isVisible({ timeout: 2000 })) {
        await preprodOption.click();
        console.log('✓ Selected preprod network');
        await optionsPage.waitForTimeout(1000);
      } else {
        console.log('⚠ Preprod option not found, continuing with default network');
      }

      // Click the initial "Create or Import Seed Phrase" button on welcome screen
      const createImportButton = optionsPage.locator('button:has-text("Create or Import Seed Phrase")');
      await createImportButton.waitFor({ timeout: 10000 });
      await createImportButton.click();

      // Wait for the modal with wallet options to appear
      await optionsPage.waitForTimeout(2000);

      // Click "Create Wallet" option (it's a DIV, not a button!)
      const createWalletOption = optionsPage.locator('text="Create Wallet"').first();
      await createWalletOption.waitFor({ timeout: 10000 });
      await createWalletOption.click();
      console.log('✓ Clicked Create Wallet option');

      // Wait for the wallet creation form to load
      await optionsPage.waitForTimeout(2000);

      // Clear and enter wallet name (it's pre-filled with default)
      const nameInput = optionsPage.locator('input[type="text"]:visible').first();
      await nameInput.clear();
      await nameInput.fill(name);

      // Enter spending password
      const passwordInputs = optionsPage.locator('input[type="password"]:visible');
      await passwordInputs.nth(0).fill(password);

      // Confirm password (second field)
      await passwordInputs.nth(1).fill(password);

      // Check both checkboxes (use force to bypass Vuetify ripple element)
      const checkboxes = optionsPage.locator('input[type="checkbox"]:visible');
      await checkboxes.nth(0).check({ force: true }); // "I understand that GeroWallet cannot recover this password"
      await checkboxes.nth(1).check({ force: true }); // "I have read and agree to the Terms of Service"

      // Click "Create Wallet" button
      const submitButton = optionsPage.locator('button:has-text("Create Wallet")').last();
      await submitButton.click();

      // Wait for wallet to be created (dashboard should appear)
      // Look for the "Gero Dashboard" heading (use regex for flexible matching)
      await optionsPage.locator('h1:has-text("Gero Dashboard")').waitFor({
        state: 'visible',
        timeout: 60000
      });

      // Handle the "Welcome to Gero Dashboard" carousel dialog that appears for new wallets
      // The carousel has 4 pages, and we need to click through to the 4th page and click "Get Started"
      await optionsPage.waitForTimeout(1000);

      // Click through the carousel pages (3 times to reach page 4)
      for (let i = 0; i < 3; i++) {
        // Look for the next arrow button in the carousel
        const nextArrow = optionsPage.locator('.v-window__next button, button[aria-label*="next" i], .mdi-chevron-right').first();
        if (await nextArrow.isVisible({ timeout: 1000 }).catch(() => false)) {
          await nextArrow.click({ force: true });
          await optionsPage.waitForTimeout(500);
          console.log(`✓ Clicked carousel next (${i + 1}/3)`);
        }
      }

      // Now click "Get Started" button on the 4th page to close the carousel
      const getStartedButton = optionsPage.locator('button:has-text("Get Started"), button:has-text("GET STARTED")').first();
      if (await getStartedButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await getStartedButton.click({ force: true });
        console.log('✓ Clicked Get Started - closed welcome carousel');
      }

      // Wait a moment for any animations to complete
      await optionsPage.waitForTimeout(500);

      console.log(`✓ Wallet created: ${name}`);
    };

    await use(createWalletFn);
  },

  /**
   * Restore wallet from existing mnemonic
   */
  restoreWallet: async ({ optionsPage }, use) => {
    const restoreWalletFn = async (name: string, mnemonic: string, password: string) => {
      console.log(`Restoring wallet: ${name}`);

      // First, select the preprod network (for testing)
      const networkSelector = optionsPage.locator('button:has-text("Cardano Mainnet")');
      await networkSelector.waitFor({ timeout: 10000 });
      await networkSelector.click();

      // Wait for dropdown to open and select preprod
      await optionsPage.waitForTimeout(1000);
      const preprodOption = optionsPage.locator('.v-list-item:has-text("preprod"), .v-list-item:has-text("Preprod"), [role="option"]:has-text("preprod")').first();
      if (await preprodOption.isVisible({ timeout: 2000 })) {
        await preprodOption.click();
        console.log('✓ Selected preprod network');
        await optionsPage.waitForTimeout(1000);
      } else {
        console.log('⚠ Preprod option not found, continuing with default network');
      }

      // Click the initial "Create or Import Seed Phrase" button on welcome screen
      const createImportButton = optionsPage.locator('button:has-text("Create or Import Seed Phrase")');
      await createImportButton.waitFor({ timeout: 10000 });
      await createImportButton.click();

      // Wait for the modal with wallet options to appear
      await optionsPage.waitForTimeout(2000);

      // Click "Restore Wallet" option (it's a DIV, not a button!)
      const restoreWalletOption = optionsPage.locator('text="Restore Wallet"').first();
      await restoreWalletOption.waitFor({ timeout: 10000 });
      await restoreWalletOption.click();
      console.log('✓ Clicked Restore Wallet option');

      // Wait for the wallet restoration form to load
      await optionsPage.waitForTimeout(2000);

      // The restore form uses dropdowns for each word, not a textarea
      // First, select the mnemonic phrase length
      const words = mnemonic.trim().split(/\s+/);
      const wordCount = words.length;
      console.log(`Mnemonic has ${wordCount} words`);

      // Click the appropriate phrase length button (12, 15, or 24)
      // Note: These buttons use MDI icons (mdi-numeric-*), not text
      // Find buttons with numeric icons and select by index: 0=12, 1=15, 2=24
      const phraseLengthButtons = optionsPage.locator('button:has(.mdi-numeric-1, .mdi-numeric-2)');
      const buttonIndex = wordCount === 12 ? 0 : wordCount === 15 ? 1 : 2;
      await phraseLengthButtons.nth(buttonIndex).click();
      console.log(`✓ Selected ${wordCount}-word phrase length`);
      await optionsPage.waitForTimeout(1000);

      // Fill in each word dropdown
      // The dropdowns are Vuetify v-select/v-autocomplete components
      for (let i = 0; i < wordCount; i++) {
        const word = words[i];

        // Wait for DOM to stabilize after previous word
        await optionsPage.waitForTimeout(300);

        // Find all visible autocomplete inputs (the actual input fields within v-autocomplete)
        // We need to find empty ones (not ones that already have a value selected)
        const inputs = optionsPage.locator('.v-select input:visible, .v-autocomplete input:visible');
        const inputCount = await inputs.count();

        // Find the first empty input by checking which ones don't have aria-label with a word
        let targetInput = null;
        for (let j = 0; j < inputCount; j++) {
          const input = inputs.nth(j);
          const value = await input.inputValue();

          // If input is empty or doesn't have a proper value, it's our target
          if (!value || value.trim() === '') {
            targetInput = input;
            break;
          }
        }

        if (!targetInput) {
          console.log(`⚠ Could not find empty input for word ${i + 1}: "${word}"`);
          // Fallback to nth selector
          targetInput = inputs.nth(i);
        }

        // Click the input to focus and open dropdown
        await targetInput.click();
        await optionsPage.waitForTimeout(300);

        // Clear any existing text and type the word
        await targetInput.fill('');
        await targetInput.type(word, { delay: 50 });
        await optionsPage.waitForTimeout(500);

        // Wait for dropdown options to appear and press Enter to select
        await optionsPage.keyboard.press('Enter');
        await optionsPage.waitForTimeout(300);

        if ((i + 1) % 5 === 0 || i === wordCount - 1) {
          console.log(`✓ Entered ${i + 1}/${wordCount} words`);
        }
      }
      console.log(`✓ Entered all ${wordCount} mnemonic words`);

      // Click Continue button
      const continueButton = optionsPage.locator('button:has-text("Continue"), button:has-text("CONTINUE")').first();
      await continueButton.click();
      console.log('✓ Clicked Continue');
      await optionsPage.waitForTimeout(2000);

      // Now we should be on step 2: Wallet Setup
      // Enter wallet name (if there's a name field)
      const nameInputs = optionsPage.locator('input[type="text"]:visible');
      if (await nameInputs.count() > 0) {
        await nameInputs.first().fill(name);
        console.log('✓ Entered wallet name');
      }

      // Enter spending password
      const passwordInputs = optionsPage.locator('input[type="password"]:visible');
      await passwordInputs.nth(0).fill(password);

      // Confirm password (second field)
      await passwordInputs.nth(1).fill(password);
      console.log('✓ Entered passwords');

      // Check both checkboxes (use force to bypass Vuetify ripple element)
      const checkboxes = optionsPage.locator('input[type="checkbox"]:visible');
      const checkboxCount = await checkboxes.count();
      for (let i = 0; i < checkboxCount; i++) {
        await checkboxes.nth(i).check({ force: true });
      }
      console.log(`✓ Checked ${checkboxCount} checkboxes`);

      // Wait a bit for any UI settling
      await optionsPage.waitForTimeout(1000);

      // Debug: Check form state before submit
      const preSubmitState = await optionsPage.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="password"]'));
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
        return {
          passwordCount: inputs.length,
          passwordsFilled: inputs.every((input: any) => input.value && input.value.length > 0),
          checkboxCount: checkboxes.length,
          checkboxesChecked: checkboxes.every((cb: any) => cb.checked),
          url: window.location.href
        };
      });
      console.log('Form state before submit:', JSON.stringify(preSubmitState, null, 2));

      // Click Continue button to finish wallet setup (step 2)
      // The "Continue" button should be visible after filling in password and checkboxes
      const submitButton = optionsPage.locator('button:has-text("Continue")').last();
      await submitButton.waitFor({ state: 'visible', timeout: 5000 });
      const submitButtonText = await submitButton.textContent();
      console.log(`Submit button text: "${submitButtonText}"`);

      await submitButton.click({ force: true });
      console.log('✓ Clicked Continue button');

      // Wait a moment and check if we're still on the same page or if we navigated
      await optionsPage.waitForTimeout(5000);

      const postSubmitState = await optionsPage.evaluate(() => ({
        url: window.location.href,
        bodyText: document.body?.textContent?.substring(0, 300),
        visibleButtons: Array.from(document.querySelectorAll('button')).map((btn: any) => btn.textContent?.trim()).filter(Boolean)
      }));
      console.log('State 5s after submit:', JSON.stringify(postSubmitState, null, 2));

      // Wait for wallet restoration to complete and dashboard to appear
      // The wallet restoration process derives keys from the mnemonic which takes time
      console.log('Waiting for wallet restoration to complete...');

      // Wait for the dashboard to appear
      // Restored wallets show "Portfolio" heading, new wallets show "Gero Dashboard"
      // Use Promise.race to wait for either one
      await Promise.race([
        optionsPage.locator('text=/Portfolio/i').first().waitFor({ state: 'visible', timeout: 120000 }),
        optionsPage.locator('h1:has-text("Gero Dashboard")').waitFor({ state: 'visible', timeout: 120000 })
      ]);

      console.log(`✓ Wallet restored: ${name}`);
    };

    await use(restoreWalletFn);
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