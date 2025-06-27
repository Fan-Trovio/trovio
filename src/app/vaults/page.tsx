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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-gray-900 border-2 border-purple-700 rounded-2xl p-6 max-w-md w-full shadow-lg">
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
                        className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white border-2 border-purple-800 font-pixel text-sm transition hover:bg-purple-700"
                    >
                        {bothTasksCompleted ? 'Chat Now' : 'Skip to Chat'}
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
                                            handleChatClick(vault);
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