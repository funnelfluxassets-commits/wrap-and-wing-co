import React, { useState, useMemo, useEffect } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { CategoryNav } from './components/CategoryNav';
import { FoodCard } from './components/FoodCard';
import { ItemModal } from './components/ItemModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { StoreModal, StoreLocatorSection } from './components/StoreLocator';
import { BrandHighlights } from './components/BrandHighlights';
import { Footer } from './components/Footer';
import { LegalModal, LegalTab } from './components/LegalModal';
import { CookieBanner } from './components/CookieBanner';
import { StoryView } from './components/StoryView';
import { TeamView } from './components/TeamView';
import { KitchenDisplayView } from './components/KitchenDisplayView';
import { OrderTrackerView } from './components/OrderTrackerView';
import { MENU_ITEMS, CATEGORIES } from './data/menuData';
import { CategoryId, MenuItem, PageView, LiveOrder } from './types';
import { CheckoutPayload } from './services/payment';
import { subscribeToOrders, getCurrentOrderId } from './services/orderService';
import { Search, ShoppingBag, ArrowRight, Flame } from 'lucide-react';

const getInitialView = (): PageView => {
  if (typeof window === 'undefined') return 'menu';
  const hash = window.location.hash.toLowerCase().replace('#', '');
  if (['menu', 'story', 'team', 'kitchen', 'track'].includes(hash)) {
    return hash as PageView;
  }
  return 'menu';
};

const MainContent: React.FC = () => {
  const { totalItemCount, grandTotal, setIsCartOpen } = useCart();
  const [currentView, setCurrentView] = useState<PageView>(getInitialView());
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(getCurrentOrderId());
  const [activeOrder, setActiveOrder] = useState<LiveOrder | null>(null);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy');

  // Sync hash routing and active orders
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase().replace('#', '');
      if (['menu', 'story', 'team', 'kitchen', 'track'].includes(hash)) {
        setCurrentView(hash as PageView);
      }
    };
    window.addEventListener('hashchange', handleHash);

    const unsub = subscribeToOrders((orders) => {
      const active = orders.find((o) => o.status !== 'completed' && o.status !== 'cancelled');
      if (active) {
        setActiveOrder(active);
        if (!trackedOrderId) {
          setTrackedOrderId(active.orderId);
        }
      } else if (orders.length > 0) {
        setActiveOrder(orders[0]);
      }
    });

    return () => {
      window.removeEventListener('hashchange', handleHash);
      unsub();
    };
  }, [trackedOrderId]);

  const handleNavigate = (view: PageView) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      window.location.hash = view === 'menu' ? '' : view;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      
      {/* ── View Routing ────────────────────────────────────────────────────── */}
      {currentView === 'kitchen' ? (
        <KitchenDisplayView
          onBackToMenu={() => handleNavigate('menu')}
          onViewOrderTracker={(orderId) => {
            setTrackedOrderId(orderId);
            handleNavigate('track');
          }}
        />
      ) : currentView === 'track' ? (
        <OrderTrackerView
          orderId={trackedOrderId || activeOrder?.orderId || ''}
          onBackToMenu={() => handleNavigate('menu')}
          onOpenKitchen={() => handleNavigate('kitchen')}
        />
      ) : (
        <>
          {/* Navigation */}
          <Navbar
            onOpenStoreModal={() => setIsStoreModalOpen(true)}
            currentView={currentView}
            onNavigate={handleNavigate}
          />

          {currentView === 'story' && (
            <StoryView
              onNavigate={handleNavigate}
              onOpenStoreModal={() => setIsStoreModalOpen(true)}
            />
          )}

          {currentView === 'team' && (
            <TeamView
              onNavigate={handleNavigate}
              onOpenStoreModal={() => setIsStoreModalOpen(true)}
            />
          )}

          {currentView === 'menu' && (
            <>
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
                ? 'All flame-grilled chicken, wraps, wings, burgers, sides, and ice-cold drinks.'
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
              placeholder="Search chicken, wrap, wings, drinks..."
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
        </>
      )}

      {/* Footer with Legal Links */}
      <Footer
        onOpenLegal={(tab) => {
          setLegalTab(tab);
          setIsLegalModalOpen(true);
        }}
        onNavigate={handleNavigate}
      />
    </>
  )}

  {/* Modals & Drawers */}
  <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
  
  <CartDrawer onOpenCheckout={() => setIsCheckoutOpen(true)} />

  <CheckoutModal
    isOpen={isCheckoutOpen}
    onClose={() => setIsCheckoutOpen(false)}
    onOrderSuccess={(payload) => {
      setTrackedOrderId(payload.orderId);
      handleNavigate('track');
    }}
  />

  <StoreModal
    isOpen={isStoreModalOpen}
    onClose={() => setIsStoreModalOpen(false)}
  />

  <LegalModal
    isOpen={isLegalModalOpen}
    initialTab={legalTab}
    onClose={() => setIsLegalModalOpen(false)}
  />

  {/* Cookie & POPIA Privacy Notice */}
  <CookieBanner
    onOpenPrivacyPolicy={(tab) => {
      setLegalTab(tab);
      setIsLegalModalOpen(true);
    }}
  />

  {/* Persistent Active Order Floating Banner (Pedros / Uber Eats style) */}
  {activeOrder &&
    activeOrder.status !== 'completed' &&
    activeOrder.status !== 'cancelled' &&
    currentView !== 'kitchen' &&
    currentView !== 'track' && (
      <div
        className={`fixed z-30 animate-slideUp transition-all ${
          totalItemCount > 0
            ? 'bottom-18 lg:bottom-6 left-3 right-3 lg:left-auto lg:right-6 lg:w-96'
            : 'bottom-4 lg:bottom-6 left-3 right-3 lg:left-auto lg:right-6 lg:w-96'
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setTrackedOrderId(activeOrder.orderId);
            handleNavigate('track');
          }}
          className="w-full p-3 sm:p-3.5 rounded-2xl bg-[#14141c]/95 border-2 border-rose-500 shadow-2xl flex items-center justify-between gap-3 text-white backdrop-blur-md cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div className="text-left truncate">
              <div className="text-xs font-black truncate flex items-center gap-1.5">
                <span>Order #{activeOrder.orderId}</span>
                <span className="text-[10px] font-bold text-amber-300">
                  {activeOrder.preferredTime}
                </span>
              </div>
              <div className="text-[11px] text-zinc-300 truncate">
                {activeOrder.status === 'received' && '📝 Kitchen preparing ticket'}
                {activeOrder.status === 'cooking' && '🔥 On The Flame Grill'}
                {activeOrder.status === 'ready' && '🛍️ Hot & ready for collection'}
                {activeOrder.status === 'dispatched' && '🚗 Out for delivery with driver'}
              </div>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-extrabold text-xs shrink-0 shadow-md">
            Track ➔
          </div>
        </button>
      </div>
    )}

  {/* Mobile Floating Bottom Cart Bar */}
  {totalItemCount > 0 && currentView !== 'kitchen' && currentView !== 'track' && (
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
