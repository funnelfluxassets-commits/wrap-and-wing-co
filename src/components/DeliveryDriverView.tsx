import React, { useState, useEffect, useRef } from 'react';
import { LiveOrder, OrderStatus } from '../types';
import {
  getAllOrders,
  subscribeToOrders,
  updateOrderStatus,
  playKitchenChime,
  unlockAudio,
  syncOrdersFromCloud
} from '../services/orderService';
import { generateGoogleMapsUrl, generateWazeUrl } from '../services/payment';
import {
  Bike,
  MapPin,
  Phone,
  Navigation,
  ArrowLeft,
  Volume2,
  VolumeX,
  RefreshCw,
  LogOut,
  CheckCircle,
  Clock,
  MessageSquare,
  ShoppingBag,
  Key,
  FileText,
  AlertCircle
} from 'lucide-react';
import { DeliveryMotorbikeIcon } from './icons/DeliveryMotorbikeIcon';
import { DriverTicketModal } from './DriverTicketModal';

interface DeliveryDriverViewProps {
  onBackToMenu: () => void;
  onLogout?: () => void;
  onViewOrderTracker?: (orderId: string) => void;
}

export const DeliveryDriverView: React.FC<DeliveryDriverViewProps> = ({
  onBackToMenu,
  onLogout,
  onViewOrderTracker,
}) => {
  const [orders, setOrders] = useState<LiveOrder[]>(() => getAllOrders());
  const [filter, setFilter] = useState<'ready' | 'dispatched' | 'completed' | 'all'>('ready');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>(() => new Date().toLocaleTimeString());
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<LiveOrder | null>(null);

  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitializedRef = useRef(false);

  // Audio unlock on user tap
  useEffect(() => {
    const handleGesture = () => unlockAudio();
    window.addEventListener('click', handleGesture, { once: true });
    window.addEventListener('touchstart', handleGesture, { once: true });
    const timer = setTimeout(() => {
      isInitializedRef.current = true;
    }, 1000);
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
      clearTimeout(timer);
    };
  }, []);

  // Real-time synchronization
  useEffect(() => {
    const unsubscribe = subscribeToOrders((newOrders) => {
      const currentKnown = knownOrderIdsRef.current;
      const readyDeliveries = newOrders.filter(
        (o) => o.orderMode === 'delivery' && o.status === 'ready' && !currentKnown.has(o.orderId)
      );

      if (isInitializedRef.current && readyDeliveries.length > 0 && soundEnabled) {
        playKitchenChime();
      }

      newOrders.forEach((o) => currentKnown.add(o.orderId));
      setOrders(newOrders);
    });

    const clockTimer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    // Live radar poll every 3 seconds for active background sync
    const radarTimer = setInterval(async () => {
      const freshOrders = await syncOrdersFromCloud();
      setOrders(freshOrders);
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(clockTimer);
      clearInterval(radarTimer);
    };
  }, [soundEnabled]);

  const handleStatusChange = (orderId: string, nextStatus: OrderStatus) => {
    const updated = updateOrderStatus(orderId, nextStatus);
    if (updated) {
      setOrders((prev) =>
        prev.map((o) => (o.orderId === orderId ? updated : o))
      );
    } else {
      setOrders(getAllOrders());
    }
    if (soundEnabled) {
      playKitchenChime();
    }
  };

  // Filter only home delivery orders
  const deliveryOrders = orders.filter(
    (o): o is LiveOrder => Boolean(o && typeof o === 'object' && o.orderId && o.orderMode === 'delivery')
  );

  const readyOrders = deliveryOrders.filter((o) => o.status === 'ready');
  const dispatchedOrders = deliveryOrders.filter((o) => o.status === 'dispatched');
  
  // Helper to extract numeric order sequence (e.g. "D-0810" -> 810)
  const extractOrderSequence = (orderId: string): number => {
    const clean = String(orderId || '').replace(/[^0-9]/g, '');
    const num = parseInt(clean, 10);
    return isNaN(num) ? 0 : num;
  };

  // Sort completed delivery runs newest-first (top-left)
  const completedOrders = [...deliveryOrders.filter((o) => o.status === 'completed')].sort((a, b) => {
    const timeA = a.completedAt || 0;
    const timeB = b.completedAt || 0;
    if (timeA && timeB && Math.abs(timeA - timeB) > 2000) return timeB - timeA;
    if (timeA && !timeB) return -1;
    if (!timeA && timeB) return 1;

    // Sequence priority: #D-0810 (810) > #D-0809 (809) > #D-0601 (601)
    const seqA = extractOrderSequence(a.orderId);
    const seqB = extractOrderSequence(b.orderId);
    if (seqA && seqB && seqA !== seqB) {
      return seqB - seqA;
    }

    return deliveryOrders.indexOf(a) - deliveryOrders.indexOf(b);
  });

  const displayedOrders =
    filter === 'ready'
      ? readyOrders
      : filter === 'dispatched'
      ? dispatchedOrders
      : filter === 'completed'
      ? completedOrders
      : deliveryOrders;

  return (
    <div className="min-h-screen bg-[#0c0d12] text-zinc-100 flex flex-col font-sans pb-16">
      
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#13141b] border-b border-white/10 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xl">
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
              <span className="text-base sm:text-lg font-black tracking-tight text-white uppercase flex items-center gap-1.5">
                <DeliveryMotorbikeIcon className="w-5 h-5 text-amber-400" />
                <span>DELIVERY DISPATCH RADAR</span>
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                DRIVER DESK
              </span>
            </div>
            <div className="text-[11px] text-zinc-400">
              Turn-by-turn routing &amp; live run updates
            </div>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              playKitchenChime();
              setSoundEnabled(!soundEnabled);
            }}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-zinc-800 border-white/10 text-zinc-500'
            }`}
            title="Toggle notification chime"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
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

      {/* ── Filter Tabs & Radar Bar ─────────────────────────────────────────── */}
      <div className="bg-[#121217] border-b border-white/10 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setFilter('ready')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'ready'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-zinc-950 shadow-md font-black'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            <span>📦 Ready at Kitchen</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
              {readyOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('dispatched')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'dispatched'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            <span>🛵 On Road</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
              {dispatchedOrders.length}
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
            <span>✅ Completed Runs</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
              {completedOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-zinc-800 text-white shadow-md border border-white/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-white border border-white/5'
            }`}
          >
            <span>All ({deliveryOrders.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={async () => {
              setIsSyncing(true);
              const fresh = await syncOrdersFromCloud();
              setOrders(fresh);
              setTimeout(() => setIsSyncing(false), 500);
            }}
            disabled={isSyncing}
            className="p-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
          </button>

          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="hidden sm:inline">GPS Radar</span>
          </div>
        </div>
      </div>

      {/* ── Delivery Cards Grid ─────────────────────────────────────────────── */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {displayedOrders.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-zinc-900/40 rounded-3xl border border-white/5 text-zinc-500">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-3xl mb-3">
              🛵
            </div>
            <h3 className="text-lg font-black text-zinc-300">
              No delivery runs in this section
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              When kitchen staff click "Food Ready &amp; Packed" on a delivery order, it appears here instantly for pickup and routing.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {displayedOrders.map((order) => {
              const customer = order.customer || ({} as any);
              const address = customer.address || 'Address on file';
              const suburb = customer.suburb || 'Pinetown';
              const cleanPhone = (customer.phone || '').replace(/[^0-9+]/g, '');
              const waNumber = cleanPhone.startsWith('0')
                ? `27${cleanPhone.slice(1)}`
                : cleanPhone.replace('+', '');
              const googleMapsUrl = generateGoogleMapsUrl(address, suburb);
              const wazeUrl = generateWazeUrl(address, suburb);
              const items = Array.isArray(order.items) ? order.items : [];
              const grandTotal = typeof order.grandTotal === 'number' ? order.grandTotal : 0;
              const isPaid = order.paymentStatus === 'paid';

              return (
                <div
                  key={order.orderId}
                  className={`rounded-3xl border flex flex-col justify-between overflow-hidden shadow-2xl transition-all ${
                    order.status === 'ready'
                      ? 'bg-gradient-to-b from-amber-950/40 via-zinc-900 to-zinc-950 border-amber-500/50 ring-2 ring-amber-500/30'
                      : order.status === 'dispatched'
                      ? 'bg-gradient-to-b from-orange-950/40 via-zinc-900 to-zinc-950 border-orange-500/50'
                      : 'bg-zinc-900/90 border-white/10 opacity-80'
                  }`}
                >
                  
                  {/* Card Header */}
                  <div className="p-4 sm:p-5 border-b border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black text-white">
                          #{order.orderId}
                        </span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                            order.status === 'ready'
                              ? 'bg-amber-400 text-zinc-950 animate-pulse'
                              : order.status === 'dispatched'
                              ? 'bg-orange-500 text-white'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {order.status === 'ready' && '📦 READY FOR PICKUP'}
                          {order.status === 'dispatched' && '🛵 ON ROAD'}
                          {order.status === 'completed' && '✅ DELIVERED'}
                        </span>
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] font-black text-amber-300">
                          {order.preferredTime || 'ASAP'}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Placed: {order.createdAt}
                        </div>
                      </div>
                    </div>

                    {/* Customer & Address Details */}
                    <div className="pt-1 space-y-1">
                      <div className="text-sm font-black text-white flex items-center justify-between">
                        <span>{customer.customerName || 'Customer'}</span>
                        <span className="text-xs text-zinc-400 font-mono">{customer.phone}</span>
                      </div>

                      <div className="flex items-start gap-1.5 text-xs text-zinc-200">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-extrabold text-white leading-snug">
                            {address}
                          </div>
                          <div className="text-[11px] text-zinc-400 font-medium">
                            {suburb}
                            {customer.complexOrUnit && ` • Unit: ${customer.complexOrUnit}`}
                          </div>
                        </div>
                      </div>

                      {customer.gateCode && (
                        <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 mt-1">
                          <Key className="w-3.5 h-3.5 shrink-0" />
                          <span>Gate / Intercom Code: <strong className="font-mono text-white">{customer.gateCode}</strong></span>
                        </div>
                      )}

                      {customer.notes && (
                        <div className="p-2 rounded-xl bg-zinc-800/80 border border-white/10 text-zinc-300 text-xs flex items-start gap-1.5 mt-1">
                          <span className="shrink-0 text-amber-400">📝</span>
                          <span>Note: "{customer.notes}"</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 1-Tap Navigation & Contact Buttons */}
                  <div className="p-3 bg-zinc-950/60 border-b border-white/10 grid grid-cols-2 gap-2 text-xs font-bold">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Google Maps</span>
                    </a>

                    <a
                      href={wazeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 hover:text-white border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Waze GPS</span>
                    </a>

                    <a
                      href={`tel:${cleanPhone}`}
                      className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Call Client</span>
                    </a>

                    <a
                      href={`https://wa.me/${waNumber}?text=Hi%20${encodeURIComponent(customer.customerName || 'there')}!%20This%20is%20your%20Wrap%20%26%20Wings%20Co.%20driver%20with%20order%20%23${order.orderId}.%20I%20am%20on%20my%20way!`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 hover:text-white border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>

                  {/* Meal Checklist (To verify thermal bags) */}
                  <div className="p-4 space-y-2 flex-1 overflow-y-auto max-h-44 bg-zinc-950/30">
                    <div className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between pb-1 border-b border-white/5">
                      <span>Bag Checklist</span>
                      <span>({items.length} {items.length === 1 ? 'item' : 'items'})</span>
                    </div>

                    {items.map((item, idx) => (
                      <div key={idx} className="text-xs flex items-start gap-2 py-1">
                        <span className="px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 font-black text-[11px] shrink-0">
                          {item.quantity || 1}x
                        </span>
                        <div className="text-zinc-200 leading-tight">
                          <span className="font-bold text-white">{item.menuItem?.name || 'Meal'}</span>
                          {item.customization?.flavour && (
                            <span className="text-rose-400 ml-1">({item.customization.flavour})</span>
                          )}
                          {item.customization?.side && (
                            <span className="text-zinc-400 block text-[10px]">+ {item.customization.side}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Payment Details */}
                  <div className="p-3 bg-zinc-950 border-t border-white/10 flex items-center justify-between text-xs font-bold">
                    <div>
                      <span className="text-zinc-400">Total: </span>
                      <span className="text-amber-400 font-black text-sm">
                        R{grandTotal.toFixed(2)}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        isPaid
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {isPaid ? 'PAID ONLINE' : 'COLLECT CASH / SPEEDPOINT'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-3 bg-zinc-950/90 border-t border-white/10 space-y-2">
                    {order.status === 'ready' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.orderId, 'dispatched')}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-amber-950/60 transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <DeliveryMotorbikeIcon className="w-4 h-4 text-zinc-950" />
                        <span>ACCEPT &amp; START DELIVERY</span>
                      </button>
                    )}

                    {order.status === 'dispatched' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.orderId, 'completed')}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-950/60 transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>✅ CONFIRM DELIVERED &amp; COMPLETE RUN</span>
                      </button>
                    )}

                    {order.status === 'completed' && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        <span>Delivery Run Finished</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedTicketOrder(order)}
                        className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-amber-400" />
                        <span>Share Ticket</span>
                      </button>

                      {onViewOrderTracker && (
                        <button
                          type="button"
                          onClick={() => onViewOrderTracker(order.orderId)}
                          className="text-[11px] text-zinc-400 hover:text-white font-bold cursor-pointer"
                        >
                          View Tracker ➔
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Driver Ticket Modal for sharing or printing */}
      {selectedTicketOrder && (
        <DriverTicketModal
          order={selectedTicketOrder}
          onClose={() => setSelectedTicketOrder(null)}
        />
      )}

    </div>
  );
};
