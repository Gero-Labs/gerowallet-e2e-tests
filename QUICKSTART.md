# Quick Start Guide

Get up and running with GeroWallet E2E tests in 5 minutes.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] GeroWallet repository cloned (sibling directory to this project)
- [ ] Blockfrost account created at https://blockfrost.io

## Setup Steps

### 1. Install Dependencies (1 min)

```bash
cd gerowallet-e2e-tests
npm install
```

### 2. Build Extension (2 min)

```bash
npm run build:extension
```

This will build the GeroWallet extension from the sibling directory.

### 3. Configure Environment (1 min)

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Blockfrost API key
nano .env  # or use your preferred editor
```

**Required**: Add your Blockfrost Preprod API key:
```
BLOCKFROST_API_KEY=preprod1234567890abcdef...
```

### 4. Generate Test Wallets (30 sec)

```bash
npm run setup:wallets
```

This generates two test wallet mnemonics and saves them to your `.env` file.

### 5. Run Basic Tests (1 min)

```bash
# Test wallet creation and login (doesn't require funds)
npm run test:wallet
```

## Running Tests Without Funds

These tests work without funding wallets:

```bash
# Wallet creation and login
npm run test:wallet

# DApp connector API
npm run test:dapp
```

## Running Tests With Funds

For transaction and staking tests, you need to fund your test wallet:

### 1. Get Wallet Address

Run the wallet creation test to create a wallet and get its address:

```bash
npm run test:wallet
```

Look for the wallet address in the test output.

### 2. Request Testnet Funds

1. Go to https://docs.cardano.org/cardano-testnet/tools/faucet
2. Enter your test wallet address
3. Request 1000 tADA (testnet ADA)
4. Wait 1-2 minutes for confirmation

### 3. Run Transaction Tests

```bash
# All transaction tests
npm run test:transactions

# All tests (including staking)
npm test
```

## Useful Commands

```bash
# Run tests with UI (interactive mode)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run specific test file
npx playwright test tests/specs/01-wallet-creation.spec.ts

# Run single test by name
npx playwright test -g "should create a new wallet"

# Debug mode (step through tests)
npm run test:debug

# View last test report
npm run report
```

## Troubleshooting

### Extension Not Found

```bash
# Rebuild extension
npm run build:extension

# Or manually
cd ../gerowallet
npm install
npm run build
```

### Tests Timing Out

```bash
# Run in headed mode to see what's happening
npm run test:headed
```

### Blockfrost Errors

- Make sure you're using a **Preprod** API key (not Mainnet)
- Check your API key has remaining requests
- Verify the key is correctly set in `.env`

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Explore test examples in `tests/specs/`
- Check fixture utilities in `tests/fixtures/`
- Review Cardano utilities in `tests/utils/`

## Test Coverage

| Test Suite | Requires Funds | Description |
|------------|----------------|-------------|
| Wallet Creation | ❌ No | Create/import wallets, validation |
| Wallet Login | ❌ No | Authentication, password checks |
| Transaction Build | ❌ No | UI validation, address checks |
| Transaction Send | ✅ Yes | Actual transactions on blockchain |
| Staking | ✅ Yes | Pool delegation, rewards |
| DApp Connection | ❌ No | CIP-30 API, connector testing |

## Quick Reference

```bash
# Environment setup
cp .env.example .env           # Create environment file
npm run setup:wallets          # Generate test wallets
npm run build:extension        # Build GeroWallet

# Running tests
npm test                       # All tests
npm run test:wallet           # Wallet tests only
npm run test:transactions     # Transaction tests
npm run test:ui               # Interactive mode
npm run test:headed           # See browser

# Debugging
npm run test:debug            # Debug mode
npm run report                # View report
npx playwright test --help    # More options
```

---

**Ready to test?** Start with `npm run test:wallet` to verify everything is working!