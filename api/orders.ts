// Vercel Serverless Function for Live Order Synchronization
// Provides same-domain instant order relay between customer phones and counter tablets

let ordersStore: any[] = [];

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
