"use client"

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Confetti from 'react-confetti';
import { db } from '@/lib/database';

export default function VaultCreation() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [formData, setFormData] = useState({
    vaultAmount: '',
    clubName: '',
    xProfileUrl: '',
    announcementTweetUrl: '',
    personality: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  }, []);

  // Redirect if wallet not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateVault = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }

    setIsCreating(true);

    try {
      // Create vault in database
      const vaultData = {
        name: formData.clubName,
        total_prize: parseFloat(formData.vaultAmount) || 0,
        available_prize: parseFloat(formData.vaultAmount) || 0,
        vault_sponsor: address, // Use wallet address as sponsor
        ai_prompt: formData.personality,
        sponsor_links: {
          x_profile: formData.xProfileUrl,
          announcement_tweet: formData.announcementTweetUrl
        },
        blockchain: 'chiliz' // Default to chiliz since you're using CHZ
      };

      const createdVault = await db.createVault(vaultData);

      if (createdVault) {
        console.log('Vault created successfully:', createdVault);
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          router.push('/vaults');
        }, 3000);
      } else {
        throw new Error('Failed to create vault');
      }
    } catch (error) {
      console.error('Error creating vault:', error);
      alert('Failed to create vault. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <div className="text-white font-pixel text-center">
          <p>Please connect your wallet to create a vault</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} />}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .font-pixel {
          font-family: 'Press Start 2P', 'Fira Mono', monospace;
        }
      `}</style>
      <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center overflow-hidden relative font-sans">
        {/* Tiny grid background */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
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
            <nav className="flex gap-12 text-xl font-bold text-gray-300">
              <button 
                onClick={() => router.push('/vaults')}
                className="px-8 py-1 rounded-lg bg-purple-600 text-white border-4 border-purple-800 shadow-md font-pixel tracking-wider transition hover:bg-white hover:text-purple-700 hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 active:scale-95"
              >
                Vaults
              </button>
              <button className="px-8 py-1 rounded-lg bg-purple-600 text-white border-4 border-purple-800 shadow-md font-pixel tracking-wider transition hover:bg-white hover:text-purple-700 hover:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-400 active:scale-95">
                Docs
              </button>
            </nav>
            <div>
              <ConnectButton chainStatus="none"/>
            </div>
          </div>
        </header>

        {/* Form Section */}
        <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl px-4 z-10">
          <div className="w-full glassmorph-vault border-2 border-purple-700 p-8 shadow-lg">
            <h1 className="text-3xl font-bold text-white mb-8 text-center font-pixel tracking-wider">Create a New Fan Vault</h1>
            <form className="space-y-6" onSubmit={handleCreateVault}>
              <div>
                <label htmlFor="vaultAmount" className="block text-sm font-medium text-gray-300 mb-2 font-pixel">Vault Amount</label>
                <input
                  type="number"
                  name="vaultAmount"
                  id="vaultAmount"
                  value={formData.vaultAmount}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-black border-2 border-purple-600 text-md rounded-md p-3 text-white focus:ring-purple-500 focus:border-purple-500"
                  placeholder="e.g. 1000"
                />
              </div>
              <div>
                <label htmlFor="clubName" className="block text-sm font-medium text-gray-300 mb-2 font-pixel">Club Name</label>
                <input
                  type="text"
                  name="clubName"
                  id="clubName"
                  value={formData.clubName}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-black border-2 border-purple-600 text-md rounded-md p-3 text-white focus:ring-purple-500 focus:border-purple-500 "
                  placeholder="e.g. PSG, JUV, NAP"
                />
              </div>
              <div>
                <label htmlFor="xProfileUrl" className="block text-sm font-medium text-gray-300 mb-2 font-pixel">X Profile URL</label>
                <input
                  type="url"
                  name="xProfileUrl"
                  id="xProfileUrl"
                  value={formData.xProfileUrl}
                  onChange={handleInputChange}
                  className="w-full bg-black border-2 border-purple-600 text-md rounded-md p-3 text-white focus:ring-purple-500 focus:border-purple-500 "
                  placeholder="https://x.com/yourprofile"
                />
              </div>
              <div>
                <label htmlFor="announcementTweetUrl" className="block text-sm font-medium text-gray-300 mb-2 font-pixel">Announcement Tweet URL</label>
                <input
                  type="url"
                  name="announcementTweetUrl"
                  id="announcementTweetUrl"
                  value={formData.announcementTweetUrl}
                  onChange={handleInputChange}
                  className="w-full bg-black border-2 border-purple-600 text-md rounded-md p-3 text-white focus:ring-purple-500 focus:border-purple-500 "
                  placeholder="https://x.com/your_tweet_url"
                />
              </div>
              <div>
                <label htmlFor="personality" className="block text-sm font-medium text-gray-300 mb-2 font-pixel">Personality & Behavior</label>
                <textarea
                  name="personality"
                  id="personality"
                  value={formData.personality}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-black border-2 border-purple-600 text-md rounded-md p-3 text-white focus:ring-purple-500 focus:border-purple-500 resize-vertical"
                  placeholder="Describe the AI personality for this vault (e.g., 'Be enthusiastic about PSG, use football terminology, engage fans with team trivia and match discussions')"
                />
                <p className="text-xs text-gray-400 mt-1">This defines how the AI will interact with users in this vault</p>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className={`w-full mt-4 font-bold py-4 px-6 rounded-xl text-xl font-pixel tracking-wider transition-all ${
                    isCreating 
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                      : 'bg-purple-600 hover:bg-purple-700 text-white hover:animate-pulse-slow'
                  }`}
                >
                  {isCreating ? 'Creating Vault...' : 'Create Vault'}
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full text-center text-xs text-gray-500 py-4 tracking-widest z-10 font-pixel">
          TROVIO / ALL RIGHTS RESERVED @ 2025
        </footer>
      </div>
      <style jsx>{`
        .glassmorph-vault {
          background: rgba(40, 20, 60, 0.55);
          box-shadow: 0 4px 32px 0 rgba(80, 40, 120, 0.18);
          backdrop-filter: blur(18px) saturate(140%);
          -webkit-backdrop-filter: blur(18px) saturate(140%);
          border: 1.5px solid rgba(168, 85, 247, 0.18);
          border-radius: 5px;
        }
      `}</style>
    </>
  );
}
