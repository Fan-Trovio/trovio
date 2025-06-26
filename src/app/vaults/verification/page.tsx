"use client";

import { useSearchParams } from 'next/navigation';
import { useVaults } from '../../context/VaultsContext';
import { useRouter } from 'next/navigation';

export default function VaultVerificationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { vaults } = useVaults();
    const vaultId = searchParams.get('id');
    const vault = vaultId !== null ? vaults[parseInt(vaultId, 10)] : null;

    if (!vault) {
        return <div className="min-h-screen w-full bg-black flex items-center justify-center text-white font-pixel">Vault not found.</div>;
    }

    return (
        <>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                .font-pixel {
                    font-family: 'Press Start 2P', 'Fira Mono', monospace;
                }
            `}</style>
            <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center overflow-hidden relative font-sans p-8">
                {/* Tiny grid background */}
                <div
                    className="pointer-events-none absolute inset-0 z-0"
                    style={{
                        backgroundImage: "linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
                        backgroundSize: "10px 10px",
                    }}
                />
                
                <main className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 z-10">
                    {/* Left Side: Vault Info */}
                    <div className="bg-gray-900 border-2 border-purple-700 rounded-2xl p-8 shadow-lg flex flex-col gap-6">
                        <h1 className="text-3xl font-bold text-purple-400 font-pixel">{vault.clubName}</h1>
                        <p className="text-xl text-white font-pixel">
                            Vault Amount: <span className="text-green-400">{vault.vaultAmount} CHZ</span>
                        </p>
                        <p className="text-sm text-gray-400 font-pixel">
                            Announcement: <a href={vault.announcementTweetUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">View Tweet</a>
                        </p>
                    </div>

                    {/* Right Side: Verification Actions */}
                    <div className="flex flex-col justify-center items-center gap-8">
                        <button className="w-full max-w-sm bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-xl text-xl font-pixel tracking-wider">
                            Connect X Account
                        </button>
                        <button 
                            className="w-full max-w-sm bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl text-xl font-pixel tracking-wider"
                            onClick={() => window.open(vault.xProfileUrl, '_blank')}
                        >
                            Follow {vault.clubName} on X
                        </button>
                    </div>
                </main>
            </div>
        </>
    );
} 