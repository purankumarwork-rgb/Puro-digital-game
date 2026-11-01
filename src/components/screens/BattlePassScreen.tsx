import React, { useState } from 'react';
import { UserProfile, BattlePassTier, BattlePassReward, SeasonalQuest } from '../../types/game';
import { BATTLE_PASS_TIERS } from '../../constants/battlePass';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  Gift,
  Coins,
  ChevronRight,
  Flame,
  Clock,
  Shield,
  Zap,
  Star,
  Award,
  Crown,
  Check
} from 'lucide-react';

interface BattlePassScreenProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onOpenShop: () => void;
  onClose: () => void;
}

export const BattlePassScreen: React.FC<BattlePassScreenProps> = ({
  userProfile,
  onUpdateProfile,
  onOpenShop,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'rewards' | 'quests'>('rewards');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const bp = userProfile.battlePass;
  const currentTier = bp.tier;
  const currentXp = bp.xp;
  const isPremium = bp.isPremium;

  // Calculate days remaining in the season
  const msRemaining = Math.max(0, bp.seasonEndsTimestamp - Date.now());
  const daysRemaining = Math.floor(msRemaining / (24 * 60 * 60 * 1000));
  const hoursRemaining = Math.floor((msRemaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  // Count available claimable rewards
  let claimableCount = 0;
  BATTLE_PASS_TIERS.forEach(t => {
    if (t.tier <= currentTier) {
      if (!bp.claimedFreeTiers.includes(t.tier)) claimableCount++;
      if (isPremium && !bp.claimedPremiumTiers.includes(t.tier)) claimableCount++;
    }
  });

  // Claim a single tier reward
  const handleClaimReward = (tierNumber: number, isPremiumTrack: boolean) => {
    const tierData = BATTLE_PASS_TIERS.find(t => t.tier === tierNumber);
    if (!tierData) return;

    const reward = isPremiumTrack ? tierData.premiumReward : tierData.freeReward;
    sound.playPowerUp();
    confetti({ particleCount: 60, spread: 70 });

    let updatedGold = userProfile.gold;
    let updatedGems = userProfile.gems;
    let updatedSkins = [...userProfile.unlockedSkins];
    let updatedTitle = userProfile.title;
    let updatedAvatar = userProfile.avatar;

    if (reward.type === 'gold' && reward.amount) updatedGold += reward.amount;
    if (reward.type === 'gems' && reward.amount) updatedGems += reward.amount;
    if (reward.type === 'skin' && reward.id) {
      if (!updatedSkins.includes(reward.id)) updatedSkins.push(reward.id);
    }
    if (reward.type === 'title') updatedTitle = reward.name.replace('Title: ', '');
    if (reward.type === 'avatar' && reward.icon) updatedAvatar = reward.icon;

    const newClaimedFree = isPremiumTrack ? bp.claimedFreeTiers : [...bp.claimedFreeTiers, tierNumber];
    const newClaimedPremium = isPremiumTrack ? [...bp.claimedPremiumTiers, tierNumber] : bp.claimedPremiumTiers;

    const updatedProfile: UserProfile = {
      ...userProfile,
      gold: updatedGold,
      gems: updatedGems,
      unlockedSkins: updatedSkins,
      title: updatedTitle,
      avatar: updatedAvatar,
      battlePass: {
        ...bp,
        claimedFreeTiers: newClaimedFree,
        claimedPremiumTiers: newClaimedPremium
      }
    };

    onUpdateProfile(updatedProfile);
  };

  // Claim All available rewards across tiers
  const handleClaimAll = () => {
    sound.playVictory();
    confetti({ particleCount: 120, spread: 90 });

    let updatedGold = userProfile.gold;
    let updatedGems = userProfile.gems;
    let updatedSkins = [...userProfile.unlockedSkins];
    const newClaimedFree = [...bp.claimedFreeTiers];
    const newClaimedPremium = [...bp.claimedPremiumTiers];

    BATTLE_PASS_TIERS.forEach(t => {
      if (t.tier <= currentTier) {
        // Free track
        if (!newClaimedFree.includes(t.tier)) {
          newClaimedFree.push(t.tier);
          if (t.freeReward.type === 'gold' && t.freeReward.amount) updatedGold += t.freeReward.amount;
          if (t.freeReward.type === 'gems' && t.freeReward.amount) updatedGems += t.freeReward.amount;
        }
        // Premium track
        if (isPremium && !newClaimedPremium.includes(t.tier)) {
          newClaimedPremium.push(t.tier);
          if (t.premiumReward.type === 'gold' && t.premiumReward.amount) updatedGold += t.premiumReward.amount;
          if (t.premiumReward.type === 'gems' && t.premiumReward.amount) updatedGems += t.premiumReward.amount;
          if (t.premiumReward.type === 'skin' && t.premiumReward.id && !updatedSkins.includes(t.premiumReward.id)) {
            updatedSkins.push(t.premiumReward.id);
          }
        }
      }
    });

    onUpdateProfile({
      ...userProfile,
      gold: updatedGold,
      gems: updatedGems,
      unlockedSkins: updatedSkins,
      battlePass: {
        ...bp,
        claimedFreeTiers: newClaimedFree,
        claimedPremiumTiers: newClaimedPremium
      }
    });
  };

  // Buy Tier Skip (e.g. 50 gems)
  const handleTierSkip = () => {
    if (currentTier >= 15) {
      alert('You have already reached the maximum Battle Pass tier!');
      return;
    }

    if (userProfile.gems < 50) {
      sound.playDefeat();
      alert('You need 50 Cyber Gems to skip to the next tier!');
      return;
    }

    sound.playVictory();
    confetti({ particleCount: 60, spread: 60 });

    onUpdateProfile({
      ...userProfile,
      gems: userProfile.gems - 50,
      battlePass: {
        ...bp,
        tier: currentTier + 1,
        xp: 0
      }
    });
  };

  // Upgrade to Elite Premium Pass
  const handleUpgradeElite = () => {
    const costGems = 250;
    if (userProfile.gems < costGems) {
      sound.playDefeat();
      alert(`Insufficient Cyber Gems! You need ${costGems} Gems to unlock the Elite Pass.`);
      return;
    }

    sound.playVictory();
    confetti({ particleCount: 100, spread: 100 });

    onUpdateProfile({
      ...userProfile,
      gems: userProfile.gems - costGems,
      battlePass: {
        ...bp,
        isPremium: true
      }
    });
    setShowUpgradeModal(false);
  };

  // Claim seasonal quest XP
  const handleClaimQuest = (quest: SeasonalQuest) => {
    if (quest.claimed || quest.current < quest.target) return;
    sound.playPowerUp();

    let nextXp = bp.xp + quest.rewardBpXp;
    let nextTier = bp.tier;

    while (nextXp >= 100 && nextTier < 15) {
      nextXp -= 100;
      nextTier += 1;
    }

    const updatedQuests = bp.seasonalQuests.map(q =>
      q.id === quest.id ? { ...q, claimed: true } : q
    );

    onUpdateProfile({
      ...userProfile,
      battlePass: {
        ...bp,
        tier: nextTier,
        xp: nextTier >= 15 ? 100 : nextXp,
        seasonalQuests: updatedQuests
      }
    });
  };

  const getRarityBadge = (rarity: BattlePassReward['rarity']) => {
    switch (rarity) {
      case 'Mythic':
        return 'bg-amber-500/20 text-amber-300 border-amber-400';
      case 'Legendary':
        return 'bg-purple-500/20 text-purple-300 border-purple-400';
      case 'Epic':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-400';
      case 'Rare':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-400';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-in select-none">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-2 border-purple-500/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute -right-8 -bottom-8 w-72 h-72 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/50 text-purple-300 text-xs font-bold uppercase tracking-wider">
                <Crown size={14} /> Season {bp.season}: {bp.seasonName}
              </span>
              <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-semibold">
                <Clock size={13} className="text-cyan-400" />
                <span>{daysRemaining}d {hoursRemaining}h remaining</span>
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black font-display tracking-tight text-white mb-2 leading-tight">
              NEON VANGUARD <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">BATTLE PASS</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-300 mb-4 max-w-lg">
              Level up your seasonal combat tier to unlock exclusive gladiator skins, cyber gems, and legendary mythic cosmetics across 15 reward levels.
            </p>

            {/* Current Tier & Progress Bar */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-xl font-black font-display text-white shadow-lg">
                  T{currentTier}
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-display">
                    Tier {currentTier} of 15
                  </div>
                  <div className="text-[11px] text-purple-300 font-semibold">
                    {currentTier >= 15 ? 'MAX TIER REACHED!' : `${currentXp} / 100 XP to Tier ${currentTier + 1}`}
                  </div>
                </div>
              </div>

              {/* Tier Progress Bar */}
              <div className="w-full sm:w-36 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${currentTier >= 15 ? 100 : currentXp}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Action Stack: Upgrade to Elite & Tier Skip */}
          <div className="flex flex-col gap-3 min-w-[220px]">
            {isPremium ? (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-center">
                <div className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 size={16} /> Elite Pass Active
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">+20% Seasonal XP Boost</div>
              </div>
            ) : (
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:brightness-110 text-slate-950 font-black font-display text-sm uppercase tracking-wider shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer animate-pulse-glow"
              >
                <Crown size={18} />
                <span>Unlock Elite Pass (250 💎)</span>
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleClaimAll}
                disabled={claimableCount === 0}
                className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1 ${
                  claimableCount > 0
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 active:scale-95 cursor-pointer animate-pulse'
                    : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Gift size={14} />
                <span>Claim All ({claimableCount})</span>
              </button>

              <button
                onClick={handleTierSkip}
                disabled={currentTier >= 15}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                title="Skip Tier for 50 Gems"
              >
                <Zap size={14} />
                <span>+1 Tier (50 💎)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Tier Rewards Track vs Seasonal Quests */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('rewards');
          }}
          className={`px-6 py-2.5 rounded-xl font-bold font-display text-xs md:text-sm transition-all flex items-center gap-2 ${
            activeTab === 'rewards'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <Trophy size={16} />
          <span>Tier Rewards Track (1-15)</span>
          {claimableCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
              {claimableCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('quests');
          }}
          className={`px-6 py-2.5 rounded-xl font-bold font-display text-xs md:text-sm transition-all flex items-center gap-2 ${
            activeTab === 'quests'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <Flame size={16} />
          <span>Seasonal Quests ({bp.seasonalQuests.length})</span>
        </button>
      </div>

      {/* 1. Tier Rewards Track View */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span>Progress through Tiers by playing matches or completing Seasonal Quests.</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" /> Free Track
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Elite Track
              </span>
            </div>
          </div>

          {/* Tiers List Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BATTLE_PASS_TIERS.map(t => {
              const isUnlocked = t.tier <= currentTier;
              const isFreeClaimed = bp.claimedFreeTiers.includes(t.tier);
              const isPremiumClaimed = bp.claimedPremiumTiers.includes(t.tier);

              return (
                <div
                  key={t.tier}
                  className={`p-4 rounded-3xl border transition-all flex flex-col justify-between relative ${
                    t.tier === currentTier
                      ? 'bg-gradient-to-b from-purple-950/60 to-slate-950 border-purple-400 shadow-xl ring-1 ring-purple-400'
                      : isUnlocked
                      ? 'bg-slate-900/80 border-slate-800'
                      : 'bg-slate-950/60 border-slate-900 opacity-75'
                  }`}
                >
                  {/* Top Tier Badge & State */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg font-black font-display text-xs flex items-center justify-center ${
                          isUnlocked
                            ? 'bg-purple-600 text-white shadow'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {t.tier}
                      </div>
                      <span className="text-xs font-bold text-white font-display">
                        Tier {t.tier}
                      </span>
                    </div>

                    {isUnlocked ? (
                      <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full font-bold border border-emerald-800 flex items-center gap-1">
                        <Check size={11} /> Unlocked
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Lock size={12} /> Locked
                      </span>
                    )}
                  </div>

                  {/* Dual Tracks: Free Track on Left, Premium on Right */}
                  <div className="space-y-2 mb-4">
                    {/* Free Track Card */}
                    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center text-lg flex-shrink-0">
                          {t.freeReward.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] text-slate-400 font-semibold uppercase">Free</div>
                          <div className="text-xs font-bold text-white truncate font-display">
                            {t.freeReward.name}
                          </div>
                        </div>
                      </div>

                      {/* Claim Button */}
                      <div>
                        {isFreeClaimed ? (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                            <CheckCircle2 size={12} /> Claimed
                          </span>
                        ) : isUnlocked ? (
                          <button
                            onClick={() => handleClaimReward(t.tier, false)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[10px] uppercase shadow transition-all active:scale-95 cursor-pointer"
                          >
                            Claim
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600">Tier {t.tier}</span>
                        )}
                      </div>
                    </div>

                    {/* Premium / Elite Track Card */}
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-950 border border-amber-500/40 flex items-center justify-between relative overflow-hidden">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-lg flex-shrink-0">
                          {t.premiumReward.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-amber-400 font-black uppercase">Elite</span>
                            <span className={`text-[8px] font-bold px-1 rounded border ${getRarityBadge(t.premiumReward.rarity)}`}>
                              {t.premiumReward.rarity}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-amber-200 truncate font-display">
                            {t.premiumReward.name}
                          </div>
                        </div>
                      </div>

                      {/* Claim Button or Lock */}
                      <div>
                        {isPremiumClaimed ? (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                            <CheckCircle2 size={12} /> Claimed
                          </span>
                        ) : !isPremium ? (
                          <span className="text-[10px] text-amber-500/70 flex items-center gap-1 font-bold">
                            <Lock size={11} /> Elite
                          </span>
                        ) : isUnlocked ? (
                          <button
                            onClick={() => handleClaimReward(t.tier, true)}
                            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-[10px] uppercase shadow transition-all active:scale-95 cursor-pointer"
                          >
                            Claim
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600">Tier {t.tier}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Seasonal Quests Tab View */}
      {activeTab === 'quests' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 px-2">
            Complete seasonal challenges throughout the active season to rack up Battle Pass XP and unlock tiers quickly.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bp.seasonalQuests.map(quest => {
              const isReady = quest.current >= quest.target && !quest.claimed;
              const pct = Math.min(100, (quest.current / quest.target) * 100);

              return (
                <div
                  key={quest.id}
                  className={`p-4 rounded-3xl border transition-all flex items-center justify-between gap-4 ${
                    quest.claimed
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      : isReady
                      ? 'bg-gradient-to-r from-slate-950 to-purple-950/40 border-purple-400 shadow-md'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl flex-shrink-0">
                      {quest.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold font-display text-white truncate">
                        {quest.title}
                      </h3>
                      <p className="text-xs text-slate-400 truncate mb-2">{quest.description}</p>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {quest.current}/{quest.target}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="text-xs font-bold text-purple-400 flex items-center gap-1">
                      <Zap size={13} /> +{quest.rewardBpXp} XP
                    </span>

                    {quest.claimed ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Done
                      </span>
                    ) : isReady ? (
                      <button
                        onClick={() => handleClaimQuest(quest)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-black text-xs uppercase shadow transition-all active:scale-95 animate-pulse cursor-pointer"
                      >
                        Claim XP
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">In Progress</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upgrade Elite Pass Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-3xl mb-3 shadow-lg">
                👑
              </div>
              <h3 className="text-2xl font-black font-display text-white">UPGRADE TO ELITE PASS</h3>
              <p className="text-xs text-amber-300 font-semibold">Season 1: Neon Vanguard</p>
            </div>

            <div className="space-y-2 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 mb-5 text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                <span>Instant unlock: Exclusive Tier 1 Neon Vanguard Rex Chassis</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                <span>Unlock all 15 Premium Tier rewards (Skins, Gems, Avatars)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                <span>+20% Battle Pass XP multiplier on all match completions</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
                <span>Mythic Apex Seraphim Valkyrie Skin at Tier 15</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 mb-5 text-xs">
              <span className="text-slate-400">Unlock Price:</span>
              <span className="text-base font-black text-purple-400 flex items-center gap-1">
                <Sparkles size={16} /> 250 Cyber Gems
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Maybe Later
              </button>
              <button
                onClick={handleUpgradeElite}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                Confirm Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
