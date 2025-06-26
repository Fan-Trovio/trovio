"use client";

import { useVaults } from '../context/VaultsContext';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface Vault {
    vaultAmount: string;
    clubName: string;
    xProfileUrl: string;
    announcementTweetUrl: string;
  }

export default function VaultsPage() {
    const router = useRouter();
    const { vaults } = useVaults();

    const handleVaultClick = (index: number) => {
        router.push(`/vaults/verification?id=${index}`);
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
                        <ConnectButton chainStatus="none"/>
                    </div>
                </header>

                {/* Vaults Grid */}
                <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl px-4 z-10">
                    <h1 className="text-4xl font-bold text-white mb-8 text-center font-pixel tracking-wider">Fan Vaults</h1>
                    {vaults.length === 0 ? (
                        <p className="text-gray-400 font-pixel">No vaults created yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                            {vaults.map((vault: Vault, index: number) => (
                                <div 
                                    key={index} 
                                    className="bg-gray-900 border-2 border-purple-700 rounded-2xl p-6 shadow-lg flex flex-col gap-4 cursor-pointer hover:border-purple-500 transition-all"
                                    onClick={() => handleVaultClick(index)}
                                >
                                    <h2 className="text-2xl font-bold text-purple-400 font-pixel">{vault.clubName}</h2>
                                    <p className="text-lg text-white font-pixel">
                                        Vault Amount: <span className="text-green-400">{vault.vaultAmount} CHZ</span>
                                    </p>
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