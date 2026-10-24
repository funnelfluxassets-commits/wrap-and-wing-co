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
import { ContactView } from './components/ContactView';
import { ReviewDrawView } from './components/ReviewDrawView';
import { AdminPortalView } from './components/AdminPortalView';
import { KitchenDisplayView } from './components/KitchenDisplayView';
import { DeliveryDriverView } from './components/DeliveryDriverView';
import { StaffLoginModal } from './components/StaffLoginModal';
import { OrderTrackerView } from './components/OrderTrackerView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MENU_ITEMS, CATEGORIES } from './data/menuData';
import { CategoryId, MenuItem, PageView, LiveOrder, StaffRole } from './types';
import { CheckoutPayload, isPayFastStaffTestMode, setPayFastStaffTestMode } from './services/payment';
import { subscribeToOrders, getCurrentOrderId, setCurrentOrderId, recordMyPlacedOrder, createLiveOrder, recordCancelledOrder, isOrderStaleOrExpired } from './services/orderService';
import { getOutOfStockItemIds, subscribeToStockStatus } from './services/stockService';
import { logPageView, logItemView, fetchAndSyncClientIp, isAnalyticsExcluded, setDeviceAnalyticsExcluded } from './services/analyticsService';
import { Search, ShoppingBag, ArrowRight, Flame, ShieldAlert, CheckCircle2, X } from 'lucide-react';

const VALID_VIEWS: PageView[] = [
  'menu',
  'story',
  'team',
  'kitchen',
  'delivery',
  'track',
  'contact',
  'review',
  'admin',
];

const parseViewFromUrl = (): PageView => {
  if (typeof window === 'undefined') return 'menu';

  // 1. Hash check (handles single #story and stacked #review#story safely)
  if (window.location.hash) {
    const rawHash = window.location.hash.toLowerCase().replace(/^#+/, '');
    const segments = rawHash.split('#').map((s) => s.trim()).filter(Boolean);
    // Prefer the last valid segment (e.g. in #review#story -> 'story')
    for (const seg of [...segments].reverse()) {
      if (VALID_VIEWS.includes(seg as PageView)) {
        return seg as PageView;
      }
    }
  }

  // 2. Pathname check (e.g. /review, /story, /admin)
  const path = window.location.pathname.toLowerCase().replace(/^\//, '').replace(/\/$/, '');
  if (VALID_VIEWS.includes(path as PageView)) {
    return path as PageView;
  }

  // 3. Query parameter check (e.g. ?view=review)
  const searchParams = new URLSearchParams(window.location.search);
  const queryView = searchParams.get('view')?.toLowerCase();
  if (queryView && VALID_VIEWS.includes(queryView as PageView)) {
    return queryView as PageView;
  }

  return 'menu';
};

const MainContent: React.FC = () => {
  const { totalItemCount, grandTotal, setIsCartOpen } = useCart();
  const [currentView, setCurrentView] = useState<PageView>(parseViewFromUrl());
  const [activeCategory, setActiveCategory] = useState<CategoryId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(getCurrentOrderId());
  const [activeOrder, setActiveOrder] = useState<LiveOrder | null>(null);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<LegalTab>('privacy');
  const [staffRole, setStaffRole] = useState<StaffRole | null>(() => {
    if (typeof window !== 'undefined') {
      return (sessionStorage.getItem('wrap_wing_staff_role') as StaffRole) || null;
    }
    return null;
  });
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState(false);
  const [staffLoginInitialRole, setStaffLoginInitialRole] = useState<StaffRole>('kitchen');
  const [payfastNotice, setPayfastNotice] = useState<{ type: 'success' | 'cancelled'; orderId?: string } | null>(null);
  const [isStaffTestActive, setIsStaffTestActive] = useState(() => isPayFastStaffTestMode());
  const [outOfStockIds, setOutOfStockIds] = useState<string[]>(() => getOutOfStockItemIds());
  const [soldOutToast, setSoldOutToast] = useState<string | null>(null);

  // Subscribe to real-time menu stock changes (86 list)
  useEffect(() => {
    const unsub = subscribeToStockStatus((ids) => {
      setOutOfStockIds(ids);
    });
    return unsub;
  }, []);

  const triggerSoldOutToast = (itemName: string) => {
    setSoldOutToast(itemName);
    setTimeout(() => {
      setSoldOutToast((prev) => (prev === itemName ? null : prev));
    }, 2800);
  };

  // Detect PayFast callback redirects or staff test mode flag in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const pfStatus = params.get('payfast');
      const pfOrderId = params.get('orderId');

      const hasHashTest = (window.location.hash || '').toLowerCase().includes('test_payfast');
      if (params.get('test_payfast') === '1' || params.get('test_payfast') === 'true' || hasHashTest) {
        setPayFastStaffTestMode(true);
        setIsStaffTestActive(true);
      } else if (params.get('test_payfast') === '0' || params.get('test_payfast') === 'false') {
        setPayFastStaffTestMode(false);
        setIsStaffTestActive(false);
      } else {
        setIsStaffTestActive(isPayFastStaffTestMode());
      }

      if (pfStatus === 'success' && pfOrderId) {
        // Retrieve the pending order payload from storage
        let pendingPayload: CheckoutPayload | null = null;
        try {
          const raw = localStorage.getItem('wrap_wing_pending_payfast_order') ||
                      sessionStorage.getItem('wrap_wing_pending_payfast_order');
          if (raw) pendingPayload = JSON.parse(raw);
        } catch {}

        if (pendingPayload) {
          // NOW that PayFast has confirmed the payment, create the order and dispatch to kitchen!
          createLiveOrder({
            ...pendingPayload,
            orderId: pfOrderId || pendingPayload.orderId,
            paymentMethod: 'payfast',
          });
          try {
            localStorage.removeItem('wrap_wing_pending_payfast_order');
            sessionStorage.removeItem('wrap_wing_pending_payfast_order');
          } catch {}
        }

        recordMyPlacedOrder(pfOrderId);
        setCurrentOrderId(pfOrderId);
        setTrackedOrderId(pfOrderId);
        setCurrentView('track');
        setPayfastNotice({ type: 'success', orderId: pfOrderId });
        const cleanUrl = window.location.pathname + '#track';
        history.replaceState(null, '', cleanUrl);
      } else if (pfStatus === 'cancelled') {
        let pendingPayload: CheckoutPayload | null = null;
        try {
          const raw = localStorage.getItem('wrap_wing_pending_payfast_order') ||
                      sessionStorage.getItem('wrap_wing_pending_payfast_order');
          if (raw) pendingPayload = JSON.parse(raw);
        } catch {}

        if (pendingPayload) {
          // Log failed / cancelled attempt into Admin CRM report so manager can follow up with customer
          recordCancelledOrder(pendingPayload, 'Payment Unsuccessful / Cancelled on PayFast');
          try {
            localStorage.removeItem('wrap_wing_pending_payfast_order');
            sessionStorage.removeItem('wrap_wing_pending_payfast_order');
          } catch {}
        }

        setPayfastNotice({ type: 'cancelled', orderId: pfOrderId || pendingPayload?.orderId || undefined });
        const cleanUrl = window.location.pathname + (window.location.hash || '');
        history.replaceState(null, '', cleanUrl);
      }
    } catch {}
  }, []);

  const handleStaffLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('wrap_wing_staff_role');
    }
    setStaffRole(null);
    handleNavigate('menu');
  };

  // Initialize IP detection & exclusion sync
  useEffect(() => {
    fetchAndSyncClientIp().catch(() => {});
  }, []);

  // Customer Traffic & Analytics tracking (excludes internal staff/manager portals and excluded testing devices/IPs)
  useEffect(() => {
    try {
      if (staffRole || ['admin', 'kitchen', 'delivery'].includes(currentView)) {
        // Automatically mark staff device as excluded from analytics
        setDeviceAnalyticsExcluded(true);
        return;
      }
      if (isAnalyticsExcluded()) {
        return;
      }
      logPageView(currentView);
    } catch {}
  }, [currentView, staffRole]);

  useEffect(() => {
    if (selectedItem && !isAnalyticsExcluded()) {
      try {
        logItemView(selectedItem.name);
      } catch {}
    }
  }, [selectedItem]);

  // Sync hash and pathname routing and active orders
  useEffect(() => {
    // Clean up URL on initial load if hash is empty, '#', '#menu', or has stacked/corrupted hashes
    if (typeof window !== 'undefined') {
      const cleanPath = window.location.pathname || '/';
      const cleanSearch = window.location.search || '';
      const current = parseViewFromUrl();

      if (current === 'menu') {
        if (window.location.hash) {
          history.replaceState(null, '', `${cleanPath}${cleanSearch}`);
        }
      } else if (window.location.hash !== `#${current}`) {
        // Fix stacked or malformed hash like #review#story -> #story
        history.replaceState(null, '', `${cleanPath}${cleanSearch}#${current}`);
      }
    }

    const handleHash = () => {
      const target = parseViewFromUrl();
      setCurrentView(target);

      // Keep address bar in sync and free of stacked hashes
      if (typeof window !== 'undefined') {
        const cleanPath = window.location.pathname || '/';
        const cleanSearch = window.location.search || '';
        if (target === 'menu' && window.location.hash) {
          history.replaceState(null, '', `${cleanPath}${cleanSearch}`);
        } else if (target !== 'menu' && window.location.hash !== `#${target}`) {
          history.replaceState(null, '', `${cleanPath}${cleanSearch}#${target}`);
        }
      }
    };
    window.addEventListener('hashchange', handleHash);
    window.addEventListener('popstate', handleHash);

    const unsub = subscribeToOrders((orders) => {
      const myOrderId = getCurrentOrderId();
      if (!myOrderId) {
        setActiveOrder(null);
        setTrackedOrderId(null);
        return;
      }
      const cleanMyId = myOrderId.replace('#', '').trim();
      const myOrder = orders.find(
        (o) => o.orderId === myOrderId || o.orderId?.replace('#', '').trim() === cleanMyId
      );
      if (myOrder) {
        if (myOrder.status !== 'cancelled' && !isOrderStaleOrExpired(myOrder)) {
          // Keep active while cooking, ready, or completed so customer can see the celebratory completion screen
          setActiveOrder(myOrder);
          setTrackedOrderId(myOrder.orderId);
        } else {
          setActiveOrder(null);
          setTrackedOrderId(null);
        }
      } else {
        // Order not yet in local cache (syncing from cloud) - keep trackedOrderId active
        setTrackedOrderId(myOrderId);
      }
    });

    return () => {
      window.removeEventListener('hashchange', handleHash);
      window.removeEventListener('popstate', handleHash);
      unsub();
    };
  }, [trackedOrderId]);

  const handleNavigate = (view: PageView) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      const cleanPath = window.location.pathname || '/';
      const cleanSearch = window.location.search || '';
      const newUrl = view === 'menu' ? `${cleanPath}${cleanSearch}` : `${cleanPath}${cleanSearch}#${view}`;
      history.pushState(null, '', newUrl);
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
      
      {/* PayFast Sandbox Notice Banner (After Return from Gateway) */}
      {payfastNotice && (
        <div
          className={`py-2.5 px-4 text-center text-xs font-bold flex items-center justify-between shadow-lg sticky top-0 z-[60] animate-fadeIn ${
            payfastNotice.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-amber-600 text-white'
          }`}
        >
          <div className="flex items-center gap-2 mx-auto">
            {payfastNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-white" />
            ) : (
              <ShieldAlert className="w-4 h-4 shrink-0 text-white" />
            )}
            <span>
              {payfastNotice.type === 'success'
                ? `🎉 PayFast Sandbox Payment Approved! Order #${payfastNotice.orderId} is confirmed and sent to kitchen display.`
                : 'PayFast checkout was cancelled. Your items remain saved in your cart.'}
            </span>
          </div>
          <button
            onClick={() => setPayfastNotice(null)}
            className="p-1 rounded hover:bg-black/20 text-white/90 hover:text-white ml-2 cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Staff Test Mode Prominent Sticky Banner */}
      {isStaffTestActive && (
        <div className="sticky top-0 z-[100] bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 px-3 sm:px-4 py-2 flex items-center justify-between text-xs font-black shadow-2xl border-b-2 border-amber-600 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-zinc-950 animate-ping" />
            <span className="tracking-wide uppercase font-black text-zinc-950">
              ⚡ Staff Test Mode: PayFast Sandbox Active
            </span>
            <span className="hidden sm:inline font-bold text-zinc-800 text-[11px]">
              • Simulated Orders Only (No Real Money Charged)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPayFastStaffTestMode(false);
              setIsStaffTestActive(false);
            }}
            className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white font-black text-[10px] tracking-wider uppercase transition-colors shadow-sm cursor-pointer shrink-0 ml-2"
          >
            Exit Test Mode
          </button>
        </div>
      )}
      
      {/* ── View Routing ────────────────────────────────────────────────────── */}
      {currentView === 'admin' ? (
        staffRole === 'admin' ? (
          <ErrorBoundary fallbackTitle="Admin Portal Recovery">
            <AdminPortalView
              onBackToMenu={() => handleNavigate('menu')}
              onLogout={handleStaffLogout}
              onNavigateRole={(role) => handleNavigate(role === 'driver' ? 'delivery' : role)}
            />
          </ErrorBoundary>
        ) : (
          <StaffLoginModal
            isOpen={true}
            initialRole="admin"
            onClose={() => handleNavigate('menu')}
            onSuccess={(role) => {
              setStaffRole(role);
              if (role === 'admin') {
                handleNavigate('admin');
              } else if (role === 'kitchen') {
                handleNavigate('kitchen');
              } else {
                handleNavigate('delivery');
              }
            }}
          />
        )
      ) : currentView === 'kitchen' ? (
        staffRole === 'kitchen' || staffRole === 'admin' ? (
          <ErrorBoundary fallbackTitle="Kitchen Display System Recovery">
            <KitchenDisplayView
              onBackToMenu={() => handleNavigate('menu')}
              onLogout={handleStaffLogout}
              onViewOrderTracker={(orderId) => {
                setTrackedOrderId(orderId);
                handleNavigate('track');
              }}
            />
          </ErrorBoundary>
        ) : (
          <StaffLoginModal
            isOpen={true}
            initialRole="kitchen"
            onClose={() => handleNavigate('menu')}
            onSuccess={(role) => {
              setStaffRole(role);
              if (role === 'admin') {
                handleNavigate('admin');
              } else if (role === 'driver') {
                handleNavigate('delivery');
              } else {
                handleNavigate('kitchen');
              }
            }}
          />
        )
      ) : currentView === 'delivery' ? (
        staffRole === 'driver' || staffRole === 'admin' ? (
          <ErrorBoundary fallbackTitle="Delivery Driver System Recovery">
            <DeliveryDriverView
              onBackToMenu={() => handleNavigate('menu')}
              onLogout={handleStaffLogout}
              onViewOrderTracker={(orderId) => {
                setTrackedOrderId(orderId);
                handleNavigate('track');
              }}
            />
          </ErrorBoundary>
        ) : (
          <StaffLoginModal
            isOpen={true}
            initialRole="driver"
            onClose={() => handleNavigate('menu')}
            onSuccess={(role) => {
              setStaffRole(role);
              if (role === 'admin') {
                handleNavigate('admin');
              } else if (role === 'kitchen') {
                handleNavigate('kitchen');
              } else {
                handleNavigate('delivery');
              }
            }}
          />
        )
      ) : currentView === 'track' ? (
        <ErrorBoundary fallbackTitle="Order Tracker Recovery">
          <OrderTrackerView
            orderId={trackedOrderId || activeOrder?.orderId || getCurrentOrderId() || ''}
            onBackToMenu={() => handleNavigate('menu')}
          />
        </ErrorBoundary>
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

          {currentView === 'contact' && (
            <ContactView
              onNavigate={handleNavigate}
              onOpenStoreModal={() => setIsStoreModalOpen(true)}
            />
          )}

          {currentView === 'review' && (
            <ReviewDrawView
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
            <p className="text-xs sm:text-sm text-zinc-200 mt-0.5">
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
            <p className="text-xs text-zinc-200">
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
              <FoodCard
                key={item.id}
                item={item}
                isOutOfStock={outOfStockIds.includes(item.id)}
                onSoldOutClick={triggerSoldOutToast}
                onSelect={(i) => setSelectedItem(i)}
              />
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

      {/* Footer with Legal Links & Staff Portal */}
      <Footer
        onOpenLegal={(tab) => {
          setLegalTab(tab);
          setIsLegalModalOpen(true);
        }}
        onNavigate={handleNavigate}
        onOpenStaffLogin={() => {
          setStaffLoginInitialRole('kitchen');
          setIsStaffLoginOpen(true);
        }}
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

  <StaffLoginModal
    isOpen={isStaffLoginOpen}
    initialRole={staffLoginInitialRole}
    onClose={() => setIsStaffLoginOpen(false)}
    onSuccess={(role) => {
      setStaffRole(role);
      setIsStaffLoginOpen(false);
      if (role === 'admin') {
        handleNavigate('admin');
      } else if (role === 'kitchen') {
        handleNavigate('kitchen');
      } else {
        handleNavigate('delivery');
      }
    }}
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
    currentView !== 'delivery' &&
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
                {activeOrder.status === 'dispatched' && '🏍️ Out for delivery with driver'}
              </div>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-extrabold text-xs shrink-0 shadow-md">
            Track ➔
          </div>
        </button>
      </div>
    )}

  {/* Sold Out Quick Toast Notification */}
  {soldOutToast && (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#18181b]/95 border border-amber-500/50 shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3 backdrop-blur-md animate-slideDown max-w-sm sm:max-w-md w-[92%]">
      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-base font-black">
        ⚠️
      </div>
      <div className="text-xs text-zinc-300">
        <strong className="text-white">{soldOutToast}</strong> is currently sold out today.
      </div>
    </div>
  )}

  {/* Mobile Floating Bottom Cart Bar */}
  {totalItemCount > 0 && currentView !== 'kitchen' && currentView !== 'delivery' && currentView !== 'track' && (
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
    <ErrorBoundary fallbackTitle="Wrap & Wings Co. App Recovery">
      <CartProvider>
        <MainContent />
      </CartProvider>
    </ErrorBoundary>
  );
};

export default App;
