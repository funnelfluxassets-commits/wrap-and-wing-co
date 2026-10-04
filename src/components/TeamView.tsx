import React from 'react';
import { ArrowLeft, Users, ShieldCheck, Heart, Sparkles, ChefHat, Flame, Clock, MapPin, ChevronRight, Phone } from 'lucide-react';
import { PageView } from '../types';
import { SOCIAL_LINKS } from '../data/stores';

interface TeamViewProps {
  onNavigate: (view: PageView) => void;
  onOpenStoreModal: () => void;
}

export const TeamView: React.FC<TeamViewProps> = ({ onNavigate, onOpenStoreModal }) => {
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
              onClick={() => onNavigate('story')}
              className="text-xs font-bold text-zinc-400 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Our Story</span>
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
      <section className="relative py-16 sm:py-24 bg-gradient-to-b from-amber-950/20 via-[#0d0d11] to-[#0d0d11] border-b border-white/10 overflow-hidden">
        {/* Glow circles */}
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-extrabold uppercase tracking-widest">
            <Users className="w-3.5 h-3.5" />
            <span>The Family Behind The Grill</span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight uppercase leading-tight">
            Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-rose-500 to-red-500">Wrap & Wing Co. Team</span>
          </h1>
          
          <p className="text-base sm:text-xl text-zinc-300 max-w-2xl mx-auto font-medium leading-relaxed">
            From the fiery precision of our grill masters to the genuine smiles at the order counter — our team is the heartbeat of every bold meal we serve.
          </p>
        </div>
      </section>

      {/* ── Section 1: Front of House Hospitality ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Image 1: Counter Hospitality */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 group">
              <img
                src="/images/team/front-counter-team.webp"
                alt="Wrap and Wing Co front of house staff welcoming customers"
                className="w-full h-auto object-cover aspect-[4/3] sm:aspect-square md:aspect-[4/3] transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-white/10">
                <div className="text-xs font-black text-rose-400 uppercase tracking-wider">Front of House Family</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  Greeting every guest with genuine warmth, recommending flavours, and ensuring your meal is handed over piping hot.
                </div>
              </div>
            </div>

            <div className="hidden sm:flex absolute -bottom-3 -right-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black text-xs shadow-xl items-center gap-1.5 border border-white/20">
              <Sparkles className="w-4 h-4 fill-white" />
              <span>Welcoming Every Guest Like Family</span>
            </div>
          </div>

          {/* Text 1: The Front of House Spirit */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <Heart className="w-3.5 h-3.5" />
              <span>Glad & Sincere Hospitality</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase leading-snug">
              "We Don't Just Take Orders. We Build Relationships."
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-zinc-300 leading-relaxed">
              <p>
                From the moment you walk through our doors at Uniland Centre, you are met with an uplifting atmosphere. Our front-of-house hospitality team takes pride in remembering our regulars' favorite sauces, guiding newcomers through our 5 signature bastings, and making every family feel right at home.
              </p>
              <p>
                Whether you’re popping in for a quick weekday lunch wrap, collecting dinner for the whole family, or dining in our blue booths, our team ensures your experience is smooth, cheerful, and fast.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 space-y-1">
                <div className="text-rose-400 font-black text-base">Instant Smiles</div>
                <div className="text-xs text-zinc-400">Trained to embody the warmth of South African hospitality.</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 space-y-1">
                <div className="text-amber-400 font-black text-base">Speed & Care</div>
                <div className="text-xs text-zinc-400">Streamlined order and collection stations to minimize waiting.</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Section 2: Kitchen Artisans & Grill Masters ─────────────────────── */}
      <section className="bg-[#121217] border-y border-white/10 py-14 sm:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Text 2 */}
            <div className="lg:col-span-6 space-y-6 order-2 lg:order-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5" />
                <span>The Culinary Engine</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight uppercase leading-snug">
                The Grill Masters Behind The Sizzle
              </h2>

              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                Behind the pass, our kitchen crew operates like a synchronized orchestra. Every piece of chicken is watched with eagle-eyed focus over roaring flame grills, basted with generous layers of sauce, and cooked to juicy perfection.
              </p>

              <div className="space-y-3.5">
                <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Flame Temperature Control</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Understanding open fire zones to achieve that signature smoky char without drying out the tender meat inside.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                    <ChefHat className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Strict Hygiene & Uniform Standards</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Every team member wears clean chef uniforms and protective hairnets, following strict commercial food safety protocols.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-white/5 flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">HACCP-Aligned Kitchen Workflow</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Separated linear stations for fresh raw preparation, open-flame cooking, basting, and hot bagging ensure zero cross-contamination.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image 2: Kitchen Crew in Uniform */}
            <div className="lg:col-span-6 order-1 lg:order-2">
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 group">
                <img
                  src="/images/team/kitchen-crew.webp"
                  alt="Wrap and Wing Co kitchen team member in professional chef attire"
                  className="w-full h-auto object-cover aspect-[4/3] transition-transform duration-500 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                
                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-white/10">
                  <div className="text-xs font-black text-amber-400 uppercase tracking-wider">Kitchen Professionalism</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    Our kitchen crew in clean chef attire and hairnets, ensuring peak hygiene and flame consistency on every dish.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 3: Behind the Scenes Photo Gallery ──────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            <span>Behind the Counter</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
            Team In Action
          </h2>
          <p className="text-sm sm:text-base text-zinc-400">
            A look into our daily rhythm at Shop 1 Uniland Centre, Pinetown.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card A: Service Point */}
          <div className="rounded-3xl bg-zinc-900 border border-white/10 overflow-hidden shadow-xl flex flex-col group">
            <div className="relative overflow-hidden aspect-[4/3] bg-zinc-950">
              <img
                src="/images/team/hospitality-service.webp"
                alt="Hospitality and cashier team member serving guests"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-rose-600/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-black uppercase tracking-wider">
                Order & Collect Point
              </span>
            </div>
            <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Attention to Every Detail</h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                  Every order is checked twice: verifying your basting flavour selection, ensuring extra sauces and sides are packed securely, and greeting you with a smile.
                </p>
              </div>
              <div className="pt-3 border-t border-white/5 text-[11px] font-bold text-zinc-500 flex items-center justify-between">
                <span>Speedpoint & Cash Supported</span>
                <span className="text-emerald-400">Collection Ready in Minutes</span>
              </div>
            </div>
          </div>

          {/* Card B: Culture & Atmosphere */}
          <div className="rounded-3xl bg-zinc-900 border border-white/10 overflow-hidden shadow-xl flex flex-col group">
            <div className="relative overflow-hidden aspect-[4/3] bg-zinc-950">
              <img
                src="/images/team/team-service.webp"
                alt="Wrap and Wing Co team atmosphere and service stations"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-amber-500/80 backdrop-blur-md border border-white/10 text-white text-[11px] font-black uppercase tracking-wider">
                Service Flow
              </span>
            </div>
            <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Local Pride & Empowerment</h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 leading-relaxed">
                  We are deeply proud to employ and train local talent from Pinetown and surrounding communities. We foster an environment of growth, mutual respect, and culinary excellence.
                </p>
              </div>
              <div className="pt-3 border-t border-white/5 text-[11px] font-bold text-zinc-500 flex items-center justify-between">
                <span>Proudly Local KZN Team</span>
                <span className="text-amber-400">Crafted with Heart</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Section 4: Operational Pillars ──────────────────────────────────── */}
      <section className="bg-zinc-950/60 border-t border-white/10 py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-white/10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-black">
                🤝
              </div>
              <h3 className="text-base font-black text-white">Warm Hospitality</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Treating every visitor as family with attentive service, genuine smiles, and helpful suggestions.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-white/10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
                🔥
              </div>
              <h3 className="text-base font-black text-white">Grill Mastery</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Trained over real open fire to lock in juices and deliver consistent flavor across every single piece.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-white/10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
                🧼
              </div>
              <h3 className="text-base font-black text-white">Pristine Hygiene</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Clean chef attire, hairnets, and regular sanitization across all preparation and service counters.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-white/10 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center font-black">
                🌱
              </div>
              <h3 className="text-base font-black text-white">Team Growth</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Continuous mentorship in kitchen management, customer service, and culinary craftsmanship.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 5: Flagship Kitchen Visit & Contact ─────────────────────── */}
      <section className="py-16 sm:py-24 bg-gradient-to-t from-amber-950/30 via-[#0d0d11] to-[#0d0d11] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-3xl">
            👋
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            Come Say Hello At Our Pinetown Kitchen
          </h2>

          <div className="p-6 rounded-3xl bg-zinc-900/90 border border-white/10 max-w-lg mx-auto text-center space-y-3 shadow-xl">
            <div className="flex items-center justify-center gap-2 text-rose-400 font-extrabold text-sm uppercase">
              <MapPin className="w-4 h-4" />
              <span>Shop 1, Uniland Centre, Pinetown</span>
            </div>
            <p className="text-xs text-zinc-400">
              Conveniently located behind Hollywoodbets with ample secure customer parking.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-zinc-300 pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Mon – Sun: 9:00 AM – 6:00 PM</span>
              </div>
              <a
                href={SOCIAL_LINKS.phoneDirect}
                className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>068 886 3892</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('menu')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm tracking-wide shadow-xl shadow-rose-950/60 transition-all hover:scale-105 cursor-pointer"
            >
              Order from Our Menu
            </button>
            <button
              type="button"
              onClick={() => onNavigate('story')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white font-bold text-sm transition-all cursor-pointer"
            >
              Read Nonto's Founding Story
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
