import React from 'react';
import { SOCIAL_LINKS, STORES } from '../data/stores';
import { TikTokIcon } from './icons/TikTokIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { MapPin, Phone, Clock, Heart, ShieldCheck } from 'lucide-react';
import { LegalTab } from './LegalModal';

interface FooterProps {
  onOpenLegal: (tab: LegalTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal }) => {
  const store = STORES[0];

  return (
    <footer className="bg-zinc-950 border-t border-white/10 text-zinc-400 pt-14 pb-8 sm:pt-16 sm:pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-12 border-b border-white/10">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-5 space-y-4">
            <img
              src="/images/logo/logo-trans.png"
              alt="Wrap and Wing Co"
              className="h-16 w-auto object-contain"
            />
            <p className="text-xs sm:text-sm text-zinc-400 max-w-sm leading-relaxed">
              Wrap & Wing Co. Bold flavour, flame-grilled chicken, handcrafted wraps, and charred wings basted in our 5 signature sauces.
            </p>
            <div className="text-xs font-black text-rose-500 uppercase tracking-widest">
              COME HUNGRY! GOOD VIBES AWAIT!
            </div>

            {/* Social Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href={SOCIAL_LINKS.tiktok}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-colors flex items-center gap-2"
              >
                <TikTokIcon className="w-3.5 h-3.5" />
                <span>TikTok</span>
              </a>
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-colors flex items-center gap-2"
              >
                <FacebookIcon className="w-3.5 h-3.5" />
                <span>Facebook</span>
              </a>
              <a
                href={SOCIAL_LINKS.whatsappDirect}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5"
              >
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Col 2: Flagship Store Details */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Flagship Kitchen
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div>
                  <div className="font-extrabold text-white">{store.mall}</div>
                  <div className="text-zinc-400">{store.landmark}</div>
                  <div className="text-zinc-500">{store.address}, {store.city}</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-zinc-300 font-semibold">{store.hours}</span>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={SOCIAL_LINKS.phoneDirect} className="text-white font-extrabold hover:text-rose-400">
                  {store.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Col 3: Safe Payments & Deliveries */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Payment & Delivery
            </h4>
            <div className="space-y-2 text-xs text-zinc-400">
              <p>
                We accept PayFast Instant EFT, Yoco Card & Apple Pay, Cash, and Speedpoint machines on handover.
              </p>
              <div className="p-3 rounded-xl bg-zinc-900 border border-white/5 space-y-1">
                <div className="text-[11px] font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Doorstep GPS Delivery</span>
                </div>
                <div className="text-[10px] text-zinc-400">
                  Turn-by-turn Waze & Google Maps delivery to Pinetown & surrounds.
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar with POPIA & Terms Links */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <div>© {new Date().getFullYear()} Wrap and Wing Co. All Rights Reserved.</div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onOpenLegal('privacy')}
                className="text-zinc-400 hover:text-white transition-colors underline-offset-4 hover:underline cursor-pointer"
              >
                Privacy Policy (POPIA)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onOpenLegal('terms')}
                className="text-zinc-400 hover:text-white transition-colors underline-offset-4 hover:underline cursor-pointer"
              >
                Terms of Service
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for South African Food Lovers</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
