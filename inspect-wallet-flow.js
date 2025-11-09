import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const extensionPath = path.resolve('../gerowallet/extension');

async function inspectFlow() {
  const userDataDir = path.join(__dirname, 'tmp', `inspect-flow-${Date.now()}`);

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
    viewport: { width: 1280, height: 720 },
  });

  // Wait for service worker
  await new Promise(resolve => setTimeout(resolve, 2000));

  const page = await context.newPage();

  // Get extension ID
  const serviceWorker = context.serviceWorkers()[0];
  const extensionId = serviceWorker ? serviceWorker.url().split('/')[2] : 'unknown';

  console.log('Extension ID:', extensionId);

  await page.goto(`chrome-extension://${extensionId}/index.html`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  async function logCurrentState(stepName) {
    console.log(`\n\n${'='.repeat(60)}`);
    console.log(`STEP: ${stepName}`);
    console.log('='.repeat(60));

    // Take screenshot
    await page.screenshot({ path: `inspect-${stepName.replace(/\s+/g, '-').toLowerCase()}.png` });

    // Get ALL buttons (not just visible)
    const allButtons = await page.$$('button');
    console.log(`\nAll buttons (${allButtons.length}):`);
    for (let i = 0; i < allButtons.length; i++) {
      const text = await allButtons[i].textContent();
      const isVisible = await allButtons[i].isVisible();
      console.log(`  ${i}. "${text?.trim()}" (visible: ${isVisible})`);
    }

    // Also check buttons specifically within overlays
    const overlayButtons = await page.$$('.v-overlay button, .v-dialog button, [role="dialog"] button');
    console.log(`\nButtons in overlays (${overlayButtons.length}):`);
    for (let i = 0; i < overlayButtons.length; i++) {
      const text = await overlayButtons[i].textContent();
      const isVisible = await overlayButtons[i].isVisible();
      console.log(`  ${i}. "${text?.trim()}" (visible: ${isVisible})`);
    }

    // Get all visible inputs
    const inputs = await page.$$('input:visible');
    console.log(`\nVisible inputs (${inputs.length}):`);
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      const placeholder = await inputs[i].getAttribute('placeholder');
      console.log(`  ${i}. type="${type}", placeholder="${placeholder}"`);
    }

    // Get all visible textareas
    const textareas = await page.$$('textarea:visible');
    console.log(`\nVisible textareas (${textareas.length}):`);
    for (let i = 0; i < textareas.length; i++) {
      const placeholder = await textareas[i].getAttribute('placeholder');
      console.log(`  ${i}. placeholder="${placeholder}"`);
    }

    // Get modals/overlays
    const overlays = await page.$$('.v-overlay:visible, .v-dialog:visible, [role="dialog"]:visible');
    console.log(`\nVisible overlays/dialogs: ${overlays.length}`);
  }

  // Step 1: Initial state
  await logCurrentState('1-Initial-Welcome-Screen');

  // Step 2: Click network selector
  console.log('\n\n>>> Clicking network selector...');
  const networkSelector = page.locator('button:has-text("Cardano Mainnet")');
  if (await networkSelector.isVisible({ timeout: 5000 })) {
    await networkSelector.click();
    await page.waitForTimeout(1500);
    await logCurrentState('2-Network-Selector-Opened');

    // Step 3: Select preprod
    console.log('\n\n>>> Selecting preprod network...');
    const preprodOption = page.locator('.v-list-item:has-text("preprod"), .v-list-item:has-text("Preprod")').first();
    if (await preprodOption.isVisible({ timeout: 3000 })) {
      await preprodOption.click();
      await page.waitForTimeout(1500);
      await logCurrentState('3-Preprod-Selected');
    } else {
      console.log('⚠ Preprod option not found');
    }
  }

  // Step 4: Click "Create or Import Seed Phrase"
  console.log('\n\n>>> Clicking "Create or Import Seed Phrase"...');
  const createImportButton = page.locator('button:has-text("Create or Import Seed Phrase")');
  if (await createImportButton.isVisible({ timeout: 5000 })) {
    await createImportButton.click();
    await page.waitForTimeout(2000);
    await logCurrentState('4-After-Create-Import-Click');

    // Step 5: Look for "Create Wallet" in ANY element
    console.log('\n\n>>> Looking for "Create Wallet" text in ANY element...');

    // Check for any element containing "Create Wallet"
    const allElementsWithText = await page.$$('*');
    console.log(`Total elements on page: ${allElementsWithText.length}`);

    // Look for elements with specific text
    const createWalletElements = await page.$$('text="Create Wallet"');
    console.log(`Elements with "Create Wallet" text: ${createWalletElements.length}`);
    for (let i = 0; i < createWalletElements.length; i++) {
      const tagName = await createWalletElements[i].evaluate(el => el.tagName);
      const className = await createWalletElements[i].evaluate(el => el.className);
      const isVisible = await createWalletElements[i].isVisible();
      console.log(`  ${i}. <${tagName}> class="${className}" visible=${isVisible}`);
    }

    // Check for divs, spans, or any clickable-looking elements
    const clickableCandidates = await page.$$('[class*="btn"], [class*="button"], [role="button"], div[class*="option"], div[class*="item"]');
    console.log(`\nPotentially clickable elements: ${clickableCandidates.length}`);
    for (let i = 0; i < Math.min(clickableCandidates.length, 20); i++) {
      const text = await clickableCandidates[i].textContent();
      const tagName = await clickableCandidates[i].evaluate(el => el.tagName);
      const className = await clickableCandidates[i].evaluate(el => el.className);
      const isVisible = await clickableCandidates[i].isVisible();
      if (text && text.trim().length > 0 && text.length < 50) {
        console.log(`  ${i}. <${tagName}> "${text.trim().substring(0, 30)}" class="${className.substring(0, 40)}" visible=${isVisible}`);
      }
    }

    // Try to click using text locator
    console.log('\n>>> Attempting to click "Create Wallet" using text locator...');
    try {
      const createWalletLocator = page.locator('text="Create Wallet"').first();
      if (await createWalletLocator.isVisible({ timeout: 2000 })) {
        console.log('✓ Found "Create Wallet" with text locator, clicking...');
        await createWalletLocator.click();
        await page.waitForTimeout(2000);
        await logCurrentState('5-After-Create-Wallet-Click');
      } else {
        console.log('✗ "Create Wallet" not visible');
      }
    } catch (err) {
      console.log('✗ Error clicking "Create Wallet":', err.message);
    }
  }

  console.log('\n\n>>> Browser will stay open for manual inspection. Press Ctrl+C to close.');
  await new Promise(() => {});
}

inspectFlow().catch(console.error);
