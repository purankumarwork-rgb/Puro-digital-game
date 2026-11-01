import React, { useState, useEffect } from 'react';
import { UserProfile, CharacterId } from '../../types/game';
import { CHARACTERS } from '../../constants/characters';
import { getRemainingResetTime } from '../../utils/missions';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Swords,
  Bot,
  Users,
  Trophy,
  Target,
  Gift,
  Sparkles,
  ChevronRight,
  Shield,
  Zap,
  Flame,
  Award,
  Play,
  Calendar,
  Clock,
  Coins,
  CheckCircle2,
  Cloud,
  TrendingUp,
  Crown,
  Gamepad2,
  Brain
} from 'lucide-react';

interface HomeScreenProps {
  userProfile: UserProfile;
  onSelectCharacter: (charId: CharacterId) => void;
  onStartQuickMatch: () => void;
  onOpenOfflineSetup: () => void;
  onOpenRoomLobby: () => void;
  onOpenTournament: () => void;
  onStartPractice: () => void;
  onOpenWallet: () => void;
  onOpenShop: () => void;
  onOpenLeaderboard: () => void;
  onClaimDailyReward: () => void;
  onOpenMissions: () => void;
  onOpenDrive: () => void;
  onClaimSingleMission: (missionId: string) => void;
  onOpenBattlePass: () => void;
  onOpenFriends: () => void;
  onOpenGameHub: () => void;
  onOpenLudo: () => void;
  onOpenCarrom: () => void;
  onOpenPuliDanta: () => void;
  onOpenMindMatrix: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userProfile,
  onSelectCharacter,
  onStartQuickMatch,
  onOpenOfflineSetup,
  onOpenRoomLobby,
  onOpenTournament,
  onStartPractice,
  onOpenWallet,
  onOpenShop,
  onOpenLeaderboard,
  onClaimDailyReward,
  onOpenMissions,
  onOpenDrive,
  onClaimSingleMission,
  onOpenBattlePass,
  onOpenFriends,
  onOpenGameHub,
  onOpenLudo,
  onOpenCarrom,
  onOpenPuliDanta,
  onOpenMindMatrix,
}) => {
  const [selectedCharId, setSelectedCharId] = useState<CharacterId>(userProfile.selectedCharacter);
  const currentCharacter = CHARACTERS[selectedCharId] || CHARACTERS.rex;
  const isUnlocked = userProfile.unlockedCharacters.includes(selectedCharId);

  const canClaimDaily = Date.now() - userProfile.lastDailyClaim > 24 * 60 * 60 * 1000;
  const [resetClock, setResetClock] = useState(getRemainingResetTime(userProfile.lastMissionResetTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setResetClock(getRemainingResetTime(userProfile.lastMissionResetTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [userProfile.lastMissionResetTime]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-in select-none">
      {/* Top Banner / Headline */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-cyan-950 border border-cyan-500/30 p-6 md:p-8 shadow-2xl">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={13} />
                Cyber Battle Arena Pro v2.4
              </span>

              {/* Cloud Save Pill */}
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenDrive();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 hover:bg-blue-500/30 text-blue-300 text-xs font-bold transition-colors cursor-pointer"
              >
                <Cloud size={13} />
                <span>Google Drive Save</span>
              </button>
            </div>

            <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-white mb-2 leading-tight">
              PURO <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">DIGITAL GAME</span>
            </h1>
            <p className="text-sm md:text-base text-slate-300 mb-4">
              Action-packed mobile battle arena. Real-time online 1v1 and 2v2 multiplayer with room codes, or free offline training against smart AI bots.
            </p>

            {/* Daily Reward Chest Pill */}
            <div className="inline-flex items-center gap-3 bg-slate-900/90 border border-amber-500/40 rounded-2xl p-2.5 pr-4 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xl">
                🎁
              </div>
              <div>
                <div className="text-xs font-bold text-amber-300">Daily Login Bonus</div>
                <div className="text-[11px] text-slate-400">Day {userProfile.dailyLoginDay} of 7 (+350 Gold)</div>
              </div>
              <button
                onClick={() => {
                  sound.playPowerUp();
                  onClaimDailyReward();
                }}
                disabled={!canClaimDaily}
                className={`ml-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  canClaimDaily
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-95 animate-pulse'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {canClaimDaily ? 'Claim Free' : 'Claimed'}
              </button>
            </div>
          </div>

          {/* Quick Play Action Button */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-3">
            <button
              onClick={() => {
                sound.playClick();
                onStartQuickMatch();
              }}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-lg md:text-xl font-display tracking-wider shadow-2xl flex items-center justify-center gap-3 group active:scale-95 transition-all border border-cyan-300/40"
            >
              <Swords size={24} className="group-hover:rotate-12 transition-transform" />
              <span>QUICK MATCH</span>
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenOfflineSetup();
              }}
              className="px-6 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-400 text-slate-200 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <Bot size={18} className="text-cyan-400" />
              <span>Offline Arena (Free)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Seasonal Battle Pass Banner */}
      <div
        onClick={() => {
          sound.playClick();
          onOpenBattlePass();
        }}
        className="group relative overflow-hidden bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 border-2 border-purple-500/40 hover:border-purple-400 p-5 rounded-3xl shadow-xl cursor-pointer transition-all hover:-translate-y-0.5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center text-2xl font-black font-display text-white shadow-lg group-hover:scale-105 transition-transform">
              <Crown size={28} className="text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-300 bg-purple-950/80 px-2.5 py-0.5 rounded-full border border-purple-800">
                  Season 1: Neon Vanguard
                </span>
                <span className="text-xs font-bold text-amber-400 font-display">
                  Tier {userProfile.battlePass?.tier || 1} / 15
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-black font-display text-white mt-0.5">
                SEASONAL BATTLE PASS TRACK
              </h2>
              <p className="text-xs text-slate-300">
                Unlock exclusive mythic character skins, cyber gems, and cosmetic weapon tracers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Pass Status</div>
              <div className="text-xs font-bold text-purple-300">
                {userProfile.battlePass?.isPremium ? '⭐ Elite Pass Active' : 'Free Pass'}
              </div>
            </div>
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center gap-1.5 group-hover:brightness-110 transition-all pointer-events-none"
            >
              <span>Open Rewards Track</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Daily Challenges Widget (24H Reset) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-indigo-950/60 border border-cyan-500/30 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Calendar size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base md:text-lg font-bold font-display text-white">
                  DAILY CHALLENGES
                </h2>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 font-bold px-2 py-0.5 rounded-full border border-cyan-800">
                  RESETS IN {resetClock.formatted}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Complete varied combat trials to earn virtual coins and rank experience.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onOpenMissions();
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold border border-cyan-500/30 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>View All Challenges</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* 2-Column Challenge Cards Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {userProfile.missions.slice(0, 4).map(mission => {
            const isReadyToClaim = mission.current >= mission.target && !mission.claimed;
            const pct = Math.min(100, (mission.current / mission.target) * 100);

            return (
              <div
                key={mission.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  mission.claimed
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : isReadyToClaim
                    ? 'bg-gradient-to-r from-slate-950 to-emerald-950/40 border-emerald-400/80 shadow-md'
                    : 'bg-slate-950/80 border-slate-800/90'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl flex-shrink-0">
                    {mission.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate font-display">
                        {mission.title}
                      </span>
                      {mission.requiredCharacter && (
                        <span className="text-[9px] bg-indigo-950 text-indigo-400 px-1.5 py-0.2 rounded font-semibold border border-indigo-800 uppercase">
                          {mission.requiredCharacter}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mb-1">
                      {mission.description}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            isReadyToClaim || mission.claimed ? 'bg-emerald-400' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {mission.current}/{mission.target}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                    <Coins size={12} />
                    <span>+{mission.rewardGold}</span>
                  </div>

                  {mission.claimed ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                      <CheckCircle2 size={11} /> Done
                    </span>
                  ) : isReadyToClaim ? (
                    <button
                      onClick={() => {
                        sound.playPowerUp();
                        confetti({ particleCount: 50, spread: 60 });
                        onClaimSingleMission(mission.id);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] uppercase shadow animate-pulse cursor-pointer"
                    >
                      Claim
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-medium">In Progress</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PURO BOARD & SMART THINKING GAMES HUB */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <Gamepad2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black font-display text-white">
                  BOARD & SMART THINKING GAMES
                </h2>
                <span className="text-[10px] bg-purple-950 text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-800">
                  NEW GAMES ADDED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Play classic Ludo, Cyber Carrom ("Charam"), Puli Danta (Tigers & Goats), and Mind Matrix!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onOpenGameHub();
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer self-start sm:self-auto transition-all"
          >
            <span>View All Games</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* 4 Games Quick Launch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ludo */}
          <div
            onClick={() => {
              sound.playClick();
              onOpenLudo();
            }}
            className="group bg-gradient-to-b from-red-950/70 to-slate-950 border border-red-500/40 hover:border-red-400 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">🎲</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40">
                Classic
              </span>
            </div>
            <h3 className="text-base font-bold font-display text-white mb-1 group-hover:text-red-300 transition-colors">
              Ludo Royale
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Dice rolls, 4-corner bases, captures, safe star spots, and bot AI.
            </p>
            <div className="text-xs font-bold text-red-400 flex items-center gap-1">
              Roll Dice <ChevronRight size={14} />
            </div>
          </div>

          {/* Carrom */}
          <div
            onClick={() => {
              sound.playClick();
              onOpenCarrom();
            }}
            className="group bg-gradient-to-b from-amber-950/70 to-slate-950 border border-amber-500/40 hover:border-amber-400 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">🎯</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Tabletop
              </span>
            </div>
            <h3 className="text-base font-bold font-display text-white mb-1 group-hover:text-amber-300 transition-colors">
              Cyber Carrom ("Charam")
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Physics striker flicking, white/black coins, 4 pockets, and Red Queen!
            </p>
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1">
              Flick Striker <ChevronRight size={14} />
            </div>
          </div>

          {/* Puli Danta */}
          <div
            onClick={() => {
              sound.playClick();
              onOpenPuliDanta();
            }}
            className="group bg-gradient-to-b from-emerald-950/70 to-slate-950 border border-emerald-500/40 hover:border-emerald-400 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">🐅</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Smart Strategy
              </span>
            </div>
            <h3 className="text-base font-bold font-display text-white mb-1 group-hover:text-emerald-300 transition-colors">
              Puli Danta (Tigers & Goats)
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Ancient smart thinking game! Tigers hunt 5 Goats; Goats surround and trap all Tigers!
            </p>
            <div className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              Play Strategy <ChevronRight size={14} />
            </div>
          </div>

          {/* Mind Matrix */}
          <div
            onClick={() => {
              sound.playClick();
              onOpenMindMatrix();
            }}
            className="group bg-gradient-to-b from-purple-950/70 to-slate-950 border border-purple-500/40 hover:border-purple-400 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 shadow-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl group-hover:scale-110 transition-transform">🧠</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                IQ Logic
              </span>
            </div>
            <h3 className="text-base font-bold font-display text-white mb-1 group-hover:text-purple-300 transition-colors">
              Mind Matrix (Connect 4)
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Drop glowing nanite orbs, block rival lines, and connect 4 in a row.
            </p>
            <div className="text-xs font-bold text-purple-400 flex items-center gap-1">
              Outsmart Bot <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Game Modes Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold font-display text-white flex items-center gap-2">
            <Target size={22} className="text-cyan-400" />
            CHOOSE GAME MODE
          </h2>
          <span className="text-xs text-slate-400">100% Free Virtual Economy</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Quick Match */}
          <div
            onClick={() => {
              sound.playClick();
              onStartQuickMatch();
            }}
            className="group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-cyan-400 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 shadow-lg hover:shadow-cyan-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <Swords size={24} />
            </div>
            <div className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1">Online PvP</div>
            <h3 className="text-lg font-bold font-display text-white mb-1.5 group-hover:text-cyan-300 transition-colors">
              Quick Match
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Instant matchmaking against active gladiators. Authoritative server sync.
            </p>
            <div className="flex items-center text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
              Play Now <ChevronRight size={14} />
            </div>
          </div>

          {/* 2. Offline Mode */}
          <div
            onClick={() => {
              sound.playClick();
              onOpenOfflineSetup();
            }}
            className="group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-emerald-400 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 shadow-lg hover:shadow-emerald-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <Bot size={24} />
            </div>
            <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">No Internet Needed</div>
            <h3 className="text-lg font-bold font-display text-white mb-1.5 group-hover:text-emerald-300 transition-colors">
              Offline Arena
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Play against computer bots across 4 difficulties (Rookie to Apex Boss). 100% Free.
            </p>
            <div className="flex items-center text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
              Configure Bots <ChevronRight size={14} />
            </div>
          </div>

          {/* 3. Private Room / Play with Friends */}
          <div
            onClick={() => {
              sound.playClick();
              onOpenRoomLobby();
            }}
            className="group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-purple-400 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 shadow-lg hover:shadow-purple-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <div className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-1">Custom Matches</div>
            <h3 className="text-lg font-bold font-display text-white mb-1.5 group-hover:text-purple-300 transition-colors">
              Private Room
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Host or join a custom 1v1 or 2v2 arena with a 6-digit room code. Invite friends.
            </p>
            <div className="flex items-center text-xs font-bold text-purple-400 group-hover:translate-x-1 transition-transform">
              Enter Lobby <ChevronRight size={14} />
            </div>
          </div>

          {/* 4. Online Tournament */}
          <div
            onClick={() => {
              sound.playClick();
              onOpenTournament();
            }}
            className="group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-400 p-5 rounded-2xl cursor-pointer transition-all hover:-translate-y-1 shadow-lg hover:shadow-amber-500/10"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-4 group-hover:scale-110 transition-transform">
              <Trophy size={24} />
            </div>
            <div className="text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">Championship</div>
            <h3 className="text-lg font-bold font-display text-white mb-1.5 group-hover:text-amber-300 transition-colors">
              Tournament
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              8-player knockout bracket. Compete for 10,000 Gold + Legendary Skin trophy.
            </p>
            <div className="flex items-center text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
              View Bracket <ChevronRight size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Hero Armory & Character Select Carousel */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-display text-white flex items-center gap-2">
              <Award size={22} className="text-cyan-400" />
              SELECT ARENA GLADIATOR
            </h2>
            <p className="text-xs text-slate-400">
              Each character features unique weapons, hitpoints, and game-changing ultimate powers.
            </p>
          </div>

          <button
            onClick={onStartPractice}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto border border-cyan-500/30 transition-colors"
          >
            <Target size={15} />
            <span>Practice Range</span>
          </button>
        </div>

        {/* Character Selection Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {(Object.keys(CHARACTERS) as CharacterId[]).map(charId => {
            const char = CHARACTERS[charId];
            const unlocked = userProfile.unlockedCharacters.includes(charId);
            const isSelected = selectedCharId === charId;
            const isEquipped = userProfile.selectedCharacter === charId;

            return (
              <div
                key={charId}
                onClick={() => {
                  sound.playClick();
                  setSelectedCharId(charId);
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all relative flex flex-col items-center text-center ${
                  isSelected
                    ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900 border-cyan-400 shadow-lg scale-102 ring-1 ring-cyan-400'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {isEquipped && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-500 text-slate-950">
                    EQUIPPED
                  </span>
                )}
                {!unlocked && (
                  <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    LOCKED
                  </span>
                )}
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-3xl mb-2 mt-1">
                  {char.avatarUrl}
                </div>
                <div className="font-bold text-sm text-white font-display truncate w-full">{char.name}</div>
                <div className="text-[11px] text-slate-400">{char.role}</div>
              </div>
            );
          })}
        </div>

        {/* Selected Hero Detailed Stats Inspection */}
        <div className="bg-slate-950/80 rounded-2xl border border-slate-800/80 p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-950 to-slate-800 border-2 border-cyan-400 flex items-center justify-center text-4xl shadow-xl">
              {currentCharacter.avatarUrl}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold font-display text-white">{currentCharacter.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30">
                  {currentCharacter.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-md mt-1">{currentCharacter.description}</p>
            </div>
          </div>

          {/* Stat Meters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full lg:w-auto">
            <div className="bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold">HEALTH</div>
              <div className="text-sm font-bold text-emerald-400">{currentCharacter.stats.hp} HP</div>
            </div>
            <div className="bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold">DAMAGE</div>
              <div className="text-sm font-bold text-rose-400">{currentCharacter.stats.damage} DMG</div>
            </div>
            <div className="bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold">SPEED</div>
              <div className="text-sm font-bold text-cyan-400">{currentCharacter.stats.speed} m/s</div>
            </div>
            <div className="bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
              <div className="text-[10px] text-slate-400 font-semibold">WEAPON</div>
              <div className="text-xs font-bold text-yellow-300 truncate">{currentCharacter.weapon.name}</div>
            </div>
          </div>

          {/* Action Button */}
          <div>
            {isUnlocked ? (
              <button
                onClick={() => {
                  sound.playClick();
                  onSelectCharacter(selectedCharId);
                }}
                disabled={userProfile.selectedCharacter === selectedCharId}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md ${
                  userProfile.selectedCharacter === selectedCharId
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black'
                }`}
              >
                {userProfile.selectedCharacter === selectedCharId ? 'Equipped' : 'Equip Gladiator'}
              </button>
            ) : (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenShop();
                }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md"
              >
                Unlock in Shop ({currentCharacter.priceGold} Gold)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
