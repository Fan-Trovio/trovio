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
                .cyberpunk-card {
                    border: 2.5px solid #a855f7;
                    background: linear-gradient(135deg, rgba(40,20,60,0.85) 80%, #2d0a3a 100%);
                    /* Remove all cuts, standard rectangle border */
                    transition: border 0.2s, box-shadow 0.2s, transform 0.18s;
                    will-change: transform;
                }
                .cyberpunk-card:hover {
                    transform: perspective(600px) rotateY(-6deg) scale(1.01);
                }
                .cyberpunk-btn {
                    background: linear-gradient(90deg, #a855f7 60%, #c084fc 100%);
                    color: #fff;
                    border: 2px solid #c084fc;
                    font-family: 'Press Start 2P', 'Fira Mono', monospace;
                    font-size: 1.1rem;
                    letter-spacing: 0.08em;
                    border-radius: 2px;
                    /* box-shadow removed */
                    transition: background 0.18s, border 0.18s, transform 0.12s;
                }
                .cyberpunk-btn:hover {
                    background: #7c3aed;
                    border: 2px solid #a855f7;
                    transform: scale(1.03);
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
                <main className="flex-1 flex flex-col items-center w-full max-w-6xl px-4 z-10 pt-4 mt-10">
                    <h1 className="text-5xl text-pink-600 font-bold text-white mb-8 text-center font-pixel tracking-wider mb-10">Fan Vaults</h1>
                    
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                            {vaults.map((vault) => (
                                <div 
                                    key={vault.id} 
                                    className="cyberpunk-card p-7 flex flex-col gap-5 cursor-pointer relative group"
                                    onClick={() => handleVaultClick(vault.id!)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h2 className="text-2xl font-bold text-purple-300 font-pixel tracking-widest drop-shadow-lg group-hover:text-purple-100 transition">{vault.name}</h2>
                                        <div className="text-xs text-purple-400 font-pixel bg-purple-900/40 px-3 py-1 rounded-full border border-purple-700 shadow-sm">
                                            {vault.blockchain?.toUpperCase() || 'CHILIZ'}
                                        </div>
                                    </div>
                                    <div className="space-y-2 mb-2">
                                        <p className="text-base text-white font-pixel">
                                            <span className="text-purple-400">Total Prize:</span> <span className="text-green-400 font-bold">{vault.total_prize} CHZ</span>
                                        </p>
                                        <p className="text-xs text-purple-200 font-pixel">
                                            <span className="text-purple-400">Sponsor:</span> {formatSponsorAddress(vault.vault_sponsor || '')}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/trovio-chat?vaultId=${vault.id}`);
                                        }}
                                        className="mt-4 w-full px-4 py-3 cyberpunk-btn shadow-md font-pixel tracking-widest flex items-center justify-center gap-2"
                                    >
                                        Convince <span className="text-lg pb-1">🌶️</span>
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