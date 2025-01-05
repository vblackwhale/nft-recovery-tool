import { ethers, BigNumber } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
if (!process.env.MAIN_RPC_URL) throw Error('MAIN_RPC_URL not found in .env');
if (!process.env.COMPROMISED_WALLET_PK)
	throw Error('COMPROMISED_WALLET_PK not found in .env');
if (!process.env.SAVER_WALLET_PK)
	throw Error('SAVER_WALLET_PK not found in .env');

// NFT Contract configuration
const NFT_CONTRACT_ADDRESS = '0x93C46aA4DdfD0413d95D0eF3c478982997cE9861';

// Minimal ERC721Enumerable interface - only including required functions
const ERC721EnumerableABI = [
	'function balanceOf(address owner) view returns (uint256)',
	'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
	'function isApprovedForAll(address owner, address operator) view returns (bool)',
	'function transferFrom(address from, address to, uint256 tokenId)',
	'function getApproved(address tokenId) view returns (address)',
];

/**
 * Transfers all NFTs from compromised wallet to saver wallet
 * @param providerUrl RPC endpoint URL
 * @param contractAddress NFT contract address
 * @param compromisedWalletPk Private key of the compromised wallet
 * @param saverWalletPk Private key of the saver wallet
 */
async function transferAllTokens(
	providerUrl: string,
	contractAddress: string,
	compromisedWalletPk: string,
	saverWalletPk: string
) {
	try {
		// Initialize provider and wallets
		const provider = new ethers.providers.JsonRpcProvider(providerUrl);
		const compromisedWallet = new ethers.Wallet(compromisedWalletPk, provider);
		const saverWallet = new ethers.Wallet(saverWalletPk, provider);

		// Get wallet addresses
		const compromisedAddress = compromisedWallet.address;
		const saverAddress = saverWallet.address;

		// Initialize contract instance
		const contract = new ethers.Contract(
			contractAddress,
			ERC721EnumerableABI,
			provider
		);

		// Check token balance of compromised wallet
		const balance = await contract.balanceOf(compromisedAddress);
		console.log(`Compromised wallet has ${balance.toString()} tokens`);

		if (balance.eq(0)) {
			console.log('No tokens to transfer');
			return;
		}

		// Verify approval status
		const isApprovedForAll = await contract.isApprovedForAll(
			compromisedAddress,
			saverAddress
		);
		console.log('Approval status for all tokens:', isApprovedForAll);

		// Fetch all token IDs owned by compromised wallet
		const tokenIds: BigNumber[] = [];
		for (let i = 0; i < balance; i++) {
			const tokenId = await contract.tokenOfOwnerByIndex(compromisedAddress, i);
			tokenIds.push(tokenId as BigNumber);
		}
		console.log(`Found ${tokenIds.length} tokens to transfer`);
		console.log(
			'Token IDs:',
			tokenIds.map((id) => id.toString())
		);

		// Connect contract with saver wallet for transfers
		const contractWithSigner = contract.connect(saverWallet);

		// Transfer tokens one by one
		for (const tokenId of tokenIds) {
			try {
				console.log(`Initiating transfer for token ID ${tokenId}...`);
				const tx = await contractWithSigner.transferFrom(
					compromisedAddress,
					saverAddress,
					tokenId,
					{
						gasPrice: ethers.utils.parseUnits('100', 'gwei'), // High gas price for faster confirmation
					}
				);
				await tx.wait();
				console.log(`✓ Successfully transferred token ID ${tokenId}`);
			} catch (error: any) {
				console.error(
					`✗ Failed to transfer token ID ${tokenId}:`,
					error.message
				);
			}
		}
		console.log('Transfer process completed');
	} catch (error: any) {
		console.error('Critical error in transfer process:', error);
		throw error;
	}
}

// Execute transfer process
transferAllTokens(
	process.env.MAIN_RPC_URL,
	NFT_CONTRACT_ADDRESS,
	process.env.COMPROMISED_WALLET_PK,
	process.env.SAVER_WALLET_PK
)
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
