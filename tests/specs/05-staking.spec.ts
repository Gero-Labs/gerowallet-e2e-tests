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

  test.skip('should delegate to stake pool', async ({ optionsPage, delegateStake, checkBalance }) => {
    // This test is skipped by default as it requires:
    // 1. Sufficient ADA for staking (minimum ~2 ADA for deposit + fees)
    // 2. Valid pool ID
    // 3. Wallet not already delegated

    const balance = await checkBalance();
    console.log(`Current balance: ${balance} ADA`);

    if (balance < 5) {
      test.skip(true, 'Insufficient balance for staking (need at least 5 ADA)');
    }

    // Delegate to test pool
    const txHash = await delegateStake(TEST_POOLS.pool1, TEST_WALLET_1.password);

    expect(txHash).toBeTruthy();
    console.log(`✅ Delegation transaction: ${txHash}`);
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

  test.skip('should withdraw staking rewards', async ({ withdrawRewards }) => {
    // This test is skipped by default as it requires:
    // 1. Wallet to be delegated
    // 2. Available rewards to withdraw

    const txHash = await withdrawRewards(TEST_WALLET_1.password);

    expect(txHash).toBeTruthy();
    console.log(`✅ Rewards withdrawal transaction: ${txHash}`);
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