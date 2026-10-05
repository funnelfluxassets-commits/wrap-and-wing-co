import { LiveOrder, OrderStatus, OrderTimelineEvent } from '../types';
import { CheckoutPayload } from './payment';

const STORAGE_KEY = 'wrap_wing_live_orders';
const CURRENT_ORDER_KEY = 'wrap_wing_current_order_id';
const CHANNEL_NAME = 'wrap_wing_orders_channel';

// Web Audio API Ding-Dong Chime for Kitchen Display
export function playKitchenChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

// Broadcast Channel for live multi-tab & multi-window instant sync
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
  // Dispatch local window custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wrap_wing_orders_change'));
  }
}

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

export function saveOrders(orders: LiveOrder[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    notifySubscribers();
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
  return localStorage.getItem(CURRENT_ORDER_KEY);
}

export function setCurrentOrderId(orderId: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_ORDER_KEY, orderId);
}

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

  // Play kitchen notification chime
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

  return () => {
    window.removeEventListener('wrap_wing_orders_change', handleUpdate);
    window.removeEventListener('storage', handleUpdate);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleUpdate);
    }
  };
}
