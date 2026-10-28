import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { DeliveryDetails, PaymentGatewayType } from '../types';
import {
  openWhatsAppOrder,
  CheckoutPayload,
  isPayFastStaffTestMode,
  setPayFastStaffTestMode,
  initiatePayFastCheckout,
} from '../services/payment';
import { createLiveOrder, playCustomerUpdateChime, generateNextOrderId } from '../services/orderService';
import { isItemOutOfStock } from '../services/stockService';
import { logCheckoutStart, logOrderCompleted } from '../services/analyticsService';
import { getStoreOperatingStatus, useStoreOperatingStatus, getDeliveryOperatingStatus, useDeliveryOperatingStatus } from '../services/storeHours';
import { getDeliveryFeeForSuburb } from '../services/driverService';
import { X, CheckCircle, ShieldCheck, MapPin, Phone, CreditCard, Send, Navigation, ArrowRight, Clock, MessageSquare, ShoppingBag, AlertCircle, Utensils } from 'lucide-react';
import { DeliveryMotorbikeIcon } from './icons/DeliveryMotorbikeIcon';

interface SavedCustomerProfile {
  customerName?: string;
  phone?: string;
  address?: string;
  suburb?: string;
  complexOrUnit?: string;
  gateCode?: string;
  notes?: string;
}

const SAVED_PROFILE_KEY = 'wrap_wing_saved_customer_profile';

function loadSavedProfile(): SavedCustomerProfile {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SAVED_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveCustomerProfile(profile: SavedCustomerProfile) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVED_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (payload: CheckoutPayload) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { items, orderMode, setOrderMode, subtotal, tip, setTip, selectedStore, clearCart, tableNumber, setTableNumber } = useCart();

  const savedProfile = loadSavedProfile();
  const [hasAutofilled, setHasAutofilled] = useState(() => Boolean(savedProfile.customerName || savedProfile.phone));
  const [customerName, setCustomerName] = useState(() => savedProfile.customerName || '');
  const [phone, setPhone] = useState(() => savedProfile.phone || '');
  const [address, setAddress] = useState(() => savedProfile.address || '');
  const [suburb, setSuburb] = useState(() => savedProfile.suburb || 'Pinetown');
  const [complexOrUnit, setComplexOrUnit] = useState(() => savedProfile.complexOrUnit || '');
  const [gateCode, setGateCode] = useState(() => savedProfile.gateCode || '');
  const [notes, setNotes] = useState(() => savedProfile.notes || '');
  const [preferredTime, setPreferredTime] = useState('ASAP');
  const [paymentMethod, setPaymentMethod] = useState<PaymentGatewayType>('payfast');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStaffTest, setIsStaffTest] = useState(() => isPayFastStaffTestMode());
  const storeStatus = useStoreOperatingStatus();
  const deliveryStatus = useDeliveryOperatingStatus();

  // Dynamic delivery fee calculation based on delivery distance tier for the selected suburb
  const calculatedDeliveryFee = orderMode === 'delivery' ? getDeliveryFeeForSuburb(suburb) : 0;
  const calculatedGrandTotal = subtotal + calculatedDeliveryFee + (orderMode === 'delivery' ? tip : 0);

  useEffect(() => {
    if (isOpen) {
      setIsStaffTest(isPayFastStaffTestMode());
      try {
        logCheckoutStart();
      } catch {}
    }
  }, [isOpen]);

  const handleClearSavedDetails = () => {
    try {
      localStorage.removeItem(SAVED_PROFILE_KEY);
    } catch {}
    setCustomerName('');
    setPhone('');
    setAddress('');
    setSuburb('Pinetown');
    setComplexOrUnit('');
    setGateCode('');
    setNotes('');
    setHasAutofilled(false);
  };

  const firstName = (savedProfile.customerName || customerName || '').trim().split(' ')[0];

  if (!isOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enforce restaurant operating hours (Mon-Sat 9am-6pm, Sun closed)
    const currentStatus = getStoreOperatingStatus();
    if (!currentStatus.isOpen && !isStaffTest) {
      alert(
        `Wrap & Wings Co is currently closed for online orders.\n\n${currentStatus.bannerMessage}\n\nTrading Hours:\nMonday – Saturday: 9:00 AM – 6:00 PM\nSunday: Closed`
      );
      setIsProcessing(false);
      return;
    }

    // Enforce delivery operating cutoff at 17:00 (5:00 PM)
    if (orderMode === 'delivery') {
      const delStatus = getDeliveryOperatingStatus();
      if (!delStatus.isOpen && !isStaffTest) {
        alert(
          `Doorstep Delivery has closed for today.\n\n${delStatus.message}\n\nCollection and Dine-In orders remain open until 6:00 PM! Please switch your order to Collection to proceed.`
        );
        setIsProcessing(false);
        return;
      }

      if (!address.trim()) {
        alert('Please enter your delivery street address.');
        setIsProcessing(false);
        return;
      }
    }

    if (!customerName || !phone) {
      alert('Please provide your name and contact phone number.');
      setIsProcessing(false);
      return;
    }

    if (orderMode === 'dine-in' && !tableNumber) {
      alert('Please select your table number (6, 48, 7, 3, or 47) where you are seated.');
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);

    // Save customer details to localStorage for instant autofill on future orders
    saveCustomerProfile({
      customerName,
      phone,
      address,
      suburb,
      complexOrUnit: complexOrUnit.trim() || undefined,
      gateCode: gateCode.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    const activeOrderMode: OrderMode = orderMode;
    const orderId = generateNextOrderId(activeOrderMode);

    const customerDetails: DeliveryDetails = {
      customerName,
      phone,
      address: activeOrderMode === 'delivery' ? address : '',
      suburb: activeOrderMode === 'delivery' ? suburb : '',
      complexOrUnit: activeOrderMode === 'delivery' ? (complexOrUnit.trim() || undefined) : undefined,
      gateCode: activeOrderMode === 'delivery' ? (gateCode.trim() || undefined) : undefined,
      notes: notes.trim() || undefined,
      preferredTime: preferredTime === 'ASAP'
        ? (activeOrderMode === 'delivery' ? 'ASAP (35–45 mins)' : (activeOrderMode === 'dine-in' ? 'ASAP (To Table)' : 'ASAP (15–20 mins)'))
        : preferredTime,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      tableNumber: activeOrderMode === 'dine-in' ? tableNumber : undefined,
    };

    const payload: CheckoutPayload = {
      orderId,
      orderMode: activeOrderMode,
      items: [...items],
      subtotal,
      deliveryFee: calculatedDeliveryFee,
      tip: activeOrderMode === 'delivery' ? tip : 0,
      grandTotal: calculatedGrandTotal,
      customer: customerDetails,
      store: selectedStore,
      paymentMethod,
      preferredTime: customerDetails.preferredTime,
      createdAt: customerDetails.createdAt || 'Just now',
      tableNumber: activeOrderMode === 'dine-in' ? tableNumber : undefined,
    };

    // If customer selected PayFast, store pending order in browser memory and forward to PayFast.
    // The order will ONLY be dispatched to the kitchen once payment approval is confirmed!
    if (paymentMethod === 'payfast') {
      try {
        localStorage.setItem('wrap_wing_pending_payfast_order', JSON.stringify(payload));
        sessionStorage.setItem('wrap_wing_pending_payfast_order', JSON.stringify(payload));
      } catch {}
      setIsProcessing(false);
      clearCart();
      onClose();
      initiatePayFastCheckout(payload, { isSandbox: isStaffTest });
      return;
    }

    // For Pay on Handover (Cash/Speedpoint), dispatch immediately to kitchen
    await createLiveOrder(payload);
    try {
      logOrderCompleted(
        items.map((i) => ({
          name: i.menuItem.name,
          quantity: i.quantity,
          flavour: i.customization?.flavour,
          extras: i.customization?.extras,
        }))
      );
    } catch {}

    // If customer chose WhatsApp confirmation, open WhatsApp
    if (paymentMethod === 'whatsapp') {
      openWhatsAppOrder(payload);
    }

    setTimeout(() => {
      setIsProcessing(false);
      clearCart();
      onOrderSuccess(payload);
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-xl max-h-[92vh] rounded-3xl bg-[#141419] border border-white/10 shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-zinc-950">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              {orderMode === 'dine-in' ? (
                <>
                  <Utensils className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>Dine-In Table Checkout</span>
                </>
              ) : orderMode === 'delivery' ? (
                <>
                  <DeliveryMotorbikeIcon className="w-5 h-5 text-yellow-400 shrink-0" />
                  <span>Delivery Checkout</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>Collection Checkout</span>
                </>
              )}
            </h2>
            <p className="text-xs text-zinc-300">
              {orderMode === 'dine-in'
                ? (tableNumber ? `Seated at Table ${tableNumber} • Delivered to table` : 'Select your seated table number below')
                : 'Wrap & Wings Co • Pinetown Flagship'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operating Hours Alert inside Checkout Modal */}
        {!storeStatus.isOpen && !isStaffTest && (
          <div className="p-4 mx-4 sm:mx-6 mt-4 rounded-2xl bg-gradient-to-br from-amber-950/60 via-zinc-900 to-zinc-950 border border-amber-500/40 text-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-black text-amber-200 text-sm">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{storeStatus.bannerTitle}</span>
            </div>
            <p className="text-zinc-300 leading-relaxed text-xs">
              {storeStatus.bannerMessage}
            </p>
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-amber-400 font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span>Operating Hours:</span>
              <span className="text-white">Monday – Saturday: 9:00 AM – 6:00 PM (Sunday: Closed)</span>
            </div>
          </div>
        )}

        {/* Delivery Cutoff (Closed at 17:00 daily) Alert */}
        {orderMode === 'delivery' && storeStatus.isOpen && !deliveryStatus.isOpen && !isStaffTest && (
          <div className="p-4 mx-4 sm:mx-6 mt-4 rounded-2xl bg-gradient-to-br from-rose-950/70 via-zinc-900 to-zinc-950 border border-rose-500/50 text-rose-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-black text-rose-200 text-sm">
              <Clock className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Doorstep Delivery Closed for Today (5:00 PM Cutoff)</span>
            </div>
            <p className="text-zinc-200 leading-relaxed text-xs">
              Doorstep Delivery closes at 5:00 PM daily. However, our flame kitchen is still open for Collection and Dine-In until 6:00 PM!
            </p>
            <button
              type="button"
              onClick={() => setOrderMode('collection')}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Switch to Collection (Ready in 15–20 mins)</span>
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Seated Table Selection (If dine-in mode) */}
          {orderMode === 'dine-in' && (
            <div className="space-y-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-amber-400" />
                  <span>Seated Table Number *</span>
                </h3>
                <span className="text-[11px] font-black text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md">
                  {tableNumber ? `Table ${tableNumber} Selected` : 'Tap Table Below'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300">
                Tap your table number below so our staff will bring your meal piping hot directly to your table:
              </p>
              <div className="grid grid-cols-5 gap-2 pt-1">
                {(['6', '48', '7', '3', '47'] as const).map((tbl) => (
                  <button
                    key={tbl}
                    type="button"
                    onClick={() => setTableNumber(tbl)}
                    className={`py-2.5 rounded-xl border text-center transition-all cursor-pointer font-black ${
                      tableNumber === tbl
                        ? 'bg-rose-600 border-rose-500 text-white shadow-lg ring-2 ring-rose-400/50 scale-[1.03]'
                        : 'bg-zinc-900 border-white/10 text-zinc-300 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <div className="text-[9px] text-zinc-400 uppercase tracking-tight">Table</div>
                    <div className="text-base sm:text-lg font-black leading-none mt-0.5">{tbl}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Saved Profile Autofill Notice */}
          {hasAutofilled && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <span className="truncate flex items-center gap-1.5 font-medium">
                <span>👋</span>
                <span>Welcome back{firstName ? `, ${firstName}` : ''}! Your details have been auto-filled.</span>
              </span>
              <button
                type="button"
                onClick={handleClearSavedDetails}
                className="text-[11px] font-bold text-zinc-400 hover:text-amber-200 underline cursor-pointer ml-3 shrink-0"
              >
                Clear
              </button>
            </div>
          )}

          {/* Customer Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>{orderMode === 'dine-in' ? '1. Customer Details' : '1. Contact Details'}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-200 block mb-1">Your Full Name *</label>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-200 block mb-1">Mobile / WhatsApp Number *</label>
                <input
                  type="tel"
                  name="tel"
                  autoComplete="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 082 123 4567"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address (If delivery mode) */}
          {orderMode === 'delivery' && (
            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>2. Delivery Address</span>
                </h3>
                <span className="text-[11px] text-zinc-200">Connected to Driver GPS</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-200 block mb-1">Street Address *</label>
                <input
                  type="text"
                  name="address"
                  autoComplete="street-address"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 14 Josiah Gumede Road"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-200 block mb-1">Suburb / Area</label>
                  <select
                    value={suburb}
                    onChange={(e) => setSuburb(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Pinetown">Pinetown Central</option>
                    <option value="New Germany">New Germany</option>
                    <option value="Westville">Westville</option>
                    <option value="Sarnia">Sarnia</option>
                    <option value="Cowies Hill">Cowies Hill</option>
                    <option value="Hatton Estate">Hatton Estate</option>
                    <option value="Kloof">Kloof</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-200 block mb-1">Complex / Unit (Optional)</label>
                  <input
                    type="text"
                    value={complexOrUnit}
                    onChange={(e) => setComplexOrUnit(e.target.value)}
                    placeholder="e.g. Unit 4, Sunset Oaks"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-200 block mb-1">Gate Code / Access</label>
                  <input
                    type="text"
                    value={gateCode}
                    onChange={(e) => setGateCode(e.target.value)}
                    placeholder="e.g. #1234 or Ring 4"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-200 block mb-1">Driver Instructions</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Please leave at reception"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Order Timing / Pickup Schedule */}
          <div className="space-y-2 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Preparation Timing</span>
              </label>
              <span className="text-[10px] text-amber-400 font-bold">
                {orderMode === 'collection' ? '⚡ Ready in ~15–20 mins' : '⚡ Delivery in ~35–45 mins'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'ASAP', desc: orderMode === 'collection' ? '15–20 mins' : '35–45 mins' },
                { label: 'In 45 Mins', desc: 'Pre-order' },
                { label: 'In 1.5 Hours', desc: 'Later Today' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setPreferredTime(opt.label)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    preferredTime === opt.label
                      ? 'bg-rose-500/20 border-rose-500 text-white ring-1 ring-rose-500'
                      : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-black">{opt.label}</div>
                  <div className="text-[10px] text-zinc-500">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Kitchen WhatsApp Live Dispatch Banner */}
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-zinc-300">
            <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Orders are dispatched straight to our test kitchen WhatsApp (<strong className="text-emerald-300">+27 83 276 3273</strong>) for instant confirmation.
            </span>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>Payment Method</span>
              </h3>
              {isStaffTest && (
                <button
                  type="button"
                  onClick={() => {
                    setPayFastStaffTestMode(false);
                    setIsStaffTest(false);
                    if (paymentMethod === 'payfast') setPaymentMethod('cod');
                  }}
                  className="text-[10px] text-amber-400 hover:text-white underline font-semibold cursor-pointer"
                >
                  Exit Test Mode
                </button>
              )}
            </div>

            {isStaffTest && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 animate-fadeIn">
                <div className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Staff Test Mode: PayFast Sandbox Active (Zero real money charged)</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* PayFast Online Payment Gateway (Default on Left) */}
              <button
                type="button"
                onClick={() => setPaymentMethod('payfast')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                  paymentMethod === 'payfast'
                    ? 'bg-rose-500/15 border-rose-500 ring-1 ring-rose-500 text-white'
                    : 'border-white/10 bg-zinc-900/60 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                }`}
              >
                <div>
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <span className={paymentMethod === 'payfast' ? 'text-white' : 'text-zinc-200'}>PayFast Online</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-extrabold uppercase">
                      ACTIVE
                    </span>
                    {isStaffTest && (
                      <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded font-extrabold uppercase">
                        SANDBOX
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-300">Instant EFT, Capitec Pay, Debit & Credit Cards</div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    paymentMethod === 'payfast'
                      ? 'border-rose-500 bg-rose-500'
                      : 'border-zinc-700 bg-zinc-900'
                  }`}
                >
                  {paymentMethod === 'payfast' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>

              {/* Pay On Handover (On Right) */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                  paymentMethod === 'cod'
                    ? 'bg-rose-500/15 border-rose-500 ring-1 ring-rose-500 text-white'
                    : 'border-white/10 bg-zinc-900/60 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                }`}
              >
                <div>
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <span className={paymentMethod === 'cod' ? 'text-white' : 'text-zinc-200'}>Pay On Handover</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-extrabold uppercase">ACTIVE</span>
                  </div>
                  <div className="text-[11px] text-zinc-300">Cash or Speedpoint card machine</div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-rose-500 bg-rose-500'
                      : 'border-zinc-700 bg-zinc-900'
                  }`}
                >
                  {paymentMethod === 'cod' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </button>
            </div>

            {paymentMethod === 'payfast' && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-bold text-amber-300">Bank-Grade Encrypted Payment</div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    When you click <strong>Confirm & Place Order</strong> below, you will be securely redirected to PayFast to enter your Card details (with bank OTP) or complete Instant EFT / Capitec Pay safely.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary & Tip Breakdown */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2 text-xs text-zinc-300">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="text-white font-bold">R{subtotal.toFixed(2)}</span>
            </div>
            {orderMode === 'delivery' && (
              <>
                <div className="flex justify-between">
                  <span>Delivery Fee ({suburb})</span>
                  <span className="text-white font-bold">R{calculatedDeliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-t border-white/5 my-0.5">
                  <span className="text-zinc-200 font-semibold">Add Driver Tip:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTip(tip === 5 ? 0 : 5)}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        tip === 5
                          ? 'bg-amber-400 text-zinc-950 shadow-md ring-1 ring-amber-300'
                          : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-white/10'
                      }`}
                      title={tip === 5 ? 'Click to remove tip' : 'Add R5 tip'}
                    >
                      R5
                    </button>
                    <button
                      type="button"
                      onClick={() => setTip(tip === 10 ? 0 : 10)}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                        tip === 10
                          ? 'bg-amber-400 text-zinc-950 shadow-md ring-1 ring-amber-300'
                          : 'bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 border border-white/10'
                      }`}
                      title={tip === 10 ? 'Click to remove tip' : 'Add R10 tip'}
                    >
                      R10
                    </button>
                  </div>
                </div>
                {tip > 0 && (
                  <div className="flex justify-between text-xs text-amber-300 font-bold">
                    <span>Driver Tip</span>
                    <span>+R{tip.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/10">
              <span>Total Bill</span>
              <span className="text-amber-400 text-base">R{calculatedGrandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/5 flex items-center gap-2.5 text-xs text-zinc-200">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Encrypted 256-bit checkout • Food freshly prepared upon confirmation</span>
          </div>

          {/* Total & Submit Button */}
          <div className="pt-2">
            {(() => {
              const hasOutOfStockItem = items.some((i) => isItemOutOfStock(i.menuItem.id));

              if (!storeStatus.isOpen && !isStaffTest) {
                return (
                  <div className="space-y-2">
                    <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-black text-amber-200">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{storeStatus.bannerTitle}</span>
                      </div>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">
                        {storeStatus.bannerMessage}
                      </p>
                      <div className="text-[10px] text-amber-400 font-bold pt-0.5">
                        ⏰ Trading Hours: Mon–Sat 9:00 AM – 6:00 PM (Sunday: Closed)
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="w-full py-3.5 px-4 rounded-xl bg-zinc-800 text-amber-300 font-black text-xs uppercase tracking-wide border border-amber-500/30 cursor-not-allowed select-none flex items-center justify-center gap-2 shadow-none"
                    >
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{storeStatus.buttonText}</span>
                    </button>
                  </div>
                );
              }

              if (hasOutOfStockItem) {
                return (
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>One or more items in your order are now sold out. Please return to your basket to remove them.</span>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="w-full py-3.5 px-4 rounded-xl bg-zinc-800 text-zinc-500 font-black text-xs uppercase tracking-wide border border-white/10 cursor-not-allowed select-none"
                    >
                      REMOVE SOLD OUT ITEMS TO PROCEED
                    </button>
                  </div>
                );
              }

              return (
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm tracking-wide shadow-xl shadow-rose-950/40 hover:scale-[1.01] transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
                >
                  <span>{isProcessing ? 'CONFIRMING ORDER...' : 'CONFIRM & PLACE ORDER'}</span>
                  <span>R{grandTotal.toFixed(2)}</span>
                </button>
              );
            })()}
          </div>
        </form>
      </div>
    </div>
  );
};
