import React, { useState, useEffect } from 'react';
import { LiveOrder, OrderStatus } from '../types';
import {
  subscribeToSingleOrder,
  getCurrentOrderId,
  getAllOrders,
  syncOrdersFromCloud,
  playCustomerUpdateChime,
  triggerHapticFeedback
} from '../services/orderService';
import { getWhatsAppOrderUrl, generateGoogleMapsUrl } from '../services/payment';
import {
  CheckCircle,
  Flame,
  Clock,
  ShoppingBag,
  Truck,
  MapPin,
  Phone,
  MessageSquare,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  PartyPopper
} from 'lucide-react';

interface OrderTrackerViewProps {
  orderId: string;
  onBackToMenu: () => void;
  onOpenKitchen?: () => void;
}

export const OrderTrackerView: React.FC<OrderTrackerViewProps> = ({
  orderId,
  onBackToMenu,
  onOpenKitchen,
}) => {
  const [order, setOrder] = useState<LiveOrder | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastStatus, setLastStatus] = useState<OrderStatus | null>(null);

  const effectiveOrderId = orderId || getCurrentOrderId() || getAllOrders()[0]?.orderId || '';

  const triggerStatusAlert = (status: OrderStatus) => {
    playCustomerUpdateChime();
    triggerHapticFeedback();
    if (status === 'cooking') {
      setToastMessage('🔥 Kitchen Update: Order accepted! Your chicken is now sizzling on the flame grill!');
    } else if (status === 'ready') {
      setToastMessage('🛍️ Kitchen Update: Fresh off the grill & packed! Ready for collection at counter.');
    } else if (status === 'dispatched') {
      setToastMessage('🚗 Driver Update: Hot meal handed to delivery driver and heading to your door!');
    } else if (status === 'completed') {
      setToastMessage('🎉 Handed Over: Thank you for ordering with Wrap & Wings Co. Enjoy!');
    }
  };

  useEffect(() => {
    if (!effectiveOrderId) return;
    const unsubscribe = subscribeToSingleOrder(effectiveOrderId, (liveOrder) => {
      if (liveOrder) {
        if (lastStatus && liveOrder.status !== lastStatus) {
          triggerStatusAlert(liveOrder.status);
        }
        setLastStatus(liveOrder.status);
        setOrder(liveOrder);
      }
    });

    const handleCustomStatusEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.orderId === effectiveOrderId) {
        triggerStatusAlert(detail.newStatus || detail.status);
      }
    };
    window.addEventListener('wrap_wing_order_status_updated', handleCustomStatusEvent);

    // Active 2-second tracker radar to check for kitchen status progression
    const trackerRadar = setInterval(async () => {
      const freshOrders = await syncOrdersFromCloud();
      const current = freshOrders.find((o) => o.orderId === effectiveOrderId);
      if (current) {
        if (lastStatus && current.status !== lastStatus) {
          triggerStatusAlert(current.status);
        }
        setLastStatus(current.status);
        setOrder(current);
      }
    }, 2000);

    return () => {
      unsubscribe();
      window.removeEventListener('wrap_wing_order_status_updated', handleCustomStatusEvent);
      clearInterval(trackerRadar);
    };
  }, [effectiveOrderId, lastStatus]);

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0d0d12] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-3xl mb-4">
          🔍
        </div>
        <h2 className="text-xl font-black">
          {effectiveOrderId ? `Looking for Order #${effectiveOrderId}...` : 'No Active Order Found'}
        </h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm">
          Connecting to live restaurant kitchen feed to check your order status.
        </p>
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={async () => {
              const orders = await syncOrdersFromCloud();
              if (orders.length > 0) {
                setOrder(orders[0]);
              }
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
          >
            ↻ Check Cloud Feed
          </button>
          <button
            type="button"
            onClick={onBackToMenu}
            className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs cursor-pointer"
          >
            Return to Menu
          </button>
        </div>
      </div>
    );
  }

  const isDelivery = order.orderMode === 'delivery';
  const whatsAppUrl = getWhatsAppOrderUrl(order);

  // Status step calculations
  const getStepProgress = (status: OrderStatus) => {
    switch (status) {
      case 'received':
        return 1;
      case 'cooking':
        return 2;
      case 'ready':
      case 'dispatched':
        return 3;
      case 'completed':
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getStepProgress(order.status);

  return (
    <div className="min-h-screen bg-[#0d0d12] text-zinc-100 flex flex-col font-sans pb-16">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#14141a]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToMenu}
          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Menu</span>
        </button>

        <div className="text-center">
          <div className="text-[10px] font-black uppercase tracking-wider text-rose-400">
            LIVE ORDER TRACKER
          </div>
          <h1 className="text-sm sm:text-base font-black text-white">
            Order #{order.orderId}
          </h1>
        </div>

        {onOpenKitchen && (
          <button
            type="button"
            onClick={onOpenKitchen}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 text-[10px] font-bold cursor-pointer"
            title="Open Kitchen Screen (Staff Demo)"
          >
            🍳 Staff View
          </button>
        )}
      </header>

      {/* Main Content Container */}
      <main className="max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Real-Time Kitchen Update Toast Alert */}
        {toastMessage && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-red-600 text-white font-extrabold text-xs sm:text-sm shadow-2xl flex items-center justify-between gap-3 animate-slideDown border border-amber-300/40">
            <div className="flex items-center gap-2.5">
              <span className="text-xl animate-bounce">🔔</span>
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="px-2 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-white text-xs cursor-pointer font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dynamic Status Highlight Card */}
        <div
          className={`p-6 rounded-3xl border shadow-2xl relative overflow-hidden transition-all ${
            order.status === 'received'
              ? 'bg-gradient-to-br from-rose-950/60 via-zinc-900 to-zinc-950 border-rose-500/40'
              : order.status === 'cooking'
              ? 'bg-gradient-to-br from-amber-950/60 via-zinc-900 to-zinc-950 border-amber-500/40'
              : order.status === 'ready' || order.status === 'dispatched'
              ? 'bg-gradient-to-br from-emerald-950/70 via-zinc-900 to-zinc-950 border-emerald-500/50'
              : 'bg-zinc-900 border-white/10'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-black/40 border border-white/10 text-white mb-2">
                {isDelivery ? '🚗 HOME DELIVERY' : '🛍️ STORE COLLECTION'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {order.status === 'received' && 'Order Received!'}
                {order.status === 'cooking' && 'On The Flame Grill! 🔥'}
                {order.status === 'ready' && 'Hot & Ready For Pickup! 🛍️'}
                {order.status === 'dispatched' && 'Driver Is On The Way! 🚗'}
                {order.status === 'completed' && 'Order Completed! 🎉'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-md leading-relaxed">
                {order.status === 'received' &&
                  'The Pinetown kitchen has your ticket and is preparing your flame-grilled order.'}
                {order.status === 'cooking' &&
                  'Your chicken and meals are sizzling on the grill with your selected baste flavour.'}
                {order.status === 'ready' &&
                  'Your meal is fresh off the grill and packed! Please proceed to the collection counter at Shop 1, Uniland Centre.'}
                {order.status === 'dispatched' &&
                  'Our delivery driver has your hot order and is heading towards your delivery address.'}
                {order.status === 'completed' &&
                  'Thank you for ordering with Wrap & Wings Co.! We hope you enjoy every bite.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-center shrink-0">
              <div className="text-[10px] font-black uppercase text-zinc-400">Target Time</div>
              <div className="text-lg sm:text-xl font-black text-amber-400 mt-0.5">
                {order.preferredTime}
              </div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Placed: {order.createdAt}</div>
            </div>
          </div>

          {/* Animated 4-Step Progress Bar (Pedros / Uber Eats style) */}
          <div className="pt-8">
            <div className="relative">
              {/* Background Connecting Bar */}
              <div className="h-2 bg-zinc-800 rounded-full w-full absolute top-1/2 -translate-y-1/2 z-0" />
              {/* Active Fill Bar */}
              <div
                className="h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 rounded-full absolute top-1/2 -translate-y-1/2 z-0 transition-all duration-700"
                style={{
                  width:
                    currentStep === 1
                      ? '15%'
                      : currentStep === 2
                      ? '50%'
                      : currentStep === 3
                      ? '85%'
                      : '100%',
                }}
              />

              {/* Progress Node Points */}
              <div className="relative z-10 flex justify-between">
                {[
                  { step: 1, label: 'Order Sent', icon: '📝' },
                  { step: 2, label: 'On The Grill', icon: '🔥' },
                  { step: 3, label: isDelivery ? 'Driver En Route' : 'Ready for Pickup', icon: isDelivery ? '🚗' : '🛍️' },
                  { step: 4, label: 'Enjoy!', icon: '✨' },
                ].map((item) => {
                  const isDone = currentStep >= item.step;
                  const isCurrent = currentStep === item.step;

                  return (
                    <div key={item.step} className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all shadow-lg ${
                          isDone
                            ? 'bg-emerald-500 text-zinc-950 scale-105'
                            : 'bg-zinc-800 text-zinc-500 border border-white/10'
                        } ${isCurrent ? 'ring-4 ring-rose-500/30 animate-pulse' : ''}`}
                      >
                        {isDone ? item.icon : item.step}
                      </div>
                      <span
                        className={`text-[10px] sm:text-xs font-bold mt-2 text-center max-w-[70px] ${
                          isDone ? 'text-white' : 'text-zinc-500'
                        }`}
                      >
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Workflow Explanation */}
        {isDelivery && (
          <div className="p-4 sm:p-5 rounded-3xl bg-zinc-900/90 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-rose-500" />
                <span>How Your Delivery Order Works</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Live Kitchen Dispatch
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                <div className="font-black text-white flex items-center gap-1">
                  <span>1. Ticket to Grill</span>
                </div>
                <div className="text-[11px] text-zinc-400 leading-relaxed">
                  Pinetown kitchen accepts your ticket & flame-grills your order fresh with your chosen baste.
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                <div className="font-black text-white flex items-center gap-1">
                  <span>2. Thermal Packing</span>
                </div>
                <div className="text-[11px] text-zinc-400 leading-relaxed">
                  Meals are packed in insulated bags and handed directly to our local delivery driver.
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1">
                <div className="font-black text-white flex items-center gap-1">
                  <span>3. Doorstep Arrival</span>
                </div>
                <div className="text-[11px] text-zinc-400 leading-relaxed">
                  Driver navigates via GPS straight to your delivery address in {order.customer.suburb}.
                </div>
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 pt-1 italic text-center">
              💡 Keep this screen open or return anytime — updates from the kitchen will appear here automatically in real time!
            </p>
          </div>
        )}

        {/* Pickup Location or Delivery Details Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/90 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>{isDelivery ? 'Delivery Destination' : 'Collection Counter Details'}</span>
            </h3>
            <span className="text-[11px] font-bold text-zinc-400">{order.store.name}</span>
          </div>

          {!isDelivery ? (
            <div className="text-xs text-zinc-300 space-y-2">
              <div>
                <div className="font-extrabold text-white text-base">Shop 1, Uniland Centre, Pinetown</div>
                <div className="text-zinc-400 mt-0.5">Behind Hollywoodbets • Durban, KZN</div>
              </div>
              <div className="text-[11px] text-emerald-400 font-bold">
                ⏰ Open Monday – Sunday: 9:00 AM – 6:00 PM
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {order.store.googleMapsUrl && (
                  <a
                    href={order.store.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-950/40"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Get Directions on Google Maps</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                )}
                <a
                  href={`tel:${order.store.phone}`}
                  className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call Store ({order.store.phone})</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-300 space-y-1.5">
              <div>
                <div className="font-extrabold text-white text-base">{order.customer.address}</div>
                <div className="text-zinc-400">{order.customer.suburb}, Durban</div>
              </div>
              {order.customer.complexOrUnit && (
                <div className="text-amber-300 font-semibold">Unit: {order.customer.complexOrUnit}</div>
              )}
              {order.customer.gateCode && (
                <div className="text-amber-300 font-semibold">🔑 Gate Code: {order.customer.gateCode}</div>
              )}
              {order.customer.notes && (
                <div className="italic text-zinc-400 pt-0.5">"{order.customer.notes}"</div>
              )}
            </div>
          )}
        </div>

        {/* Items Ordered Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/90 border border-white/10 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
            Your Meal ({order.items.length} items)
          </h3>

          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/5 flex items-start justify-between text-xs"
              >
                <div>
                  <span className="font-extrabold text-white text-sm">
                    {item.quantity}x {item.menuItem.name}
                  </span>
                  <div className="text-[11px] text-zinc-400 mt-1 space-y-0.5">
                    {item.customization?.flavour && (
                      <div className="text-rose-400 font-bold capitalize">
                        Baste: {item.customization.flavour}
                      </div>
                    )}
                    {item.customization?.side && <div>Side: {item.customization.side}</div>}
                    {item.customization?.extras?.map((e) => (
                      <div key={e.name} className="text-amber-300">+ {e.name}</div>
                    ))}
                    {item.customization?.notes && (
                      <div className="italic text-zinc-500">"{item.customization.notes}"</div>
                    )}
                  </div>
                </div>
                <span className="font-black text-amber-400 text-sm">
                  R{item.itemTotal.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs text-zinc-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-white font-bold">R{order.subtotal.toFixed(2)}</span>
            </div>
            {isDelivery && (
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="text-white font-bold">R{order.deliveryFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10">
              <span>Total Amount</span>
              <span className="text-amber-400 text-lg">R{order.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* WhatsApp Help Button */}
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Need to add something or check with the kitchen?</span>
          </div>
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shrink-0"
          >
            <span>Chat on WhatsApp</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Return Button */}
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={onBackToMenu}
            className="w-full py-3.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs tracking-wide transition-colors cursor-pointer"
          >
            Order More / Return to Menu
          </button>
        </div>

      </main>
    </div>
  );
};
