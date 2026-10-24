import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  onSnapshot,
  query,
  arrayUnion,
  Firestore
} from 'firebase/firestore';
import { LiveOrder, OrderStatus, OrderTimelineEvent } from '../types';

// Firebase configuration with environment fallback
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD7mtioVx_BXYHog2LxKXV7bpdDunioO3w',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'wrap-and-wings.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wrap-and-wings',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'wrap-and-wings.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '255778256491',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:255778256491:web:11358b76d7fb60a449a32e',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
);

export let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    try {
      db = initializeFirestore(app, {
        ignoreUndefinedProperties: true,
      });
    } catch {
      db = getFirestore(app);
    }
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
  }
}

const ORDERS_COLLECTION = 'orders';

/**
 * Normalizes an order ID by stripping any leading hash (#) and whitespace
 */
export function normalizeOrderId(id: string): string {
  return String(id || '').replace('#', '').trim();
}

/**
 * Deep sanitization to guarantee no `undefined` values reach Firestore
 */
export function cleanDocData<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as unknown as T;
  if (typeof obj !== 'object') return obj;
  // Preserve Firestore FieldValues (such as arrayUnion, serverTimestamp, deleteField)
  if (
    '_methodName' in (obj as any) ||
    (obj as any).constructor?.name === 'FieldValue' ||
    (obj as any).constructor?.name === 'FieldValueImpl'
  ) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanDocData).filter((x) => x !== undefined) as unknown as T;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj as Record<string, any>)) {
    if (val !== undefined) {
      cleaned[key] = cleanDocData(val);
    }
  }
  return cleaned as T;
}

/**
 * Save or create an order in Firestore
 */
export async function saveOrderToFirestore(order: LiveOrder): Promise<void> {
  if (!db || !order || !order.orderId) return;
  try {
    const cleanId = normalizeOrderId(order.orderId);
    const docRef = doc(db, ORDERS_COLLECTION, cleanId);
    const sanitized = cleanDocData({
      ...order,
      orderId: order.orderId,
      updatedAt: Date.now(),
    });
    await setDoc(docRef, sanitized, { merge: true });
  } catch (err) {
    console.error('Error saving order to Firestore:', err);
  }
}

/**
 * Update an order's status and timeline atomically in Firestore
 */
export async function updateOrderStatusInFirestore(
  orderId: string,
  newStatus: OrderStatus,
  timelineEvent?: OrderTimelineEvent,
  cookingStartedAt?: number,
  completedAt?: number
): Promise<void> {
  if (!db || !orderId) return;
  try {
    const cleanId = normalizeOrderId(orderId);
    const docRef = doc(db, ORDERS_COLLECTION, cleanId);
    const updateData: Record<string, any> = {
      status: newStatus,
      updatedAt: Date.now(),
    };
    if (typeof cookingStartedAt === 'number') {
      updateData.cookingStartedAt = cookingStartedAt;
    }
    if (typeof completedAt === 'number') {
      updateData.completedAt = completedAt;
    }
    if (timelineEvent) {
      updateData.timeline = arrayUnion(cleanDocData(timelineEvent));
    }
    await setDoc(docRef, updateData, { merge: true });
  } catch (err) {
    console.error('Error updating order status in Firestore, trying document fallback:', err);
    try {
      const cleanId = normalizeOrderId(orderId);
      const docRef = doc(db, ORDERS_COLLECTION, cleanId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const existing = snap.data();
        const existingTimeline = Array.isArray(existing.timeline) ? existing.timeline : [];
        const newTimeline = timelineEvent ? [...existingTimeline, cleanDocData(timelineEvent)] : existingTimeline;
        await setDoc(
          docRef,
          cleanDocData({
            ...existing,
            status: newStatus,
            timeline: newTimeline,
            cookingStartedAt: cookingStartedAt !== undefined ? cookingStartedAt : existing.cookingStartedAt,
            completedAt: completedAt !== undefined ? completedAt : existing.completedAt,
            updatedAt: Date.now(),
          }),
          { merge: true }
        );
      }
    } catch (fallbackErr) {
      console.error('Firestore fallback update also failed:', fallbackErr);
    }
  }
}

/**
 * Fetch all active orders directly from Firestore
 */
export async function fetchOrdersFromFirestore(): Promise<LiveOrder[]> {
  if (!db) return [];
  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const snapshot = await getDocs(ordersRef);
    const orders: LiveOrder[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as LiveOrder;
      if (data && data.orderId) {
        orders.push(data);
      }
    });
    return orders;
  } catch (err) {
    console.warn('Error fetching orders from Firestore:', err);
    return [];
  }
}

/**
 * Fetch a single order directly from Firestore
 */
export async function fetchSingleOrderFromFirestore(orderId: string): Promise<LiveOrder | null> {
  if (!db || !orderId) return null;
  try {
    const cleanId = normalizeOrderId(orderId);
    const docRef = doc(db, ORDERS_COLLECTION, cleanId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as LiveOrder;
    }
    return null;
  } catch (err) {
    console.warn(`Error fetching single order ${orderId} from Firestore:`, err);
    return null;
  }
}

/**
 * Real-time listener for ALL orders (used by Kitchen Display System & Navbar)
 * Uses Firestore onSnapshot for sub-second, battery-efficient updates without polling
 */
export function subscribeToFirestoreOrders(
  callback: (orders: LiveOrder[]) => void
): () => void {
  if (!db) return () => {};

  try {
    const ordersRef = collection(db, ORDERS_COLLECTION);
    const q = query(ordersRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const orders: LiveOrder[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as LiveOrder;
          if (data && data.orderId) {
            orders.push(data);
          }
        });
        callback(orders);
      },
      (error) => {
        console.warn('Firestore orders subscription error:', error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Could not establish Firestore subscription:', err);
    return () => {};
  }
}

/**
 * Real-time listener for a SINGLE order (used by Customer OrderTrackerView)
 * Updates instantly the exact millisecond Kitchen marks 'cooking', 'ready', or 'dispatched'
 */
export function subscribeToSingleFirestoreOrder(
  orderId: string,
  callback: (order: LiveOrder | null) => void
): () => void {
  if (!db || !orderId) return () => {};

  try {
    const cleanId = normalizeOrderId(orderId);
    const docRef = doc(db, ORDERS_COLLECTION, cleanId);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as LiveOrder);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.warn(`Firestore order ${orderId} subscription error:`, error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Could not establish single order Firestore subscription:', err);
    return () => {};
  }
}

/**
 * Delete an order from Firestore
 */
export async function deleteOrderFromFirestore(orderId: string): Promise<void> {
  if (!db || !orderId) return;
  try {
    const cleanId = normalizeOrderId(orderId);
    const docRef = doc(db, ORDERS_COLLECTION, cleanId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting order from Firestore:', err);
  }
}
