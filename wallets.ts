import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
if (!process.env.SAVER_WALLET_PK)
	throw Error('SAVER_WALLET_PK not found in .env');
if (!process.env.MAIN_RPC_URL) throw Error('MAIN_RPC_URL not found in .env');

/**
 * Generates an array of deterministic private keys by modifying the last 4 characters
 * of a base private key. This creates a sequence of related but unique private keys.
 * @param basePk - Base private key to derive others from
 * @returns Array of private keys
 */
function generatePks(basePk: string): string[] {
	const pks: string[] = [];
	for (let i = 0; i < 40; i++) {
		// Convert counter to hex and pad with zeros to ensure 4 characters
		const suffix = i.toString(16).padStart(4, '0');
		// Replace last 4 characters of base pk with new suffix
		const newPk = basePk.slice(0, -4) + suffix;
		// Skip if generated pk is identical to base pk
		if (newPk.toLowerCase() === basePk.toLowerCase()) continue;
		pks.push(newPk);
	}
	return pks;
}

// Generate private keys from the saver wallet's private key
const privateKeys = generatePks(process.env.SAVER_WALLET_PK);

// Initialize provider for network access
const provider = new ethers.providers.JsonRpcProvider(process.env.MAIN_RPC_URL);

// Create wallet instances for each private key, connected to the provider
export const wallets = privateKeys.map((pk) => new ethers.Wallet(pk, provider));

/**
 * Optional utility to check MATIC balances of all generated wallets
 * Uncomment and use for debugging or verification purposes
 */
// async function checkBalances(wallets: ethers.Wallet[]): Promise<void> {
//   for (const [i, wallet] of wallets.entries()) {
//     const balance = await wallet.getBalance();
//     console.log(
//       `${i} - ${wallet.address}: ${ethers.utils.formatEther(balance)} MATIC`
//     );
//   }
// }
// checkBalances(wallets);
