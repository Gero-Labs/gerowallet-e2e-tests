import * as bip39 from 'bip39';

/**
 * Cardano utility functions for testing
 */

/**
 * Generate a new mnemonic phrase (24 words)
 */
export function generateMnemonic(): string {
  return bip39.generateMnemonic(256); // 24 words
}

/**
 * Validate a Cardano address format
 */
export function isValidCardanoAddress(address: string): boolean {
  // Basic validation for Cardano addresses
  // Mainnet: starts with addr1
  // Testnet: starts with addr_test1
  const mainnetRegex = /^addr1[a-z0-9]{98}$/;
  const testnetRegex = /^addr_test1[a-z0-9]{98}$/;

  return mainnetRegex.test(address) || testnetRegex.test(address);
}

/**
 * Validate a Cardano stake address format
 */
export function isValidStakeAddress(address: string): boolean {
  // Mainnet stake: starts with stake1
  // Testnet stake: starts with stake_test1
  const mainnetRegex = /^stake1[a-z0-9]{53}$/;
  const testnetRegex = /^stake_test1[a-z0-9]{53}$/;

  return mainnetRegex.test(address) || testnetRegex.test(address);
}

/**
 * Validate a transaction hash format
 */
export function isValidTxHash(hash: string): boolean {
  // Transaction hash: 64 hex characters
  const txHashRegex = /^[a-f0-9]{64}$/i;
  return txHashRegex.test(hash);
}

/**
 * Validate a pool ID format
 */
export function isValidPoolId(poolId: string): boolean {
  // Pool ID: starts with pool1 followed by bech32 characters
  const poolIdRegex = /^pool1[a-z0-9]{51}$/;
  return poolIdRegex.test(poolId);
}

/**
 * Convert lovelace to ADA
 */
export function lovelaceToAda(lovelace: number | string): number {
  const amount = typeof lovelace === 'string' ? parseInt(lovelace, 10) : lovelace;
  return amount / 1_000_000;
}

/**
 * Convert ADA to lovelace
 */
export function adaToLovelace(ada: number): number {
  return Math.floor(ada * 1_000_000);
}

/**
 * Format ADA amount for display
 */
export function formatAda(ada: number, decimals: number = 2): string {
  return ada.toFixed(decimals);
}

/**
 * Wait for transaction confirmation on blockchain
 * @param txHash Transaction hash to monitor
 * @param blockfrostApiKey Blockfrost API key
 * @param maxAttempts Maximum number of attempts (default: 30)
 * @param intervalMs Interval between checks in milliseconds (default: 10000)
 */
export async function waitForTxConfirmation(
  txHash: string,
  blockfrostApiKey: string,
  maxAttempts: number = 30,
  intervalMs: number = 10000
): Promise<boolean> {
  const blockfrostUrl = process.env.BLOCKFROST_URL || 'https://cardano-preprod.blockfrost.io/api/v0';

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${blockfrostUrl}/txs/${txHash}`, {
        headers: {
          'project_id': blockfrostApiKey
        }
      });

      if (response.ok) {
        console.log(`✓ Transaction confirmed: ${txHash}`);
        return true;
      }

      if (response.status === 404) {
        // Transaction not yet on blockchain, wait and retry
        console.log(`Waiting for transaction confirmation... (${i + 1}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        continue;
      }

      // Other error
      console.error(`Error checking transaction: ${response.status} ${response.statusText}`);
      return false;
    } catch (error) {
      console.error('Error checking transaction:', error);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  console.error(`Transaction not confirmed after ${maxAttempts} attempts`);
  return false;
}

/**
 * Get UTxOs for an address
 */
export async function getAddressUtxos(
  address: string,
  blockfrostApiKey: string
): Promise<any[]> {
  const blockfrostUrl = process.env.BLOCKFROST_URL || 'https://cardano-preprod.blockfrost.io/api/v0';

  try {
    const response = await fetch(`${blockfrostUrl}/addresses/${address}/utxos`, {
      headers: {
        'project_id': blockfrostApiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch UTxOs: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching UTxOs:', error);
    return [];
  }
}

/**
 * Get address balance
 */
export async function getAddressBalance(
  address: string,
  blockfrostApiKey: string
): Promise<number> {
  const utxos = await getAddressUtxos(address, blockfrostApiKey);

  const totalLovelace = utxos.reduce((sum, utxo) => {
    const lovelaceAmount = utxo.amount.find((a: any) => a.unit === 'lovelace');
    return sum + (lovelaceAmount ? parseInt(lovelaceAmount.quantity, 10) : 0);
  }, 0);

  return lovelaceToAda(totalLovelace);
}

/**
 * Request testnet ADA from faucet
 */
export async function requestFaucetFunds(
  address: string,
  faucetApiKey?: string
): Promise<boolean> {
  const faucetUrl = process.env.FAUCET_URL || 'https://faucet.preprod.world.dev.cardano.org/send-money';

  try {
    const response = await fetch(faucetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(faucetApiKey && { 'X-API-Key': faucetApiKey })
      },
      body: JSON.stringify({ address })
    });

    if (response.ok) {
      console.log(`✓ Faucet funds requested for ${address.slice(0, 20)}...`);
      return true;
    }

    console.error(`Faucet request failed: ${response.status} ${response.statusText}`);
    return false;
  } catch (error) {
    console.error('Error requesting faucet funds:', error);
    return false;
  }
}