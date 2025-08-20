'use client'
import React, { useState } from 'react';
import { Search, Trophy, Star, Gamepad2, Target, Award } from 'lucide-react';

const TopPlayerCard = ({ player, rank }) => {
  const cardStyles = {
    1: {
      borderColor: 'border-purple-400',
      shadowColor: 'shadow-purple-500/50',
      rankColor: 'text-purple-300',
      textColor: 'text-purple-300',
      badgeBg: 'bg-purple-500/20',
      badgeText: 'text-purple-200',
    },
    2: {
      borderColor: 'border-violet-400',
      shadowColor: 'shadow-violet-500/50',
      rankColor: 'text-violet-300',
      textColor: 'text-violet-300',
      badgeBg: 'bg-violet-500/20',
      badgeText: 'text-violet-200',
    },
    3: {
      borderColor: 'border-pink-400',
      shadowColor: 'shadow-pink-500/50',
      rankColor: 'text-pink-300',
      textColor: 'text-pink-300',
      badgeBg: 'bg-pink-500/20',
      badgeText: 'text-pink-200',
    },
  };

  const styles = cardStyles[rank];
  const rankText = rank === 1 ? '1st' : rank === 2 ? '2nd' : 'You';

  return (
    <div className={`relative bg-black/20 backdrop-blur-xl border ${styles.borderColor} rounded-2xl p-6 text-center shadow-lg hover:shadow-2xl hover:${styles.shadowColor} transition-shadow duration-300 overflow-hidden`}>
      <div className={`absolute -top-4 -left-4 text-9xl font-bold ${styles.rankColor} opacity-20`}>
        {rank === 1 ? '1st' : rank === 2 ? '2nd' : 'You'}
      </div>
      <div className={`absolute top-4 right-4 px-3 py-1 text-sm font-semibold rounded-full border ${styles.borderColor} ${styles.badgeBg} ${styles.badgeText}`}>
        {rankText}
      </div>
      <div className="relative z-10 flex flex-col items-center">
        <img
          src={`https://placehold.co/80x80/1A1A2E/E0E0E0?text=${player.name.charAt(0)}`}
          alt={player.name}
          className="w-20 h-20 rounded-full mb-4 border-4 border-white/10 shadow-md"
        />
        <h3 className="text-xl font-bold text-white">{player.name}</h3>
        <p className="text-gray-400 text-sm mb-6">{player.country}</p>
        <div className="w-full grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className={`font-bold text-lg ${styles.textColor}`}>{player.gamesPlayed}</p>
            <p className="text-gray-400 text-xs">Games Played</p>
          </div>
          <div>
            <p className={`font-bold text-lg ${styles.textColor}`}>{player.categories}</p>
            <p className="text-gray-400 text-xs">Categories</p>
          </div>
          <div>
            <p className={`font-bold text-lg ${styles.textColor}`}>{player.pointsEarned.toLocaleString()}</p>
            <p className="text-gray-400 text-xs">Points Earned</p>
          </div>
        </div>
      </div>
    </div>
  );
};
const LeaderboardPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data based on the image
  const topPlayers = [
    {
      id: 1,
      name: "Jane Tanisha",
      country: "West Bengal, India",
      gamesPlayed: 254,
      categories: 23,
      pointsEarned: 2458,
      avatar: "/api/placeholder/80/80",
      rank: 1
    },
    {
      id: 2,
      name: "Auggy Roach",
      country: "West Bengal, India",
      gamesPlayed: 247,
      categories: 22,
      pointsEarned: 2278,
      avatar: "/api/placeholder/80/80",
      rank: 2
    },
    {
      id: 3,
      name: "Wotah Botal",
      country: "West Bengal, India",
      gamesPlayed: 240,
      categories: 18,
      pointsEarned: 2004,
      avatar: "/api/placeholder/80/80",
      rank: 3
    }
  ];

  const leaderboardData = [
    { rank: 43, name: "Julia Robertson", country: "India", flag: "🇮🇳", gamesPlayed: 124, categories: 11, pointsEarned: 1785, avatar: "/api/placeholder/40/40" },
    { rank: 44, name: "Husn Anuv", country: "USA", flag: "🇺🇸", gamesPlayed: 122, categories: 11, pointsEarned: 1755, avatar: "/api/placeholder/40/40" },
    { rank: 45, name: "Leonardo N D'Gama", country: "Canada", flag: "🇨🇦", gamesPlayed: 114, categories: 11, pointsEarned: 1708, avatar: "/api/placeholder/40/40", isUser: true },
    { rank: 46, name: "Bledit Sand", country: "India", flag: "🇮🇳", gamesPlayed: 105, categories: 9, pointsEarned: 1705, avatar: "/api/placeholder/40/40" },
    { rank: 47, name: "Rip Carbuncle", country: "Ireland", flag: "🇮🇪", gamesPlayed: 94, categories: 6, pointsEarned: 1702, avatar: "/api/placeholder/40/40" },
    { rank: 48, name: "Cyber Phoenix", country: "Japan", flag: "🇯🇵", gamesPlayed: 89, categories: 8, pointsEarned: 1685, avatar: "/api/placeholder/40/40" },
    { rank: 49, name: "Neon Striker", country: "Korea", flag: "🇰🇷", gamesPlayed: 87, categories: 7, pointsEarned: 1650, avatar: "/api/placeholder/40/40" },
    { rank: 50, name: "Digital Nomad", country: "Germany", flag: "🇩🇪", gamesPlayed: 82, categories: 9, pointsEarned: 1632, avatar: "/api/placeholder/40/40" }
  ];

  const filteredData = leaderboardData.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ 
      backgroundImage: "url(./bg1.png)", 
      backgroundSize: "cover", 
      backgroundPosition: 'center', 
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    }}>
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30"></div>
      {/* <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500 rounded-full opacity-10 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500 rounded-full opacity-5 blur-2xl animate-pulse delay-2000"></div>
      </div> */}
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `linear-gradient(rgba(147, 51, 234, 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(147, 51, 234, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-violet-300 to-pink-400 mb-4 tracking-wide">
            CYBER LEADERBOARD
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-violet-500 mx-auto rounded-full"></div>
        </div>

        {/* Top 3 Players - Matching original design */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {topPlayers.map((player, index) => (
            <TopPlayerCard
              key={player.id}
              player={player}
              rank={player.rank}/>
          ))}
        </div>

        {/* Main Leaderboard */}
        <div className="backdrop-blur-lg bg-white/5 border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Search Bar */}
          <div className="p-6 border-b border-purple-500/20 bg-gradient-to-r from-purple-900/20 to-violet-900/20">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for Gamer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-black/40 border border-purple-500/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-7 gap-4 p-6 border-b border-purple-500/20 bg-gradient-to-r from-purple-800/20 to-violet-800/20 text-sm font-semibold text-purple-300 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Position
            </div>
            <div>Name</div>
            <div>Country</div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              Games
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Categories
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Points
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Status
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-purple-500/10">
            {filteredData.map((player, index) => (
              <div
                key={player.rank}
                className={`grid grid-cols-7 gap-4 p-6 hover:bg-purple-500/5 transition-all duration-300 group ${
                  player.isUser ? 'bg-gradient-to-r from-purple-600/20 to-violet-600/20 border-l-4 border-purple-400' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    player.rank <= 10 ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}>
                    #{player.rank}
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-violet-600 p-0.5">
                    <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-purple-300">
                      {player.name.charAt(0)}
                    </div>
                  </div>
                  <span className="text-white font-medium group-hover:text-purple-300 transition-colors">
                    {player.name}
                    {player.isUser && <span className="text-cyan-400 ml-2">(You)</span>}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-lg">{player.flag}</span>
                  <span>{player.country}</span>
                </div>
                
                <div className="flex items-center text-cyan-400 font-semibold">
                  {player.gamesPlayed}
                </div>
                
                <div className="flex items-center text-purple-400 font-semibold">
                  {player.categories}
                </div>
                
                <div className="flex items-center text-pink-400 font-bold">
                  {player.pointsEarned.toLocaleString()}
                </div>
                
                <div className="flex items-center">
                  {player.rank <= 10 && (
                    <div className="px-3 py-1 bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-400/30 rounded-full text-xs text-purple-300 font-medium">
                      Elite
                    </div>
                  )}
                  {player.isUser && (
                    <div className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full text-xs text-cyan-300 font-medium">
                      You
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="backdrop-blur-lg bg-white/5 border border-purple-500/20 rounded-xl p-6 inline-block">
            <p className="text-purple-300 text-sm">
              Compete • Dominate • Rule the Leaderboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;