import React, { useState, useEffect } from 'react';
import { ShoppingBag, Phone, Clock, Check, Menu, X, BookOpen, Users, Mail, Package, Utensils } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { SOCIAL_LINKS } from '../data/stores';
import { DeliveryMotorbikeIcon } from './icons/DeliveryMotorbikeIcon';
import { PageView } from '../types';
import { subscribeToOrders, getCurrentOrderId, isOrderStaleOrExpired } from '../services/orderService';

export interface NavbarProps {
  onOpenStoreModal?: () => void;
  currentView: PageView;
  onNavigate: (view: PageView) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { totalItemCount, grandTotal, setIsCartOpen, orderMode, setOrderMode, tableNumber, setTableNumber } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
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
      if (myOrder && myOrder.status !== 'completed' && myOrder.status !== 'cancelled' && !isOrderStaleOrExpired(myOrder)) {
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
              <span>Mon-Sat 9am–6pm (Sun Closed)</span>
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
                src="/images/logo/wrap-and-wings-co-sm.webp"
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
            <div className="max-w-7xl mx-auto grid grid-cols-4 gap-1.5 sm:gap-2.5 text-center">
              
              {/* Button 1: Our Story */}
              <button
                type="button"
                onClick={() => {
                  onNavigate('story');
                  setMobileMenuOpen(false);
                }}
                className={`py-1.5 px-1 sm:px-2 md:py-2 md:px-3 rounded-lg md:rounded-xl border font-bold transition-all cursor-pointer flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
                  currentView === 'story'
                    ? 'bg-rose-600/50 text-white border-rose-600 shadow-md shadow-rose-950/30'
                    : 'bg-zinc-800/80 border-rose-600 text-zinc-200 hover:text-white hover:bg-zinc-800 hover:border-rose-500'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4 text-white shrink-0" />
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-tight truncate">Our Story</span>
              </button>

              {/* Button 2: Our Team */}
              <button
                type="button"
                onClick={() => {
                  onNavigate('team');
                  setMobileMenuOpen(false);
                }}
                className={`py-1.5 px-1 sm:px-2 md:py-2 md:px-3 rounded-lg md:rounded-xl border font-bold transition-all cursor-pointer flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
                  currentView === 'team'
                    ? 'bg-rose-600/50 text-white border-rose-600 shadow-md shadow-rose-950/30'
                    : 'bg-zinc-800/80 border-rose-600 text-zinc-200 hover:text-white hover:bg-zinc-800 hover:border-rose-500'
                }`}
              >
                <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-white shrink-0" />
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-tight truncate">Our Team</span>
              </button>

              {/* Button 3: Get In Touch */}
              <button
                type="button"
                onClick={() => {
                  onNavigate('contact');
                  setMobileMenuOpen(false);
                }}
                className={`py-1.5 px-1 sm:px-2 md:py-2 md:px-3 rounded-lg md:rounded-xl border font-bold transition-all cursor-pointer flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 ${
                  currentView === 'contact'
                    ? 'bg-rose-600/50 text-white border-rose-600 shadow-md shadow-rose-950/30'
                    : 'bg-zinc-800/80 border-rose-600 text-zinc-200 hover:text-white hover:bg-zinc-800 hover:border-rose-500'
                }`}
              >
                <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-white shrink-0" />
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-tight truncate">Get In Touch</span>
              </button>

              {/* Button 4: Track Order */}
              <button
                type="button"
                onClick={() => {
                  onNavigate('track');
                  setMobileMenuOpen(false);
                }}
                className={`py-1.5 px-1 sm:px-2 md:py-2 md:px-3 rounded-lg md:rounded-xl border font-bold transition-all cursor-pointer flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 relative ${
                  currentView === 'track'
                    ? 'bg-rose-600/50 text-white border-rose-600 shadow-md shadow-rose-950/30'
                    : 'bg-zinc-800/80 border-rose-600 text-zinc-200 hover:text-white hover:bg-zinc-800 hover:border-rose-500'
                }`}
              >
                <div className="relative shrink-0 flex items-center">
                  <Package className="w-3.5 h-3.5 md:w-4 md:h-4 text-white shrink-0" />
                  {activeOrderId && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                </div>
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-tight truncate">Track Order</span>
              </button>

            </div>
          </div>
        )}

        {/* (5) Subheader Bar: Dine-In / Collection / Delivery toggle - Hidden on Contact, Story, Team pages */}
        {!['contact', 'story', 'team'].includes(currentView) && (
          <div className="px-2.5 sm:px-6 py-1.5 sm:py-2 bg-zinc-900/90 border-t border-white/5">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-1.5 md:gap-2">
              <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 whitespace-nowrap overflow-x-auto no-scrollbar shrink-0 self-start md:self-auto max-w-full">
                
                {/* 1. Dine-In Button */}
                <button
                  type="button"
                  onClick={() => {
                    setOrderMode('dine-in');
                    if (!tableNumber) setIsTableModalOpen(true);
                  }}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-black uppercase transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0 ${
                    orderMode === 'dine-in'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                  title={tableNumber ? `Dine-In seated at Table ${tableNumber} (Tap to change)` : 'Dine-in at our tables'}
                >
                  <Utensils className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>Dine-In{tableNumber ? ` (T${tableNumber})` : ''}</span>
                  {orderMode === 'dine-in' && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3] shrink-0" />}
                </button>

                {/* 2. Collection Button (Outline Icon) */}
                <button
                  type="button"
                  onClick={() => setOrderMode('collection')}
                  className={`px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-black uppercase transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shrink-0 ${
                    orderMode === 'collection'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>Collection</span>
                  {orderMode === 'collection' && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3] shrink-0" />}
                </button>

                {/* 3. Delivery (Coming Soon) */}
                <div
                  title="Doorstep Delivery is coming soon to Wrap & Wings Co!"
                  className="px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold uppercase flex items-center gap-1 sm:gap-1.5 bg-zinc-900/60 text-zinc-500 border border-white/5 select-none cursor-not-allowed opacity-60 shrink-0"
                >
                  <DeliveryMotorbikeIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-zinc-500" />
                  <span className="text-zinc-400">Delivery</span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase px-1 sm:px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 tracking-wider">
                    Coming Soon
                  </span>
                </div>
              </div>

              {/* Dine-In Table Pill (Visible and interactive on BOTH Mobile & Desktop) */}
              {orderMode === 'dine-in' && (
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(true)}
                  className="flex items-center justify-between md:justify-start gap-1.5 text-xs text-amber-300 font-extrabold px-3 py-1.5 md:py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 active:scale-[0.98] transition-all cursor-pointer shrink-0 animate-fadeIn"
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span>🪑</span>
                    <span className="truncate">
                      {tableNumber ? `Seated at Table ${tableNumber}` : 'Tap to Select Table Number'}
                    </span>
                  </span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-400 text-black shrink-0 shadow-sm ml-1">
                    {tableNumber ? 'Change' : 'Select'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Table Selection Modal for Dine-In */}
        {isTableModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
            onClick={() => setIsTableModalOpen(false)}
          >
            <div
              className="relative w-full max-w-sm rounded-3xl bg-[#141419] border border-white/10 p-5 sm:p-6 text-white shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-xl">
                    🍽️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Select Your Table</h3>
                    <p className="text-xs text-zinc-400">Staff will deliver to your table</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-300">
                Please tap the table number where you are seated:
              </p>

              <div className="grid grid-cols-5 gap-2 pt-1">
                {(['6', '48', '7', '3', '47'] as const).map((tbl) => (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => {
                      setTableNumber(tbl);
                      setOrderMode('dine-in');
                      setIsTableModalOpen(false);
                    }}
                    className={`py-3 px-1.5 rounded-2xl border text-center transition-all cursor-pointer font-black flex flex-col items-center justify-center gap-1 ${
                      tableNumber === tbl
                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg ring-2 ring-rose-400/50 scale-[1.05]'
                        : 'bg-zinc-900 border-white/10 text-zinc-300 hover:text-white hover:border-white/20 hover:scale-[1.02]'
                    }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider text-zinc-400 font-extrabold">Table</span>
                    <span className="text-lg font-black text-white leading-none">{tbl}</span>
                  </button>
                ))}
              </div>

              {tableNumber && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTableModalOpen(false)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 cursor-pointer"
                  >
                    Confirm Table {tableNumber}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
