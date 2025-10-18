import { test as base, type Page } from '@playwright/test';
import { test as walletTest } from './wallet.fixture';
import type { WalletFixtures } from './wallet.fixture';

export type CardanoFixtures = WalletFixtures & {
  sendTransaction: (toAddress: string, amountADA: number, password: string) => Promise<string>;
  checkBalance: () => Promise<number>;
  delegateStake: (poolId: string, password: string) => Promise<string>;
  withdrawRewards: (password: string) => Promise<string>;
};

/**
 * Cardano-specific fixture extending wallet fixture
 * Provides Cardano transaction and staking operations
 */
export const test = walletTest.extend<CardanoFixtures>({
  /**
   * Send ADA transaction
   * @returns Transaction hash
   */
  sendTransaction: async ({ optionsPage }, use) => {
    const sendTxFn = async (toAddress: string, amountADA: number, password: string): Promise<string> => {
      console.log(`Sending ${amountADA} ADA to ${toAddress.slice(0, 20)}...`);

      // Navigate to send page or click send button
      const sendButton = optionsPage.locator('button:has-text("Send"), a:has-text("Send")').first();
      await sendButton.click();

      // Wait for send form
      await optionsPage.waitForSelector('[data-testid="send-form"], .send-container', {
        timeout: 5000
      });

      // Enter recipient address
      const addressInput = optionsPage.locator('input[placeholder*="address" i]:visible, textarea[placeholder*="address" i]:visible').first();
      await addressInput.fill(toAddress);

      // Enter amount
      const amountInput = optionsPage.locator('input[type="number"]:visible, input[placeholder*="amount" i]:visible').first();
      await amountInput.fill(amountADA.toString());

      // Click next/continue
      const nextButton = optionsPage.locator('button:has-text("Next"), button:has-text("Continue")').first();
      await nextButton.click();

      // Wait for confirmation screen
      await optionsPage.waitForSelector('[data-testid="confirm-transaction"], .confirm-container', {
        timeout: 5000
      });

      // Enter password in confirmation modal
      const passwordInput = optionsPage.locator('input[type="password"]:visible').first();
      await passwordInput.fill(password);

      // Confirm transaction
      const confirmButton = optionsPage.locator('button:has-text("Confirm"), button:has-text("Send")').last();
      await confirmButton.click();

      // Wait for success message and extract transaction hash
      await optionsPage.waitForSelector('[data-testid="transaction-success"], .success-message, .tx-hash', {
        timeout: 30000
      });

      // Extract transaction hash from success message
      const txHashElement = optionsPage.locator('[data-testid="tx-hash"], .tx-hash, code:visible').first();
      const txHash = await txHashElement.textContent() || '';

      console.log(`✓ Transaction sent: ${txHash}`);

      return txHash.trim();
    };

    await use(sendTxFn);
  },

  /**
   * Check wallet balance
   * @returns Balance in ADA
   */
  checkBalance: async ({ optionsPage }, use) => {
    const checkBalanceFn = async (): Promise<number> => {
      // Look for balance display on dashboard
      const balanceElement = optionsPage.locator('[data-testid="wallet-balance"], .balance, .total-balance').first();

      await balanceElement.waitFor({ state: 'visible', timeout: 10000 });

      const balanceText = await balanceElement.textContent() || '0';

      // Extract numeric value (remove currency symbols, commas, etc.)
      const balanceMatch = balanceText.match(/[\d,]+\.?\d*/);
      const balance = balanceMatch ? parseFloat(balanceMatch[0].replace(/,/g, '')) : 0;

      console.log(`Wallet balance: ${balance} ADA`);

      return balance;
    };

    await use(checkBalanceFn);
  },

  /**
   * Delegate stake to a pool
   * @returns Transaction hash
   */
  delegateStake: async ({ optionsPage }, use) => {
    const delegateFn = async (poolId: string, password: string): Promise<string> => {
      console.log(`Delegating to pool: ${poolId.slice(0, 20)}...`);

      // Navigate to staking page
      const stakingButton = optionsPage.locator('button:has-text("Staking"), a:has-text("Staking"), [href*="staking"]').first();
      await stakingButton.click();

      // Wait for staking page
      await optionsPage.waitForSelector('[data-testid="staking-page"], .staking-container', {
        timeout: 5000
      });

      // Search for pool or enter pool ID
      const searchInput = optionsPage.locator('input[placeholder*="pool" i]:visible, input[placeholder*="search" i]:visible').first();
      await searchInput.fill(poolId);

      // Select the pool
      const selectPoolButton = optionsPage.locator(`button:has-text("Delegate"), button:has-text("Select")`).first();
      await selectPoolButton.click();

      // Confirm delegation
      await optionsPage.waitForSelector('[data-testid="confirm-delegation"], .confirm-container', {
        timeout: 5000
      });

      // Enter password
      const passwordInput = optionsPage.locator('input[type="password"]:visible').first();
      await passwordInput.fill(password);

      // Confirm
      const confirmButton = optionsPage.locator('button:has-text("Confirm"), button:has-text("Delegate")').last();
      await confirmButton.click();

      // Wait for success
      await optionsPage.waitForSelector('[data-testid="delegation-success"], .success-message', {
        timeout: 30000
      });

      // Extract transaction hash
      const txHashElement = optionsPage.locator('[data-testid="tx-hash"], .tx-hash, code:visible').first();
      const txHash = await txHashElement.textContent() || '';

      console.log(`✓ Delegation successful: ${txHash}`);

      return txHash.trim();
    };

    await use(delegateFn);
  },

  /**
   * Withdraw staking rewards
   * @returns Transaction hash
   */
  withdrawRewards: async ({ optionsPage }, use) => {
    const withdrawFn = async (password: string): Promise<string> => {
      console.log('Withdrawing staking rewards...');

      // Navigate to staking page
      const stakingButton = optionsPage.locator('button:has-text("Staking"), a:has-text("Staking"), [href*="staking"]').first();
      await stakingButton.click();

      // Wait for staking page
      await optionsPage.waitForSelector('[data-testid="staking-page"], .staking-container', {
        timeout: 5000
      });

      // Click withdraw button
      const withdrawButton = optionsPage.locator('button:has-text("Withdraw")').first();
      await withdrawButton.click();

      // Confirm withdrawal
      await optionsPage.waitForSelector('[data-testid="confirm-withdrawal"], .confirm-container', {
        timeout: 5000
      });

      // Enter password
      const passwordInput = optionsPage.locator('input[type="password"]:visible').first();
      await passwordInput.fill(password);

      // Confirm
      const confirmButton = optionsPage.locator('button:has-text("Confirm"), button:has-text("Withdraw")').last();
      await confirmButton.click();

      // Wait for success
      await optionsPage.waitForSelector('[data-testid="withdrawal-success"], .success-message', {
        timeout: 30000
      });

      // Extract transaction hash
      const txHashElement = optionsPage.locator('[data-testid="tx-hash"], .tx-hash, code:visible').first();
      const txHash = await txHashElement.textContent() || '';

      console.log(`✓ Withdrawal successful: ${txHash}`);

      return txHash.trim();
    };

    await use(withdrawFn);
  },
});

export { expect } from '@playwright/test';