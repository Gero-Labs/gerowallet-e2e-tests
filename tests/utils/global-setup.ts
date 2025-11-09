import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
async function globalSetup() {
  console.log('\n🚀 Starting GeroWallet E2E Test Suite\n');

  // Load environment variables
  dotenv.config();

  // Verify required environment variables
  const requiredVars = ['BLOCKFROST_API_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please create a .env file based on .env.example\n');
    process.exit(1);
  }

  // Verify extension path exists
  const extensionPath = process.env.EXTENSION_PATH || path.join(__dirname, '../../../gerowallet/extension');
  if (!fs.existsSync(extensionPath)) {
    console.error(`❌ Extension not found at: ${extensionPath}`);
    console.error('Please build the GeroWallet extension first:\n');
    console.error('  cd gerowallet');
    console.error('  npm run build\n');
    process.exit(1);
  }

  // Verify manifest.json exists
  const manifestPath = path.join(extensionPath, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ manifest.json not found at: ${manifestPath}`);
    console.error('The extension build may be incomplete\n');
    process.exit(1);
  }

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, '../../screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // Create tmp directory for user data
  const tmpDir = path.join(__dirname, '../fixtures/tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  console.log('✅ Environment validation passed');
  console.log(`📦 Extension path: ${extensionPath}`);
  console.log(`🌐 Network: ${process.env.CARDANO_NETWORK || 'preprod'}`);
  console.log(`🔑 Blockfrost: ${process.env.BLOCKFROST_URL}\n`);
}

export default globalSetup;