import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const extensionPath = path.resolve('../gerowallet/extension');

async function inspect() {
  const userDataDir = path.join(__dirname, 'tmp', `inspect-${Date.now()}`);

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
  console.log('Opening extension at:', `chrome-extension://${extensionId}/index.html`);

  await page.goto(`chrome-extension://${extensionId}/index.html`);
  await page.waitForLoadState('domcontentloaded');

  // Wait a bit for the app to initialize
  await page.waitForTimeout(5000);

  console.log('\n=== WELCOME SCREEN ===');
  let buttons = await page.$$('button');
  console.log(`\nFound ${buttons.length} buttons:`);
  for (let i = 0; i < Math.min(buttons.length, 10); i++) {
    const text = await buttons[i].textContent();
    console.log(`  Button ${i}: "${text?.trim()}"`);
  }

  // Click "Create or Import Seed Phrase"
  const createImportButton = page.locator('button:has-text("Create or Import Seed Phrase")');
  if (await createImportButton.isVisible({ timeout: 2000 })) {
    console.log('\nClicking "Create or Import Seed Phrase"...');
    await createImportButton.click();
    await page.waitForTimeout(3000);

    console.log('\n=== AFTER CLICKING "CREATE OR IMPORT" ===');

    // Check for overlays/dialogs (Vuetify uses v-dialog, v-overlay)
    const overlays = await page.$$('.v-overlay, .v-dialog, .modal, [role="dialog"]');
    console.log(`\nFound ${overlays.length} overlays/dialogs`);

    // Check what's inside the overlay
    if (overlays.length > 0) {
      console.log('\n--- Inspecting overlay content ---');
      const overlayButtons = await page.$$('.v-overlay button, .v-dialog button');
      console.log(`Buttons inside overlay: ${overlayButtons.length}`);
      for (let i = 0; i < overlayButtons.length; i++) {
        const text = await overlayButtons[i].textContent();
        const visible = await overlayButtons[i].isVisible();
        console.log(`  Overlay Button ${i}: "${text?.trim()}" visible=${visible}`);
      }

      // Check for any text content in the overlay
      const overlayText = await page.$$eval('.v-overlay, .v-dialog', els =>
        els.map(el => el.textContent?.slice(0, 200))
      );
      console.log(`Overlay text content (first 200 chars): ${JSON.stringify(overlayText)}`);
    }

    // Check all visible elements
    const allVisible = await page.$$(':visible');
    console.log(`Found ${allVisible.length} visible elements total`);

    buttons = await page.$$('button:visible');
    console.log(`\nFound ${buttons.length} VISIBLE buttons:`);
    for (let i = 0; i < Math.min(buttons.length, 15); i++) {
      const text = await buttons[i].textContent();
      console.log(`  Button ${i}: "${text?.trim()}"`);
    }

    // Check for inputs (all, not just visible)
    let inputs = await page.$$('input');
    console.log(`\nFound ${inputs.length} input fields (total):`);
    for (let i = 0; i < Math.min(inputs.length, 10); i++) {
      const type = await inputs[i].getAttribute('type');
      const placeholder = await inputs[i].getAttribute('placeholder');
      const visible = await inputs[i].isVisible();
      console.log(`  Input ${i}: type="${type}", placeholder="${placeholder}", visible=${visible}`);
    }

    // Check for textareas
    const textareas = await page.$$('textarea');
    console.log(`\nFound ${textareas.length} textareas:`);
    for (let i = 0; i < textareas.length; i++) {
      const placeholder = await textareas[i].getAttribute('placeholder');
      const visible = await textareas[i].isVisible();
      console.log(`  Textarea ${i}: placeholder="${placeholder}", visible=${visible}`);
    }
  }

  // Original button listing code (skip it now)

  // Get all links
  const links = await page.$$('a');
  console.log(`\nFound ${links.length} links:`);
  for (let i = 0; i < Math.min(links.length, 10); i++) {
    const text = await links[i].textContent();
    const href = await links[i].getAttribute('href');
    console.log(`  Link ${i}: "${text?.trim()}" - href: ${href}`);
  }

  // Get page title and main headings
  const title = await page.title();
  const h1 = await page.$$('h1');
  const h2 = await page.$$('h2');

  console.log(`\nPage title: ${title}`);
  console.log(`Found ${h1.length} h1 elements`);
  for (let elem of h1) {
    console.log(`  H1: "${await elem.textContent()}"`);
  }
  console.log(`Found ${h2.length} h2 elements`);
  for (let elem of h2) {
    console.log(`  H2: "${await elem.textContent()}"`);
  }

  console.log('\n\nBrowser will stay open for inspection. Press Ctrl+C to close.');

  // Keep the browser open
  await new Promise(() => {});
}

inspect().catch(console.error);
