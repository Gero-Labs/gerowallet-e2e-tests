import { test, expect } from '../fixtures/wallet.fixture';
import { generateMnemonic } from '../utils/cardano.utils';
import { setupConsoleCapture } from '../utils/extension.utils';
import { TEST_WALLET_PASSWORD, TIMEOUTS } from '../utils/test-data';

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

    // Verify dashboard is visible
    await expect(
      optionsPage.locator('[data-testid="dashboard"], .dashboard-container')
    ).toBeVisible({ timeout: TIMEOUTS.walletCreation });

    console.log('✅ Wallet created successfully');
  });

  test('should create wallet from existing mnemonic', async ({
    optionsPage,
    createWallet
  }) => {
    setupConsoleCapture(optionsPage);

    // Use a known test mnemonic (24 words)
    const testMnemonic = 'test walk nut penalty hip pave soap entry language right filter choice test walk nut penalty hip pave soap entry language right filter choice';
    const walletName = 'Test Wallet - From Mnemonic';

    // Create wallet
    await createWallet(walletName, testMnemonic, TEST_WALLET_PASSWORD);

    // Verify dashboard is visible
    await expect(
      optionsPage.locator('[data-testid="dashboard"], .dashboard-container')
    ).toBeVisible({ timeout: TIMEOUTS.walletCreation });

    console.log('✅ Wallet imported successfully');
  });

  test('should reject invalid mnemonic phrase', async ({ optionsPage }) => {
    setupConsoleCapture(optionsPage);

    // Wait for welcome screen
    await optionsPage.waitForSelector('[data-testid="welcome-screen"], .welcome-container', {
      timeout: 10000
    });

    // Click import wallet
    const importButton = optionsPage.locator('button:has-text("Import Wallet"), button:has-text("Restore Wallet")');
    await importButton.click();

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

    // Wait for welcome screen
    await optionsPage.waitForSelector('[data-testid="welcome-screen"], .welcome-container');

    // Click import wallet
    const importButton = optionsPage.locator('button:has-text("Import Wallet"), button:has-text("Restore Wallet")');
    await importButton.click();

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

    // Wait for welcome screen
    await optionsPage.waitForSelector('[data-testid="welcome-screen"], .welcome-container');

    // Click import wallet
    const importButton = optionsPage.locator('button:has-text("Import Wallet"), button:has-text("Restore Wallet")');
    await importButton.click();

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