import React from 'react';
import { Flame, Clock, MapPin, Phone, ArrowDown, Sparkles } from 'lucide-react';
import { SOCIAL_LINKS } from '../data/stores';
import { FLAVOURS } from '../data/menuData';
import { ChickenWingIcon } from './icons/ChickenWingIcon';

export const HeroBanner: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#16161c] via-[#121217] to-[#0d0d11] pt-6 pb-12 sm:pt-10 sm:pb-16 border-b border-white/10">
      
      {/* Background Decorative Gradients & Textures */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headlines & Call to Action */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left">
            
            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold tracking-wide shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <Flame className="w-4 h-4 text-rose-500" />
              <span>FLAME-GRILLED TO PERFECTION • PINETOWN</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-1 sm:space-y-2">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight uppercase leading-[0.95]">
                BOLD FLAVOUR. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-orange-400 to-amber-400">
                  HOT & FRESH.
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-zinc-300 font-medium max-w-xl mx-auto lg:mx-0 pt-2">
                Come hungry! Handcrafted chicken wraps, flame-grilled wings basted in 5 signature sauces, hearty burgers, and crispy sides.
              </p>
            </div>

            {/* Store Information Cards (Pinetown Highlights) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-lg mx-auto lg:mx-0 pt-1 text-left">
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 flex items-start gap-2.5 shadow-sm">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-zinc-400 uppercase">Shop 1, Uniland Centre</div>
                  <div className="text-xs font-extrabold text-white">Pinetown (Behind Hollywoodbets)</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 flex items-start gap-2.5 shadow-sm">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-zinc-400 uppercase">Trading Hours</div>
                  <div className="text-xs font-extrabold text-white">Mon – Sun: 9:00 AM – 6:00 PM</div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <a
                href="#menu-section"
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm tracking-wide shadow-xl shadow-rose-900/40 hover:scale-105 transition-all flex items-center gap-2"
              >
                <span>ORDER NOW</span>
                <ArrowDown className="w-4 h-4" />
              </a>

              <a
                href={SOCIAL_LINKS.whatsappDirect}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white font-bold text-sm tracking-wide transition-all flex items-center gap-2 hover:border-emerald-500/50"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp 068 886 3892</span>
              </a>
            </div>

            {/* Signature 5 Flavours Bar */}
            <div className="pt-3 border-t border-white/10">
              <div className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400 mb-2.5 flex items-center justify-center lg:justify-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>5 Signature Flame Basting Flavours</span>
              </div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                {FLAVOURS.map((f) => (
                  <span
                    key={f.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-white/10 text-xs font-bold text-zinc-200"
                  >
                    <span>{f.emoji}</span>
                    <span>{f.name}</span>
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Main Featured Food Plate Frame */}
              <div className="relative rounded-3xl overflow-hidden border-2 border-white/15 shadow-2xl bg-zinc-900 group">
                <img
                  src="/images/menu/wrap-and-side.webp"
                  alt="Wrap It Like A Shwarma Combo"
                  className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Overlay Badge */}
                <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-black/80 backdrop-blur-md border border-white/15 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">SIGNATURE SPECIAL</span>
                    <h3 className="text-sm font-extrabold text-white">Wrap It Like A Shwarma + Side</h3>
                    <p className="text-[11px] text-zinc-300">Served with hot chips or spicy rice</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 line-through">R79</span>
                    <div className="text-lg font-black text-amber-400">R69.90</div>
                  </div>
                </div>
              </div>

              {/* Floating Floating Wing Tag */}
              <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 p-3 rounded-2xl bg-zinc-900/95 border border-white/15 shadow-xl backdrop-blur-md flex items-center gap-3 animate-bounce [animation-duration:4s]">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <ChickenWingIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-zinc-400 uppercase">Flame-Grilled Wings</div>
                  <div className="text-xs font-black text-white">From R49.90 with Side</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
