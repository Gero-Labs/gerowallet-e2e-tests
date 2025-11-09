import { test, expect } from '@fixtures/wallet.fixture';
import { generateMnemonic } from '@utils/cardano.utils';
import { setupConsoleCapture } from '@utils/extension.utils';
import { TEST_WALLET_PASSWORD, TIMEOUTS } from '@utils/test-data';

/**
 * Test Suite: Wallet Creation
 * Tests the wallet creation flow in GeroWallet
 */

test.describe('Wallet Creation', () => {
  test('should load extension successfully', async ({ context, extensionId }) => {
    // Verify extension ID is valid
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/);

    // Verify service worker is running
    const serviceWorkers = context.serviceWorkers();
    expect(serviceWorkers.length).toBeGreaterThan(0);

    console.log('✅ Extension loaded with ID:', extensionId);
  });

  test('should create a new wallet with generated mnemonic', async ({
    optionsPage,
    createWallet
  }) => {
    setupConsoleCapture(optionsPage);

    // Generate new mnemonic
    const mnemonic = generateMnemonic();
    expect(mnemonic.split(' ').length).toBe(24);

    const walletName = 'Test Wallet - Auto Generated';

    // Create wallet
    await createWallet(walletName, mnemonic, TEST_WALLET_PASSWORD);

    // Verify dashboard is visible (check for welcome message)
    await expect(
      optionsPage.locator('text="Welcome to Gero Wallet"')
    ).toBeVisible({ timeout: TIMEOUTS.walletCreation });

    console.log('✅ Wallet created successfully');
  });

  test('should restore wallet from existing mnemonic', async ({
    optionsPage,
    restoreWallet
  }) => {
    setupConsoleCapture(optionsPage);

    // Use the user-provided test mnemonic (15 words)
    const testMnemonic = 'manage metal also spy ignore sick trip frequent simple blade bright stool pencil neither can';
    const walletName = 'Test Wallet - Restored';

    // Restore wallet
    await restoreWallet(walletName, testMnemonic, TEST_WALLET_PASSWORD);

    // Verify dashboard is visible (check for welcome message)
    await expect(
      optionsPage.locator('text="Welcome to Gero Wallet"')
    ).toBeVisible({ timeout: TIMEOUTS.walletCreation });

    console.log('✅ Wallet restored successfully');
  });

  test('should reject invalid mnemonic phrase', async ({ optionsPage }) => {
    setupConsoleCapture(optionsPage);

    // Select preprod network
    const networkSelector = optionsPage.locator('button:has-text("Cardano Mainnet")');
    await networkSelector.click();
    await optionsPage.waitForTimeout(1000);
    const preprodOption = optionsPage.locator('.v-list-item:has-text("preprod"), .v-list-item:has-text("Preprod")').first();
    if (await preprodOption.isVisible({ timeout: 2000 })) {
      await preprodOption.click();
      await optionsPage.waitForTimeout(1000);
    }

    // Click the initial "Create or Import Seed Phrase" button
    const createImportButton = optionsPage.locator('button:has-text("Create or Import Seed Phrase")');
    await createImportButton.waitFor({ timeout: 10000 });
    await createImportButton.click();

    // Wait for options modal
    await optionsPage.waitForTimeout(2000);

    // Click "Restore Wallet" option (it's a DIV, not a button!)
    const restoreOption = optionsPage.locator('text="Restore Wallet"').first();
    await restoreOption.waitFor({ timeout: 10000 });
    await restoreOption.click();
    await optionsPage.waitForTimeout(2000);

    // Enter invalid mnemonic
    const mnemonicInput = optionsPage.locator('textarea:visible, input[placeholder*="phrase" i]:visible').first();
    await mnemonicInput.fill('invalid mnemonic phrase with wrong words');

    // Enter password
    const passwordInputs = optionsPage.locator('input[type="password"]:visible');
    await passwordInputs.nth(0).fill(TEST_WALLET_PASSWORD);
    await passwordInputs.nth(1).fill(TEST_WALLET_PASSWORD);

    // Try to submit
    const submitButton = optionsPage.locator('button:has-text("Create"), button:has-text("Import"), button[type="submit"]:visible').last();
    await submitButton.click();

    // Verify error message appears
    const errorMessage = optionsPage.locator('.error, .error-message, [role="alert"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    console.log('✅ Invalid mnemonic rejected as expected');
  });

  test('should enforce password requirements', async ({ optionsPage }) => {
    setupConsoleCapture(optionsPage);

    // Select preprod network
    const networkSelector = optionsPage.locator('button:has-text("Cardano Mainnet")');
    await networkSelector.click();
    await optionsPage.waitForTimeout(1000);
    const preprodOption = optionsPage.locator('.v-list-item:has-text("preprod"), .v-list-item:has-text("Preprod")').first();
    if (await preprodOption.isVisible({ timeout: 2000 })) {
      await preprodOption.click();
      await optionsPage.waitForTimeout(1000);
    }

    // Click the initial "Create or Import Seed Phrase" button
    const createImportButton = optionsPage.locator('button:has-text("Create or Import Seed Phrase")');
    await createImportButton.waitFor({ timeout: 10000 });
    await createImportButton.click();

    // Wait for options modal
    await optionsPage.waitForTimeout(2000);

    // Click "Restore Wallet" option (it's a DIV, not a button!)
    const restoreOption = optionsPage.locator('text="Restore Wallet"').first();
    await restoreOption.waitFor({ timeout: 10000 });
    await restoreOption.click();
    await optionsPage.waitForTimeout(2000);

    // Enter valid mnemonic
    const testMnemonic = generateMnemonic();
    const mnemonicInput = optionsPage.locator('textarea:visible, input[placeholder*="phrase" i]:visible').first();
    await mnemonicInput.fill(testMnemonic);

    // Enter weak password
    const passwordInputs = optionsPage.locator('input[type="password"]:visible');
    await passwordInputs.nth(0).fill('weak');
    await passwordInputs.nth(1).fill('weak');

    // Try to submit
    const submitButton = optionsPage.locator('button:has-text("Create"), button:has-text("Import"), button[type="submit"]:visible').last();

    // Button should be disabled or error should appear
    const isDisabled = await submitButton.isDisabled();
    if (!isDisabled) {
      await submitButton.click();
      const errorMessage = optionsPage.locator('.error, .error-message, [role="alert"]').first();
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    }

    console.log('✅ Password requirements enforced');
  });

  test('should require matching passwords', async ({ optionsPage }) => {
    setupConsoleCapture(optionsPage);

    // Select preprod network
    const networkSelector = optionsPage.locator('button:has-text("Cardano Mainnet")');
    await networkSelector.click();
    await optionsPage.waitForTimeout(1000);
    const preprodOption = optionsPage.locator('.v-list-item:has-text("preprod"), .v-list-item:has-text("Preprod")').first();
    if (await preprodOption.isVisible({ timeout: 2000 })) {
      await preprodOption.click();
      await optionsPage.waitForTimeout(1000);
    }

    // Click the initial "Create or Import Seed Phrase" button
    const createImportButton = optionsPage.locator('button:has-text("Create or Import Seed Phrase")');
    await createImportButton.waitFor({ timeout: 10000 });
    await createImportButton.click();

    // Wait for options modal
    await optionsPage.waitForTimeout(2000);

    // Click "Restore Wallet" option (it's a DIV, not a button!)
    const restoreOption = optionsPage.locator('text="Restore Wallet"').first();
    await restoreOption.waitFor({ timeout: 10000 });
    await restoreOption.click();
    await optionsPage.waitForTimeout(2000);

    // Enter valid mnemonic
    const testMnemonic = generateMnemonic();
    const mnemonicInput = optionsPage.locator('textarea:visible, input[placeholder*="phrase" i]:visible').first();
    await mnemonicInput.fill(testMnemonic);

    // Enter mismatched passwords
    const passwordInputs = optionsPage.locator('input[type="password"]:visible');
    await passwordInputs.nth(0).fill(TEST_WALLET_PASSWORD);
    await passwordInputs.nth(1).fill('DifferentPassword123!');

    // Try to submit
    const submitButton = optionsPage.locator('button:has-text("Create"), button:has-text("Import"), button[type="submit"]:visible').last();
    await submitButton.click();

    // Verify error message
    const errorMessage = optionsPage.locator('.error, .error-message, [role="alert"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    console.log('✅ Password mismatch detected');
  });
});