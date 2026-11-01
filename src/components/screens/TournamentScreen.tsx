import React, { useState } from 'react';
import { UserProfile } from '../../types/game';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { Trophy, Swords, Award, Users, Shield, Play, Sparkles, Check } from 'lucide-react';

interface TournamentScreenProps {
  userProfile: UserProfile;
  onEnterMatch: () => void;
  onClose: () => void;
}

export const TournamentScreen: React.FC<TournamentScreenProps> = ({
  userProfile,
  onEnterMatch,
  onClose,
}) => {
  const [tournamentState, setTournamentState] = useState<'open' | 'bracket' | 'champion'>('bracket');

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 flex flex-col gap-6 animate-fade-in select-none">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border border-amber-500/40 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 uppercase mb-2">
            <Trophy size={14} /> Season 4 Apex Championship
          </div>
          <h1 className="text-2xl md:text-4xl font-black font-display text-white">
            APEX CYBER TOURNAMENT
          </h1>
          <p className="text-xs text-slate-400 max-w-md mt-1">
            Knockout bracket format. Win 3 consecutive rounds to claim the Apex Crown & 10,000 Battle Gold!
          </p>
        </div>

        <div className="bg-slate-950/90 border border-amber-500/40 p-4 rounded-2xl flex items-center gap-4">
          <div className="text-3xl">🏆</div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">GRAND PRIZE POOL</div>
            <div className="text-base font-bold text-amber-400">10,000 Gold + Mythic Skin</div>
            <div className="text-[10px] text-emerald-400">Entry: 100% Free (Skill-Based)</div>
          </div>
        </div>
      </div>

      {/* Tournament Knockout Bracket */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 overflow-x-auto">
        <h2 className="text-lg font-bold font-display text-white mb-6 flex items-center gap-2">
          <Swords size={20} className="text-cyan-400" />
          8-PLAYER KNOCKOUT BRACKET
        </h2>

        <div className="min-w-[700px] grid grid-cols-3 gap-6 relative">
          {/* Column 1: Quarterfinals */}
          <div className="flex flex-col justify-around gap-4">
            <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1 text-center">
              Quarterfinals
            </div>

            {/* Match 1 */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span>Vortex#102 (Rex)</span>
                <span>5</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>CyberNova#88 (Shadow)</span>
                <span>3</span>
              </div>
            </div>

            {/* Match 2 */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>GhostFire#45 (Volt)</span>
                <span>2</span>
              </div>
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span>ShadowBlade#99</span>
                <span>5</span>
              </div>
            </div>

            {/* Match 3 (User's match!) */}
            <div className="bg-slate-950 p-3 rounded-xl border-2 border-cyan-400 space-y-1 text-xs shadow-lg shadow-cyan-500/10">
              <div className="flex justify-between items-center text-cyan-300 font-bold">
                <span>{userProfile.username} (You)</span>
                <span className="text-emerald-400 font-black">5</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>ZeroTolerance#77</span>
                <span>1</span>
              </div>
            </div>

            {/* Match 4 */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span>PuroChampion#01</span>
                <span>5</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>ThunderBolt#64</span>
                <span>3</span>
              </div>
            </div>
          </div>

          {/* Column 2: Semifinals */}
          <div className="flex flex-col justify-around gap-8 py-6">
            <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1 text-center">
              Semifinals
            </div>

            {/* Semi 1 */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span>Vortex#102</span>
                <span>5</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>ShadowBlade#99</span>
                <span>4</span>
              </div>
            </div>

            {/* Semi 2 (Next match for user!) */}
            <div className="bg-gradient-to-r from-slate-950 to-indigo-950 p-3.5 rounded-xl border-2 border-indigo-400 space-y-2 text-xs shadow-xl">
              <div className="flex justify-between items-center text-cyan-300 font-bold">
                <span>{userProfile.username} (You)</span>
                <span className="text-amber-400 font-bold">READY</span>
              </div>
              <div className="flex justify-between items-center text-purple-300 font-bold">
                <span>PuroChampion#01</span>
                <span className="text-slate-400 font-bold">READY</span>
              </div>
              <button
                onClick={() => {
                  sound.playPowerUp();
                  onEnterMatch();
                }}
                className="w-full mt-2 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 font-black text-white text-[11px] hover:brightness-110 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1"
              >
                <Play size={12} />
                <span>FIGHT SEMIFINAL</span>
              </button>
            </div>
          </div>

          {/* Column 3: Grand Final */}
          <div className="flex flex-col justify-center gap-4 py-12">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 text-center">
              Grand Final
            </div>

            <div className="bg-gradient-to-b from-slate-950 to-amber-950/40 p-4 rounded-2xl border-2 border-amber-400/80 space-y-2 text-xs shadow-2xl text-center">
              <div className="text-2xl mb-1">👑</div>
              <div className="font-bold text-amber-300 text-sm font-display">CHAMPIONSHIP MATCH</div>
              <div className="text-slate-400 text-[11px]">Vortex#102 vs Winner of Semi 2</div>
              <div className="text-[10px] text-amber-400 font-bold pt-2 border-t border-slate-800">
                Winner Takes Grand Trophy
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
