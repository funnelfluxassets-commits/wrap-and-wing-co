import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { LegalTab } from './LegalModal';

interface CookieBannerProps {
  onOpenPrivacyPolicy: (tab: LegalTab) => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({ onOpenPrivacyPolicy }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('wrap_wing_cookie_consent');
      if (!consent) {
        // Show after a brief 1.5s delay so the page loads gracefully
        const timer = setTimeout(() => setIsVisible(true), 1200);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('wrap_wing_cookie_consent', 'accepted');
    } catch {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-40 animate-slideUp">
      <div className="p-4 sm:p-4.5 rounded-2xl bg-[#141419]/95 backdrop-blur-md border border-white/15 shadow-2xl text-zinc-300 flex flex-col gap-3">
        
        {/* Header / Info */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-extrabold text-white text-[13px]">
                Cookie & Privacy Notice (POPIA)
              </div>
              <p className="text-zinc-400 leading-relaxed text-[11px] sm:text-xs">
                We use essential cookies to keep your items in your basket and ensure a smooth ordering experience.
                By continuing to browse, you agree to our{' '}
                <button
                  type="button"
                  onClick={() => onOpenPrivacyPolicy('privacy')}
                  className="text-rose-400 hover:text-rose-300 underline underline-offset-2 font-bold cursor-pointer"
                >
                  Privacy Policy
                </button>
                .
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAccept}
            className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer p-1"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
          <button
            type="button"
            onClick={() => onOpenPrivacyPolicy('privacy')}
            className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Read Policy
          </button>
          
          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-black tracking-wide shadow-md transition-all cursor-pointer hover:scale-105"
          >
            Got It 👍
          </button>
        </div>

      </div>
    </div>
  );
};
