import { LiveOrder, OrderStatus, OrderTimelineEvent } from '../types';
import { CheckoutPayload } from './payment';

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

// Local Storage helpers
export function getAllOrders(): LiveOrder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
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

// Publish an event to the cloud topic
async function publishCloudEvent(event: CloudOrderEvent) {
  try {
    event.senderDeviceId = DEVICE_ID;
    const bodyText = JSON.stringify(event);

    await fetch(`${NTFY_BASE_URL}/${CLOUD_TOPIC}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Title:
          event.type === 'ORDER_CREATED'
            ? `New Order #${event.order?.orderId}`
            : `Order #${event.orderId} ${event.newStatus}`,
        Priority: 'high',
      },
      body: bodyText,
    });
  } catch (err) {
    console.warn('Could not publish event to cloud order topic:', err);
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

      // Play chime if this was a real-time event from another device
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
      // Only update if status is actually different or we have a new timeline event
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

        // Notify client app with a dedicated event for customer alerts & sounds
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

// Pull historical orders from cloud (last 24h) to catch up when screen opens
export async function syncOrdersFromCloud(): Promise<LiveOrder[]> {
  if (isCloudSyncing) return getAllOrders();
  isCloudSyncing = true;

  try {
    // 1. Fetch recent messages from cloud channel
    const response = await fetch(`${NTFY_BASE_URL}/${CLOUD_TOPIC}/json?poll=1&since=24h`, {
      cache: 'no-store',
    });

    if (response.ok) {
      const text = await response.text();
      const lines = text.trim().split('\n');

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const raw = JSON.parse(line);
          if (raw.event === 'message' && raw.message) {
            const cloudEvent = JSON.parse(raw.message) as CloudOrderEvent;
            handleIncomingCloudEvent(cloudEvent, false);
          }
        } catch {
          // ignore malformed line
        }
      }
    }
  } catch (err) {
    console.warn('Cloud catch-up sync encountered an error:', err);
  } finally {
    isCloudSyncing = false;
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

export function createLiveOrder(payload: CheckoutPayload): LiveOrder {
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

  // Broadcast to cloud so Kitchen display on PC/counter tablet chimes immediately!
  publishCloudEvent({
    type: 'ORDER_CREATED',
    order: newOrder,
    timestamp: Date.now(),
  });

  // Play local chime
  playKitchenChime();

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
