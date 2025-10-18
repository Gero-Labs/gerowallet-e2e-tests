#!/usr/bin/env tsx

/**
 * Setup test wallets for E2E testing
 * Generates mnemonics and optionally requests testnet funds
 */

import * as bip39 from 'bip39';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment
dotenv.config();

interface TestWallet {
  name: string;
  mnemonic: string;
  address?: string;
}

async function generateTestWallets(): Promise<TestWallet[]> {
  console.log('🔑 Generating test wallet mnemonics...\n');

  const wallets: TestWallet[] = [
    {
      name: 'Test Wallet 1 (Primary)',
      mnemonic: bip39.generateMnemonic(256) // 24 words
    },
    {
      name: 'Test Wallet 2 (Secondary)',
      mnemonic: bip39.generateMnemonic(256) // 24 words
    }
  ];

  return wallets;
}

async function saveWalletsToEnv(wallets: TestWallet[]): Promise<void> {
  const envPath = path.join(__dirname, '../.env');
  const envExamplePath = path.join(__dirname, '../.env.example');

  // Read existing .env.example
  let envContent = '';
  if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf-8');
  }

  // Update mnemonic values
  envContent = envContent.replace(
    /TEST_WALLET_1_MNEMONIC=.*/,
    `TEST_WALLET_1_MNEMONIC=${wallets[0].mnemonic}`
  );
  envContent = envContent.replace(
    /TEST_WALLET_2_MNEMONIC=.*/,
    `TEST_WALLET_2_MNEMONIC=${wallets[1].mnemonic}`
  );

  // Write to .env
  fs.writeFileSync(envPath, envContent);

  console.log('✅ Wallet mnemonics saved to .env file\n');
}

async function saveWalletsToConfig(wallets: TestWallet[]): Promise<void> {
  const configPath = path.join(__dirname, '../config/test-wallets.json');
  const configDir = path.dirname(configPath);

  // Create config directory if it doesn't exist
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  // Save wallets
  const config = {
    generated: new Date().toISOString(),
    network: 'preprod',
    wallets: wallets.map((w, i) => ({
      id: i + 1,
      name: w.name,
      mnemonic: w.mnemonic,
      address: w.address || 'Generate in wallet after first login',
      note: 'Fund this wallet from Preprod faucet: https://docs.cardano.org/cardano-testnet/tools/faucet'
    }))
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log('✅ Wallet configuration saved to config/test-wallets.json\n');
}

function displayWalletInfo(wallets: TestWallet[]): void {
  console.log('📋 Generated Test Wallets:\n');
  console.log('═'.repeat(80));

  wallets.forEach((wallet, index) => {
    console.log(`\n${wallet.name}`);
    console.log('─'.repeat(80));
    console.log(`Mnemonic (${wallet.mnemonic.split(' ').length} words):`);
    console.log(wallet.mnemonic);
    console.log('─'.repeat(80));
  });

  console.log('\n═'.repeat(80));
}

function displayNextSteps(): void {
  console.log('\n📝 Next Steps:\n');
  console.log('1. The wallet mnemonics have been saved to your .env file');
  console.log('2. Import these wallets in GeroWallet extension (or let tests create them)');
  console.log('3. Get the wallet addresses from GeroWallet');
  console.log('4. Fund the wallets from Preprod faucet:');
  console.log('   https://docs.cardano.org/cardano-testnet/tools/faucet');
  console.log('5. Wait for funds to arrive (usually 1-2 minutes)');
  console.log('6. Run the tests: npm test\n');
  console.log('⚠️  IMPORTANT: These are TEST wallets for PREPROD only!');
  console.log('   Never use these mnemonics on mainnet or with real funds!\n');
}

async function main() {
  console.log('\n🚀 GeroWallet E2E Test Wallet Setup\n');

  try {
    // Generate wallets
    const wallets = await generateTestWallets();

    // Display wallet info
    displayWalletInfo(wallets);

    // Save to .env
    await saveWalletsToEnv(wallets);

    // Save to config file
    await saveWalletsToConfig(wallets);

    // Display next steps
    displayNextSteps();

    console.log('✅ Setup completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Error during setup:', error);
    process.exit(1);
  }
}

main();