'use client';
import { Vault ,db} from "@/lib/database";
import React, { useEffect, useState } from "react";
import { useAccount } from "wagmi";
interface TaskPopupProps {
    vault: Vault;
    onClose: () => void;
    onProceedToChat: () => void;
}
export function TaskPopup({ vault, onClose, onProceedToChat }: TaskPopupProps) {
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
                        disabled={!bothTasksCompleted || (hasCheckedTokens && !isEligible)}
                        className={`flex-1 px-4 py-2 rounded-lg font-pixel text-sm transition ${
                            !bothTasksCompleted || (hasCheckedTokens && !isEligible)
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
