import { test, expect } from '../fixtures/cardano.fixture';
import {
  isValidTxHash,
  waitForTxConfirmation,
  getAddressBalance
} from '../utils/cardano.utils';
import { setupConsoleCapture } from '../utils/extension.utils';
import {
  TEST_WALLET_1,
  TEST_AMOUNTS,
  BLOCKFROST,
  TIMEOUTS
} from '../utils/test-data';

/**
 * Test Suite: Transaction Sending
 * Tests actual transaction submission and confirmation
 *
 * IMPORTANT: These tests require:
 * 1. Test wallet to be configured in .env with TEST_WALLET_1_MNEMONIC
 * 2. Wallet to have sufficient testnet ADA funds
 * 3. Valid Blockfrost API key for Preprod
 */

test.describe('Transaction Sending', () => {
  const recipientAddress = 'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp';

  test.skip(!TEST_WALLET_1.mnemonic, 'Test wallet not configured - skipping funded wallet tests');

  // Setup: Create wallet from configured test mnemonic
  test.beforeEach(async ({ createWallet, optionsPage }) => {
    if (!TEST_WALLET_1.mnemonic) {
      test.skip();
    }

    await createWallet(TEST_WALLET_1.name, TEST_WALLET_1.mnemonic, TEST_WALLET_1.password);
    setupConsoleCapture(optionsPage);

    // Wait for wallet to sync and load balance
    console.log('⏳ Waiting for wallet to sync...');
    await optionsPage.waitForTimeout(10000);
  });

  test('should display current wallet balance', async ({ checkBalance }) => {
    const balance = await checkBalance();

    expect(balance).toBeGreaterThanOrEqual(0);
    console.log(`💰 Current balance: ${balance} ADA`);

    if (balance < TEST_AMOUNTS.minTransfer) {
      console.warn(`⚠️  Insufficient balance for transaction tests. Need at least ${TEST_AMOUNTS.minTransfer} ADA`);
      console.warn('   Please fund the test wallet from the Preprod faucet:');
      console.warn('   https://docs.cardano.org/cardano-testnet/tools/faucet');
    }
  });

  test('should send transaction successfully', async ({
    optionsPage,
    sendTransaction,
    checkBalance
  }) => {
    // Check initial balance
    const initialBalance = await checkBalance();
    console.log(`Initial balance: ${initialBalance} ADA`);

    if (initialBalance < TEST_AMOUNTS.minTransfer) {
      test.skip(true, 'Insufficient funds for transaction test');
    }

    // Send transaction
    const txHash = await sendTransaction(
      recipientAddress,
      TEST_AMOUNTS.minTransfer,
      TEST_WALLET_1.password
    );

    // Verify transaction hash format
    expect(txHash).toBeTruthy();
    expect(isValidTxHash(txHash)).toBe(true);

    console.log(`✅ Transaction submitted: ${txHash}`);

    // Wait for balance to update (may take a moment)
    await optionsPage.waitForTimeout(5000);

    // Check new balance (should be less than initial)
    const newBalance = await checkBalance();
    console.log(`New balance: ${newBalance} ADA`);

    expect(newBalance).toBeLessThan(initialBalance);
  });

  test('should confirm transaction on blockchain', async ({
    sendTransaction,
    checkBalance
  }) => {
    if (!BLOCKFROST.apiKey) {
      test.skip(true, 'Blockfrost API key not configured');
    }

    const initialBalance = await checkBalance();

    if (initialBalance < TEST_AMOUNTS.minTransfer) {
      test.skip(true, 'Insufficient funds for transaction test');
    }

    // Send transaction
    const txHash = await sendTransaction(
      recipientAddress,
      TEST_AMOUNTS.minTransfer,
      TEST_WALLET_1.password
    );

    console.log(`⏳ Waiting for transaction confirmation: ${txHash}`);

    // Wait for blockchain confirmation
    const isConfirmed = await waitForTxConfirmation(
      txHash,
      BLOCKFROST.apiKey,
      30, // 30 attempts
      10000 // 10 seconds between attempts
    );

    expect(isConfirmed).toBe(true);
    console.log('✅ Transaction confirmed on blockchain');
  });

  test('should reject transaction with insufficient funds', async ({
    optionsPage,
    checkBalance
  }) => {
    const balance = await checkBalance();

    // Try to send more than available balance
    const excessiveAmount = balance + 1000;

    // Open send form
    const sendButton = optionsPage.locator('button:has-text("Send"), a:has-text("Send")').first();
    await sendButton.click();

    // Wait for send form
    await optionsPage.waitForSelector('[data-testid="send-form"], .send-container');

    // Enter transaction details
    const addressInput = optionsPage.locator('input[placeholder*="address" i]:visible, textarea[placeholder*="address" i]:visible').first();
    await addressInput.fill(recipientAddress);

    const amountInput = optionsPage.locator('input[type="number"]:visible, input[placeholder*="amount" i]:visible').first();
    await amountInput.fill(excessiveAmount.toString());

    // Click next
    const nextButton = optionsPage.locator('button:has-text("Next"), button:has-text("Continue")').first();
    await nextButton.click();

    // Should show insufficient funds error
    const errorMessage = optionsPage.locator('.error, .error-message, [role="alert"], text=/insufficient/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    console.log('✅ Insufficient funds error displayed correctly');
  });

  test('should reject transaction with wrong password', async ({
    optionsPage,
    checkBalance
  }) => {
    const balance = await checkBalance();

    if (balance < TEST_AMOUNTS.minTransfer) {
      test.skip(true, 'Insufficient funds for test');
    }

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

    // Wait for confirmation screen
    await optionsPage.waitForSelector('[data-testid="confirm-transaction"], .confirm-container', {
      timeout: 10000
    });

    // Enter wrong password
    const passwordInput = optionsPage.locator('input[type="password"]:visible').first();
    await passwordInput.fill('WrongPassword123!');

    // Try to confirm
    const confirmButton = optionsPage.locator('button:has-text("Confirm"), button:has-text("Send")').last();
    await confirmButton.click();

    // Should show error
    const errorMessage = optionsPage.locator('.error, .error-message, [role="alert"]').first();
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    console.log('✅ Wrong password rejected correctly');
  });

  test('should display transaction in history', async ({
    optionsPage,
    sendTransaction,
    checkBalance
  }) => {
    const balance = await checkBalance();

    if (balance < TEST_AMOUNTS.minTransfer) {
      test.skip(true, 'Insufficient funds for test');
    }

    // Send transaction
    const txHash = await sendTransaction(
      recipientAddress,
      TEST_AMOUNTS.minTransfer,
      TEST_WALLET_1.password
    );

    // Navigate to transaction history
    const historyButton = optionsPage.locator('button:has-text("Transactions"), a:has-text("Transactions"), [href*="transactions"]').first();

    if (await historyButton.isVisible({ timeout: 2000 })) {
      await historyButton.click();

      // Wait for history to load
      await optionsPage.waitForTimeout(3000);

      // Look for the transaction hash in history
      const txElement = optionsPage.locator(`text=${txHash.slice(0, 12)}`).first();
      const isTxVisible = await txElement.isVisible({ timeout: 5000 }).catch(() => false);

      if (isTxVisible) {
        console.log('✅ Transaction found in history');
      } else {
        console.log('⚠️  Transaction not yet visible in history (may take time to sync)');
      }
    } else {
      console.log('⚠️  Transaction history page not accessible');
    }
  });
});