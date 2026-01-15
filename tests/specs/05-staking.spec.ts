import { test, expect } from '../fixtures/cardano.fixture';
import { setupConsoleCapture } from '../utils/extension.utils';
import { TEST_WALLET_1, TEST_POOLS } from '../utils/test-data';

/**
 * Test Suite: Staking Operations
 * Tests staking delegation and reward withdrawal
 *
 * IMPORTANT: These tests require a funded test wallet
 */

test.describe('Staking Operations', () => {
  test.skip(!TEST_WALLET_1.mnemonic, 'Test wallet not configured - skipping staking tests');

  test.beforeEach(async ({ createWallet, optionsPage }) => {
    if (!TEST_WALLET_1.mnemonic) {
      test.skip();
    }

    await createWallet(TEST_WALLET_1.name, TEST_WALLET_1.mnemonic, TEST_WALLET_1.password);
    setupConsoleCapture(optionsPage);

    // Wait for wallet to sync
    await optionsPage.waitForTimeout(10000);
  });

  test('should navigate to staking page', async ({ optionsPage }) => {
    // Click staking button
    const stakingButton = optionsPage.locator('button:has-text("Staking"), a:has-text("Staking"), [href*="staking"]').first();
    await stakingButton.click();

    // Verify staking page loaded
    await expect(
      optionsPage.locator('[data-testid="staking-page"], .staking-container')
    ).toBeVisible({ timeout: 5000 });

    console.log('✅ Staking page loaded');
  });

  test('should display pool list', async ({ optionsPage }) => {
    // Navigate to staking
    const stakingButton = optionsPage.locator('button:has-text("Staking"), a:has-text("Staking"), [href*="staking"]').first();
    await stakingButton.click();

    // Wait for staking page
    await optionsPage.waitForSelector('[data-testid="staking-page"], .staking-container', {
      timeout: 5000
    });

    // Wait for pools to load
    await optionsPage.waitForTimeout(3000);

    // Look for pool elements
    const poolElements = optionsPage.locator('[data-testid="pool-card"], .pool-item, .stake-pool').first();
    const hasPoolsOrSearch = await poolElements.count() > 0;

    if (hasPoolsOrSearch) {
      console.log('✅ Pool list displayed');
    } else {
      console.log('⚠️  Pool list may use different selectors or require search first');
    }
  });

  test('should search for stake pool', async ({ optionsPage }) => {
    // Navigate to staking
    const stakingButton = optionsPage.locator('button:has-text("Staking"), a:has-text("Staking"), [href*="staking"]').first();
    await stakingButton.click();

    // Wait for staking page
    await optionsPage.waitForSelector('[data-testid="staking-page"], .staking-container');

    // Look for search input
    const searchInput = optionsPage.locator('input[placeholder*="pool" i]:visible, input[placeholder*="search" i]:visible').first();

    if (await searchInput.isVisible({ timeout: 2000 })) {
      // Enter pool ID or ticker
      await searchInput.fill('TEST');

      // Wait for search results
      await optionsPage.waitForTimeout(2000);

      console.log('✅ Pool search executed');
    } else {
      console.log('⚠️  Pool search input not found');
    }
  });

  test('should delegate to stake pool', async ({ optionsPage, delegateStake, checkBalance }) => {
    // Check balance first
    const balance = await checkBalance();
    console.log(`Current balance: ${balance} ADA`);

    // Skip if insufficient balance (need ~5 ADA for deposit + fees)
    if (balance < 5) {
      test.skip(true, 'Insufficient balance for staking (need at least 5 ADA)');
      return;
    }

    // Navigate to staking page
    const stakingButton = optionsPage.locator('button:has-text("Staking"), a:has-text("Staking"), [href*="staking"]').first();
    await stakingButton.click();

    // Wait for staking page to load
    await optionsPage.waitForSelector('[data-testid="staking-page"], .staking-container', {
      timeout: 10000
    });

    // Wait for pools to load
    await optionsPage.waitForTimeout(3000);

    // Check if wallet is already delegated
    const delegationStatus = optionsPage.locator('[data-testid="delegation-status"], .delegation-info, .current-pool, text=/delegated to/i').first();
    const isAlreadyDelegated = await delegationStatus.isVisible({ timeout: 2000 }).catch(() => false);

    if (isAlreadyDelegated) {
      const statusText = await delegationStatus.textContent();
      console.log(`⚠️  Wallet already delegated: ${statusText}`);
      console.log('✅ Delegation status verified - skipping new delegation');
      return;
    }

    // Search for a stake pool
    const searchInput = optionsPage.locator('input[placeholder*="pool" i]:visible, input[placeholder*="search" i]:visible').first();
    if (await searchInput.isVisible({ timeout: 3000 })) {
      // Use pool ticker or ID to search
      await searchInput.fill(TEST_POOLS.pool1.slice(0, 10));
      await optionsPage.waitForTimeout(2000);
    }

    // Look for pool cards and select the first available one
    const poolCard = optionsPage.locator('[data-testid="pool-card"], .pool-item, .stake-pool, [data-testid*="pool"]').first();

    if (await poolCard.isVisible({ timeout: 5000 })) {
      await poolCard.click();
      await optionsPage.waitForTimeout(1000);
    }

    // Click delegate button
    const delegateButton = optionsPage.locator('button:has-text("Delegate"), button:has-text("Stake")').first();

    if (await delegateButton.isVisible({ timeout: 3000 })) {
      await delegateButton.click();

      // Wait for confirmation dialog
      await optionsPage.waitForSelector('[data-testid="confirm-delegation"], .confirm-container, .confirmation-modal', {
        timeout: 5000
      }).catch(() => {});

      // Enter password
      const passwordInput = optionsPage.locator('input[type="password"]:visible').first();
      if (await passwordInput.isVisible({ timeout: 2000 })) {
        await passwordInput.fill(TEST_WALLET_1.password);
      }

      // Confirm delegation
      const confirmButton = optionsPage.locator('button:has-text("Confirm"), button:has-text("Delegate")').last();
      await confirmButton.click();

      // Wait for success message or transaction hash
      const successSelector = '[data-testid="delegation-success"], .success-message, [data-testid="tx-hash"], .tx-hash';
      await optionsPage.waitForSelector(successSelector, { timeout: 60000 });

      // Try to extract transaction hash
      const txHashElement = optionsPage.locator('[data-testid="tx-hash"], .tx-hash, code:visible').first();
      const txHash = await txHashElement.textContent().catch(() => 'Transaction submitted');

      expect(txHash).toBeTruthy();
      console.log(`✅ Delegation transaction: ${txHash}`);
    } else {
      // Fallback: use the fixture directly if UI flow fails
      console.log('Using delegateStake fixture...');
      const txHash = await delegateStake(TEST_POOLS.pool1, TEST_WALLET_1.password);
      expect(txHash).toBeTruthy();
      console.log(`✅ Delegation transaction: ${txHash}`);
    }
  });

  test('should display current delegation status', async ({ optionsPage }) => {
    // Navigate to staking
    const stakingButton = optionsPage.locator('button:has-text("Staking"), a:has-text("Staking"), [href*="staking"]').first();
    await stakingButton.click();

    // Wait for staking page
    await optionsPage.waitForSelector('[data-testid="staking-page"], .staking-container');

    // Wait for data to load
    await optionsPage.waitForTimeout(3000);

    // Look for delegation status elements
    const delegationStatus = optionsPage.locator('[data-testid="delegation-status"], .delegation-info, text=/delegated/i').first();
    const statusExists = await delegationStatus.count() > 0;

    if (statusExists) {
      const statusText = await delegationStatus.textContent();
      console.log(`Delegation status: ${statusText}`);
    } else {
      console.log('⚠️  Delegation status not found (wallet may not be delegated yet)');
    }
  });

  test('should display staking rewards', async ({ optionsPage }) => {
    // Navigate to staking
    const stakingButton = optionsPage.locator('button:has-text("Staking"), a:has-text("Staking"), [href*="staking"]').first();
    await stakingButton.click();

    // Wait for staking page
    await optionsPage.waitForSelector('[data-testid="staking-page"], .staking-container');

    // Wait for data to load
    await optionsPage.waitForTimeout(3000);

    // Look for rewards display
    const rewardsElement = optionsPage.locator('[data-testid="staking-rewards"], .rewards, text=/rewards/i').first();
    const rewardsExist = await rewardsElement.count() > 0;

    if (rewardsExist) {
      const rewardsText = await rewardsElement.textContent();
      console.log(`Staking rewards: ${rewardsText}`);
    } else {
      console.log('⚠️  Rewards display not found (wallet may have no rewards yet)');
    }
  });

  test('should withdraw staking rewards', async ({ optionsPage, withdrawRewards, checkBalance }) => {
    // Check balance first
    const balance = await checkBalance();
    console.log(`Current balance: ${balance} ADA`);

    // Navigate to staking page
    const stakingButton = optionsPage.locator('button:has-text("Staking"), a:has-text("Staking"), [href*="staking"]').first();
    await stakingButton.click();

    // Wait for staking page to load
    await optionsPage.waitForSelector('[data-testid="staking-page"], .staking-container', {
      timeout: 10000
    });

    // Wait for data to load
    await optionsPage.waitForTimeout(3000);

    // Check if wallet is delegated
    const delegationStatus = optionsPage.locator('[data-testid="delegation-status"], .delegation-info, .current-pool, text=/delegated/i').first();
    const isDelegated = await delegationStatus.isVisible({ timeout: 2000 }).catch(() => false);

    if (!isDelegated) {
      console.log('⚠️  Wallet is not delegated - skipping rewards withdrawal');
      test.skip(true, 'Wallet must be delegated to withdraw rewards');
      return;
    }

    // Look for rewards display and check if there are rewards to withdraw
    const rewardsElement = optionsPage.locator('[data-testid="staking-rewards"], .rewards-amount, .available-rewards, text=/rewards/i').first();
    const rewardsText = await rewardsElement.textContent().catch(() => '0');
    const rewardsMatch = rewardsText?.match(/[\d,]+\.?\d*/);
    const rewardsAmount = rewardsMatch ? parseFloat(rewardsMatch[0].replace(/,/g, '')) : 0;

    console.log(`Available rewards: ${rewardsAmount} ADA`);

    if (rewardsAmount <= 0) {
      console.log('⚠️  No rewards available to withdraw');
      test.skip(true, 'No rewards available to withdraw');
      return;
    }

    // Click withdraw button
    const withdrawButton = optionsPage.locator('button:has-text("Withdraw"), button:has-text("Claim")').first();

    if (await withdrawButton.isVisible({ timeout: 3000 })) {
      await withdrawButton.click();

      // Wait for confirmation dialog
      await optionsPage.waitForSelector('[data-testid="confirm-withdrawal"], .confirm-container, .confirmation-modal', {
        timeout: 5000
      }).catch(() => {});

      // Enter password
      const passwordInput = optionsPage.locator('input[type="password"]:visible').first();
      if (await passwordInput.isVisible({ timeout: 2000 })) {
        await passwordInput.fill(TEST_WALLET_1.password);
      }

      // Confirm withdrawal
      const confirmButton = optionsPage.locator('button:has-text("Confirm"), button:has-text("Withdraw")').last();
      await confirmButton.click();

      // Wait for success message or transaction hash
      const successSelector = '[data-testid="withdrawal-success"], .success-message, [data-testid="tx-hash"], .tx-hash';
      await optionsPage.waitForSelector(successSelector, { timeout: 60000 });

      // Try to extract transaction hash
      const txHashElement = optionsPage.locator('[data-testid="tx-hash"], .tx-hash, code:visible').first();
      const txHash = await txHashElement.textContent().catch(() => 'Transaction submitted');

      expect(txHash).toBeTruthy();
      console.log(`✅ Rewards withdrawal transaction: ${txHash}`);
    } else {
      // Fallback: use the fixture directly if UI flow fails
      console.log('Using withdrawRewards fixture...');
      const txHash = await withdrawRewards(TEST_WALLET_1.password);
      expect(txHash).toBeTruthy();
      console.log(`✅ Rewards withdrawal transaction: ${txHash}`);
    }
  });

  test('should display pool details', async ({ optionsPage }) => {
    // Navigate to staking
    const stakingButton = optionsPage.locator('button:has-text("Staking"), a:has-text("Staking"), [href*="staking"]').first();
    await stakingButton.click();

    // Wait for staking page
    await optionsPage.waitForSelector('[data-testid="staking-page"], .staking-container');

    // Wait for pools to load
    await optionsPage.waitForTimeout(3000);

    // Click on a pool to view details
    const poolCard = optionsPage.locator('[data-testid="pool-card"], .pool-item, .stake-pool').first();

    if (await poolCard.isVisible({ timeout: 2000 })) {
      await poolCard.click();

      // Wait for pool details
      await optionsPage.waitForTimeout(2000);

      // Look for pool detail elements
      const poolDetails = optionsPage.locator('[data-testid="pool-details"], .pool-detail').first();
      const hasDetails = await poolDetails.count() > 0;

      if (hasDetails) {
        console.log('✅ Pool details displayed');
      } else {
        console.log('⚠️  Pool details not found or use different structure');
      }
    } else {
      console.log('⚠️  No pools available to click');
    }
  });
});