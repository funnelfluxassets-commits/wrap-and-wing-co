import React from 'react';
import { CheckoutPayload, generateGoogleMapsUrl, generateWazeUrl } from '../services/payment';
import { LiveOrder } from '../types';
import { X, Navigation, Phone, MessageSquare, MapPin, CheckCircle, Share2, AlertCircle } from 'lucide-react';

interface DriverTicketModalProps {
  order: CheckoutPayload | LiveOrder | null;
  onClose: () => void;
}

export const DriverTicketModal: React.FC<DriverTicketModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const isDelivery = order.orderMode === 'delivery';
  const googleMapsUrl = generateGoogleMapsUrl(order.customer.address, order.customer.suburb);
  const wazeUrl = generateWazeUrl(order.customer.address, order.customer.suburb);
  const cleanPhone = order.customer.phone.replace(/[^0-9]/g, '');
  const customerPhoneInternational = cleanPhone.startsWith('0') ? `27${cleanPhone.slice(1)}` : cleanPhone;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-lg max-h-[92vh] rounded-3xl bg-[#141419] border border-white/10 shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-6 h-6 shrink-0" />
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-200">
                ORDER CONFIRMED & DISPATCHED
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Order #{order.orderId}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Driver Navigation Quick Actions (If Delivery) */}
          {isDelivery && (
            <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4" />
                  <span>Delivery Driver Live Navigation</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  1-TAP ROUTING
                </span>
              </div>

              {/* Destination Address Card */}
              <div className="text-xs text-zinc-200 space-y-0.5 pt-1">
                <div className="font-extrabold text-white text-sm">{order.customer.address}</div>
                <div className="text-zinc-200">{order.customer.suburb}, Durban, South Africa</div>
                {order.customer.complexOrUnit && (
                  <div className="text-amber-300 font-semibold">Unit: {order.customer.complexOrUnit}</div>
                )}
                {order.customer.gateCode && (
                  <div className="text-amber-300 font-semibold">🔑 Gate Code: {order.customer.gateCode}</div>
                )}
                {order.customer.notes && (
                  <div className="italic text-zinc-200 pt-1">"{order.customer.notes}"</div>
                )}
              </div>

              {/* Turn-by-Turn GPS Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-900/40 transition-transform hover:scale-105"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Google Maps</span>
                </a>

                <a
                  href={wazeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/40 transition-transform hover:scale-105"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Waze GPS</span>
                </a>
              </div>

              {/* Driver Direct Contact Customer */}
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
                  <span>WhatsApp Customer</span>
                </a>
              </div>

              {/* WhatsApp Driver Dispatch Share */}
              <div className="pt-1">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `🏍️ *WRAP & WINGS CO - DRIVER DISPATCH TICKET #${order.orderId}*\n\n` +
                    `📍 *Destination:* ${order.customer.address}, ${order.customer.suburb}\n` +
                    (order.customer.complexOrUnit ? `🏢 Unit: ${order.customer.complexOrUnit}\n` : '') +
                    (order.customer.gateCode ? `🔑 Gate Code: ${order.customer.gateCode}\n` : '') +
                    (order.customer.notes ? `📝 Note: "${order.customer.notes}"\n` : '') +
                    `👤 *Customer:* ${order.customer.customerName} (${order.customer.phone})\n\n` +
                    `🗺️ *Google Maps GPS:* ${googleMapsUrl}\n` +
                    `🗺️ *Waze Navigation:* ${wazeUrl}\n\n` +
                    (order.tip ? `🛵 *Driver Tip Included:* R${order.tip.toFixed(2)}\n` : '') +
                    `💰 *Collection Amount:* R${(typeof order.grandTotal === 'number' ? order.grandTotal : 0).toFixed(2)} (${order.paymentStatus === 'paid' ? 'PAID ONLINE' : 'COLLECT ON HANDOVER'})`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/40 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Send Ticket to Driver via WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* Kitchen Packaging Checklist */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200">
              Kitchen &amp; Bag Checklist ({order.items.length} items)
            </h3>
            <div className="space-y-1.5">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-zinc-900/90 border border-white/10 flex items-start justify-between text-xs"
                >
                  <div className="flex-1 pr-2">
                    <span className="font-extrabold text-white">
                      {item.quantity}x {item.menuItem.name}
                    </span>
                    <div className="text-[11px] text-zinc-200 mt-0.5 space-y-0.5">
                      {item.customization?.flavour && (
                        <div className="text-rose-400 font-semibold capitalize">
                          Flavour: {item.customization.flavour}
                        </div>
                      )}
                      {item.customization?.side && (
                        <div className="text-amber-200/90 font-medium">🍟 Side: {item.customization.side}</div>
                      )}
                      {Array.isArray(item.customization?.extras) && item.customization.extras.length > 0 && (
                        <div className="space-y-0.5 pt-0.5">
                          {item.customization.extras.map((extra, eIdx) => (
                            <div key={eIdx} className="text-amber-300 font-extrabold flex items-center gap-1 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/25">
                              <span className="text-amber-400 font-black">+</span>
                              <span>{extra.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {item.customization?.notes && (
                        <div className="text-[10px] text-yellow-200/90 italic bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                          Note: "{item.customization.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-amber-400 shrink-0">R{item.itemTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Total */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-between text-xs font-bold text-zinc-300">
            <span>Payment Status:</span>
            <span className="text-emerald-400 font-extrabold uppercase">
              {order.paymentMethod === 'payfast'
                ? 'Paid via PayFast'
                : order.paymentMethod === 'yoco'
                ? 'Paid via Yoco'
                : order.paymentMethod === 'cod'
                ? 'Cash/Speedpoint on Delivery'
                : 'WhatsApp Direct'}
            </span>
          </div>

        </div>

        {/* Footer Action */}
        <div className="p-4 bg-zinc-950 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs tracking-wide shadow-md transition-colors cursor-pointer"
          >
            Done & Return to Menu
          </button>
        </div>

      </div>
    </div>
  );
};
