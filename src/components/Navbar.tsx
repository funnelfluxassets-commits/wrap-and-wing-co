import React, { useState, useEffect } from 'react';
import { ShoppingBag, MapPin, Phone, Clock, ChevronDown, Check, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { STORES, SOCIAL_LINKS } from '../data/stores';
import { TikTokIcon } from './icons/TikTokIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { OrderMode, PageView } from '../types';
import { subscribeToOrders, getCurrentOrderId } from '../services/orderService';

export interface NavbarProps {
  onOpenStoreModal: () => void;
  currentView: PageView;
  onNavigate: (view: PageView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenStoreModal, currentView, onNavigate }) => {
  const { totalItemCount, grandTotal, setIsCartOpen, orderMode, setOrderMode, selectedStore } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(getCurrentOrderId());

  useEffect(() => {
    const unsub = subscribeToOrders((orders) => {
      const myOrderId = getCurrentOrderId();
      if (!myOrderId) {
        setActiveOrderId(null);
        return;
      }
      const cleanMyId = myOrderId.replace('#', '').trim();
      const myOrder = orders.find(
        (o) => o.orderId === myOrderId || o.orderId?.replace('#', '').trim() === cleanMyId
      );
      if (myOrder && myOrder.status !== 'completed' && myOrder.status !== 'cancelled') {
        setActiveOrderId(myOrder.orderId);
      } else {
        setActiveOrderId(null);
      }
    });
    return unsub;
  }, []);

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('menu')}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <img
                src="/images/logo/wrap-and-wings-co_optimized.webp"
                alt="Wrap & Wings Co."
                className="h-11 sm:h-12 md:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              />
            </button>
          </div>

          {/* Right Actions: Track Order (if active) + Cart + Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Active Order Pill */}
            {activeOrderId && currentView !== 'track' && (
              <button
                type="button"
                onClick={() => onNavigate('track')}
                className="px-2.5 sm:px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-[11px] sm:text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/40 cursor-pointer animate-pulse"
                title="View your active order"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Track Order</span>
              </button>
            )}

            {/* Cart Trigger Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold shadow-lg shadow-rose-900/30 transition-all hover:scale-105 cursor-pointer"
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

            {/* Menu Toggle (visible on all devices) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 sm:p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Menu</span>
            </button>
          </div>
        </div>

        {/* Subheader Bar (Mode & Location) - Unified across all devices */}
        <div className="px-4 sm:px-6 py-2 bg-zinc-900/90 border-t border-white/5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setOrderMode('collection')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  orderMode === 'collection' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>🛍️ Collect</span>
                {orderMode === 'collection' && <Check className="w-3 h-3" />}
              </button>
              <button
                type="button"
                onClick={() => setOrderMode('delivery')}
                className={`px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                  orderMode === 'delivery' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>🚗 Delivery</span>
                {orderMode === 'delivery' && <Check className="w-3 h-3" />}
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenStoreModal}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white truncate cursor-pointer py-1 px-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate max-w-[180px] sm:max-w-none">{selectedStore.mall}</span>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Slide-down Menu Drawer - Unified across all devices */}
        {mobileMenuOpen && (
          <div className="bg-[#18181f] border-b border-white/10 px-4 sm:px-6 py-5 shadow-2xl">
            <div className="max-w-7xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider">Navigation</span>
                <span className="text-[11px] text-zinc-500 font-medium">Wrap & Wings Co. Pinetown</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-sm">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('menu');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl border-2 text-left font-bold transition-all cursor-pointer ${
                    currentView === 'menu'
                      ? 'bg-rose-600/50 text-white border-rose-600 shadow-md shadow-rose-950/30'
                      : 'bg-zinc-800/70 border-rose-600 text-zinc-200 hover:text-white hover:bg-zinc-800 hover:border-rose-500'
                  }`}
                >
                  <div className="text-base mb-1">🔥</div>
                  <div className="text-xs font-extrabold uppercase tracking-wide">Food Menu</div>
                  <div className="text-[11px] text-zinc-400 font-normal">Wraps, Wings, Feast & Sides</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('story');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl border-2 text-left font-bold transition-all cursor-pointer ${
                    currentView === 'story'
                      ? 'bg-rose-600/50 text-white border-rose-600 shadow-md shadow-rose-950/30'
                      : 'bg-zinc-800/70 border-rose-600 text-zinc-200 hover:text-white hover:bg-zinc-800 hover:border-rose-500'
                  }`}
                >
                  <div className="text-base mb-1">📖</div>
                  <div className="text-xs font-extrabold uppercase tracking-wide">Our Story</div>
                  <div className="text-[11px] text-zinc-400 font-normal">Founder, Vision & Heart</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('team');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl border-2 text-left font-bold transition-all cursor-pointer ${
                    currentView === 'team'
                      ? 'bg-rose-600/50 text-white border-rose-600 shadow-md shadow-rose-950/30'
                      : 'bg-zinc-800/70 border-rose-600 text-zinc-200 hover:text-white hover:bg-zinc-800 hover:border-rose-500'
                  }`}
                >
                  <div className="text-base mb-1">👥</div>
                  <div className="text-xs font-extrabold uppercase tracking-wide">Our Team</div>
                  <div className="text-[11px] text-zinc-400 font-normal">Meet our front & kitchen crew</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenStoreModal();
                    setMobileMenuOpen(false);
                  }}
                  className="p-3 rounded-xl bg-zinc-800/70 border-2 border-rose-600 font-bold text-left hover:text-white hover:bg-zinc-800 hover:border-rose-500 text-zinc-200 cursor-pointer transition-all"
                >
                  <div className="text-base mb-1">📍</div>
                  <div className="text-xs font-extrabold uppercase tracking-wide">Store Locator</div>
                  <div className="text-[11px] text-zinc-400 font-normal">Uniland Centre Pinetown</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('kitchen');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl border-2 text-left font-bold transition-all cursor-pointer ${
                    currentView === 'kitchen'
                      ? 'bg-rose-600/50 text-white border-rose-600 shadow-md shadow-rose-950/30'
                      : 'bg-zinc-800/70 border-rose-600 text-zinc-200 hover:text-white hover:bg-zinc-800 hover:border-rose-500'
                  }`}
                >
                  <div className="text-base mb-1">🍳</div>
                  <div className="text-xs font-extrabold uppercase tracking-wide">Kitchen Display</div>
                  <div className="text-[11px] text-zinc-400 font-normal">Live order screen</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('track');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-3 rounded-xl border-2 text-left font-bold transition-all cursor-pointer flex flex-col justify-between ${
                    currentView === 'track'
                      ? 'bg-rose-600/50 text-white border-rose-600 shadow-md shadow-rose-950/30'
                      : 'bg-zinc-800/70 border-rose-600 text-zinc-200 hover:text-white hover:bg-zinc-800 hover:border-rose-500'
                  }`}
                >
                  <div className="text-base mb-1 flex items-center justify-between">
                    <span>📦</span>
                    {activeOrderId && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-extrabold border border-emerald-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wide">Track Order</div>
                    <div className="text-[11px] text-zinc-400 font-normal">Live GPS preparation tracker</div>
                  </div>
                </button>
                <a
                  href={SOCIAL_LINKS.tiktok}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-zinc-800/70 border-2 border-rose-600 font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-rose-500 transition-all flex flex-col justify-between"
                >
                  <div className="w-5 h-5 flex items-center justify-center text-zinc-400 mb-1">
                    <TikTokIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wide">TikTok Profile</div>
                    <div className="text-[11px] text-zinc-400 font-normal">@wrapwings.co</div>
                  </div>
                </a>
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 rounded-xl bg-zinc-800/70 border-2 border-rose-600 font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-rose-500 transition-all flex flex-col justify-between"
                >
                  <div className="w-5 h-5 flex items-center justify-center text-zinc-400 mb-1">
                    <FacebookIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wide">Facebook Page</div>
                    <div className="text-[11px] text-zinc-400 font-normal">wrapandwingsco</div>
                  </div>
                </a>
              </div>

              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-zinc-400">
                <span>Collection & Delivery Hotline:</span>
                <a href={SOCIAL_LINKS.phoneDirect} className="text-rose-400 font-extrabold hover:underline flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>068 886 3892</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
