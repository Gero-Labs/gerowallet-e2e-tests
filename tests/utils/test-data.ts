/**
 * Test data and constants
 */

// Test wallet configuration
export const TEST_WALLET_PASSWORD = process.env.TEST_WALLET_PASSWORD || 'TestPassword123!';

// Test wallet 1 (primary test wallet)
export const TEST_WALLET_1 = {
  name: process.env.TEST_WALLET_1_NAME || 'Test Wallet 1',
  mnemonic: process.env.TEST_WALLET_1_MNEMONIC || '',
  password: TEST_WALLET_PASSWORD,
};

// Test wallet 2 (secondary test wallet for transfers)
export const TEST_WALLET_2 = {
  name: process.env.TEST_WALLET_2_NAME || 'Test Wallet 2',
  mnemonic: process.env.TEST_WALLET_2_MNEMONIC || '',
  password: TEST_WALLET_PASSWORD,
};

// Network configuration
export const NETWORK = {
  name: process.env.CARDANO_NETWORK || 'preprod',
  id: parseInt(process.env.CARDANO_NETWORK_ID || '0', 10),
  magic: 1, // Preprod network magic
};

// Blockfrost configuration
export const BLOCKFROST = {
  apiKey: process.env.BLOCKFROST_API_KEY || '',
  url: process.env.BLOCKFROST_URL || 'https://cardano-preprod.blockfrost.io/api/v0',
};

// Test transaction amounts
export const TEST_AMOUNTS = {
  minTransfer: 1.5, // Minimum ADA transfer (1 ADA + fees)
  smallTransfer: 5, // Small test transfer
  mediumTransfer: 10, // Medium test transfer
  largeTransfer: 50, // Large test transfer
};

// Test pool IDs (Preprod testnet pools)
export const TEST_POOLS = {
  // Add known preprod pool IDs here
  pool1: 'pool1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq', // Replace with real preprod pool
  pool2: 'pool1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq', // Replace with real preprod pool
};

// Timeouts
export const TIMEOUTS = {
  extensionLoad: 30000,
  walletCreation: 30000,
  walletLogin: 30000,
  transactionBuild: 15000,
  transactionSign: 15000,
  transactionSubmit: 30000,
  transactionConfirmation: 300000, // 5 minutes for blockchain confirmation
  balanceUpdate: 60000,
  stakingOperation: 30000,
  dappConnection: 15000,
};

// Test addresses (Preprod testnet)
export const TEST_ADDRESSES = {
  // Faucet return address (safe to send test funds)
  faucetReturn: 'addr_test1qz...',
  // Add other test addresses as needed
};

// DApp URLs for testing
export const DAPP_URLS = {
  testDapp: 'https://example.com',
  // Add real DApp URLs for integration testing
};

// Error messages to validate
export const EXPECTED_ERRORS = {
  invalidPassword: 'Invalid password',
  insufficientFunds: 'Insufficient funds',
  invalidAddress: 'Invalid address',
  networkError: 'Network error',
  transactionTooLarge: 'Transaction too large',
};

// Success messages to validate
export const EXPECTED_SUCCESS = {
  walletCreated: 'Wallet created successfully',
  transactionSent: 'Transaction sent successfully',
  stakingDelegated: 'Delegation successful',
  rewardsWithdrawn: 'Rewards withdrawn successfully',
};

// UI selectors (common patterns in GeroWallet)
export const SELECTORS = {
  // Welcome/Onboarding
  welcomeScreen: '[data-testid="welcome-screen"], .welcome-container',
  createWalletButton: 'button:has-text("Create Wallet")',
  importWalletButton: 'button:has-text("Import Wallet"), button:has-text("Restore Wallet")',

  // Wallet Creation
  walletNameInput: 'input[type="text"]:visible, input[placeholder*="name" i]:visible',
  mnemonicInput: 'textarea:visible, input[placeholder*="phrase" i]:visible',
  passwordInput: 'input[type="password"]:visible',
  termsCheckbox: 'input[type="checkbox"]:visible',
  submitButton: 'button[type="submit"]:visible',

  // Login
  loginScreen: '[data-testid="login-screen"], .login-container',
  loginButton: 'button:has-text("Login"), button:has-text("Unlock")',

  // Dashboard
  dashboard: '[data-testid="dashboard"], .dashboard-container',
  balance: '[data-testid="wallet-balance"], .balance, .total-balance',
  walletAddress: '[data-testid="wallet-address"], .wallet-address',

  // Transactions
  sendButton: 'button:has-text("Send"), a:has-text("Send")',
  receiveButton: 'button:has-text("Receive")',
  sendForm: '[data-testid="send-form"], .send-container',
  recipientInput: 'input[placeholder*="address" i]:visible',
  amountInput: 'input[type="number"]:visible, input[placeholder*="amount" i]:visible',
  confirmTransaction: '[data-testid="confirm-transaction"], .confirm-container',
  transactionSuccess: '[data-testid="transaction-success"], .success-message',
  transactionHash: '[data-testid="tx-hash"], .tx-hash, code:visible',

  // Staking
  stakingPage: '[data-testid="staking-page"], .staking-container',
  stakingButton: 'button:has-text("Staking"), a:has-text("Staking")',
  poolSearch: 'input[placeholder*="pool" i]:visible',
  delegateButton: 'button:has-text("Delegate")',
  withdrawButton: 'button:has-text("Withdraw")',

  // DApp Connection
  dappConnectionRequest: '[data-testid="dapp-connection"], .dapp-request',
  approveButton: 'button:has-text("Approve"), button:has-text("Connect")',
  rejectButton: 'button:has-text("Reject"), button:has-text("Cancel")',
};