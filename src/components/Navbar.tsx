import React, { useState, useEffect } from 'react';
import { ShoppingBag, Phone, Clock, Check, Menu, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { SOCIAL_LINKS } from '../data/stores';
import { DeliveryMotorbikeIcon } from './icons/DeliveryMotorbikeIcon';
import { PageView } from '../types';
import { subscribeToOrders, getCurrentOrderId } from '../services/orderService';

export interface NavbarProps {
  onOpenStoreModal: () => void;
  currentView: PageView;
  onNavigate: (view: PageView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { totalItemCount, grandTotal, setIsCartOpen, orderMode, setOrderMode } = useCart();
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

          {/* Right Actions: Track Order (if active) + Food Menu Button + Cart + Hamburger Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Active Order Pill */}
            {activeOrderId && currentView !== 'track' && (
              <button
                type="button"
                onClick={() => onNavigate('track')}
                className="px-2.5 sm:px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-[11px] sm:text-xs flex items-center gap-1.5 shadow-md shadow-rose-950/40 cursor-pointer animate-pulse"
                title="View your active order"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="hidden xs:inline">Track Order</span>
              </button>
            )}

            {/* (1) Food Menu Button - added directly to the left of the order basket */}
            <button
              type="button"
              onClick={() => onNavigate('menu')}
              className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'menu'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10 text-zinc-200 hover:text-white'
              }`}
            >
              <span className="text-sm">🔥</span>
              <span>Food Menu</span>
            </button>

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

            {/* (2) Hamburger Menu Toggle - Icon only, "MENU" word removed */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 sm:p-2.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* (3 & 4) Sub Header Box: 4 Inline Navigation Buttons directly under the main header */}
        {mobileMenuOpen && (
          <div className="bg-[#18181f]/98 border-t border-b border-white/10 px-2 sm:px-6 py-2 sm:py-2.5 shadow-2xl backdrop-blur-md transition-all">
            <div className="max-w-7xl mx-auto grid grid-cols-4 gap-1.5 sm:gap-3 text-center">
              
              {/* Button 1: Our Story */}
              <button
                type="button"
                onClick={() => {
                  onNavigate('story');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 px-1 sm:px-3 sm:py-2.5 rounded-xl border-2 font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                  currentView === 'story'
                    ? 'bg-rose-600/50 text-white border-rose-600 shadow-md shadow-rose-950/30'
                    : 'bg-zinc-800/80 border-rose-600 text-zinc-200 hover:text-white hover:bg-zinc-800 hover:border-rose-500'
                }`}
              >
                <span className="text-sm sm:text-base mb-0.5">📖</span>
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-tight truncate w-full">Our Story</span>
              </button>

              {/* Button 2: Our Team */}
              <button
                type="button"
                onClick={() => {
                  onNavigate('team');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 px-1 sm:px-3 sm:py-2.5 rounded-xl border-2 font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                  currentView === 'team'
                    ? 'bg-rose-600/50 text-white border-rose-600 shadow-md shadow-rose-950/30'
                    : 'bg-zinc-800/80 border-rose-600 text-zinc-200 hover:text-white hover:bg-zinc-800 hover:border-rose-500'
                }`}
              >
                <span className="text-sm sm:text-base mb-0.5">👥</span>
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-tight truncate w-full">Our Team</span>
              </button>

              {/* Button 3: Get In Touch */}
              <button
                type="button"
                onClick={() => {
                  onNavigate('contact');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 px-1 sm:px-3 sm:py-2.5 rounded-xl border-2 font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                  currentView === 'contact'
                    ? 'bg-rose-600/50 text-white border-rose-600 shadow-md shadow-rose-950/30'
                    : 'bg-zinc-800/80 border-rose-600 text-zinc-200 hover:text-white hover:bg-zinc-800 hover:border-rose-500'
                }`}
              >
                <span className="text-sm sm:text-base mb-0.5">✉️</span>
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-tight truncate w-full">Get In Touch</span>
              </button>

              {/* Button 4: Track Order */}
              <button
                type="button"
                onClick={() => {
                  onNavigate('track');
                  setMobileMenuOpen(false);
                }}
                className={`py-2 px-1 sm:px-3 sm:py-2.5 rounded-xl border-2 font-bold transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                  currentView === 'track'
                    ? 'bg-rose-600/50 text-white border-rose-600 shadow-md shadow-rose-950/30'
                    : 'bg-zinc-800/80 border-rose-600 text-zinc-200 hover:text-white hover:bg-zinc-800 hover:border-rose-500'
                }`}
              >
                <span className="text-sm sm:text-base mb-0.5 flex items-center justify-center gap-1">
                  <span>📦</span>
                  {activeOrderId && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                </span>
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-tight truncate w-full">Track Order</span>
              </button>

            </div>
          </div>
        )}

        {/* (5) Subheader Bar: Collect / Delivery toggle only (location button removed) - Hidden on Contact page */}
        {currentView !== 'contact' && (
          <div className="px-4 sm:px-6 py-2 bg-zinc-900/90 border-t border-white/5">
            <div className="max-w-7xl mx-auto flex items-center justify-start text-xs">
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
                  <DeliveryMotorbikeIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Delivery</span>
                  {orderMode === 'delivery' && <Check className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
