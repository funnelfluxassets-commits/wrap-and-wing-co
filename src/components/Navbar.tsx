import React, { useState } from 'react';
import { ShoppingBag, MapPin, Phone, Clock, ChevronDown, Check, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { STORES, SOCIAL_LINKS } from '../data/stores';
import { TikTokIcon } from './icons/TikTokIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { OrderMode, PageView } from '../types';

export interface NavbarProps {
  onOpenStoreModal: () => void;
  currentView: PageView;
  onNavigate: (view: PageView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenStoreModal, currentView, onNavigate }) => {
  const { totalItemCount, grandTotal, setIsCartOpen, orderMode, setOrderMode, selectedStore } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* ── Top Announcement Banner ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-red-700 via-rose-600 to-orange-600 text-white text-xs font-semibold py-1.5 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 truncate">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-extrabold tracking-wide uppercase">PINETOWN FLAGSHIP NOW OPEN</span>
            <span className="hidden sm:inline text-white/80">• Uniland Centre (Behind Hollywoodbets)</span>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-white/90">
            <a
              href={SOCIAL_LINKS.phoneDirect}
              className="flex items-center gap-1.5 hover:text-white transition-colors font-bold"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>068 886 3892</span>
            </a>
            <span className="hidden md:flex items-center gap-1 text-white/80">
              <Clock className="w-3 h-3" />
              <span>Mon-Sun 9am–6pm</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Sticky Navigation ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#121217]/95 backdrop-blur-md border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          
          {/* Brand Logo & Main Nav Tabs */}
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={() => onNavigate('menu')}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <img
                src="/images/logo/wrap-and-wings-co_optimized.webp"
                alt="Wrap & Wings Co."
                className="h-12 sm:h-14 md:h-16 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </button>

            {/* Desktop Page Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-zinc-900/90 border border-white/10 rounded-full p-1 shadow-inner">
              <button
                type="button"
                onClick={() => onNavigate('menu')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  currentView === 'menu'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🔥 Menu
              </button>
              <button
                type="button"
                onClick={() => onNavigate('story')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  currentView === 'story'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                📖 Our Story
              </button>
              <button
                type="button"
                onClick={() => onNavigate('team')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer ${
                  currentView === 'team'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                👥 Our Team
              </button>
            </nav>
          </div>

          {/* Desktop Order Mode Selector (Collection vs Delivery) */}
          <div className="hidden lg:flex items-center bg-zinc-900/90 border border-white/10 rounded-full p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setOrderMode('collection')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                orderMode === 'collection'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🛍️ Store Collection</span>
              {orderMode === 'collection' && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setOrderMode('delivery')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                orderMode === 'delivery'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>🚗 Home Delivery</span>
              {orderMode === 'delivery' && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Store Location Button */}
          <button
            type="button"
            onClick={onOpenStoreModal}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 text-left transition-colors cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0 pr-1">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <span>Selected Store</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              </div>
              <div className="text-xs font-extrabold text-white truncate max-w-[150px] md:max-w-[190px]">
                {selectedStore.mall}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-white transition-transform group-hover:translate-y-0.5" />
          </button>

          {/* Right Actions: Socials + Cart Button */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Social Icons */}
            <div className="hidden md:flex items-center gap-1.5">
              <a
                href={SOCIAL_LINKS.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                title="Follow us on TikTok"
                className="w-9 h-9 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all hover:border-white/20"
              >
                <TikTokIcon className="w-4 h-4" />
              </a>
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                title="Like us on Facebook"
                className="w-9 h-9 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all hover:border-white/20"
              >
                <FacebookIcon className="w-4 h-4" />
              </a>
            </div>

            {/* Cart Trigger Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2.5 px-3.5 sm:px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold shadow-lg shadow-rose-900/30 transition-all hover:scale-105 cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {totalItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-zinc-950 text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#121217]">
                    {totalItemCount}
                  </span>
                )}
              </div>
              <span className="text-xs sm:text-sm tracking-tight hidden xs:inline">
                {totalItemCount > 0 ? `R${grandTotal.toFixed(2)}` : 'Cart'}
              </span>
            </button>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-zinc-800/80 border border-white/10 text-zinc-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Subheader Bar (Mode & Location) */}
        <div className="lg:hidden px-4 py-2 bg-zinc-900/90 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5">
            <button
              type="button"
              onClick={() => setOrderMode('collection')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                orderMode === 'collection' ? 'bg-rose-600 text-white' : 'text-zinc-400'
              }`}
            >
              🛍️ Collect
            </button>
            <button
              type="button"
              onClick={() => setOrderMode('delivery')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                orderMode === 'delivery' ? 'bg-rose-600 text-white' : 'text-zinc-400'
              }`}
            >
              🚗 Delivery
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenStoreModal}
            className="flex items-center gap-1 text-[11px] font-semibold text-zinc-300 hover:text-white truncate"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="truncate">{selectedStore.mall}</span>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>
        </div>

        {/* Mobile Slide-down Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#18181f] border-b border-white/10 px-4 py-4 space-y-3">
            <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Navigate</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button
                type="button"
                onClick={() => {
                  onNavigate('menu');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg border text-left font-bold transition-colors cursor-pointer ${
                  currentView === 'menu'
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-zinc-800/70 border-white/5 text-zinc-200 hover:text-rose-400'
                }`}
              >
                🔥 Food Menu
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('story');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg border text-left font-bold transition-colors cursor-pointer ${
                  currentView === 'story'
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-zinc-800/70 border-white/5 text-zinc-200 hover:text-rose-400'
                }`}
              >
                📖 Our Story
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('team');
                  setMobileMenuOpen(false);
                }}
                className={`p-2.5 rounded-lg border text-left font-bold transition-colors cursor-pointer ${
                  currentView === 'team'
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-zinc-800/70 border-white/5 text-zinc-200 hover:text-rose-400'
                }`}
              >
                👥 Our Team
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenStoreModal();
                  setMobileMenuOpen(false);
                }}
                className="p-2.5 rounded-lg bg-zinc-800/70 border border-white/5 font-bold text-left hover:text-rose-400 text-zinc-200 cursor-pointer"
              >
                📍 Store Locator
              </button>
              <a
                href={SOCIAL_LINKS.tiktok}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-lg bg-zinc-800/70 border border-white/5 font-bold text-zinc-300 flex items-center gap-2.5 hover:text-white hover:bg-zinc-800"
              >
                <TikTokIcon className="w-4 h-4 text-zinc-400" />
                <span>TikTok Profile</span>
              </a>
              <a
                href={SOCIAL_LINKS.facebook}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-lg bg-zinc-800/70 border border-white/5 font-bold text-zinc-300 flex items-center gap-2.5 hover:text-white hover:bg-zinc-800"
              >
                <FacebookIcon className="w-4 h-4 text-zinc-400" />
                <span>Facebook Page</span>
              </a>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
              <span>Collection & Delivery Hotline:</span>
              <a href={SOCIAL_LINKS.phoneDirect} className="text-rose-400 font-bold">068 886 3892</a>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
