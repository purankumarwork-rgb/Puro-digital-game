import React from 'react';
import { UserProfile } from '../../types/game';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Wallet,
  Coins,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Gift,
  Check,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';

interface WalletScreenProps {
  userProfile: UserProfile;
  onOpenShop: () => void;
  onOpenMissions: () => void;
  onClaimDailyLogin: () => void;
}

const DAILY_LOGIN_STREAK = [
  { day: 1, gold: 200, gems: 5 },
  { day: 2, gold: 300, gems: 10 },
  { day: 3, gold: 450, gems: 15 },
  { day: 4, gold: 600, gems: 20 },
  { day: 5, gold: 800, gems: 25 },
  { day: 6, gold: 1000, gems: 35 },
  { day: 7, gold: 2500, gems: 100, isJackpot: true }
];

export const WalletScreen: React.FC<WalletScreenProps> = ({
  userProfile,
  onOpenShop,
  onOpenMissions,
  onClaimDailyLogin,
}) => {
  const canClaimDaily = Date.now() - userProfile.lastDailyClaim > 24 * 60 * 60 * 1000;

  const handleClaim = () => {
    sound.playVictory();
    confetti({ particleCount: 80, spread: 80 });
    onClaimDailyLogin();
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-in select-none">
      {/* Wallet Header */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-yellow-950/80 border border-amber-500/30 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="text-amber-400" size={24} />
            <h1 className="text-2xl md:text-3xl font-black font-display text-white">
              VIRTUAL COIN WALLET
            </h1>
          </div>
          <p className="text-xs text-slate-400 max-w-lg">
            Manage your virtual battle currencies earned from combat, missions, and tournaments.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onOpenMissions();
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5 transition-colors"
          >
            <Calendar size={15} />
            <span>Daily Missions</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onOpenShop();
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black hover:brightness-110 active:scale-95 transition-all shadow-md"
          >
            Get More Coins
          </button>
        </div>
      </div>

      {/* Currency Balances Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Battle Gold */}
        <div className="bg-slate-900/80 border border-amber-500/40 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <Coins size={16} className="text-amber-400" />
              <span>Battle Gold Balance</span>
            </div>
            <div className="text-3xl font-black font-display text-amber-400">
              {userProfile.gold.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Earned freely from matches, daily quests, and level-ups.
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
            🪙
          </div>
        </div>

        {/* Cyber Gems */}
        <div className="bg-slate-900/80 border border-purple-500/40 p-5 rounded-2xl flex items-center justify-between shadow-lg">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              <Sparkles size={16} className="text-purple-400" />
              <span>Cyber Gems Balance</span>
            </div>
            <div className="text-3xl font-black font-display text-purple-400">
              {userProfile.gems.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Premium tokens for rare cosmetic skins & tournament entries.
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-3xl">
            💎
          </div>
        </div>
      </div>

      {/* 7-Day Login Streak Rewards Calendar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold font-display text-white flex items-center gap-2">
              <Gift size={20} className="text-amber-400" />
              7-DAY LOGIN STREAK REWARDS
            </h2>
            <p className="text-xs text-slate-400">
              Log in daily to claim escalating virtual coins and bonus gems.
            </p>
          </div>

          <button
            onClick={handleClaim}
            disabled={!canClaimDaily}
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md self-start sm:self-auto ${
              canClaimDaily
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-95 animate-pulse'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {canClaimDaily ? 'Claim Today’s Bonus' : 'Claimed for Today'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {DAILY_LOGIN_STREAK.map(item => {
            const isCompleted = item.day < userProfile.dailyLoginDay;
            const isCurrent = item.day === userProfile.dailyLoginDay;

            return (
              <div
                key={item.day}
                className={`p-3.5 rounded-2xl border text-center flex flex-col justify-between relative transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-b from-amber-950/80 to-slate-900 border-amber-400 shadow-md ring-1 ring-amber-400 scale-102'
                    : isCompleted
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-60'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                {isCompleted && (
                  <span className="absolute top-2 right-2 text-emerald-400">
                    <Check size={14} />
                  </span>
                )}
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Day {item.day}
                </div>
                <div className="my-2 text-2xl">{item.isJackpot ? '👑' : '🎁'}</div>
                <div>
                  <div className="text-xs font-bold text-amber-400">+{item.gold} Gold</div>
                  <div className="text-[10px] font-semibold text-purple-400">+{item.gems} Gems</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transaction & Activity Ledger */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
        <h2 className="text-lg font-bold font-display text-white mb-3">
          VIRTUAL TRANSACTION HISTORY
        </h2>
        <div className="space-y-2 text-xs">
          {[
            { id: 'tx-1', title: 'Starter Gladiator Grant', type: 'in', amount: '+1,000 Gold', date: 'Just now' },
            { id: 'tx-2', title: 'Daily Login Reward', type: 'in', amount: '+200 Gold', date: 'Today' },
            { id: 'tx-3', title: 'Arena Battle Reward (1v1 Victory)', type: 'in', amount: '+350 Gold', date: 'Recent' }
          ].map(tx => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ArrowDownLeft size={14} />
                </div>
                <div>
                  <div className="font-bold text-white">{tx.title}</div>
                  <div className="text-[10px] text-slate-500">{tx.date}</div>
                </div>
              </div>
              <div className="font-bold font-mono text-emerald-400">{tx.amount}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
