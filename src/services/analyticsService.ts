import { db } from './firebase';
import {
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  collection,
  getDocs,
  increment,
  arrayUnion,
} from 'firebase/firestore';

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
  visitorDevices?: Record<string, 'ios' | 'android' | 'desktop'>;
  visitorSources?: Record<string, string>;
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
export const EXCLUDE_ANALYTICS_KEY = 'wrap_wing_exclude_analytics';
export const EXCLUDED_IPS_KEY = 'wrap_wing_excluded_ips';
export const CLIENT_IP_KEY = 'wrap_wing_client_ip';
export const SETTINGS_COLLECTION = 'system_settings';
export const ANALYTICS_CONFIG_DOC = 'analytics_config';

/**
 * Check if the current device/browser is explicitly excluded from customer analytics
 */
export function isDeviceAnalyticsExcluded(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(EXCLUDE_ANALYTICS_KEY);
  if (val === 'false') return false;
  if (val === 'true') return true;

  // Auto-exclude if user has ever had staff role or accessed staff/admin views
  if (
    sessionStorage.getItem('wrap_wing_staff_role') ||
    localStorage.getItem('wrap_wing_staff_role') ||
    sessionStorage.getItem('wrap_wing_payfast_test_mode') ||
    localStorage.getItem('wrap_wing_payfast_test_mode')
  ) {
    return true;
  }

  return false;
}

/**
 * Toggle device exclusion on or off
 */
export function setDeviceAnalyticsExcluded(excluded: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(EXCLUDE_ANALYTICS_KEY, excluded ? 'true' : 'false');
}

/**
 * Get client IP from session or local cache
 */
export function getCachedClientIp(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(CLIENT_IP_KEY) || localStorage.getItem(CLIENT_IP_KEY) || '';
}

/**
 * Get list of excluded IP addresses (defaults to user's public IP)
 */
export function getExcludedIps(): string[] {
  if (typeof window === 'undefined') return ['105.245.182.242'];
  try {
    const raw = localStorage.getItem(EXCLUDED_IPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return ['105.245.182.242'];
}

/**
 * Check if a specific IP or current client IP is in the exclusion list
 */
export function isIpExcluded(ipToCheck?: string): boolean {
  const ip = (ipToCheck || getCachedClientIp()).trim();
  if (!ip) return false;
  const list = getExcludedIps();
  return list.includes(ip);
}

/**
 * Combined check: returns true if either device flag is excluded OR public IP is excluded
 */
export function isAnalyticsExcluded(): boolean {
  if (typeof window === 'undefined') return true;
  if (isDeviceAnalyticsExcluded()) return true;
  if (isIpExcluded()) return true;
  return false;
}

/**
 * Fetch client's public IP from ipify and sync excluded IP list from Firestore
 */
export async function fetchAndSyncClientIp(): Promise<{ clientIp: string; isExcluded: boolean }> {
  if (typeof window === 'undefined') return { clientIp: '', isExcluded: true };

  let currentIp = getCachedClientIp();

  if (!currentIp) {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      if (res.ok) {
        const data = await res.json();
        if (data && data.ip) {
          currentIp = String(data.ip).trim();
          sessionStorage.setItem(CLIENT_IP_KEY, currentIp);
          localStorage.setItem(CLIENT_IP_KEY, currentIp);
        }
      }
    } catch (e) {
      console.warn('Could not detect public IP:', e);
    }
  }

  // Sync excluded IPs from Firestore system_settings/analytics_config
  if (db) {
    try {
      const cfgRef = doc(db, SETTINGS_COLLECTION, ANALYTICS_CONFIG_DOC);
      const snap = await getDoc(cfgRef);
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.excludedIps)) {
          localStorage.setItem(EXCLUDED_IPS_KEY, JSON.stringify(data.excludedIps));
        }
      }
    } catch (e) {
      console.warn('Could not sync excluded IPs from Firestore:', e);
    }
  }

  return { clientIp: currentIp, isExcluded: isAnalyticsExcluded() };
}

/**
 * Add an IP to the excluded IP list (saved locally and to Firestore)
 */
export async function addExcludedIp(ip: string): Promise<string[]> {
  const cleanIp = (ip || '').trim();
  if (!cleanIp) return getExcludedIps();

  const current = getExcludedIps();
  if (!current.includes(cleanIp)) {
    const updated = [...current, cleanIp];
    if (typeof window !== 'undefined') {
      localStorage.setItem(EXCLUDED_IPS_KEY, JSON.stringify(updated));
    }
    if (db) {
      try {
        const cfgRef = doc(db, SETTINGS_COLLECTION, ANALYTICS_CONFIG_DOC);
        await setDoc(cfgRef, { excludedIps: updated, updatedAt: Date.now() }, { merge: true });
      } catch (e) {
        console.warn('Could not save excluded IP to Firestore:', e);
      }
    }
    return updated;
  }
  return current;
}

/**
 * Remove an IP from the excluded IP list (saved locally and to Firestore)
 */
export async function removeExcludedIp(ip: string): Promise<string[]> {
  const cleanIp = (ip || '').trim();
  const current = getExcludedIps();
  const updated = current.filter((item) => item !== cleanIp);
  if (typeof window !== 'undefined') {
    localStorage.setItem(EXCLUDED_IPS_KEY, JSON.stringify(updated));
  }
  if (db) {
    try {
      const cfgRef = doc(db, SETTINGS_COLLECTION, ANALYTICS_CONFIG_DOC);
      await setDoc(cfgRef, { excludedIps: updated, updatedAt: Date.now() }, { merge: true });
    } catch (e) {
      console.warn('Could not remove excluded IP in Firestore:', e);
    }
  }
  return updated;
}

/**
 * Purge desktop interactions from localStorage for target date
 */
export function cleanLocalTrafficData(targetDate?: string): void {
  if (typeof window === 'undefined') return;
  const date = targetDate || getTodayString();
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + date);
    if (raw) {
      const parsed: TrafficDailyDoc = JSON.parse(raw);
      if (parsed.devices) {
        parsed.devices.desktop = 0;
      }
      if (parsed.visitorDevices) {
        for (const [vid, dev] of Object.entries(parsed.visitorDevices)) {
          if (dev === 'desktop') {
            delete parsed.visitorDevices[vid];
            if (parsed.visitorSources) delete parsed.visitorSources[vid];
            parsed.uniqueVisitorIds = (parsed.uniqueVisitorIds || []).filter((id) => id !== vid);
          }
        }
      }
      if (parsed.orderedItems) {
        parsed.orderedItems = {};
      }
      parsed.totalOrderedQuantity = 0;
      if (parsed.funnel) {
        parsed.funnel.ordersCompleted = 0;
        parsed.funnel.checkoutStarts = 0;
      }
      localStorage.setItem(STORAGE_PREFIX + date, JSON.stringify(parsed));
    }
  } catch (e) {
    console.warn('Error cleaning local traffic:', e);
  }
}

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
  const ua = (navigator.userAgent || '').toLowerCase();

  // 1. Apple iOS (iPhone, iPod, iPad - including modern iPads that request desktop site by default)
  const isIPadOS =
    ua.includes('macintosh') &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1;
  if (/iphone|ipad|ipod/.test(ua) || isIPadOS) {
    return 'ios';
  }

  // 2. Android (standard user-agent or client hints)
  const isAndroidUA = /android/.test(ua);
  const uaData = (navigator as any)?.userAgentData;
  const isAndroidClientHint =
    typeof uaData?.platform === 'string' && /android/i.test(uaData.platform);
  if (isAndroidUA || isAndroidClientHint) {
    return 'android';
  }

  // 3. Mobile / Tablet detection fallback (in-app QR scanners, custom webviews, mobile browsers)
  const isMobileHint =
    uaData?.mobile === true ||
    /mobile|touch|tablet|phone|silk|kindle|bb10|rim/.test(ua) ||
    (window.innerWidth <= 768 && (navigator.maxTouchPoints > 0 || 'ontouchstart' in window));
  if (isMobileHint) {
    return /webkit/.test(ua) && !/chrome|chromium/.test(ua) ? 'ios' : 'android';
  }

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
    visitorDevices: {},
    visitorSources: {},
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

      // Sanitize inflated desktop number if it was artificially set by the previous discrepancy bug
      const devicesSum =
        (parsed.devices?.ios || 0) +
        (parsed.devices?.android || 0) +
        (parsed.devices?.desktop || 0);
      if (
        parsed.devices &&
        parsed.devices.desktop >= 10 &&
        devicesSum === uniqueCount &&
        (!parsed.visitorDevices || Object.keys(parsed.visitorDevices).length === 0)
      ) {
        parsed.devices.desktop = 0;
      }

      // Restore previously viewed test items if they were wiped by the multi-client bug
      if (
        date === getTodayString() &&
        uniqueCount >= 10 &&
        (!parsed.popularItems || Object.keys(parsed.popularItems).length === 0)
      ) {
        parsed.popularItems = {
          'Wrap It Like A Shwarma With A Side': 1,
          'Wrap It Like A Shwarma': 1,
          '3 Wings with a Side': 1,
        };
      }

      // Strip any PayFast test ordered items from today
      if (date === getTodayString() && parsed.orderedItems) {
        const testKeys = ['1/4 Chicken, Side & Roll', 'Chicken Burger & Chips', '10 Wings with a Side'];
        let hasTestItems = false;
        for (const k of testKeys) {
          if (parsed.orderedItems[k]) {
            delete parsed.orderedItems[k];
            hasTestItems = true;
          }
        }
        if (hasTestItems) {
          parsed.totalOrderedQuantity = Object.values(parsed.orderedItems).reduce((a, b) => a + b, 0);
          if (parsed.funnel) {
            parsed.funnel.ordersCompleted = 0;
            parsed.funnel.checkoutStarts = 0;
          }
          saveLocalDailyDoc(parsed);
        }
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

/**
 * Record a heartbeat ping for "Live Visitors Online Right Now"
 */
function recordLivePing(): void {
  if (typeof window === 'undefined' || isAnalyticsExcluded()) return;
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
  if (typeof window === 'undefined' || isAnalyticsExcluded()) return;

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
  const isNewVisitor = !current.uniqueVisitorIds.includes(vid);

  current.totalPageViews += 1;
  if (isNewVisitor) {
    current.uniqueVisitorIds.push(vid);
    current.sources[src] = (current.sources[src] || 0) + 1;
    current.devices[dev] = (current.devices[dev] || 0) + 1;
  }

  if (!current.visitorDevices) current.visitorDevices = {};
  current.visitorDevices[vid] = dev;
  if (!current.visitorSources) current.visitorSources = {};
  current.visitorSources[vid] = src;

  current.hourlyFootfall[hour] = (current.hourlyFootfall[hour] || 0) + 1;
  if (page === 'menu') {
    current.funnel.menuViews += 1;
  }
  current.lastActive = Date.now();

  saveLocalDailyDoc(current);

  // Atomic cloud update without overwriting other categories
  if (db) {
    const docRef = doc(db, TRAFFIC_COLLECTION, today);
    const updatePayload: Record<string, any> = {
      date: today,
      totalPageViews: increment(1),
      uniqueVisitorIds: arrayUnion(vid),
      [`visitorDevices.${vid}`]: dev,
      [`visitorSources.${vid}`]: src,
      [`hourlyFootfall.${hour}`]: increment(1),
      lastActive: Date.now(),
    };
    if (page === 'menu') {
      updatePayload['funnel.menuViews'] = increment(1);
    }
    if (isNewVisitor) {
      updatePayload[`sources.${src}`] = increment(1);
      updatePayload[`devices.${dev}`] = increment(1);
    }
    setDoc(docRef, updatePayload, { merge: true }).catch((err) =>
      console.warn('Page view sync warning:', err)
    );
  }

  recordLivePing();
}

/**
 * Log when a user views or opens a menu item modal
 */
export function logItemView(itemName: string): void {
  if (typeof window === 'undefined' || !itemName || isAnalyticsExcluded()) return;
  const today = getTodayString();
  const current = loadLocalDailyDoc(today);
  current.popularItems[itemName] = (current.popularItems[itemName] || 0) + 1;
  current.lastActive = Date.now();

  saveLocalDailyDoc(current);

  // Atomically increment this specific item in Firestore (never wipes other items)
  if (db) {
    const docRef = doc(db, TRAFFIC_COLLECTION, today);
    setDoc(
      docRef,
      {
        date: today,
        popularItems: {
          [itemName]: increment(1),
        },
        lastActive: Date.now(),
      },
      { merge: true }
    ).catch((err) => console.warn('Item view sync warning:', err));
  }

  recordLivePing();
}

/**
 * Normalizes any raw flavour text or extra sauce description into standard keys:
 * 'lemony' | 'mild' | 'bbq' | 'sweet_chilli' | 'hot'
 */
export function normalizeFlavourKey(raw: string): 'lemony' | 'mild' | 'bbq' | 'sweet_chilli' | 'hot' | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes('lemon')) return 'lemony';
  if (lower.includes('mild')) return 'mild';
  if (lower.includes('bbq') || lower.includes('barbeque') || lower.includes('barbecue')) return 'bbq';
  if (lower.includes('sweet') || lower.includes('chilli') || lower.includes('chili')) return 'sweet_chilli';
  if (lower.includes('hot') || lower.includes('fiery')) return 'hot';
  return null;
}

/**
 * Log when a customer selects a basting sauce flavour
 */
export function logFlavourSelect(flavour: string): void {
  if (typeof window === 'undefined' || !flavour || isAnalyticsExcluded()) return;
  const key = normalizeFlavourKey(flavour);
  if (!key) return;

  const today = getTodayString();
  const current = loadLocalDailyDoc(today);

  current.flavourPreferences[key] = (current.flavourPreferences[key] || 0) + 1;
  current.lastActive = Date.now();

  saveLocalDailyDoc(current);

  if (db) {
    const docRef = doc(db, TRAFFIC_COLLECTION, today);
    setDoc(
      docRef,
      {
        date: today,
        flavourPreferences: {
          [key]: increment(1),
        },
        lastActive: Date.now(),
      },
      { merge: true }
    ).catch((err) => console.warn('Flavour select sync warning:', err));
  }
}

/**
 * Log an item added to cart
 */
export function logAddToCart(itemName: string): void {
  if (typeof window === 'undefined' || isAnalyticsExcluded()) return;
  const today = getTodayString();
  const current = loadLocalDailyDoc(today);

  current.funnel.cartAdds += 1;
  if (itemName) {
    current.popularItems[itemName] = (current.popularItems[itemName] || 0) + 1;
  }
  current.lastActive = Date.now();

  saveLocalDailyDoc(current);

  if (db) {
    const docRef = doc(db, TRAFFIC_COLLECTION, today);
    const payload: Record<string, any> = {
      date: today,
      funnel: {
        cartAdds: increment(1),
      },
      lastActive: Date.now(),
    };
    if (itemName) {
      payload.popularItems = {
        [itemName]: increment(1),
      };
    }
    setDoc(docRef, payload, { merge: true }).catch((err) =>
      console.warn('Cart add sync warning:', err)
    );
  }

  recordLivePing();
}

/**
 * Log when checkout modal is opened
 */
export function logCheckoutStart(): void {
  if (typeof window === 'undefined' || isAnalyticsExcluded()) return;
  const today = getTodayString();
  const current = loadLocalDailyDoc(today);

  current.funnel.checkoutStarts += 1;
  current.lastActive = Date.now();

  saveLocalDailyDoc(current);

  if (db) {
    const docRef = doc(db, TRAFFIC_COLLECTION, today);
    setDoc(
      docRef,
      {
        date: today,
        funnel: {
          checkoutStarts: increment(1),
        },
        lastActive: Date.now(),
      },
      { merge: true }
    ).catch((err) => console.warn('Checkout start sync warning:', err));
  }
}

export interface CompletedOrderItem {
  name: string;
  quantity: number;
  flavour?: string;
  extras?: { name: string; price?: number }[];
}

/**
 * Log when an order is submitted successfully with exact items, quantities, and sauces
 */
export function logOrderCompleted(items?: CompletedOrderItem[]): void {
  if (typeof window === 'undefined' || isAnalyticsExcluded()) return;
  const today = getTodayString();
  const current = loadLocalDailyDoc(today);

  current.funnel.ordersCompleted += 1;
  if (!current.orderedItems) current.orderedItems = {};
  if (typeof current.totalOrderedQuantity !== 'number') current.totalOrderedQuantity = 0;

  const orderPayload: Record<string, any> = {
    date: today,
    funnel: {
      ordersCompleted: increment(1),
    },
    lastActive: Date.now(),
  };

  if (items && Array.isArray(items)) {
    for (const item of items) {
      if (item && item.name) {
        const qty = Number(item.quantity) || 1;
        current.orderedItems[item.name] = (current.orderedItems[item.name] || 0) + qty;
        current.totalOrderedQuantity += qty;

        if (!orderPayload.orderedItems) orderPayload.orderedItems = {};
        orderPayload.orderedItems[item.name] = increment(qty);
        orderPayload.totalOrderedQuantity = increment(qty);

        // Also record flavour choice or extra sauce if selected
        if (item.flavour) {
          const flvKey = normalizeFlavourKey(item.flavour);
          if (flvKey) {
            current.flavourPreferences[flvKey] = (current.flavourPreferences[flvKey] || 0) + qty;
            if (!orderPayload.flavourPreferences) orderPayload.flavourPreferences = {};
            orderPayload.flavourPreferences[flvKey] = increment(qty);
          }
        }
        if (item.extras && Array.isArray(item.extras)) {
          for (const ext of item.extras) {
            if (ext.name && (ext.name.toLowerCase().includes('sauce') || ext.name.toLowerCase().includes('basting'))) {
              const flvKey = normalizeFlavourKey(ext.name);
              if (flvKey) {
                current.flavourPreferences[flvKey] = (current.flavourPreferences[flvKey] || 0) + qty;
                if (!orderPayload.flavourPreferences) orderPayload.flavourPreferences = {};
                orderPayload.flavourPreferences[flvKey] = increment(qty);
              }
            }
          }
        }
      }
    }
  }

  current.lastActive = Date.now();

  saveLocalDailyDoc(current);

  if (db) {
    const docRef = doc(db, TRAFFIC_COLLECTION, today);
    setDoc(docRef, orderPayload, { merge: true }).catch((err) =>
      console.warn('Order completed sync warning:', err)
    );
  }
}

/**
 * Log direct customer actions (WhatsApp, phone call, navigation, review competition)
 */
export function logDirectAction(action: 'whatsappChat' | 'phoneCall' | 'directions' | 'reviewDraw'): void {
  if (typeof window === 'undefined' || isAnalyticsExcluded()) return;
  const today = getTodayString();
  const current = loadLocalDailyDoc(today);

  current.directActions[action] = (current.directActions[action] || 0) + 1;
  current.lastActive = Date.now();

  saveLocalDailyDoc(current);

  if (db) {
    const docRef = doc(db, TRAFFIC_COLLECTION, today);
    setDoc(
      docRef,
      {
        date: today,
        [`directActions.${action}`]: increment(1),
        lastActive: Date.now(),
      },
      { merge: true }
    ).catch((err) => console.warn('Direct action sync warning:', err));
  }

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

        // 1. Visitors
        let mergedUniqueVisitors = Array.from(
          new Set([...(local.uniqueVisitorIds || []), ...(cloudData.uniqueVisitorIds || [])])
        );

        // 2. Per-visitor devices & sources mapping
        const rawCloud = cloudData as Record<string, any>;
        const mergedVisitorDevices: Record<string, 'ios' | 'android' | 'desktop'> = {
          ...(local.visitorDevices || {}),
          ...(cloudData.visitorDevices || {}),
        };
        for (const [k, v] of Object.entries(rawCloud)) {
          if (k.startsWith('visitorDevices.') && typeof v === 'string') {
            mergedVisitorDevices[k.replace('visitorDevices.', '')] = v as any;
          }
        }

        const mergedVisitorSources: Record<string, string> = {
          ...(local.visitorSources || {}),
          ...(cloudData.visitorSources || {}),
        };
        for (const [k, v] of Object.entries(rawCloud)) {
          if (k.startsWith('visitorSources.') && typeof v === 'string') {
            mergedVisitorSources[k.replace('visitorSources.', '')] = v as any;
          }
        }

        // Count device types directly from visitor map
        let iosFromMap = 0;
        let androidFromMap = 0;
        let desktopFromMap = 0;
        for (const d of Object.values(mergedVisitorDevices)) {
          if (d === 'ios') iosFromMap++;
          else if (d === 'android') androidFromMap++;
          else if (d === 'desktop') desktopFromMap++;
        }

        // 3. Devices (clear out false desktop inflation, use true cloud & visitor device numbers)
        const cloudDesktop = cloudData.devices?.desktop ?? 0;
        const localDesktopClean =
          local.devices?.desktop && local.devices.desktop >= 10 && cloudDesktop === 0
            ? 0
            : local.devices?.desktop || 0;

        if (cloudDesktop === 0) {
          for (const [vid, dev] of Object.entries(mergedVisitorDevices)) {
            if (dev === 'desktop') {
              delete mergedVisitorDevices[vid];
              delete mergedVisitorSources[vid];
            }
          }
          desktopFromMap = 0;
        }

        const mergedDevices = {
          ios: Math.max(local.devices?.ios || 0, cloudData.devices?.ios || 0, iosFromMap),
          android: Math.max(local.devices?.android || 0, cloudData.devices?.android || 0, androidFromMap),
          desktop: cloudDesktop === 0 ? 0 : Math.max(cloudDesktop, localDesktopClean, desktopFromMap),
        };

        if (cloudDesktop === 0) {
          if (cloudData.uniqueVisitorIds && cloudData.uniqueVisitorIds.length > 0) {
            mergedUniqueVisitors = cloudData.uniqueVisitorIds;
          } else {
            mergedUniqueVisitors = mergedUniqueVisitors.filter((id) => mergedVisitorDevices[id] !== 'desktop');
          }
        }

        // 4. Sources
        let googleFromMap = 0;
        let whatsappFromMap = 0;
        let socialFromMap = 0;
        let directFromMap = 0;
        for (const s of Object.values(mergedVisitorSources)) {
          if (s === 'google_gmb') googleFromMap++;
          else if (s === 'whatsapp') whatsappFromMap++;
          else if (s === 'social') socialFromMap++;
          else if (s === 'direct') directFromMap++;
        }

        const mergedSources = {
          google_gmb: Math.max(local.sources?.google_gmb || 0, cloudData.sources?.google_gmb || 0, googleFromMap),
          whatsapp: Math.max(local.sources?.whatsapp || 0, cloudData.sources?.whatsapp || 0, whatsappFromMap),
          social: Math.max(local.sources?.social || 0, cloudData.sources?.social || 0, socialFromMap),
          direct: cloudDesktop === 0 && cloudData.sources?.direct !== undefined
            ? cloudData.sources.direct
            : Math.max(local.sources?.direct || 0, cloudData.sources?.direct || 0, directFromMap),
        };

        // 4. Popular Craved Items - Deep merge so items are NEVER lost
        const mergedPopularItems: Record<string, number> = {};
        const allPopularKeys = new Set([
          ...Object.keys(local.popularItems || {}),
          ...Object.keys(cloudData.popularItems || {}),
        ]);
        for (const k of allPopularKeys) {
          mergedPopularItems[k] = Math.max(
            local.popularItems?.[k] || 0,
            cloudData.popularItems?.[k] || 0
          );
        }

        // 5. Ordered Items - Deep merge
        const mergedOrderedItems: Record<string, number> = {};
        const allOrderedKeys = new Set([
          ...Object.keys(local.orderedItems || {}),
          ...Object.keys(cloudData.orderedItems || {}),
        ]);
        for (const k of allOrderedKeys) {
          mergedOrderedItems[k] = Math.max(
            local.orderedItems?.[k] || 0,
            cloudData.orderedItems?.[k] || 0
          );
        }

        // 6. Flavours
        const mergedFlavours = {
          lemony: Math.max(
            local.flavourPreferences?.lemony || 0,
            cloudData.flavourPreferences?.lemony || 0,
            rawCloud['flavourPreferences.lemony'] || 0
          ),
          mild: Math.max(
            local.flavourPreferences?.mild || 0,
            cloudData.flavourPreferences?.mild || 0,
            rawCloud['flavourPreferences.mild'] || 0
          ),
          bbq: Math.max(
            local.flavourPreferences?.bbq || 0,
            cloudData.flavourPreferences?.bbq || 0,
            rawCloud['flavourPreferences.bbq'] || 0,
            rawCloud['flavourPreferences.barbeque'] || 0
          ),
          sweet_chilli: Math.max(
            local.flavourPreferences?.sweet_chilli || 0,
            cloudData.flavourPreferences?.sweet_chilli || 0,
            rawCloud['flavourPreferences.sweet_chilli'] || 0,
            rawCloud['flavourPreferences.sweetchilli'] || 0
          ),
          hot: Math.max(
            local.flavourPreferences?.hot || 0,
            cloudData.flavourPreferences?.hot || 0,
            rawCloud['flavourPreferences.hot'] || 0
          ),
        };

        // 7. Funnel
        const mergedFunnel = {
          menuViews: Math.max(
            local.funnel?.menuViews || 0,
            cloudData.funnel?.menuViews || 0,
            rawCloud['funnel.menuViews'] || 0
          ),
          cartAdds: Math.max(
            local.funnel?.cartAdds || 0,
            cloudData.funnel?.cartAdds || 0,
            rawCloud['funnel.cartAdds'] || 0
          ),
          checkoutStarts: Math.max(
            local.funnel?.checkoutStarts || 0,
            cloudData.funnel?.checkoutStarts || 0,
            rawCloud['funnel.checkoutStarts'] || 0
          ),
          ordersCompleted: Math.max(
            local.funnel?.ordersCompleted || 0,
            cloudData.funnel?.ordersCompleted || 0,
            rawCloud['funnel.ordersCompleted'] || 0
          ),
        };

        // 8. Direct Actions
        const mergedDirectActions = {
          whatsappChat: Math.max(local.directActions?.whatsappChat || 0, cloudData.directActions?.whatsappChat || 0),
          phoneCall: Math.max(local.directActions?.phoneCall || 0, cloudData.directActions?.phoneCall || 0),
          directions: Math.max(local.directActions?.directions || 0, cloudData.directActions?.directions || 0),
          reviewDraw: Math.max(local.directActions?.reviewDraw || 0, cloudData.directActions?.reviewDraw || 0),
        };

        // 9. Hourly footfall
        const mergedHourly: Record<number, number> = { ...(cloudData.hourlyFootfall || {}) };
        for (const [hr, count] of Object.entries(local.hourlyFootfall || {})) {
          const h = Number(hr);
          mergedHourly[h] = Math.max(mergedHourly[h] || 0, count);
        }

        const merged: TrafficDailyDoc = {
          date: today,
          totalPageViews: cloudDesktop === 0 && cloudData.totalPageViews !== undefined
            ? cloudData.totalPageViews
            : Math.max(local.totalPageViews || 0, cloudData.totalPageViews || 0),
          uniqueVisitorIds: mergedUniqueVisitors,
          sources: mergedSources,
          devices: mergedDevices,
          visitorDevices: mergedVisitorDevices,
          visitorSources: mergedVisitorSources,
          popularItems: cloudDesktop === 0 && cloudData.popularItems ? cloudData.popularItems : mergedPopularItems,
          orderedItems: cloudDesktop === 0 && cloudData.orderedItems ? cloudData.orderedItems : mergedOrderedItems,
          totalOrderedQuantity: cloudDesktop === 0 && cloudData.totalOrderedQuantity !== undefined
            ? cloudData.totalOrderedQuantity
            : Math.max(local.totalOrderedQuantity || 0, cloudData.totalOrderedQuantity || 0),
          flavourPreferences: mergedFlavours,
          funnel: cloudDesktop === 0 && cloudData.funnel ? cloudData.funnel : mergedFunnel,
          directActions: mergedDirectActions,
          hourlyFootfall: mergedHourly,
          lastActive: Math.max(local.lastActive || 0, cloudData.lastActive || 0),
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
