import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
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
    db = getFirestore(app);
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
  }
}

const ORDERS_COLLECTION = 'orders';

/**
 * Save or create an order in Firestore
 */
export async function saveOrderToFirestore(order: LiveOrder): Promise<void> {
  if (!db || !order || !order.orderId) return;
  try {
    const docRef = doc(db, ORDERS_COLLECTION, order.orderId);
    await setDoc(docRef, order, { merge: true });
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
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    const updateData: Record<string, any> = { status: newStatus };
    if (timelineEvent) {
      updateData.timeline = arrayUnion(timelineEvent);
    }
    if (cookingStartedAt) {
      updateData.cookingStartedAt = cookingStartedAt;
    }
    if (completedAt) {
      updateData.completedAt = completedAt;
    }
    await setDoc(docRef, updateData, { merge: true });
  } catch (err) {
    console.error('Error updating order status in Firestore:', err);
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
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
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
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting order from Firestore:', err);
  }
}
