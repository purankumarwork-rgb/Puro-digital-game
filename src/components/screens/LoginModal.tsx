import React, { useState } from 'react';
import { UserProfile } from '../../types/game';
import { sound } from '../../utils/audio';
import {
  KeyRound,
  Phone,
  Mail,
  User,
  X,
  Lock,
  ArrowRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (userData: {
    username: string;
    emailOrPhone: string;
    authMethod: 'phone' | 'email' | 'google' | 'guest';
  }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'phone' | 'email' | 'google'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    sound.playClick();
    setOtpSent(true);
  };

  const handleVerifyPhone = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playVictory();
    onLoginSuccess({
      username: username.trim() || `Gladiator_${phone.slice(-4) || 'Pro'}`,
      emailOrPhone: phone.trim(),
      authMethod: 'phone'
    });
    onClose();
  };

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    sound.playVictory();
    const cleanUsername = username.trim() || email.split('@')[0];
    onLoginSuccess({
      username: cleanUsername,
      emailOrPhone: email.trim(),
      authMethod: 'email'
    });
    onClose();
  };

  const handleGoogleAuth = () => {
    sound.playVictory();
    onLoginSuccess({
      username: 'CyberPilot_Google',
      emailOrPhone: 'pilot@gmail.com',
      authMethod: 'google'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">
                {isRegistering ? 'CREATE ACCOUNT' : 'LOGIN TO PURO'}
              </h2>
              <p className="text-xs text-slate-400">Sync arena rank & virtual coin wallet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection (Phone vs Email vs Google) */}
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setTab('phone');
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'phone' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone size={14} />
            <span>Mobile</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setTab('email');
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'email' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail size={14} />
            <span>Email</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setTab('google');
            }}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'google' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>Google</span>
          </button>
        </div>

        {/* 1. Mobile Phone + OTP Simulation */}
        {tab === 'phone' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Standard SMS verification code will be simulated.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
                >
                  Send OTP Code
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhone} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Gladiator Username (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your gamertag"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none mb-3"
                  />

                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    placeholder="6 5 4 3 2 1"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="w-full bg-slate-950 border border-cyan-400 rounded-xl px-3.5 py-2.5 text-center text-lg tracking-widest font-mono text-cyan-300 focus:outline-none"
                  />
                  <div className="text-[10px] text-emerald-400 mt-1 flex justify-between">
                    <span>Test OTP: Any 6 digits (e.g. 123456)</span>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      Change Number
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all"
                >
                  Verify & Enter Arena
                </button>
              </form>
            )}
          </div>
        )}

        {/* 2. Email + Password */}
        {tab === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {isRegistering && (
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Gladiator Gamertag
                </label>
                <input
                  type="text"
                  placeholder="ApexGladiator"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="gladiator@puro.game"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-300">Password</label>
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={() => {
                      setRecoverySent(true);
                      setTimeout(() => setRecoverySent(false), 4000);
                    }}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            {recoverySent && (
              <div className="text-[11px] text-emerald-400 bg-emerald-950/60 p-2 rounded-lg border border-emerald-500/30">
                Password recovery link sent to your email address!
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all mt-2"
            >
              {isRegistering ? 'Register Account' : 'Sign In'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs text-slate-400 hover:text-cyan-400"
              >
                {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        )}

        {/* 3. Google Sign In */}
        {tab === 'google' && (
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-400 text-center">
              Sign in with your Google account for one-click access across all mobile devices.
            </p>
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl flex items-center justify-center gap-3 transition-transform active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* Security badge */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Accounts encrypted & protected by server-side authentication</span>
        </div>
      </div>
    </div>
  );
};
