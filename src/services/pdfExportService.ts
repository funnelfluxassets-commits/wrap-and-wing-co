import { jsPDF } from 'jspdf';
import { LiveOrder, ReviewDrawEntry } from '../types';
import { TrafficDailyDoc } from './analyticsService';
import { getOrderDateString } from './orderService';

/**
 * Cleanly format currency in ZAR
 */
function formatZAR(val: number): string {
  return `R${(Number(val) || 0).toFixed(2)}`;
}

/**
 * Format timestamp into human readable South African format
 */
function getNowFormatted(): string {
  const d = new Date();
  return d.toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * ============================================================================
 * EXPORT CUSTOMER ORDERS & SALES REPORT TO PDF
 * ============================================================================
 */
export function exportOrdersToPdf(
  orders: LiveOrder[],
  dateLabel: string,
  metrics?: {
    totalRevenue: number;
    subtotal: number;
    deliveryFees: number;
    driverTips?: number;
    totalTips?: number;
    deliveriesCount: number;
    collectionsCount: number;
    totalItemsCount: number;
    avgOrderValue: number;
    [key: string]: any;
  }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 18;

  // Header Banner
  doc.setFillColor(19, 19, 26); // Dark Charcoal/Navy
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Line
  doc.setFillColor(245, 158, 11); // Amber
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  // Brand Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('WRAP & WINGS CO.', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(212, 212, 216);
  doc.text('Official Orders & Daily Sales Shift Report', margin, 18);

  // Meta on Right
  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11);
  doc.text(`Period: ${dateLabel}`, pageWidth - margin, 12, { align: 'right' });
  doc.setTextColor(161, 161, 170);
  doc.text(`Generated: ${getNowFormatted()}`, pageWidth - margin, 18, { align: 'right' });

  y = 38;

  // Compute Metrics if not provided
  let rev = metrics?.totalRevenue ?? 0;
  let count = orders.length;
  let delCount = metrics?.deliveriesCount ?? 0;
  let colCount = metrics?.collectionsCount ?? 0;
  let avgVal = metrics?.avgOrderValue ?? (count > 0 ? rev / count : 0);

  if (!metrics) {
    rev = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    delCount = orders.filter((o) => o.orderMode === 'delivery').length;
    colCount = orders.filter((o) => o.orderMode === 'collection').length;
    avgVal = count > 0 ? rev / count : 0;
  }

  // Single brand result color: vibrant blue matching Total Page Views
  const RESULT_BLUE: [number, number, number] = [59, 130, 246];

  // KPI Summary Boxes
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Executive Sales & Operations Summary', margin, y);
  y += 5;

  const cardWidth = (pageWidth - margin * 2 - 9) / 4;
  const cardHeight = 18;

  const kpis = [
    { label: 'TOTAL ORDERS', val: String(count), color: RESULT_BLUE },
    { label: 'GROSS SALES', val: formatZAR(rev), color: RESULT_BLUE },
    { label: 'DELIVERIES / COLLECTIONS', val: `${delCount} / ${colCount}`, color: RESULT_BLUE },
    { label: 'AVG TICKET', val: formatZAR(avgVal), color: RESULT_BLUE },
  ];

  kpis.forEach((kpi, idx) => {
    const x = margin + idx * (cardWidth + 3);
    doc.setFillColor(244, 244, 245);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(228, 228, 231);
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(113, 113, 122);
    doc.text(kpi.label, x + 3, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, x + cardWidth / 2, y + 13, { align: 'center' });
  });

  y += cardHeight + 8;

  // Orders Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(24, 24, 27);
  doc.text(`Customer Order Tickets (${orders.length})`, margin, y);
  y += 5;

  if (orders.length === 0) {
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 20, 2, 2, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122);
    doc.text(`No customer orders recorded for ${dateLabel}.`, pageWidth / 2, y + 11, { align: 'center' });
    y += 26;
  } else {
    // Table Columns Configuration
    const colX = [
      margin,             // Order ID
      margin + 22,        // Customer
      margin + 58,        // Phone
      margin + 88,        // Mode / Suburb
      margin + 128,       // Items Summary
      margin + 162,       // Total (Right aligned)
    ];

    // Table Header Row
    doc.setFillColor(244, 244, 245);
    doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(113, 113, 122);

    doc.text('TICKET', colX[0] + 2, y + 4.5);
    doc.text('CUSTOMER', colX[1], y + 4.5);
    doc.text('PHONE', colX[2], y + 4.5);
    doc.text('MODE / AREA', colX[3], y + 4.5);
    doc.text('MEAL ITEMS', colX[4], y + 4.5);
    doc.text('TOTAL', pageWidth - margin - 4, y + 4.5, { align: 'right' });

    y += 7.5;

    // Table Rows
    orders.forEach((o, index) => {
      // Check for page break
      if (y > pageHeight - 20) {
        doc.addPage();
        y = 16;
        // Repeat table header on new page
        doc.setFillColor(244, 244, 245);
        doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(113, 113, 122);
        doc.text('TICKET', colX[0] + 2, y + 4.5);
        doc.text('CUSTOMER', colX[1], y + 4.5);
        doc.text('PHONE', colX[2], y + 4.5);
        doc.text('MODE / AREA', colX[3], y + 4.5);
        doc.text('MEAL ITEMS', colX[4], y + 4.5);
        doc.text('TOTAL', pageWidth - margin - 4, y + 4.5, { align: 'right' });
        y += 7.5;
      }

      // Zebra striping
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y - 1, pageWidth - margin * 2, 7.5, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(24, 24, 27);
      doc.text(String(o.orderId || '-'), colX[0] + 2, y + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      const name = (o.customer?.customerName || 'Walk-in Diner').slice(0, 18);
      doc.text(name, colX[1], y + 4);

      const phone = o.customer?.phone || '-';
      doc.text(phone.slice(0, 14), colX[2], y + 4);

      const modeStr = `${o.orderMode === 'delivery' ? 'Del' : 'Pick'} • ${(o.customer?.suburb || 'Pinetown').slice(0, 14)}`;
      doc.text(modeStr, colX[3], y + 4);

      // Meal Items summary
      const itemsText = (o.items || [])
        .map((it) => `${it.quantity}x ${it.menuItem?.name || 'Meal'}`)
        .join(', ')
        .slice(0, 24);
      doc.setTextColor(82, 82, 91);
      doc.text(itemsText || '1x Order Item', colX[4], y + 4);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(RESULT_BLUE[0], RESULT_BLUE[1], RESULT_BLUE[2]);
      doc.text(formatZAR(o.grandTotal || 0), pageWidth - margin - 4, y + 4, { align: 'right' });

      y += 7.5;
    });
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(228, 228, 231);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text('Wrap & Wings Co. • Shop 1, 15 Kings Road, Pinetown • Official Audit Report', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Download File: "Daily Orders Report - date"
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateFormatted = `${day}-${month}-${year}`;

  doc.setProperties({ title: `Daily Orders Report - ${dateFormatted}` });
  doc.save(`Daily Orders Report - ${dateFormatted}.pdf`);
}

/**
 * ============================================================================
 * EXPORT CUSTOMER TRAFFIC & WEBSITE INTELLIGENCE TO PDF
 * ============================================================================
 */
export function exportTrafficToPdf(
  trafficSummary: TrafficDailyDoc,
  rangeLabel: string,
  ordersData: {
    ordersCount: number;
    revenue: number;
    itemsMap: Record<string, number>;
    totalItemsCount: number;
    flavourCounts?: Record<string, number>;
  }
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 18;

  // Single brand result color: vibrant blue matching Total Page Views
  const RESULT_BLUE: [number, number, number] = [59, 130, 246];

  // Header Banner
  doc.setFillColor(19, 19, 26);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Line
  doc.setFillColor(225, 29, 72); // Rose/Crimson
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  // Brand Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('WRAP & WINGS CO.', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(212, 212, 216);
  doc.text('Customer Traffic & Website Intelligence Report', margin, 18);

  // Meta on Right
  doc.setFontSize(8);
  doc.setTextColor(244, 63, 94);
  doc.text(`Period: ${rangeLabel}`, pageWidth - margin, 12, { align: 'right' });
  doc.setTextColor(161, 161, 170);
  doc.text(`Generated: ${getNowFormatted()}`, pageWidth - margin, 18, { align: 'right' });

  y = 35;

  // Calculate Totals & Rankings
  const itemsMap: Record<string, number> = { ...(ordersData.itemsMap || {}) };

  const sortedOrdered = Object.entries(itemsMap)
    .filter(([_, qty]) => qty > 0)
    .sort((a, b) => b[1] - a[1]);

  const totalOrderedUnits =
    ordersData.totalItemsCount ||
    sortedOrdered.reduce((s, [_, q]) => s + q, 0) ||
    0;

  const sortedCraved = Object.entries(trafficSummary.popularItems || {})
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  const totalCravedViews = sortedCraved.reduce((sum, [_, c]) => sum + c, 0);

  // ── AUDIENCE & DEMAND OVERVIEW KPI HERO CARDS ──
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Audience & Demand Overview', margin, y);
  y += 5;

  const cardWidth = (pageWidth - margin * 2 - 6) / 3;
  const cardHeight = 15;

  // All results recorded use the single blue color from Total Page Views
  const kpis = [
    { label: 'TOTAL PAGE VIEWS', val: String(trafficSummary.totalPageViews || 0), color: RESULT_BLUE },
    { label: 'UNIQUE DINERS', val: String(trafficSummary.uniqueVisitorIds?.length || 0), color: RESULT_BLUE },
    { label: 'ONLINE RIGHT NOW', val: '1', color: RESULT_BLUE },
    { label: 'ITEMS ORDERED', val: String(totalOrderedUnits), color: RESULT_BLUE },
    { label: 'MOST CRAVED ITEMS VIEWED', val: String(totalCravedViews), color: RESULT_BLUE },
    { label: 'RECORDED SALES', val: formatZAR(ordersData.revenue || 0), color: RESULT_BLUE },
  ];

  kpis.forEach((kpi, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const cx = margin + col * (cardWidth + 3);
    const cy = y + row * (cardHeight + 2);

    doc.setFillColor(244, 244, 245);
    doc.roundedRect(cx, cy, cardWidth, cardHeight, 2, 2, 'F');
    doc.setDrawColor(228, 228, 231);
    doc.roundedRect(cx, cy, cardWidth, cardHeight, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(113, 113, 122);
    doc.text(kpi.label, cx + 3, cy + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, cx + cardWidth / 2, cy + 11.5, { align: 'center' });
  });

  y += cardHeight * 2 + 2 + 6;

  // ── Two columns: Traffic Channels & Customer Devices ──
  const colWidth = (pageWidth - margin * 2 - 6) / 2;

  // Left Column: Where Diners Found You
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(24, 24, 27);
  doc.text('Where Diners Found You (Traffic Channels)', margin, y);

  // Right Column: Customer Devices
  doc.text('Customer Devices & Platform', margin + colWidth + 6, y);
  y += 4.5;

  const sourcesTotal =
    (trafficSummary.sources?.google_gmb || 0) +
    (trafficSummary.sources?.whatsapp || 0) +
    (trafficSummary.sources?.social || 0) +
    (trafficSummary.sources?.direct || 0) || 1;

  const sources = [
    { name: 'Google Search & Maps', count: trafficSummary.sources?.google_gmb || 0 },
    { name: 'WhatsApp Broadcasts & Chat', count: trafficSummary.sources?.whatsapp || 0 },
    { name: 'Social Media (Instagram/TikTok)', count: trafficSummary.sources?.social || 0 },
    { name: 'Direct wrapandwings.co.za', count: trafficSummary.sources?.direct || 0 },
  ];

  // Draw Sources Table
  doc.setFillColor(244, 244, 245);
  doc.roundedRect(margin, y, colWidth, 31, 2, 2, 'F');
  let sy = y + 4.5;
  sources.forEach((src) => {
    const pct = Math.round((src.count / sourcesTotal) * 100);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(55, 65, 81);
    doc.text(src.name, margin + 4, sy);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(RESULT_BLUE[0], RESULT_BLUE[1], RESULT_BLUE[2]);
    doc.text(`${src.count} (${pct}%)`, margin + colWidth - 4, sy, { align: 'right' });
    sy += 6.5;
  });

  // Draw Devices Table
  const devicesTotal =
    (trafficSummary.devices?.ios || 0) +
    (trafficSummary.devices?.android || 0) +
    (trafficSummary.devices?.desktop || 0) || 1;

  const devices = [
    { name: 'Apple iPhone (iOS)', count: trafficSummary.devices?.ios || 0 },
    { name: 'Android Smartphones', count: trafficSummary.devices?.android || 0 },
    { name: 'Desktop & Laptops', count: trafficSummary.devices?.desktop || 0 },
    { name: 'Online Right Now', count: 1 },
  ];

  doc.setFillColor(244, 244, 245);
  doc.roundedRect(margin + colWidth + 6, y, colWidth, 31, 2, 2, 'F');
  let dy = y + 4.5;
  devices.forEach((dev) => {
    const pct = Math.round((dev.count / devicesTotal) * 100);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(55, 65, 81);
    doc.text(dev.name, margin + colWidth + 10, dy);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(RESULT_BLUE[0], RESULT_BLUE[1], RESULT_BLUE[2]);
    doc.text(`${dev.count} ${dev.name.includes('Online') ? 'Active' : `(${pct}%)`}`, margin + colWidth * 2 + 2, dy, { align: 'right' });
    dy += 6.5;
  });

  y += 36;

  // ── Direct High-Intent Customer Actions ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(24, 24, 27);
  doc.text('High-Intent Customer Actions (1-Tap Engagements)', margin, y);
  y += 4.5;

  const actionCardWidth = (pageWidth - margin * 2 - 9) / 4;
  const actions = [
    { label: 'WHATSAPP CLICKS', val: String(trafficSummary.directActions?.whatsappChat || 0) },
    { label: 'PHONE CALLS', val: String(trafficSummary.directActions?.phoneCall || 0) },
    { label: 'MAPS / WAZE TAPS', val: String(trafficSummary.directActions?.directions || 0) },
    { label: 'COMPETITION ENTRIES', val: String(trafficSummary.directActions?.reviewDraw || 0) },
  ];

  actions.forEach((act, idx) => {
    const x = margin + idx * (actionCardWidth + 3);
    doc.setFillColor(244, 244, 245);
    doc.roundedRect(x, y, actionCardWidth, 13, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(113, 113, 122);
    doc.text(act.label, x + 3, y + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(RESULT_BLUE[0], RESULT_BLUE[1], RESULT_BLUE[2]);
    doc.text(act.val, x + actionCardWidth / 2, y + 9.5, { align: 'center' });
  });

  y += 18;

  // ── Two Tables: Items Ordered vs Most Craved Menu Items ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(24, 24, 27);
  doc.text(`Items Actually Ordered (${totalOrderedUnits} Units)`, margin, y);
  doc.text(`Most Craved Menu Items (${totalCravedViews} Views)`, margin + colWidth + 6, y);
  y += 4.5;

  // Table Headers
  doc.setFillColor(244, 244, 245);
  doc.rect(margin, y, colWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(113, 113, 122);
  doc.text('#', margin + 2.5, y + 3.8);
  doc.text('MEAL ITEM', margin + 8, y + 3.8);
  doc.text('QTY', margin + colWidth - 4, y + 3.8, { align: 'right' });

  const rx = margin + colWidth + 6;
  doc.setFillColor(244, 244, 245);
  doc.rect(rx, y, colWidth, 5.5, 'F');
  doc.text('#', rx + 2.5, y + 3.8);
  doc.text('CRAVED MENU ITEM', rx + 8, y + 3.8);
  doc.text('VIEWS', rx + colWidth - 4, y + 3.8, { align: 'right' });

  y += 6;

  const maxRows = Math.max(sortedOrdered.length, sortedCraved.length, 1);
  const rowsToDisplay = Math.min(maxRows, 7);

  for (let idx = 0; idx < rowsToDisplay; idx++) {
    const ord = sortedOrdered[idx];
    const crv = sortedCraved[idx];

    // Left Cell: Ordered Item
    if (ord) {
      if (idx % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y - 0.5, colWidth, 5, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(113, 113, 122);
      doc.text(String(idx + 1), margin + 2.5, y + 3.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(24, 24, 27);
      const name = ord[0].length > 25 ? ord[0].slice(0, 24) + '…' : ord[0];
      doc.text(name, margin + 8, y + 3.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(RESULT_BLUE[0], RESULT_BLUE[1], RESULT_BLUE[2]);
      doc.text(String(ord[1]), margin + colWidth - 4, y + 3.2, { align: 'right' });
    } else if (idx === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(161, 161, 170);
      doc.text('No food items ordered yet.', margin + 8, y + 3.2);
    }

    // Right Cell: Craved Item
    if (crv) {
      if (idx % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(rx, y - 0.5, colWidth, 5, 'F');
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(113, 113, 122);
      doc.text(String(idx + 1), rx + 2.5, y + 3.2);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(24, 24, 27);
      const name = crv[0].length > 25 ? crv[0].slice(0, 24) + '…' : crv[0];
      doc.text(name, rx + 8, y + 3.2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(RESULT_BLUE[0], RESULT_BLUE[1], RESULT_BLUE[2]);
      doc.text(String(crv[1]), rx + colWidth - 4, y + 3.2, { align: 'right' });
    } else if (idx === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(161, 161, 170);
      doc.text('No menu items craved yet.', rx + 8, y + 3.2);
    }

    y += 5.2;
  }

  y += 5;

  // ── Flavours Battle & Ordering Funnel Overview ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(24, 24, 27);
  doc.text('Signature Sauce Flavour Battle', margin, y);
  doc.text('Customer Ordering Funnel', margin + colWidth + 6, y);
  y += 4.5;

  // Left: Flavours Box (combines live traffic choices and actual order choices)
  doc.setFillColor(244, 244, 245);
  doc.roundedRect(margin, y, colWidth, 32, 2, 2, 'F');
  let fy = y + 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(113, 113, 122);
  doc.text('SAUCE FLAVOUR', margin + 4, fy);
  doc.text('CHOICES', margin + colWidth - 4, fy, { align: 'right' });
  fy += 4.5;

  const flavoursList = [
    { name: 'Lemony Basting', count: Math.max(trafficSummary.flavourPreferences?.lemony || 0, ordersData?.flavourCounts?.lemony || 0) },
    { name: 'Mild Basting', count: Math.max(trafficSummary.flavourPreferences?.mild || 0, ordersData?.flavourCounts?.mild || 0) },
    { name: 'Barbeque Basting', count: Math.max(trafficSummary.flavourPreferences?.bbq || 0, ordersData?.flavourCounts?.bbq || 0) },
    { name: 'Sweet Chilli Basting', count: Math.max(trafficSummary.flavourPreferences?.sweet_chilli || 0, ordersData?.flavourCounts?.sweet_chilli || 0) },
    { name: 'Hot Basting', count: Math.max(trafficSummary.flavourPreferences?.hot || 0, ordersData?.flavourCounts?.hot || 0) },
  ];
  flavoursList.forEach((flv) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(55, 65, 81);
    doc.text(flv.name, margin + 4, fy);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(RESULT_BLUE[0], RESULT_BLUE[1], RESULT_BLUE[2]);
    doc.text(String(flv.count), margin + colWidth - 4, fy, { align: 'right' });
    fy += 4.8;
  });

  // Right: Funnel Box (accurately captures completed orders, checkout starts, cart adds, and page views)
  doc.setFillColor(244, 244, 245);
  doc.roundedRect(rx, y, colWidth, 32, 2, 2, 'F');
  let fuy = y + 4.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(113, 113, 122);
  doc.text('ORDERING STAGE', rx + 4, fuy);
  doc.text('SESSIONS', rx + colWidth - 4, fuy, { align: 'right' });
  fuy += 5.5;

  const completedOrdersCount = Math.max(
    trafficSummary.funnel?.ordersCompleted || 0,
    ordersData?.ordersCount || 0
  );
  const checkoutCount = Math.max(
    trafficSummary.funnel?.checkoutStarts || 0,
    completedOrdersCount
  );
  const cartAddsCount = Math.max(
    trafficSummary.funnel?.cartAdds || 0,
    ordersData?.totalItemsCount || 0,
    completedOrdersCount
  );
  const menuViewsCount = Math.max(
    trafficSummary.funnel?.menuViews || 0,
    trafficSummary.totalPageViews || 0,
    cartAddsCount
  );

  const funnelSteps = [
    { name: '1. Menu Browsed', count: menuViewsCount },
    { name: '2. Items Added to Cart', count: cartAddsCount },
    { name: '3. Checkout Initiated', count: checkoutCount },
    { name: '4. Orders Completed', count: completedOrdersCount },
  ];
  funnelSteps.forEach((st) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(55, 65, 81);
    doc.text(st.name, rx + 4, fuy);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(RESULT_BLUE[0], RESULT_BLUE[1], RESULT_BLUE[2]);
    doc.text(String(st.count), rx + colWidth - 4, fuy, { align: 'right' });
    fuy += 5.5;
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(228, 228, 231);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text('Wrap & Wings Co. • Customer Traffic & Digital Intelligence Report', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  // Download File: "Traffic Insights - date"
  const now = new Date();
  const d = new Date(now);
  if (rangeLabel.toLowerCase().includes('yesterday')) {
    d.setDate(d.getDate() - 1);
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const dateFormatted = `${day}-${month}-${year}`;

  doc.setProperties({ title: `Traffic Insights - ${dateFormatted}` });
  doc.save(`Traffic Insights - ${dateFormatted}.pdf`);
}

/**
 * ============================================================================
 * EXPORT REVIEWS & MEAL COMPETITION ENTRIES TO PDF
 * ============================================================================
 */
export function exportReviewEntriesToPdf(entries: ReviewDrawEntry[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 18;

  // Header Banner
  doc.setFillColor(19, 19, 26);
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Line
  doc.setFillColor(245, 158, 11); // Amber
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  // Brand Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('WRAP & WINGS CO.', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(212, 212, 216);
  doc.text('Weekly Google Review Meal Contest Entries', margin, 18);

  // Meta on Right
  doc.setFontSize(8);
  doc.setTextColor(245, 158, 11);
  doc.text(`Total Entries: ${entries.length}`, pageWidth - margin, 12, { align: 'right' });
  doc.setTextColor(161, 161, 170);
  doc.text(`Generated: ${getNowFormatted()}`, pageWidth - margin, 18, { align: 'right' });

  y = 36;

  // Header
  doc.setFillColor(228, 228, 231);
  doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(39, 39, 42);
  doc.text('NAME', margin + 3, y + 4.5);
  doc.text('WHATSAPP PHONE', margin + 45, y + 4.5);
  doc.text('FAVOURITE MEAL', margin + 85, y + 4.5);
  doc.text('STATUS', margin + 140, y + 4.5);
  doc.text('DATE', pageWidth - margin - 3, y + 4.5, { align: 'right' });
  y += 7.5;

  entries.forEach((entry, idx) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 16;
      doc.setFillColor(228, 228, 231);
      doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(39, 39, 42);
      doc.text('NAME', margin + 3, y + 4.5);
      doc.text('WHATSAPP PHONE', margin + 45, y + 4.5);
      doc.text('FAVOURITE MEAL', margin + 85, y + 4.5);
      doc.text('STATUS', margin + 140, y + 4.5);
      doc.text('DATE', pageWidth - margin - 3, y + 4.5, { align: 'right' });
      y += 7.5;
    }

    if (idx % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y - 1, pageWidth - margin * 2, 7, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(24, 24, 27);
    const entryName = entry.fullName || (entry as any).customerName || '-';
    doc.text(entryName.slice(0, 22), margin + 3, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.text(entry.phone || '-', margin + 45, y + 3.5);
    const entryDetail = (entry as any).favoriteMeal || entry.receiptNumber || entry.comments || '-';
    doc.text(entryDetail.slice(0, 26), margin + 85, y + 3.5);

    const isWinner = entry.status === 'winner';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(isWinner ? 245 : 113, isWinner ? 158 : 113, isWinner ? 11 : 122);
    doc.text(isWinner ? 'WINNER' : 'PENDING', margin + 140, y + 3.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(113, 113, 122);
    const dateStr = entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('en-ZA') : '-';
    doc.text(dateStr, pageWidth - margin - 3, y + 3.5, { align: 'right' });

    y += 7;
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(228, 228, 231);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(113, 113, 122);
    doc.text('Wrap & Wings Co. • Weekly Google Review Draw Register', margin, pageHeight - 6);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  }

  doc.save('wrap-and-wings-review-entries.pdf');
}
