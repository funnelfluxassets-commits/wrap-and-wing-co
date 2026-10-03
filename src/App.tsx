import React, { useState, useMemo } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoryNav } from './components/CategoryNav';
import { FoodCard } from './components/FoodCard';
import { ItemModal } from './components/ItemModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { DriverTicketModal } from './components/DriverTicketModal';
import { StoreModal, StoreLocatorSection } from './components/StoreLocator';
import { BrandHighlights } from './components/BrandHighlights';
import { Footer } from './components/Footer';
import { MENU_ITEMS, CATEGORIES } from './data/menuData';
import { CategoryId, MenuItem } from './types';
import { CheckoutPayload } from './services/payment';
import { Search, ShoppingBag, ArrowRight, Flame } from 'lucide-react';

const MainContent: React.FC = () => {
  const { totalItemCount, grandTotal, setIsCartOpen } = useCart();
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CheckoutPayload | null>(null);

  // Filter items by category & search query
  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.categoryId === activeCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#0d0d11] text-zinc-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white pb-16 lg:pb-0">
      
      {/* Navigation */}
      <Navbar onOpenStoreModal={() => setIsStoreModalOpen(true)} />

      {/* Hero Banner */}
      <HeroBanner />

      {/* Sticky Category Tabs */}
      <CategoryNav
        activeCategory={activeCategory}
        onSelectCategory={(id) => {
          setActiveCategory(id);
          const menuElem = document.getElementById('menu-section');
          if (menuElem) {
            menuElem.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      />

      {/* ── Main Menu Section ──────────────────────────────────────────────── */}
      <main id="menu-section" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                {activeCategory === 'all'
                  ? 'Our Complete Menu'
                  : CATEGORIES.find((c) => c.id === activeCategory)?.name || 'Menu'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              {activeCategory === 'all'
                ? 'All flame-grilled chicken, wraps, wings, burgers, and sides.'
                : CATEGORIES.find((c) => c.id === activeCategory)?.description}
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chicken, wrap, wings..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>
        </div>

        {/* Menu Grid */}
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-zinc-900/60 border border-white/5 space-y-2">
            <span className="text-3xl">🔍</span>
            <h3 className="text-base font-bold text-white">No items found</h3>
            <p className="text-xs text-zinc-400">
              Try searching for something else or reset your category filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold mt-2 cursor-pointer"
            >
              Show All Items
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
            {filteredItems.map((item) => (
              <FoodCard key={item.id} item={item} onSelect={(i) => setSelectedItem(i)} />
            ))}
          </div>
        )}

      </main>

      {/* Brand Highlights & Flavour Meter */}
      <BrandHighlights />

      {/* Store Location & Hours Section */}
      <StoreLocatorSection />

      {/* Footer */}
      <Footer />

      {/* Modals & Drawers */}
      <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      
      <CartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(payload) => setCompletedOrder(payload)}
      />

      <DriverTicketModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
      />

      <StoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
      />

      {/* Mobile Floating Bottom Cart Bar */}
      {totalItemCount > 0 && (
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-30 animate-slideUp">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 text-white font-black text-sm tracking-wide shadow-2xl shadow-rose-950/80 flex items-center justify-between border border-white/20 cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-black/30 flex items-center justify-center text-xs">
                {totalItemCount}
              </div>
              <span>View Cart & Checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-300 font-extrabold">R{grandTotal.toFixed(2)}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <CartProvider>
      <MainContent />
    </CartProvider>
  );
};

export default App;
