import React, { useState } from 'react';
import { CheckoutPayload, generateGoogleMapsUrl, generateWazeUrl, getWhatsAppOrderUrl } from '../services/payment';
import {
  X,
  Navigation,
  Phone,
  MessageSquare,
  MapPin,
  CheckCircle,
  Clock,
  ShoppingBag,
  ExternalLink,
  Flame,
  Copy,
  Check,
  AlertCircle,
  Truck
} from 'lucide-react';
import { ChickenWingIcon } from './icons/ChickenWingIcon';
import { DeliveryMotorbikeIcon } from './icons/DeliveryMotorbikeIcon';

interface OrderConfirmationModalProps {
  order: CheckoutPayload | null;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({ order, onClose }) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'driver'>('customer');
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const isDelivery = order.orderMode === 'delivery';
  const whatsAppUrl = getWhatsAppOrderUrl(order);
  const googleMapsUrl = generateGoogleMapsUrl(order.customer.address, order.customer.suburb);
  const wazeUrl = generateWazeUrl(order.customer.address, order.customer.suburb);

  const cleanPhone = order.customer.phone.replace(/[^0-9]/g, '');
  const customerPhoneInternational = cleanPhone.startsWith('0') ? `27${cleanPhone.slice(1)}` : cleanPhone;

  const handleCopyOrder = () => {
    const summary = `Wrap & Wings Co. Order #${order.orderId}\nType: ${
      isDelivery ? 'Delivery' : 'Store Collection'
    }\nTotal: R${order.grandTotal.toFixed(2)}`;
    navigator.clipboard?.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-xl max-h-[92vh] rounded-3xl bg-[#141419] border border-white/10 shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-black/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                {isDelivery ? (
                  <>
                    <DeliveryMotorbikeIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>DELIVERY ORDER PLACED</span>
                  </>
                ) : (
                  <span>🛍️ COLLECTION ORDER PLACED</span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Order #{order.orderId}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs (Customer vs Driver Dispatch) */}
        <div className="p-2 bg-zinc-950 border-b border-white/10 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('customer')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'customer'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Customer Receipt & Tracker</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('driver')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'driver'
                ? 'bg-zinc-800 text-emerald-400 shadow-md ring-1 ring-emerald-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Driver GPS & Kitchen Ticket</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {activeTab === 'customer' ? (
            <>
              {/* WhatsApp Direct Action Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-zinc-900 border border-emerald-500/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
                    <MessageSquare className="w-4 h-4" />
                    <span>Instant Kitchen Confirmation</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                    WhatsApp Connected
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Your order has been formatted for our kitchen phone (<span className="text-white font-bold">+27 83 276 3273</span>).
                  Tap below to open WhatsApp and send your ticket to begin flame-grilling right away!
                </p>
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]"
                >
                  <MessageSquare className="w-4 h-4 fill-zinc-950" />
                  <span>OPEN WHATSAPP & CONFIRM WITH KITCHEN</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Live Order Timeline Tracker */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Live Order Tracker</span>
                  </h3>
                  <span className="text-[11px] font-bold text-amber-400">
                    {order.preferredTime || (isDelivery ? 'ETA: 35–45 mins' : 'ETA: 15–20 mins')}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
                    <div className="w-7 h-7 mx-auto rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center text-xs font-black mb-1">
                      ✓
                    </div>
                    <div className="text-[11px] font-black text-emerald-300">Order Sent</div>
                    <div className="text-[9px] text-zinc-400">Received at shop</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30">
                    <div className="w-7 h-7 mx-auto rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center text-xs font-black mb-1 animate-pulse">
                      🔥
                    </div>
                    <div className="text-[11px] font-black text-amber-300">On The Grill</div>
                    <div className="text-[9px] text-zinc-400">Fresh basting</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-white/5">
                    <div className="w-7 h-7 mx-auto rounded-full bg-zinc-700 text-zinc-400 flex items-center justify-center text-xs font-black mb-1">
                      {isDelivery ? (
                        <DeliveryMotorbikeIcon className="w-4 h-4 text-amber-300" />
                      ) : (
                        <span>🛍️</span>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-zinc-300">
                      {isDelivery ? 'Driver En Route' : 'Ready for Pickup'}
                    </div>
                    <div className="text-[9px] text-zinc-500">
                      {isDelivery ? 'To your door' : 'At Pinetown counter'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pickup / Delivery Information */}
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{isDelivery ? 'Delivery Destination' : 'Store Collection Point'}</span>
                  </span>
                  <span className="text-[10px] text-zinc-400">Ref: #{order.orderId}</span>
                </div>

                {!isDelivery ? (
                  <div className="text-xs text-zinc-300 space-y-1">
                    <div className="text-sm font-extrabold text-white">{order.store.name}</div>
                    <div className="text-zinc-400">{order.store.address} • {order.store.landmark}</div>
                    <div className="text-[11px] text-emerald-400 font-bold">{order.store.hours}</div>
                    <div className="pt-2 flex gap-2">
                      {order.store.googleMapsUrl && (
                        <a
                          href={order.store.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10"
                        >
                          <Navigation className="w-3.5 h-3.5 text-blue-400" />
                          <span>Get Directions</span>
                        </a>
                      )}
                      <a
                        href={`tel:${order.store.phone}`}
                        className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Call Shop</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-300 space-y-1">
                    <div className="text-sm font-extrabold text-white">{order.customer.address}</div>
                    <div className="text-zinc-400">{order.customer.suburb}, Durban</div>
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

              {/* Order Items Summary */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">
                    Your Feast ({order.items.length} items)
                  </h3>
                  <button
                    type="button"
                    onClick={handleCopyOrder}
                    className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-900/80 border border-white/10 flex items-start justify-between text-xs"
                    >
                      <div>
                        <span className="font-extrabold text-white">
                          {item.quantity}x {item.menuItem.name}
                        </span>
                        <div className="text-[11px] text-zinc-400 mt-0.5 space-y-0.5">
                          {item.customization?.flavour && (
                            <div className="text-rose-400 font-semibold capitalize">
                              Baste: {item.customization.flavour}
                            </div>
                          )}
                          {item.customization?.side && (
                            <div>Side: {item.customization.side}</div>
                          )}
                          {item.customization?.extras?.map((e) => (
                            <div key={e.name} className="text-amber-300/90">+ {e.name}</div>
                          ))}
                          {item.customization?.notes && (
                            <div className="italic text-zinc-500">"{item.customization.notes}"</div>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-amber-400">R{item.itemTotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Totals Card */}
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/10 space-y-1.5 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="text-white font-bold">R{order.subtotal.toFixed(2)}</span>
                </div>
                {isDelivery && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Local Delivery Fee</span>
                    <span className="text-white font-bold">R{order.deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {isDelivery && typeof order.tip === 'number' && order.tip > 0 && (
                  <div className="flex justify-between text-amber-300 font-bold">
                    <span>Driver Tip</span>
                    <span>+R{order.tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm sm:text-base font-black text-white pt-2 border-t border-white/10">
                  <span>Total Paid / Due</span>
                  <span className="text-amber-400 text-lg">R{order.grandTotal.toFixed(2)}</span>
                </div>
                <div className="pt-1 text-[11px] text-emerald-400 font-bold flex items-center justify-between">
                  <span>Payment Method:</span>
                  <span className="uppercase font-black">
                    {order.paymentMethod === 'payfast'
                      ? 'PayFast (EFT / Card)'
                      : order.paymentMethod === 'yoco'
                      ? 'Yoco Checkout'
                      : order.paymentMethod === 'cod'
                      ? 'Pay on Handover (Cash / Card)'
                      : 'WhatsApp Direct'}
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* Staff & Delivery Driver View */
            <div className="space-y-4">
              {isDelivery ? (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Truck className="w-4 h-4" />
                      <span>Delivery Driver Navigation</span>
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                      1-TAP GPS
                    </span>
                  </div>

                  <div className="text-xs text-zinc-300 space-y-0.5 pt-1">
                    <div className="font-extrabold text-white text-sm">{order.customer.address}</div>
                    <div className="text-zinc-400">{order.customer.suburb}, Durban, South Africa</div>
                    {order.customer.complexOrUnit && (
                      <div className="text-amber-300 font-semibold">Unit: {order.customer.complexOrUnit}</div>
                    )}
                    {order.customer.gateCode && (
                      <div className="text-amber-300 font-semibold">🔑 Gate Code: {order.customer.gateCode}</div>
                    )}
                    {order.customer.notes && (
                      <div className="italic text-zinc-400 pt-1">"{order.customer.notes}"</div>
                    )}
                  </div>

                  {/* GPS Routing Buttons */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform hover:scale-105"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Google Maps</span>
                    </a>

                    <a
                      href={wazeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-transform hover:scale-105"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Waze GPS</span>
                    </a>
                  </div>

                  {/* Call Customer Direct */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={`tel:${order.customer.phone}`}
                      className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10"
                    >
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>Call Customer</span>
                    </a>

                    <a
                      href={`https://wa.me/${customerPhoneInternational}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10"
                    >
                      <MessageSquare className="w-3 h-3 text-emerald-400" />
                      <span>Customer WhatsApp</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Store Pickup Counter Ticket</span>
                  </span>
                  <div className="text-xs text-zinc-300">
                    <div>Customer: <strong className="text-white">{order.customer.customerName}</strong></div>
                    <div>Phone: <strong className="text-white">{order.customer.phone}</strong></div>
                    <div>Collection Store: <strong className="text-white">{order.store.name}</strong></div>
                  </div>
                </div>
              )}

              {/* Kitchen Checklist */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                  Kitchen Bag & Order Checklist
                </h3>
                <div className="space-y-1.5">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-zinc-900/90 border border-white/10 flex items-start justify-between text-xs"
                    >
                      <div>
                        <span className="font-extrabold text-white">
                          {item.quantity}x {item.menuItem.name}
                        </span>
                        <div className="text-[11px] text-zinc-200 mt-0.5">
                          {item.customization?.flavour && (
                            <span className="text-rose-400 font-semibold mr-2 capitalize">
                              Baste: {item.customization.flavour}
                            </span>
                          )}
                          {item.customization?.side && <span>Side: {item.customization.side}</span>}
                        </div>
                      </div>
                      <span className="font-bold text-amber-400">R{item.itemTotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs tracking-wide shadow-md transition-colors cursor-pointer"
          >
            Done & Return to Menu
          </button>
        </div>
      </div>
    </div>
  );
};
