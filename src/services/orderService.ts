import { LiveOrder, OrderStatus, OrderTimelineEvent } from '../types';
import { CheckoutPayload } from './payment';
import { STORES } from '../data/stores';
import {
  isFirebaseConfigured,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  deleteOrderFromFirestore,
  subscribeToFirestoreOrders,
  subscribeToSingleFirestoreOrder,
  fetchOrdersFromFirestore,
  fetchSingleOrderFromFirestore,
  normalizeOrderId,
} from './firebase';

const STORAGE_KEY = 'wrap_wing_live_orders';
const CURRENT_ORDER_KEY = 'wrap_wing_current_order_id';
const CHANNEL_NAME = 'wrap_wing_orders_channel';
const CLOUD_TOPIC = 'wrap_and_wing_live_orders_shop1';
const NTFY_BASE_URL = 'https://ntfy.sh';

export const STATUS_RANK: Record<OrderStatus, number> = {
  received: 1,
  cooking: 2,
  ready: 3,
  dispatched: 4,
  completed: 5,
  cancelled: 6,
};

// Shared Web Audio Context across the application to prevent browser context exhaustion and guarantee instant playback
let sharedAudioContext: AudioContext | null = null;

export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
      sharedAudioContext = new AudioContextClass();
    }
    if (sharedAudioContext.state === 'suspended') {
      sharedAudioContext.resume().catch(() => {});
    }
    return sharedAudioContext;
  } catch (err) {
    console.warn('Could not initialize AudioContext:', err);
    return null;
  }
}

// User-gesture unlocker for tablets/browsers (iOS Safari, Android Chrome)
export function unlockAudio() {
  const ctx = getSharedAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

let lastKitchenChimePlayedAt = 0;

// Web Audio API MR D Style High-Visibility Chime for Kitchen Display
// Ascending 5-tone bright chime with harmonic layering to cut through kitchen noise & music
export function playKitchenChime() {
  try {
    const nowEpoch = Date.now();
    if (nowEpoch - lastKitchenChimePlayedAt < 1200) {
      return; // Prevent overlapping audio when events fire close together
    }
    lastKitchenChimePlayedAt = nowEpoch;

    const ctx = getSharedAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Upbeat 5-note ascending arpeggio (G5 -> C6 -> E6 -> G6 -> C7)
    // Layered with sine (warm bell fundamental) + triangle (bright mallet overtone)
    const notes = [
      { freq: 783.99, delay: 0.0, dur: 0.22, vol: 0.8 }, // G5
      { freq: 1046.5, delay: 0.11, dur: 0.22, vol: 0.82 }, // C6
      { freq: 1318.51, delay: 0.22, dur: 0.24, vol: 0.84 }, // E6
      { freq: 1567.98, delay: 0.33, dur: 0.26, vol: 0.86 }, // G6
      { freq: 2093.0, delay: 0.46, dur: 0.75, vol: 0.9 }, // C7 (High ringing bell finale)
    ];

    notes.forEach(({ freq, delay, dur, vol }) => {
      const start = now + delay;

      // Primary tone: warm resonant sine wave
      const oscSine = ctx.createOscillator();
      oscSine.type = 'sine';
      oscSine.frequency.setValueAtTime(freq, start);

      // Mallet attack overtone: crisp triangle wave to pierce kitchen background music & fan noise
      const oscTri = ctx.createOscillator();
      oscTri.type = 'triangle';
      oscTri.frequency.setValueAtTime(freq, start);

      const gainSine = ctx.createGain();
      gainSine.gain.setValueAtTime(0, start);
      gainSine.gain.linearRampToValueAtTime(vol * 0.55, start + 0.012);
      gainSine.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      const gainTri = ctx.createGain();
      gainTri.gain.setValueAtTime(0, start);
      gainTri.gain.linearRampToValueAtTime(vol * 0.35, start + 0.012);
      gainTri.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      oscSine.connect(gainSine);
      oscTri.connect(gainTri);
      gainSine.connect(ctx.destination);
      gainTri.connect(ctx.destination);

      oscSine.start(start);
      oscSine.stop(start + dur);
      oscTri.start(start);
      oscTri.stop(start + dur);
    });
  } catch (err) {
    console.warn('Kitchen chime could not play:', err);
  }
}

// Web Audio API Urgent Cooking Alarm (Beep-Beep-Beep commercial kitchen timer alarm pattern)
export function playCookingAlarm() {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const playBeep = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      // Triangle wave delivers the authentic, penetrating timbre of commercial kitchen timers
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.4, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    // 3 rapid pulsing kitchen alarm beeps (C6, E6, G6)
    playBeep(1046.5, now, 0.11);
    playBeep(1318.51, now + 0.15, 0.11);
    playBeep(1567.98, now + 0.30, 0.22);
  } catch (err) {
    console.warn('Cooking alarm could not play:', err);
  }
}

// Web Audio API Customer Update Ding (Upbeat C-E-G chime)
export function playCustomerUpdateChime() {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const playNote = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
    };

    playNote(523.25, now, 0.25);        // C5
    playNote(659.25, now + 0.12, 0.25); // E5
    playNote(783.99, now + 0.24, 0.65); // G5
  } catch (err) {
    console.warn('Customer chime could not play:', err);
  }
}

// Trigger haptic vibration for mobile phones
export function triggerHapticFeedback() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([180, 80, 180]);
    }
  } catch {}
}

// In-tab Broadcast Channel for same-device cross-tab sync
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'ORDER_STATUS_CHANGED') {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('wrap_wing_order_status_updated', {
              detail: e.data,
            })
          );
        }
      }
    });
  }
} catch {
  broadcastChannel = null;
}

function notifySubscribers() {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type: 'ORDERS_UPDATED', timestamp: Date.now() });
    } catch {}
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wrap_wing_orders_change'));
  }
}

const todayDay = typeof window !== 'undefined'
  ? String(new Date().getDate()).padStart(2, '0')
  : '06';

export function generateNextOrderId(orderMode: 'delivery' | 'collection' | 'dine-in' = 'dine-in'): string {
  const prefix = orderMode === 'delivery' ? 'D' : (orderMode === 'dine-in' ? 'T' : 'C');
  const dayStr = String(new Date().getDate()).padStart(2, '0');
  const targetPrefix = `${prefix}-${dayStr}`;

  let maxNum = 0;
  const currentOrders = getAllOrders();
  const pattern = new RegExp(`^${prefix}-${dayStr}(\\d+)$`);

  for (const o of currentOrders) {
    if (o && o.orderId) {
      const clean = o.orderId.replace('#', '').trim();
      const m = clean.match(pattern);
      if (m && m[1]) {
        const parsed = parseInt(m[1], 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const storedKey = `wrap_wing_seq_${prefix}_${dayStr}`;
      const storedVal = parseInt(localStorage.getItem(storedKey) || '0', 10);
      if (!isNaN(storedVal) && storedVal > maxNum) {
        maxNum = storedVal;
      }
      const nextNum = maxNum + 1;
      localStorage.setItem(storedKey, String(nextNum));
      const counterStr = String(nextNum).padStart(2, '0');
      return `${targetPrefix}${counterStr}`;
    } catch {}
  }

  const nextNum = maxNum + 1;
  const counterStr = String(nextNum).padStart(2, '0');
  return `${targetPrefix}${counterStr}`;
}

export const DEFAULT_INITIAL_ORDERS: LiveOrder[] = [];

const DEMO_CUSTOMER_NAMES = new Set(['Sipho Khumalo', 'Thabo Mbeki', 'Sarah Jenkins']);

export const TEST_ORDER_IDS = new Set([
  'C-1501',
  'D-1501',
  'C-1502',
  '#C-1501',
  '#D-1501',
  '#C-1502',
]);

export function isTestOrder(order: Partial<LiveOrder> | null | undefined): boolean {
  if (!order) return false;
  const rawId = String(order.orderId || '').trim();
  const cleanId = rawId.replace('#', '').trim().toUpperCase();
  if (TEST_ORDER_IDS.has(rawId) || TEST_ORDER_IDS.has(cleanId)) {
    return true;
  }
  const custName = (order.customer?.customerName || '').trim().toLowerCase();
  if (
    (custName === 'john doe' || custName.includes('john doe')) &&
    (cleanId === 'C-1501' || cleanId === 'D-1501' || cleanId === 'C-1502' || cleanId.startsWith('C-15') || cleanId.startsWith('D-15'))
  ) {
    return true;
  }
  return false;
}

export function purgeKnownTestOrdersFromCloud(): void {
  if (typeof window === 'undefined') return;
  const testIds = ['C-1501', 'D-1501', 'C-1502', '#C-1501', '#D-1501', '#C-1502'];
  for (const id of testIds) {
    if (isFirebaseConfigured) {
      deleteOrderFromFirestore(id).catch(() => {});
    }
    fetch(`/api/orders?orderId=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
  }
}

// Local Storage helpers with full schema sanitization and no auto-mock generation
export function getAllOrders(): LiveOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }
    // Sanitize and filter out invalid orders, legacy static demo mock tickets, and test orders
    const valid = parsed
      .filter((o): o is LiveOrder => Boolean(o && typeof o === 'object' && o.orderId))
      .filter((o) => {
        const name = (o.customer?.customerName || '').trim().toLowerCase();
        const isLegacyDemoName = DEMO_CUSTOMER_NAMES.has((o.customer?.customerName || '').trim()) || ['sipho khumalo', 'thabo mbeki', 'sarah jenkins'].some(n => name.includes(n));
        const isLegacyStaticDemoId = o.orderId === 'D-1001' || o.orderId === 'D-1002' || o.orderId === 'C-1001';
        if (isLegacyDemoName && isLegacyStaticDemoId) return false;

        // Clean out all PayFast test orders
        if (isTestOrder(o)) {
          return false;
        }
        return true;
      })
      .map((o) => ({
        ...o,
        customer: o.customer || {
          customerName: 'Customer',
          phone: '',
          address: '',
          suburb: 'Pinetown',
        },
        items: Array.isArray(o.items) ? o.items : [],
        grandTotal: typeof o.grandTotal === 'number' ? o.grandTotal : 0,
        subtotal: typeof o.subtotal === 'number' ? o.subtotal : 0,
        deliveryFee: typeof o.deliveryFee === 'number' ? o.deliveryFee : 0,
        tip: typeof o.tip === 'number' ? o.tip : 0,
        timeline: Array.isArray(o.timeline) ? o.timeline : [],
        status: o.status || 'received',
        orderMode: o.orderMode || 'collection',
        paymentMethod: o.paymentMethod || 'cod',
        paymentStatus: o.paymentStatus || 'pending',
        preferredTime: o.preferredTime || 'ASAP',
        createdAt: o.createdAt || 'Just now',
      }));

    if (valid.length !== parsed.length) {
      // Clean up localStorage to permanently remove any leftover legacy static demo tickets
      saveOrders(valid, false);
    }

    return valid;
  } catch {
    return [];
  }
}

export function saveOrders(orders: LiveOrder[], notify = true) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    if (notify) {
      notifySubscribers();
    }
  } catch (err) {
    console.error('Failed to save orders:', err);
  }
}

export function resetToDefaultOrders(): LiveOrder[] {
  clearAllOrders();
  return [];
}

export function getOrderById(orderId: string): LiveOrder | null {
  const cleanId = orderId.replace('#', '').trim();
  const orders = getAllOrders();
  return orders.find((o) => o.orderId === orderId || o.orderId?.replace('#', '').trim() === cleanId) || null;
}

export function isOrderStaleOrExpired(order: LiveOrder | null | undefined): boolean {
  if (!order) return true;

  // 1. Check order creation date vs today
  const todayStr = getLocalTodayDateString();
  const orderDateStr = getOrderDateString(order);

  // If order was placed on a previous calendar day, it is definitely expired
  if (orderDateStr && orderDateStr < todayStr) {
    return true;
  }

  // 2. Check order ID day code (e.g. C-2302 was day 23, today is day 24)
  const currentDayNum = new Date().getDate();
  const match = String(order.orderId || '').replace('#', '').match(/^[CDT]-(\d{2})\d+$/i);
  if (match && match[1]) {
    const orderDayNum = parseInt(match[1], 10);
    if (!isNaN(orderDayNum) && orderDayNum !== currentDayNum) {
      return true;
    }
  }

  // 3. If order was completed more than 30 minutes ago, treat as stale/expired
  if (order.status === 'completed' && order.completedAt) {
    const ageMinutes = (Date.now() - order.completedAt) / (1000 * 60);
    if (ageMinutes > 30) {
      return true;
    }
  }

  // 4. Fallback: If order is older than 6 hours
  if (order.createdAt) {
    const parsedTime = Date.parse(order.createdAt);
    if (!isNaN(parsedTime)) {
      const ageHours = (Date.now() - parsedTime) / (1000 * 60 * 60);
      if (ageHours > 6) {
        return true;
      }
    }
  }

  return false;
}

const MY_PLACED_ORDERS_KEY = 'wrap_wing_my_placed_orders';

export function recordMyPlacedOrder(orderId: string): void {
  if (typeof window === 'undefined' || !orderId) return;
  try {
    const clean = normalizeOrderId(orderId);
    const existingRaw = localStorage.getItem(MY_PLACED_ORDERS_KEY);
    const list: string[] = existingRaw ? JSON.parse(existingRaw) : [];
    if (!list.includes(clean)) {
      list.push(clean);
      localStorage.setItem(MY_PLACED_ORDERS_KEY, JSON.stringify(list));
    }
  } catch {}
}

export function isMyPlacedOrder(orderId: string): boolean {
  if (typeof window === 'undefined' || !orderId) return false;
  try {
    const clean = normalizeOrderId(orderId);
    const existingRaw = localStorage.getItem(MY_PLACED_ORDERS_KEY);
    if (!existingRaw) return false;
    const list: string[] = JSON.parse(existingRaw);
    return Array.isArray(list) && list.includes(clean);
  } catch {
    return false;
  }
}

export function getCurrentOrderId(): string | null {
  if (typeof window === 'undefined') return null;
  const direct = localStorage.getItem(CURRENT_ORDER_KEY);
  if (!direct) return null;

  const clean = direct.replace('#', '').trim();

  // Safeguard: Order C-2402 was placed by customer 'Sne'.
  // If this device did not explicitly place C-2402, purge it immediately so it never shows on other devices.
  if (clean === 'C-2402' || clean === '2402') {
    if (!isMyPlacedOrder('C-2402')) {
      localStorage.removeItem(CURRENT_ORDER_KEY);
      return null;
    }
  }

  const orders = getAllOrders();
  const order = orders.find(
    (o) => o.orderId === direct || o.orderId?.replace('#', '').trim() === clean
  );

  // If order has finished (completed, cancelled, or from past days/expired), remove it from active customer tracker
  if (!order || order.status === 'completed' || order.status === 'cancelled' || isOrderStaleOrExpired(order)) {
    localStorage.removeItem(CURRENT_ORDER_KEY);
    return null;
  }

  return direct;
}

export function setCurrentOrderId(orderId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_ORDER_KEY, orderId);
  notifySubscribers();
}

export function clearCurrentOrder(orderIdToClear?: string) {
  if (typeof window === 'undefined') return;
  try {
    const targetId = orderIdToClear || localStorage.getItem(CURRENT_ORDER_KEY);
    localStorage.removeItem(CURRENT_ORDER_KEY);

    if (targetId) {
      const clean = targetId.replace('#', '').trim();
      const orders = getAllOrders();
      let changed = false;
      const updated = orders.map((o) => {
        if (o.orderId === targetId || o.orderId?.replace('#', '').trim() === clean) {
          changed = true;
          return {
            ...o,
            status: 'completed' as OrderStatus,
            completedAt: o.completedAt || Date.now(),
          };
        }
        return o;
      });
      if (changed) {
        saveOrders(updated, false);
      }
    }

    notifySubscribers();
  } catch {}
}

export function deleteOrder(orderId: string): void {
  const cleanId = orderId.replace('#', '').trim();
  const currentOrders = getAllOrders();
  const filtered = currentOrders.filter(
    (o) => o.orderId !== orderId && o.orderId?.replace('#', '').trim() !== cleanId
  );
  saveOrders(filtered, true);

  if (typeof window !== 'undefined') {
    const currentId = localStorage.getItem(CURRENT_ORDER_KEY);
    if (currentId === orderId || currentId?.replace('#', '').trim() === cleanId) {
      localStorage.removeItem(CURRENT_ORDER_KEY);
    }
  }

  if (isFirebaseConfigured) {
    deleteOrderFromFirestore(orderId).catch(() => {});
  }

  publishCloudEvent({
    type: 'ORDER_DELETED',
    orderId,
    timestamp: Date.now(),
  });

  // Direct DELETE request to serverless relay
  try {
    fetch(`/api/orders?orderId=${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
    }).catch(() => {});
  } catch {}
}

export function clearAllOrders() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_ORDER_KEY);
    notifySubscribers();
  } catch {}

  // Broadcast CLEAR_ALL to serverless API and cloud channels
  try {
    fetch('/api/orders', {
      method: 'DELETE',
    }).catch(() => {});
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'CLEAR_ALL', timestamp: Date.now() }),
    }).catch(() => {});
  } catch {}

  publishCloudEvent({
    type: 'ORDER_DELETED',
    orderId: '*',
    timestamp: Date.now(),
  });
}

// -------------------------------------------------------------
// CLOUD MULTI-DEVICE SYNCHRONIZATION (via ntfy.sh SSE + REST)
// -------------------------------------------------------------

export interface CloudOrderEvent {
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_DELETED';
  senderDeviceId?: string;
  order?: LiveOrder;
  orderId?: string;
  newStatus?: OrderStatus;
  note?: string;
  timelineEvent?: OrderTimelineEvent;
  cookingStartedAt?: number;
  completedAt?: number;
  timestamp: number;
}

// Unique random device ID to prevent echoing back self-generated chimes
const DEVICE_ID =
  typeof window !== 'undefined'
    ? window.sessionStorage?.getItem('wrap_wing_device_id') ||
      (() => {
        const id = 'dev_' + Math.random().toString(36).slice(2, 9);
        try {
          window.sessionStorage?.setItem('wrap_wing_device_id', id);
        } catch {}
        return id;
      })()
    : 'server';

let isCloudSyncing = false;
let cloudEventSource: EventSource | null = null;
let pollInterval: ReturnType<typeof setInterval> | null = null;

// Publish an event to same-domain Vercel API (/api/orders) as fallback
async function publishCloudEvent(event: CloudOrderEvent): Promise<void> {
  event.senderDeviceId = DEVICE_ID;
  const bodyText = JSON.stringify(event);

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyText,
      keepalive: true,
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.orders)) {
        const currentOrders = getAllOrders();
        const orderMap = new Map<string, LiveOrder>();
        for (const o of currentOrders) {
          if (o && o.orderId) orderMap.set(o.orderId, o);
        }
        for (const o of data.orders) {
          if (o && o.orderId) {
            const existing = orderMap.get(o.orderId);
            if (!existing) {
              orderMap.set(o.orderId, o);
            } else {
              const existingRank = STATUS_RANK[existing.status] || 0;
              const cloudRank = STATUS_RANK[o.status] || 0;
              const resolvedStatus = existingRank >= cloudRank ? existing.status : o.status;
              orderMap.set(o.orderId, {
                ...existing,
                ...o,
                completedAt: o.completedAt || existing.completedAt,
                cookingStartedAt: o.cookingStartedAt || existing.cookingStartedAt,
                status: resolvedStatus,
                timeline: (o.timeline?.length || 0) >= (existing.timeline?.length || 0) ? o.timeline : existing.timeline,
              });
            }
          }
        }
        saveOrders(Array.from(orderMap.values()), true);
      }
    }
  } catch (err) {
    console.warn('Could not post to /api/orders:', err);
  }

  // Also broadcast to public ntfy SSE topic for instantaneous cross-device push
  try {
    fetch(`${NTFY_BASE_URL}/${CLOUD_TOPIC}`, {
      method: 'POST',
      body: bodyText,
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {});
  } catch {}
}

// Handle an incoming cloud event from another phone/tablet/computer
function handleIncomingCloudEvent(event: CloudOrderEvent, isRealtimePush = false) {
  if (!event || !event.type) return;

  if ((event as any).type === 'STOCK_CHANGED' && Array.isArray((event as any).outOfStockItemIds)) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('wrap_wing_stock_status_updated', {
          detail: { outOfStockItemIds: (event as any).outOfStockItemIds },
        })
      );
    }
    return;
  }

  const currentOrders = getAllOrders();

  if (event.type === 'ORDER_DELETED') {
    if (event.orderId === '*' || !event.orderId) {
      saveOrders([], true);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CURRENT_ORDER_KEY);
      }
      return;
    }
    const cleanTarget = event.orderId.replace('#', '').trim();
    const updated = currentOrders.filter(
      (o) => o.orderId !== event.orderId && o.orderId?.replace('#', '').trim() !== cleanTarget
    );
    saveOrders(updated, true);
    if (typeof window !== 'undefined') {
      const currentActiveId = localStorage.getItem(CURRENT_ORDER_KEY);
      if (currentActiveId === event.orderId || currentActiveId?.replace('#', '').trim() === cleanTarget) {
        localStorage.removeItem(CURRENT_ORDER_KEY);
      }
    }
    return;
  }

  if (event.type === 'ORDER_CREATED' && event.order) {
    const custName = (event.order.customer?.customerName || '').trim().toLowerCase();
    const isLegacyDemo = ['sipho khumalo', 'thabo mbeki', 'sarah jenkins'].some(n => custName.includes(n)) && ['D-1001', 'D-1002', 'C-1001'].some(id => String(event.order?.orderId).includes(id));
    if (isLegacyDemo) {
      return;
    }
    const orderCleanId = String(event.order.orderId).replace('#', '').trim();
    const existingIndex = currentOrders.findIndex(
      (o) => o.orderId === event.order!.orderId || o.orderId?.replace('#', '').trim() === orderCleanId
    );
    if (existingIndex === -1) {
      // New order discovered from cloud!
      const updated = [event.order, ...currentOrders];
      saveOrders(updated, true);

      // Play chime
      if (isRealtimePush && event.senderDeviceId !== DEVICE_ID) {
        playKitchenChime();
      }
    } else {
      // If cloud order is more up to date, merge without regressing status
      const existing = currentOrders[existingIndex];
      const existingRank = STATUS_RANK[existing.status] || 0;
      const cloudRank = STATUS_RANK[event.order.status] || 0;
      const resolvedStatus = existingRank >= cloudRank ? existing.status : event.order.status;

      currentOrders[existingIndex] = {
        ...existing,
        ...event.order,
        status: resolvedStatus,
        timeline: (event.order.timeline?.length || 0) >= (existing.timeline?.length || 0)
          ? event.order.timeline
          : existing.timeline,
      };
      saveOrders(currentOrders, true);
    }
  } else if (event.type === 'ORDER_UPDATED' && (event.orderId || event.order?.orderId)) {
    const targetId = event.orderId || event.order?.orderId || '';
    const cleanTarget = targetId.replace('#', '').trim();
    const existingIndex = currentOrders.findIndex(
      (o) => o.orderId === targetId || o.orderId?.replace('#', '').trim() === cleanTarget
    );

    const newStatus = event.newStatus || event.order?.status;
    if (!newStatus) return;

    if (existingIndex !== -1) {
      const existing = currentOrders[existingIndex];
      const existingRank = STATUS_RANK[existing.status] || 0;
      const newRank = STATUS_RANK[newStatus] || 0;

      // Status can only move forward - never regress!
      if (newRank < existingRank) return;

      const hasTimeline = event.timelineEvent
        ? [...(existing.timeline || []), event.timelineEvent]
        : (event.order?.timeline?.length || 0) >= (existing.timeline?.length || 0)
        ? event.order!.timeline
        : existing.timeline;

      const updated: LiveOrder = {
        ...existing,
        ...(event.order || {}),
        status: newStatus,
        timeline: hasTimeline,
        cookingStartedAt: event.cookingStartedAt || event.order?.cookingStartedAt || existing.cookingStartedAt,
        completedAt: event.completedAt || event.order?.completedAt || existing.completedAt || (newStatus === 'completed' ? Date.now() : undefined),
      };
      currentOrders[existingIndex] = updated;
      saveOrders(currentOrders, true);

      // If cancelled, remove from customer device active storage
      if (typeof window !== 'undefined' && newStatus === 'cancelled') {
        const currentActiveId = localStorage.getItem(CURRENT_ORDER_KEY);
        if (currentActiveId === targetId || currentActiveId?.replace('#', '').trim() === cleanTarget) {
          localStorage.removeItem(CURRENT_ORDER_KEY);
        }
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('wrap_wing_order_status_updated', {
            detail: {
              orderId: targetId,
              newStatus,
              status: newStatus,
              order: updated,
              note: event.note,
              isRealtimePush,
              senderDeviceId: event.senderDeviceId,
            },
          })
        );
      }
    } else if (event.order) {
      currentOrders.unshift(event.order);
      saveOrders(currentOrders, true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('wrap_wing_order_status_updated', {
            detail: {
              orderId: event.order.orderId,
              newStatus: event.order.status,
              note: event.note,
              isRealtimePush,
              senderDeviceId: event.senderDeviceId,
            },
          })
        );
      }
    }
  }
}

// Pull orders from Firestore cloud database and fallback same-domain API
export async function syncOrdersFromCloud(): Promise<LiveOrder[]> {
  try {
    let cloudOrders: LiveOrder[] = [];

    // 1. Primary: Fetch directly from Firebase Firestore (live production database)
    if (isFirebaseConfigured) {
      try {
        const firestoreList = await fetchOrdersFromFirestore();
        if (Array.isArray(firestoreList) && firestoreList.length > 0) {
          cloudOrders = firestoreList.filter((raw: any) => {
            if (!raw || !raw.orderId) return false;
            if (isTestOrder(raw)) return false;
            return true;
          });
        }
      } catch (err) {
        console.warn('Firestore cloud fetch warning:', err);
      }
    }

    // 2. Secondary fallback: check same-domain /api/orders (if JSON serverless exists)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const apiResp = await fetch(`/api/orders?t=${Date.now()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      const contentType = apiResp.headers.get('content-type') || '';
      if (apiResp.ok && contentType.includes('application/json')) {
        const data = await apiResp.json();
        if (Array.isArray(data)) {
          for (const raw of data) {
            if (raw && raw.orderId && !isTestOrder(raw)) {
              const clean = normalizeOrderId(raw.orderId);
              const existingIdx = cloudOrders.findIndex(
                (c) => c.orderId === raw.orderId || normalizeOrderId(c.orderId) === clean
              );
              if (existingIdx === -1) {
                cloudOrders.push(raw);
              } else {
                const cloudRank = STATUS_RANK[cloudOrders[existingIdx].status] || 0;
                const apiRank = STATUS_RANK[raw.status] || 0;
                if (apiRank > cloudRank) {
                  cloudOrders[existingIdx] = { ...cloudOrders[existingIdx], ...raw };
                }
              }
            }
          }
        }
      }
    } catch {}

    if (Array.isArray(cloudOrders)) {
      const currentOrders = getAllOrders();

      if (cloudOrders.length === 0 && currentOrders.length === 0) {
        saveOrders([], false);
        return [];
      }

      const mergedMap = new Map<string, LiveOrder>();

      // 1. Seed with local orders
      for (const local of currentOrders) {
        if (local && local.orderId && !isTestOrder(local)) {
          mergedMap.set(local.orderId, local);
        }
      }

      // 2. Merge cloud orders into map
      for (const raw of cloudOrders) {
        if (raw && raw.orderId && !isTestOrder(raw)) {
          const sanitized: LiveOrder = {
            ...raw,
            customer: raw.customer || {
              customerName: 'Customer',
              phone: '',
              address: '',
              suburb: 'Pinetown',
            },
            items: Array.isArray(raw.items) ? raw.items : [],
            grandTotal: typeof raw.grandTotal === 'number' ? raw.grandTotal : 0,
            subtotal: typeof raw.subtotal === 'number' ? raw.subtotal : 0,
            deliveryFee: typeof raw.deliveryFee === 'number' ? raw.deliveryFee : 0,
            tip: typeof raw.tip === 'number' ? raw.tip : 0,
            timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
            status: raw.status || 'received',
            orderMode: raw.orderMode || 'collection',
            paymentMethod: raw.paymentMethod || 'cod',
            paymentStatus: raw.paymentStatus || 'pending',
            preferredTime: raw.preferredTime || 'ASAP',
            createdAt: raw.createdAt || 'Just now',
            estimatedMinutes: raw.estimatedMinutes || (raw.orderMode === 'collection' ? 20 : 40),
          };

          const cleanRawId = sanitized.orderId.replace('#', '').trim();
          const existingKey = Array.from(mergedMap.keys()).find(
            (k) => k === sanitized.orderId || k.replace('#', '').trim() === cleanRawId
          );

          if (!existingKey) {
            mergedMap.set(sanitized.orderId, sanitized);
          } else {
            const existing = mergedMap.get(existingKey)!;
            const existingRank = STATUS_RANK[existing.status] || 0;
            const cloudRank = STATUS_RANK[sanitized.status] || 0;
            // Forward progression only: status never regresses backwards
            const resolvedStatus = existingRank >= cloudRank ? existing.status : sanitized.status;

            mergedMap.set(existingKey, {
              ...existing,
              ...sanitized,
              status: resolvedStatus,
              timeline: (sanitized.timeline?.length || 0) >= (existing.timeline?.length || 0)
                ? sanitized.timeline
                : existing.timeline,
              customer: sanitized.customer?.customerName ? sanitized.customer : existing.customer,
              items: sanitized.items?.length > 0 ? sanitized.items : existing.items,
              cookingStartedAt: sanitized.cookingStartedAt || existing.cookingStartedAt,
              completedAt: sanitized.completedAt || existing.completedAt || (resolvedStatus === 'completed' ? (existing.completedAt || Date.now()) : undefined),
            });
          }
        }
      }

      // 3. Two-way self-healing sync:
      // If local device has an order that cloud does not have, OR if local has advanced status ahead of cloud:
      for (const local of currentOrders) {
        if (isTestOrder(local)) continue;
        const localName = (local.customer?.customerName || '').trim().toLowerCase();
        const isLegacyDemo = ['sipho khumalo', 'thabo mbeki', 'sarah jenkins'].some(n => localName.includes(n)) && ['D-1001', 'D-1002', 'C-1001'].some(id => String(local.orderId).includes(id));
        if (isLegacyDemo) continue;
        if (!local || !local.orderId) continue;

        const cleanLocalId = normalizeOrderId(local.orderId);
        const cloudMatch = cloudOrders.find(
          (c) => c.orderId === local.orderId || normalizeOrderId(c.orderId) === cleanLocalId
        );

        if (!cloudMatch) {
          // New order created locally that cloud hasn't received yet
          if (isFirebaseConfigured) {
            saveOrderToFirestore(local).catch(() => {});
          }
          publishCloudEvent({
            type: 'ORDER_CREATED',
            order: local,
            timestamp: Date.now(),
          });
        } else {
          // Order exists in cloud. If local status has advanced ahead of cloud, push to Firestore immediately!
          const localRank = STATUS_RANK[local.status] || 0;
          const cloudRank = STATUS_RANK[cloudMatch.status] || 0;
          if (localRank > cloudRank) {
            if (isFirebaseConfigured) {
              saveOrderToFirestore(local).catch(() => {});
            }
            publishCloudEvent({
              type: 'ORDER_UPDATED',
              orderId: local.orderId,
              newStatus: local.status,
              order: local,
              timestamp: Date.now(),
            });
          }
        }
      }

      const combined = Array.from(mergedMap.values());
      saveOrders(combined, true);
      return combined;
    }
  } catch (err) {
    console.warn('Sync error:', err);
  }

  return getAllOrders();
}

// Start continuous Real-Time SSE listener
export function initCloudSyncListener() {
  if (typeof window === 'undefined') return;

  // Purge any known test orders from cloud / Firestore immediately
  purgeKnownTestOrdersFromCloud();

  // Initial catch up from cloud
  syncOrdersFromCloud();

  // Initialize Server-Sent Events (SSE) for sub-second push across all devices
  if (!cloudEventSource && typeof EventSource !== 'undefined') {
    try {
      cloudEventSource = new EventSource(`${NTFY_BASE_URL}/${CLOUD_TOPIC}/sse`);

      cloudEventSource.onmessage = (e) => {
        try {
          const raw = JSON.parse(e.data);
          if (raw.event === 'message' && raw.message) {
            const event = JSON.parse(raw.message) as CloudOrderEvent;
            handleIncomingCloudEvent(event, true);
          }
        } catch (parseErr) {
          console.warn('Error parsing cloud SSE message:', parseErr);
        }
      };

      cloudEventSource.onerror = () => {
        // EventSource will auto-reconnect, but we ensure local state isn't affected
      };
    } catch (err) {
      console.warn('Could not establish EventSource:', err);
    }
  }

  // Backup heartbeat polling every 12 seconds in case mobile browser puts SSE to sleep
  if (!pollInterval) {
    pollInterval = setInterval(() => {
      syncOrdersFromCloud();
    }, 12000);
  }
}

// Automatically start listener once in browser environment
if (typeof window !== 'undefined') {
  initCloudSyncListener();
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// DATE HELPERS & ORDER LIFECYCLE MANAGEMENT
// -------------------------------------------------------------

export function getLocalTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatToLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getOrderDateString(o: LiveOrder): string {
  if (!o) return getLocalTodayDateString();

  // 1. If explicit date property is saved
  if ((o as any).dateStr && typeof (o as any).dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test((o as any).dateStr)) {
    return (o as any).dateStr;
  }

  // 2. If createdAt contains YYYY-MM-DD
  if (o.createdAt && typeof o.createdAt === 'string') {
    const match = o.createdAt.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }

  // 3. Check timeline events with epochTime
  if (Array.isArray(o.timeline) && o.timeline.length > 0) {
    for (const evt of o.timeline) {
      if (typeof evt?.epochTime === 'number' && evt.epochTime > 1600000000000) {
        return formatToLocalDateString(new Date(evt.epochTime));
      }
    }
  }

  // 4. Check cookingStartedAt or completedAt timestamps
  if (typeof o.completedAt === 'number' && o.completedAt > 1600000000000) {
    return formatToLocalDateString(new Date(o.completedAt));
  }
  if (typeof o.cookingStartedAt === 'number' && o.cookingStartedAt > 1600000000000) {
    return formatToLocalDateString(new Date(o.cookingStartedAt));
  }

  // 5. Check orderId day prefix (e.g. "D-1401" or "C-1402" -> day 14)
  if (o.orderId && typeof o.orderId === 'string') {
    const match = o.orderId.replace('#', '').match(/^[DC]-(\d{2})/i);
    if (match && match[1]) {
      const dayNum = match[1];
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
      return `${currentYear}-${currentMonth}-${dayNum}`;
    }
  }

  if (o.createdAt && o.createdAt.toLowerCase().includes('just now')) {
    return getLocalTodayDateString();
  }

  return 'undated';
}

export async function createLiveOrder(payload: CheckoutPayload): Promise<LiveOrder> {
  const now = new Date();
  const dateStr = formatToLocalDateString(now);
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const activeMode: OrderMode = payload.orderMode === 'dine-in' ? 'dine-in' : 'collection';
  const table = payload.customer?.tableNumber || payload.tableNumber;
  const isDelivery = false;

  const initialTimeline: OrderTimelineEvent[] = [
    {
      status: 'received',
      timestamp: timeStr,
      label: 'Order Placed & Received',
      note: activeMode === 'dine-in'
        ? `Order sent to kitchen for Table ${table || ''}`
        : `Ticket sent to ${payload.store.name}`,
      epochTime: Date.now(),
    },
  ];

  const newOrder: LiveOrder = {
    orderId: payload.orderId,
    orderMode: activeMode,
    tableNumber: table,
    status: 'received',
    items: payload.items,
    subtotal: payload.subtotal,
    deliveryFee: 0,
    tip: 0,
    grandTotal: payload.subtotal,
    customer: payload.customer,
    store: payload.store,
    paymentMethod: payload.paymentMethod,
    paymentStatus: 'paid',
    preferredTime: payload.preferredTime || (activeMode === 'dine-in' ? 'ASAP (To Table)' : 'ASAP (15–20 mins)'),
    createdAt: `${dateStr} ${timeStr}`,
    estimatedMinutes: activeMode === 'dine-in' ? 15 : 20,
    timeline: initialTimeline,
  };

  const existing = getAllOrders();
  // Keep newest first
  saveOrders([newOrder, ...existing]);
  recordMyPlacedOrder(newOrder.orderId);
  setCurrentOrderId(newOrder.orderId);

  // Play gentle customer confirmation chime on client device
  playCustomerUpdateChime();

  // Instant real-time broadcast via Firestore if configured
  if (isFirebaseConfigured) {
    saveOrderToFirestore(newOrder).catch((e) => console.warn('Firestore order save error:', e));
  }

  // Auto-sync to Google Sheets webhook if configured
  sendOrderToGoogleSheets(newOrder).catch((e) => console.warn('Google Sheets auto-sync notice:', e));

  // Auto-send instant email notification to orders@wrapandwings.co.za
  sendOrderEmailNotification(newOrder).catch((e) => console.warn('Order email notification notice:', e));

  // Broadcast to cloud so Kitchen display on PC/counter tablet receives immediately!
  await publishCloudEvent({
    type: 'ORDER_CREATED',
    order: newOrder,
    timestamp: Date.now(),
  });

  return newOrder;
}

/**
 * Record an unfulfilled, cancelled, or declined online payment order in CRM reports
 * Hidden from Kitchen Display to prevent wasted food, but accessible to Managers for customer follow-up.
 */
export function recordCancelledOrder(
  payload: CheckoutPayload,
  reason: string = 'Payment Unsuccessful / Cancelled on PayFast'
): LiveOrder {
  const isDelivery = payload.orderMode === 'delivery';
  const now = new Date();
  const dateStr = now.toLocaleDateString();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const cancelledOrder: LiveOrder = {
    orderId: payload.orderId,
    orderMode: payload.orderMode,
    status: 'cancelled',
    items: payload.items,
    subtotal: payload.subtotal,
    deliveryFee: payload.deliveryFee,
    tip: typeof payload.tip === 'number' ? payload.tip : 0,
    grandTotal: payload.grandTotal,
    customer: payload.customer,
    store: payload.store,
    paymentMethod: payload.paymentMethod,
    paymentStatus: 'pending',
    preferredTime: payload.preferredTime || (isDelivery ? 'ASAP (35–45 mins)' : 'ASAP (15–20 mins)'),
    createdAt: `${dateStr} ${timeStr}`,
    estimatedMinutes: 0,
    timeline: [
      {
        status: 'cancelled',
        timestamp: timeStr,
        label: reason,
        note: reason,
      },
    ],
  };

  const existing = getAllOrders().filter((o) => o.orderId !== cancelledOrder.orderId);
  saveOrders([cancelledOrder, ...existing]);

  if (isFirebaseConfigured) {
    saveOrderToFirestore(cancelledOrder).catch((e) => console.warn('Firestore order save error:', e));
  }

  publishCloudEvent({
    type: 'ORDER_UPDATED',
    orderId: cancelledOrder.orderId,
    newStatus: 'cancelled',
    timestamp: Date.now(),
  }).catch(() => {});

  return cancelledOrder;
}

export function updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string): LiveOrder | null {
  const cleanId = orderId.replace('#', '').trim();
  const orders = getAllOrders();
  const index = orders.findIndex(
    (o) => o.orderId === orderId || o.orderId?.replace('#', '').trim() === cleanId
  );
  if (index === -1) return null;

  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const current = orders[index];

  // Prevent status regression
  const currentRank = STATUS_RANK[current.status] || 0;
  const nextRank = STATUS_RANK[newStatus] || 0;
  if (nextRank < currentRank) {
    return current;
  }

  const statusLabels: Record<OrderStatus, string> = {
    received: 'Order Received',
    cooking: 'On The Flame Grill',
    ready: current.orderMode === 'dine-in'
      ? `Fresh off Grill • Delivering to Table ${current.tableNumber || current.customer?.tableNumber || ''}`
      : current.orderMode === 'delivery'
      ? 'Packed for Driver'
      : 'Hot & Ready for Collection',
    dispatched: 'Out for Delivery with Driver',
    completed: 'Order Completed & Handed Over',
    cancelled: 'Order Cancelled',
  };

  const timelineEvent: OrderTimelineEvent = {
    status: newStatus,
    timestamp: nowStr,
    label: statusLabels[newStatus] || newStatus,
    note,
    epochTime: Date.now(),
  };

  const cookingStartedAt =
    newStatus === 'cooking'
      ? (current.cookingStartedAt || Date.now())
      : current.cookingStartedAt;

  const completedAt =
    newStatus === 'completed'
      ? (current.completedAt || Date.now())
      : current.completedAt;

  const updatedOrder: LiveOrder = {
    ...current,
    status: newStatus,
    timeline: [...current.timeline, timelineEvent],
    cookingStartedAt,
    completedAt,
  };

  orders[index] = updatedOrder;
  saveOrders(orders, true);

  // If order is cancelled, remove from customer device active storage so it disappears
  if (typeof window !== 'undefined' && newStatus === 'cancelled') {
    const currentActiveId = localStorage.getItem(CURRENT_ORDER_KEY);
    if (currentActiveId === orderId || currentActiveId?.replace('#', '').trim() === cleanId) {
      localStorage.removeItem(CURRENT_ORDER_KEY);
    }
  }

  // Instant real-time status progression in Firestore if configured
  if (isFirebaseConfigured) {
    saveOrderToFirestore(updatedOrder).catch((e) =>
      console.warn('Firestore saveOrder error:', e)
    );
    updateOrderStatusInFirestore(updatedOrder.orderId, newStatus, timelineEvent, cookingStartedAt, completedAt).catch((e) =>
      console.warn('Firestore status update error:', e)
    );
  }

  // Broadcast status change to cloud so customer's mobile tracker updates immediately!
  publishCloudEvent({
    type: 'ORDER_UPDATED',
    orderId: updatedOrder.orderId,
    newStatus,
    note,
    timelineEvent,
    cookingStartedAt,
    completedAt,
    order: updatedOrder,
    timestamp: Date.now(),
  });

  // Local window and cross-tab instant event broadcast
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('wrap_wing_order_status_updated', {
        detail: {
          orderId: updatedOrder.orderId,
          newStatus,
          status: newStatus,
          note,
          timelineEvent,
          cookingStartedAt,
          completedAt,
          order: updatedOrder,
        },
      })
    );
  }
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type: 'ORDER_STATUS_CHANGED',
        orderId: updatedOrder.orderId,
        newStatus,
        status: newStatus,
        order: updatedOrder,
        timestamp: Date.now(),
      });
    } catch {}
  }

  return updatedOrder;
}

export function subscribeToOrders(callback: (orders: LiveOrder[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = () => {
    callback(getAllOrders());
  };

  window.addEventListener('wrap_wing_orders_change', handleUpdate);
  window.addEventListener('storage', handleUpdate);

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleUpdate);
  }

  // Initial emit
  callback(getAllOrders());

  // Real-time Firestore stream if configured
  let unsubFirestore: (() => void) | null = null;
  if (isFirebaseConfigured) {
    unsubFirestore = subscribeToFirestoreOrders((firestoreOrders) => {
      if (firestoreOrders && firestoreOrders.length > 0) {
        const currentOrders = getAllOrders();
        const orderMap = new Map<string, LiveOrder>();
        for (const o of currentOrders) {
          if (o && o.orderId && !isTestOrder(o)) orderMap.set(o.orderId, o);
        }
        for (const f of firestoreOrders) {
          if (isTestOrder(f)) {
            // Permanently delete from Firestore so it never downloads or cycles again
            deleteOrderFromFirestore(f.orderId).catch(() => {});
            continue;
          }
          if (f && f.orderId) {
            const existing = orderMap.get(f.orderId);
            if (!existing) {
              orderMap.set(f.orderId, f);
            } else {
              const existingRank = STATUS_RANK[existing.status] || 0;
              const firestoreRank = STATUS_RANK[f.status] || 0;
              const resolvedStatus = existingRank >= firestoreRank ? existing.status : f.status;
              orderMap.set(f.orderId, {
                ...existing,
                ...f,
                status: resolvedStatus,
                timeline: (f.timeline?.length || 0) >= (existing.timeline?.length || 0) ? f.timeline : existing.timeline,
              });
            }
          }
        }
        const merged = Array.from(orderMap.values());
        saveOrders(merged, false);
        callback(merged);
      }
    });
  }

  // Also trigger cloud sync to make sure we're up to date
  syncOrdersFromCloud().then((fresh) => {
    callback(fresh);
  });

  return () => {
    window.removeEventListener('wrap_wing_orders_change', handleUpdate);
    window.removeEventListener('storage', handleUpdate);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleUpdate);
    }
    if (unsubFirestore) {
      unsubFirestore();
    }
  };
}

export function subscribeToSingleOrder(orderId: string, callback: (order: LiveOrder | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const cleanId = normalizeOrderId(orderId);

  const handleUpdate = () => {
    callback(getOrderById(orderId) || getOrderById(cleanId));
  };

  window.addEventListener('wrap_wing_orders_change', handleUpdate);
  window.addEventListener('storage', handleUpdate);

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleUpdate);
  }

  // Initial emit
  callback(getOrderById(orderId) || getOrderById(cleanId));

  // Real-time instant single-order stream via Firestore if configured
  let unsubFirestore: (() => void) | null = null;
  if (isFirebaseConfigured) {
    unsubFirestore = subscribeToSingleFirestoreOrder(cleanId, (liveOrder) => {
      if (liveOrder) {
        const local = getOrderById(orderId) || getOrderById(cleanId);
        const localRank = local ? STATUS_RANK[local.status] || 0 : 0;
        const cloudRank = STATUS_RANK[liveOrder.status] || 0;
        const resolved = cloudRank >= localRank ? liveOrder : (local || liveOrder);
        
        // Save merged state into local storage so all components immediately see the new status
        const orders = getAllOrders();
        const idx = orders.findIndex(
          (o) => o.orderId === orderId || normalizeOrderId(o.orderId) === cleanId
        );
        if (idx !== -1) {
          orders[idx] = { ...orders[idx], ...resolved };
          saveOrders(orders, false);
        } else {
          saveOrders([resolved, ...orders], false);
        }

        callback(resolved);
      }
    });

    // Proactively fetch single order from Firestore immediately
    fetchSingleOrderFromFirestore(cleanId).then((liveOrder) => {
      if (liveOrder) {
        const local = getOrderById(orderId) || getOrderById(cleanId);
        const localRank = local ? STATUS_RANK[local.status] || 0 : 0;
        const cloudRank = STATUS_RANK[liveOrder.status] || 0;
        const resolved = cloudRank >= localRank ? liveOrder : (local || liveOrder);
        callback(resolved);
      }
    }).catch(() => {});
  }

  // Also trigger cloud sync to check if this order is in the cloud
  syncOrdersFromCloud().then(() => {
    callback(getOrderById(orderId) || getOrderById(cleanId));
  });

  return () => {
    window.removeEventListener('wrap_wing_orders_change', handleUpdate);
    window.removeEventListener('storage', handleUpdate);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleUpdate);
    }
    if (unsubFirestore) {
      unsubFirestore();
    }
  };
}

// -------------------------------------------------------------
// GOOGLE SHEETS LIVE WEBHOOK & CSV DIRECTORY EXPORT (CRM)
// -------------------------------------------------------------

const GOOGLE_SHEETS_WEBHOOK_KEY = 'wrap_wing_google_sheets_webhook';

export function getGoogleSheetsWebhookUrl(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(GOOGLE_SHEETS_WEBHOOK_KEY) || '';
  } catch {
    return '';
  }
}

export function setGoogleSheetsWebhookUrl(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (url.trim()) {
      localStorage.setItem(GOOGLE_SHEETS_WEBHOOK_KEY, url.trim());
    } else {
      localStorage.removeItem(GOOGLE_SHEETS_WEBHOOK_KEY);
    }
  } catch {}
}

export async function sendOrderToGoogleSheets(order: LiveOrder): Promise<boolean> {
  const webhookUrl = getGoogleSheetsWebhookUrl();
  if (!webhookUrl || !order) return false;

  try {
    const cleanPhone = (order.customer?.phone || '').replace(/[^0-9]/g, '');
    const smsPhone = cleanPhone.startsWith('0') ? `27${cleanPhone.slice(1)}` : cleanPhone;
    const itemsSummary = (order.items || [])
      .map((it) => {
        let txt = `${it.quantity || 1}x ${it.menuItem?.name || 'Meal'}`;
        if (it.customization?.flavour) txt += ` (${it.customization.flavour})`;
        if (it.customization?.side) txt += ` + ${it.customization.side}`;
        return txt;
      })
      .join(' ; ');

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.orderId,
        date: new Date().toLocaleDateString('en-ZA'),
        time: order.createdAt,
        customerName: order.customer?.customerName || 'Customer',
        phone: smsPhone,
        rawPhone: order.customer?.phone || '',
        orderMode: order.orderMode === 'delivery' ? 'Home Delivery' : 'Store Collection',
        address: order.customer?.address || '',
        suburb: order.customer?.suburb || 'Pinetown',
        complexOrUnit: order.customer?.complexOrUnit || '',
        gateCode: order.customer?.gateCode || '',
        notes: order.customer?.notes || '',
        itemsSummary,
        subtotal: order.subtotal || 0,
        deliveryFee: order.deliveryFee || 0,
        driverTip: order.tip || 0,
        grandTotal: order.grandTotal || 0,
        paymentMethod: (order.paymentMethod || 'cod').toUpperCase(),
        paymentStatus: (order.paymentStatus || 'pending').toUpperCase(),
        status: (order.status || 'received').toUpperCase(),
      }),
    });
    return true;
  } catch (err) {
    console.warn('Google Sheets webhook post error:', err);
    return false;
  }
}

/**
 * Sends an automated, beautifully formatted email order ticket directly to orders@wrapandwings.co.za
 * First attempts to dispatch via direct Hostinger SMTP serverless function (/api/send-order-email).
 * If unavailable, smoothly falls back to FormSubmit AJAX service as backup.
 */
export async function sendOrderEmailNotification(order: LiveOrder): Promise<boolean> {
  if (!order || !order.orderId) return false;

  // 1. Primary: Direct Hostinger SMTP Serverless Function (Clean custom branded email)
  try {
    const res = await fetch('/api/send-order-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order }),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        return true;
      }
    }
  } catch (apiErr) {
    console.warn('Primary Hostinger SMTP API notice, trying backup:', apiErr);
  }

  // 2. Backup Fallback: FormSubmit AJAX Service
  try {
    const cleanPhone = order.customer?.phone || 'Not provided';
    const itemsSummary = (order.items || [])
      .map((it, idx) => {
        let txt = `${idx + 1}. ${it.quantity || 1}x ${it.menuItem?.name || 'Meal'}`;
        const details: string[] = [];
        if (it.customization?.flavour) details.push(`Flavour: ${it.customization.flavour}`);
        if (it.customization?.side) details.push(`Side: ${it.customization.side}`);
        if (it.customization?.extras && it.customization.extras.length > 0) {
          details.push(`Extras: ${it.customization.extras.map((e) => e.name).join(', ')}`);
        }
        if (it.customization?.notes) details.push(`Note: ${it.customization.notes}`);
        if (details.length > 0) {
          txt += ` (${details.join(' | ')})`;
        }
        txt += ` - R${(it.itemTotal || 0).toFixed(2)}`;
        return txt;
      })
      .join('\n');

    const modeLabel = order.orderMode === 'collection' ? 'Collection' : 'Delivery';
    const paymentLabel =
      order.paymentMethod === 'payfast'
        ? 'PayFast Online (Confirmed Paid)'
        : order.paymentMethod === 'whatsapp'
        ? 'WhatsApp Order'
        : order.paymentMethod === 'cod'
        ? order.orderMode === 'collection'
          ? 'Pay on Collection (Card / Cash)'
          : 'Pay on Delivery (Card / Cash)'
        : (order.paymentMethod || 'Paid');

    const address =
      order.orderMode === 'delivery'
        ? `${order.customer?.address || ''}, ${order.customer?.suburb || 'Pinetown'}${
            order.customer?.complexOrUnit ? ` (${order.customer.complexOrUnit})` : ''
          }${order.customer?.gateCode ? ` [Gate: ${order.customer.gateCode}]` : ''}`
        : 'Store Collection (Pine Crest Centre, Pinetown)';

    const response = await fetch('https://formsubmit.co/ajax/orders@wrapandwings.co.za', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        'Status Notice': '🌯 Someone just submitted their order on wrapandwings.co.za',
        'Order Number': order.orderId,
        'Order Type': modeLabel,
        'Customer Name': order.customer?.customerName || 'Customer',
        'Customer Phone': cleanPhone,
        'Store Location': order.store?.name || 'Pine Crest Centre, Pinetown',
        'Pickup / Delivery Time': order.preferredTime || 'ASAP',
        'Payment Method': paymentLabel,
        'Payment Status': 'PAID (Payment Received)',
        'Delivery / Pickup Address': address,
        'Special Instructions': order.customer?.notes || 'None',
        'Order Items': itemsSummary || 'No items listed',
        'Subtotal': `R${(order.subtotal || 0).toFixed(2)}`,
        'Delivery Fee': `R${(order.deliveryFee || 0).toFixed(2)}`,
        'Tip': `R${(order.tip || 0).toFixed(2)}`,
        'Grand Total': `R${(order.grandTotal || 0).toFixed(2)}`,
        'Order Placed At': order.createdAt || new Date().toLocaleString('en-ZA'),
        _subject: `🌯 [NEW ORDER] #${order.orderId} - ${
          order.orderMode === 'collection' ? 'COLLECTION' : 'DELIVERY'
        } - ${order.customer?.customerName || 'Customer'} (R${(order.grandTotal || 0).toFixed(2)})`,
        _template: 'table',
        _captcha: 'false',
      }),
    });

    return response.ok;
  } catch (err) {
    console.warn('Order email notification error:', err);
    return false;
  }
}

/**
 * Generates and downloads a clean, professional CSV file containing all customer order
 * details, formatted specifically for Google Sheets, Microsoft Excel, and Bulk SMS marketing platforms.
 */
export function exportOrdersToCsv(orders: LiveOrder[], filenamePrefix = 'wrap-and-wings-orders'): void {
  const headers = [
    'Order ID',
    'Placed Time',
    'Customer Name',
    'Cell / WhatsApp (SMS Marketing Format)',
    'Order Mode',
    'Delivery Address',
    'Suburb',
    'Complex / Unit',
    'Gate Code',
    'Customer Notes',
    'Items Summary',
    'Subtotal (ZAR)',
    'Delivery Fee (ZAR)',
    'Driver Tip (ZAR)',
    'Grand Total (ZAR)',
    'Payment Method',
    'Payment Status',
    'Order Status',
  ];

  const escapeCsv = (str: string | number | undefined | null) => {
    const val = String(str ?? '').replace(/"/g, '""');
    return `"${val}"`;
  };

  const rows = orders.map((o) => {
    const itemsSummary = (o.items || [])
      .map((it) => {
        let details = `${it.quantity || 1}x ${it.menuItem?.name || 'Meal'}`;
        const parts: string[] = [];
        if (it.customization?.flavour) parts.push(`Baste: ${it.customization.flavour}`);
        if (it.customization?.side) parts.push(`Side: ${it.customization.side}`);
        if (it.customization?.extras?.length) {
          parts.push(`Extras: ${it.customization.extras.map((e) => e.name).join(', ')}`);
        }
        if (it.customization?.notes) parts.push(`Note: ${it.customization.notes}`);
        if (parts.length > 0) details += ` (${parts.join(' | ')})`;
        return details;
      })
      .join(' ; ');

    const cleanPhone = (o.customer?.phone || '').replace(/[^0-9]/g, '');
    const smsPhone = cleanPhone.startsWith('0') ? `27${cleanPhone.slice(1)}` : cleanPhone;

    return [
      escapeCsv(o.orderId),
      escapeCsv(o.createdAt || 'N/A'),
      escapeCsv(o.customer?.customerName || 'Customer'),
      escapeCsv(smsPhone || o.customer?.phone || ''),
      escapeCsv(o.orderMode === 'delivery' ? 'Home Delivery' : 'Store Collection'),
      escapeCsv(o.customer?.address || ''),
      escapeCsv(o.customer?.suburb || 'Pinetown'),
      escapeCsv(o.customer?.complexOrUnit || ''),
      escapeCsv(o.customer?.gateCode || ''),
      escapeCsv(o.customer?.notes || ''),
      escapeCsv(itemsSummary),
      escapeCsv((o.subtotal || 0).toFixed(2)),
      escapeCsv((o.deliveryFee || 0).toFixed(2)),
      escapeCsv((o.tip || 0).toFixed(2)),
      escapeCsv((o.grandTotal || 0).toFixed(2)),
      escapeCsv((o.paymentMethod || 'cod').toUpperCase()),
      escapeCsv((o.paymentStatus || 'pending').toUpperCase()),
      escapeCsv((o.status || 'received').toUpperCase()),
    ];
  });

  // UTF-8 BOM prefix ensures Google Sheets and Excel open all special characters cleanly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `${filenamePrefix}-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateWhatsAppDailyOrdersReportText(
  dateLabel: string,
  totals: {
    totalRevenue: number;
    subtotal: number;
    deliveryFees: number;
    totalOrders: number;
    avgOrderValue: number;
    deliveriesCount: number;
    deliveryRevenue: number;
    collectionsCount: number;
    collectionRevenue: number;
    driverTips: number;
    totalItemsCount: number;
    itemsMap: Record<string, { qty: number; revenue: number; orderIds?: string[] }>;
    orderIds?: string[];
  }
): string {
  const topItems = Object.entries(totals.itemsMap)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 10);

  const itemsListText =
    topItems.length > 0
      ? topItems.map(([name, data]) => {
          const ordRef = data.orderIds && data.orderIds.length > 0 ? ` [${data.orderIds.join(', ')}]` : '';
          return `• ${data.qty}x ${name} (R${data.revenue.toFixed(2)})${ordRef}`;
        }).join('\n')
      : '• No meals recorded for this shift.';

  const ordersRefText = totals.orderIds && totals.orderIds.length > 0 ? ` (${totals.orderIds.join(', ')})` : '';

  return `🍗 *WRAP & WINGS CO. — DAILY ORDERS & SALES REPORT*
📅 *Shift Date:* ${dateLabel}
📍 *Store:* Shop 1, Uniland Centre, Pinetown
───────────────────────
💰 *FINANCIAL & SALES TOTALS:*
• *Gross Revenue:* R${totals.totalRevenue.toFixed(2)}
• *Food Sales (Subtotal):* R${totals.subtotal.toFixed(2)}
• *Delivery Fees:* R${totals.deliveryFees.toFixed(2)}
• *Driver Tips:* R${totals.driverTips.toFixed(2)}
• *Total Orders Placed:* ${totals.totalOrders} orders${ordersRefText}
• *Avg Basket Size:* R${totals.avgOrderValue.toFixed(2)}

🛵 *COLLECT vs DELIVERY SPLIT:*
• *Home Deliveries:* ${totals.deliveriesCount} orders (R${totals.deliveryRevenue.toFixed(2)})
• *Store Collections:* ${totals.collectionsCount} orders (R${totals.collectionRevenue.toFixed(2)})

🍗 *MEALS & ITEMS PREPARED (${totals.totalItemsCount} total portions):*
${itemsListText}
───────────────────────
✅ *Verified from Store Manager Portal at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}*`;
}

