import { CartItem, DeliveryDetails, OrderMode, StoreLocation } from '../types';
import { ORDER_WHATSAPP_NUMBER } from '../data/stores';

export interface CheckoutPayload {
  orderId: string;
  orderMode: OrderMode;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tip?: number;
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
    if (payload.tip && payload.tip > 0) {
      msg += `*Driver Tip:* R${payload.tip.toFixed(2)}\n`;
    }
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

// ── PayFast Gateway & Staff Test Mode ────────────────────────────────────────
export const PAYFAST_TEST_STORAGE_KEY = 'wrap_wing_payfast_test';

export function isPayFastStaffTestMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    const testParam = params.get('test_payfast');
    if (testParam === '1' || testParam === 'true') {
      sessionStorage.setItem(PAYFAST_TEST_STORAGE_KEY, 'true');
      return true;
    }
    if (testParam === '0' || testParam === 'false') {
      sessionStorage.removeItem(PAYFAST_TEST_STORAGE_KEY);
      return false;
    }
    return sessionStorage.getItem(PAYFAST_TEST_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setPayFastStaffTestMode(enabled: boolean) {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      sessionStorage.setItem(PAYFAST_TEST_STORAGE_KEY, 'true');
    } else {
      sessionStorage.removeItem(PAYFAST_TEST_STORAGE_KEY);
    }
  } catch {}
}

export function initiatePayFastCheckout(payload: CheckoutPayload, options?: { isSandbox?: boolean }) {
  if (typeof window === 'undefined') return;

  const isSandbox = options?.isSandbox ?? true;
  const processUrl = isSandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

  // PayFast official sandbox merchant credentials (or production if isSandbox is false)
  const merchantId = isSandbox ? '10000100' : '37558383';
  const merchantKey = isSandbox ? '46f0cd694581a' : '1hbeo86df6tge';

  const origin = window.location.origin;
  const cleanId = String(payload.orderId).replace('#', '').trim();
  const returnUrl = `${origin}/?view=track&orderId=${encodeURIComponent(cleanId)}&payfast=success`;
  const cancelUrl = `${origin}/?view=menu&orderId=${encodeURIComponent(cleanId)}&payfast=cancelled`;

  const rawName = (payload.customer.customerName || 'Wrap Wing Guest').trim();
  const parts = rawName.split(' ');
  const firstName = parts[0] || 'Guest';
  const lastName = parts.slice(1).join(' ') || 'Customer';

  // PayFast requires an email address. Use customer phone or store fallback if not entered
  const cleanPhone = (payload.customer.phone || '').replace(/\D/g, '');
  const email = `${cleanPhone || 'orders'}@wrapandwings.co.za`;

  const fields: Record<string, string> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: `${origin}/api/orders`,
    name_first: firstName,
    name_last: lastName,
    email_address: email,
    cell_number: payload.customer.phone || '0820000000',
    m_payment_id: cleanId,
    amount: payload.grandTotal.toFixed(2),
    item_name: `Wrap & Wings Co Order #${cleanId}`,
    item_description: `${payload.items.length} item(s) from ${payload.store.name}`,
  };

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = processUrl;
  form.style.display = 'none';

  Object.entries(fields).forEach(([key, val]) => {
    if (val) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = val;
      form.appendChild(input);
    }
  });

  document.body.appendChild(form);
  form.submit();
}

