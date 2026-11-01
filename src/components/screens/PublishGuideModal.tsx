import React, { useState } from 'react';
import { sound } from '../../utils/audio';
import {
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  ShieldCheck,
  Download,
  Terminal,
  ExternalLink,
  X
} from 'lucide-react';

interface PublishGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublishGuideModal: React.FC<PublishGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'apk' | 'playstore' | 'privacy' | 'terms'>('apk');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    sound.playClick();
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const bubblewrapCommand = `# 1. Install Google's official Bubblewrap CLI
npm install -g @bubblewrap/cli

# 2. Initialize Trusted Web Activity (TWA) from your hosted URL
bubblewrap init --manifest=https://your-domain.com/manifest.json

# 3. Build release signed Android App Bundle (AAB) & APK
bubblewrap build

# Output: app-release-signed.aab & app-release-signed.apk ready for Google Play!`;

  const capacitorCommand = `# Alternative: Capacitor Android Native Wrapper
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Puro - Digital game" "com.puro.digitalgame" --web-dir dist
npm run build
npx cap add android
npx cap open android
# Build signed APK/AAB directly inside Android Studio!`;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-3xl w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
              <Smartphone size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-display text-white">ANDROID APK & PUBLISHING GUIDE</h2>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-800">
                  DEVELOPER READY
                </span>
              </div>
              <p className="text-xs text-slate-400">Step-by-step export to Android APK, AAB, and Google Play Console.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 my-4 border-b border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: 'apk', label: '1. Build APK / AAB' },
            { id: 'playstore', label: '2. Google Play Checklist' },
            { id: 'privacy', label: '3. Privacy Policy Template' },
            { id: 'terms', label: '4. Terms of Service' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => {
                sound.playClick();
                setActiveTab(t.id as any);
              }}
              className={`px-3.5 py-1.5 rounded-xl font-bold font-display text-xs transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Build APK & AAB */}
        {activeTab === 'apk' && (
          <div className="space-y-4 flex-1 overflow-y-auto text-xs">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Terminal size={16} className="text-emerald-400" />
                Method A: Google Bubblewrap (Fastest TWA to APK/AAB)
              </h3>
              <p className="text-slate-400 mb-3">
                Google's official CLI tool that bundles your responsive web application into a high-performance Android App Bundle (`.aab`) with full Google Play Billing and push notification support.
              </p>

              <div className="relative bg-slate-900 p-3 rounded-xl font-mono text-[11px] text-cyan-300 border border-slate-800 mb-2">
                <button
                  onClick={() => handleCopy(bubblewrapCommand, 'bw')}
                  className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-[10px]"
                >
                  {copiedCode === 'bw' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedCode === 'bw' ? 'Copied' : 'Copy'}</span>
                </button>
                <pre className="whitespace-pre-wrap">{bubblewrapCommand}</pre>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Smartphone size={16} className="text-cyan-400" />
                Method B: Capacitor Android Native Wrapper
              </h3>
              <p className="text-slate-400 mb-3">
                Full native Android project with access to device hardware, haptics, and custom Gradle build flavors.
              </p>
              <div className="relative bg-slate-900 p-3 rounded-xl font-mono text-[11px] text-indigo-300 border border-slate-800">
                <button
                  onClick={() => handleCopy(capacitorCommand, 'cap')}
                  className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-[10px]"
                >
                  {copiedCode === 'cap' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedCode === 'cap' ? 'Copied' : 'Copy'}</span>
                </button>
                <pre className="whitespace-pre-wrap">{capacitorCommand}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Google Play Checklist */}
        {activeTab === 'playstore' && (
          <div className="space-y-3 flex-1 overflow-y-auto text-xs">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Google Play Store Submission Checklist</h3>
              <div className="space-y-2">
                {[
                  { text: 'App Title: Puro - Digital game', status: 'Compliant' },
                  { text: 'Short Description: Battle Arena Pro online & offline 1v1 and 2v2 multiplayer arcade', status: 'Ready' },
                  { text: 'No Real-Money Gambling: Policy verified (zero wagering, cosmetic items only)', status: 'Approved' },
                  { text: 'Privacy Policy URL & Terms of Service included', status: 'Included' },
                  { text: 'Target Android Version: Android 14+ (API Level 34+)', status: 'Configured' },
                  { text: 'Content Rating: Rated Everyone 10+ (Fantasy Violence)', status: 'Questionnaire Ready' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-slate-300">{item.text}</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                      <CheckCircle2 size={13} /> {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Privacy Policy Template */}
        {activeTab === 'privacy' && (
          <div className="space-y-3 flex-1 overflow-y-auto text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800 leading-relaxed text-slate-300 font-mono">
            <h3 className="font-sans text-sm font-bold text-white mb-2">Privacy Policy for Puro - Digital game</h3>
            <p className="text-slate-400 text-[11px]">Last Updated: November 2026</p>
            <p>1. Information We Collect: We collect username, anonymous player ID, and virtual gameplay metrics to facilitate multiplayer matchmaking and save progress.</p>
            <p>2. No Financial Data Storage: We never store credit card or bank details. All optional payments are handled exclusively by Google Play Billing.</p>
            <p>3. Children’s Privacy: We comply with COPPA and Google Play Families policy. We do not knowingly collect personal information from children under 13.</p>
            <p>4. Data Deletion: Players may delete their account and associated stats directly within the game profile screen at any time.</p>
          </div>
        )}

        {/* Tab 4: Terms of Service */}
        {activeTab === 'terms' && (
          <div className="space-y-3 flex-1 overflow-y-auto text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800 leading-relaxed text-slate-300 font-mono">
            <h3 className="font-sans text-sm font-bold text-white mb-2">Terms of Service</h3>
            <p className="text-slate-400 text-[11px]">Applicable to Puro - Digital game</p>
            <p>1. License: We grant you a revocable, non-exclusive license to play Puro for personal, non-commercial entertainment.</p>
            <p>2. Virtual Items & Currency: Battle Gold, Cyber Gems, and cosmetic skins are digital assets with no real-world monetary value and cannot be exchanged for cash.</p>
            <p>3. Fair Play & Anti-Cheat: Modifying client game files, injecting unauthorized memory modifications, or exploiting glitches may result in temporary or permanent account suspension.</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
