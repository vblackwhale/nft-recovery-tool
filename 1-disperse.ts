import { ethers } from 'ethers';
import { wallets } from './wallets';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Validate required environment variables
if (!process.env.SAVER_WALLET_PK)
	throw Error('SAVER_WALLET_PK not found in .env');
if (!process.env.MAIN_RPC_URL) throw Error('MAIN_RPC_URL not found in .env');

// Initialize provider for Polygon network
const provider = new ethers.providers.JsonRpcProvider(process.env.MAIN_RPC_URL);

// Create funder wallet from the SAVER wallet private key
// This wallet will be used to distribute funds to all generated wallets
const funderWallet = new ethers.Wallet(process.env.SAVER_WALLET_PK, provider);

// Disperse contract is used to efficiently send MATIC to multiple addresses in one transaction
// This saves gas compared to sending individual transactions to each wallet
const DISPERSE_CONTRACT_ADDRESS = '0xD152f549545093347A162Dce210e7293f1452150';
const disperseABI = [
	'function disperseEther(address[] recipients, uint256[] values) external payable',
];

/**
 * Generates deterministic wallets and funds them with MATIC using the Disperse contract
 * @param funderWallet - Wallet used to fund the new wallets
 * @param provider - Ethereum provider (Polygon network)
 * @param numWallets - Number of wallets to generate and fund (default: 50)
 * @returns Array of funded Ethereum wallets
 */
async function generateAndFundWallets(
	funderWallet: ethers.Wallet,
	provider: ethers.providers.JsonRpcProvider,
	numWallets: number = 50
): Promise<ethers.Wallet[]> {
	// Initialize the Disperse contract
	const disperseContract = new ethers.Contract(
		DISPERSE_CONTRACT_ADDRESS,
		disperseABI,
		provider
	);

	// Get addresses of all generated wallets
	const recipients = wallets.map((w) => w.address);

	// Set amount to send to each wallet (0.04 MATIC)
	const valuePerWallet = ethers.utils.parseEther('0.04');
	const values = Array(numWallets).fill(valuePerWallet);
	const totalValue = valuePerWallet.mul(numWallets);

	try {
		// Send MATIC to all wallets in a single transaction using Disperse contract
		const tx = await disperseContract
			.connect(funderWallet)
			.disperseEther(recipients, values, {
				value: totalValue,
				gasLimit: 3000000,
				gasPrice: ethers.utils.parseUnits('120', 'gwei'), // Set high gas price for faster confirmation
			});

		// Wait for transaction confirmation
		await tx.wait();
		console.log(
			`Successfully funded ${numWallets} wallets with 0.04 MATIC each`
		);

		return wallets;
	} catch (error) {
		console.error('Error funding wallets:', error);
		throw error;
	}
}

/**
 * Main function to setup and fund the wallets
 * Generates wallets, funds them, and logs their addresses
 */
async function setupWallets() {
	try {
		const wallets = await generateAndFundWallets(funderWallet, provider);
		console.log('Generated wallet addresses:');
		wallets.forEach((wallet, index) => {
			console.log(`Wallet ${index + 1}: ${wallet.address}`);
		});
		return wallets;
	} catch (error) {
		console.error('Setup failed:', error);
	}
}

// Execute the wallet setup process
setupWallets().catch((error) => {
	console.error(error);
	process.exit(1);
});
