import React, { useState } from 'react';
import { StaffRole } from '../types';
import { Lock, X, KeyRound, ChefHat, ShieldCheck, AlertCircle } from 'lucide-react';
import { DeliveryMotorbikeIcon } from './icons/DeliveryMotorbikeIcon';

interface StaffLoginModalProps {
  isOpen: boolean;
  initialRole?: StaffRole;
  onClose: () => void;
  onSuccess: (role: StaffRole) => void;
}

const VALID_PINS: Record<StaffRole, string[]> = {
  kitchen: ['4820', '1234', 'wrap123'],
  driver: ['7788', '5678', 'wrap123'],
};

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  initialRole = 'kitchen',
  onClose,
  onSuccess,
}) => {
  const [role, setRole] = useState<StaffRole>(initialRole);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 8) {
      setPin((prev) => prev + num);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPin = pin.trim();
    const valid = VALID_PINS[role];

    if (valid.includes(cleanPin)) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('wrap_wing_staff_role', role);
      }
      setPin('');
      setError(null);
      onSuccess(role);
    } else {
      setError(`Invalid PIN code for ${role === 'kitchen' ? 'Kitchen Display' : 'Delivery Driver'}. Please try again.`);
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#14141c] border border-white/10 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-black/80 space-y-6">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800/80 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          title="Back to Customer Menu"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-950/50">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            Staff Portal Login
          </h2>
          <p className="text-xs text-zinc-400">
            Authorized personnel only. Select your department and enter your access PIN.
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-900/90 p-1.5 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => {
              setRole('kitchen');
              setPin('');
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              role === 'kitchen'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>🍳 Kitchen</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole('driver');
              setPin('');
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              role === 'driver'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 shadow-md font-black'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <DeliveryMotorbikeIcon className="w-4 h-4" />
            <span>Driver</span>
          </button>
        </div>

        {/* PIN Input Display */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold uppercase text-zinc-400 tracking-wider flex items-center justify-between">
              <span>{role === 'kitchen' ? 'Kitchen Passcode' : 'Driver Passcode'}</span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {role === 'kitchen' ? 'Default: 4820' : 'Default: 7788'}
              </span>
            </label>
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                placeholder="Enter PIN..."
                maxLength={8}
                autoFocus
                className="w-full text-center tracking-[0.4em] text-xl font-mono py-3.5 px-4 rounded-2xl bg-zinc-950 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-400 transition-colors"
              />
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Number Keypad for touchscreens & mobile */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleKeyPress(digit)}
                className="py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white font-mono text-base font-bold border border-white/5 transition-all cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 font-bold text-xs border border-white/5 transition-all cursor-pointer uppercase"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              className="py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-white font-mono text-base font-bold border border-white/5 transition-all cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 font-bold text-xs border border-white/5 transition-all cursor-pointer"
            >
              ⌫
            </button>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={!pin}
            className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2 ${
              pin
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 shadow-emerald-950/50'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Unlock {role === 'kitchen' ? 'Kitchen Display' : 'Delivery Display'}</span>
          </button>
        </form>

        {/* Security Notice */}
        <div className="pt-2 border-t border-white/5 text-center">
          <p className="text-[11px] text-zinc-500">
            Wrap & Wings Co. Internal POS & Dispatch Security
          </p>
        </div>

      </div>
    </div>
  );
};
