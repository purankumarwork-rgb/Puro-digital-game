import React, { useState } from 'react';
import { ARENA_MAPS } from '../../constants/characters';
import { sound } from '../../utils/audio';
import { Bot, Swords, X, Shield, Zap, Skull, MapPin, Play } from 'lucide-react';

interface OfflineSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartOfflineMatch: (options: {
    difficulty: 'easy' | 'medium' | 'hard' | 'insane';
    format: '1v1' | '2v2' | '1v3';
    mapId: string;
  }) => void;
}

export const OfflineSetupModal: React.FC<OfflineSetupModalProps> = ({
  isOpen,
  onClose,
  onStartOfflineMatch,
}) => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'insane'>('medium');
  const [format, setFormat] = useState<'1v1' | '2v2' | '1v3'>('1v1');
  const [mapId, setMapId] = useState<string>('cyber_grid');

  if (!isOpen) return null;

  const handleStart = () => {
    sound.playPowerUp();
    onStartOfflineMatch({ difficulty, format, mapId });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Bot size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">OFFLINE BOT ARENA</h2>
              <p className="text-xs text-emerald-400 font-semibold">100% Free Practice & Simulation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 1. Format Selection */}
        <div className="mb-5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
            Match Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: '1v1', label: '1 vs 1 Duel', desc: 'Direct faceoff' },
              { id: '2v2', label: '2 vs 2 Team', desc: 'AI Ally & Enemies' },
              { id: '1v3', label: '1 vs 3 Swarm', desc: 'Survival trial' }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setFormat(f.id as any);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  format === f.id
                    ? 'bg-emerald-950/80 border-emerald-400 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-sm font-bold font-display">{f.label}</div>
                <div className="text-[10px] text-slate-400">{f.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Bot Difficulty Selection */}
        <div className="mb-5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
            AI Bot Difficulty
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'easy', label: 'Rookie (Easy)', desc: 'Beginner practice', icon: Shield, color: 'text-cyan-400' },
              { id: 'medium', label: 'Veteran (Medium)', desc: 'Balanced combat', icon: Zap, color: 'text-emerald-400' },
              { id: 'hard', label: 'Elite (Hard)', desc: 'Aggressive tactics', icon: Swords, color: 'text-amber-400' },
              { id: 'insane', label: 'Apex Boss (Insane)', desc: 'Deadly reflexes', icon: Skull, color: 'text-rose-400' }
            ].map(d => {
              const Icon = d.icon;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setDifficulty(d.id as any);
                  }}
                  className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                    difficulty === d.id
                      ? 'bg-slate-950 border-emerald-400 shadow-md ring-1 ring-emerald-400'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Icon size={18} className={`mt-0.5 ${d.color}`} />
                  <div>
                    <div className="text-xs font-bold text-white font-display">{d.label}</div>
                    <div className="text-[10px] text-slate-400">{d.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Arena Map Selection */}
        <div className="mb-6">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
            Battlefield Map
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ARENA_MAPS.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  sound.playClick();
                  setMapId(m.id);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  mapId === m.id
                    ? 'bg-slate-950 border-cyan-400 shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-bold text-white flex items-center gap-1.5 font-display">
                  <MapPin size={13} className="text-cyan-400" />
                  {m.name}
                </div>
                <div className="text-[10px] text-slate-500">{m.theme}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleStart}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black font-display text-base tracking-wider shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Play size={18} />
          <span>ENTER OFFLINE BATTLE</span>
        </button>
      </div>
    </div>
  );
};
