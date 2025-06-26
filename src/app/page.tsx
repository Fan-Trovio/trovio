"use client"
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      const timeout = setTimeout(() => {
        router.push('/vaults');
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isConnected, router]);

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
          <nav className="flex gap-12 text-lg font-bold text-gray-300">
            <Link href={'/vault-creation'}>
            <button className="px-8 py-1 rounded-lg bg-purple-600 text-white border-4 border-purple-800 shadow-md font-pixel tracking-wider transition hover:bg-white hover:text-purple-700 hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 active:scale-95">
              Create Vault
            </button>
            </Link>
            <button className="px-8 py-1 rounded-lg bg-purple-600 text-white border-4 border-purple-800 shadow-md font-pixel tracking-wider transition hover:bg-white hover:text-purple-700 hover:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-400 active:scale-95">
              Docs
            </button>
          </nav>
          <div>
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
              <div className=" border border-purple-700 rounded-2xl p-3 flex flex-col gap-4 max-w-sm">
                <button 
                  onClick={() => router.push('/vaults')}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-xl text-xl font-pixel tracking-wider"
                >
                  Proceed
                </button>
              </div>
            </div>
            {/* Right Side */}
            <div className="relative flex items-center justify-center h-[600px]">
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
