"use client"
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      const timeout = setTimeout(() => {
        router.push('/vault');
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
      <div className="min-h-screen h-screen w-full bg-gray-300 flex flex-col items-center justify-center overflow-hidden font-pixel relative">
        {/* Black grid overlay */}
        <div className="pointer-events-none absolute inset-0 z-0" style={{
          backgroundImage: 'linear-gradient(to right, rgba(0,0,0,0.10) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.10) 1px, transparent 1px)',
          backgroundSize: '10px 10px',
          opacity: 0.5,
        }} />
        {/* Header */}
        <header className="w-full max-w-7xl flex items-center justify-between px-12 pt-8 pb-4 z-10">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <span className="text-blue-500 text-3xl font-extrabold tracking-widest font-pixel">TROVIO</span>
          </div>
          <nav className="flex gap-12 text-xl font-bold text-gray-700">
            <button className="px-8 py-1 rounded-lg bg-blue-500 text-white border-4 border-blue-700 shadow-md font-pixel tracking-wider transition hover:bg-white hover:text-blue-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95">
              Vault
            </button>
            <button className="px-8 py-1 rounded-lg bg-blue-500 text-white border-4 border-blue-700 shadow-md font-pixel tracking-wider transition hover:bg-white hover:text-blue-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95">
              Docs
            </button>
          </nav>
          <div>
          <ConnectButton chainStatus="none"/>
          </div>
        </header>
        {/* Hero Section */}
        <section className="w-full max-w-7xl flex-1 flex flex-col items-center justify-center z-10" style={{minHeight: '0'}}>
          <div className="w-full flex-1 flex flex-col justify-center">
            <div className="w-full flex flex-row items-center justify-between bg-black rounded-[40px] px-16 py-12" style={{height: '340px', minHeight: '340px', maxHeight: '340px'}}>
              {/* Left: Text */}
              <div className="flex-1 flex flex-col justify-center max-w-xl">
                <div className="text-3xl text-white mb-2">
                  Its<span className="text-blue-500 font-bold ml-2 italic font-pixel">PLAYTIME</span>
                </div>
                <div className="text-3xl font-bold text-white mb-4">Conquer VR Realms</div>
                <div className="text-sm text-gray-300 mb-2 max-w-md">
                  Dive into epic quests, conquer challenges, and redefine excellence in gaming. Immerse yourself in a world where every victory matters.
                </div>
              </div>
              {/* Right: GIF */}
              <div className="flex-1 flex items-center justify-end h-full">
                <img
                  src="https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExZDZrbGRuNmwzMDNubDhwbTJlZndta284MGxwOGE2Z3ZyeGdkY2pociZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/jHGXTeuHaahLKqZcgK/giphy.gif"
                  alt="VR Controller GIF"
                  className="w-[500px] h-[285px] object-contain rounded-2xl shadow-lg rounded-3xl border-2 border-purple-700 border-block"
                  draggable={false}
                />
              </div>
            </div>
          </div>
          {/* Stats Section */}
          <div className="w-full flex justify-between gap-6 mb-16">
            <div className="flex-1 bg-white rounded-2xl p-8 py-16 flex flex-col items-center shadow text-center min-w-[180px]">
              <div className="text-blue-500 text-xl font-bold mb-1">+10</div>
              <div className="text-gray-700 text-base">vaults</div>
            </div>
            <div className="flex-1 bg-white rounded-2xl p-8 py-16 flex flex-col items-center shadow text-center min-w-[180px]">
              <div className="text-blue-500 text-xl font-bold mb-1">50+</div>
              <div className="text-gray-700 text-base">sports</div>
            </div>
            <div className="flex-1 bg-white rounded-2xl p-8 py-16 flex flex-col items-center shadow text-center min-w-[180px]">
              <div className="text-blue-500 text-xl font-bold mb-1">#1</div>
              <div className="text-gray-700 text-base">In the charts</div>
            </div>
            <div className="flex-1 bg-white rounded-2xl p-8 py-16 flex flex-col items-center shadow text-center min-w-[180px]">
              <div className="text-blue-500 text-xl font-bold mb-1">+10</div>
              <div className="text-gray-700 text-base">Fan tokens</div>
            </div>
          </div>
        </section>
        {/* Footer */}
        <footer className="w-full text-center text-xs text-gray-400 py-4 tracking-widest z-10 font-pixel">
          TROVIO / ALL RIGHTS RESERVED @ 2025
        </footer>
      </div>
    </>
  );
}
