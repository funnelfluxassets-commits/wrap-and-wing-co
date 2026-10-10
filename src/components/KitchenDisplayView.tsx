import React, { useState, useEffect, useRef } from 'react';
import { LiveOrder, OrderStatus } from '../types';
import {
  getAllOrders,
  subscribeToOrders,
  updateOrderStatus,
  deleteOrder,
  playKitchenChime,
  playCookingAlarm,
  unlockAudio,
  syncOrdersFromCloud,
  resetToDefaultOrders,
  clearAllOrders
} from '../services/orderService';
import { generateGoogleMapsUrl, generateWazeUrl } from '../services/payment';
import {
  Flame,
  Clock,
  CheckCircle,
  Truck,
  ShoppingBag,
  Volume2,
  VolumeX,
  Phone,
  MapPin,
  Navigation,
  ArrowLeft,
  Printer,
  Sparkles,
  AlertCircle,
  RefreshCw,
  RotateCcw,
  Trash2,
  LogOut
} from 'lucide-react';
import { ChickenWingIcon } from './icons/ChickenWingIcon';
import { DriverTicketModal } from './DriverTicketModal';

interface KitchenDisplayViewProps {
  onBackToMenu: () => void;
  onViewOrderTracker?: (orderId: string) => void;
  onLogout?: () => void;
}

// Compute accurate cooking start timestamp from order metadata or timeline
function getOrderCookingStartTime(order: LiveOrder): number {
  if (typeof order.cookingStartedAt === 'number' && order.cookingStartedAt > 0) {
    return order.cookingStartedAt;
  }
  const cookingEvent = order.timeline?.find((t) => t.status === 'cooking');
  if (typeof cookingEvent?.epochTime === 'number' && cookingEvent.epochTime > 0) {
    return cookingEvent.epochTime;
  }
  if (cookingEvent?.timestamp) {
    const match = cookingEvent.timestamp.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const d = new Date();
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      if (/pm/i.test(cookingEvent.timestamp) && hours < 12) hours += 12;
      if (/am/i.test(cookingEvent.timestamp) && hours === 12) hours = 0;
      d.setHours(hours, minutes, 0, 0);
      if (d.getTime() <= Date.now()) {
        return d.getTime();
      }
    }
  }
  return Date.now();
}

export const KitchenDisplayView: React.FC<KitchenDisplayViewProps> = ({
  onBackToMenu,
  onViewOrderTracker,
  onLogout,
}) => {
  const [orders, setOrders] = useState<LiveOrder[]>(() => getAllOrders());
  const [filter, setFilter] = useState<'active' | 'cooking' | 'ready' | 'completed'>('active');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [silencedAlarms, setSilencedAlarms] = useState<Set<string>>(new Set());
  const [viewingDriverOrder, setViewingDriverOrder] = useState<LiveOrder | null>(null);

  // Track known order IDs to immediately chime on brand new incoming orders
  const knownOrderIdsRef = useRef<Set<string>>(new Set(getAllOrders().map((o) => o.orderId)));
  const isInitializedRef = useRef<boolean>(false);

  // Unlock browser audio context on first user tap/click on tablet
  useEffect(() => {
    const handleGesture = () => unlockAudio();
    window.addEventListener('click', handleGesture, { passive: true });
    window.addEventListener('touchstart', handleGesture, { passive: true });
    const initTimer = setTimeout(() => {
      isInitializedRef.current = true;
    }, 1000);
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
      clearTimeout(initTimer);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToOrders((newOrders) => {
      const currentKnown = knownOrderIdsRef.current;
      const newIncoming = newOrders.filter((o) => !currentKnown.has(o.orderId));
      if (isInitializedRef.current && newIncoming.length > 0 && soundEnabled) {
        playKitchenChime();
      }
      newOrders.forEach((o) => currentKnown.add(o.orderId));
      setOrders(newOrders);
    });

    const clockTimer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());

      // Overdue Cooking Alarm: pulse alert chime every 4 seconds when cooking order exceeds 10 minutes
      if (now.getSeconds() % 4 === 0 && soundEnabled) {
        const currentOrders = getAllOrders();
        const hasOverdueCookingOrder = currentOrders.some((order) => {
          if (order.status !== 'cooking') return false;
          if (silencedAlarms.has(order.orderId)) return false;
          const startedAt = getOrderCookingStartTime(order);
          const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
          return elapsedSeconds >= 600; // 10 minutes reached
        });

        if (hasOverdueCookingOrder) {
          playCookingAlarm();
        }
      }
    }, 1000);

    // Active 2-second live kitchen radar to guarantee instant detection across devices
    const radarTimer = setInterval(async () => {
      const freshOrders = await syncOrdersFromCloud();
      const currentKnown = knownOrderIdsRef.current;
      const newIncoming = freshOrders.filter((o) => !currentKnown.has(o.orderId));
      if (isInitializedRef.current && newIncoming.length > 0 && soundEnabled) {
        playKitchenChime();
      }
      freshOrders.forEach((o) => currentKnown.add(o.orderId));
      setOrders(freshOrders);
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(clockTimer);
      clearInterval(radarTimer);
    };
  }, [soundEnabled, silencedAlarms]);

  const toggleSilenceAlarm = (orderId: string) => {
    setSilencedAlarms((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleStatusChange = (orderId: string, nextStatus: OrderStatus) => {
    // If order was in cooking or silenced, clear silence state
    if (nextStatus !== 'cooking') {
      setSilencedAlarms((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
    }

    const updated = updateOrderStatus(orderId, nextStatus);
    if (updated) {
      setOrders((prev) =>
        prev.map((o) => {
          const cleanO = o.orderId?.replace('#', '').trim();
          const cleanTarget = orderId.replace('#', '').trim();
          if (o.orderId === orderId || cleanO === cleanTarget) {
            return updated;
          }
          return o;
        })
      );
    } else {
      setOrders(getAllOrders());
    }
    if (soundEnabled) {
      playKitchenChime();
    }
  };

  const handlePrintSlip = (order: LiveOrder) => {
    const isDelivery = order.orderMode === 'delivery';
    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Order #${order.orderId} - Kitchen Slip</title>
          <style>
            body { font-family: monospace; font-size: 13px; padding: 12px; margin: 0; line-height: 1.4; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-top: 1px dashed #000; margin: 8px 0; }
            .item { margin-bottom: 6px; }
            .badge { display: inline-block; padding: 2px 6px; background: #eee; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 16px;">WRAP & WINGS CO.</div>
          <div class="center">Shop 1, Uniland Centre, Pinetown</div>
          <div class="line"></div>
          <div class="bold" style="font-size: 18px;">ORDER #${order.orderId}</div>
          <div class="badge">${isDelivery ? '🏍️ HOME DELIVERY' : '🛍️ STORE COLLECTION'}</div>
          <div>Time: ${order.createdAt} (${order.preferredTime})</div>
          <div class="line"></div>
          <div><span class="bold">Customer:</span> ${order.customer?.customerName || 'Customer'}</div>
          <div><span class="bold">Phone:</span> ${order.customer?.phone || 'N/A'}</div>
          ${
            isDelivery
              ? `<div><span class="bold">Address:</span> ${order.customer?.address || ''}, ${order.customer?.suburb || 'Pinetown'}</div>
                 ${order.customer?.complexOrUnit ? `<div>Unit: ${order.customer.complexOrUnit}</div>` : ''}
                 ${order.customer?.gateCode ? `<div>Gate Code: ${order.customer.gateCode}</div>` : ''}
                 ${order.customer?.notes ? `<div>Notes: ${order.customer.notes}</div>` : ''}`
              : ''
          }
          <div class="line"></div>
          <div class="bold">ITEMS:</div>
          ${(Array.isArray(order.items) ? order.items : [])
            .map(
              (i) => `
            <div class="item">
              <div class="bold">${i.quantity}x ${i.menuItem?.name || 'Meal'}</div>
              ${i.customization?.flavour ? `<div>- Baste: ${i.customization.flavour.toUpperCase()}</div>` : ''}
              ${i.customization?.side ? `<div>- Side: ${i.customization.side}</div>` : ''}
              ${i.customization?.notes ? `<div>- Notes: ${i.customization.notes}</div>` : ''}
            </div>
          `
            )
            .join('')}
          <div class="line"></div>
          <div class="bold" style="font-size: 15px;">TOTAL: R${(typeof order.grandTotal === 'number' ? order.grandTotal : 0).toFixed(2)}</div>
          <div>Payment: ${order.paymentStatus === 'paid' ? 'PAID' : 'COLLECT PAYMENT'} (${(order.paymentMethod || 'cod').toUpperCase()})</div>
          <div class="line"></div>
          <div class="center">*** THANK YOU ***</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Filter orders safely
  const validOrders = orders.filter((o): o is LiveOrder => Boolean(o && typeof o === 'object' && o.orderId));
  const activeOrders = validOrders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
  const cookingOrders = validOrders.filter((o) => o.status === 'cooking');
  const readyOrders = validOrders.filter((o) => o.status === 'ready' || o.status === 'dispatched');

  // Extract completion timestamp safely to sort history newest-first
  const getOrderCompletionEpoch = (order: LiveOrder): number => {
    if (typeof order.completedAt === 'number' && order.completedAt > 0) {
      return order.completedAt;
    }
    const completedEvent = order.timeline?.slice().reverse().find((t) => t.status === 'completed');
    if (typeof completedEvent?.epochTime === 'number' && completedEvent.epochTime > 0) {
      return completedEvent.epochTime;
    }
    const lastEvent = order.timeline?.[order.timeline.length - 1];
    if (typeof lastEvent?.epochTime === 'number' && lastEvent.epochTime > 0) {
      return lastEvent.epochTime;
    }
    const firstEvent = order.timeline?.[0];
    if (typeof firstEvent?.epochTime === 'number' && firstEvent.epochTime > 0) {
      return firstEvent.epochTime;
    }
    if (completedEvent?.timestamp) {
      const match = completedEvent.timestamp.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        const d = new Date();
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        if (/pm/i.test(completedEvent.timestamp) && hours < 12) hours += 12;
        if (/am/i.test(completedEvent.timestamp) && hours === 12) hours = 0;
        d.setHours(hours, minutes, 0, 0);
        // If parsed time is ahead of current time, it belonged to a previous day
        if (d.getTime() > Date.now()) {
          d.setDate(d.getDate() - 1);
        }
        return d.getTime();
      }
    }
    return 0;
  };

  // Helper to extract numeric order sequence (e.g. "D-0903" -> 90003, "D-0810" -> 80010)
  const extractOrderSequence = (orderId: string): number => {
    const cleanId = String(orderId || '').replace('#', '').trim();
    const match = cleanId.match(/^[A-Za-z]*-?(\d{2})(\d{2,})$/);
    if (match) {
      const day = parseInt(match[1], 10);
      const counter = parseInt(match[2], 10);
      const currentDay = new Date().getDate();
      const effectiveDay = day > currentDay ? day - 31 : day;
      return effectiveDay * 10000 + counter;
    }
    const num = parseInt(cleanId.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  // Latest completed orders at the top-left, descending to oldest
  const completedOrders = [...validOrders.filter((o) => o.status === 'completed')].sort((a, b) => {
    const timeA = getOrderCompletionEpoch(a);
    const timeB = getOrderCompletionEpoch(b);
    if (timeA && timeB && Math.abs(timeA - timeB) > 2000) {
      return timeB - timeA; // newest completed first (top-left)
    }

    // Numerical order sequence comparison: D-0903 (90003) > D-0902 (90002) > D-0810 (80010)
    const seqA = extractOrderSequence(a.orderId);
    const seqB = extractOrderSequence(b.orderId);
    if (seqA && seqB && seqA !== seqB) {
      return seqB - seqA; // higher order number is newer -> top-left!
    }

    if (timeA && !timeB) return -1;
    if (!timeA && timeB) return 1;

    return validOrders.indexOf(a) - validOrders.indexOf(b);
  });

  const displayedOrders =
    filter === 'active'
      ? activeOrders
      : filter === 'cooking'
      ? cookingOrders
      : filter === 'ready'
      ? readyOrders
      : completedOrders;

  return (
    <div className="min-h-screen bg-[#0d0d12] text-zinc-100 flex flex-col font-sans">
      
      {/* Top Tablet Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#14141a] border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToMenu}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Customer Menu</span>
          </button>

          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                🍳 KITCHEN DISPLAY SYSTEM
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                PINETOWN SHOP 1
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Live orders updating in real-time
            </div>
          </div>
        </div>

        {/* Clock & Sound Control */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              playKitchenChime();
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                : 'bg-zinc-800 border-white/10 text-zinc-500'
            }`}
            title="Toggle or test audio chime"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundEnabled ? 'Chime ON (Tap to test)' : 'Chime Muted'}</span>
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/10 font-mono text-sm sm:text-base font-black text-amber-400">
            {currentTime}
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="p-2 px-3 rounded-xl bg-red-950/50 hover:bg-red-900/70 border border-red-500/30 text-red-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer shadow-sm"
              title="Exit Staff Portal"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Filter Status Bar */}
      <div className="bg-[#121217] border-b border-white/10 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'active'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            <span>All Active</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
              {activeOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('cooking')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'cooking'
                ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            <span>🔥 On Grill</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
              {cookingOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('ready')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'ready'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            <span>🛍️ Ready / Dispatched</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
              {readyOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'completed'
                ? 'bg-zinc-700 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            <span>History</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
              {completedOrders.length}
            </span>
          </button>

          {filter === 'completed' && completedOrders.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Delete all completed orders from history?')) {
                  for (const o of completedOrders) {
                    deleteOrder(o.orderId);
                  }
                  setOrders(getAllOrders());
                }
              }}
              className="p-1 px-2.5 rounded-xl bg-zinc-900 hover:bg-red-600/20 text-[11px] font-bold text-zinc-400 hover:text-red-400 border border-white/10 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm ml-1"
              title="Delete all past completed tickets"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={async () => {
              setIsSyncing(true);
              const fresh = await syncOrdersFromCloud();
              setOrders(fresh);
              setTimeout(() => setIsSyncing(false), 600);
            }}
            disabled={isSyncing}
            className="p-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            title="Fetch latest orders from cloud"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear all active orders from the kitchen display?')) {
                resetToDefaultOrders();
                setOrders([]);
              }
            }}
            className="p-1.5 px-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-400 hover:text-rose-400 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
            title="Clear all kitchen orders"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Clear Tickets</span>
          </button>

          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="hidden sm:inline">Live Radar</span>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {displayedOrders.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-zinc-900/40 rounded-3xl border border-white/5 text-zinc-500">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-3xl mb-3">
              🍽️
            </div>
            <h3 className="text-lg font-black text-zinc-300">
              {filter !== 'active' ? `No orders in "${filter}" column` : 'No orders on screen'}
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              Live orders from customer phones and counter checkouts appear here automatically with audio chimes.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
              {filter !== 'active' && (
                <button
                  type="button"
                  onClick={() => setFilter('active')}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-2 cursor-pointer transition-colors shadow-lg"
                >
                  <span>🔥 View All Active Orders ({activeOrders.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  setIsSyncing(true);
                  const fresh = await syncOrdersFromCloud();
                  setOrders(fresh.length > 0 ? fresh : getAllOrders());
                  setTimeout(() => setIsSyncing(false), 600);
                }}
                disabled={isSyncing}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors border border-white/10"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Fetch Past Orders From Cloud</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayedOrders.map((order) => {
              if (!order || !order.orderId) return null;
              const isDelivery = order.orderMode === 'delivery';
              const customer = order.customer || {
                customerName: 'Customer',
                phone: '',
                address: '',
                suburb: 'Pinetown',
                complexOrUnit: '',
                gateCode: '',
                notes: '',
              };
              const customerName = customer.customerName || 'Customer';
              const rawPhone = customer.phone || '';
              const cleanPhone = rawPhone.replace(/[^0-9]/g, '');
              const address = customer.address || '';
              const suburb = customer.suburb || 'Pinetown';
              const googleMapsUrl = generateGoogleMapsUrl(address, suburb);
              const items = Array.isArray(order.items) ? order.items : [];
              const grandTotal = typeof order.grandTotal === 'number' ? order.grandTotal : 0;
              const createdAt = order.createdAt || 'Just now';
              const preferredTime = order.preferredTime || 'ASAP';
              const paymentMethod = (order.paymentMethod || 'cod').toUpperCase();

              return (
                <div
                  key={order.orderId}
                  className="rounded-3xl border border-orange-500/25 bg-[#171720] flex flex-col overflow-hidden shadow-2xl transition-all hover:border-orange-500/40"
                >
                  {/* Card Header */}
                  <div className="p-4 flex items-center justify-between border-b border-orange-500/20 bg-zinc-950/90 text-zinc-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white tracking-tight">
                          #{order.orderId}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                            isDelivery ? 'bg-orange-500 text-zinc-950' : 'bg-amber-400 text-zinc-950'
                          }`}
                        >
                          {isDelivery ? '🏍️ DELIVERY' : '🛍️ COLLECTION'}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>Placed: {createdAt}</span>
                        <span>•</span>
                        <span className="text-amber-300 font-bold">{preferredTime}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* 10-Minute Cooking Countdown Timer & Overdue Alarm */}
                      {order.status === 'cooking' && (() => {
                        const cookingStart = getOrderCookingStartTime(order);
                        const elapsedSeconds = Math.max(0, Math.floor((Date.now() - cookingStart) / 1000));
                        const remainingSeconds = 600 - elapsedSeconds;
                        const isOverdue = remainingSeconds <= 0;
                        const isSilenced = silencedAlarms.has(order.orderId);

                        if (!isOverdue) {
                          const mins = Math.floor(remainingSeconds / 60);
                          const secs = remainingSeconds % 60;
                          const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                          const isWarning = remainingSeconds <= 180; // under 3 minutes

                          return (
                            <div
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border font-mono font-black shadow-lg transition-all ${
                                isWarning
                                  ? 'bg-amber-500/25 border-amber-500/70 text-amber-300 animate-pulse'
                                  : 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                              }`}
                              title="Target grill & pack timer: 10 minutes"
                            >
                              <Flame
                                className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${
                                  isWarning ? 'text-amber-400 animate-bounce' : 'text-orange-400'
                                }`}
                              />
                              <div className="text-right leading-none">
                                <div className="text-base sm:text-xl tracking-tight font-black">
                                  {formattedTime}
                                </div>
                                <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-zinc-400 font-sans font-extrabold mt-0.5">
                                  Cook Timer
                                </div>
                              </div>
                            </div>
                          );
                        } else {
                          const overdueSeconds = Math.abs(remainingSeconds);
                          const oMins = Math.floor(overdueSeconds / 60);
                          const oSecs = overdueSeconds % 60;
                          const formattedOverdue = `${String(oMins).padStart(2, '0')}:${String(oSecs).padStart(2, '0')}`;

                          return (
                            <div className="flex items-center gap-1.5">
                              <div
                                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-red-600 border-2 border-red-400 text-white font-mono font-black shadow-xl shadow-red-600/50 animate-pulse"
                                title="Cooking time exceeded 10 minutes! Order is overdue."
                              >
                                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin shrink-0" />
                                <div className="text-right leading-none">
                                  <div className="text-sm sm:text-base tracking-tight font-black">
                                    -{formattedOverdue}
                                  </div>
                                  <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-red-200 font-sans font-black mt-0.5">
                                    OVERDUE
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleSilenceAlarm(order.orderId)}
                                className={`px-2.5 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider border cursor-pointer transition-all flex items-center gap-1 shadow-md ${
                                  isSilenced
                                    ? 'bg-zinc-800 text-zinc-400 border-white/10 hover:bg-zinc-700'
                                    : 'bg-amber-400 hover:bg-amber-300 text-zinc-950 border-amber-300 animate-bounce'
                                }`}
                                title={isSilenced ? 'Alarm muted for this ticket' : 'Silence alarm for this ticket'}
                              >
                                {isSilenced ? (
                                  <VolumeX className="w-3.5 h-3.5" />
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5" />
                                )}
                                <span>{isSilenced ? 'Muted' : 'Silence'}</span>
                              </button>
                            </div>
                          );
                        }
                      })()}

                      <button
                        type="button"
                        onClick={() => handlePrintSlip(order)}
                        className="p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
                        title="Print kitchen docket"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Customer & Location Info */}
                  <div className="p-4 bg-zinc-950/60 border-b border-white/5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-sm">
                        {customerName}
                      </span>
                      {rawPhone ? (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{rawPhone}</span>
                        </a>
                      ) : (
                        <span className="text-zinc-500 text-[11px]">No Phone</span>
                      )}
                    </div>

                    {isDelivery && (
                      <div className="pt-1 text-[11px] text-zinc-300 space-y-0.5">
                        <div className="font-semibold text-white">
                          📍 {address ? `${address}, ${suburb}` : suburb}
                        </div>
                        {customer.complexOrUnit && (
                          <div className="text-amber-300">Unit: {customer.complexOrUnit}</div>
                        )}
                        {customer.gateCode && (
                          <div className="text-amber-300 font-bold">🔑 Gate Code: {customer.gateCode}</div>
                        )}
                        {customer.notes && (
                          <div className="italic text-zinc-400">"{customer.notes}"</div>
                        )}

                        <div className="pt-2 flex gap-2">
                          <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            title="Open Google Maps turn-by-turn navigation"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Driver GPS</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => setViewingDriverOrder(order)}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                            title="View Driver Dispatch Details & WhatsApp link"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Driver Dispatch</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Meal Checklist (The Kitchen's Core View - High Visibility) */}
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-72">
                    <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-orange-400 flex items-center justify-between pb-1.5 border-b border-white/10">
                      <span>📋 FOOD CHECKLIST</span>
                      <span className="text-zinc-400 text-xs font-bold">
                        ({items.length} {items.length === 1 ? 'item' : 'items'})
                      </span>
                    </div>

                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-zinc-900/95 border border-white/15 space-y-2 text-xs"
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="px-2.5 py-1 rounded-xl bg-orange-500 text-zinc-950 font-black text-sm sm:text-base shrink-0 shadow-sm">
                            {item.quantity || 1}x
                          </span>
                          <span className="font-black text-white text-base sm:text-lg leading-snug">
                            {item.menuItem?.name || 'Meal'}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {item.customization?.flavour && (
                            <span className="px-2.5 py-1 rounded-xl bg-rose-500/25 text-rose-300 font-black text-xs sm:text-sm uppercase border border-rose-500/35">
                              🔥 BASTE: {item.customization.flavour}
                            </span>
                          )}
                          {item.customization?.side && (
                            <span className="px-2.5 py-1 rounded-xl bg-amber-500/25 text-amber-200 font-extrabold text-xs sm:text-sm border border-amber-500/35">
                              🍟 SIDE: {item.customization.side}
                            </span>
                          )}
                        </div>

                        {Array.isArray(item.customization?.extras) &&
                          item.customization.extras.length > 0 && (
                            <div className="space-y-0.5 pt-0.5">
                              {item.customization.extras.map((e) => (
                                <div key={e.name} className="text-xs sm:text-sm text-amber-300 font-bold flex items-center gap-1.5">
                                  <span className="text-amber-400 font-black">+</span>
                                  <span>{e.name}</span>
                                </div>
                              ))}
                            </div>
                          )}

                        {item.customization?.notes && (
                          <div className="text-xs sm:text-sm text-yellow-200 font-bold italic bg-yellow-500/15 p-2 rounded-xl mt-1.5 border border-yellow-500/25 flex items-start gap-1.5">
                            <span className="text-sm shrink-0">⚠️</span>
                            <span>Note: "{item.customization.notes}"</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Card Financials & Current Status */}
                  <div className="p-3.5 bg-zinc-950 border-t border-white/10 flex items-center justify-between text-xs font-bold">
                    <div>
                      <span className="text-zinc-400">Total: </span>
                      <span className="text-amber-400 font-black text-sm">
                        R{grandTotal.toFixed(2)}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        order.paymentStatus === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {order.paymentStatus === 'paid' ? 'PAID' : 'PAY ON HANDOVER'} ({paymentMethod})
                    </span>
                  </div>

                  {/* Action Buttons (Standardized Color: Yellow for Collection, Orange for Delivery) */}
                  <div className="p-3 bg-zinc-950/80 border-t border-white/10 grid grid-cols-1 gap-2">
                    {order.status === 'received' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.orderId, 'cooking')}
                        className={`w-full py-3 rounded-2xl font-black text-xs sm:text-sm tracking-wide shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer ${
                          isDelivery
                            ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-950/60'
                            : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 shadow-amber-950/60'
                        }`}
                      >
                        <Flame className={`w-4 h-4 ${isDelivery ? 'fill-white text-white' : 'fill-zinc-950 text-zinc-950'}`} />
                        <span>1. ACCEPT & START GRILLING</span>
                      </button>
                    )}

                    {order.status === 'cooking' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.orderId, 'ready')}
                        className={`w-full py-3 rounded-2xl font-black text-xs sm:text-sm tracking-wide shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer ${
                          isDelivery
                            ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-950/60'
                            : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 shadow-amber-950/60'
                        }`}
                      >
                        <ShoppingBag className={`w-4 h-4 ${isDelivery ? 'text-white' : 'text-zinc-950'}`} />
                        <span>2. FOOD READY & PACKED</span>
                      </button>
                    )}

                    {order.status === 'ready' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(order.orderId, isDelivery ? 'dispatched' : 'completed')
                        }
                        className={`w-full py-3 rounded-2xl font-black text-xs sm:text-sm tracking-wide shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer ${
                          isDelivery
                            ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-950/60'
                            : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 shadow-amber-950/60'
                        }`}
                      >
                        {isDelivery ? (
                          <>
                            <Truck className="w-4 h-4 text-white" />
                            <span>3. HAND TO DRIVER (OUT FOR DELIVERY)</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 text-zinc-950" />
                            <span>3. HAND OVER TO CUSTOMER (COMPLETE)</span>
                          </>
                        )}
                      </button>
                    )}

                    {order.status === 'dispatched' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.orderId, 'completed')}
                        className={`w-full py-3 rounded-2xl font-black text-xs sm:text-sm tracking-wide shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer ${
                          isDelivery
                            ? 'bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-950/60'
                            : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-zinc-950 shadow-amber-950/60'
                        }`}
                      >
                        <CheckCircle className={`w-4 h-4 ${isDelivery ? 'text-white' : 'text-zinc-950'}`} />
                        <span>4. CONFIRM DELIVERED & COMPLETE</span>
                      </button>
                    )}

                    {order.status === 'completed' && (
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                        <div className="flex items-center gap-2 text-emerald-400 font-extrabold">
                          <CheckCircle className="w-4 h-4 shrink-0" />
                          <span>{isDelivery ? 'Delivered & Completed' : 'Collected & Completed'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete order #${order.orderId} from history?`)) {
                              deleteOrder(order.orderId);
                              setOrders(getAllOrders());
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-red-600/20 text-zinc-400 hover:text-red-400 border border-white/10 text-[10px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="Delete from history"
                        >
                          <Trash2 className="w-3 h-3 text-red-400" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Driver Dispatch Ticket & Routing Modal */}
      {viewingDriverOrder && (
        <DriverTicketModal
          order={viewingDriverOrder}
          onClose={() => setViewingDriverOrder(null)}
        />
      )}
    </div>
  );
};
