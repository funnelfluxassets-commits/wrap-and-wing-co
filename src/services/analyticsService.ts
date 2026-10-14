import { db } from './firebase';
import { doc, setDoc, onSnapshot, getDoc, collection, getDocs } from 'firebase/firestore';

export interface TrafficDailyDoc {
  date: string; // YYYY-MM-DD
  totalPageViews: number;
  uniqueVisitorIds: string[];
  sources: {
    google_gmb: number;
    whatsapp: number;
    social: number;
    direct: number;
  };
  devices: {
    ios: number;
    android: number;
    desktop: number;
  };
  hourlyFootfall: Record<number, number>; // 0..23
  popularItems: Record<string, number>; // Item name -> view/click count
  orderedItems: Record<string, number>; // Item name -> quantity actually ordered
  totalOrderedQuantity: number; // total units of food items ordered
  flavourPreferences: Record<string, number>; // lemony, mild, bbq, sweet_chilli, hot
  funnel: {
    menuViews: number;
    cartAdds: number;
    checkoutStarts: number;
    ordersCompleted: number;
  };
  directActions: {
    whatsappChat: number;
    phoneCall: number;
    directions: number;
    reviewDraw: number;
  };
  lastActive: number; // epoch ms
}

export interface LiveVisitorPing {
  visitorId: string;
  sessionId: string;
  lastPing: number;
  device: string;
  source: string;
}

const STORAGE_PREFIX = 'wrap_wing_traffic_';
const LIVE_PING_KEY = 'wrap_wing_live_pings';
const TRAFFIC_COLLECTION = 'customer_traffic_daily';

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server';
  let vid = localStorage.getItem('ww_visitor_id');
  if (!vid) {
    vid = 'V-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
    localStorage.setItem('ww_visitor_id', vid);
  }
  return vid;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  let sid = sessionStorage.getItem('ww_session_id');
  if (!sid) {
    sid = 'S-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    sessionStorage.setItem('ww_session_id', sid);
  }
  return sid;
}

function detectSource(): 'google_gmb' | 'whatsapp' | 'social' | 'direct' {
  if (typeof window === 'undefined') return 'direct';
  const url = window.location.href.toLowerCase();
  const ref = (document.referrer || '').toLowerCase();

  if (
    url.includes('utm_source=google') ||
    url.includes('utm_source=gmb') ||
    url.includes('gclid') ||
    ref.includes('google.com') ||
    ref.includes('google.co.za') ||
    ref.includes('maps.google')
  ) {
    return 'google_gmb';
  }

  if (
    url.includes('utm_source=whatsapp') ||
    url.includes('ref=whatsapp') ||
    ref.includes('whatsapp') ||
    ref.includes('wa.me')
  ) {
    return 'whatsapp';
  }

  if (
    url.includes('utm_source=instagram') ||
    url.includes('utm_source=facebook') ||
    url.includes('utm_source=tiktok') ||
    ref.includes('instagram.com') ||
    ref.includes('facebook.com') ||
    ref.includes('tiktok.com') ||
    ref.includes('t.co')
  ) {
    return 'social';
  }

  return 'direct';
}

function detectDevice(): 'ios' | 'android' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

function getEmptyDailyDoc(date: string): TrafficDailyDoc {
  return {
    date,
    totalPageViews: 0,
    uniqueVisitorIds: [],
    sources: {
      google_gmb: 0,
      whatsapp: 0,
      social: 0,
      direct: 0,
    },
    devices: {
      ios: 0,
      android: 0,
      desktop: 0,
    },
    hourlyFootfall: {},
    popularItems: {},
    orderedItems: {},
    totalOrderedQuantity: 0,
    flavourPreferences: {
      lemony: 0,
      mild: 0,
      bbq: 0,
      sweet_chilli: 0,
      hot: 0,
    },
    funnel: {
      menuViews: 0,
      cartAdds: 0,
      checkoutStarts: 0,
      ordersCompleted: 0,
    },
    directActions: {
      whatsappChat: 0,
      phoneCall: 0,
      directions: 0,
      reviewDraw: 0,
    },
    lastActive: Date.now(),
  };
}

function loadLocalDailyDoc(date: string): TrafficDailyDoc {
  if (typeof window === 'undefined') return getEmptyDailyDoc(date);
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + date);
    if (raw) {
      const parsed: TrafficDailyDoc = { ...getEmptyDailyDoc(date), ...JSON.parse(raw) };
      const uniqueCount = parsed.uniqueVisitorIds?.length || 0;
      const sourcesSum =
        (parsed.sources?.google_gmb || 0) +
        (parsed.sources?.whatsapp || 0) +
        (parsed.sources?.social || 0) +
        (parsed.sources?.direct || 0);
      if (sourcesSum < uniqueCount) {
        parsed.sources.direct = (parsed.sources.direct || 0) + (uniqueCount - sourcesSum);
      }

      const devicesSum =
        (parsed.devices?.ios || 0) +
        (parsed.devices?.android || 0) +
        (parsed.devices?.desktop || 0);
      if (devicesSum < uniqueCount) {
        parsed.devices.desktop = (parsed.devices.desktop || 0) + (uniqueCount - devicesSum);
      }
      return parsed;
    }
  } catch (e) {
    console.warn('Could not read local traffic doc:', e);
  }
  return getEmptyDailyDoc(date);
}

function saveLocalDailyDoc(docData: TrafficDailyDoc): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + docData.date, JSON.stringify(docData));
  } catch (e) {
    console.warn('Could not save local traffic doc:', e);
  }
}

let syncTimeout: any = null;

async function syncDailyDocToFirestore(docData: TrafficDailyDoc): Promise<void> {
  if (!db) return;
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(async () => {
    try {
      const docRef = doc(db, TRAFFIC_COLLECTION, docData.date);
      await setDoc(docRef, docData, { merge: true });
    } catch (err) {
      console.warn('Error syncing traffic to Firestore:', err);
    }
  }, 1200);
}

/**
 * Record a heartbeat ping for "Live Visitors Online Right Now"
 */
function recordLivePing(): void {
  if (typeof window === 'undefined') return;
  try {
    const vid = getVisitorId();
    const sid = getSessionId();
    const now = Date.now();
    const raw = localStorage.getItem(LIVE_PING_KEY);
    let pings: LiveVisitorPing[] = raw ? JSON.parse(raw) : [];

    // Filter out pings older than 10 minutes
    pings = pings.filter((p) => now - p.lastPing < 10 * 60 * 1000 && p.visitorId !== vid);
    pings.push({
      visitorId: vid,
      sessionId: sid,
      lastPing: now,
      device: detectDevice(),
      source: detectSource(),
    });

    localStorage.setItem(LIVE_PING_KEY, JSON.stringify(pings));
  } catch {}
}

export function getLiveVisitorsCount(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = localStorage.getItem(LIVE_PING_KEY);
    if (!raw) return 1;
    const now = Date.now();
    const pings: LiveVisitorPing[] = JSON.parse(raw);
    const active = pings.filter((p) => now - p.lastPing < 10 * 60 * 1000);
    return Math.max(1, active.length);
  } catch {
    return 1;
  }
}

/**
 * Log a page view event (e.g. 'menu', 'story', 'team', etc.)
 */
export function logPageView(page: string): void {
  if (typeof window === 'undefined') return;

  // Never count internal staff or manager views in customer dining room analytics
  const cleanPage = (page || '').toLowerCase();
  if (['admin', 'kitchen', 'delivery', 'dispatch'].includes(cleanPage)) return;
  if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('wrap_wing_staff_role')) return;

  const today = getTodayString();
  const current = loadLocalDailyDoc(today);
  const vid = getVisitorId();
  const src = detectSource();
  const dev = detectDevice();
  const hour = new Date().getHours();

  current.totalPageViews += 1;
  if (!current.uniqueVisitorIds.includes(vid)) {
    current.uniqueVisitorIds.push(vid);
    current.sources[src] = (current.sources[src] || 0) + 1;
    current.devices[dev] = (current.devices[dev] || 0) + 1;
  }

  current.hourlyFootfall[hour] = (current.hourlyFootfall[hour] || 0) + 1;
  if (page === 'menu') {
    current.funnel.menuViews += 1;
  }
  current.lastActive = Date.now();

  saveLocalDailyDoc(current);
  syncDailyDocToFirestore(current);
  recordLivePing();
}

/**
 * Log when a user views or opens a menu item modal
 */
export function logItemView(itemName: string): void {
  if (typeof window === 'undefined' || !itemName) return;
  const today = getTodayString();
  const current = loadLocalDailyDoc(today);
  current.popularItems[itemName] = (current.popularItems[itemName] || 0) + 1;
  current.lastActive = Date.now();

  saveLocalDailyDoc(current);
  syncDailyDocToFirestore(current);
  recordLivePing();
}

/**
 * Log when a customer selects a basting sauce flavour
 */
export function logFlavourSelect(flavour: string): void {
  if (typeof window === 'undefined' || !flavour) return;
  const clean = flavour.toLowerCase().replace(/[^a-z_]/g, '');
  const today = getTodayString();
  const current = loadLocalDailyDoc(today);

  current.flavourPreferences[clean] = (current.flavourPreferences[clean] || 0) + 1;
  current.lastActive = Date.now();

  saveLocalDailyDoc(current);
  syncDailyDocToFirestore(current);
}

/**
 * Log an item added to cart
 */
export function logAddToCart(itemName: string): void {
  if (typeof window === 'undefined') return;
  const today = getTodayString();
  const current = loadLocalDailyDoc(today);

  current.funnel.cartAdds += 1;
  if (itemName) {
    current.popularItems[itemName] = (current.popularItems[itemName] || 0) + 1;
  }
  current.lastActive = Date.now();

  saveLocalDailyDoc(current);
  syncDailyDocToFirestore(current);
  recordLivePing();
}

/**
 * Log when checkout modal is opened
 */
export function logCheckoutStart(): void {
  if (typeof window === 'undefined') return;
  const today = getTodayString();
  const current = loadLocalDailyDoc(today);

  current.funnel.checkoutStarts += 1;
  current.lastActive = Date.now();

  saveLocalDailyDoc(current);
  syncDailyDocToFirestore(current);
}

/**
 * Log when an order is submitted successfully with exact items and quantities
 */
export function logOrderCompleted(items?: { name: string; quantity: number }[]): void {
  if (typeof window === 'undefined') return;
  const today = getTodayString();
  const current = loadLocalDailyDoc(today);

  current.funnel.ordersCompleted += 1;
  if (!current.orderedItems) current.orderedItems = {};
  if (typeof current.totalOrderedQuantity !== 'number') current.totalOrderedQuantity = 0;

  if (items && Array.isArray(items)) {
    for (const item of items) {
      if (item && item.name) {
        const qty = Number(item.quantity) || 1;
        current.orderedItems[item.name] = (current.orderedItems[item.name] || 0) + qty;
        current.totalOrderedQuantity += qty;
      }
    }
  }

  current.lastActive = Date.now();

  saveLocalDailyDoc(current);
  syncDailyDocToFirestore(current);
}

/**
 * Log direct customer actions (WhatsApp, phone call, navigation, review competition)
 */
export function logDirectAction(action: 'whatsappChat' | 'phoneCall' | 'directions' | 'reviewDraw'): void {
  if (typeof window === 'undefined') return;
  const today = getTodayString();
  const current = loadLocalDailyDoc(today);

  current.directActions[action] = (current.directActions[action] || 0) + 1;
  current.lastActive = Date.now();

  saveLocalDailyDoc(current);
  syncDailyDocToFirestore(current);
  recordLivePing();
}

/**
 * Get aggregated traffic metrics for Admin Portal view
 */
export function getTrafficSummary(range: 'today' | 'yesterday' | 'week' | 'all'): TrafficDailyDoc {
  const today = getTodayString();

  if (range === 'today') {
    return loadLocalDailyDoc(today);
  }

  if (range === 'yesterday') {
    const yDate = new Date();
    yDate.setDate(yDate.getDate() - 1);
    const yStr = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, '0')}-${String(
      yDate.getDate()
    ).padStart(2, '0')}`;
    return loadLocalDailyDoc(yStr);
  }

  // Aggregate over past 7 days or all local days
  const result = getEmptyDailyDoc(range === 'week' ? 'Past 7 Days' : 'All Time');
  const daysToScan = range === 'week' ? 7 : 30;

  for (let i = 0; i < daysToScan; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')}`;
    const dayDoc = loadLocalDailyDoc(dStr);

    result.totalPageViews += dayDoc.totalPageViews;
    for (const vid of dayDoc.uniqueVisitorIds) {
      if (!result.uniqueVisitorIds.includes(vid)) {
        result.uniqueVisitorIds.push(vid);
      }
    }

    result.sources.google_gmb += dayDoc.sources.google_gmb || 0;
    result.sources.whatsapp += dayDoc.sources.whatsapp || 0;
    result.sources.social += dayDoc.sources.social || 0;
    result.sources.direct += dayDoc.sources.direct || 0;

    result.devices.ios += dayDoc.devices.ios || 0;
    result.devices.android += dayDoc.devices.android || 0;
    result.devices.desktop += dayDoc.devices.desktop || 0;

    for (const [h, count] of Object.entries(dayDoc.hourlyFootfall || {})) {
      const hr = Number(h);
      result.hourlyFootfall[hr] = (result.hourlyFootfall[hr] || 0) + count;
    }

    for (const [item, count] of Object.entries(dayDoc.popularItems || {})) {
      result.popularItems[item] = (result.popularItems[item] || 0) + count;
    }

    for (const [item, qty] of Object.entries(dayDoc.orderedItems || {})) {
      result.orderedItems[item] = (result.orderedItems[item] || 0) + qty;
    }
    result.totalOrderedQuantity += dayDoc.totalOrderedQuantity || 0;

    for (const [flv, count] of Object.entries(dayDoc.flavourPreferences || {})) {
      result.flavourPreferences[flv] = (result.flavourPreferences[flv] || 0) + count;
    }

    result.funnel.menuViews += dayDoc.funnel.menuViews || 0;
    result.funnel.cartAdds += dayDoc.funnel.cartAdds || 0;
    result.funnel.checkoutStarts += dayDoc.funnel.checkoutStarts || 0;
    result.funnel.ordersCompleted += dayDoc.funnel.ordersCompleted || 0;

    result.directActions.whatsappChat += dayDoc.directActions.whatsappChat || 0;
    result.directActions.phoneCall += dayDoc.directActions.phoneCall || 0;
    result.directActions.directions += dayDoc.directActions.directions || 0;
    result.directActions.reviewDraw += dayDoc.directActions.reviewDraw || 0;
  }

  return result;
}

/**
 * Subscribe to real-time traffic updates from Firestore
 */
export function subscribeToTraffic(callback: () => void): () => void {
  if (!db) {
    const interval = setInterval(callback, 8000);
    return () => clearInterval(interval);
  }

  const today = getTodayString();
  const docRef = doc(db, TRAFFIC_COLLECTION, today);
  const unsub = onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        const cloudData = snap.data() as TrafficDailyDoc;
        const local = loadLocalDailyDoc(today);
        // Merge cloud with local
        const mergedUniqueVisitors = Array.from(
          new Set([...(local.uniqueVisitorIds || []), ...(cloudData.uniqueVisitorIds || [])])
        );

        const mergedSources = {
          google_gmb: Math.max(local.sources?.google_gmb || 0, cloudData.sources?.google_gmb || 0),
          whatsapp: Math.max(local.sources?.whatsapp || 0, cloudData.sources?.whatsapp || 0),
          social: Math.max(local.sources?.social || 0, cloudData.sources?.social || 0),
          direct: Math.max(local.sources?.direct || 0, cloudData.sources?.direct || 0),
        };
        const sourcesSum =
          mergedSources.google_gmb +
          mergedSources.whatsapp +
          mergedSources.social +
          mergedSources.direct;
        if (sourcesSum < mergedUniqueVisitors.length) {
          mergedSources.direct += (mergedUniqueVisitors.length - sourcesSum);
        }

        const mergedDevices = {
          ios: Math.max(local.devices?.ios || 0, cloudData.devices?.ios || 0),
          android: Math.max(local.devices?.android || 0, cloudData.devices?.android || 0),
          desktop: Math.max(local.devices?.desktop || 0, cloudData.devices?.desktop || 0),
        };
        const devicesSum = mergedDevices.ios + mergedDevices.android + mergedDevices.desktop;
        if (devicesSum < mergedUniqueVisitors.length) {
          mergedDevices.desktop += (mergedUniqueVisitors.length - devicesSum);
        }

        const merged: TrafficDailyDoc = {
          ...cloudData,
          totalPageViews: Math.max(local.totalPageViews, cloudData.totalPageViews || 0),
          uniqueVisitorIds: mergedUniqueVisitors,
          sources: mergedSources,
          devices: mergedDevices,
        };
        saveLocalDailyDoc(merged);
      }
      callback();
    },
    (err) => {
      console.warn('Traffic snapshot warning:', err);
    }
  );

  return unsub;
}

/**
 * Reset daily traffic metrics (clears local and cloud records for target date)
 */
export async function resetDailyTraffic(dateStr?: string): Promise<void> {
  const targetDate = dateStr === 'today' || !dateStr ? getTodayString() : dateStr;
  const emptyDoc = getEmptyDailyDoc(targetDate);
  saveLocalDailyDoc(emptyDoc);
  if (db) {
    try {
      const docRef = doc(db, TRAFFIC_COLLECTION, targetDate);
      await setDoc(docRef, emptyDoc);
    } catch (e) {
      console.warn('Error resetting cloud traffic doc:', e);
    }
  }
}

/**
 * Export traffic summary as downloadable CSV
 */
export function exportTrafficToCsv(summary: TrafficDailyDoc, rangeLabel: string): void {
  const headers = ['Metric Category', 'Detail', 'Count / Value'];
  const rows: string[][] = [
    ['Overview', 'Reporting Period', rangeLabel],
    ['Overview', 'Total Page Views', String(summary.totalPageViews)],
    ['Overview', 'Unique Visitors', String(summary.uniqueVisitorIds.length)],
    ['Overview', 'Live Customers Online Now', String(getLiveVisitorsCount())],
    ['', '', ''],
    ['Traffic Sources', 'Google Business / Maps', String(summary.sources.google_gmb)],
    ['Traffic Sources', 'WhatsApp Links', String(summary.sources.whatsapp)],
    ['Traffic Sources', 'Social Media', String(summary.sources.social)],
    ['Traffic Sources', 'Direct Navigation', String(summary.sources.direct)],
    ['', '', ''],
    ['Devices', 'iPhone / iPad (iOS)', String(summary.devices.ios)],
    ['Devices', 'Android Phones', String(summary.devices.android)],
    ['Devices', 'Desktop / Laptop', String(summary.devices.desktop)],
    ['', '', ''],
    ['Ordering Funnel', 'Menu Browsing Sessions', String(summary.funnel.menuViews)],
    ['Ordering Funnel', 'Items Added to Cart', String(summary.funnel.cartAdds)],
    ['Ordering Funnel', 'Checkout Initiated', String(summary.funnel.checkoutStarts)],
    ['Ordering Funnel', 'Orders Successfully Completed', String(summary.funnel.ordersCompleted)],
    ['', '', ''],
    ['Direct Actions', '1-Tap WhatsApp Clicks', String(summary.directActions.whatsappChat)],
    ['Direct Actions', 'Call Store Clicks', String(summary.directActions.phoneCall)],
    ['Direct Actions', 'Maps / Waze Navigation Taps', String(summary.directActions.directions)],
    ['Direct Actions', 'Review Competition Submissions', String(summary.directActions.reviewDraw)],
    ['', '', ''],
    ['Flavour Preferences', '🍋 Lemony', String(summary.flavourPreferences.lemony || 0)],
    ['Flavour Preferences', '🌶️ Mild', String(summary.flavourPreferences.mild || 0)],
    ['Flavour Preferences', '🍶 Barbeque', String(summary.flavourPreferences.bbq || 0)],
    ['Flavour Preferences', '🍯 Sweet Chilli', String(summary.flavourPreferences.sweet_chilli || 0)],
    ['Flavour Preferences', '🔥 Hot', String(summary.flavourPreferences.hot || 0)],
  ];

  // Append items ordered with quantities
  rows.push(['', '', '']);
  rows.push(['Items Actually Ordered', 'Item Name', 'Quantity Sold']);
  const sortedOrdered = Object.entries(summary.orderedItems || {}).sort((a, b) => b[1] - a[1]);
  if (sortedOrdered.length > 0) {
    for (const [name, qty] of sortedOrdered) {
      rows.push(['Items Actually Ordered', name, String(qty)]);
    }
  } else {
    rows.push(['Items Actually Ordered', 'Total Units Ordered', String(summary.totalOrderedQuantity || 0)]);
  }

  // Append top viewed items
  rows.push(['', '', '']);
  rows.push(['Top Viewed Menu Items', 'Item Name', 'Interest Count']);
  const sortedItems = Object.entries(summary.popularItems || {}).sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sortedItems) {
    rows.push(['Top Viewed Menu Items', name, String(count)]);
  }

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))].join(
      '\n'
    );

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute(
    'download',
    `Wrap_and_Wings_Customer_Traffic_${rangeLabel.replace(/\s+/g, '_')}_${getTodayString()}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format a comprehensive daily summary report suitable for sharing on WhatsApp or copying
 */
export function generateWhatsAppDailyReportText(
  summary: TrafficDailyDoc,
  rangeLabel: string,
  ordersCount: number,
  revenue: number,
  orderedItemsMap: Record<string, number>
): string {
  const sortedOrdered = Object.entries(orderedItemsMap).sort((a, b) => b[1] - a[1]);
  const totalFoodItems = Object.values(orderedItemsMap).reduce((sum, q) => sum + q, 0);

  let text = `🍗 *WRAP & WINGS CO. — DAILY PERFORMANCE & TRAFFIC REPORT* 🍗\n`;
  text += `📅 *Period:* ${rangeLabel} (${summary.date})\n\n`;

  text += `📊 *TRAFFIC & STORE VISITS*\n`;
  text += `• Total Page Views: *${summary.totalPageViews}*\n`;
  text += `• Unique Diners / Devices: *${summary.uniqueVisitorIds.length}*\n`;
  text += `• Active Diners (Online Now): *${getLiveVisitorsCount()}*\n\n`;

  text += `💰 *SALES & ORDERS SUMMARY*\n`;
  text += `• Completed Orders: *${ordersCount}*\n`;
  text += `• Total Order Revenue: *R${revenue.toFixed(2)}*\n`;
  text += `• Total Food Units Sold: *${totalFoodItems} items*\n`;
  text += `• Cart Additions: *${summary.funnel.cartAdds}*\n\n`;

  text += `🔥 *TOP ITEMS ORDERED (QUANTITIES)*\n`;
  if (sortedOrdered.length > 0) {
    sortedOrdered.slice(0, 8).forEach(([name, qty], idx) => {
      text += `${idx + 1}. *${name}* — ${qty} ordered\n`;
    });
  } else {
    text += `(No meal orders recorded yet)\n`;
  }
  text += `\n`;

  text += `🌶️ *FLAVOUR BASTING RANKING*\n`;
  text += `• 🍋 Lemony: ${summary.flavourPreferences.lemony || 0}\n`;
  text += `• 🌶️ Mild: ${summary.flavourPreferences.mild || 0}\n`;
  text += `• 🍶 BBQ: ${summary.flavourPreferences.bbq || 0}\n`;
  text += `• 🍯 Sweet Chilli: ${summary.flavourPreferences.sweet_chilli || 0}\n`;
  text += `• 🔥 Hot: ${summary.flavourPreferences.hot || 0}\n\n`;

  text += `📍 *TRAFFIC ACQUISITION SOURCES*\n`;
  text += `• Google Business / Maps: *${summary.sources.google_gmb || 0}*\n`;
  text += `• WhatsApp Links: *${summary.sources.whatsapp || 0}*\n`;
  text += `• Social Media (IG/FB/TikTok): *${summary.sources.social || 0}*\n`;
  text += `• Direct Address: *${summary.sources.direct || 0}*\n\n`;

  text += `📞 *CUSTOMER CONTACT ACTIONS*\n`;
  text += `• WhatsApp Inquiries: *${summary.directActions.whatsappChat || 0}*\n`;
  text += `• Phone Calls to Shop: *${summary.directActions.phoneCall || 0}*\n`;
  text += `• GPS / Directions Taps: *${summary.directActions.directions || 0}*\n`;
  text += `• Review Draw Entries: *${summary.directActions.reviewDraw || 0}*\n\n`;

  text += `📱 *DEVICE USAGE*\n`;
  text += `• Apple iPhone / iPad: ${summary.devices.ios || 0}\n`;
  text += `• Android Phones: ${summary.devices.android || 0}\n`;
  text += `• Computers: ${summary.devices.desktop || 0}\n\n`;
  text += `_Generated from Wrap & Wings Co. POS & Traffic System_`;

  return text;
}
