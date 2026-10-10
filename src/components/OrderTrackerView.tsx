import React, { useState, useEffect, useRef } from 'react';
import { LiveOrder, OrderStatus } from '../types';
import {
  subscribeToSingleOrder,
  getCurrentOrderId,
  clearCurrentOrder,
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
  PartyPopper,
  FileText,
  Store,
  Smile
} from 'lucide-react';
import { DeliveryMotorbikeIcon } from './icons/DeliveryMotorbikeIcon';
import { LiveDriverMap } from './LiveDriverMap';

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
  const lastStatusRef = useRef<OrderStatus | null>(null);

  const effectiveOrderId = orderId || getCurrentOrderId() || '';
  const isDelivery = order ? order.orderMode === 'delivery' : true;

  // Auto-dismiss/redirect once delivery or collection is completed
  useEffect(() => {
    if (order?.status === 'completed') {
      const redirectTimer = setTimeout(() => {
        clearCurrentOrder();
        onBackToMenu();
      }, 7000);
      return () => clearTimeout(redirectTimer);
    }
  }, [order?.status, onBackToMenu]);

  const triggerStatusAlert = (status: OrderStatus, currentOrder?: LiveOrder | null) => {
    try {
      playCustomerUpdateChime();
      triggerHapticFeedback();
      const isDeliv = (currentOrder?.orderMode || order?.orderMode || 'delivery') === 'delivery';

      if (status === 'cooking') {
        setToastMessage('🔥 Kitchen Update: Order accepted! Your chicken is now sizzling on the flame grill!');
      } else if (status === 'ready') {
        setToastMessage(
          isDeliv
            ? '📦 Kitchen Update: Food ready & packed in thermal bag! Assigned to your driver.'
            : '🛍️ Kitchen Update: Fresh off the grill & packed! Ready for collection at counter.'
        );
      } else if (status === 'dispatched') {
        setToastMessage('🏍️ Driver Update: Hot meal handed to delivery driver! Live Driver GPS Map activated.');
      } else if (status === 'completed') {
        setToastMessage('😊 Order Complete: Thank you for ordering with Wrap & Wings Co. Enjoy!');
      }
    } catch (err) {
      console.warn('Status alert error:', err);
    }
  };

  useEffect(() => {
    if (!effectiveOrderId) return;
    const cleanTarget = effectiveOrderId.replace('#', '').trim();

    const unsubscribe = subscribeToSingleOrder(effectiveOrderId, (liveOrder) => {
      if (liveOrder) {
        if (lastStatusRef.current && liveOrder.status !== lastStatusRef.current) {
          triggerStatusAlert(liveOrder.status, liveOrder);
        }
        lastStatusRef.current = liveOrder.status;
        setOrder(liveOrder);
      }
    });

    const handleCustomStatusEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const detailClean = detail?.orderId ? String(detail.orderId).replace('#', '').trim() : '';
      if (detail && (detail.orderId === effectiveOrderId || detailClean === cleanTarget)) {
        const next = (detail.newStatus || detail.status) as OrderStatus;
        if (next) {
          if (next !== lastStatusRef.current) {
            triggerStatusAlert(next, detail.order || order);
            lastStatusRef.current = next;
          }
          if (detail.order) {
            setOrder(detail.order);
          } else {
            const fresh = getOrderById(effectiveOrderId);
            if (fresh) {
              setOrder(fresh);
            } else {
              setOrder((prev) => (prev ? { ...prev, status: next } : null));
            }
          }
        }
      }
    };
    window.addEventListener('wrap_wing_order_status_updated', handleCustomStatusEvent);

    // Active 1.2-second tracker radar to check for kitchen status progression
    const trackerRadar = setInterval(async () => {
      const freshOrders = await syncOrdersFromCloud();
      const current = freshOrders.find(
        (o) => o.orderId === effectiveOrderId || o.orderId?.replace('#', '').trim() === cleanTarget
      );
      if (current) {
        if (lastStatusRef.current && current.status !== lastStatusRef.current) {
          triggerStatusAlert(current.status, current);
        }
        lastStatusRef.current = current.status;
        setOrder(current);
      }
    }, 1200);

    return () => {
      unsubscribe();
      window.removeEventListener('wrap_wing_order_status_updated', handleCustomStatusEvent);
      clearInterval(trackerRadar);
    };
  }, [effectiveOrderId]);

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

  const customer = order.customer || {
    customerName: 'Customer',
    phone: '',
    address: '',
    suburb: 'Pinetown',
    complexOrUnit: '',
    gateCode: '',
    notes: '',
  };
  const store = order.store || {
    name: 'Shop 1, Uniland Centre, Pinetown',
    phone: '083 490 8593',
    address: 'Shop 1, Uniland Centre, Pinetown',
    googleMapsUrl: 'https://maps.google.com/?q=Shop+1+Uniland+Centre+Pinetown',
  };
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = typeof order.subtotal === 'number' ? order.subtotal : 0;
  const deliveryFee = typeof order.deliveryFee === 'number' ? order.deliveryFee : 0;
  const grandTotal = typeof order.grandTotal === 'number' ? order.grandTotal : 0;
  const preferredTime = order.preferredTime || 'ASAP';
  const createdAt = order.createdAt || 'Just now';
  const whatsAppUrl = getWhatsAppOrderUrl(order);

  // Status step calculations (5-Step for Delivery, 4-Step for Collection)
  const steps = isDelivery
    ? [
        {
          step: 1,
          label: order.status === 'received' ? 'Order Received' : 'Order Accepted',
          icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" />,
          activeColor: 'bg-gradient-to-tr from-yellow-300 via-yellow-400 to-amber-400 text-zinc-950 shadow-yellow-400/40',
        },
        {
          step: 2,
          label: 'On The Grill',
          icon: <Flame className="w-4 h-4 sm:w-5 sm:h-5" />,
          activeColor: 'bg-gradient-to-tr from-yellow-300 via-yellow-400 to-amber-400 text-zinc-950 shadow-yellow-400/40',
        },
        {
          step: 3,
          label: 'Food Ready',
          icon: <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />,
          activeColor: 'bg-gradient-to-tr from-yellow-300 via-yellow-400 to-amber-400 text-zinc-950 shadow-yellow-400/40',
        },
        {
          step: 4,
          label: 'Out for Delivery',
          icon: <DeliveryMotorbikeIcon className="w-4 h-4 sm:w-5 sm:h-5" />,
          activeColor: 'bg-gradient-to-tr from-yellow-300 via-yellow-400 to-amber-400 text-zinc-950 shadow-yellow-400/40',
        },
        {
          step: 5,
          label: 'Enjoy!',
          icon: <Smile className="w-4 h-4 sm:w-5 sm:h-5" />,
          activeColor: 'bg-gradient-to-tr from-yellow-300 via-yellow-400 to-amber-400 text-zinc-950 shadow-yellow-400/40',
        },
      ]
    : [
        {
          step: 1,
          label: order.status === 'received' ? 'Order Received' : 'Order Accepted',
          icon: <FileText className="w-4 h-4 sm:w-5 sm:h-5" />,
          activeColor: 'bg-gradient-to-tr from-yellow-300 via-yellow-400 to-amber-400 text-zinc-950 shadow-yellow-400/40',
        },
        {
          step: 2,
          label: 'On The Grill',
          icon: <Flame className="w-4 h-4 sm:w-5 sm:h-5" />,
          activeColor: 'bg-gradient-to-tr from-yellow-300 via-yellow-400 to-amber-400 text-zinc-950 shadow-yellow-400/40',
        },
        {
          step: 3,
          label: 'Ready at Counter',
          icon: <Store className="w-4 h-4 sm:w-5 sm:h-5" />,
          activeColor: 'bg-gradient-to-tr from-yellow-300 via-yellow-400 to-amber-400 text-zinc-950 shadow-yellow-400/40',
        },
        {
          step: 4,
          label: 'Enjoy!',
          icon: <Smile className="w-4 h-4 sm:w-5 sm:h-5" />,
          activeColor: 'bg-gradient-to-tr from-yellow-300 via-yellow-400 to-amber-400 text-zinc-950 shadow-yellow-400/40',
        },
      ];

  const getStepProgress = (status: OrderStatus) => {
    if (isDelivery) {
      switch (status) {
        case 'received':
          return 1;
        case 'cooking':
          return 2;
        case 'ready':
          return 3;
        case 'dispatched':
          return 4;
        case 'completed':
          return 5;
        default:
          return 1;
      }
    } else {
      switch (status) {
        case 'received':
          return 1;
        case 'cooking':
          return 2;
        case 'ready':
          return 3;
        case 'completed':
          return 4;
        default:
          return 1;
      }
    }
  };

  const targetStep = getStepProgress(order.status);
  const [displayStep, setDisplayStep] = useState<number>(() => targetStep);

  // Progressive Step Animation: When status advances quickly, animate each step smoothly so both steps don't jump simultaneously
  useEffect(() => {
    if (targetStep > displayStep) {
      const stepTimer = setTimeout(() => {
        setDisplayStep((prev) => Math.min(prev + 1, targetStep));
        playCustomerUpdateChime();
      }, 550);
      return () => clearTimeout(stepTimer);
    } else if (targetStep < displayStep) {
      setDisplayStep(targetStep);
    }
  }, [targetStep, displayStep]);

  const getProgressWidth = () => {
    if (isDelivery) {
      switch (displayStep) {
        case 1:
          return '10%';
        case 2:
          return '32%';
        case 3:
          return '55%';
        case 4:
          return '78%';
        case 5:
          return '100%';
        default:
          return '10%';
      }
    } else {
      switch (displayStep) {
        case 1:
          return '15%';
        case 2:
          return '50%';
        case 3:
          return '85%';
        case 4:
          return '100%';
        default:
          return '15%';
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d12] text-zinc-100 flex flex-col font-sans pb-16">
      
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#14141a]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (order.status === 'completed') {
              clearCurrentOrder();
            }
            onBackToMenu();
          }}
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

        <div className="w-14" />
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
              ? 'bg-gradient-to-br from-amber-950/50 via-zinc-900 to-zinc-950 border-amber-500/40'
              : order.status === 'cooking'
              ? 'bg-gradient-to-br from-rose-950/60 via-zinc-900 to-zinc-950 border-rose-500/40'
              : order.status === 'ready'
              ? 'bg-gradient-to-br from-teal-950/60 via-zinc-900 to-zinc-950 border-teal-500/40'
              : order.status === 'dispatched'
              ? 'bg-gradient-to-br from-emerald-950/70 via-zinc-900 to-zinc-950 border-emerald-500/50'
              : order.status === 'completed'
              ? 'bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-zinc-950 border-emerald-500/50'
              : 'bg-zinc-900 border-white/10'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider bg-black/40 border border-white/10 text-white mb-2 whitespace-nowrap overflow-hidden">
                <span className="flex items-center gap-1 shrink-0">
                  {isDelivery ? (
                    <>
                      <DeliveryMotorbikeIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>HOME DELIVERY</span>
                    </>
                  ) : (
                    <span>🛍️ STORE COLLECTION</span>
                  )}
                </span>
                <span className="text-zinc-500 shrink-0">•</span>
                {order.status === 'received' && (
                  <span className="text-amber-400 font-bold flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block shrink-0" />
                    <span>Awaiting Kitchen</span>
                  </span>
                )}
                {order.status === 'cooking' && (
                  <span className="text-orange-400 font-bold shrink-0">🔥 On Flame Grill</span>
                )}
                {order.status === 'ready' && (
                  <span className="text-teal-400 font-bold shrink-0">📦 Food Ready</span>
                )}
                {order.status === 'dispatched' && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                    <DeliveryMotorbikeIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Out For Delivery</span>
                  </span>
                )}
                {order.status === 'completed' && (
                  <span className="text-emerald-300 font-bold flex items-center gap-1.5 shrink-0">
                    <Smile className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span>Delivered &amp; Complete</span>
                  </span>
                )}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {order.status === 'received' && 'Order Received by Kitchen ⏳'}
                {order.status === 'cooking' && 'Order Accepted & On Grill! 🔥'}
                {order.status === 'ready' &&
                  (isDelivery ? 'Food Ready & Packed! 📦' : 'Hot & Ready For Pickup! 🛍️')}
                {order.status === 'dispatched' && (
                  <span className="inline-flex items-center gap-2">
                    <span>Driver Is On The Way!</span>
                    <DeliveryMotorbikeIcon className="w-6 h-6 sm:w-7 sm:h-7 inline text-amber-400 shrink-0" />
                  </span>
                )}
                {order.status === 'completed' && (
                  <span className="inline-flex items-center gap-2">
                    <span>Order Completed!</span>
                    <Smile className="w-6 h-6 sm:w-7 sm:h-7 inline text-amber-400 shrink-0" />
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 mt-1 max-w-md leading-relaxed">
                {order.status === 'received' &&
                  'Your order has been transmitted to the Pinetown kitchen. Standing by for staff to accept your ticket and begin grilling.'}
                {order.status === 'cooking' &&
                  'The kitchen has accepted your ticket! Your chicken and meals are sizzling on the flame grill with your selected baste flavour.'}
                {order.status === 'ready' &&
                  (isDelivery
                    ? 'Your meal is freshly cooked and packed in thermal insulation! Waiting for driver departure.'
                    : 'Your meal is fresh off the grill and packed! Please proceed to the collection counter at Shop 1, Uniland Centre.')}
                {order.status === 'dispatched' &&
                  'Our delivery driver has your hot meal and is heading directly to your address.'}
                {order.status === 'completed' &&
                  'Thank you for ordering with Wrap & Wings Co.! We hope you enjoy your meal.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-black/50 border border-white/10 text-center shrink-0">
              <div className="text-[11px] font-black uppercase text-zinc-200">Target Time</div>
              <div className="text-lg sm:text-xl font-black text-amber-400 mt-0.5">
                {preferredTime}
              </div>
              <div className="text-[11px] text-zinc-300 mt-0.5">Placed: {createdAt}</div>
            </div>
          </div>

          {/* Animated Multi-Step Progress Bar */}
          <div className="pt-8">
            <div className="relative">
              {/* Background Connecting Bar - centered vertically through icon boxes */}
              <div className="h-1.5 sm:h-2 bg-zinc-800 rounded-full w-full absolute top-[18px] sm:top-[22px] -translate-y-1/2 z-0" />
              {/* Active Fill Bar - centered vertically through icon boxes */}
              <div
                className="h-1.5 sm:h-2 bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-400 rounded-full absolute top-[18px] sm:top-[22px] -translate-y-1/2 z-0 transition-all duration-700"
                style={{ width: getProgressWidth() }}
              />

              {/* Progress Node Points */}
              <div className="relative z-10 flex justify-between">
                {steps.map((item) => {
                  const isDone = displayStep >= item.step;
                  const isCurrent = displayStep === item.step;

                  return (
                    <div key={item.step} className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all shadow-lg ${
                          isDone
                            ? `${item.activeColor} scale-105`
                            : 'bg-zinc-850 text-zinc-500 border border-white/10'
                        } ${isCurrent ? 'ring-4 ring-yellow-400/50 animate-pulse' : ''}`}
                      >
                        {item.icon}
                      </div>
                      <span
                        className={`text-[9px] sm:text-xs font-bold mt-2 text-center max-w-[70px] ${
                          isDone ? 'text-white font-extrabold' : 'text-zinc-500'
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

        {/* Order Completed Celebration & Auto-Dismissal Notice */}
        {order.status === 'completed' && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-zinc-900 border-2 border-emerald-500/60 shadow-2xl space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-inner shadow-emerald-500/20">
              <Smile className="w-9 h-9 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Order Completed &amp; Delivered!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-200/90 mt-1.5 max-w-md mx-auto">
                Thank you for choosing Wrap &amp; Wings Co. Your active tracking session is complete. Hope you enjoy your meal!
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  clearCurrentOrder();
                  onBackToMenu();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition-all transform hover:scale-105 shadow-xl cursor-pointer"
              >
                Done &amp; Return to Menu
              </button>
            </div>
          </div>
        )}

        {/* Live Interactive Driver GPS Map & Telemetry - ONLY SHOWN WHEN OUT FOR DELIVERY OR COMPLETED */}
        {isDelivery && (order.status === 'dispatched' || order.status === 'completed') && (
          <LiveDriverMap order={order} />
        )}

        {/* Kitchen Preparation Progress Stage Card (Shown while order is being prepped, grilled, or packed before dispatch) */}
        {isDelivery && (order.status === 'received' || order.status === 'cooking' || order.status === 'ready') && (
          <div className="p-4 sm:p-6 rounded-3xl bg-zinc-900/90 border border-white/10 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-rose-500/20 border border-amber-500/30 flex items-center justify-center text-lg sm:text-xl shrink-0">
                  {order.status === 'received' && '📋'}
                  {order.status === 'cooking' && '🔥'}
                  {order.status === 'ready' && '📦'}
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-amber-400 whitespace-nowrap truncate">
                    Kitchen Preparation in Progress
                  </div>
                  <h3 className="text-xs sm:text-base font-black text-white whitespace-nowrap truncate">
                    {order.status === 'received' && 'Step 1 of 4: Ticket Sent — Awaiting Kitchen Acceptance'}
                    {order.status === 'cooking' && 'Step 2 of 4: Order Accepted — Sizzling on Flame Grill'}
                    {order.status === 'ready' && 'Step 3 of 4: Food Ready & Thermal Packed'}
                  </h3>
                </div>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-zinc-800 text-zinc-300 border border-white/5 shrink-0 whitespace-nowrap">
                Wrap &amp; Wings Co
              </span>
            </div>

            {/* Preparation Details */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-white font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span>
                  {order.status === 'received' && 'Ticket received at kitchen. Standing by for staff to accept ticket.'}
                  {order.status === 'cooking' && 'Order accepted! Chicken is basted and grilling hot over open flame.'}
                  {order.status === 'ready' && 'Order packed in thermal insulation, assigned to delivery driver.'}
                </span>
              </div>
              <p className="text-zinc-200 text-[12px] leading-relaxed">
                {order.status === 'ready'
                  ? 'Your driver is collecting the sealed hot bag right now. As soon as the driver departs from the kitchen, the Live Driver GPS Tracker map will automatically activate on this screen!'
                  : 'Live Driver GPS Tracking will unlock automatically as soon as your meal finishes cooking, is packed, and our driver departs for your address.'}
              </p>
            </div>

            {/* Delivery Destination */}
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-semibold text-white">
                  Delivery to: {customer.address ? `${customer.address}, ${customer.suburb || 'Pinetown'}` : (customer.suburb || 'Pinetown')}
                </span>
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md self-start sm:self-auto">
                Est. Delivery: {preferredTime}
              </span>
            </div>
          </div>
        )}

        {/* Pickup Location or Delivery Details Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/90 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>{isDelivery ? 'Delivery Destination' : 'Collection Counter Details'}</span>
            </h3>
            <span className="text-[11px] font-bold text-zinc-200">Wrap &amp; Wings Co</span>
          </div>

          {!isDelivery ? (
            <div className="text-xs text-zinc-200 space-y-2">
              <div>
                <div className="font-extrabold text-white text-base">Shop 1, Uniland Centre, Pinetown</div>
                <div className="text-zinc-200 mt-0.5">Behind Hollywoodbets • Durban, KZN</div>
              </div>
              <div className="text-[11px] text-emerald-400 font-bold">
                ⏰ Open Monday – Sunday: 9:00 AM – 6:00 PM
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {store.googleMapsUrl && (
                  <a
                    href={store.googleMapsUrl}
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
                  href={`tel:${store.phone}`}
                  className="py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Call Store ({store.phone})</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-xs text-zinc-200 space-y-1.5">
              <div>
                <div className="font-extrabold text-white text-base">{customer.address || 'Address on file'}</div>
                <div className="text-zinc-200">{customer.suburb || 'Pinetown'}, Durban</div>
              </div>
              {customer.complexOrUnit && (
                <div className="text-amber-300 font-semibold">Unit: {customer.complexOrUnit}</div>
              )}
              {customer.gateCode && (
                <div className="text-amber-300 font-semibold">🔑 Gate Code: {customer.gateCode}</div>
              )}
              {customer.notes && (
                <div className="italic text-zinc-200 pt-0.5">"{customer.notes}"</div>
              )}
            </div>
          )}
        </div>

        {/* Items Ordered Card */}
        <div className="p-5 sm:p-6 rounded-3xl bg-zinc-900/90 border border-white/10 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200">
            Your Meal ({items.length} items)
          </h3>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-zinc-950/80 border border-white/5 flex items-start justify-between text-xs"
              >
                <div>
                  <span className="font-extrabold text-white text-sm">
                    {item.quantity || 1}x {item.menuItem?.name || 'Meal'}
                  </span>
                  <div className="text-[11px] text-zinc-200 mt-1 space-y-0.5">
                    {item.customization?.flavour && (
                      <div className="text-rose-400 font-bold capitalize">
                        Baste: {item.customization.flavour}
                      </div>
                    )}
                    {item.customization?.side && <div>Side: {item.customization.side}</div>}
                    {Array.isArray(item.customization?.extras) &&
                      item.customization.extras.map((e) => (
                        <div key={e.name} className="text-amber-300">+ {e.name}</div>
                      ))}
                    {item.customization?.notes && (
                      <div className="italic text-zinc-300">"{item.customization.notes}"</div>
                    )}
                  </div>
                </div>
                <span className="font-black text-amber-400 text-sm">
                  R{(typeof item.itemTotal === 'number' ? item.itemTotal : 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs text-zinc-200">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-white font-bold">R{subtotal.toFixed(2)}</span>
            </div>
            {isDelivery && (
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="text-white font-bold">R{deliveryFee.toFixed(2)}</span>
              </div>
            )}
            {isDelivery && typeof order.tip === 'number' && order.tip > 0 && (
              <div className="flex justify-between text-amber-300 font-bold">
                <span>Driver Tip</span>
                <span>+R{order.tip.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-white pt-2 border-t border-white/10">
              <span>Total Amount</span>
              <span className="text-amber-400 text-lg">R{grandTotal.toFixed(2)}</span>
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
            onClick={() => {
              if (order.status === 'completed') {
                clearCurrentOrder();
              }
              onBackToMenu();
            }}
            className={`w-full py-3.5 rounded-2xl font-bold text-xs tracking-wide transition-colors cursor-pointer ${
              order.status === 'completed'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-950/50 font-black'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            {order.status === 'completed' ? 'Order Finished — Back to Menu' : 'Order More / Return to Menu'}
          </button>
        </div>

      </main>
    </div>
  );
};
