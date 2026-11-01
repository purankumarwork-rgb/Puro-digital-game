import React, { useState } from 'react';
import { UserProfile } from '../../types/game';
import { sound } from '../../utils/audio';
import { Trophy, Medal, Award, Flame, Globe, Flag, Sparkles } from 'lucide-react';

interface LeaderboardScreenProps {
  userProfile: UserProfile;
}

const GLOBAL_LEADERBOARD = [
  { rank: 1, name: 'Vortex_Apex', title: 'Grandmaster Gladiator', rating: 3840, wins: 142, kd: 4.8, avatar: '👑', country: 'Global' },
  { rank: 2, name: 'ShadowStriker', title: 'Cyber Assassin', rating: 3620, wins: 128, kd: 4.1, avatar: '🥷', country: 'USA' },
  { rank: 3, name: 'NeonValkyrie', title: 'Nanite Seraph', rating: 3490, wins: 119, kd: 3.9, avatar: '💎', country: 'India' },
  { rank: 4, name: 'VoltExecutioner', title: 'Railgun Marksman', rating: 3210, wins: 104, kd: 3.5, avatar: '⚡', country: 'Japan' },
  { rank: 5, name: 'InfernoJuggernaut', title: 'Magma Heavy', rating: 3080, wins: 98, kd: 3.2, avatar: '🔥', country: 'Germany' },
  { rank: 6, name: 'ZeroProtocol', title: 'Apex Hunter', rating: 2940, wins: 88, kd: 3.0, avatar: '🛡️', country: 'Brazil' },
  { rank: 7, name: 'QuantumBlade', title: 'Warp Infiltrator', rating: 2810, wins: 82, kd: 2.8, avatar: '⚡', country: 'UK' }
];

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({ userProfile }) => {
  const [filter, setFilter] = useState<'global' | 'regional'>('global');

  const userWinRate =
    userProfile.stats.matchesPlayed > 0
      ? Math.round((userProfile.stats.matchesWon / userProfile.stats.matchesPlayed) * 100)
      : 0;

  const userKD =
    userProfile.stats.deaths > 0
      ? (userProfile.stats.kills / userProfile.stats.deaths).toFixed(1)
      : (userProfile.stats.kills || 0).toFixed(1);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-in select-none">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900 to-blue-950/80 border border-cyan-500/30 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="text-yellow-400" size={24} />
            <h1 className="text-2xl md:text-3xl font-black font-display text-white">
              ARENA LEADERBOARDS
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Top combat gladiators ranked by verified competitive rating and tournament wins.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              setFilter('global');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'global' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Worldwide
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setFilter('regional');
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'regional' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Regional
          </button>
        </div>
      </div>

      {/* User's Current Rank Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/50 border-2 border-cyan-500/50 p-4 rounded-2xl flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-2xl">
            {userProfile.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white font-display">{userProfile.username} (You)</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-800 font-bold">
                RANK #14
              </span>
            </div>
            <div className="text-xs text-slate-400">{userProfile.title}</div>
          </div>
        </div>

        <div className="flex items-center gap-6 text-right">
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Win Rate</div>
            <div className="text-sm font-bold text-emerald-400">{userWinRate}%</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase">K/D Ratio</div>
            <div className="text-sm font-bold text-cyan-400">{userKD}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase">Rating</div>
            <div className="text-sm font-bold text-amber-400">1,850 PTS</div>
          </div>
        </div>
      </div>

      {/* Global Gladiators Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
        <div className="space-y-2">
          {GLOBAL_LEADERBOARD.map(p => (
            <div
              key={p.rank}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                p.rank === 1
                  ? 'bg-gradient-to-r from-amber-950/60 to-slate-950 border-amber-400/80 shadow-md'
                  : p.rank === 2
                  ? 'bg-gradient-to-r from-slate-800/60 to-slate-950 border-slate-400/60'
                  : p.rank === 3
                  ? 'bg-gradient-to-r from-amber-900/30 to-slate-950 border-amber-600/50'
                  : 'bg-slate-950/80 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl font-display font-black text-sm flex items-center justify-center ${
                    p.rank === 1
                      ? 'bg-amber-500 text-slate-950'
                      : p.rank === 2
                      ? 'bg-slate-400 text-slate-950'
                      : p.rank === 3
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  #{p.rank}
                </div>

                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl">
                  {p.avatar}
                </div>

                <div>
                  <div className="text-sm font-bold text-white font-display flex items-center gap-2">
                    {p.name}
                    <span className="text-[10px] text-slate-500">({p.country})</span>
                  </div>
                  <div className="text-xs text-slate-400">{p.title}</div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div className="hidden sm:block">
                  <div className="text-[10px] text-slate-500">WINS</div>
                  <div className="text-xs font-bold text-white">{p.wins}</div>
                </div>
                <div className="hidden sm:block">
                  <div className="text-[10px] text-slate-500">K/D</div>
                  <div className="text-xs font-bold text-emerald-400">{p.kd}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">RATING</div>
                  <div className="text-sm font-bold font-mono text-cyan-400">{p.rating}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
