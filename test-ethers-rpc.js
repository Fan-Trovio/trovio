const { ethers } = require('ethers');

async function main() {
  const rpcUrl = 'https://spicy-rpc.chiliz.com';
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  try {
    const network = await provider.getNetwork();
    console.log('Network:', network);
  } catch (err) {
    console.error('Error:', err);
  }
}

main(); 