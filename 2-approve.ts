import { ethers } from 'ethers';
import { wallets } from './wallets';
import { defaultProvider, allProviders } from './providers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.SAVER_WALLET_PK)
	throw Error('SAVER_WALLET_PK not found in .env');
if (!process.env.COMPROMISED_WALLET_PK)
	throw Error('COMPROMISED_WALLET_PK not found in .env');

// Contract constants
const NFT_CONTRACT_ADDRESS = '0x93C46aA4DdfD0413d95D0eF3c478982997cE9861';
const ERC721_ABI = [
	'function setApprovalForAll(address operator, bool approved) external',
	'function isApprovedForAll(address owner, address operator) external view returns (bool)',
];

// Initialize wallets with provider
const saverWallet = new ethers.Wallet(
	process.env.SAVER_WALLET_PK,
	defaultProvider
);
const compromisedWallet = new ethers.Wallet(
	process.env.COMPROMISED_WALLET_PK,
	defaultProvider
);

/**
 * Sends MATIC from multiple wallets to a target address
 * Uses block events to time the transactions
 * @param wallets Array of source wallets
 * @param toAddress Destination address
 * @param provider Ethereum provider
 * @param checkResult Whether to verify transaction success
 */
async function sendPolyFromMultipleWallets(
	wallets: ethers.Wallet[],
	toAddress: string,
	provider: ethers.providers.Provider,
	checkResult: boolean = false
): Promise<void> {
	let successfulTransfers = 0;
	const amount = ethers.utils.parseEther('0.003');
	let index = 0;

	provider.on('block', async (blockNumber) => {
		if (successfulTransfers >= 4) return;

		console.log('Processing wallets at index:', index);
		const [walletA, walletB] = [wallets[index], wallets[index + 1]];
		index += 2;

		try {
			// Send transactions in parallel
			await Promise.all([
				walletA.sendTransaction({
					to: toAddress,
					value: amount,
					gasPrice: ethers.utils.parseUnits('100', 'gwei'),
				}),
				walletB.sendTransaction({
					to: toAddress,
					value: amount,
					gasPrice: ethers.utils.parseUnits('100', 'gwei'),
				}),
			]);
		} catch (error: any) {
			console.log(`Block ${blockNumber}: Transfer failed`, error.message);
		}

		successfulTransfers++;
	});
}

/**
 * Attempts to set NFT approval across multiple providers
 * Broadcasts signed transactions to multiple RPC endpoints for redundancy
 * @param wallet Wallet to set approvals from
 * @param nftContractAddress NFT contract address
 * @param approveAddress Address to approve
 * @param providers Array of providers to broadcast to
 */
async function setApprovalAcrossProviders(
	wallet: ethers.Wallet,
	nftContractAddress: string,
	approveAddress: string,
	providers: ethers.providers.Provider[]
): Promise<void> {
	setInterval(async () => {
		try {
			console.log('Starting new approval batch');
			const currentNonce = await wallet.getTransactionCount();

			// Create approval transaction data
			const nftInterface = new ethers.utils.Interface(ERC721_ABI);
			const data = nftInterface.encodeFunctionData('setApprovalForAll', [
				approveAddress,
				true,
			]);

			// Sign multiple transactions with incrementing nonces
			const signedTransactions = await Promise.all(
				[0, 1, 2].map(async (nonceOffset) => {
					const tx = {
						to: nftContractAddress,
						data: data,
						gasPrice: ethers.utils.parseUnits('100', 'gwei'),
						gasLimit: 60000,
						type: 0,
						nonce: currentNonce + nonceOffset,
					};
					return wallet.signTransaction(tx);
				})
			);

			// Broadcast to all providers
			const broadcasts = signedTransactions.flatMap((signedTx) =>
				providers.map(async (provider) => {
					try {
						return await provider.sendTransaction(signedTx);
					} catch (error: any) {
						return null;
					}
				})
			);

			await Promise.allSettled(broadcasts);
		} catch (error: any) {
			console.log('Transaction creation failed:', error.message);
		}
	}, 500);
}

/**
 * Main execution function
 * Handles both MATIC transfers and NFT approvals
 */
async function main() {
	try {
		console.log('Starting continuous MATIC transfers...');
		await sendPolyFromMultipleWallets(
			wallets,
			compromisedWallet.address,
			defaultProvider,
			true
		);

		console.log('Starting continuous NFT approvals...');
		await setApprovalAcrossProviders(
			compromisedWallet,
			NFT_CONTRACT_ADDRESS,
			saverWallet.address,
			allProviders
		);

		// Handle graceful shutdown
		process.stdin.resume();
		process.on('SIGINT', () => {
			console.log('Stopping script...');
			defaultProvider.removeAllListeners();
			process.exit();
		});
	} catch (error: any) {
		console.error('Error:', error);
		process.exit(1);
	}
}

// Execute script
main().catch((error) => {
	console.error(error);
	process.exit(1);
});
