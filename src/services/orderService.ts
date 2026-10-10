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

// Web Audio API Ding-Dong Chime for Kitchen Display (New Order Arrival & Status Progression)
export function playKitchenChime() {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First Tone: High Ding (880 Hz - A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.4, now + 0.04);
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
    gain2.gain.linearRampToValueAtTime(0.45, now + 0.19);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 1.1);
  } catch (err) {
    console.warn('Audio chime could not play:', err);
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

export const DEFAULT_INITIAL_ORDERS: LiveOrder[] = [];

const DEMO_CUSTOMER_NAMES = new Set(['Sipho Khumalo', 'Thabo Mbeki', 'Sarah Jenkins']);


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
    // Sanitize and filter out invalid orders, plus purge any legacy demo orders
    const valid = parsed
      .filter((o): o is LiveOrder => Boolean(o && typeof o === 'object' && o.orderId))
      .filter((o) => {
        const name = o.customer?.customerName || '';
        const isDemoName = DEMO_CUSTOMER_NAMES.has(name);
        const isDemoId =
          o.orderId === `D-${todayDay}01` ||
          o.orderId === `D-${todayDay}02` ||
          o.orderId === `C-${todayDay}01` ||
          (isDemoName && ['D-', 'C-'].some((p) => o.orderId.startsWith(p)));
        return !isDemoName && !isDemoId;
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
        timeline: Array.isArray(o.timeline) ? o.timeline : [],
        status: o.status || 'received',
        orderMode: o.orderMode || 'delivery',
        paymentMethod: o.paymentMethod || 'cod',
        paymentStatus: o.paymentStatus || 'pending',
        preferredTime: o.preferredTime || 'ASAP',
        createdAt: o.createdAt || 'Just now',
      }));

    if (valid.length !== parsed.length) {
      // Clean up localStorage to permanently remove any leftover demo tickets
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
  saveOrders([], true);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CURRENT_ORDER_KEY);
  }
  return [];
}

export function getOrderById(orderId: string): LiveOrder | null {
  const cleanId = orderId.replace('#', '').trim();
  const orders = getAllOrders();
  return orders.find((o) => o.orderId === orderId || o.orderId?.replace('#', '').trim() === cleanId) || null;
}

export function getCurrentOrderId(): string | null {
  if (typeof window === 'undefined') return null;
  const direct = localStorage.getItem(CURRENT_ORDER_KEY);
  if (!direct) return null;
  const clean = direct.replace('#', '').trim();
  const orders = getAllOrders();
  const order = orders.find(
    (o) => o.orderId === direct || o.orderId?.replace('#', '').trim() === clean
  );
  // If order does not exist or has finished (completed or cancelled), it is removed from customer device
  if (!order || order.status === 'completed' || order.status === 'cancelled') {
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

export function clearCurrentOrder() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CURRENT_ORDER_KEY);
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
  type: 'ORDER_CREATED' | 'ORDER_UPDATED' | 'ORDER_DELETED';
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

  const currentOrders = getAllOrders();

  if (event.type === 'ORDER_DELETED' && event.orderId) {
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

      // If completed or cancelled, remove from customer device active storage
      if (typeof window !== 'undefined' && (newStatus === 'completed' || newStatus === 'cancelled')) {
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

// Pull orders from same-domain /api/orders and persistent GitHub Issue #1 Master Store
export async function syncOrdersFromCloud(): Promise<LiveOrder[]> {
  try {
    let cloudOrders: LiveOrder[] | null = null;

    // 1. Primary: Check same-domain /api/orders
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const apiResp = await fetch('/api/orders', {
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (apiResp.ok) {
        const data = await apiResp.json();
        if (Array.isArray(data) && data.length > 0) {
          cloudOrders = data;
        }
      }
    } catch {}

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
      epochTime: Date.now(),
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

  // Instant real-time broadcast via Firestore if configured
  if (isFirebaseConfigured) {
    saveOrderToFirestore(newOrder).catch((e) => console.warn('Firestore order save error:', e));
  }

  // Broadcast to cloud so Kitchen display on PC/counter tablet receives immediately!
  await publishCloudEvent({
    type: 'ORDER_CREATED',
    order: newOrder,
    timestamp: Date.now(),
  });

  return newOrder;
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

  // If order is completed or cancelled, remove from customer device active storage so it disappears
  if (typeof window !== 'undefined' && (newStatus === 'completed' || newStatus === 'cancelled')) {
    const currentActiveId = localStorage.getItem(CURRENT_ORDER_KEY);
    if (currentActiveId === orderId || currentActiveId?.replace('#', '').trim() === cleanId) {
      localStorage.removeItem(CURRENT_ORDER_KEY);
    }
  }

  // Instant real-time status progression in Firestore if configured
  if (isFirebaseConfigured) {
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
          if (o && o.orderId) orderMap.set(o.orderId, o);
        }
        for (const f of firestoreOrders) {
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

  // Real-time instant single-order stream via Firestore if configured
  let unsubFirestore: (() => void) | null = null;
  if (isFirebaseConfigured) {
    unsubFirestore = subscribeToSingleFirestoreOrder(orderId, (liveOrder) => {
      if (liveOrder) {
        const local = getOrderById(orderId);
        const localRank = local ? STATUS_RANK[local.status] || 0 : 0;
        const cloudRank = STATUS_RANK[liveOrder.status] || 0;
        const resolved = cloudRank >= localRank ? liveOrder : (local || liveOrder);
        callback(resolved);
      }
    });
  }

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
    if (unsubFirestore) {
      unsubFirestore();
    }
  };
}
