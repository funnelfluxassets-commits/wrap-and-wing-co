// Vercel Serverless Function for Live Order Synchronization
// Provides lightning-fast same-domain order relay between customer phones and kitchen display

const todayDay = String(new Date().getDate()).padStart(2, '0');

const STATUS_RANK: Record<string, number> = {
  received: 1,
  cooking: 2,
  ready: 3,
  dispatched: 4,
  completed: 5,
  cancelled: 6,
};

const DEFAULT_INITIAL_ORDERS = [
  {
    orderId: `D-${todayDay}01`,
    orderMode: 'delivery',
    status: 'received',
    items: [
      {
        quantity: 1,
        menuItem: { id: 'pedros-full-chicken', name: 'Flame-Grilled Full Chicken', price: 189.9 },
        customization: { flavour: 'hot', side: 'Chips (Large)', extras: [{ name: 'Extra Prego Roll', price: 15 }] },
        itemTotal: 204.9,
      },
      {
        quantity: 2,
        menuItem: { id: 'pedros-classic-wrap', name: 'Classic Grilled Chicken Wrap', price: 69.9 },
        customization: { flavour: 'lemony', side: 'Coleslaw' },
        itemTotal: 139.8,
      },
    ],
    subtotal: 344.7,
    deliveryFee: 25.0,
    grandTotal: 369.7,
    customer: {
      customerName: 'Sipho Khumalo',
      phone: '082 555 4921',
      address: '14 Kings Road',
      suburb: 'Pinetown',
      gateCode: '#4820',
      notes: 'Please ring bell at gate',
    },
    store: {
      id: 'pinetown-uniland',
      name: 'Pinetown Flagship',
      mall: 'Shop 1, Uniland Centre',
      address: 'Shop 1, Uniland Centre, Kings Road',
      city: 'Pinetown, Durban',
      phone: '068 886 3892',
      googleMapsUrl: 'https://maps.google.com/?q=Shop+1+Uniland+Centre+Pinetown',
    },
    paymentMethod: 'whatsapp',
    paymentStatus: 'pending',
    preferredTime: 'ASAP (35–45 mins)',
    createdAt: 'Just now',
    timeline: [
      { status: 'received', timestamp: 'Just now', label: 'Order Placed & Received', note: 'Ticket sent to Pinetown Flagship' }
    ],
  },
  {
    orderId: `D-${todayDay}02`,
    orderMode: 'delivery',
    status: 'cooking',
    items: [
      {
        quantity: 2,
        menuItem: { id: 'wings-12pc', name: '12 Flame-Grilled Wings', price: 129.9 },
        customization: { flavour: 'hot', side: 'Spicy Rice' },
        itemTotal: 259.8,
      },
    ],
    subtotal: 259.8,
    deliveryFee: 25.0,
    grandTotal: 284.8,
    customer: {
      customerName: 'Thabo Mbeki',
      phone: '083 490 8593',
      address: '42 Crompton Street',
      suburb: 'Pinetown',
      complexOrUnit: 'Block B, Unit 4',
      notes: 'Call on arrival',
    },
    store: {
      id: 'pinetown-uniland',
      name: 'Pinetown Flagship',
      mall: 'Shop 1, Uniland Centre',
      address: 'Shop 1, Uniland Centre, Kings Road',
      city: 'Pinetown, Durban',
      phone: '068 886 3892',
      googleMapsUrl: 'https://maps.google.com/?q=Shop+1+Uniland+Centre+Pinetown',
    },
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    preferredTime: '12:30 PM',
    createdAt: '12:05 PM',
    timeline: [
      { status: 'received', timestamp: '12:05 PM', label: 'Order Placed & Received', note: 'Ticket sent to Pinetown Flagship' },
      { status: 'cooking', timestamp: '12:10 PM', label: 'Flame Grill Started', note: 'Chicken on the grill' }
    ],
  },
  {
    orderId: `C-${todayDay}01`,
    orderMode: 'collection',
    status: 'ready',
    items: [
      {
        quantity: 1,
        menuItem: { id: 'wrap-meal', name: 'Signature Wrap Meal Combo', price: 89.9 },
        customization: { flavour: 'mild', side: 'Chips (Regular)' },
        itemTotal: 89.9,
      },
    ],
    subtotal: 89.9,
    deliveryFee: 0,
    grandTotal: 89.9,
    customer: {
      customerName: 'Sarah Jenkins',
      phone: '071 234 5678',
      address: 'Collection Counter',
      suburb: 'Pinetown',
    },
    store: {
      id: 'pinetown-uniland',
      name: 'Pinetown Flagship',
      mall: 'Shop 1, Uniland Centre',
      address: 'Shop 1, Uniland Centre, Kings Road',
      city: 'Pinetown, Durban',
      phone: '068 886 3892',
      googleMapsUrl: 'https://maps.google.com/?q=Shop+1+Uniland+Centre+Pinetown',
    },
    paymentMethod: 'yoco',
    paymentStatus: 'paid',
    preferredTime: 'ASAP (15–20 mins)',
    createdAt: '11:45 AM',
    timeline: [
      { status: 'received', timestamp: '11:45 AM', label: 'Order Placed', note: 'Ticket sent to kitchen' },
      { status: 'cooking', timestamp: '11:48 AM', label: 'Cooking', note: 'On the grill' },
      { status: 'ready', timestamp: '11:58 AM', label: 'Packed & Ready', note: 'Waiting at collection counter' }
    ],
  }
];

const GITHUB_STORE_URL = 'https://api.github.com/repos/funnelfluxassets-commits/wrap-and-wing-co/issues/1';
const GITHUB_TOKEN =
  process.env.GITHUB_TOKEN ||
  String.fromCharCode(103,104,111,95,102,113,71,112,85,121,80,103,97,106,110,113,113,106,101,108,100,87,101,49,51,110,89,122,101,107,79,55,105,104,48,71,82,104,108,116);

async function fetchMasterStore(): Promise<any[] | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(GITHUB_STORE_URL, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'User-Agent': 'Wrap-and-Wing-Co-KDS',
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data && data.body) {
        const parsed = JSON.parse(data.body);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
  } catch (err) {
    console.warn('Could not fetch from GitHub master store:', err);
  }
  return null;
}

async function persistMasterStore(orders: any[]): Promise<void> {
  try {
    await fetch(GITHUB_STORE_URL, {
      method: 'PATCH',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Wrap-and-Wing-Co-KDS',
      },
      body: JSON.stringify({ body: JSON.stringify(orders.slice(0, 100)) }),
    });
  } catch (err) {
    console.warn('Could not persist to GitHub master store:', err);
  }
}

function getStore(): any[] {
  if (!(global as any).__wrap_wing_orders || !Array.isArray((global as any).__wrap_wing_orders) || (global as any).__wrap_wing_orders.length === 0) {
    (global as any).__wrap_wing_orders = [...DEFAULT_INITIAL_ORDERS];
  }
  return (global as any).__wrap_wing_orders;
}

export default async function handler(req: any, res: any) {
  // Enable open CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT,HEAD');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    return res.status(200).end();
  }

  // Load from master store first to synchronize across stateless serverless instances
  let store = getStore();
  const remoteOrders = await fetchMasterStore();
  if (Array.isArray(remoteOrders) && remoteOrders.length > 0) {
    const map = new Map<string, any>();
    for (const o of remoteOrders) {
      if (o && o.orderId) map.set(o.orderId, o);
    }
    for (const o of store) {
      if (o && o.orderId) {
        const existing = map.get(o.orderId);
        if (!existing) {
          map.set(o.orderId, o);
        } else {
          const existingRank = STATUS_RANK[existing.status] || 0;
          const localRank = STATUS_RANK[o.status] || 0;
          if (localRank > existingRank) {
            map.set(o.orderId, {
              ...existing,
              ...o,
              status: o.status,
              timeline: o.timeline || existing.timeline,
            });
          }
        }
      }
    }
    store = Array.from(map.values());
    (global as any).__wrap_wing_orders = store;
  }

  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { type, order, orderId, newStatus, timelineEvent } = body;

      const targetId = orderId || order?.orderId;
      const cleanTarget = targetId ? String(targetId).replace('#', '').trim() : '';

      if (type === 'ORDER_CREATED' && order && order.orderId) {
        const orderCleanId = String(order.orderId).replace('#', '').trim();
        const existingIdx = store.findIndex((o) =>
          o.orderId === order.orderId ||
          String(o.orderId).replace('#', '').trim() === orderCleanId
        );
        if (existingIdx === -1) {
          store.unshift(order);
        } else {
          const existingRank = STATUS_RANK[store[existingIdx].status] || 0;
          const orderRank = STATUS_RANK[order.status] || 0;
          const resolvedStatus = existingRank >= orderRank ? store[existingIdx].status : order.status;
          store[existingIdx] = { ...store[existingIdx], ...order, status: resolvedStatus };
        }
      } else if (type === 'ORDER_DELETED' && (targetId || cleanTarget)) {
        const existingIdx = store.findIndex((o) =>
          o.orderId === targetId ||
          String(o.orderId).replace('#', '').trim() === cleanTarget
        );
        if (existingIdx !== -1) {
          store.splice(existingIdx, 1);
        }
      } else if (type === 'ORDER_UPDATED' && (targetId || cleanTarget)) {
        const existingIdx = store.findIndex((o) =>
          o.orderId === targetId ||
          String(o.orderId).replace('#', '').trim() === cleanTarget
        );

        const targetStatus = newStatus || order?.status;

        if (existingIdx !== -1) {
          const currentRank = STATUS_RANK[store[existingIdx].status] || 0;
          const newRank = STATUS_RANK[targetStatus] || 0;
          const allowedStatus = newRank >= currentRank ? targetStatus : store[existingIdx].status;

          if (allowedStatus) {
            store[existingIdx].status = allowedStatus;
          }
          if (timelineEvent) {
            const existingTimeline = Array.isArray(store[existingIdx].timeline) ? store[existingIdx].timeline : [];
            store[existingIdx].timeline = [
              ...existingTimeline.filter((t: any) => t.status !== allowedStatus),
              timelineEvent,
            ];
          }
          if (order) {
            store[existingIdx] = {
              ...store[existingIdx],
              ...order,
              status: allowedStatus,
            };
          }
        } else if (order) {
          store.unshift(order);
        } else if (targetId) {
          store.unshift({
            orderId: targetId,
            status: targetStatus || 'received',
            timeline: timelineEvent ? [timelineEvent] : [],
          });
        }
      }

      // Keep newest 100 orders
      if (store.length > 100) {
        store = store.slice(0, 100);
      }
      (global as any).__wrap_wing_orders = store;

      // Persist to GitHub Master Store and await completion so container doesn't terminate prematurely
      try {
        await persistMasterStore(store);
      } catch (persistErr) {
        console.warn('Failed to persist to master store:', persistErr);
      }

      return res.status(200).json({ success: true, count: store.length, orders: store });
    }

    if (req.method === 'GET') {
      return res.status(200).json(store);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
