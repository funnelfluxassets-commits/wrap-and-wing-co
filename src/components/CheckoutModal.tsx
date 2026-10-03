import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { DeliveryDetails, PaymentGatewayType } from '../types';
import { openWhatsAppOrder, CheckoutPayload } from '../services/payment';
import { X, CheckCircle, ShieldCheck, MapPin, Phone, CreditCard, Send, Navigation, ArrowRight } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (payload: CheckoutPayload) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { items, orderMode, subtotal, deliveryFee, grandTotal, selectedStore, clearCart } = useCart();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [suburb, setSuburb] = useState('Pinetown');
  const [complexOrUnit, setComplexOrUnit] = useState('');
  const [gateCode, setGateCode] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentGatewayType>('payfast');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !phone) {
      alert('Please provide your name and contact phone number.');
      return;
    }
    if (orderMode === 'delivery' && !address) {
      alert('Please enter your delivery street address.');
      return;
    }

    setIsProcessing(true);

    const orderId = `WW-${Math.floor(1000 + Math.random() * 9000)}`;

    const deliveryDetails: DeliveryDetails = {
      customerName,
      phone,
      address,
      suburb,
      complexOrUnit: complexOrUnit.trim() || undefined,
      gateCode: gateCode.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const payload: CheckoutPayload = {
      orderId,
      orderMode,
      items: [...items],
      subtotal,
      deliveryFee,
      grandTotal,
      customer: deliveryDetails,
      store: selectedStore,
      paymentMethod,
    };

    // Simulate payment gateway handshake or dispatch
    setTimeout(() => {
      setIsProcessing(false);
      clearCart();
      onOrderSuccess(payload);

      // If WhatsApp or cash chosen, open WhatsApp confirmation automatically
      if (paymentMethod === 'whatsapp' || paymentMethod === 'cod') {
        openWhatsAppOrder(payload);
      }
      onClose();
    }, 1200);
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
            <h2 className="text-lg sm:text-xl font-black text-white">
              {orderMode === 'delivery' ? '🚗 Delivery Checkout' : '🛍️ Collection Checkout'}
            </h2>
            <p className="text-xs text-zinc-400">
              {selectedStore.name} • {selectedStore.mall}
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

        {/* Form Body */}
        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          {/* Customer Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <span>1. Contact Details</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">Mobile / WhatsApp Number *</label>
                <input
                  type="tel"
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
                <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>2. Delivery Address</span>
                </h3>
                <span className="text-[10px] text-zinc-400">Connected to Driver GPS</span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 14 Josiah Gumede Road"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Suburb / Area</label>
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
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Complex / Unit (Optional)</label>
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
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Gate Code / Access</label>
                  <input
                    type="text"
                    value={gateCode}
                    onChange={(e) => setGateCode(e.target.value)}
                    placeholder="e.g. #1234 or Ring 4"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-zinc-400 block mb-1">Driver Instructions</label>
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

          {/* Payment Method Selector */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-rose-500" />
              <span>{orderMode === 'delivery' ? '3. Payment Method' : '2. Payment Method'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* PayFast */}
              <button
                type="button"
                onClick={() => setPaymentMethod('payfast')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  paymentMethod === 'payfast'
                    ? 'bg-rose-500/15 border-rose-500 ring-1 ring-rose-500 text-white'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-zinc-300'
                }`}
              >
                <div>
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <span>PayFast</span>
                    <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded">POPULAR</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">Instant EFT, Capitec Pay, Cards</div>
                </div>
                <div className={`w-4 h-4 rounded-full border ${paymentMethod === 'payfast' ? 'border-rose-500 bg-rose-500' : 'border-zinc-600'}`} />
              </button>

              {/* Yoco */}
              <button
                type="button"
                onClick={() => setPaymentMethod('yoco')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  paymentMethod === 'yoco'
                    ? 'bg-rose-500/15 border-rose-500 ring-1 ring-rose-500 text-white'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-zinc-300'
                }`}
              >
                <div>
                  <div className="text-xs font-black">Yoco Checkout</div>
                  <div className="text-[10px] text-zinc-400">Credit / Debit Card & Apple Pay</div>
                </div>
                <div className={`w-4 h-4 rounded-full border ${paymentMethod === 'yoco' ? 'border-rose-500 bg-rose-500' : 'border-zinc-600'}`} />
              </button>

              {/* WhatsApp Direct */}
              <button
                type="button"
                onClick={() => setPaymentMethod('whatsapp')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  paymentMethod === 'whatsapp'
                    ? 'bg-rose-500/15 border-rose-500 ring-1 ring-rose-500 text-white'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-zinc-300'
                }`}
              >
                <div>
                  <div className="text-xs font-black text-emerald-400">WhatsApp Order</div>
                  <div className="text-[10px] text-zinc-400">Confirm order directly with kitchen</div>
                </div>
                <div className={`w-4 h-4 rounded-full border ${paymentMethod === 'whatsapp' ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-600'}`} />
              </button>

              {/* Cash / Speedpoint on Delivery */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  paymentMethod === 'cod'
                    ? 'bg-rose-500/15 border-rose-500 ring-1 ring-rose-500 text-white'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-zinc-300'
                }`}
              >
                <div>
                  <div className="text-xs font-black">Pay On Handover</div>
                  <div className="text-[10px] text-zinc-400">Cash or Speedpoint card machine</div>
                </div>
                <div className={`w-4 h-4 rounded-full border ${paymentMethod === 'cod' ? 'border-rose-500 bg-rose-500' : 'border-zinc-600'}`} />
              </button>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="p-3 rounded-xl bg-zinc-900/90 border border-white/5 flex items-center gap-2.5 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Encrypted 256-bit checkout • Food freshly prepared upon confirmation</span>
          </div>

          {/* Total & Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm tracking-wide shadow-xl shadow-rose-950/40 hover:scale-[1.01] transition-all flex items-center justify-between cursor-pointer disabled:opacity-50"
            >
              <span>{isProcessing ? 'CONFIRMING ORDER...' : 'CONFIRM & PLACE ORDER'}</span>
              <span>R{grandTotal.toFixed(2)}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
