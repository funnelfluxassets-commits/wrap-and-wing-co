import { CartItem, DeliveryDetails, OrderMode, StoreLocation } from '../types';
import { ORDER_WHATSAPP_NUMBER } from '../data/stores';
import { md5 } from '../utils/md5';

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
  tableNumber?: string;
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
  const { orderId, orderMode, items, subtotal, deliveryFee, grandTotal, customer, store, paymentMethod, preferredTime, tableNumber } = payload;
  const isDelivery = orderMode === 'delivery';
  const isDineIn = orderMode === 'dine-in';
  const table = customer.tableNumber || tableNumber || '';

  let msg = `🔥 *NEW ORDER - WRAP & WINGS CO.*\n`;
  msg += `*Order Ref:* #${orderId}\n`;
  msg += `*Type:* ${isDineIn ? `🍽️ DINE-IN (TABLE ${table})` : isDelivery ? '🏍️ HOME DELIVERY' : '🛍️ STORE COLLECTION'}\n`;
  if (isDineIn && table) {
    msg += `*Seated Table:* 🪑 Table ${table}\n`;
  }
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
    const hasHash = (window.location.hash || '').toLowerCase().includes('test_payfast');

    if (testParam === '1' || testParam === 'true' || hasHash) {
      try { localStorage.setItem(PAYFAST_TEST_STORAGE_KEY, 'true'); } catch {}
      try { sessionStorage.setItem(PAYFAST_TEST_STORAGE_KEY, 'true'); } catch {}
      return true;
    }
    if (testParam === '0' || testParam === 'false') {
      try { localStorage.removeItem(PAYFAST_TEST_STORAGE_KEY); } catch {}
      try { sessionStorage.removeItem(PAYFAST_TEST_STORAGE_KEY); } catch {}
      return false;
    }

    const fromLocal = localStorage.getItem(PAYFAST_TEST_STORAGE_KEY);
    const fromSession = sessionStorage.getItem(PAYFAST_TEST_STORAGE_KEY);
    return fromLocal === 'true' || fromSession === 'true';
  } catch {
    return false;
  }
}

export function setPayFastStaffTestMode(enabled: boolean) {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      localStorage.setItem(PAYFAST_TEST_STORAGE_KEY, 'true');
      sessionStorage.setItem(PAYFAST_TEST_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(PAYFAST_TEST_STORAGE_KEY);
      sessionStorage.removeItem(PAYFAST_TEST_STORAGE_KEY);
    }
  } catch {}
}

export const PAYFAST_LIVE_MERCHANT_ID = '37558383';
export const PAYFAST_LIVE_MERCHANT_KEY = '1hbeo86df6tge';
export const PAYFAST_SANDBOX_MERCHANT_ID = '10000100';
export const PAYFAST_SANDBOX_MERCHANT_KEY = '46f0cd694581a';

// PayFast parameter priority ordering for signature generation (per official PayFast documentation)
export const PAYFAST_SIGNATURE_FIELD_ORDER = [
  'merchant_id',
  'merchant_key',
  'return_url',
  'cancel_url',
  'notify_url',
  'name_first',
  'name_last',
  'email_address',
  'cell_number',
  'm_payment_id',
  'amount',
  'item_name',
  'item_description',
  'custom_int1',
  'custom_int2',
  'custom_int3',
  'custom_int4',
  'custom_int5',
  'custom_str1',
  'custom_str2',
  'custom_str3',
  'custom_str4',
  'custom_str5',
  'email_confirmation',
  'confirmation_address',
  'payment_method',
];

export function payfastUrlEncode(val: string): string {
  return encodeURIComponent(val)
    .replace(/%20/g, '+')
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A')
    .replace(/%[0-9a-f]{2}/gi, (match) => match.toUpperCase());
}

export function generatePayFastSignature(
  fields: Record<string, string | undefined>,
  passphrase?: string
): string {
  const parts: string[] = [];
  for (const key of PAYFAST_SIGNATURE_FIELD_ORDER) {
    const rawVal = fields[key];
    if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
      parts.push(`${key}=${payfastUrlEncode(String(rawVal).trim())}`);
    }
  }
  if (passphrase && passphrase.trim() !== '') {
    parts.push(`passphrase=${payfastUrlEncode(passphrase.trim())}`);
  }
  return md5(parts.join('&'));
}

export function initiatePayFastCheckout(
  payload: CheckoutPayload,
  options?: { isSandbox?: boolean; passphrase?: string }
) {
  if (typeof window === 'undefined') return;

  const isSandbox = options?.isSandbox ?? false;
  const processUrl = isSandbox
    ? 'https://sandbox.payfast.co.za/eng/process'
    : 'https://www.payfast.co.za/eng/process';

  const merchantId = isSandbox ? PAYFAST_SANDBOX_MERCHANT_ID : PAYFAST_LIVE_MERCHANT_ID;
  const merchantKey = isSandbox ? PAYFAST_SANDBOX_MERCHANT_KEY : PAYFAST_LIVE_MERCHANT_KEY;

  const origin = (typeof window !== 'undefined' && window.location.origin && window.location.origin.startsWith('http'))
    ? window.location.origin
    : 'https://www.wrapandwings.co.za';
  const cleanId = String(payload.orderId).replace('#', '').trim();
  const returnUrl = `${origin}/?view=track&orderId=${cleanId}&payfast=success`;
  const cancelUrl = `${origin}/?view=menu&orderId=${cleanId}&payfast=cancelled`;
  const notifyUrl = origin.includes('localhost')
    ? 'https://www.wrapandwings.co.za/api/orders'
    : `${origin}/api/orders`;

  const rawName = (payload.customer.customerName || 'Wrap Wing Guest').trim();
  const parts = rawName.split(' ');
  const firstName = parts[0] || 'Guest';
  const lastName = parts.slice(1).join(' ') || 'Customer';

  // Sanitize South African mobile number: PayFast requires 10 digits (e.g. 0821234567) without spaces or plus
  let sanitizedCell: string | undefined = undefined;
  if (payload.customer.phone) {
    let digits = payload.customer.phone.replace(/\D/g, '');
    if (digits.startsWith('27') && digits.length === 11) {
      digits = '0' + digits.slice(2);
    }
    if (digits.length === 10 && digits.startsWith('0')) {
      sanitizedCell = digits;
    }
  }

  // PayFast requires an email address. Use customer phone or fallback if not entered
  const emailPhoneTag = sanitizedCell || (payload.customer.phone || '').replace(/\D/g, '') || 'orders';
  const email = `${emailPhoneTag}@wrapandwings.co.za`;

  const fields: Record<string, string | undefined> = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    name_first: firstName,
    name_last: lastName,
    email_address: email,
    cell_number: sanitizedCell,
    m_payment_id: cleanId,
    amount: payload.grandTotal.toFixed(2),
    item_name: `Wrap and Wings Order ${cleanId}`,
    item_description: `Order from Wrap and Wings Co`,
  };

  // Generate MD5 signature required by PayFast
  const signature = generatePayFastSignature(fields, options?.passphrase);
  fields.signature = signature;

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = processUrl;
  form.style.display = 'none';

  // Append parameters strictly in documented PayFast field sequence
  for (const key of PAYFAST_SIGNATURE_FIELD_ORDER) {
    const val = fields[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = String(val);
      form.appendChild(input);
    }
  }

  // Append calculated signature hidden field last
  if (fields.signature) {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'signature';
    input.value = fields.signature;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

