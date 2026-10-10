import { ReviewDrawEntry } from '../types';
import { db } from './firebase';
import { collection, doc, setDoc, onSnapshot, query, getDocs } from 'firebase/firestore';

const STORAGE_KEY = 'wrap_wing_review_entries';
const REVIEWS_COLLECTION = 'review_draw_entries';

function getLocalEntries(): ReviewDrawEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalEntries(entries: ReviewDrawEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Could not save review entries to localStorage:', err);
  }
}

export async function saveReviewDrawEntry(
  input: Omit<ReviewDrawEntry, 'id' | 'createdAt' | 'status'> &
    Partial<Pick<ReviewDrawEntry, 'id' | 'createdAt' | 'status'>>
): Promise<ReviewDrawEntry> {
  const id =
    input.id ||
    `R500-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const createdAt = input.createdAt || new Date().toISOString();
  const status = input.status || 'pending';

  const entry: ReviewDrawEntry = {
    id,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    receiptNumber: input.receiptNumber.trim(),
    googleReviewName: input.googleReviewName.trim(),
    rating: input.rating || 5,
    comments: input.comments?.trim() || '',
    createdAt,
    status,
  };

  // 1. Save to localStorage immediately
  const current = getLocalEntries();
  const updated = [entry, ...current.filter((e) => e.id !== entry.id)];
  saveLocalEntries(updated);

  // 2. Save to Firestore if database is initialized
  if (db) {
    try {
      const docRef = doc(db, REVIEWS_COLLECTION, entry.id);
      await setDoc(docRef, entry, { merge: true });
    } catch (err) {
      console.error('Error saving review draw entry to Firestore:', err);
    }
  }

  // 3. Email notification via FormSubmit AJAX to funnelflux.assets@gmail.com
  try {
    fetch('https://formsubmit.co/ajax/funnelflux.assets@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        'Draw Entry ID': entry.id,
        'Full Name': entry.fullName,
        'WhatsApp / Cell': entry.phone,
        'Order / Receipt Number': entry.receiptNumber,
        'Google Account Name': entry.googleReviewName,
        'Star Rating': `${entry.rating || 5} / 5`,
        'Comments / Feedback': entry.comments || 'None',
        'Submission Time': new Date(entry.createdAt).toLocaleString('en-ZA'),
        _subject: `🍗 Wrap & Wings Weekly Meal Draw Entry: ${entry.fullName} (Slip #${entry.receiptNumber})`,
        _template: 'table',
        _captcha: 'false',
      }),
    }).catch((e) => console.warn('FormSubmit notification fallback:', e));
  } catch (err) {
    console.warn('FormSubmit network error:', err);
  }

  return entry;
}

export async function fetchAllReviewEntries(): Promise<ReviewDrawEntry[]> {
  const local = getLocalEntries();

  if (!db) {
    return local;
  }

  try {
    const q = query(collection(db, REVIEWS_COLLECTION));
    const snap = await getDocs(q);
    const firestoreList: ReviewDrawEntry[] = [];
    snap.forEach((d) => {
      firestoreList.push(d.data() as ReviewDrawEntry);
    });

    // Merge firestore with local
    const map = new Map<string, ReviewDrawEntry>();
    local.forEach((e) => map.set(e.id, e));
    firestoreList.forEach((e) => map.set(e.id, e));

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    saveLocalEntries(merged);
    return merged;
  } catch (err) {
    console.warn('Error fetching Firestore review entries, using local:', err);
    return local;
  }
}

export function subscribeToReviewEntries(
  callback: (entries: ReviewDrawEntry[]) => void
): () => void {
  // Fire initial local entries right away
  callback(getLocalEntries());

  if (!db) {
    const handler = () => callback(getLocalEntries());
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }

  try {
    const q = query(collection(db, REVIEWS_COLLECTION));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const firestoreList: ReviewDrawEntry[] = [];
        snapshot.forEach((d) => {
          firestoreList.push(d.data() as ReviewDrawEntry);
        });

        const local = getLocalEntries();
        const map = new Map<string, ReviewDrawEntry>();
        local.forEach((e) => map.set(e.id, e));
        firestoreList.forEach((e) => map.set(e.id, e));

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        saveLocalEntries(merged);
        callback(merged);
      },
      (error) => {
        console.warn('Firestore review subscription error:', error);
        callback(getLocalEntries());
      }
    );

    return unsubscribe;
  } catch {
    return () => {};
  }
}

export async function updateReviewEntryStatus(
  id: string,
  status: ReviewDrawEntry['status']
): Promise<void> {
  const local = getLocalEntries();
  const updated = local.map((e) => (e.id === id ? { ...e, status } : e));
  saveLocalEntries(updated);

  if (db) {
    try {
      const docRef = doc(db, REVIEWS_COLLECTION, id);
      await setDoc(docRef, { status }, { merge: true });
    } catch (err) {
      console.warn('Error updating review status in Firestore:', err);
    }
  }
}

export function exportEntriesToCsv(entries: ReviewDrawEntry[]): void {
  if (!entries || entries.length === 0) return;

  const headers = [
    'Entry ID',
    'Date & Time',
    'Customer Name',
    'WhatsApp / Cell',
    'Receipt Number',
    'Google Review Name',
    'Rating',
    'Comments',
    'Status',
  ];

  const escapeCsv = (val: any) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = entries.map((e) => [
    escapeCsv(e.id),
    escapeCsv(new Date(e.createdAt).toLocaleString('en-ZA')),
    escapeCsv(e.fullName),
    escapeCsv(e.phone),
    escapeCsv(e.receiptNumber),
    escapeCsv(e.googleReviewName),
    escapeCsv(e.rating || 5),
    escapeCsv(e.comments || ''),
    escapeCsv(e.status || 'pending'),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `wrap-and-wings-r500-draw-${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
