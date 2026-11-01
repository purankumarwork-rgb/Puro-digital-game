import React, { useState } from 'react';
import { GameSettings } from '../../types/game';
import { sound } from '../../utils/audio';
import { Settings, Volume2, VolumeX, Smartphone, Monitor, Shield, X, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [sfx, setSfx] = useState(settings.sfxVolume);
  const [bgm, setBgm] = useState(settings.bgmVolume);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [vibration, setVibration] = useState(settings.vibration);
  const [joystickSize, setJoystickSize] = useState(settings.joystickSize);
  const [graphicsQuality, setGraphicsQuality] = useState(settings.graphicsQuality);

  if (!isOpen) return null;

  const handleSave = () => {
    sound.sfxVolume = sfx;
    sound.bgmVolume = bgm;
    sound.soundEnabled = soundEnabled;
    if (soundEnabled) sound.startBgm();
    else sound.stopBgm();

    onUpdateSettings({
      sfxVolume: sfx,
      bgmVolume: bgm,
      soundEnabled,
      vibration,
      showFps: settings.showFps,
      joystickSize,
      graphicsQuality
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">SETTINGS</h2>
              <p className="text-xs text-slate-400">Audio, mobile touch controls & graphics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Sound Master Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-white font-bold">
              {soundEnabled ? <Volume2 size={16} className="text-cyan-400" /> : <VolumeX size={16} className="text-slate-500" />}
              <span>Sound & Audio Effects</span>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={e => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div>
            <div className="flex justify-between text-slate-300 font-semibold mb-1">
              <span>SFX Volume</span>
              <span className="text-cyan-400">{Math.round(sfx * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfx}
              onChange={e => setSfx(parseFloat(e.target.value))}
              disabled={!soundEnabled}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* BGM Volume */}
          <div>
            <div className="flex justify-between text-slate-300 font-semibold mb-1">
              <span>BGM Techno Beat</span>
              <span className="text-cyan-400">{Math.round(bgm * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bgm}
              onChange={e => setBgm(parseFloat(e.target.value))}
              disabled={!soundEnabled}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Mobile Joystick Size */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Touch Joystick Size</label>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as const).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setJoystickSize(size)}
                  className={`py-2 rounded-xl capitalize font-bold border transition-all ${
                    joystickSize === size
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Graphics Quality */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1">Graphics Quality</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setGraphicsQuality(q)}
                  className={`py-2 rounded-xl capitalize font-bold border transition-all ${
                    graphicsQuality === q
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-800 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
