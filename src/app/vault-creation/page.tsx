"use client"

import { useState, useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useRouter } from 'next/navigation';
import Confetti from 'react-confetti';
import { useVaults } from '../context/VaultsContext';

export default function VaultCreation() {
  const router = useRouter();
  const { addVault } = useVaults();
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [formData, setFormData] = useState({
    vaultAmount: '',
    clubName: '',
    xProfileUrl: '',
    announcementTweetUrl: '',
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateVault = (e: React.FormEvent) => {
    e.preventDefault();
    addVault(formData);
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      router.push('/vaults');
    }, 5000);
  };

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
              {/* <button 
                onClick={() => router.push('/vaults')}
                className="px-8 py-1 rounded-lg bg-purple-600 text-white border-4 border-purple-800 shadow-md font-pixel tracking-wider transition hover:bg-white hover:text-purple-700 hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 active:scale-95"
              >
                Vault
              </button> */}
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
          <div className="w-full bg-gray-900 border-2 border-purple-700 rounded-2xl p-8 shadow-lg">
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
                  className="w-full bg-black border-2 border-purple-600 rounded-md p-3 text-white focus:ring-purple-500 focus:border-purple-500 font-pixel"
                  placeholder="e.g. 1000 CHZ"
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
                  className="w-full bg-black border-2 border-purple-600 rounded-md p-3 text-white focus:ring-purple-500 focus:border-purple-500 font-pixel"
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
                  className="w-full bg-black border-2 border-purple-600 rounded-md p-3 text-white focus:ring-purple-500 focus:border-purple-500 font-pixel"
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
                  className="w-full bg-black border-2 border-purple-600 rounded-md p-3 text-white focus:ring-purple-500 focus:border-purple-500 font-pixel"
                  placeholder=""
                />
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl text-xl font-pixel tracking-wider hover:animate-pulse-slow"
                >
                  Create Vault
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
    </>
  );
}
