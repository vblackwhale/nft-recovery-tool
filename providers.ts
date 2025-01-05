import { ethers } from 'ethers';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

if (!process.env.MAIN_RPC_URL) throw Error('MAIN_RPC_URL not found in .env');

// Collection of HTTP RPC endpoints for Polygon network
const httpUrls = [
	'https://polygon.llamarpc.com',
	'https://polygon.meowrpc.com',
	'https://rpc-mainnet.matic.quiknode.pro',
	'https://rpc.ankr.com/polygon',
	'https://polygon-bor-rpc.publicnode.com',
	'https://polygon.drpc.org',
	'https://polygon.rpc.subquery.network/public',
	'https://polygon.api.onfinality.io/public',
	'https://endpoints.omniatech.io/v1/matic/mainnet/public',
	'https://polygon-mainnet.public.blastapi.io',
	'https://polygon.lava.build',
	'https://go.getblock.io/02667b699f05444ab2c64f9bff28f027',
	'https://api.zan.top/polygon-mainnet',
	'https://polygon-rpc.com',
	'https://polygon.gateway.tenderly.co',
	'https://1rpc.io/matic',
	'https://gateway.tenderly.co/public/polygon',
	'https://polygon-pokt.nodies.app',
	'https://polygon-mainnet.rpcfast.com',
	'https://polygon-mainnet.g.alchemy.com/v2/demo',
	'https://polygon.rpc.blxrbdn.com',
	'https://public.stackup.sh/api/v1/node/polygon-mainnet',
	'https://polygon-mainnet.gateway.tatum.io',
	'https://polygon-mainnet.4everland.org/v1/37fa9972c1b1cd5fab542c7bdd4cde2f',
	'https://node.histori.xyz/matic-mainnet/8ry9f6t9dct1se2hlagxnd9n2a',
	'https://rpc-mainnet.matic.network',
	'https://matic-mainnet.chainstacklabs.com',
	'https://rpc-mainnet.maticvigil.com',
	'https://matic-mainnet-full-rpc.bwarelabs.com',
];

// Collection of WebSocket RPC endpoints for Polygon network
const wsUrls = [
	'wss://polygon-bor-rpc.publicnode.com',
	'wss://polygon.gateway.tenderly.co',
	'wss://polygon.drpc.org',
];

// Initialize HTTP providers with Polygon network configuration
const httpProviders = httpUrls.map(
	(url) =>
		new ethers.providers.JsonRpcProvider(url, {
			name: 'polygon',
			chainId: 137,
		})
);

// Initialize WebSocket providers with Polygon network configuration
const wsProviders = wsUrls.map(
	(url) =>
		new ethers.providers.WebSocketProvider(url, {
			name: 'polygon',
			chainId: 137,
		})
);

// Combine all providers for maximum redundancy
export const allProviders = [...httpProviders, ...wsProviders];

// Export default provider for basic operations
export const defaultProvider = new ethers.providers.JsonRpcProvider(
	process.env.MAIN_RPC_URL,
	{
		name: 'polygon',
		chainId: 137,
	}
);
