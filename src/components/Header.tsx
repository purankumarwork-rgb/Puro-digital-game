import React from 'react';
import { UserProfile } from '../types/game';
import { sound } from '../utils/audio';
import { Volume2, VolumeX, Shield, Coins, Sparkles, Settings, Smartphone, KeyRound, Crown, Users, Gamepad2 } from 'lucide-react';

interface HeaderProps {
  userProfile: UserProfile;
  isOnline: boolean;
  onOpenProfile: () => void;
  onOpenShop: () => void;
  onOpenWallet: () => void;
  onOpenBattlePass: () => void;
  onOpenFriends: () => void;
  onOpenGameHub: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  onOpenPublishGuide: () => void;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  isOnline,
  onOpenProfile,
  onOpenShop,
  onOpenWallet,
  onOpenBattlePass,
  onOpenFriends,
  onOpenGameHub,
  onOpenSettings,
  onOpenAdmin,
  onOpenPublishGuide,
  onOpenAuth,
}) => {
  const [muted, setMuted] = React.useState(!sound.soundEnabled);

  const toggleSound = () => {
    sound.soundEnabled = !sound.soundEnabled;
    setMuted(!sound.soundEnabled);
    if (sound.soundEnabled) sound.startBgm();
    else sound.stopBgm();
  };

  const bpTier = userProfile.battlePass?.tier || 1;

  return (
    <header className="w-full bg-[#090d16]/90 backdrop-blur-md border-b border-cyan-500/20 px-3 md:px-6 py-2.5 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & User Profile preview */}
      <div className="flex items-center gap-3">
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-2 cursor-pointer group bg-slate-900/80 hover:bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/60 hover:border-cyan-400 transition-all"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-lg shadow-md group-hover:scale-105 transition-transform">
            {userProfile.avatar}
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold font-display text-white group-hover:text-cyan-400 transition-colors">
                {userProfile.username}
              </span>
              <span className="text-[10px] bg-cyan-950 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-800 font-bold">
                LV.{userProfile.level}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">
              {userProfile.title}
            </div>
          </div>
        </div>

        {/* Online / Offline status badge */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
            isOnline
              ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
              : 'bg-amber-950/80 text-amber-400 border-amber-800/60'
          }`}
          title={isOnline ? 'Connected to Multiplayer Server' : 'Playing in Local Offline Mode'}
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="hidden xs:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Currency balances & Navigation Action Buttons */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Game Center Hub */}
        <button
          onClick={onOpenGameHub}
          className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:brightness-110 px-2.5 py-1.5 rounded-xl border border-cyan-500/40 cursor-pointer shadow-sm group transition-all"
          title="Puro Game Center (Ludo, Carrom, Puli Danta, Mind Matrix, Battle Arena)"
        >
          <Gamepad2 size={15} className="text-cyan-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold font-display text-cyan-300 hidden sm:inline">Games Hub</span>
        </button>

        {/* Squad / Friends */}
        <button
          onClick={onOpenFriends}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700/80 cursor-pointer shadow-sm group transition-all"
          title="Friends & Direct Invites"
        >
          <Users size={15} className="text-slate-300 group-hover:text-cyan-400 transition-colors" />
          <span className="text-xs font-bold font-display text-slate-300 hidden sm:inline">Friends</span>
          {(userProfile.friends || []).some(f => f.status === 'online') && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        {/* Battle Pass Pill */}
        <button
          onClick={onOpenBattlePass}
          className="flex items-center gap-1.5 bg-gradient-to-r from-purple-950/80 to-indigo-950/80 hover:from-purple-900/80 hover:to-indigo-900/80 px-2.5 py-1.5 rounded-xl border border-purple-500/40 cursor-pointer shadow-sm group transition-all"
          title="Battle Pass Season 1 (Neon Vanguard)"
        >
          <Crown size={15} className="text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold font-display text-purple-300">
            Pass <span className="text-amber-400">T{bpTier}</span>
          </span>
        </button>
        {/* Virtual Battle Gold */}
        <div
          onClick={onOpenWallet}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-amber-500/30 cursor-pointer shadow-sm group transition-all"
          title="Virtual Battle Gold (Click for Wallet)"
        >
          <Coins size={16} className="text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs md:text-sm font-bold font-display text-amber-400">
            {userProfile.gold.toLocaleString()}
          </span>
          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold ml-0.5">
            +
          </span>
        </div>

        {/* Virtual Cyber Gems */}
        <div
          onClick={onOpenShop}
          className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 px-2.5 py-1.5 rounded-xl border border-purple-500/30 cursor-pointer shadow-sm group transition-all"
          title="Virtual Cyber Gems (Click for Shop)"
        >
          <Sparkles size={15} className="text-purple-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs md:text-sm font-bold font-display text-purple-400">
            {userProfile.gems.toLocaleString()}
          </span>
          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1 rounded font-bold ml-0.5">
            +
          </span>
        </div>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-cyan-400 transition-colors"
          title={muted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
        </button>

        {/* Android APK / Publishing Guide */}
        <button
          onClick={onOpenPublishGuide}
          className="hidden sm:flex items-center gap-1 p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-400 hover:text-emerald-300 transition-colors text-xs font-semibold"
          title="Android APK & Publishing Guide"
        >
          <Smartphone size={16} />
          <span className="hidden md:inline">APK & Publish</span>
        </button>

        {/* Admin Panel button */}
        <button
          onClick={onOpenAdmin}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-cyan-400 transition-colors"
          title="Admin Panel & Telemetry"
        >
          <Shield size={17} />
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-cyan-400 transition-colors"
          title="Game Settings"
        >
          <Settings size={17} />
        </button>

        {/* Auth / Login button */}
        <button
          onClick={onOpenAuth}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 text-white font-bold text-xs transition-colors shadow-md"
        >
          <KeyRound size={15} />
          <span className="hidden xs:inline">
            {userProfile.authMethod === 'guest' ? 'Login' : 'Account'}
          </span>
        </button>
      </div>
    </header>
  );
};
