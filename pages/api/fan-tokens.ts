import type { NextApiRequest, NextApiResponse } from 'next';
import { ChilizAgent } from 'chiliz-agent-kit';

// Fan token contract addresses on Chiliz testnet
const FAN_TOKEN_ADDRESSES: { [key: string]: string } = {
    'PSG': '0xb0Fa395a3386800658B9617F90e834E2CeC76Dd3', // Testnet PSG address
    'SPURS': '0x9B9C9AAa74678FcF4E1c76eEB1fa969A8E7254f8',
    'BAR': '0x7F73C50748560BD2B286a4c7bF6a805cFb6f735d',
    'ACM': '0x641d040dB51398Ba3a4f2d7839532264EcdCc3aE',
    'OG': '0xEc1C46424E20671d9b21b9336353EeBcC8aEc7b5',
    'CITY': '0x66F80ddAf5ccfbb082A0B0Fae3F21eA19f6B88ef',
    'AFC': '0x44B190D30198F2E585De8974999a28f5c68C6E0F',
    'MENGO': '0x1CC71168281dd78fF004ba6098E113bbbCBDc914',
    'JUV': '0x945EeD98f5CBada87346028aD0BeE0eA66849A0e',
    'NAP': '0x8DBe49c4Dcde110616fafF53b39270E1c48F861a',
    'ATM': '0xc926130FA2240e16A41c737d54c1d9b1d4d45257'
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { address, club } = req.query;

    if (!address || !club) {
        return res.status(400).json({ error: 'Address and club are required' });
    }

    try {
        const clubName = (club as string).toUpperCase();
        const userAddress = address as string;

        // Check if club is supported
        if (!FAN_TOKEN_ADDRESSES[clubName]) {
            return res.status(400).json({ error: 'Unsupported club' });
        }

        // Use Chiliz Agent Kit to fetch fan tokens
        const rpcUrl = 'https://spicy-rpc.chiliz.com'; // Testnet RPC URL
        const privateKey = process.env.PRIVATE_KEY || '';

        if (!privateKey) {
            console.error('Missing PRIVATE_KEY environment variable');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Create provider directly for token balance checking
        const { ethers } = require('ethers');
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        
        // Get the token contract address for the specific club
        const tokenAddress = FAN_TOKEN_ADDRESSES[clubName];
        
        console.log(`Checking balance for ${clubName} tokens (TESTNET):`);
        console.log(`- User address: ${userAddress}`);
        console.log(`- Token contract: ${tokenAddress}`);
        console.log(`- RPC URL: ${rpcUrl}`);
        
        // Create token contract instance
        const tokenContract = new ethers.Contract(
            tokenAddress,
            ['function balanceOf(address owner) view returns (uint256)'],
            provider
        );
        
        // Fetch token balance
        const tokenBalance = await tokenContract.balanceOf(userAddress);
        
        console.log(`Raw token balance: ${tokenBalance.toString()}`);
        
        // Return the raw balance directly since formatting is causing issues
        const balance = parseFloat(tokenBalance.toString());
        
        console.log(`Fan token balance for ${clubName}: ${balance} (raw: ${tokenBalance})`);
        
        return res.status(200).json({
            balance: balance,
            source: 'chiliz_testnet',
            club: clubName,
            tokenAddress: tokenAddress,
            userAddress: userAddress,
            rawBalance: tokenBalance.toString()
        });

    } catch (error) {
        console.error('Fan token check error:', error);
        
        // Fallback to mock data for development/demo
        const mockBalance = Math.floor(Math.random() * 20);
        
        return res.status(200).json({
            balance: mockBalance,
            source: 'mock_data_fallback',
            note: 'Using mock data due to error in Chiliz Agent Kit integration',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
} 