import React, { useState } from 'react';
import { Delete, Lock, ShieldCheck } from 'lucide-react';

interface PinLockScreenProps {
  expectedPin: string;
  businessName: string;
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  expectedPin,
  businessName,
  onUnlock,
}) => {
  const [entered, setEntered] = useState('');
  const [error, setError] = useState(false);

  const handleDigit = (digit: string) => {
    if (entered.length >= 4) return;
    const next = entered + digit;
    setEntered(next);
    setError(false);

    if (next.length === 4) {
      if (next === expectedPin) {
        setTimeout(() => onUnlock(), 140);
      } else {
        setError(true);
        setTimeout(() => setEntered(''), 450);
      }
    }
  };

  const handleBackspace = () => {
    setError(false);
    setEntered((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070B19] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-3xl glass-card gold-border-glow p-7 text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-[#F3D474]" />
        </div>

        <div>
          <h1 className="text-xl font-bold text-white">{businessName}</h1>
          <p className="text-xs text-slate-400 mt-1">Enter your 4-digit security PIN to unlock</p>
        </div>

        <div className="flex items-center justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((idx) => {
            const filled = idx < entered.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  error
                    ? 'bg-rose-500 scale-110'
                    : filled
                    ? 'bg-[#D4AF37] scale-110 shadow-[0_0_12px_rgba(212,175,55,0.6)]'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {error && <p className="text-xs text-rose-400">Incorrect PIN. Try again.</p>}

        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDigit(d)}
              className="h-14 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] active:scale-95 border border-slate-800 text-lg font-bold font-mono-num text-white transition-all"
            >
              {d}
            </button>
          ))}
          <div className="h-14 flex items-center justify-center text-[#D4AF37]/60">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] active:scale-95 border border-slate-800 text-lg font-bold font-mono-num text-white transition-all"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] active:scale-95 border border-slate-800 text-slate-300 flex items-center justify-center transition-all"
            aria-label="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
