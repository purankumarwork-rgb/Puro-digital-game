import React from 'react';
import { UserProfile } from '../../types/game';
import { sound } from '../../utils/audio';
import {
  Gamepad2,
  Swords,
  Brain,
  Sparkles,
  Trophy,
  Users,
  Flame,
  ArrowRight
} from 'lucide-react';

interface GameHubScreenProps {
  userProfile: UserProfile;
  onSelectGame: (gameId: 'arena' | 'ludo' | 'carrom' | 'puli_danta' | 'mind_matrix') => void;
}

export const GameHubScreen: React.FC<GameHubScreenProps> = ({ userProfile, onSelectGame }) => {
  const games = [
    {
      id: 'arena' as const,
      title: 'BATTLE ARENA 2D',
      subtitle: 'Online & Offline Cyber Combat',
      icon: '⚔️',
      badge: 'Action Shooter',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      description: 'Dual-joystick arena gladiator combat with 5 unique heroes, special abilities, railguns, and smart bots.',
      gradient: 'from-cyan-950 via-slate-900 to-blue-950',
      border: 'border-cyan-500/40',
      players: '1v1 • 2v2 • Bot Practice'
    },
    {
      id: 'ludo' as const,
      title: 'LUDO ROYALE',
      subtitle: 'Classic 4-Color Board Game',
      icon: '🎲',
      badge: 'Board & Dice',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
      description: 'Roll the dice, deploy from base with a 6, capture rival tokens, navigate safe star spots, and race home!',
      gradient: 'from-red-950 via-slate-900 to-amber-950',
      border: 'border-amber-500/40',
      players: 'Vs Smart Bot • Pass & Play'
    },
    {
      id: 'carrom' as const,
      title: 'CYBER CARROM ("CHARAM")',
      subtitle: 'Physics Striker Tabletop',
      icon: '🎯',
      badge: 'Physics Arcade',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Slide your striker along the baseline, aim and charge strike power! Pocket white & black coins and the Red Queen.',
      gradient: 'from-amber-950 via-slate-900 to-yellow-950',
      border: 'border-amber-500/40',
      players: 'Vs Smart Bot • Solo Practice'
    },
    {
      id: 'puli_danta' as const,
      title: 'PULI DANTA (TIGERS & GOATS)',
      subtitle: 'Ancient Strategic Mind Game',
      icon: '🐅',
      badge: 'Smart Strategy',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description: 'Traditional intellectual battlefield! Tigers pounce and capture 5 Goats; Goats coordinate to encircle and trap all Tigers.',
      gradient: 'from-emerald-950 via-slate-900 to-indigo-950',
      border: 'border-emerald-500/40',
      players: 'Play Goats or Tigers • Vs AI'
    },
    {
      id: 'mind_matrix' as const,
      title: 'MIND MATRIX (4-IN-A-ROW)',
      subtitle: 'Tactical Spatial Puzzle',
      icon: '🧠',
      badge: 'IQ Logic',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      description: 'High-IQ spatial foresight! Drop nanite orbs to block opponent lines and connect 4 in a row to dominate the matrix.',
      gradient: 'from-purple-950 via-slate-900 to-indigo-950',
      border: 'border-purple-500/40',
      players: 'Vs Grandmaster AI • 2-Player'
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-in select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-cyan-950/80 border border-purple-500/30 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gamepad2 className="text-purple-400" size={26} />
            <h1 className="text-2xl md:text-3xl font-black font-display text-white">
              PURO GAME CENTER
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-lg">
            Choose from authentic arcade, tabletop and mind sports: Battle Arena, Ludo Royale, Cyber Carrom, Puli Danta (Tigers & Goats), and Mind Matrix!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">5 Active Games</span>
            <span className="text-sm font-black text-cyan-300">Free to Play & Win</span>
          </div>
        </div>
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {games.map(game => (
          <div
            key={game.id}
            onClick={() => {
              sound.playClick();
              onSelectGame(game.id);
            }}
            className={`bg-gradient-to-b ${game.gradient} border ${game.border} p-6 rounded-3xl flex flex-col justify-between shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group relative overflow-hidden`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl group-hover:scale-110 transition-transform">{game.icon}</span>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${game.badgeColor}`}>
                  {game.badge}
                </span>
              </div>

              <h2 className="text-lg font-black font-display text-white mb-0.5 group-hover:text-cyan-300 transition-colors">
                {game.title}
              </h2>
              <div className="text-xs font-semibold text-slate-400 mb-3">{game.subtitle}</div>
              <p className="text-xs text-slate-300/80 leading-relaxed mb-4">
                {game.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">{game.players}</span>
              <div className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-cyan-500 group-hover:text-slate-950 flex items-center justify-center text-white transition-all">
                <ArrowRight size={16} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
