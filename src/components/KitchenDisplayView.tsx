import React, { useState, useEffect } from 'react';
import { LiveOrder, OrderStatus } from '../types';
import {
  getAllOrders,
  subscribeToOrders,
  updateOrderStatus,
  playKitchenChime,
  syncOrdersFromCloud
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
  RefreshCw
} from 'lucide-react';
import { ChickenWingIcon } from './icons/ChickenWingIcon';

interface KitchenDisplayViewProps {
  onBackToMenu: () => void;
  onViewOrderTracker?: (orderId: string) => void;
}

export const KitchenDisplayView: React.FC<KitchenDisplayViewProps> = ({
  onBackToMenu,
  onViewOrderTracker,
}) => {
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [filter, setFilter] = useState<'active' | 'cooking' | 'ready' | 'completed'>('active');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToOrders((newOrders) => {
      setOrders(newOrders);
    });

    const clockTimer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    // Active 2-second live kitchen radar to guarantee instant detection across devices
    const radarTimer = setInterval(async () => {
      const freshOrders = await syncOrdersFromCloud();
      setOrders((prev) => {
        const prevIds = new Set(prev.map((o) => o.orderId));
        const newIncoming = freshOrders.filter((o) => !prevIds.has(o.orderId));
        if (newIncoming.length > 0 && soundEnabled) {
          playKitchenChime();
        }
        return freshOrders;
      });
    }, 2000);

    return () => {
      unsubscribe();
      clearInterval(clockTimer);
      clearInterval(radarTimer);
    };
  }, [soundEnabled]);

  const handleStatusChange = (orderId: string, nextStatus: OrderStatus) => {
    updateOrderStatus(orderId, nextStatus);
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
          <div class="badge">${isDelivery ? '🚗 HOME DELIVERY' : '🛍️ STORE COLLECTION'}</div>
          <div>Time: ${order.createdAt} (${order.preferredTime})</div>
          <div class="line"></div>
          <div><span class="bold">Customer:</span> ${order.customer.customerName}</div>
          <div><span class="bold">Phone:</span> ${order.customer.phone}</div>
          ${
            isDelivery
              ? `<div><span class="bold">Address:</span> ${order.customer.address}, ${order.customer.suburb}</div>
                 ${order.customer.complexOrUnit ? `<div>Unit: ${order.customer.complexOrUnit}</div>` : ''}
                 ${order.customer.gateCode ? `<div>Gate Code: ${order.customer.gateCode}</div>` : ''}
                 ${order.customer.notes ? `<div>Notes: ${order.customer.notes}</div>` : ''}`
              : ''
          }
          <div class="line"></div>
          <div class="bold">ITEMS:</div>
          ${order.items
            .map(
              (i) => `
            <div class="item">
              <div class="bold">${i.quantity}x ${i.menuItem.name}</div>
              ${i.customization?.flavour ? `<div>- Baste: ${i.customization.flavour.toUpperCase()}</div>` : ''}
              ${i.customization?.side ? `<div>- Side: ${i.customization.side}</div>` : ''}
              ${i.customization?.notes ? `<div>- Notes: ${i.customization.notes}</div>` : ''}
            </div>
          `
            )
            .join('')}
          <div class="line"></div>
          <div class="bold" style="font-size: 15px;">TOTAL: R${order.grandTotal.toFixed(2)}</div>
          <div>Payment: ${order.paymentStatus === 'paid' ? 'PAID' : 'COLLECT PAYMENT'} (${order.paymentMethod.toUpperCase()})</div>
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

  // Filter orders
  const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
  const cookingOrders = orders.filter((o) => o.status === 'cooking');
  const readyOrders = orders.filter((o) => o.status === 'ready' || o.status === 'dispatched');
  const completedOrders = orders.filter((o) => o.status === 'completed');

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
        </div>

        <div className="flex items-center gap-3">
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

          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="hidden sm:inline">Live Cloud Sync</span>
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
            <h3 className="text-lg font-black text-zinc-300">No orders in this column</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm">
              When customers place orders on the website from their phones, they will appear here live with an instant audio chime!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={async () => {
                  setIsSyncing(true);
                  const fresh = await syncOrdersFromCloud();
                  setOrders(fresh);
                  setTimeout(() => setIsSyncing(false), 600);
                }}
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors border border-white/10"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-rose-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Fetch Past Orders From Cloud</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayedOrders.map((order) => {
              const isDelivery = order.orderMode === 'delivery';
              const googleMapsUrl = generateGoogleMapsUrl(order.customer.address, order.customer.suburb);
              const cleanPhone = order.customer.phone.replace(/[^0-9]/g, '');

              return (
                <div
                  key={order.orderId}
                  className={`rounded-3xl border flex flex-col overflow-hidden shadow-2xl transition-all ${
                    order.status === 'received'
                      ? 'bg-[#181820] border-rose-500/60 ring-2 ring-rose-500/30'
                      : order.status === 'cooking'
                      ? 'bg-[#181820] border-amber-500/50'
                      : order.status === 'ready' || order.status === 'dispatched'
                      ? 'bg-[#181820] border-emerald-500/50'
                      : 'bg-zinc-900/80 border-white/10 opacity-70'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className={`p-4 flex items-center justify-between border-b ${
                      order.status === 'received'
                        ? 'bg-rose-950/60 border-rose-500/30 text-rose-200'
                        : order.status === 'cooking'
                        ? 'bg-amber-950/50 border-amber-500/30 text-amber-200'
                        : order.status === 'ready' || order.status === 'dispatched'
                        ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'
                        : 'bg-zinc-950 border-white/10 text-zinc-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white tracking-tight">
                          #{order.orderId}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${
                            isDelivery ? 'bg-orange-500 text-zinc-950' : 'bg-emerald-500 text-zinc-950'
                          }`}
                        >
                          {isDelivery ? '🚗 DELIVERY' : '🛍️ COLLECTION'}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>Placed: {order.createdAt}</span>
                        <span>•</span>
                        <span className="text-amber-300 font-bold">{order.preferredTime}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
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
                        {order.customer.customerName}
                      </span>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order.customer.phone}</span>
                      </a>
                    </div>

                    {isDelivery && (
                      <div className="pt-1 text-[11px] text-zinc-300 space-y-0.5">
                        <div className="font-semibold text-white">
                          📍 {order.customer.address}, {order.customer.suburb}
                        </div>
                        {order.customer.complexOrUnit && (
                          <div className="text-amber-300">Unit: {order.customer.complexOrUnit}</div>
                        )}
                        {order.customer.gateCode && (
                          <div className="text-amber-300 font-bold">🔑 Gate Code: {order.customer.gateCode}</div>
                        )}
                        {order.customer.notes && (
                          <div className="italic text-zinc-400">"{order.customer.notes}"</div>
                        )}

                        <div className="pt-1.5 flex gap-2">
                          <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-1.5 px-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center gap-1"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Driver GPS</span>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Meal Checklist (The Kitchen's Core View) */}
                  <div className="flex-1 p-4 space-y-2.5 overflow-y-auto max-h-64">
                    <div className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      Food Checklist ({order.items.length} items)
                    </div>
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-zinc-900 border border-white/10 space-y-1 text-xs"
                      >
                        <div className="flex items-baseline justify-between">
                          <span className="font-black text-white text-sm">
                            {item.quantity}x {item.menuItem.name}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {item.customization?.flavour && (
                            <span className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-extrabold text-[11px] uppercase border border-rose-500/30">
                              🔥 Baste: {item.customization.flavour}
                            </span>
                          )}
                          {item.customization?.side && (
                            <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-extrabold text-[11px] border border-amber-500/30">
                              🍟 Side: {item.customization.side}
                            </span>
                          )}
                        </div>

                        {item.customization?.extras?.map((e) => (
                          <div key={e.name} className="text-[11px] text-amber-300/80 font-medium">
                            + {e.name}
                          </div>
                        ))}

                        {item.customization?.notes && (
                          <div className="text-[11px] text-yellow-300/90 italic bg-yellow-500/10 p-1.5 rounded-lg mt-1 border border-yellow-500/20">
                            Note: "{item.customization.notes}"
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
                        R{order.grandTotal.toFixed(2)}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                        order.paymentStatus === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {order.paymentStatus === 'paid' ? 'PAID' : 'PAY ON HANDOVER'}
                    </span>
                  </div>

                  {/* Action Buttons (1-Tap Pedros-style Status Progression) */}
                  <div className="p-3 bg-zinc-950/80 border-t border-white/10 grid grid-cols-1 gap-2">
                    {order.status === 'received' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.orderId, 'cooking')}
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-rose-950/60 transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Flame className="w-4 h-4 fill-white" />
                        <span>ACCEPT & START GRILLING</span>
                      </button>
                    )}

                    {order.status === 'cooking' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(order.orderId, isDelivery ? 'dispatched' : 'ready')
                        }
                        className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-950/60 transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isDelivery ? (
                          <>
                            <Truck className="w-4 h-4" />
                            <span>FOOD PACKED & SEND DRIVER</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-4 h-4" />
                            <span>FOOD PACKED & READY AT COUNTER</span>
                          </>
                        )}
                      </button>
                    )}

                    {(order.status === 'ready' || order.status === 'dispatched') && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.orderId, 'completed')}
                        className="w-full py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-black text-xs sm:text-sm tracking-wide border border-emerald-500/30 transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>MARK COMPLETED (HANDED OVER)</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
