"use client"
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/database';

export default function Home() {
  const { isConnected, address } = useAccount();
  const router = useRouter();
  const [userExists, setUserExists] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [buttonsEnabled, setButtonsEnabled] = useState(false);

  // Check/create user when wallet is connected
  useEffect(() => {
    const checkOrCreateUser = async () => {
      if (isConnected && address) {
        console.log('Wallet connected:', address);
        setIsCheckingUser(true);
        setButtonsEnabled(false);
        
        try {
          // Check if user exists
          const existingUser = await db.getUserByWalletAddress(address);
          
          if (existingUser) {
            console.log('User exists:', existingUser);
            setUserExists(true);
            setButtonsEnabled(true);
          } else {
            console.log('User does not exist, creating new user...');
            setIsCreatingUser(true);
            
            // Create new user
            const newUser = await db.createOrUpdateUser(address, {
              credits: 0 // Give new users 0 starting credits
            });
            
            if (newUser) {
              console.log('User created successfully:', newUser);
              setUserExists(true);
              setButtonsEnabled(true);
            } else {
              console.error('Failed to create user');
              setButtonsEnabled(false);
            }
            setIsCreatingUser(false);
          }
        } catch (error) {
          console.error('Error checking/creating user:', error);
          setButtonsEnabled(false);
        } finally {
          setIsCheckingUser(false);
        }
      } else {
        // Wallet disconnected
        setUserExists(false);
        setButtonsEnabled(false);
        setIsCheckingUser(false);
        setIsCreatingUser(false);
      }
    };

    checkOrCreateUser();
  }, [isConnected, address]);

  // Handle navigation to vaults page
  const handleProceedClick = () => {
    if (buttonsEnabled) {
      router.push('/vaults');
    }
  };

  // Handle navigation to create vault page
  const handleCreateVaultClick = () => {
    if (buttonsEnabled) {
      router.push('/vault-creation');
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .font-pixel {
          font-family: 'Press Start 2P', 'Fira Mono', monospace;
        }
      `}</style>
      <div className="min-h-screen h-screen w-full bg-black flex flex-col items-center justify-center overflow-hidden relative font-sans">
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
            {/* Logo */}
            <span className="text-purple-400 text-3xl font-extrabold tracking-widest font-pixel">TROVIO</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-8 py-1 rounded-lg bg-purple-600 text-white border-4 border-purple-800 shadow-md font-pixel tracking-wider transition hover:bg-white hover:text-purple-700 hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 active:scale-95"
              onClick={() => window.open('https://docs.trovio.com', '_blank')}
            >
              Docs
            </button>
            <ConnectButton chainStatus="none"/>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center w-full max-w-7xl px-12 z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center w-full">
            {/* Left Side */}
            <div className="flex flex-col gap-8 text-left">
              <h1 className="text-7xl font-pixel font-bold text-white tracking-tighter leading-tight">
                You always<br />are winner
              </h1>
              
              {/* Loading States */}
              {isCheckingUser && (
                <div className="text-yellow-400 font-pixel text-sm animate-pulse">
                  Checking user account...
                </div>
              )}

              {isCreatingUser && (
                <div className="text-blue-400 font-pixel text-sm animate-pulse">
                  Creating user account...
                </div>
              )}

              <div className="border border-purple-700 rounded-2xl p-6 flex flex-col gap-4 max-w-sm">
                {!isConnected ? (
                  <div className="text-gray-400 font-pixel text-sm text-center">
                    Connect your wallet to continue
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={handleProceedClick}
                      disabled={!buttonsEnabled}
                      className={`font-bold py-4 px-6 rounded-xl text-xl font-pixel tracking-wider transition-all ${
                        buttonsEnabled 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer transform hover:scale-105' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {isCheckingUser || isCreatingUser ? 'Loading...' : 'Proceed to Vaults'}
                    </button>
                    
                    <button 
                      onClick={handleCreateVaultClick}
                      disabled={!buttonsEnabled}
                      className={`font-bold py-4 px-6 rounded-xl text-xl font-pixel tracking-wider transition-all ${
                        buttonsEnabled 
                          ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer transform hover:scale-105' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {isCheckingUser || isCreatingUser ? 'Loading...' : 'Create Vault'}
                    </button>
                  </>
                )}
              </div>
            </div>
            {/* Right Side */}
            <div className="relative flex items-center justify-center mt-16 h-[600px]">
              <img
                src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExMTJ6aXowdGRudWo4bXluMHNkZHVienMxcjl5bzYzejRsZHhwb2VrbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/JYVuKkDFM16Xd0Su47/giphy.gif"
                alt="Pixel art character GIF"
                className="w-full max-w-xl object-contain"
              />
              
            </div>
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
