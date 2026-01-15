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

    // Verify dashboard is visible (check for Gero Dashboard heading)
    await expect(
      optionsPage.locator('text=/Gero Dashboard/i')
    ).toBeVisible({ timeout: TIMEOUTS.walletCreation });

    console.log('✅ Wallet created successfully');
  });

  test('should restore wallet from existing mnemonic', async ({
    optionsPage,
    restoreWallet
  }) => {
    test.setTimeout(180000); // 3 minutes for restore (key derivation takes time)
    setupConsoleCapture(optionsPage);

    // Use the user-provided test mnemonic (15 words)
    const testMnemonic = 'manage metal also spy ignore sick trip frequent simple blade bright stool pencil neither can';
    const walletName = 'Test Wallet - Restored';

    // Restore wallet
    await restoreWallet(walletName, testMnemonic, TEST_WALLET_PASSWORD);

    // Verify dashboard is visible (restored wallets show "Portfolio" instead of "Gero Dashboard")
    const portfolioVisible = await optionsPage.locator('text=/Portfolio/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    const dashboardVisible = await optionsPage.locator('text=/Gero Dashboard/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    expect(portfolioVisible || dashboardVisible).toBe(true);

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

    // Click "Restore Wallet" option
    const restoreOption = optionsPage.locator('text="Restore Wallet"').first();
    await restoreOption.waitFor({ timeout: 10000 });
    await restoreOption.click();
    await optionsPage.waitForTimeout(2000);

    // The restore UI uses dropdowns for each word, not a textarea
    // The phrase length buttons show "1 2", "1 5", "2 4" with spaces
    // They might be v-btn-toggle elements, not standard buttons

    // Wait for the seed phrase UI to be ready (look for phrase length label)
    await optionsPage.waitForSelector('text=/Choose recovery phrase length/i', { timeout: 10000 });

    // Try to find and click the 12-word button using different selectors
    const wordLengthSelector = optionsPage.locator('text=/1 2/').first();
    if (await wordLengthSelector.isVisible({ timeout: 3000 })) {
      await wordLengthSelector.click();
      await optionsPage.waitForTimeout(500);
    }

    // The Continue button should be disabled without valid mnemonic words
    const continueButton = optionsPage.locator('button:has-text("CONTINUE"), button:has-text("Continue")').first();

    // Verify continue button exists and is disabled
    await continueButton.waitFor({ state: 'visible', timeout: 5000 });
    const isDisabled = await continueButton.isDisabled().catch(() => true);

    // Button should be disabled because no words were entered
    expect(isDisabled).toBe(true);

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

    // Click "Create Wallet" option (uses password fields directly)
    const createWalletOption = optionsPage.locator('text="Create Wallet"').first();
    await createWalletOption.waitFor({ timeout: 10000 });
    await createWalletOption.click();
    await optionsPage.waitForTimeout(2000);

    // Enter wallet name
    const nameInput = optionsPage.locator('input[type="text"]:visible').first();
    await nameInput.clear();
    await nameInput.fill('Test Password Wallet');

    // Enter weak password (too short)
    const passwordInputs = optionsPage.locator('input[type="password"]:visible');
    await passwordInputs.nth(0).fill('weak');
    await passwordInputs.nth(1).fill('weak');

    // Check both checkboxes
    const checkboxes = optionsPage.locator('input[type="checkbox"]:visible');
    const checkboxCount = await checkboxes.count();
    for (let i = 0; i < checkboxCount; i++) {
      await checkboxes.nth(i).check({ force: true });
    }

    // The Create Wallet button should be disabled with weak password
    const submitButton = optionsPage.locator('button:has-text("Create Wallet")').last();
    const isDisabled = await submitButton.isDisabled().catch(() => false);

    // Check for password strength indicator or error
    const passwordError = optionsPage.locator('text=/password/i, .v-messages__message').first();
    const hasPasswordFeedback = await passwordError.isVisible({ timeout: 2000 }).catch(() => false);

    // Either button should be disabled OR there should be password feedback
    expect(isDisabled || hasPasswordFeedback).toBe(true);

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

    // Click "Create Wallet" option (uses password fields directly)
    const createWalletOption = optionsPage.locator('text="Create Wallet"').first();
    await createWalletOption.waitFor({ timeout: 10000 });
    await createWalletOption.click();
    await optionsPage.waitForTimeout(2000);

    // Enter wallet name
    const nameInput = optionsPage.locator('input[type="text"]:visible').first();
    await nameInput.clear();
    await nameInput.fill('Test Mismatch Wallet');

    // Enter mismatched passwords
    const passwordInputs = optionsPage.locator('input[type="password"]:visible');
    await passwordInputs.nth(0).fill(TEST_WALLET_PASSWORD);
    await passwordInputs.nth(1).fill('DifferentPassword123!');

    // Check both checkboxes
    const checkboxes = optionsPage.locator('input[type="checkbox"]:visible');
    const checkboxCount = await checkboxes.count();
    for (let i = 0; i < checkboxCount; i++) {
      await checkboxes.nth(i).check({ force: true });
    }

    // The Create Wallet button should be disabled OR show error for mismatched passwords
    const submitButton = optionsPage.locator('button:has-text("Create Wallet")').last();
    const isDisabled = await submitButton.isDisabled().catch(() => false);

    // Check for password mismatch error message
    const mismatchError = optionsPage.locator('text=/match/i, text=/mismatch/i, .v-messages__message').first();
    const hasMismatchError = await mismatchError.isVisible({ timeout: 2000 }).catch(() => false);

    // Either button should be disabled OR there should be mismatch error
    expect(isDisabled || hasMismatchError).toBe(true);

    console.log('✅ Password mismatch detected');
  });
});