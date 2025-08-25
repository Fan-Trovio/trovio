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
  Info,
  MessageCircleMoreIcon} from 'lucide-react';
import { useRouter } from 'next/navigation';
const Sidebar = () => {
  const menuItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: Trophy, label: 'Leader Board' },
    { icon: MessageCircleMoreIcon, label: 'Prev Chat' },
    { icon: CreditCard, label: 'Payments' },
    { icon: Info, label: 'Info' },
  ];
  const router= useRouter();



  return (
    <div className=" m-4 bottom-4 w-64 z-50">
      <div className="h-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl shadow-violet-500/20">
        <div className="text-violet-400 text-2xl font-bold mb-8">Trovio</div>
        <nav className="space-y-3">
          {menuItems.map((item, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                item.active 
                  ? 'bg-violet-600/20 backdrop-blur-sm text-white border border-violet-400/30 shadow-lg shadow-violet-500/10' 
                  : 'text-gray-300 hover:bg-white/5 hover:backdrop-blur-sm hover:text-white hover:border hover:border-white/10'
              }`}
              onClick={() => {
                // Handle navigation based on item label
                if(item.label==='Home'){
                  router.push('/dashboard');
                }else if(item.label==='Leader Board'){
                  router.push('/leaderboard');
                }else if(item.label==='Prev Chat'){
                  router.push('/previous-chats'); }
                else if(item.label==='Payments'){
                  router.push('/payments'); }
                else if(item.label==='Info'){
                  router.push('/info'); }
              }}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </div>
          ))}
        </nav>
        
      </div>
    </div>
  );
};

export default Sidebar