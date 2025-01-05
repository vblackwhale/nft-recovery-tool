# NFT Recovery Tool

Emergency tool to recover NFTs from a compromised wallet. Works on Polygon and can be adapted for other EVM chains.

Author: blackwhale.eth

This tool was developed to successfully recover NFTs from a compromised wallet that was being monitored by a sweeper bot. You can view the compromised wallet here:
https://polygonscan.com/address/0x6f278db79a32ae52d57c4f10a737879c3a615c84

## Strategy

The recovery process has three phases:

1. **Disperse**: Fund multiple deterministic wallets derived from a secure wallet
2. **Approve**: Spam approval transactions from compromised wallet using multiple RPCs (check success on Polygonscan)
3. **Extract**: Transfer NFTs to secure wallet once approval is confirmed

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env`:
```env
MAIN_RPC_URL=your_rpc_url
SAVER_WALLET_PK=your_secure_wallet_pk
COMPROMISED_WALLET_PK=compromised_wallet_pk
```

3. Add RPC endpoints to `providers.ts`. Get more from [Chainlist](https://chainlist.org/chain/137)

## Usage

1. Run disperse script to fund derived wallets:
```bash
npm run disperse
```

2. Start approval spam:
```bash
npm run approve
```

3. Check Polygonscan for successful approval

4. Run transfer script:
```bash
npm run extract
```

## Important Notes

- Have sufficient MATIC in secure wallet for gas
- Uses high gas price for speed
- Check Polygonscan to confirm approval before extracting
- Can be modified for other EVM chains by changing RPC endpoints

## Security

- Run on secure machine
- Never share private keys
- Verify all addresses before running

## License

MIT