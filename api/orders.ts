// Vercel Serverless Function for Live Order Synchronization
// Provides same-domain instant order relay between customer phones and counter tablets
// Backed by persistent cloud storage to survive serverless cold starts across devices

const CLOUD_MASTER_STORE_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a10fc639a705a5';

let ordersStore: any[] = [];
let lastSyncTimestamp = 0;

async function fetchFromMasterStore(): Promise<any[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(CLOUD_MASTER_STORE_URL, {
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (resp.ok) {
      const json = await resp.json();
      if (json && json.data && Array.isArray(json.data.orders)) {
        ordersStore = json.data.orders;
        lastSyncTimestamp = Date.now();
        return ordersStore;
      }
    }
  } catch (err) {
    console.warn('Could not fetch from persistent cloud master store:', err);
  }
  return ordersStore;
}

async function persistToMasterStore(orders: any[]): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const resp = await fetch(CLOUD_MASTER_STORE_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'wrap_and_wing_orders_v1',
        data: {
          orders: orders.slice(0, 100),
          lastUpdated: Date.now(),
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return resp.ok;
  } catch (err) {
    console.warn('Could not persist to master cloud store:', err);
    return false;
  }
}

export default async function handler(req: any, res: any) {
  // Enable open CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Refresh memory if stale
    if (Date.now() - lastSyncTimestamp > 1500 || ordersStore.length === 0) {
      await fetchFromMasterStore();
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { type, order, orderId, newStatus, note, timelineEvent } = body;

      if (type === 'ORDER_CREATED' && order && order.orderId) {
        const existingIdx = ordersStore.findIndex((o) => o.orderId === order.orderId);
        if (existingIdx === -1) {
          ordersStore.unshift(order);
        } else {
          ordersStore[existingIdx] = order;
        }
      } else if (type === 'ORDER_UPDATED' && orderId && newStatus) {
        const existingIdx = ordersStore.findIndex((o) => o.orderId === orderId);
        if (existingIdx !== -1) {
          ordersStore[existingIdx].status = newStatus;
          if (timelineEvent) {
            ordersStore[existingIdx].timeline = [
              ...(ordersStore[existingIdx].timeline || []),
              timelineEvent,
            ];
          }
        }
      }

      // Keep newest 100 orders
      if (ordersStore.length > 100) {
        ordersStore = ordersStore.slice(0, 100);
      }

      // Commit to persistent master store
      await persistToMasterStore(ordersStore);

      return res.status(200).json({ success: true, count: ordersStore.length, orders: ordersStore });
    }

    if (req.method === 'GET') {
      return res.status(200).json(ordersStore);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
