import React from 'react';
import { STORES, SOCIAL_LINKS } from '../data/stores';
import { TikTokIcon } from './icons/TikTokIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { useCart } from '../context/CartContext';
import { MapPin, Clock, Phone, Navigation, Check, Sparkles, X } from 'lucide-react';
import { StoreLocation } from '../types';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({ isOpen, onClose }) => {
  const { selectedStore, setSelectedStore } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-[#141419] border border-white/10 shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-zinc-950">
          <div>
            <h2 className="text-base sm:text-lg font-black text-white">Select Your Store</h2>
            <p className="text-xs text-zinc-400">Order from our flagship kitchen or preview expansion sites</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          {STORES.map((store) => {
            const isSelected = selectedStore.id === store.id;
            const isActive = store.status === 'active';

            return (
              <div
                key={store.id}
                onClick={() => {
                  if (isActive) {
                    setSelectedStore(store);
                    onClose();
                  }
                }}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-rose-500/15 border-rose-500 ring-1 ring-rose-500'
                    : isActive
                    ? 'bg-zinc-900/80 hover:bg-zinc-800/80 border-white/10 cursor-pointer'
                    : 'bg-zinc-950/50 border-white/5 opacity-60'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{store.name}</span>
                    {isActive ? (
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                        OPEN NOW
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                        COMING SOON
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-300">{store.address}</div>
                  <div className="text-[11px] text-zinc-400 flex items-center gap-3 pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      {store.hours}
                    </span>
                    <span className="text-rose-400 font-semibold">{store.landmark}</span>
                  </div>
                </div>

                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const StoreLocatorSection: React.FC = () => {
  const flagship = STORES[0];

  return (
    <section id="store-locator" className="py-14 sm:py-20 bg-[#121217] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>Store Location & Directions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            VISIT OUR PINETOWN SHOP
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 mt-2 font-medium">
            Fresh flame-grilled food served daily. Drop in for collection or order straight to your doorstep.
          </p>
        </div>

        {/* Flagship Store Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: Flagship Store Details Card */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-zinc-900 border border-white/10 shadow-xl flex flex-col justify-between space-y-6">
            <div>
              <div className="inline-block px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase mb-3">
                FLAGSHIP STORE • NOW OPEN
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white">{flagship.name}</h3>
              <p className="text-sm text-rose-400 font-bold mt-1">{flagship.landmark}</p>

              <div className="space-y-4 pt-6 text-sm text-zinc-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-rose-400 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-white">Physical Address</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{flagship.address}</div>
                    <div className="text-xs text-zinc-400">{flagship.city}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-amber-400 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-white">Opening Times</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{flagship.hours}</div>
                    <div className="text-[11px] text-emerald-400 font-bold">Open Every Day of the Week</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-zinc-800 text-emerald-400 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-extrabold text-white">Hotline & WhatsApp</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{flagship.phone}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Direction Actions */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                  'Shop 1, Uniland Centre, Pinetown, South Africa'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-950/30 transition-transform hover:scale-105"
              >
                <Navigation className="w-4 h-4" />
                <span>Get Directions</span>
              </a>

              <a
                href={SOCIAL_LINKS.whatsappDirect}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Us</span>
              </a>
            </div>
          </div>

          {/* Right: Map Embed & Expansion Roadmap */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            
            {/* Interactive Map Visual */}
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-zinc-900 shadow-xl aspect-[16/9] relative">
              <iframe
                title="Wrap & Wing Co Location"
                src="https://maps.google.com/maps?q=Uniland+Centre+Pinetown+KwaZulu-Natal&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="filter contrast-125 brightness-90 grayscale-[25%]"
              />
              
              {/* Map Floating Card */}
              <div className="absolute bottom-4 left-4 p-3 rounded-2xl bg-black/80 backdrop-blur-md border border-white/15 text-xs text-white flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
                <div>
                  <div className="font-extrabold">Shop 1, Uniland Centre</div>
                  <div className="text-[11px] text-zinc-400">Pinetown Central</div>
                </div>
              </div>
            </div>

            {/* Franchise Expansion Teaser */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-zinc-900 to-[#191924] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Expansion In Motion</span>
                </div>
                <h4 className="text-lg font-black text-white">More Branches Opening Across KZN</h4>
                <p className="text-xs text-zinc-400">
                  Targeting Westville, Umhlanga & Durban North. Follow our socials for opening dates!
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={SOCIAL_LINKS.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 hover:text-white border border-white/10 transition-colors flex items-center gap-2"
                >
                  <TikTokIcon className="w-3.5 h-3.5" />
                  <span>TikTok</span>
                </a>
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 hover:text-white border border-white/10 transition-colors flex items-center gap-2"
                >
                  <FacebookIcon className="w-3.5 h-3.5" />
                  <span>Facebook</span>
                </a>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
