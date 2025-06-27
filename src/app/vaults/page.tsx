"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { db, Vault } from '@/lib/database';

interface TaskPopupProps {
    vault: Vault;
    onClose: () => void;
    onProceedToChat: () => void;
}

function TaskPopup({ vault, onClose, onProceedToChat }: TaskPopupProps) {
    const { address } = useAccount();
    const [taskStatus, setTaskStatus] = useState({
        followed: false,
        retweeted: false
    });
    const [isUpdatingCredits, setIsUpdatingCredits] = useState(false);
    const [fanTokens, setFanTokens] = useState<number | null>(null);
    const [isLoadingTokens, setIsLoadingTokens] = useState(false);
    const [hasCheckedTokens, setHasCheckedTokens] = useState(false);

    // Fan token buy links mapping
    const fanTokenBuyLinks: { [key: string]: string } = {
        'PSG': 'https://app.fanx.xyz/trade/swap',
        'SPURS': 'https://app.fanx.xyz/trade/swap',
        'BAR': 'https://app.fanx.xyz/trade/swap',
        'ACM': 'https://app.fanx.xyz/trade/swap',
        'OG': 'https://app.fanx.xyz/trade/swap',
        'CITY': 'https://app.fanx.xyz/trade/swap',
        'AFC': 'https://app.fanx.xyz/trade/swap',
        'MENGO': 'https://app.fanx.xyz/trade/swap',
        'JUV': 'https://app.fanx.xyz/trade/swap',
        'NAP': 'https://app.fanx.xyz/trade/swap',
        'ATM': 'https://app.fanx.xyz/trade/swap'
    };

    // Load task status from localStorage on mount
    useEffect(() => {
        if (vault.id && address) {
            const savedStatus = localStorage.getItem(`vault_${vault.id}_tasks_${address}`);
            if (savedStatus) {
                setTaskStatus(JSON.parse(savedStatus));
            }
        }
    }, [vault.id, address]);

    // Save task status to localStorage
    const saveTaskStatus = (newStatus: typeof taskStatus) => {
        if (vault.id && address) {
            localStorage.setItem(`vault_${vault.id}_tasks_${address}`, JSON.stringify(newStatus));
            setTaskStatus(newStatus);
        }
    };

    // Fetch fan tokens for the specific vault
    const fetchFanTokens = async () => {
        if (!address || !vault.name) return;
        
        setIsLoadingTokens(true);
        try {
            // Extract club name from vault name (assuming format like "JUV Fan Club" or "JUV")
            const clubName = vault.name.split(' ')[0].toUpperCase();
            
            // Call our API endpoint to fetch fan tokens
            const response = await fetch(`/api/fan-tokens?address=${address}&club=${clubName}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch fan tokens');
            }
            
            const data = await response.json();
            setFanTokens(data.balance);
            setHasCheckedTokens(true);
            
            // Log the source for debugging
            console.log(`Fan tokens fetched from: ${data.source}`, data);
            
        } catch (error) {
            console.error('Error fetching fan tokens:', error);
            setFanTokens(0);
            setHasCheckedTokens(true);
        } finally {
            setIsLoadingTokens(false);
        }
    };

    // Check if user is eligible (has 10+ fan tokens)
    const isEligible = fanTokens !== null && fanTokens >= 10;
    
    // Get club name for buy link
    const getClubName = () => {
        return vault.name.split(' ')[0].toUpperCase();
    };

    // Handle follow button click
    const handleFollow = async () => {
        if (!vault.sponsor_links?.x_profile || taskStatus.followed) return;
        
        try {
            setIsUpdatingCredits(true);
            
            // Extract username from X profile URL
            const xProfileUrl = vault.sponsor_links.x_profile as string;
            const usernameMatch = xProfileUrl.match(/x\.com\/([^\/\?]+)/);
            const username = usernameMatch ? usernameMatch[1] : '';
            
            if (username) {
                // Open X follow intent
                window.open(`https://twitter.com/intent/follow?screen_name=${username}`, '_blank');
                
                // Update user credits
                if (address) {
                    const currentUser = await db.getUserByWalletAddress(address);
                    if (currentUser) {
                        await db.updateUserCredits(address, (currentUser.credits || 0) + 1);
                    }
                }
                
                // Mark task as completed
                const newStatus = { ...taskStatus, followed: true };
                saveTaskStatus(newStatus);
            }
        } catch (error) {
            console.error('Error handling follow:', error);
        } finally {
            setIsUpdatingCredits(false);
        }
    };

    // Handle retweet button click
    const handleRetweet = async () => {
        if (!vault.sponsor_links?.announcement_tweet || taskStatus.retweeted) return;
        
        try {
            setIsUpdatingCredits(true);
            
            // Extract tweet ID from announcement tweet URL
            const tweetUrl = vault.sponsor_links.announcement_tweet as string;
            const tweetIdMatch = tweetUrl.match(/\/status\/(\d+)/);
            const tweetId = tweetIdMatch ? tweetIdMatch[1] : '';
            
            if (tweetId) {
                // Open X retweet intent
                window.open(`https://twitter.com/intent/retweet?tweet_id=${tweetId}`, '_blank');
                
                // Update user credits
                if (address) {
                    const currentUser = await db.getUserByWalletAddress(address);
                    if (currentUser) {
                        await db.updateUserCredits(address, (currentUser.credits || 0) + 1);
                    }
                }
                
                // Mark task as completed
                const newStatus = { ...taskStatus, retweeted: true };
                saveTaskStatus(newStatus);
            }
        } catch (error) {
            console.error('Error handling retweet:', error);
        } finally {
            setIsUpdatingCredits(false);
        }
    };

    // Check if user has already completed both tasks
    const bothTasksCompleted = taskStatus.followed && taskStatus.retweeted;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-gray-900/95 border-2 border-purple-700 rounded-2xl p-6 max-w-md w-full shadow-lg backdrop-blur-md">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-purple-400 font-pixel">{vault.name} Tasks</h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-xl font-bold"
                    >
                        ×
                    </button>
                </div>
                
                <div className="space-y-4 mb-6">
                    <p className="text-white font-pixel text-sm">
                        Complete these tasks to earn credits:
                    </p>
                    
                    {/* Follow Task */}
                    {vault.sponsor_links?.x_profile && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-300 font-pixel">Follow Team</span>
                                {taskStatus.followed && (
                                    <span className="text-green-400 text-lg">✓</span>
                                )}
                            </div>
                            <button
                                onClick={handleFollow}
                                disabled={taskStatus.followed || isUpdatingCredits}
                                className={`px-4 py-2 rounded-lg font-pixel text-xs transition ${
                                    taskStatus.followed
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 border-2 border-blue-800'
                                }`}
                            >
                                {taskStatus.followed ? 'Followed' : 'Follow (+1 Credit)'}
                            </button>
                        </div>
                    )}
                    
                    {/* Retweet Task */}
                    {vault.sponsor_links?.announcement_tweet && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-300 font-pixel">Retweet</span>
                                {taskStatus.retweeted && (
                                    <span className="text-green-400 text-lg">✓</span>
                                )}
                            </div>
                            <button
                                onClick={handleRetweet}
                                disabled={taskStatus.retweeted || isUpdatingCredits}
                                className={`px-4 py-2 rounded-lg font-pixel text-xs transition ${
                                    taskStatus.retweeted
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700 border-2 border-green-800'
                                }`}
                            >
                                {taskStatus.retweeted ? 'Retweeted' : 'Retweet (+1 Credit)'}
                            </button>
                        </div>
                    )}

                    {/* Fan Token Check */}
                    <div className="border-t border-purple-700 pt-4 mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-300 font-pixel">Fan Token Check</span>
                            {hasCheckedTokens && isEligible && (
                                <span className="text-green-400 text-lg">✓</span>
                            )}
                        </div>
                        
                        {!hasCheckedTokens ? (
                            <button
                                onClick={fetchFanTokens}
                                disabled={isLoadingTokens}
                                className={`w-full px-4 py-2 rounded-lg font-pixel text-xs transition ${
                                    isLoadingTokens
                                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                        : 'bg-yellow-600 text-white hover:bg-yellow-700 border-2 border-yellow-800'
                                }`}
                            >
                                {isLoadingTokens ? 'Checking...' : 'Check Available Tokens'}
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-center p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <p className="text-sm text-gray-300 font-pixel">
                                        Your {getClubName()} tokens: <span className={`font-bold ${isEligible ? 'text-green-400' : 'text-red-400'}`}>
                                            {fanTokens !== null ? fanTokens.toFixed(6).replace(/\.?0+$/, '') : '0'}
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-400 font-pixel mt-1">
                                        Required: 10 tokens minimum
                                    </p>
                                    {fanTokens !== null && (
                                        <p className={`text-xs font-pixel mt-1 ${isEligible ? 'text-green-400' : 'text-red-400'}`}>
                                            {isEligible ? '✓ Eligible for chat' : '✗ Not eligible for chat'}
                                        </p>
                                    )}
                                </div>
                                
                                {!isEligible && fanTokenBuyLinks[getClubName()] && (
                                    <div className="text-center">
                                        <p className="text-xs text-red-400 font-pixel mb-2">
                                            You need more {getClubName()} tokens to chat
                                        </p>
                                        <a
                                            href={fanTokenBuyLinks[getClubName()]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-block px-4 py-2 rounded-lg bg-purple-600 text-white border-2 border-purple-800 font-pixel text-xs transition hover:bg-purple-700"
                                        >
                                            Buy {getClubName()} Tokens
                                        </a>
                                        <p className="text-xs text-yellow-400 font-pixel mt-2">
                                            Note: You're on testnet. Get testnet tokens from Chiliz faucet.
                                        </p>
                                    </div>
                                )}
                                
                                {/* Retry button */}
                                <button
                                    onClick={fetchFanTokens}
                                    disabled={isLoadingTokens}
                                    className="w-full mt-2 px-3 py-1 rounded-lg bg-gray-600 text-white border border-gray-700 font-pixel text-xs transition hover:bg-gray-700 disabled:opacity-50"
                                >
                                    {isLoadingTokens ? 'Refreshing...' : 'Refresh Balance'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg bg-gray-600 text-white border-2 border-gray-800 font-pixel text-sm transition hover:bg-gray-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onProceedToChat}
                        disabled={hasCheckedTokens && !isEligible}
                        className={`flex-1 px-4 py-2 rounded-lg font-pixel text-sm transition ${
                            hasCheckedTokens && !isEligible
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed border-2 border-gray-800'
                                : 'bg-purple-600 text-white border-2 border-purple-800 hover:bg-purple-700'
                        }`}
                    >
                        {bothTasksCompleted && isEligible ? 'Chat Now' : 'Skip to Chat'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function VaultsPage() {
    const router = useRouter();
    const { isConnected, address } = useAccount();
    const [vaults, setVaults] = useState<Vault[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVault, setSelectedVault] = useState<Vault | null>(null);
    const [showTaskPopup, setShowTaskPopup] = useState(false);

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

    const handleChatClick = (vault: Vault) => {
        if (!address) return;
        
        // Check if vault has any social links to show tasks for
        const hasXProfile = !!vault.sponsor_links?.x_profile;
        const hasAnnouncementTweet = !!vault.sponsor_links?.announcement_tweet;
        
        // If no social links at all, go directly to chat
        if (!hasXProfile && !hasAnnouncementTweet) {
            router.push(`/trovio-chat?vaultId=${vault.id}`);
            return;
        }
        
        // Check if user has already completed available tasks for this vault
        const savedStatus = localStorage.getItem(`vault_${vault.id}_tasks_${address}`);
        if (savedStatus) {
            const taskStatus = JSON.parse(savedStatus);
            const followCompleted = !hasXProfile || taskStatus.followed;
            const retweetCompleted = !hasAnnouncementTweet || taskStatus.retweeted;
            
            // If all available tasks are completed, go directly to chat
            if (followCompleted && retweetCompleted) {
                router.push(`/trovio-chat?vaultId=${vault.id}`);
                return;
            }
        }
        
        // Show task popup for incomplete tasks
        setSelectedVault(vault);
        setShowTaskPopup(true);
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
                                            handleChatClick(vault);
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

                {/* Task Popup */}
                {showTaskPopup && selectedVault && (
                    <TaskPopup
                        vault={selectedVault}
                        onClose={() => {
                            setShowTaskPopup(false);
                            setSelectedVault(null);
                        }}
                        onProceedToChat={() => {
                            setShowTaskPopup(false);
                            router.push(`/trovio-chat?vaultId=${selectedVault.id}`);
                            setSelectedVault(null);
                        }}
                    />
                )}
            </div>
        </>
    )
}