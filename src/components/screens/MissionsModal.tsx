import React, { useEffect, useState } from 'react';
import { UserProfile, DailyMission } from '../../types/game';
import { getRemainingResetTime, rerollSingleMission } from '../../utils/missions';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  Coins,
  Sparkles,
  Award,
  CheckCircle2,
  RefreshCw,
  Gift,
  X,
  Zap,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface MissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onClaimMission: (missionId: string) => void;
  onClaimMegaBonus: () => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onClaimMission,
  onClaimMegaBonus,
  onUpdateProfile,
}) => {
  const [countdown, setCountdown] = useState(getRemainingResetTime(userProfile.lastMissionResetTime));

  // 1-second countdown interval
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCountdown(getRemainingResetTime(userProfile.lastMissionResetTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, userProfile.lastMissionResetTime]);

  if (!isOpen) return null;

  const totalMissions = userProfile.missions.length;
  const completedMissionsCount = userProfile.missions.filter(m => m.claimed).length;
  const canClaimMegaBonus =
    totalMissions > 0 &&
    completedMissionsCount === totalMissions &&
    !userProfile.dailyMissionsCompletedBonusClaimed;

  const handleReroll = (missionId: string) => {
    sound.playClick();
    const updated = rerollSingleMission(userProfile, missionId);
    onUpdateProfile(updated);
  };

  const handleClaim = (mission: DailyMission) => {
    sound.playPowerUp();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
    onClaimMission(mission.id);
  };

  const handleMegaClaim = () => {
    sound.playVictory();
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.5 }
    });
    onClaimMegaBonus();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg">
              <Calendar size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold font-display text-white">DAILY MISSIONS</h2>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 font-bold px-2 py-0.5 rounded-full border border-cyan-800">
                  24H CYCLE
                </span>
              </div>
              <p className="text-xs text-slate-400">Complete missions daily to earn virtual coins and rank EXP.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 24-Hour Reset Countdown & Mega Bonus Banner */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {/* Countdown Clock */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                <Clock size={18} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  NEXT 24H RESET
                </div>
                <div className="text-lg font-black font-display text-cyan-400 tracking-wider">
                  {countdown.formatted}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500">Free Rerolls:</div>
              <div className="text-xs font-bold text-amber-400">
                {userProfile.freeRerollsRemaining} Left Today
              </div>
            </div>
          </div>

          {/* All-Missions Clear Mega Cache */}
          <div
            className={`border rounded-2xl p-3.5 flex items-center justify-between transition-all ${
              canClaimMegaBonus
                ? 'bg-gradient-to-r from-amber-950/80 via-yellow-950/60 to-slate-950 border-amber-400 shadow-lg shadow-amber-500/10'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border ${
                  canClaimMegaBonus
                    ? 'bg-amber-500/30 border-amber-400 animate-bounce'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                🎁
              </div>
              <div>
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                  ALL-CLEAR MEGA CHEST
                </div>
                <div className="text-xs font-bold text-white">
                  {completedMissionsCount} / {totalMissions} Completed
                </div>
              </div>
            </div>

            {userProfile.dailyMissionsCompletedBonusClaimed ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-500/30">
                <CheckCircle2 size={13} /> Claimed
              </span>
            ) : (
              <button
                onClick={handleMegaClaim}
                disabled={!canClaimMegaBonus}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  canClaimMegaBonus
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-md animate-pulse'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                +1,000 Gold
              </button>
            )}
          </div>
        </div>

        {/* Missions List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {userProfile.missions.map(mission => {
            const isReadyToClaim = mission.current >= mission.target && !mission.claimed;
            const progressPercent = Math.min(100, (mission.current / mission.target) * 100);

            return (
              <div
                key={mission.id}
                className={`p-4 rounded-2xl border transition-all ${
                  mission.claimed
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-65'
                    : isReadyToClaim
                    ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/40 border-emerald-400/80 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Icon & Description */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-2xl flex-shrink-0 mt-0.5">
                      {mission.icon}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold font-display text-white text-sm md:text-base">
                          {mission.title}
                        </h3>
                        {mission.requiredCharacter && (
                          <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.2 rounded font-semibold border border-indigo-800 uppercase">
                            {mission.requiredCharacter}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mb-2.5">{mission.description}</p>

                      {/* Progress Bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isReadyToClaim || mission.claimed
                                ? 'bg-emerald-400'
                                : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-300">
                          {mission.current} / {mission.target}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Rewards & Action Button */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {/* Reward Pills */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg text-amber-300 text-xs font-bold">
                        <Coins size={12} />
                        <span>+{mission.rewardGold}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-lg text-cyan-300 text-xs font-bold">
                        <TrendingUp size={12} />
                        <span>+{mission.rewardExp} EXP</span>
                      </div>
                    </div>

                    {/* Button */}
                    <div className="flex items-center gap-2 mt-1">
                      {!mission.claimed && mission.current === 0 && userProfile.freeRerollsRemaining > 0 && (
                        <button
                          onClick={() => handleReroll(mission.id)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          title="Reroll Mission"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}

                      {mission.claimed ? (
                        <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span>Claimed</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleClaim(mission)}
                          disabled={!isReadyToClaim}
                          className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                            isReadyToClaim
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 active:scale-95 animate-pulse'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {isReadyToClaim ? 'CLAIM REWARD' : 'IN PROGRESS'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Policy Note */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={14} className="text-cyan-500" />
            <span>Missions reset automatically at midnight UTC. All rewards are virtual game currency.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
