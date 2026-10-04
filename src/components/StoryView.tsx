import React from 'react';
import { ArrowLeft, Flame, Sparkles, Heart, Utensils, Award, MapPin, ChevronRight } from 'lucide-react';
import { PageView } from '../types';

interface StoryViewProps {
  onNavigate: (view: PageView) => void;
  onOpenStoreModal: () => void;
}

export const StoryView: React.FC<StoryViewProps> = ({ onNavigate, onOpenStoreModal }) => {
  return (
    <div className="min-h-screen bg-[#0d0d11] text-zinc-100 flex flex-col selection:bg-rose-500 selection:text-white">
      
      {/* ── Breadcrumb & Top Bar ────────────────────────────────────────────── */}
      <div className="bg-[#121217] border-b border-white/10 sticky top-[73px] z-30 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('menu')}
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Full Menu</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('team')}
              className="text-xs font-bold text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Meet the Team</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('menu')}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-md shadow-rose-950/40 transition-colors cursor-pointer"
            >
              Order Online
            </button>
          </div>
        </div>
      </div>

      {/* ── Hero Banner ────────────────────────────────────────────────────── */}
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-rose-950/30 via-[#0d0d11] to-[#0d0d11] border-b border-white/10 overflow-hidden">
        {/* Glow circles */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Heart & Heritage Behind Wrap & Wing Co.</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase leading-tight">
            The Story of <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-red-400 to-amber-400">Nonto Magcugcwa</span>
          </h1>
          
          <p className="text-base sm:text-xl text-zinc-300 max-w-2xl mx-auto font-medium leading-relaxed">
            How a heartfelt dream to unite people over honest flame-grilled chicken, handcrafted wraps, and genuine South African hospitality became Pinetown’s favourite dining sanctuary.
          </p>
        </div>
      </section>

      {/* ── Section 1: The Founder's Vision ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Image 1: Founder at Restaurant */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 group">
              <img
                src="/images/story/founder-vision.webp"
                alt="Founder Nonto Magcugcwa inside Wrap and Wing Co restaurant"
                className="w-full h-auto object-cover aspect-[4/3] sm:aspect-square md:aspect-[4/3] transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-white/10">
                <div className="text-xs font-black text-rose-400 uppercase tracking-wider">The Vision in Motion</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  Nonto Magcugcwa inside the Pinetown flagship diner with the signature wood-slat feature wall and royal blue booths.
                </div>
              </div>
            </div>
            
            {/* Accent badge */}
            <div className="hidden sm:flex absolute -top-4 -right-4 p-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black text-xs shadow-xl items-center gap-1.5 border border-white/20">
              <Heart className="w-4 h-4 fill-white" />
              <span>Founded with Purpose</span>
            </div>
          </div>

          {/* Text 1: The Spark & Purpose */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              <span>A Clear Calling</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase leading-snug">
              "We Didn’t Just Want To Sell Chicken — We Wanted To Build A Sanctuary."
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-zinc-300 leading-relaxed">
              <p>
                When founder <span className="text-white font-bold">Nonto Magcugcwa</span> set out to create <span className="text-white font-bold">Wrap & Wing Co.</span>, she noticed a void in the fast-casual food landscape of KwaZulu-Natal. Fast food had become cold, transactional, and rushed — stripped of personality, freshness, and soul.
              </p>
              <p>
                Nonto envisioned something radically different: a warm, vibrant neighborhood table where every single meal is prepared over live open flame, seasoned with love, and handed across the counter with a genuine, caring smile.
              </p>
            </div>

            {/* Scripture Highlight Plaque */}
            <div className="p-6 rounded-2xl bg-zinc-900/90 border border-rose-500/30 relative overflow-hidden shadow-inner">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-600/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-start gap-3.5">
                <span className="text-3xl text-rose-500 font-serif leading-none">“</span>
                <div className="space-y-1.5">
                  <p className="text-sm sm:text-base font-semibold text-zinc-100 italic">
                    They broke bread in their homes and ate together with glad and sincere hearts.
                  </p>
                  <div className="text-xs font-black text-rose-400 uppercase tracking-widest">
                    Acts 2:46 • Inscribed on the Flagship Restaurant Wall
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-400">
              This scripture is not just wall decoration — it is the operational heartbeat of the entire kitchen and customer service team. Every patron who walks through the doors is treated as an honored guest in our home.
            </p>
          </div>

        </div>
      </section>

      {/* ── Section 2: Culinary Craft & The 5 Signature Sauces ──────────────── */}
      <section className="bg-[#121217] border-y border-white/10 py-14 sm:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Text 2 */}
            <div className="lg:col-span-6 space-y-6 order-2 lg:order-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Utensils className="w-3.5 h-3.5" />
                <span>The Culinary Standard</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase leading-snug">
                Fresh Poultry. Open Flame. No Microwave Shortcuts.
              </h2>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                Nonto insisted from Day One that Wrap & Wing Co. would never cut corners on food quality. Our kitchen operates on strict culinary standards:
              </p>

              <div className="space-y-3.5">
                <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">100% Fresh Daily Poultry</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Sourced fresh daily from verified local suppliers, rigorously inspected, and hand-trimmed before morning prep.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Live Open-Flame Grilling</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Grilled over open fire grids to lock in succulent moisture while rendering a caramelized, smoky crust that frying can never duplicate.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">The 5 Signature Basting Glazes</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Crafted from proprietary herb & spice blends: zesty Lemony, aromatic Mild, deep smoky BBQ, glossy Sweet Chilli, and fire-roasted Hot.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image 2: Handcrafted Food Feast */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 group">
                <img
                  src="/images/story/handcrafted-food.webp"
                  alt="Wrap and Wing Co handcrafted wraps, wings, fries, and coleslaw spread"
                  className="w-full h-auto object-cover aspect-[4/3] transition-transform duration-500 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-white/10">
                  <div className="text-xs font-black text-amber-400 uppercase tracking-wider">Handcrafted Daily</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    Generously stuffed grilled wraps, golden seasoned chips, charred wings basted in sauce, and fresh homemade coleslaw.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 3: The Dining Space & Community Hub ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" />
            <span>Pinetown Flagship Sanctuary</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
            A Gathering Space For The Community
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            Located at Shop 1 Uniland Centre (behind Hollywoodbets), we engineered our diner to feel warm, relaxing, and filled with good energy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card A: Interior Atmosphere */}
          <div className="rounded-3xl bg-zinc-900 border border-white/10 overflow-hidden shadow-xl flex flex-col group">
            <div className="relative overflow-hidden aspect-[4/3] bg-zinc-950">
              <img
                src="/images/story/restaurant-interior.webp"
                alt="Wrap and Wing Co dining hall and service counters"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-black uppercase tracking-wider">
                Flagship Diner
              </span>
            </div>
            <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Thoughtful Modern Hospitality</h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                  Natural pine timber slat accents, rich royal blue plush booths, dedicated order & collection counters, and warm ambient pendant lighting create an inviting retreat away from the busy streets.
                </p>
              </div>
              <div className="pt-3 border-t border-white/5 text-[11px] font-bold text-zinc-500 flex items-center justify-between">
                <span>Shop 1 Uniland Centre, Pinetown</span>
                <span className="text-emerald-400">Open Daily 9am–6pm</span>
              </div>
            </div>
          </div>

          {/* Card B: Community Gathering */}
          <div className="rounded-3xl bg-zinc-900 border border-white/10 overflow-hidden shadow-xl flex flex-col group">
            <div className="relative overflow-hidden aspect-[4/3] bg-zinc-950">
              <img
                src="/images/story/community-gathering.webp"
                alt="Families and patrons dining together at Wrap and Wing Co"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-rose-600/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-black uppercase tracking-wider">
                Community Warmth
              </span>
            </div>
            <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Eating with Glad & Sincere Hearts</h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                  From local factory workers on their lunch break to families celebrating milestones, our tables are built for connection. Sunflowers on every table bring cheer to every gathering.
                </p>
              </div>
              <div className="pt-3 border-t border-white/5 text-[11px] font-bold text-zinc-500 flex items-center justify-between">
                <span>Dine-In • Takeaway • Delivery</span>
                <span className="text-amber-400">Halal Certified Poultry</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Section 4: 4 Values Grid ────────────────────────────────────────── */}
      <section className="bg-zinc-950/60 border-t border-white/10 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-white/10 space-y-2">
              <div className="text-2xl font-black text-rose-500">01</div>
              <h3 className="text-base font-black text-white">Authentic Passion</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Nonto’s hands-on leadership ensures every recipe, basting sauce, and wrap meets exacting standards of flavor and quality.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-white/10 space-y-2">
              <div className="text-2xl font-black text-amber-500">02</div>
              <h3 className="text-base font-black text-white">Community Focus</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Empowering local Pinetown team members with culinary training, fair wages, and career growth in commercial kitchen management.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-white/10 space-y-2">
              <div className="text-2xl font-black text-emerald-500">03</div>
              <h3 className="text-base font-black text-white">Uncompromising Freshness</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Zero overnight reheats. Every wing and chicken piece is grilled directly to your order over genuine hot coals and gas flame.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-white/10 space-y-2">
              <div className="text-2xl font-black text-cyan-500">04</div>
              <h3 className="text-base font-black text-white">Glad & Sincere Service</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                We believe that how food is served matters just as much as how it tastes. You will always be welcomed with genuine warmth.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 5: Call to Action ────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-gradient-to-t from-rose-950/40 via-[#0d0d11] to-[#0d0d11] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-600/20 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto text-3xl">
            🍗
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            Come Taste The Difference In Person
          </h2>

          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Whether you’re craving a saucy grilled wrap, a 10-piece flame-charred wings feast, or a family full chicken meal — we’re ready to serve you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('menu')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm tracking-wide shadow-xl shadow-rose-950/60 transition-all hover:scale-105 cursor-pointer"
            >
              Explore Food Menu & Order
            </button>
            <button
              type="button"
              onClick={() => onNavigate('team')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white font-bold text-sm transition-all cursor-pointer"
            >
              Meet Our Team & Crew
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
