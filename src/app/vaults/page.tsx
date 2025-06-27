"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { db, Vault } from '@/lib/database';

export default function VaultsPage() {
    const router = useRouter();
    const { isConnected } = useAccount();
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch vaults from database
    useEffect(() => {
        const fetchVaults = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const fetchedVaults = await db.getAllVaults();
                setVaults(fetchedVaults);
                console.log('Fetched vaults:', fetchedVaults);
            } catch (err) {
                console.error('Error fetching vaults:', err);
                setError('Failed to load vaults');
            } finally {
                setIsLoading(false);
            }
        };

        fetchVaults();
    }, []);

    const handleVaultClick = (vaultId: number) => {
        router.push(`/vaults/verification?id=${vaultId}`);
    };

    const formatSponsorAddress = (address: string) => {
        if (!address) return 'Unknown';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                .font-pixel {
                    font-family: 'Press Start 2P', 'Fira Mono', monospace;
                }
            `}</style>
            <div className="min-h-screen w-full bg-black flex flex-col items-center overflow-hidden relative font-sans">
                {/* Tiny grid background */}
                <div
                    className="pointer-events-none absolute inset-0 z-0"
                    style={{
                        backgroundImage: "linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
                        backgroundSize: "10px 10px",
                    }}
                />
                {/* Header */}
                <header className="w-full max-w-7xl flex items-center justify-between px-12 pt-8 pb-4 z-10">
                    <div className="flex items-center gap-3">
                        <span 
                            className="text-purple-400 text-3xl font-extrabold tracking-widest font-pixel cursor-pointer"
                            onClick={() => router.push('/')}
                        >
                            TROVIO
                        </span>
                    </div>
                    <div className="flex items-center gap-8">
                        <nav className="flex gap-8">
                            <button 
                                onClick={() => router.push('/vault-creation')}
                                className="px-6 py-2 rounded-lg bg-green-600 text-white border-2 border-green-800 shadow-md font-pixel text-sm tracking-wider transition hover:bg-green-700 hover:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-400 active:scale-95"
                            >
                                Create Vault
                            </button>
                        </nav>
                        <ConnectButton chainStatus="none"/>
                    </div>
                </header>

                {/* Vaults Grid */}
                <main className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl px-4 z-10 py-8">
                    <h1 className="text-4xl font-bold text-white mb-8 text-center font-pixel tracking-wider">Fan Vaults</h1>
                    
                    {/* Loading State */}
                    {isLoading && (
                        <div className="text-yellow-400 font-pixel text-center animate-pulse">
                            Loading vaults...
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="text-red-400 font-pixel text-center">
                            {error}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !error && vaults.length === 0 && (
                        <div className="text-center">
                            <p className="text-gray-400 font-pixel mb-4">No vaults created yet.</p>
                            <button 
                                onClick={() => router.push('/vault-creation')}
                                className="px-6 py-3 rounded-lg bg-purple-600 text-white border-2 border-purple-800 shadow-md font-pixel tracking-wider transition hover:bg-purple-700 hover:border-purple-500"
                            >
                                Create First Vault
                            </button>
                        </div>
                    )}

                    {/* Vaults Grid */}
                    {!isLoading && !error && vaults.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                            {vaults.map((vault) => (
                                <div 
                                    key={vault.id} 
                                    className="bg-gray-900 border-2 border-purple-700 rounded-2xl p-6 shadow-lg flex flex-col gap-4 cursor-pointer hover:border-purple-500 transition-all hover:transform hover:scale-105"
                                    onClick={() => handleVaultClick(vault.id!)}
                                >
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-purple-400 font-pixel">{vault.name}</h2>
                                        <div className="text-xs text-gray-400 font-pixel">
                                            {vault.blockchain?.toUpperCase() || 'CHILIZ'}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <p className="text-sm text-white font-pixel">
                                            Total Prize: <span className="text-green-400">{vault.total_prize} CHZ</span>
                                        </p>
                                        <p className="text-xs text-gray-400 font-pixel">
                                            Sponsor: {formatSponsorAddress(vault.vault_sponsor || '')}
                                        </p>
                                    </div>

                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/trovio-chat?vaultId=${vault.id}`);
                                        }}
                                        className="mt-4 w-full px-4 py-2 rounded-lg bg-blue-600 text-white border-2 border-blue-800 shadow-md font-pixel text-sm tracking-wider transition hover:bg-blue-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95"
                                    >
                                        Chat
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="w-full text-center text-xs text-gray-500 py-4 tracking-widest z-10 font-pixel">
                    TROVIO / ALL RIGHTS RESERVED @ 2025
                </footer>
            </div>
        </>
    )
}