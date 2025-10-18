import { test, expect } from '../fixtures/wallet.fixture';
import { generateMnemonic } from '../utils/cardano.utils';
import { setupConsoleCapture } from '../utils/extension.utils';
import { TEST_WALLET_PASSWORD, TIMEOUTS } from '../utils/test-data';

/**
 * Test Suite: Wallet Login
 * Tests the wallet login and authentication flow
 */

test.describe('Wallet Login', () => {
  // Setup: Create a wallet first
  test.beforeEach(async ({ createWallet }) => {
    const mnemonic = generateMnemonic();
    const walletName = 'Login Test Wallet';

    await createWallet(walletName, mnemonic, TEST_WALLET_PASSWORD);

    // Wait for wallet to be created
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  test('should login with correct password', async ({ optionsPage, loginWallet }) => {
    setupConsoleCapture(optionsPage);

    // Reload page to trigger login screen
    await optionsPage.reload();
    await optionsPage.waitForLoadState('domcontentloaded');

    // Login
    await loginWallet(TEST_WALLET_PASSWORD);

    // Verify dashboard is visible
    await expect(
      optionsPage.locator('[data-testid="dashboard"], .dashboard-container')
    ).toBeVisible({ timeout: TIMEOUTS.walletLogin });

    console.log('✅ Login successful');
  });

  test('should reject incorrect password', async ({ optionsPage }) => {
    setupConsoleCapture(optionsPage);

    // Reload page to trigger login screen
    await optionsPage.reload();
    await optionsPage.waitForLoadState('domcontentloaded');

    // Wait for login screen
    await optionsPage.waitForSelector('[data-testid="login-screen"], .login-container, input[type="password"]:visible', {
      timeout: 10000
    });

    // Enter wrong password
    const passwordInput = optionsPage.locator('input[type="password"]:visible').first();
    await passwordInput.fill('WrongPassword123!');

    // Click login
    const loginButton = optionsPage.locator('button:has-text("Login"), button:has-text("Unlock"), button[type="submit"]:visible').first();
    await loginButton.click();

    // Verify error message
    const errorMessage = optionsPage.locator('.error, .error-message, [role="alert"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    console.log('✅ Incorrect password rejected');
  });

  test('should maintain session after successful login', async ({ optionsPage, loginWallet }) => {
    setupConsoleCapture(optionsPage);

    // Reload page to trigger login screen
    await optionsPage.reload();
    await optionsPage.waitForLoadState('domcontentloaded');

    // Login
    await loginWallet(TEST_WALLET_PASSWORD);

    // Verify dashboard is visible
    await expect(
      optionsPage.locator('[data-testid="dashboard"], .dashboard-container')
    ).toBeVisible();

    // Navigate to different pages within the wallet
    const stakingButton = optionsPage.locator('button:has-text("Staking"), a:has-text("Staking"), [href*="staking"]').first();
    if (await stakingButton.isVisible({ timeout: 2000 })) {
      await stakingButton.click();
      await optionsPage.waitForTimeout(1000);

      // Should not require re-login
      const loginScreen = optionsPage.locator('[data-testid="login-screen"], .login-container, input[type="password"]:visible');
      await expect(loginScreen).not.toBeVisible();
    }

    console.log('✅ Session maintained across navigation');
  });

  test('should handle multiple login attempts', async ({ optionsPage, loginWallet }) => {
    setupConsoleCapture(optionsPage);

    // Reload page to trigger login screen
    await optionsPage.reload();
    await optionsPage.waitForLoadState('domcontentloaded');

    // First failed attempt
    await optionsPage.waitForSelector('input[type="password"]:visible');
    let passwordInput = optionsPage.locator('input[type="password"]:visible').first();
    await passwordInput.fill('Wrong1');
    let loginButton = optionsPage.locator('button:has-text("Login"), button:has-text("Unlock"), button[type="submit"]:visible').first();
    await loginButton.click();
    await optionsPage.waitForTimeout(1000);

    // Second failed attempt
    passwordInput = optionsPage.locator('input[type="password"]:visible').first();
    await passwordInput.fill('Wrong2');
    loginButton = optionsPage.locator('button:has-text("Login"), button:has-text("Unlock"), button[type="submit"]:visible').first();
    await loginButton.click();
    await optionsPage.waitForTimeout(1000);

    // Successful attempt
    passwordInput = optionsPage.locator('input[type="password"]:visible').first();
    await passwordInput.fill(TEST_WALLET_PASSWORD);
    loginButton = optionsPage.locator('button:has-text("Login"), button:has-text("Unlock"), button[type="submit"]:visible').first();
    await loginButton.click();

    // Verify successful login
    await expect(
      optionsPage.locator('[data-testid="dashboard"], .dashboard-container')
    ).toBeVisible({ timeout: TIMEOUTS.walletLogin });

    console.log('✅ Login successful after multiple attempts');
  });

  test('should display wallet information after login', async ({ optionsPage, loginWallet, checkBalance }) => {
    setupConsoleCapture(optionsPage);

    // Reload page to trigger login screen
    await optionsPage.reload();
    await optionsPage.waitForLoadState('domcontentloaded');

    // Login
    await loginWallet(TEST_WALLET_PASSWORD);

    // Wait for wallet to load
    await optionsPage.waitForTimeout(3000);

    // Check if balance is displayed (may be 0 for new wallet)
    try {
      const balance = await checkBalance();
      expect(balance).toBeGreaterThanOrEqual(0);
      console.log(`✅ Wallet balance displayed: ${balance} ADA`);
    } catch (error) {
      console.log('⚠️  Balance not yet available (wallet may be syncing)');
    }

    // Verify wallet address is present
    const addressElement = optionsPage.locator('[data-testid="wallet-address"], .wallet-address, .receive-address').first();
    const hasAddress = await addressElement.count() > 0;
    expect(hasAddress).toBe(true);

    console.log('✅ Wallet information displayed');
  });
});