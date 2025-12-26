import { ethers } from 'ethers';

const TESTNET_API = 'https://api.hyperliquid-testnet.xyz';
const PRIVATE_KEY = '0x5acb7972c58bfea55f8d4b032727c1ffa7f7116bc189ce1e79f0917f0fc15e47';

async function claimTestnetFunds() {
  try {
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('Wallet address:', wallet.address);
    
    // Try to claim testnet funds
    const response = await fetch(`${TESTNET_API}/faucet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: wallet.address,
      }),
    });
    
    const result = await response.json();
    console.log('Faucet response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Successfully claimed testnet funds!');
    } else {
      console.log('❌ Failed to claim:', result);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

claimTestnetFunds();
