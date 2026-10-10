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

const DEMO_NAMES = new Set(['Sipho Khumalo', 'Thabo Mbeki', 'Sarah Jenkins']);

const DEFAULT_INITIAL_ORDERS: any[] = [];

function getStore(): any[] {
  if (!(global as any).__wrap_wing_orders || !Array.isArray((global as any).__wrap_wing_orders)) {
    (global as any).__wrap_wing_orders = [];
  }
  // Sanitize out any legacy mock demo orders permanently
  (global as any).__wrap_wing_orders = (global as any).__wrap_wing_orders.filter((o: any) => {
    if (!o || typeof o !== 'object') return false;
    const name = o.customer?.customerName || '';
    if (DEMO_NAMES.has(name)) return false;
    if (o.orderId && ['D-1001', 'D-1002', 'C-1001'].some((id) => String(o.orderId).includes(id))) return false;
    return true;
  });
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

  let store = getStore();

  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { type, order, orderId, newStatus, timelineEvent } = body;

      const targetId = orderId || order?.orderId;
      const cleanTarget = targetId ? String(targetId).replace('#', '').trim() : '';

      if (type === 'CLEAR_ALL') {
        (global as any).__wrap_wing_orders = [];
        return res.status(200).json({ success: true, count: 0, orders: [] });
      }

      if (type === 'ORDER_CREATED' && order && order.orderId) {
        const custName = order.customer?.customerName || '';
        if (DEMO_NAMES.has(custName)) {
          return res.status(200).json({ success: true, count: store.length, orders: store });
        }
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
          if (body.completedAt || order?.completedAt || targetStatus === 'completed') {
            store[existingIdx].completedAt = body.completedAt || order?.completedAt || store[existingIdx].completedAt || Date.now();
          }
          if (body.cookingStartedAt || order?.cookingStartedAt) {
            store[existingIdx].cookingStartedAt = body.cookingStartedAt || order?.cookingStartedAt;
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
              completedAt: store[existingIdx].completedAt || order.completedAt,
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
      return res.status(200).json({ success: true, count: store.length, orders: store });
    }

    if (req.method === 'DELETE') {
      const targetId = req.query?.orderId || (req.body ? (typeof req.body === 'string' ? JSON.parse(req.body) : req.body).orderId : null);
      if (targetId && targetId !== '*') {
        const cleanTarget = String(targetId).replace('#', '').trim();
        (global as any).__wrap_wing_orders = getStore().filter(
          (o: any) => o.orderId !== targetId && String(o.orderId).replace('#', '').trim() !== cleanTarget
        );
      } else {
        (global as any).__wrap_wing_orders = [];
      }
      store = getStore();
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
