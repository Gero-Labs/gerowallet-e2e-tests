import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Global teardown for Playwright tests
 * Runs once after all tests
 */
async function globalTeardown() {
  console.log('\n🧹 Cleaning up test artifacts...\n');

  // Clean up temporary user data directories
  const tmpDir = path.join(__dirname, '../fixtures/tmp');
  if (fs.existsSync(tmpDir)) {
    const entries = fs.readdirSync(tmpDir);
    for (const entry of entries) {
      const entryPath = path.join(tmpDir, entry);
      if (fs.statSync(entryPath).isDirectory()) {
        fs.rmSync(entryPath, { recursive: true, force: true });
        console.log(`🗑️  Removed temp directory: ${entry}`);
      }
    }
  }

  console.log('\n✅ Test suite completed\n');
}

export default globalTeardown;