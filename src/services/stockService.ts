import { db, isFirebaseConfigured } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const STORAGE_KEY = 'wrap_wing_out_of_stock_ids';
const CHANNEL_NAME = 'wrap_wing_stock_channel';
const FIRESTORE_COLLECTION = 'wrap_wing_store_config';
const FIRESTORE_DOC = 'stock_status';
const NTFY_BASE_URL = 'https://ntfy.sh';
const STOCK_TOPIC = 'wrap_and_wing_stock_shop1';
const ORDERS_TOPIC = 'wrap_and_wing_live_orders_shop1';

// In-tab BroadcastChannel for instant same-browser cross-tab sync
let stockBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    stockBroadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch {
  stockBroadcastChannel = null;
}

// Active subscriber callbacks
const stockSubscribers = new Set<(ids: string[]) => void>();

function notifyStockSubscribers(ids: string[]): void {
  stockSubscribers.forEach((cb) => {
    try {
      cb(ids);
    } catch (err) {
      console.warn('Error in stock subscriber callback:', err);
    }
  });
}

// Read current cached out of stock IDs from localStorage
export function getOutOfStockItemIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Check if an item is out of stock
export function isItemOutOfStock(itemId: string): boolean {
  if (!itemId) return false;
  const list = getOutOfStockItemIds();
  return list.includes(itemId);
}

// Internal helper to save to localStorage and broadcast locally
function saveLocalOutOfStockIds(ids: string[], notify = true): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    if (notify) {
      if (stockBroadcastChannel) {
        try {
          stockBroadcastChannel.postMessage({ type: 'STOCK_CHANGED', outOfStockItemIds: ids });
        } catch {}
      }
      window.dispatchEvent(
        new CustomEvent('wrap_wing_stock_status_updated', {
          detail: { outOfStockItemIds: ids },
        })
      );
      notifyStockSubscribers(ids);
    }
  } catch (err) {
    console.warn('Could not save out of stock ids to localStorage:', err);
  }
}

// Fast broadcast to cloud topics for sub-second cross-device push (<300ms)
async function broadcastStockChangeToCloud(ids: string[]): Promise<void> {
  const payload = JSON.stringify({
    type: 'STOCK_CHANGED',
    outOfStockItemIds: ids,
    timestamp: Date.now(),
  });

  const topics = [STOCK_TOPIC, ORDERS_TOPIC];
  for (const topic of topics) {
    try {
      fetch(`${NTFY_BASE_URL}/${topic}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }).catch(() => {});
    } catch {}
  }
}

// Toggle or explicitly set an item's stock status
export async function setItemStockStatus(itemId: string, inStock: boolean): Promise<string[]> {
  const current = getOutOfStockItemIds();
  let updated: string[];

  if (inStock) {
    // Remove from out-of-stock list
    updated = current.filter((id) => id !== itemId);
  } else {
    // Add to out-of-stock list
    if (!current.includes(itemId)) {
      updated = [...current, itemId];
    } else {
      updated = current;
    }
  }

  // 1. Instant local optimistic update (0ms delay)
  saveLocalOutOfStockIds(updated, true);

  // 2. Instant sub-second cloud push across all phones/tablets via SSE (<300ms)
  broadcastStockChangeToCloud(updated);

  // 3. Persist to Firestore database
  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC);
      await setDoc(
        docRef,
        {
          outOfStockItemIds: updated,
          lastUpdated: Date.now(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not update stock status in Firestore:', err);
    }
  }

  return updated;
}

// Reset all items to in-stock (used at shift start or fresh stock arrival)
export async function resetAllToInStock(): Promise<void> {
  const updated: string[] = [];
  saveLocalOutOfStockIds(updated, true);
  broadcastStockChangeToCloud(updated);

  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC);
      await setDoc(
        docRef,
        {
          outOfStockItemIds: updated,
          lastUpdated: Date.now(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('Could not reset stock status in Firestore:', err);
    }
  }
}

// Fetch stock directly from Firestore once (for page load, tab wake, focus)
export async function fetchStockFromFirestore(): Promise<string[]> {
  if (!db || !isFirebaseConfigured) return getOutOfStockItemIds();
  try {
    const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data && Array.isArray(data.outOfStockItemIds)) {
        saveLocalOutOfStockIds(data.outOfStockItemIds, false);
        notifyStockSubscribers(data.outOfStockItemIds);
        return data.outOfStockItemIds;
      }
    }
  } catch (err) {
    console.warn('Could not fetch stock status from Firestore:', err);
  }
  return getOutOfStockItemIds();
}

// Singleton listener state
let isCloudSyncInitialized = false;
let stockEventSource: EventSource | null = null;
let unsubFirestore: (() => void) | null = null;

function initStockCloudSync(): void {
  if (typeof window === 'undefined' || isCloudSyncInitialized) return;
  isCloudSyncInitialized = true;

  // 1. Immediate fetch from Firestore to verify fresh state
  fetchStockFromFirestore();

  // 2. Real-time SSE push listener from ntfy.sh (sub-second cross-device push)
  if (!stockEventSource && typeof EventSource !== 'undefined') {
    try {
      stockEventSource = new EventSource(`${NTFY_BASE_URL}/${STOCK_TOPIC}/sse`);
      stockEventSource.onmessage = (e) => {
        try {
          const raw = JSON.parse(e.data);
          if (raw.event === 'message' && raw.message) {
            const data = JSON.parse(raw.message);
            if (data.type === 'STOCK_CHANGED' && Array.isArray(data.outOfStockItemIds)) {
              saveLocalOutOfStockIds(data.outOfStockItemIds, false);
              notifyStockSubscribers(data.outOfStockItemIds);
            }
          }
        } catch (err) {
          console.warn('Error parsing stock SSE message:', err);
        }
      };
      stockEventSource.onerror = () => {
        // SSE auto-reconnects
      };
    } catch (err) {
      console.warn('Could not connect to stock EventSource:', err);
    }
  }

  // 3. Re-sync on visibilitychange (e.g. mobile screen unlock or tab foreground)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      fetchStockFromFirestore();
    }
  });

  window.addEventListener('focus', () => {
    fetchStockFromFirestore();
  });

  window.addEventListener('online', () => {
    fetchStockFromFirestore();
  });

  // 4. Local storage event listener (across browser tabs on same device)
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      const ids = getOutOfStockItemIds();
      notifyStockSubscribers(ids);
    }
  });

  // 5. BroadcastChannel listener (instant same-browser cross-tab)
  if (stockBroadcastChannel) {
    stockBroadcastChannel.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'STOCK_CHANGED' && Array.isArray(e.data.outOfStockItemIds)) {
        saveLocalOutOfStockIds(e.data.outOfStockItemIds, false);
        notifyStockSubscribers(e.data.outOfStockItemIds);
      }
    });
  }

  // 6. Window custom event listener
  window.addEventListener('wrap_wing_stock_status_updated', (e: Event) => {
    const custom = e as CustomEvent<{ outOfStockItemIds?: string[] }>;
    if (custom.detail?.outOfStockItemIds) {
      saveLocalOutOfStockIds(custom.detail.outOfStockItemIds, false);
      notifyStockSubscribers(custom.detail.outOfStockItemIds);
    } else {
      const ids = getOutOfStockItemIds();
      notifyStockSubscribers(ids);
    }
  });

  // 7. Real-time Cloud Firestore subscription
  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC);
      unsubFirestore = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && Array.isArray(data.outOfStockItemIds)) {
              saveLocalOutOfStockIds(data.outOfStockItemIds, false);
              notifyStockSubscribers(data.outOfStockItemIds);
            }
          }
        },
        (err) => {
          console.warn('Stock status Firestore subscription warning:', err);
        }
      );
    } catch (err) {
      console.warn('Could not establish stock Firestore subscription:', err);
    }
  }
}

// Automatically initialize cloud sync in browser environments
if (typeof window !== 'undefined') {
  initStockCloudSync();
}

// Subscribe to real-time stock changes across tabs, devices, and Firestore
export function subscribeToStockStatus(callback: (outOfStockIds: string[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  stockSubscribers.add(callback);

  // 1. Immediately emit current cached list
  callback(getOutOfStockItemIds());

  // 2. Ensure cloud sync listener is active
  initStockCloudSync();

  return () => {
    stockSubscribers.delete(callback);
  };
}
