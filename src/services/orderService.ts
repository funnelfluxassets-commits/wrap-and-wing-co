import { LiveOrder, OrderStatus, OrderTimelineEvent } from '../types';
import { CheckoutPayload } from './payment';
import { STORES } from '../data/stores';

const STORAGE_KEY = 'wrap_wing_live_orders';
const CURRENT_ORDER_KEY = 'wrap_wing_current_order_id';
const CHANNEL_NAME = 'wrap_wing_orders_channel';
const CLOUD_TOPIC = 'wrap_and_wing_live_orders_shop1';
const NTFY_BASE_URL = 'https://ntfy.sh';

// Web Audio API Ding-Dong Chime for Kitchen Display
export function playKitchenChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // First Tone: High Ding (880 Hz - A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.35, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Second Tone: Harmonious Dong (1174.66 Hz - D6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.15);
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.4, now + 0.19);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 1.1);
  } catch (err) {
    console.warn('Audio chime could not play:', err);
  }
}

// Web Audio API Customer Update Ding (Upbeat C-E-G chime)
export function playCustomerUpdateChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
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

export function generateNextOrderId(orderMode: 'delivery' | 'collection' = 'delivery'): string {
  const prefix = orderMode === 'delivery' ? 'D' : 'C';
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

export const DEFAULT_INITIAL_ORDERS: LiveOrder[] = [
  {
    orderId: `D-${todayDay}01`,
    orderMode: 'delivery',
    status: 'received',
    items: [
      {
        id: 'item-ww-8492-1',
        quantity: 1,
        menuItem: {
          id: 'pedros-full-chicken',
          name: 'Flame-Grilled Full Chicken',
          price: 189.9,
          description: 'Whole chicken flame-grilled to perfection in our signature basting.',
          categoryId: 'chicken',
          popular: true,
          isSpicy: true,
          image: '/images/menu/full-chicken.webp',
        },
        customization: { flavour: 'hot', side: 'Chips (Large)', extras: [{ name: 'Extra Prego Roll', price: 15 }] },
        itemTotal: 204.9,
      },
      {
        id: 'item-ww-8492-2',
        quantity: 2,
        menuItem: {
          id: 'pedros-classic-wrap',
          name: 'Classic Grilled Chicken Wrap',
          price: 69.9,
          description: 'Tender chicken strips, crispy lettuce, tomato and signature garlic prego mayo.',
          categoryId: 'wraps',
          popular: true,
          image: '/images/menu/classic-wrap.webp',
        },
        customization: { flavour: 'lemony', side: 'Coleslaw' },
        itemTotal: 139.8,
      },
    ],
    subtotal: 344.7,
    deliveryFee: 25.0,
    grandTotal: 369.7,
    customer: {
      customerName: 'Sipho Khumalo',
      phone: '082 555 4921',
      address: '14 Kings Road',
      suburb: 'Pinetown',
      gateCode: '#4820',
      notes: 'Please ring bell at gate',
    },
    store: STORES[0],
    paymentMethod: 'whatsapp',
    paymentStatus: 'pending',
    preferredTime: 'ASAP (35–45 mins)',
    createdAt: 'Just now',
    estimatedMinutes: 35,
    timeline: [
      { status: 'received', timestamp: 'Just now', label: 'Order Placed & Received', note: 'Ticket sent to Pinetown Flagship' }
    ],
  },
  {
    orderId: `D-${todayDay}02`,
    orderMode: 'delivery',
    status: 'cooking',
    items: [
      {
        id: 'item-ww-8490-1',
        quantity: 2,
        menuItem: {
          id: 'wings-12pc',
          name: '12 Flame-Grilled Wings',
          price: 129.9,
          description: '12 succulent flame-grilled chicken wings drenched in your choice of marinade.',
          categoryId: 'wings',
          popular: true,
          isSpicy: true,
          image: '/images/menu/12-wings.webp',
        },
        customization: { flavour: 'hot', side: 'Spicy Rice' },
        itemTotal: 259.8,
      },
    ],
    subtotal: 259.8,
    deliveryFee: 25.0,
    grandTotal: 284.8,
    customer: {
      customerName: 'Thabo Mbeki',
      phone: '083 490 8593',
      address: '42 Crompton Street',
      suburb: 'Pinetown',
      complexOrUnit: 'Block B, Unit 4',
      notes: 'Call on arrival',
    },
    store: STORES[0],
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    preferredTime: '12:30 PM',
    createdAt: '12:05 PM',
    estimatedMinutes: 25,
    timeline: [
      { status: 'received', timestamp: '12:05 PM', label: 'Order Placed & Received', note: 'Ticket sent to Pinetown Flagship' },
      { status: 'cooking', timestamp: '12:10 PM', label: 'Flame Grill Started', note: 'Chicken on the grill' }
    ],
  },
  {
    orderId: `C-${todayDay}01`,
    orderMode: 'collection',
    status: 'ready',
    items: [
      {
        id: 'item-ww-8488-1',
        quantity: 1,
        menuItem: {
          id: 'wrap-meal',
          name: 'Signature Wrap Meal Combo',
          price: 89.9,
          description: 'Toasted chicken wrap with regular chips and a 300ml cold drink.',
          categoryId: 'wraps',
          popular: true,
          image: '/images/menu/wrap-meal.webp',
        },
        customization: { flavour: 'mild', side: 'Chips (Regular)' },
        itemTotal: 89.9,
      },
    ],
    subtotal: 89.9,
    deliveryFee: 0,
    grandTotal: 89.9,
    customer: {
      customerName: 'Sarah Jenkins',
      phone: '071 234 5678',
      address: 'Collection Counter',
      suburb: 'Pinetown',
    },
    store: STORES[0],
    paymentMethod: 'yoco',
    paymentStatus: 'paid',
    preferredTime: 'ASAP (15–20 mins)',
    createdAt: '11:45 AM',
    estimatedMinutes: 15,
    timeline: [
      { status: 'received', timestamp: '11:45 AM', label: 'Order Placed', note: 'Ticket sent to kitchen' },
      { status: 'cooking', timestamp: '11:48 AM', label: 'Cooking', note: 'On the grill' },
      { status: 'ready', timestamp: '11:58 AM', label: 'Packed & Ready', note: 'Waiting at collection counter' }
    ],
  }
];

// Local Storage helpers with full schema sanitization and auto-initialization
export function getAllOrders(): LiveOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveOrders(DEFAULT_INITIAL_ORDERS, false);
      return [...DEFAULT_INITIAL_ORDERS];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveOrders(DEFAULT_INITIAL_ORDERS, false);
      return [...DEFAULT_INITIAL_ORDERS];
    }
    // Sanitize and filter out invalid or corrupted orders
    const valid = parsed
      .filter((o): o is LiveOrder => Boolean(o && typeof o === 'object' && o.orderId))
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
        timeline: Array.isArray(o.timeline) ? o.timeline : [],
        status: o.status || 'received',
        orderMode: o.orderMode || 'delivery',
        paymentMethod: o.paymentMethod || 'cod',
        paymentStatus: o.paymentStatus || 'pending',
        preferredTime: o.preferredTime || 'ASAP',
        createdAt: o.createdAt || 'Just now',
      }));

    if (valid.length === 0) {
      saveOrders(DEFAULT_INITIAL_ORDERS, false);
      return [...DEFAULT_INITIAL_ORDERS];
    }
    return valid;
  } catch {
    return [...DEFAULT_INITIAL_ORDERS];
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
  saveOrders(DEFAULT_INITIAL_ORDERS, true);
  if (typeof window !== 'undefined') {
    setCurrentOrderId(DEFAULT_INITIAL_ORDERS[0].orderId);
  }
  return [...DEFAULT_INITIAL_ORDERS];
}

export function getOrderById(orderId: string): LiveOrder | null {
  const orders = getAllOrders();
  return orders.find((o) => o.orderId === orderId) || null;
}

export function getCurrentOrderId(): string | null {
  if (typeof window === 'undefined') return null;
  const direct = localStorage.getItem(CURRENT_ORDER_KEY);
  if (direct) return direct;
  const orders = getAllOrders();
  return orders.length > 0 ? orders[0].orderId : null;
}

export function setCurrentOrderId(orderId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_ORDER_KEY, orderId);
}

export function clearAllOrders() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_ORDER_KEY);
    notifySubscribers();
  } catch {}
}

// -------------------------------------------------------------
// CLOUD MULTI-DEVICE SYNCHRONIZATION (via ntfy.sh SSE + REST)
// -------------------------------------------------------------

export interface CloudOrderEvent {
  type: 'ORDER_CREATED' | 'ORDER_UPDATED';
  senderDeviceId?: string;
  order?: LiveOrder;
  orderId?: string;
  newStatus?: OrderStatus;
  note?: string;
  timelineEvent?: OrderTimelineEvent;
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

// Publish an event to same-domain Vercel API (/api/orders) with keepalive
async function publishCloudEvent(event: CloudOrderEvent): Promise<void> {
  event.senderDeviceId = DEVICE_ID;
  const bodyText = JSON.stringify(event);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyText,
      keepalive: true,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    console.warn('Could not post order event to /api/orders:', err);
  }
}

// Handle an incoming cloud event from another phone/tablet/computer
function handleIncomingCloudEvent(event: CloudOrderEvent, isRealtimePush = false) {
  if (!event || !event.type) return;

  const currentOrders = getAllOrders();

  if (event.type === 'ORDER_CREATED' && event.order) {
    const existingIndex = currentOrders.findIndex((o) => o.orderId === event.order!.orderId);
    if (existingIndex === -1) {
      // New order discovered from cloud!
      const updated = [event.order, ...currentOrders];
      saveOrders(updated, true);

      // Play chime
      if (isRealtimePush && event.senderDeviceId !== DEVICE_ID) {
        playKitchenChime();
      }
    } else {
      // If cloud order is more up to date, merge
      const existing = currentOrders[existingIndex];
      if (
        event.order.timeline &&
        event.order.timeline.length > (existing.timeline ? existing.timeline.length : 0)
      ) {
        currentOrders[existingIndex] = event.order;
        saveOrders(currentOrders, true);
      }
    }
  } else if (event.type === 'ORDER_UPDATED' && event.orderId && event.newStatus) {
    const existingIndex = currentOrders.findIndex((o) => o.orderId === event.orderId);
    if (existingIndex !== -1) {
      const existing = currentOrders[existingIndex];
      if (existing.status !== event.newStatus || event.timelineEvent) {
        const hasTimeline = event.timelineEvent
          ? [...existing.timeline, event.timelineEvent]
          : existing.timeline;

        const updated: LiveOrder = {
          ...existing,
          status: event.newStatus,
          timeline: hasTimeline,
        };
        currentOrders[existingIndex] = updated;
        saveOrders(currentOrders, true);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('wrap_wing_order_status_updated', {
              detail: {
                orderId: event.orderId,
                newStatus: event.newStatus,
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
}

// Pull orders from same-domain /api/orders with smart 2-way merge
export async function syncOrdersFromCloud(): Promise<LiveOrder[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const apiResp = await fetch('/api/orders', {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (apiResp.ok) {
      const cloudOrders = await apiResp.json();
      if (Array.isArray(cloudOrders) && cloudOrders.length > 0) {
        const currentOrders = getAllOrders();
        const mergedMap = new Map<string, LiveOrder>();

        // 1. Seed with local orders
        for (const local of currentOrders) {
          if (local && local.orderId) {
            mergedMap.set(local.orderId, local);
          }
        }

        // 2. Merge cloud orders into map
        for (const raw of cloudOrders) {
          if (raw && raw.orderId) {
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
              timeline: Array.isArray(raw.timeline) ? raw.timeline : [],
              status: raw.status || 'received',
              orderMode: raw.orderMode || 'delivery',
              paymentMethod: raw.paymentMethod || 'cod',
              paymentStatus: raw.paymentStatus || 'pending',
              preferredTime: raw.preferredTime || 'ASAP',
              createdAt: raw.createdAt || 'Just now',
              estimatedMinutes: raw.estimatedMinutes || (raw.orderMode === 'collection' ? 20 : 40),
            };

            const existing = mergedMap.get(sanitized.orderId);
            if (!existing) {
              mergedMap.set(sanitized.orderId, sanitized);
            } else {
              // Status progression from cloud takes precedence
              mergedMap.set(sanitized.orderId, {
                ...existing,
                ...sanitized,
                status: sanitized.status,
                timeline: (sanitized.timeline?.length || 0) >= (existing.timeline?.length || 0)
                  ? sanitized.timeline
                  : existing.timeline,
                customer: sanitized.customer?.customerName ? sanitized.customer : existing.customer,
                items: sanitized.items?.length > 0 ? sanitized.items : existing.items,
              });
            }
          }
        }

        // 3. Two-way sync: If local device has an order that cloud does not have, auto-push to cloud
        for (const local of currentOrders) {
          if (
            local &&
            local.orderId &&
            !cloudOrders.some((c: any) => c.orderId === local.orderId || c.orderId?.replace('#', '') === local.orderId.replace('#', ''))
          ) {
            publishCloudEvent({
              type: 'ORDER_CREATED',
              order: local,
              timestamp: Date.now(),
            });
          }
        }

        const combined = Array.from(mergedMap.values());
        saveOrders(combined, true);
        return combined;
      }
    }
  } catch (err) {
    console.warn('Sync error:', err);
  }

  return getAllOrders();
}

// Start continuous Real-Time SSE listener
export function initCloudSyncListener() {
  if (typeof window === 'undefined') return;

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
// ORDER LIFECYCLE MANAGEMENT
// -------------------------------------------------------------

export async function createLiveOrder(payload: CheckoutPayload): Promise<LiveOrder> {
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isDelivery = payload.orderMode === 'delivery';

  const initialTimeline: OrderTimelineEvent[] = [
    {
      status: 'received',
      timestamp: nowStr,
      label: 'Order Placed & Received',
      note: `Ticket sent to ${payload.store.name}`,
    },
  ];

  const newOrder: LiveOrder = {
    orderId: payload.orderId,
    orderMode: payload.orderMode,
    status: 'received',
    items: payload.items,
    subtotal: payload.subtotal,
    deliveryFee: payload.deliveryFee,
    grandTotal: payload.grandTotal,
    customer: payload.customer,
    store: payload.store,
    paymentMethod: payload.paymentMethod,
    paymentStatus: payload.paymentMethod === 'payfast' || payload.paymentMethod === 'yoco' ? 'paid' : 'pending',
    preferredTime: payload.preferredTime || (isDelivery ? 'ASAP (35–45 mins)' : 'ASAP (15–20 mins)'),
    createdAt: nowStr,
    estimatedMinutes: isDelivery ? 40 : 20,
    timeline: initialTimeline,
  };

  const existing = getAllOrders();
  // Keep newest first
  saveOrders([newOrder, ...existing]);
  setCurrentOrderId(newOrder.orderId);

  // Play gentle customer confirmation chime on client device
  playCustomerUpdateChime();

  // Broadcast to cloud so Kitchen display on PC/counter tablet receives immediately!
  await publishCloudEvent({
    type: 'ORDER_CREATED',
    order: newOrder,
    timestamp: Date.now(),
  });

  return newOrder;
}

export function updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string): LiveOrder | null {
  const orders = getAllOrders();
  const index = orders.findIndex((o) => o.orderId === orderId);
  if (index === -1) return null;

  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const current = orders[index];

  const statusLabels: Record<OrderStatus, string> = {
    received: 'Order Received',
    cooking: 'On The Flame Grill',
    ready: current.orderMode === 'delivery' ? 'Packed for Driver' : 'Hot & Ready for Collection',
    dispatched: 'Out for Delivery with Driver',
    completed: 'Order Completed & Handed Over',
    cancelled: 'Order Cancelled',
  };

  const timelineEvent: OrderTimelineEvent = {
    status: newStatus,
    timestamp: nowStr,
    label: statusLabels[newStatus] || newStatus,
    note,
  };

  const updatedOrder: LiveOrder = {
    ...current,
    status: newStatus,
    timeline: [...current.timeline, timelineEvent],
  };

  orders[index] = updatedOrder;
  saveOrders(orders);

  // Broadcast status change to cloud so customer's mobile tracker updates immediately!
  publishCloudEvent({
    type: 'ORDER_UPDATED',
    orderId,
    newStatus,
    note,
    timelineEvent,
    order: updatedOrder,
    timestamp: Date.now(),
  });

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
  };
}

export function subscribeToSingleOrder(orderId: string, callback: (order: LiveOrder | null) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleUpdate = () => {
    callback(getOrderById(orderId));
  };

  window.addEventListener('wrap_wing_orders_change', handleUpdate);
  window.addEventListener('storage', handleUpdate);

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleUpdate);
  }

  // Initial emit
  callback(getOrderById(orderId));

  // Also trigger cloud sync to check if this order is in the cloud
  syncOrdersFromCloud().then(() => {
    callback(getOrderById(orderId));
  });

  return () => {
    window.removeEventListener('wrap_wing_orders_change', handleUpdate);
    window.removeEventListener('storage', handleUpdate);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleUpdate);
    }
  };
}
