import { CartItem, DeliveryDetails, OrderMode, StoreLocation } from '../types';
import { ORDER_WHATSAPP_NUMBER } from '../data/stores';

export interface CheckoutPayload {
  orderId: string;
  orderMode: OrderMode;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  customer: DeliveryDetails;
  store: StoreLocation;
  paymentMethod: 'payfast' | 'yoco' | 'whatsapp' | 'cod';
  preferredTime?: string;
  createdAt: string;
}

// ── Google Maps & Waze Deep-link Generators ──────────────────────────────────
export function formatFullDeliveryAddress(address: string, suburb: string): string {
  const cleanAddr = (address || '').trim();
  const cleanSub = (suburb || '').trim();
  const parts: string[] = [cleanAddr];
  if (cleanSub && !cleanAddr.toLowerCase().includes(cleanSub.toLowerCase())) {
    parts.push(cleanSub);
  }
  if (!cleanAddr.toLowerCase().includes('durban') && !cleanSub.toLowerCase().includes('durban')) {
    parts.push('Durban');
  }
  if (!cleanAddr.toLowerCase().includes('south africa')) {
    parts.push('South Africa');
  }
  return parts.filter(Boolean).join(', ');
}

export function generateGoogleMapsUrl(address: string, suburb: string): string {
  const fullAddress = formatFullDeliveryAddress(address, suburb);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`;
}

export function generateWazeUrl(address: string, suburb: string): string {
  const fullAddress = formatFullDeliveryAddress(address, suburb);
  return `https://waze.com/ul?q=${encodeURIComponent(fullAddress)}&navigate=yes`;
}

// ── WhatsApp Order Message Formatter ─────────────────────────────────────────
export function buildWhatsAppOrderMessage(payload: CheckoutPayload): string {
  const { orderId, orderMode, items, subtotal, deliveryFee, grandTotal, customer, store, paymentMethod, preferredTime } = payload;
  const isDelivery = orderMode === 'delivery';

  let msg = `🔥 *NEW ORDER - WRAP & WINGS CO.*\n`;
  msg += `*Order Ref:* #${orderId}\n`;
  msg += `*Type:* ${isDelivery ? '🏍️ HOME DELIVERY' : '🛍️ STORE COLLECTION'}\n`;
  msg += `*Store:* ${store.name} (${store.mall})\n`;
  if (preferredTime) {
    msg += `*Requested Time:* ⏰ ${preferredTime}\n`;
  }
  msg += `─────────────────────────\n`;
  msg += `*CUSTOMER DETAILS:*\n`;
  msg += `👤 *Name:* ${customer.customerName}\n`;
  msg += `📞 *Phone:* ${customer.phone}\n`;

  if (isDelivery) {
    msg += `📍 *Address:* ${customer.address}\n`;
    msg += `🏙️ *Suburb:* ${customer.suburb}\n`;
    if (customer.complexOrUnit) msg += `🏢 *Unit/Complex:* ${customer.complexOrUnit}\n`;
    if (customer.gateCode) msg += `🔑 *Gate Code:* ${customer.gateCode}\n`;
    if (customer.notes) msg += `📝 *Notes:* ${customer.notes}\n`;
    msg += `\n🏍️ *DRIVER GPS LINK:* \n${generateGoogleMapsUrl(customer.address, customer.suburb)}\n`;
  }

  msg += `─────────────────────────\n`;
  msg += `*ITEMS ORDERED:*\n`;
  items.forEach((item, idx) => {
    msg += `${idx + 1}. *${item.quantity}x ${item.menuItem.name}* (R${item.itemTotal.toFixed(2)})\n`;
    if (item.customization?.flavour) {
      msg += `   • Flavour: *${item.customization.flavour.toUpperCase()}*\n`;
    }
    if (item.customization?.side) {
      msg += `   • Side: *${item.customization.side}*\n`;
    }
    if (item.customization?.extras && item.customization.extras.length > 0) {
      msg += `   • Extras: ${item.customization.extras.map((e) => e.name).join(', ')}\n`;
    }
    if (item.customization?.notes) {
      msg += `   • Notes: _${item.customization.notes}_\n`;
    }
  });

  msg += `─────────────────────────\n`;
  msg += `*Subtotal:* R${subtotal.toFixed(2)}\n`;
  if (isDelivery) {
    msg += `*Delivery Fee:* R${deliveryFee.toFixed(2)}\n`;
  }
  msg += `*TOTAL DUE:* *R${grandTotal.toFixed(2)}*\n`;
  msg += `*Payment:* ${
    paymentMethod === 'payfast'
      ? '✅ Paid via PayFast (Instant EFT / Card)'
      : paymentMethod === 'yoco'
      ? '✅ Paid via Yoco (Card / Apple Pay)'
      : paymentMethod === 'cod'
      ? '💵 Pay on Handover (Cash / Speedpoint)'
      : '💬 Direct WhatsApp Confirmation'
  }\n`;
  msg += `─────────────────────────\n`;
  msg += `_Thank you for ordering with Wrap & Wings Co.!_`;

  return msg;
}

export function getWhatsAppOrderUrl(payload: CheckoutPayload): string {
  const text = buildWhatsAppOrderMessage(payload);
  const targetNumber = payload.store.whatsapp || ORDER_WHATSAPP_NUMBER;
  return `https://wa.me/${targetNumber}?text=${encodeURIComponent(text)}`;
}

export function openWhatsAppOrder(payload: CheckoutPayload) {
  const url = getWhatsAppOrderUrl(payload);
  window.open(url, '_blank');
}
