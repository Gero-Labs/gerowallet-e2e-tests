import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
  const extensionPath = join(__dirname, '../gerowallet/extension');
  console.log('Extension path:', extensionPath);

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
  });

  const page = await context.newPage();

  // Get extension ID
  let [background] = context.serviceWorkers();
  if (!background) background = await context.waitForEvent('serviceworker');
  const extensionId = background.url().split('/')[2];
  console.log('Extension ID:', extensionId);

  // Navigate to extension
  await page.goto(`chrome-extension://${extensionId}/index.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  // Select network
  const networkSelector = page.locator('button:has-text("Cardano Mainnet")');
  await networkSelector.waitFor({ timeout: 10000 });
  await networkSelector.click();
  await page.waitForTimeout(1000);

  const preprodOption = page.locator('.v-list-item:has-text("preprod"), .v-list-item:has-text("Preprod")').first();
  if (await preprodOption.isVisible({ timeout: 2000 })) {
    await preprodOption.click();
    await page.waitForTimeout(1000);
  }

  // Click create/import button
  const createImportButton = page.locator('button:has-text("Create or Import Seed Phrase")');
  await createImportButton.waitFor({ timeout: 10000 });
  await createImportButton.click();
  await page.waitForTimeout(2000);

  // Click restore wallet
  const restoreWalletOption = page.locator('text="Restore Wallet"').first();
  await restoreWalletOption.waitFor({ timeout: 10000 });
  await restoreWalletOption.click();
  await page.waitForTimeout(2000);

  // Now inspect the buttons
  console.log('\n=== Inspecting phrase length buttons ===');
  const buttons = await page.locator('button').all();

  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent();
    const isVisible = await button.isVisible();
    if (text && text.trim()) {
      console.log(`Button ${i}: "${text}" (visible: ${isVisible})`);
    }
  }

  console.log('\n=== Looking for buttons with "Choose recovery phrase length" context ===');
  const lengthSection = page.locator('text="Choose recovery phrase length"');
  if (await lengthSection.isVisible()) {
    console.log('Found "Choose recovery phrase length" text');

    // Get all buttons near this text
    const nearbyButtons = page.locator('button:visible');
    const count = await nearbyButtons.count();
    console.log(`Total visible buttons: ${count}`);

    for (let i = 0; i < Math.min(count, 10); i++) {
      const btn = nearbyButtons.nth(i);
      const text = await btn.textContent();
      const innerHTML = await btn.innerHTML();
      console.log(`\nButton ${i}:`);
      console.log(`  Text: "${text}"`);
      console.log(`  HTML: ${innerHTML.substring(0, 200)}`);
    }
  }

  console.log('\n=== Pausing for manual inspection ===');
  await page.waitForTimeout(60000);

  await context.close();
})();
