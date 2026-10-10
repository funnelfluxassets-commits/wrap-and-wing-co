import React from 'react';
import { Flame, Sparkles, Heart, Utensils, Award, MapPin, Users, Compass, Quote } from 'lucide-react';
import { PageView } from '../types';

interface StoryViewProps {
  onNavigate?: (view: PageView) => void;
  onOpenStoreModal?: () => void;
}

export const StoryView: React.FC<StoryViewProps> = () => {
  return (
    <div className="min-h-screen bg-[#0d0d11] text-zinc-100 flex flex-col selection:bg-rose-500 selection:text-white">
      
      {/* ── Header Design sitting directly underneath main navbar with African Art Design & Black Center Block ── */}
      <section className="relative overflow-hidden border-b border-white/10 bg-black min-h-[250px] sm:min-h-[290px] md:min-h-[330px] flex items-center justify-center py-10 sm:py-14">
        {/* Full-width single background image using African Art Design */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/brand/African-Art-Design.webp')",
          }}
          aria-hidden="true"
        />

        {/* Black block behind text matching reference layout (85% opacity so banner is slightly visible) */}
        <div className="relative z-10 max-w-xl md:max-w-2xl w-[92%] sm:w-auto mx-auto px-6 sm:px-12 py-7 sm:py-9 rounded-2xl bg-black/85 border border-white/10 shadow-2xl text-center space-y-2.5">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase leading-tight font-sans drop-shadow">
            OUR STORY
          </h1>

          <div className="text-xs sm:text-sm text-zinc-200 max-w-lg mx-auto font-medium space-y-1">
            <p className="text-amber-400 font-bold">
              Born from Passion. Built with Purpose.
            </p>
            <p className="text-zinc-300">
              Wrap & Wings Co was born from a love for food, a passion for hospitality, and a desire to create something that is truly our own.
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 1: Born from Passion & The Spark (Main Photo Nonto-4) ───── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Main Photo: Team (Nonto-4) */}
          <div className="lg:col-span-6 relative pb-10 sm:pb-12 lg:pb-10">
            <div className="relative rounded-3xl overflow-hidden border border-orange-500/30 shadow-2xl bg-zinc-900 group">
              <img
                src="/images/story/nonto-4.webp"
                alt="Nonto Magcugcwa - Founder of Wrap & Wings Co"
                className="w-full h-auto object-cover aspect-[4/3] sm:aspect-square md:aspect-[4/3] transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Floating Info Box (straddling bottom edge like Signature Special) */}
            <div className="absolute bottom-10 sm:bottom-12 lg:bottom-10 translate-y-1/2 left-3 right-3 sm:left-6 sm:right-6 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/95 border border-white/15 shadow-2xl backdrop-blur-md z-20">
              <div className="text-xs font-black text-amber-400 uppercase tracking-wider">Founder & Visionary</div>
              <div className="text-sm font-bold text-white mt-0.5">
                Nonto Magcugcwa • Founder of Wrap & Wings Co.
              </div>
            </div>
            
            {/* Accent badge */}
            <div className="hidden sm:flex absolute -top-4 -right-4 p-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black text-xs shadow-xl items-center gap-1.5 border border-white/20 z-20">
              <Heart className="w-4 h-4 fill-white" />
              <span>Born from Passion</span>
            </div>
          </div>

          {/* Story Text: The Beginning */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5" />
              <span>The Kitchen as Creative Ground</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug">
              A Lifelong Love for Cooking & Hospitality
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-zinc-300 leading-relaxed">
              <p>
                Cooking has been part of my life for as long as I can remember. From experimenting with recipes to plating food and discovering new flavours, the kitchen has always been a place where I feel creative and inspired.
              </p>
              <p>
                Over the years, I have had the privilege of working within the hospitality industry and alongside different brands. Those experiences taught me the realities of the industry—the long hours, the pressure, the challenges, the lessons and, most importantly, the people.
              </p>
            </div>

            {/* Pivot Quote Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-950/40 via-zinc-900 to-zinc-950 border border-orange-500/30 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-start gap-3.5">
                <Quote className="w-8 h-8 text-amber-400 shrink-0" />
                <div className="space-y-2">
                  <p className="text-base sm:text-lg font-black text-white italic">
                    “Why not build something of my own?”
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-amber-300">
                    That question became the beginning of Wrap & Wings Co.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Section 2: More Than Just Food (Pinetown) ───────────────────────── */}
      <section className="bg-[#121217] border-y border-white/10 py-14 sm:py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Text: More Than Just Food */}
            <div className="lg:col-span-6 space-y-6 order-2 lg:order-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5" />
                <span>Our Heart in Pinetown</span>
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug">
                More Than Just Food
              </h2>

              <div className="space-y-4 text-sm sm:text-base text-zinc-300 leading-relaxed">
                <p>
                  Choosing Pinetown as the home of Wrap & Wings Co was a decision driven by more than business.
                </p>
                <p>
                  We know that Pinetown has its challenges. But we also believe that challenging environments deserve investment, hope and positive spaces.
                </p>
                <p>
                  We wanted to create a place where people could enjoy good food, feel welcome and experience something different—a beautiful, positive space in the heart of a busy community.
                </p>
              </div>

              {/* Belief Banner */}
              <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 flex items-start gap-3.5">
                <Compass className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                  For us, Wrap & Wings Co represents a belief that where there are challenges, there are also opportunities to create change.
                </p>
              </div>
            </div>

            {/* Photo: Restaurant Interior Sanctuary */}
            <div className="lg:col-span-6 order-1 lg:order-2 relative pb-10 sm:pb-12 lg:pb-10">
              <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 group">
                <img
                  src="/images/story/store-image.webp"
                  alt="Wrap & Wings Co dining space at Shop 1, Uniland Centre, Pinetown"
                  className="w-full h-auto object-cover aspect-[4/3] transition-transform duration-500 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating Info Box (straddling bottom edge like Signature Special) */}
              <div className="absolute bottom-10 sm:bottom-12 lg:bottom-10 translate-y-1/2 left-3 right-3 sm:left-6 sm:right-6 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/95 border border-white/15 shadow-2xl backdrop-blur-md z-20">
                <div className="text-xs font-black text-amber-400 uppercase tracking-wider">A Positive Space</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  Shop 1, Uniland Centre, Pinetown • Designed as an uplifting sanctuary for our community.
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Section 3: Creating Opportunities ───────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Photo: Team & Community Gathering */}
          <div className="lg:col-span-6 relative pb-10 sm:pb-12 lg:pb-10">
            <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900 group">
              <img
                src="/images/story/staff-image-mocktails.webp"
                alt="Community and team gathering at Wrap & Wings Co"
                className="w-full h-auto object-cover aspect-[4/3] transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Floating Info Box (straddling bottom edge like Signature Special) */}
            <div className="absolute bottom-10 sm:bottom-12 lg:bottom-10 translate-y-1/2 left-3 right-3 sm:left-6 sm:right-6 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/95 border border-white/15 shadow-2xl backdrop-blur-md z-20">
              <div className="text-xs font-black text-rose-400 uppercase tracking-wider">People First</div>
              <div className="text-sm font-bold text-white mt-0.5">
                Behind every employee is a family, a dream, and a future.
              </div>
            </div>
          </div>

          {/* Text: Creating Opportunities */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" />
              <span>Empowerment & Employment</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-snug">
              Creating Opportunities
            </h2>

            <div className="space-y-4 text-sm sm:text-base text-zinc-300 leading-relaxed">
              <p>
                One of the things that motivates me most is not simply building a profitable business. It is seeing the impact that an opportunity can have on someone's life.
              </p>
              <p>
                Employment can change a person. It can change a family. It can create confidence, independence and hope.
              </p>
              <p>
                Having experienced my own journey and understanding what it feels like when someone gives you an opportunity and believes in your potential, I want Wrap & Wings Co to be a place where other people can experience that too.
              </p>
            </div>

            {/* Golden Heart Highlight Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/30 via-zinc-900 to-zinc-950 border border-amber-500/30 space-y-2.5 shadow-lg">
              <div className="text-base sm:text-lg font-black text-white leading-snug">
                “Behind every CV is a story. Behind every interview is someone hoping for an opportunity. And behind every employee is a family, a dream and a future.”
              </div>
              <div className="text-xs sm:text-sm font-bold text-amber-400 uppercase tracking-wider">
                That is why our people matter so much to us.
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Section 4: Our New Beginning & Welcome ───────────────────────────── */}
      <section className="bg-[#121217] border-y border-white/10 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-extrabold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>The Dream in Motion</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            Our New Beginning
          </h2>

          <div className="space-y-4 text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed">
            <p>
              Wrap & Wings Co brings together everything we have learned, everything we love about food, and our belief in creating something meaningful.
            </p>
            <p>
              We are starting with one dream, one location and one community—but we hope this is only the beginning.
            </p>
          </div>

          {/* Gratitude & Welcome Card */}
          <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-orange-500/30 shadow-2xl space-y-6">
            <div className="space-y-3">
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl mx-auto">
                To everyone who has supported us, shared our journey, given us feedback, worked with us, promoted us and believed in what we are building: <span className="text-white font-extrabold">thank you.</span>
              </p>
              <p className="text-base sm:text-lg font-black text-amber-400">
                You have become part of our story.
              </p>
            </div>

            <div className="pt-6 border-t border-white/10 space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                Welcome to Wrap & Wings Co.
              </h3>
              <p className="text-sm sm:text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-yellow-400">
                Good food. Great people. A dream with purpose.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => onNavigate('menu')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm tracking-wide shadow-xl shadow-rose-950/60 transition-transform hover:scale-105 cursor-pointer"
              >
                Explore Food Menu & Order
              </button>
              <button
                type="button"
                onClick={() => onNavigate('team')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                Meet Our Team
              </button>
              <button
                type="button"
                onClick={onOpenStoreModal}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <MapPin className="w-4 h-4 text-rose-500" />
                <span>Visit Store</span>
              </button>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
