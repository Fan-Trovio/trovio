import React from 'react'
import { 
  Home, 
  Gamepad2, 
  Radio, 
  Users, 
  Gift, 
  Trophy, 
  Star, 
  Crown, 
  CreditCard, 
  Info} from 'lucide-react';
const Sidebar = () => {
  const menuItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: Gamepad2, label: 'Slots' },
    { icon: Radio, label: 'Live' },
    { icon: Users, label: 'Providers' },
    { icon: Gift, label: 'Promotions' },
    { icon: Trophy, label: 'Tournaments' },
    { icon: Star, label: 'Loyalty program' },
    { icon: Crown, label: 'Elite Circle' },
    { icon: CreditCard, label: 'Payments' },
    { icon: Info, label: 'Info' },
  ];

  return (
    <div className=" m-4 bottom-4 w-64 z-50">
      <div className="h-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-violet-500/20">
        <div className="text-violet-400 text-2xl font-bold mb-8">BELABET</div>
        <nav className="space-y-3">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                item.active 
                  ? 'bg-violet-600/20 backdrop-blur-sm text-white border border-violet-400/30 shadow-lg shadow-violet-500/10' 
                  : 'text-gray-300 hover:bg-white/5 hover:backdrop-blur-sm hover:text-white hover:border hover:border-white/10'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </div>
          ))}
        </nav>
        <div className="absolute bottom-6 left-6 right-6">
          <button className="flex items-center space-x-2 text-violet-400 bg-violet-600/20 backdrop-blur-sm px-4 py-3 rounded-xl hover:bg-violet-600/30 transition-all duration-300 border border-violet-400/20 shadow-lg shadow-violet-500/10 w-full">
            <span>🎧</span>
            <span className="font-medium">Support</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar