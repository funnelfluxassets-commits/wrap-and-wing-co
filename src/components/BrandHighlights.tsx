import React from 'react';
import { Flame, ShieldCheck, Heart, Zap, Sparkles } from 'lucide-react';
import { FLAVOURS } from '../data/menuData';
import { ChickenWingIcon } from './icons/ChickenWingIcon';

export const BrandHighlights: React.FC = () => {
  return (
    <section className="py-14 sm:py-20 bg-gradient-to-b from-[#0d0d11] to-[#121217] border-t border-white/10 relative overflow-hidden">
      
      {/* Background accents */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Flame className="w-3.5 h-3.5" />
            <span>The Wrap & Wings Co Difference</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            BOLD FLAVOUR. HOT & FRESH.
          </h2>
          <p className="text-sm sm:text-base text-zinc-200 mt-2 font-medium">
            We don't cut corners. Every order is freshly grilled to order over genuine flame.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-white/10 shadow-lg space-y-3 hover:border-rose-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center text-xl font-black">
              🔥
            </div>
            <h3 className="text-base font-black text-white">Flame-Grilled To Order</h3>
            <p className="text-xs sm:text-[13px] text-zinc-200 leading-relaxed">
              Charred over open fire to seal in natural juices and infuse authentic smoky aroma into every bite.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-white/10 shadow-lg space-y-3 hover:border-emerald-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <ChickenWingIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">100% Fresh Poultry</h3>
            <p className="text-xs sm:text-[13px] text-zinc-200 leading-relaxed">
              Delivered fresh daily, trimmed and marinated in our secret blend of spices before hitting the grill.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-white/10 shadow-lg space-y-3 hover:border-amber-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-xl font-black">
              🌶️
            </div>
            <h3 className="text-base font-black text-white">5 Signature Basting Sauces</h3>
            <p className="text-xs sm:text-[13px] text-zinc-200 leading-relaxed">
              From zesty Lemony and smoky Barbeque to fire-roasted Hot — customize every wing and chicken piece.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-white/10 shadow-lg space-y-3 hover:border-cyan-500/40 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center text-xl font-black">
              ⚡
            </div>
            <h3 className="text-base font-black text-white">Fast Takeaway & Delivery</h3>
            <p className="text-xs sm:text-[13px] text-zinc-200 leading-relaxed">
              Packaged piping hot for collection in minutes or dispatched with live GPS routing straight to your gate.
            </p>
          </div>

        </div>

        {/* Interactive Flavour Meter Showcase */}
        <div className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-3xl bg-zinc-900/95 border border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-400">FIND YOUR SWEET SPOT</span>
              <h3 className="text-xl sm:text-2xl font-black text-white">The Wrap & Wings Flavour Meter</h3>
              <p className="text-xs sm:text-[13px] text-zinc-200 max-w-md">
                Choose the exact flame profile that suits your mood today.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 w-full md:w-auto">
              {FLAVOURS.map((f) => (
                <div
                  key={f.id}
                  className="p-3 rounded-2xl bg-zinc-950/80 border border-white/10 text-center space-y-1 hover:scale-105 transition-transform"
                >
                  <div className="text-2xl">{f.emoji}</div>
                  <div className="text-xs font-black text-white">{f.name}</div>
                  <div className="text-[11px] text-zinc-200 line-clamp-1">{f.description.split('(')[0]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
