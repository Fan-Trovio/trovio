import React from 'react'
import { Search, Bell } from 'lucide-react';
import { ChevronLeft } from 'lucide-react';

const Header = () => {
  return (
    <div className="bg-black/40 backdrop-blur-xl h-16 flex items-center justify-between px-6 mb-4 rounded-2xl border border-white/10 shadow-2xl shadow-violet-500/10">
      <div className="flex items-center space-x-4">
        <ChevronLeft className="text-gray-400 cursor-pointer hover:text-violet-400 transition-colors p-1 hover:bg-white/5 rounded-lg" />
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search games ..."
            className="bg-white/5 backdrop-blur-sm text-white pl-10 pr-4 py-2 rounded-xl w-80 focus:outline-none focus:ring-2 focus:ring-violet-500/50 border border-white/10 focus:border-violet-400/50 focus:bg-white/10 transition-all"
          />
        </div>
      </div>
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
          <span className="text-violet-400">$</span>
          <span className="text-white font-semibold">1,570</span>
        </div>
        <button className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-2 rounded-xl font-medium hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/25 border border-violet-400/20">
          Buy
        </button>
        <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm px-3 py-2 rounded-lg border border-white/10">
          <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white text-sm font-bold">A</span>
          </div>
          <span className="text-white font-medium">Aleksandr</span>
        </div>
        <Bell className="text-gray-400 cursor-pointer hover:text-violet-400 transition-colors p-2 hover:bg-white/5 rounded-lg" />
      </div>
    </div>
  );
};

export default Header