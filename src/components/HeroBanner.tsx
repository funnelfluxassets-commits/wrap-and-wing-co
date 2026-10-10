import React from 'react';

export const HeroBanner: React.FC = () => {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-black min-h-[250px] sm:min-h-[290px] md:min-h-[330px] flex items-center justify-center py-10 sm:py-14">
      {/* Full-width single background image using African Art Design */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/brand/African-Art-Design.webp')",
        }}
        aria-hidden="true"
      />

      {/* 50% black overlay to reduce pattern intensity */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none" aria-hidden="true" />

      {/* Black block behind text matching reference layout (85% opacity so banner is slightly visible) */}
      <div className="relative z-10 max-w-xl md:max-w-2xl w-[92%] sm:w-auto mx-auto px-6 sm:px-12 py-7 sm:py-9 rounded-2xl bg-black/85 border border-white/10 shadow-2xl text-center space-y-2.5">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase leading-tight font-sans drop-shadow">
          FOOD MENU
        </h1>

        <div className="text-xs sm:text-sm text-zinc-200 max-w-lg mx-auto font-medium space-y-1">
          <p className="text-amber-400 font-bold">
            Bold Flavour. Hot & Fresh.
          </p>
          <p className="text-zinc-300">
            Handcrafted chicken wraps, flame-grilled wings basted in 5 signature sauces, hearty burgers, and crispy sides.
          </p>
        </div>
      </div>
    </section>
  );
};
