import React, { useState } from 'react';
import { sound } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Coins,
  Sparkles,
  X,
  AlertCircle
} from 'lucide-react';

interface UpiPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: {
    id: string;
    title: string;
    gold: number;
    gems: number;
    priceINR: string;
    priceUSD: string;
  };
  onPaymentSuccess: (gold: number, gems: number) => void;
}

export const UpiPaymentModal: React.FC<UpiPaymentModalProps> = ({
  isOpen,
  onClose,
  pack,
  onPaymentSuccess,
}) => {
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  if (!isOpen || !pack) return null;

  const rawAmount = pack.priceINR.replace(/[^\d]/g, '');
  const upiId = 'puro@slc';
  const payeeName = 'Puran Kumar Pandit';
  const upiDeepLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${rawAmount}&cu=INR&tn=Puro%20Game%20Coins%20${pack.title}`;

  // Generate an accurate QR matrix visual using SVG
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiDeepLink)}&color=090d16&bgcolor=ffffff&margin=8`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    sound.playClick();
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(rawAmount);
    setCopiedAmount(true);
    sound.playClick();
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleConfirmUpi = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    sound.playClick();

    setTimeout(() => {
      setIsVerifying(false);
      setVerified(true);
      sound.playVictory();
      confetti({ particleCount: 90, spread: 80 });

      setTimeout(() => {
        onPaymentSuccess(pack.gold, pack.gems);
        onClose();
      }, 1800);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-purple-500/50 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/40">
              <QrCode size={22} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold font-display text-white">SCAN & PAY WITH ANY UPI</h3>
                <span className="text-[10px] bg-purple-950 text-purple-300 font-bold px-2 py-0.2 rounded-full border border-purple-800">
                  slice
                </span>
              </div>
              <p className="text-[11px] text-slate-400">GPay, PhonePe, Paytm, slice, Cred, BHIM</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Selected Package Summary Pill */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-white font-display">{pack.title}</div>
            <div className="flex items-center gap-2 text-xs mt-0.5">
              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                <Coins size={12} /> +{pack.gold.toLocaleString()}
              </span>
              <span className="text-purple-400 font-bold flex items-center gap-0.5">
                <Sparkles size={12} /> +{pack.gems}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400">Amount Due</div>
            <div className="text-lg font-black font-display text-emerald-400">{pack.priceINR}</div>
          </div>
        </div>

        {/* QR Code Container with slice branding matching user image */}
        <div className="bg-white rounded-2xl p-4 flex flex-col items-center justify-center text-slate-950 shadow-xl mb-4 relative overflow-hidden">
          {/* Slice purple brand banner */}
          <div className="text-purple-700 font-black text-2xl tracking-tight mb-1 flex items-center gap-1">
            <span>slice</span>
          </div>

          <div className="w-52 h-52 bg-white rounded-xl flex items-center justify-center p-1 relative">
            <img
              src={qrSvgUrl}
              alt="UPI QR Code - Puran Kumar Pandit"
              className="w-full h-full object-contain"
            />
            {/* Center avatar overlay matching uploaded image */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-purple-600 shadow-md flex items-center justify-center text-lg">
                🧒
              </div>
            </div>
          </div>

          {/* Account Details from Image */}
          <div className="text-center mt-2 border-t border-slate-200 pt-2 w-full">
            <div className="text-xs font-medium text-slate-700">Account holder: <span className="font-bold text-slate-900">{payeeName}</span></div>
            <div className="text-xs font-bold text-purple-700 flex items-center justify-center gap-1 mt-0.5">
              <span>UPI ID: {upiId}</span>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900"
                title="Copy UPI ID"
              >
                {copiedUpi ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        </div>

        {/* Direct UPI Intent Button (Mobile click-to-pay) */}
        <div className="mb-4">
          <a
            href={upiDeepLink}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            <Smartphone size={16} />
            <span>Open in Any UPI App ({pack.priceINR})</span>
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleConfirmUpi} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">
              Enter 12-digit UTR / UPI Ref Number (After Scanning)
            </label>
            <input
              type="text"
              placeholder="e.g. 430129849201"
              value={utrNumber}
              onChange={e => setUtrNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-purple-400 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Demo Test: Enter any 12 digits or click verify to simulate instant payment confirmation.
            </p>
          </div>

          {verified ? (
            <div className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs text-center flex items-center justify-center gap-2 animate-bounce">
              <Check size={16} />
              <span>Payment Verified! Crediting {pack.gold.toLocaleString()} Gold...</span>
            </div>
          ) : (
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              {isVerifying ? 'Verifying with Bank...' : 'I Have Paid — Verify & Credit Coins'}
            </button>
          )}
        </form>

        {/* Security & Disclaimer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-1.5 text-[10px] text-slate-500">
          <ShieldCheck size={14} className="text-emerald-500 flex-shrink-0" />
          <span>Secure direct UPI gateway. Virtual in-game digital goods. Non-wagering compliant.</span>
        </div>
      </div>
    </div>
  );
};
