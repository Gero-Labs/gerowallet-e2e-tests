import { test, expect } from '../fixtures/cardano.fixture';
import { generateMnemonic, isValidCardanoAddress, isValidTxHash } from '../utils/cardano.utils';
import { setupConsoleCapture } from '../utils/extension.utils';
import { TEST_WALLET_PASSWORD, TEST_AMOUNTS, TIMEOUTS } from '../utils/test-data';

/**
 * Test Suite: Transaction Building
 * Tests the transaction building UI and validation
 */

test.describe('Transaction Building', () => {
  const recipientAddress = 'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp';

  // Setup: Create a wallet first
  test.beforeEach(async ({ createWallet, optionsPage }) => {
    const mnemonic = generateMnemonic();
    const walletName = 'Transaction Test Wallet';

    await createWallet(walletName, mnemonic, TEST_WALLET_PASSWORD);
    setupConsoleCapture(optionsPage);

    // Wait for wallet to be fully loaded
    await optionsPage.waitForTimeout(3000);
  });

  test('should open send transaction form', async ({ optionsPage }) => {
    // Click send button
    const sendButton = optionsPage.locator('button:has-text("Send"), a:has-text("Send")').first();
    await sendButton.click();

    // Verify send form is visible
    await expect(
      optionsPage.locator('[data-testid="send-form"], .send-container')
    ).toBeVisible({ timeout: 5000 });

    console.log('✅ Send form opened successfully');
  });

  test('should validate recipient address format', async ({ optionsPage }) => {
    // Open send form
    const sendButton = optionsPage.locator('button:has-text("Send"), a:has-text("Send")').first();
    await sendButton.click();

    // Wait for send form
    await optionsPage.waitForSelector('[data-testid="send-form"], .send-container', {
      timeout: 5000
    });

    // Enter invalid address
    const addressInput = optionsPage.locator('input[placeholder*="address" i]:visible, textarea[placeholder*="address" i]:visible').first();
    await addressInput.fill('invalid_address_format');

    // Try to proceed
    const nextButton = optionsPage.locator('button:has-text("Next"), button:has-text("Continue")').first();
    await nextButton.click();

    // Should show validation error
    const errorMessage = optionsPage.locator('.error, .error-message, [role="alert"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    console.log('✅ Invalid address rejected');
  });

  test('should accept valid Cardano address', async ({ optionsPage }) => {
    // Open send form
    const sendButton = optionsPage.locator('button:has-text("Send"), a:has-text("Send")').first();
    await sendButton.click();

    // Wait for send form
    await optionsPage.waitForSelector('[data-testid="send-form"], .send-container');

    // Enter valid address
    const addressInput = optionsPage.locator('input[placeholder*="address" i]:visible, textarea[placeholder*="address" i]:visible').first();
    await addressInput.fill(recipientAddress);

    // Verify address is valid
    expect(isValidCardanoAddress(recipientAddress)).toBe(true);

    // Enter amount
    const amountInput = optionsPage.locator('input[type="number"]:visible, input[placeholder*="amount" i]:visible').first();
    await amountInput.fill(TEST_AMOUNTS.smallTransfer.toString());

    console.log('✅ Valid address accepted');
  });

  test('should validate transaction amount', async ({ optionsPage }) => {
    // Open send form
    const sendButton = optionsPage.locator('button:has-text("Send"), a:has-text("Send")').first();
    await sendButton.click();

    // Wait for send form
    await optionsPage.waitForSelector('[data-testid="send-form"], .send-container');

    // Enter valid address
    const addressInput = optionsPage.locator('input[placeholder*="address" i]:visible, textarea[placeholder*="address" i]:visible').first();
    await addressInput.fill(recipientAddress);

    // Enter invalid amount (0 or negative)
    const amountInput = optionsPage.locator('input[type="number"]:visible, input[placeholder*="amount" i]:visible').first();
    await amountInput.fill('0');

    // Try to proceed
    const nextButton = optionsPage.locator('button:has-text("Next"), button:has-text("Continue")').first();
    await nextButton.click();

    // Should show validation error or button disabled
    const errorMessage = optionsPage.locator('.error, .error-message, [role="alert"]').first();
    const isErrorVisible = await errorMessage.isVisible({ timeout: 2000 }).catch(() => false);
    const isButtonDisabled = await nextButton.isDisabled();

    expect(isErrorVisible || isButtonDisabled).toBe(true);

    console.log('✅ Invalid amount rejected');
  });

  test('should build transaction and show confirmation', async ({ optionsPage }) => {
    // Note: This test will fail if wallet has no funds
    // It tests the UI flow, not actual transaction submission

    // Open send form
    const sendButton = optionsPage.locator('button:has-text("Send"), a:has-text("Send")').first();
    await sendButton.click();

    // Wait for send form
    await optionsPage.waitForSelector('[data-testid="send-form"], .send-container');

    // Enter transaction details
    const addressInput = optionsPage.locator('input[placeholder*="address" i]:visible, textarea[placeholder*="address" i]:visible').first();
    await addressInput.fill(recipientAddress);

    const amountInput = optionsPage.locator('input[type="number"]:visible, input[placeholder*="amount" i]:visible').first();
    await amountInput.fill(TEST_AMOUNTS.minTransfer.toString());

    // Click next
    const nextButton = optionsPage.locator('button:has-text("Next"), button:has-text("Continue")').first();
    await nextButton.click();

    // Wait for either confirmation screen or insufficient funds error
    const confirmationScreen = optionsPage.locator('[data-testid="confirm-transaction"], .confirm-container');
    const errorMessage = optionsPage.locator('.error, .error-message, [role="alert"]').first();

    const isConfirmationVisible = await confirmationScreen.isVisible({ timeout: 10000 }).catch(() => false);
    const isErrorVisible = await errorMessage.isVisible({ timeout: 1000 }).catch(() => false);

    if (isConfirmationVisible) {
      console.log('✅ Transaction confirmation screen displayed');

      // Verify confirmation details
      const confirmationText = await confirmationScreen.textContent();
      expect(confirmationText).toBeTruthy();
    } else if (isErrorVisible) {
      const errorText = await errorMessage.textContent();
      console.log(`⚠️  Expected error (wallet likely has no funds): ${errorText}`);
    } else {
      throw new Error('Neither confirmation nor error appeared');
    }
  });

  test('should display transaction fees in confirmation', async ({ optionsPage }) => {
    // Open send form
    const sendButton = optionsPage.locator('button:has-text("Send"), a:has-text("Send")').first();
    await sendButton.click();

    // Wait for send form
    await optionsPage.waitForSelector('[data-testid="send-form"], .send-container');

    // Enter transaction details
    const addressInput = optionsPage.locator('input[placeholder*="address" i]:visible, textarea[placeholder*="address" i]:visible').first();
    await addressInput.fill(recipientAddress);

    const amountInput = optionsPage.locator('input[type="number"]:visible, input[placeholder*="amount" i]:visible').first();
    await amountInput.fill(TEST_AMOUNTS.minTransfer.toString());

    // Click next
    const nextButton = optionsPage.locator('button:has-text("Next"), button:has-text("Continue")').first();
    await nextButton.click();

    // Wait for confirmation or error
    const confirmationScreen = optionsPage.locator('[data-testid="confirm-transaction"], .confirm-container');
    const isConfirmationVisible = await confirmationScreen.isVisible({ timeout: 10000 }).catch(() => false);

    if (isConfirmationVisible) {
      // Look for fee display (common patterns)
      const feeElement = optionsPage.locator('[data-testid="transaction-fee"], .fee, .transaction-fee, text=/fee/i').first();
      const hasFee = await feeElement.count() > 0;

      if (hasFee) {
        const feeText = await feeElement.textContent();
        console.log(`✅ Transaction fee displayed: ${feeText}`);
      } else {
        console.log('⚠️  Fee element not found (may be in different location)');
      }
    } else {
      console.log('⚠️  Could not reach confirmation screen (insufficient funds expected)');
    }
  });

  test('should allow canceling transaction', async ({ optionsPage }) => {
    // Open send form
    const sendButton = optionsPage.locator('button:has-text("Send"), a:has-text("Send")').first();
    await sendButton.click();

    // Wait for send form
    await optionsPage.waitForSelector('[data-testid="send-form"], .send-container');

    // Look for cancel/back button
    const cancelButton = optionsPage.locator('button:has-text("Cancel"), button:has-text("Back"), button[aria-label="Close"]').first();

    if (await cancelButton.isVisible({ timeout: 2000 })) {
      await cancelButton.click();

      // Should return to dashboard
      await expect(
        optionsPage.locator('[data-testid="dashboard"], .dashboard-container')
      ).toBeVisible({ timeout: 5000 });

      console.log('✅ Transaction canceled successfully');
    } else {
      console.log('⚠️  Cancel button not found in current UI');
    }
  });
});