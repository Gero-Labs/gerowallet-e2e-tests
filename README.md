# GeroWallet E2E Test Suite

End-to-end automation testing for the GeroWallet Chrome extension using Playwright.

## Overview

This project provides comprehensive automated testing for GeroWallet, including:

- **Wallet Creation & Import** - Test wallet setup flows with mnemonic phrases
- **Authentication** - Login, password validation, session management
- **Transaction Building** - UI validation, address validation, amount validation
- **Transaction Sending** - Actual transaction submission and blockchain confirmation
- **Staking Operations** - Pool delegation, reward withdrawal
- **DApp Integration** - CIP-30 connector API testing

## Prerequisites

- **Node.js** 18+ and npm
- **GeroWallet Extension** - Built and available (see setup below)
- **Blockfrost API Key** - Free account at [blockfrost.io](https://blockfrost.io)
- **Test Wallet Funds** - Preprod testnet ADA from [Cardano Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Build GeroWallet Extension

```bash
# Build the extension (assumes gerowallet is a sibling directory)
npm run build:extension

# Or manually:
cd ../gerowallet
npm install
npm run build
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your Blockfrost API key
# BLOCKFROST_API_KEY=preprod...
```

### 4. Generate Test Wallets

```bash
# Generate test wallet mnemonics
npm run setup:wallets
```

This will:
- Generate two 24-word mnemonic phrases
- Save them to your `.env` file
- Create `config/test-wallets.json` with wallet info

### 5. Fund Test Wallets

1. Run a basic test to create the wallets and get addresses:
   ```bash
   npm run test:wallet
   ```

2. Copy the wallet address from test output

3. Request funds from the Preprod faucet:
   - Go to https://docs.cardano.org/cardano-testnet/tools/faucet
   - Enter your test wallet address
   - Request 1000 ADA (testnet)
   - Wait 1-2 minutes for confirmation

### 6. Run Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:wallet          # Wallet creation and login
npm run test:transactions    # Transaction building and sending
npm run test:staking        # Staking operations
npm run test:dapp           # DApp connector

# Run with UI mode (interactive)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug mode
npm run test:debug
```

## Project Structure

```
gerowallet-e2e-tests/
├── tests/
│   ├── fixtures/           # Playwright test fixtures
│   │   ├── extension.fixture.ts    # Extension loading & utilities
│   │   ├── wallet.fixture.ts       # Wallet operations
│   │   └── cardano.fixture.ts      # Cardano-specific operations
│   ├── specs/              # Test specifications
│   │   ├── 01-wallet-creation.spec.ts
│   │   ├── 02-wallet-login.spec.ts
│   │   ├── 03-transaction-build.spec.ts
│   │   ├── 04-transaction-send.spec.ts
│   │   ├── 05-staking.spec.ts
│   │   └── 06-dapp-connection.spec.ts
│   └── utils/              # Utility functions
│       ├── cardano.utils.ts        # Cardano helpers
│       ├── extension.utils.ts      # Extension helpers
│       ├── test-data.ts            # Test constants
│       ├── global-setup.ts         # Global setup
│       └── global-teardown.ts      # Global teardown
├── config/                 # Configuration files
│   └── test-wallets.json   # Generated wallet info
├── scripts/                # Helper scripts
│   ├── build-extension.sh  # Build GeroWallet
│   └── setup-test-wallets.ts # Generate test wallets
├── playwright.config.ts    # Playwright configuration
├── package.json
├── .env                    # Environment variables (create from .env.example)
└── README.md
```

## Test Fixtures

The project uses Playwright fixtures to provide reusable test utilities:

### Extension Fixture

```typescript
import { test, expect } from '../fixtures/extension.fixture';

test('example', async ({ context, extensionId, extensionUrl }) => {
  // context: Browser context with extension loaded
  // extensionId: Chrome extension ID
  // extensionUrl: Helper to build extension URLs
});
```

### Wallet Fixture

```typescript
import { test, expect } from '../fixtures/wallet.fixture';

test('example', async ({
  optionsPage,
  createWallet,
  loginWallet,
  getWalletAddress
}) => {
  // optionsPage: Extension options page
  // createWallet: Function to create/import wallet
  // loginWallet: Function to login
  // getWalletAddress: Function to get current address
});
```

### Cardano Fixture

```typescript
import { test, expect } from '../fixtures/cardano.fixture';

test('example', async ({
  sendTransaction,
  checkBalance,
  delegateStake,
  withdrawRewards
}) => {
  // All wallet fixtures plus:
  // sendTransaction: Send ADA transaction
  // checkBalance: Get wallet balance
  // delegateStake: Delegate to pool
  // withdrawRewards: Withdraw staking rewards
});
```

## Utility Functions

### Cardano Utilities

```typescript
import {
  generateMnemonic,
  isValidCardanoAddress,
  isValidTxHash,
  lovelaceToAda,
  adaToLovelace,
  waitForTxConfirmation,
  getAddressBalance,
  requestFaucetFunds
} from '../utils/cardano.utils';
```

### Extension Utilities

```typescript
import {
  waitForExtensionReady,
  openPopup,
  openOptions,
  getExtensionStorage,
  setExtensionStorage,
  clearExtensionStorage,
  simulateDAppConnection
} from '../utils/extension.utils';
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Extension Configuration
EXTENSION_PATH=../gerowallet/extension

# Network
CARDANO_NETWORK=preprod
CARDANO_NETWORK_ID=0

# Blockfrost API (Required)
BLOCKFROST_API_KEY=your_preprod_api_key
BLOCKFROST_URL=https://cardano-preprod.blockfrost.io/api/v0

# Test Wallets (Generated by setup:wallets)
TEST_WALLET_PASSWORD=TestPassword123!
TEST_WALLET_1_MNEMONIC=your 24 word mnemonic here
TEST_WALLET_1_NAME=Test Wallet 1
TEST_WALLET_2_MNEMONIC=your 24 word mnemonic here
TEST_WALLET_2_NAME=Test Wallet 2

# Testing
HEADLESS=false
DEBUG=false
```

## Test Scenarios

### Wallet Creation Tests

- Load extension successfully
- Create wallet with generated mnemonic
- Import wallet from existing mnemonic
- Reject invalid mnemonic phrases
- Enforce password requirements
- Require matching password confirmation

### Wallet Login Tests

- Login with correct password
- Reject incorrect password
- Maintain session across navigation
- Handle multiple login attempts
- Display wallet information after login

### Transaction Building Tests

- Open send transaction form
- Validate recipient address format
- Accept valid Cardano addresses
- Validate transaction amounts
- Build transaction and show confirmation
- Display transaction fees
- Allow canceling transactions

### Transaction Sending Tests

**Note**: These tests require funded test wallets

- Display current wallet balance
- Send transaction successfully
- Confirm transaction on blockchain
- Reject transactions with insufficient funds
- Reject transactions with wrong password
- Display transaction in history

### Staking Tests

**Note**: These tests require funded test wallets

- Navigate to staking page
- Display pool list
- Search for stake pools
- Display current delegation status
- Display staking rewards
- Delegate to stake pool (optional)
- Withdraw staking rewards (optional)

### DApp Connection Tests

- Inject Cardano API into web pages
- Expose wallet name and icon
- Check if wallet is enabled
- Expose CIP-30 API methods
- Handle multiple dApp connections
- Maintain API after page reload
- Handle API errors gracefully

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build extension
        run: npm run build:extension

      - name: Run tests
        env:
          BLOCKFROST_API_KEY: ${{ secrets.BLOCKFROST_API_KEY }}
          TEST_WALLET_1_MNEMONIC: ${{ secrets.TEST_WALLET_1_MNEMONIC }}
          TEST_WALLET_2_MNEMONIC: ${{ secrets.TEST_WALLET_2_MNEMONIC }}
        run: npm test

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Extension Not Loading

```bash
# Rebuild the extension
cd ../gerowallet
npm run build

# Verify extension exists
ls -la extension/manifest.json
```

### Tests Failing with "Insufficient Funds"

```bash
# Check wallet balance
# Run wallet creation test to get address
npm run test:wallet

# Fund from faucet
# https://docs.cardano.org/cardano-testnet/tools/faucet
```

### Blockfrost API Errors

- Verify API key is for **Preprod** network (not Mainnet)
- Check API key has sufficient requests remaining
- Ensure `BLOCKFROST_URL` matches network (preprod)

### Timeout Errors

```bash
# Run tests in headed mode to see what's happening
npm run test:headed

# Or debug mode for step-by-step execution
npm run test:debug
```

### Extension ID Changes

The extension ID changes each time Chromium creates a new user data directory. This is normal and handled automatically by the fixtures.

## Best Practices

### Writing New Tests

1. **Use Appropriate Fixtures**: Choose the fixture level you need
   - `extension.fixture` - Basic extension loading
   - `wallet.fixture` - Wallet operations
   - `cardano.fixture` - Transaction/staking operations

2. **Handle Async Properly**: Always await Playwright operations
   ```typescript
   await page.click('button');  // ✅ Correct
   page.click('button');        // ❌ Wrong
   ```

3. **Use Flexible Selectors**: Prefer data-testid, then text content, then CSS
   ```typescript
   // Best
   page.locator('[data-testid="send-button"]')

   // Good
   page.locator('button:has-text("Send")')

   // Avoid (brittle)
   page.locator('.v-btn.primary.send-tx')
   ```

4. **Wait for Elements**: Don't assume instant rendering
   ```typescript
   await page.waitForSelector('[data-testid="dashboard"]', {
     timeout: 10000
   });
   ```

5. **Clean Up**: Tests should be independent
   ```typescript
   test.beforeEach(async ({ createWallet }) => {
     // Create fresh wallet for each test
   });
   ```

### Debugging Tests

```bash
# UI Mode (best for development)
npm run test:ui

# Headed Mode (see browser)
npm run test:headed

# Debug Mode (step through)
npm run test:debug

# Run single test
npx playwright test tests/specs/01-wallet-creation.spec.ts

# Run single test case
npx playwright test -g "should create a new wallet"
```

## Security Notes

- **Test wallets only**: Never use test mnemonics with real funds
- **Preprod network**: All tests use Cardano Preprod testnet
- **Git ignore**: `.env` and `config/test-wallets.json` are gitignored
- **API keys**: Use environment variables, never commit keys

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT

## Support

For issues or questions:
- Create an issue in the repository
- Check existing test examples
- Review Playwright documentation: https://playwright.dev

---

**Last Updated**: 2025-01-19