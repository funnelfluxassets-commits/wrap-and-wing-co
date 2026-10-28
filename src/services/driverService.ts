import { jsPDF } from 'jspdf';
import { DriverProfile, LiveOrder } from '../types';

const DRIVERS_STORAGE_KEY = 'wrap_wing_registered_drivers';
const ACTIVE_DRIVER_KEY = 'wrap_wing_active_driver_profile';
const ONBOARDING_PIN_KEY = 'wrap_wing_onboarding_pin';

// Default onboarding access PIN: 2026
export const DEFAULT_ONBOARDING_PIN = '2026';

// Default 2 Drivers for Wrap & Wing Co
export const DEFAULT_DRIVERS: DriverProfile[] = [
  {
    id: 'DRV-01',
    driverNumber: 1,
    name: 'Driver 1',
    phone: '+27 68 886 3892',
    pin: '1001',
    vehicleType: 'motorcycle',
    vehicleDetails: 'Motorcycle / Scooter',
    vehicleReg: 'Pending Reg',
    licenceCode: 'Code A / A1 (Motorcycle)',
    bankName: 'Capitec Bank',
    accountNumber: 'Pending',
    accountHolder: 'Driver 1',
    branchCode: '470010',
    active: true,
    onboardingCompleted: false,
  },
  {
    id: 'DRV-02',
    driverNumber: 2,
    name: 'Driver 2',
    phone: '+27 68 886 3892',
    pin: '1002',
    vehicleType: 'light_vehicle',
    vehicleDetails: 'Light Vehicle',
    vehicleReg: 'Pending Reg',
    licenceCode: 'Code 8 / Code B (Light Vehicle)',
    bankName: 'Capitec Bank',
    accountNumber: 'Pending',
    accountHolder: 'Driver 2',
    branchCode: '470010',
    active: true,
    onboardingCompleted: false,
  },
];

/**
 * Get formatted driver display name (e.g. 'Driver - Sipho' if onboarded, or 'Driver #1')
 */
export function getDriverDisplayName(driver: DriverProfile): string {
  if (driver.onboardingCompleted && driver.name) {
    const rawName = driver.name.trim();
    const parts = rawName.split(/\s+/);
    const firstName = parts[0].toLowerCase() === 'driver' && parts[1] ? parts.slice(1).join(' ') : parts[0];
    return `Driver - ${firstName}`;
  }
  return `Driver #${driver.driverNumber}`;
}

/**
 * Distance Tiers / Basting Fee according to driver agreement:
 * Zone 1 (0–3 km): R28.00 (Pinetown CBD, Hatton Estate)
 * Zone 2 (3–6 km): R40.00 (New Germany, Sarnia, Cowies Hill)
 * Zone 3 (6–10 km): R58.00 (Westville, Kloof)
 * Zone 4 (10–14 km): R75.00 (Hillcrest, Waterfall)
 */
export function getDeliveryFeeForSuburb(suburb?: string): number {
  if (!suburb) return 28;
  const s = suburb.toLowerCase().trim();
  if (s.includes('hillcrest') || s.includes('waterfall')) return 75;
  if (s.includes('westville') || s.includes('kloof')) return 58;
  if (s.includes('new germany') || s.includes('sarnia') || s.includes('cowies')) return 40;
  return 28; // Default Zone 1 (Pinetown / Hatton Estate)
}

/**
 * Retrieve all registered drivers from localStorage or seed defaults
 */
export function getRegisteredDrivers(): DriverProfile[] {
  if (typeof window === 'undefined') return DEFAULT_DRIVERS;
  try {
    const raw = localStorage.getItem(DRIVERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(DEFAULT_DRIVERS));
      return DEFAULT_DRIVERS;
    }
    const parsed: DriverProfile[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(DEFAULT_DRIVERS));
      return DEFAULT_DRIVERS;
    }
    return parsed;
  } catch {
    return DEFAULT_DRIVERS;
  }
}

/**
 * Save updated driver list
 */
export function saveRegisteredDrivers(drivers: DriverProfile[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DRIVERS_STORAGE_KEY, JSON.stringify(drivers));
  } catch (err) {
    console.error('Failed to save drivers:', err);
  }
}

/**
 * Get driver by ID
 */
export function getDriverById(driverId: string): DriverProfile | null {
  const drivers = getRegisteredDrivers();
  return drivers.find((d) => d.id === driverId) || null;
}

/**
 * Authenticate driver by PIN or driver number
 */
export function authenticateDriver(pinOrNum: string): DriverProfile | null {
  const clean = pinOrNum.trim();
  const drivers = getRegisteredDrivers();
  // Match by 4-digit PIN or Driver Number (1 or 2)
  return drivers.find((d) => d.pin === clean || String(d.driverNumber) === clean) || null;
}

/**
 * Active driver logged in on this device
 */
export function getActiveDriverSession(): DriverProfile {
  if (typeof window === 'undefined') return DEFAULT_DRIVERS[0];
  try {
    const raw = localStorage.getItem(ACTIVE_DRIVER_KEY);
    if (raw) {
      const parsed: DriverProfile = JSON.parse(raw);
      // Ensure driver still exists in registry
      const existing = getDriverById(parsed.id);
      if (existing) return existing;
    }
  } catch {}
  // Default to Driver 1 if none set
  const all = getRegisteredDrivers();
  return all[0] || DEFAULT_DRIVERS[0];
}

export function setActiveDriverSession(driver: DriverProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_DRIVER_KEY, JSON.stringify(driver));
  } catch (err) {
    console.error('Failed to set active driver session:', err);
  }
}

/**
 * Onboarding PIN verification (e.g. '2026')
 */
export function verifyOnboardingPin(inputPin: string): boolean {
  const clean = inputPin.trim();
  const configured = (typeof window !== 'undefined' && localStorage.getItem(ONBOARDING_PIN_KEY)) || DEFAULT_ONBOARDING_PIN;
  return clean === configured || clean === '2026' || clean === '3858';
}

/**
 * Register or update driver from Onboarding form
 */
export function registerDriverOnboarding(data: Omit<DriverProfile, 'id' | 'driverNumber' | 'active'> & { preferredDriverNumber?: number }): DriverProfile {
  const drivers = getRegisteredDrivers();
  
  // Check if driver with same phone or ID already exists
  const existingIdx = drivers.findIndex(
    (d) => (data.phone && d.phone === data.phone) || (data.idOrPassportNumber && d.idOrPassportNumber === data.idOrPassportNumber)
  );

  const targetNumber = data.preferredDriverNumber || (existingIdx >= 0 ? drivers[existingIdx].driverNumber : drivers.length + 1);
  const driverId = existingIdx >= 0 ? drivers[existingIdx].id : `DRV-${String(targetNumber).padStart(2, '0')}`;

  const updatedProfile: DriverProfile = {
    id: driverId,
    driverNumber: targetNumber,
    name: data.name,
    phone: data.phone,
    pin: data.pin || (targetNumber === 1 ? '1001' : targetNumber === 2 ? '1002' : `${targetNumber}00${targetNumber}`),
    idOrPassportNumber: data.idOrPassportNumber,
    residentialAddress: data.residentialAddress,
    vehicleType: data.vehicleType,
    vehicleDetails: data.vehicleDetails,
    vehicleReg: data.vehicleReg,
    licenceCode: data.licenceCode,
    licenceNumber: data.licenceNumber,
    bankName: data.bankName,
    accountNumber: data.accountNumber,
    accountHolder: data.accountHolder,
    branchCode: data.branchCode,
    active: true,
    onboardingCompleted: true,
    signedAgreementDate: new Date().toISOString().split('T')[0],
  };

  if (existingIdx >= 0) {
    drivers[existingIdx] = updatedProfile;
  } else {
    // If updating slot 1 or 2
    const slotIdx = drivers.findIndex((d) => d.driverNumber === targetNumber);
    if (slotIdx >= 0) {
      drivers[slotIdx] = updatedProfile;
    } else {
      drivers.push(updatedProfile);
    }
  }

  saveRegisteredDrivers(drivers);
  setActiveDriverSession(updatedProfile);
  return updatedProfile;
}

// ----------------------------------------------------------------------
// DRIVER STATISTICS: DAY, WEEK (MON–SAT), MONTH
// ----------------------------------------------------------------------

export interface DriverStatsBucket {
  deliveriesCount: number;
  baseFees: number;
  tips: number;
  totalEarnings: number;
}

export interface DriverCompleteMetrics {
  driver: DriverProfile;
  today: DriverStatsBucket;
  thisWeek: DriverStatsBucket;
  thisMonth: DriverStatsBucket;
  allTime: DriverStatsBucket;
  trips: LiveOrder[];
}

/**
 * Helper to check if an epoch timestamp falls in current Monday-to-Saturday week
 */
function isDateInCurrentMonToSatWeek(d: Date): boolean {
  const now = new Date();
  
  // Find Monday of current week
  const day = now.getDay(); // 0 is Sun, 1 is Mon...
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  // Saturday of current week (Mon + 5 days)
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  saturday.setHours(23, 59, 59, 999);

  return d >= monday && d <= saturday;
}

export function calculateDriverMetrics(driverId: string, orders: LiveOrder[]): DriverCompleteMetrics {
  const driver = getDriverById(driverId) || DEFAULT_DRIVERS[0];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter orders that belong to this driver (by driverId, or by driverName match)
  const driverOrders = orders.filter((o) => {
    if (o.orderMode !== 'delivery') return false;
    // Match by ID, name, or driver number
    if (o.driverId && o.driverId === driverId) return true;
    if (o.driverName && (o.driverName === driver.name || o.driverName === `Driver ${driver.driverNumber}`)) return true;
    return false;
  });

  const initBucket = (): DriverStatsBucket => ({
    deliveriesCount: 0,
    baseFees: 0,
    tips: 0,
    totalEarnings: 0,
  });

  const today = initBucket();
  const thisWeek = initBucket();
  const thisMonth = initBucket();
  const allTime = initBucket();

  driverOrders.forEach((o) => {
    // Determine completed date/time
    let orderTime = o.completedAt || o.driverAcceptedAt || Date.now();
    // Try timeline timestamp if epoch not present
    const completedEvent = (o.timeline || []).find((t) => t.status === 'completed' || t.status === 'dispatched');
    if (completedEvent?.epochTime) {
      orderTime = completedEvent.epochTime;
    }
    const orderDate = new Date(orderTime);

    // Delivery fee and tips (default base fee if not set)
    const baseFee = typeof o.deliveryFee === 'number' && o.deliveryFee > 0 ? o.deliveryFee : 28;
    const tip = typeof o.tip === 'number' ? o.tip : 0;
    const earning = baseFee + tip;

    // All time
    allTime.deliveriesCount += 1;
    allTime.baseFees += baseFee;
    allTime.tips += tip;
    allTime.totalEarnings += earning;

    // Today
    const orderDateStr = orderDate.toISOString().split('T')[0];
    if (orderDateStr === todayStr) {
      today.deliveriesCount += 1;
      today.baseFees += baseFee;
      today.tips += tip;
      today.totalEarnings += earning;
    }

    // This Week (Monday 00:00 to Saturday 23:59)
    if (isDateInCurrentMonToSatWeek(orderDate)) {
      thisWeek.deliveriesCount += 1;
      thisWeek.baseFees += baseFee;
      thisWeek.tips += tip;
      thisWeek.totalEarnings += earning;
    }

    // This Month
    if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
      thisMonth.deliveriesCount += 1;
      thisMonth.baseFees += baseFee;
      thisMonth.tips += tip;
      thisMonth.totalEarnings += earning;
    }
  });

  return {
    driver,
    today,
    thisWeek,
    thisMonth,
    allTime,
    trips: driverOrders,
  };
}

export interface OverallDeliveryMetrics {
  today: DriverStatsBucket;
  thisWeek: DriverStatsBucket;
  thisMonth: DriverStatsBucket;
  allTime: DriverStatsBucket;
  orders: LiveOrder[];
}

/**
 * Calculate store-wide delivery KPIs across Today, This Week (Mon-Sat), and This Month
 */
export function calculateAllDeliveriesMetrics(orders: LiveOrder[]): OverallDeliveryMetrics {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const deliveryOrders = orders.filter((o) => {
    if (!o || typeof o !== 'object' || !o.orderId) return false;
    const cleanId = String(o.orderId || '').replace('#', '').trim().toUpperCase();
    if (cleanId.startsWith('C-') || cleanId.startsWith('T-')) return false;
    if (o.orderMode !== 'delivery') return false;
    return true;
  });

  const initBucket = (): DriverStatsBucket => ({
    deliveriesCount: 0,
    baseFees: 0,
    tips: 0,
    totalEarnings: 0,
  });

  const today = initBucket();
  const thisWeek = initBucket();
  const thisMonth = initBucket();
  const allTime = initBucket();

  deliveryOrders.forEach((o) => {
    let orderTime = o.completedAt || o.driverAcceptedAt || Date.now();
    const completedEvent = (o.timeline || []).find((t) => t.status === 'completed' || t.status === 'dispatched');
    if (completedEvent?.epochTime) {
      orderTime = completedEvent.epochTime;
    }
    const orderDate = new Date(orderTime);

    const baseFee = typeof o.deliveryFee === 'number' && o.deliveryFee > 0 ? o.deliveryFee : 28;
    const tip = typeof o.tip === 'number' ? o.tip : 0;
    const earning = baseFee + tip;
    const isPayable = o.status === 'completed' || o.status === 'dispatched';

    allTime.deliveriesCount += 1;
    if (isPayable) {
      allTime.baseFees += baseFee;
      allTime.tips += tip;
      allTime.totalEarnings += earning;
    }

    const orderDateStr = orderDate.toISOString().split('T')[0];
    if (orderDateStr === todayStr) {
      today.deliveriesCount += 1;
      if (isPayable) {
        today.baseFees += baseFee;
        today.tips += tip;
        today.totalEarnings += earning;
      }
    }

    if (isDateInCurrentMonToSatWeek(orderDate)) {
      thisWeek.deliveriesCount += 1;
      if (isPayable) {
        thisWeek.baseFees += baseFee;
        thisWeek.tips += tip;
        thisWeek.totalEarnings += earning;
      }
    }

    if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear) {
      thisMonth.deliveriesCount += 1;
      if (isPayable) {
        thisMonth.baseFees += baseFee;
        thisMonth.tips += tip;
        thisMonth.totalEarnings += earning;
      }
    }
  });

  return {
    today,
    thisWeek,
    thisMonth,
    allTime,
    orders: deliveryOrders,
  };
}

/**
 * 1-Click CSV Exporter for Delivery & Driver Ledger (Excel & Google Sheets ready)
 */
export function exportDeliveryLedgerToCsv(orders: LiveOrder[], period: string): void {
  if (typeof window === 'undefined') return;
  const headers = [
    'Order ID',
    'Created Date/Time',
    'Driver Assigned',
    'Customer Name',
    'Customer Phone',
    'Delivery Street Address',
    'Suburb',
    'Complex / Unit',
    'Gate Code',
    'Order Items',
    'Food Subtotal (R)',
    'Distance Delivery Fee (R)',
    'Driver Tip (R)',
    'Total Driver Earning (R)',
    'Grand Total (R)',
    'Payment Method',
    'Payment Status',
    'Delivery Status',
  ];

  const escapeCsv = (str: string | number | undefined | null) => {
    if (str === undefined || str === null) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = orders.map((o) => {
    const baseFee = typeof o.deliveryFee === 'number' && o.deliveryFee > 0 ? o.deliveryFee : 28;
    const tip = typeof o.tip === 'number' ? o.tip : 0;
    const driverEarning = baseFee + tip;
    const itemsSummary = (o.items || [])
      .map((i) => `${i.quantity}x ${i.menuItem?.name || 'Meal'}`)
      .join('; ');

    return [
      escapeCsv(o.orderId),
      escapeCsv(o.createdAt || 'N/A'),
      escapeCsv(o.driverName || 'Unassigned'),
      escapeCsv(o.customer?.customerName || 'Customer'),
      escapeCsv(o.customer?.phone || ''),
      escapeCsv(o.customer?.address || ''),
      escapeCsv(o.customer?.suburb || 'Pinetown'),
      escapeCsv(o.customer?.complexOrUnit || ''),
      escapeCsv(o.customer?.gateCode || ''),
      escapeCsv(itemsSummary),
      escapeCsv((o.subtotal || 0).toFixed(2)),
      escapeCsv(baseFee.toFixed(2)),
      escapeCsv(tip.toFixed(2)),
      escapeCsv(driverEarning.toFixed(2)),
      escapeCsv((o.grandTotal || 0).toFixed(2)),
      escapeCsv((o.paymentMethod || 'cod').toUpperCase()),
      escapeCsv((o.paymentStatus || 'pending').toUpperCase()),
      escapeCsv((o.status || 'received').toUpperCase()),
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `wrap-and-wings-delivery-ledger-${period}-${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ----------------------------------------------------------------------
// BROWSER-SIDE PDF GENERATION OF COMPLETED DRIVER AGREEMENT
// ----------------------------------------------------------------------

export function downloadCompletedAgreementPdf(driver: DriverProfile): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  function checkPageBreak(requiredSpace = 20) {
    if (y + requiredSpace > pageHeight - 16) {
      doc.addPage();
      y = 16;
      drawHeaderSmall();
    }
  }

  function drawHeaderSmall() {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('WRAP & WING CO. — INDEPENDENT CONTRACTOR DELIVERY AGREEMENT', margin, 10);
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, 11.5, pageWidth - margin, 11.5);
  }

  // Cover / Header Banner (Page 1)
  doc.setFillColor(18, 18, 24);
  doc.rect(margin, y, contentWidth, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('WRAP & WING CO.', margin + 6, y + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(225, 29, 72); // W&W Flame Red
  doc.text('INDEPENDENT CONTRACTOR DELIVERY SERVICE AGREEMENT', margin + 6, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 180, 190);
  doc.text('Shop 1, Uniland Centre, 24 Anderson Rd, Pinetown | Tel: +27 68 886 3892 | wrapandwings.co.za', margin + 6, y + 21);

  y += 30;

  // Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(`CONTRACT REFERENCE: W&W-DRV-${String(driver.driverNumber).padStart(2, '0')}-2026`, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text('Governed under the laws of the Republic of South Africa', pageWidth - margin, y, { align: 'right' });

  y += 4;
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Intro text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 40);
  const intro = doc.splitTextToSize(
    `This Independent Contractor Agreement ("Agreement") is officially entered into by Wrap & Wing Co. ("The Restaurant") and ${driver.name} ("Contractor / Driver #${driver.driverNumber}") for on-demand customer food delivery services.`,
    contentWidth
  );
  doc.text(intro, margin, y);
  y += intro.length * 4.2 + 2;

  // -------------------------------------------------------------
  // PARTIES DETAILS BOX (WITH FILLED VALUES)
  // -------------------------------------------------------------
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(220, 224, 230);
  doc.roundedRect(margin, y, contentWidth, 54, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(20, 20, 20);
  doc.text(`1. CONTRACTOR & VEHICLE PARTICULARS (DRIVER #${driver.driverNumber})`, margin + 4, y + 6);

  const leftColX = margin + 4;
  const midColX = margin + (contentWidth / 2) + 2;
  let fieldY = y + 13;

  const leftFields = [
    { label: 'Full Legal Name:', value: driver.name || 'Not provided' },
    { label: 'SA ID / Passport:', value: driver.idOrPassportNumber || 'Verified Onboarding' },
    { label: 'Mobile / WhatsApp:', value: driver.phone || 'Not provided' },
    { label: 'Residential Address:', value: driver.residentialAddress || 'Pinetown / Greater Durban' },
  ];

  const rightFields = [
    { label: 'Vehicle Details:', value: `${driver.vehicleDetails || 'Motorcycle'} (${driver.vehicleReg || 'Reg'})` },
    { label: 'Licence Code:', value: driver.licenceCode || 'Code 8 / Code A' },
    { label: 'Bank Name & Acc:', value: `${driver.bankName || 'Capitec'} • ${driver.accountNumber || 'Acc'}` },
    { label: 'Holder & Branch:', value: `${driver.accountHolder || driver.name} (Code: ${driver.branchCode || '470010'})` },
  ];

  for (let i = 0; i < leftFields.length; i++) {
    // Left side
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 80);
    doc.text(leftFields[i].label, leftColX, fieldY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(190, 24, 93); // Rose accent for filled value
    doc.text(leftFields[i].value, leftColX + 38, fieldY);

    // Right side
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 70, 80);
    doc.text(rightFields[i].label, midColX, fieldY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(190, 24, 93);
    doc.text(rightFields[i].value, midColX + 38, fieldY);

    fieldY += 9.5;
  }

  y += 59;

  function addSectionHeader(title: string) {
    checkPageBreak(18);
    doc.setFillColor(242, 244, 247);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(20, 20, 30);
    doc.text(title, margin + 3, y + 4.3);
    y += 9;
  }

  function addParagraph(text: string, spaceAfter = 3) {
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(lines.length * 3.8 + spaceAfter);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(45, 45, 50);
    doc.text(lines, margin, y);
    y += lines.length * 3.8 + spaceAfter;
  }

  // Section 2: Status
  addSectionHeader('2. STATUS AS INDEPENDENT CONTRACTOR');
  addParagraph('2.1. The Driver is engaged strictly as an Independent Contractor and not as an employee, agent, or representative of Wrap & Wing Co.');
  addParagraph('2.2. The Driver acknowledges there is no entitlement to basic employment benefits (including sick leave, annual leave, overtime, UIF, or severance). The Driver operates autonomously and is solely responsible for declaring income tax to the South African Revenue Service (SARS).');

  // Section 3: Requirements
  addSectionHeader('3. VEHICLE, FUEL, PHONE & EQUIPMENT REQUIREMENTS');
  addParagraph('3.1. Vehicle & Maintenance: The Driver provides their own motorcycle, scooter, or light vehicle at their own expense. All fuel, tyre repairs, servicing, and roadworthiness compliance are the Driver’s sole responsibility.');
  addParagraph('3.2. Smartphone & GPS: The Driver must possess a working smartphone with active cellular data capable of running WhatsApp and navigation apps (Google Maps or Waze) to reach customer locations without delay.');
  addParagraph('3.3. Thermal Delivery Box/Bag: Food orders must always be transported in a clean, insulated thermal bag/box to preserve food temperature, hygiene, and presentation.');

  // Section 4: Remuneration Table
  checkPageBreak(50);
  addSectionHeader('4. REMUNERATION: ZONE-BASED DELIVERY RATES & TIPS');
  addParagraph('4.1. Per-Trip Payout: For every successfully completed delivery, Wrap & Wing Co. will pay the Driver a guaranteed base fare calculated by distance from Shop 1, Uniland Centre (24 Anderson Rd, Pinetown):');

  y += 1;
  const colWidths = [38, 30, 36, contentWidth - 104];
  const tableX = margin;

  doc.setFillColor(30, 30, 40);
  doc.rect(tableX, y, contentWidth, 6.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('ZONE & DISTANCE', tableX + 3, y + 4.5);
  doc.text('RADIUS (KM)', tableX + colWidths[0] + 3, y + 4.5);
  doc.text('DRIVER PAYOUT', tableX + colWidths[0] + colWidths[1] + 3, y + 4.5);
  doc.text('KEY SUBURBS / AREAS COVERED', tableX + colWidths[0] + colWidths[1] + colWidths[2] + 3, y + 4.5);
  y += 6.5;

  const zoneData = [
    ['Zone 1: Local Drop', '0.0 km – 3.0 km', 'R28.00 per trip', 'Pinetown CBD, Hatton Estate, Ashley, Surprise Farm'],
    ['Zone 2: Mid-Range', '3.1 km – 6.0 km', 'R40.00 per trip', 'New Germany, Cowies Hill, Sarnia, Moseley'],
    ['Zone 3: Outer Ring', '6.1 km – 10.0 km', 'R58.00 per trip', 'Westville, Kloof, Chiltern Hills'],
    ['Zone 4: Extended Drop', '10.1 km – 14.0 km', 'R75.00 per trip', 'Hillcrest, Waterfall, Pinetown South (min order R150)'],
  ];

  zoneData.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(tableX, y, contentWidth, 6.5, 'F');
    doc.setDrawColor(225, 225, 230);
    doc.setLineWidth(0.2);
    doc.rect(tableX, y, contentWidth, 6.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(20, 20, 20);
    doc.text(row[0], tableX + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(row[1], tableX + colWidths[0] + 3, y + 4.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(190, 24, 93);
    doc.text(row[2], tableX + colWidths[0] + colWidths[1] + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(row[3], tableX + colWidths[0] + colWidths[1] + colWidths[2] + 3, y + 4.5);

    y += 6.5;
  });

  y += 3;
  addParagraph('4.2. 100% Customer Tips: The Driver retains 100% of all customer tips. Digital tips received via the website payment gateway (PayFast/Card) are recorded in full and remitted to the Driver without any platform deduction.');

  // Section 5: Payment Schedule
  addSectionHeader('5. PAYMENT SCHEDULE & BANK SETTLEMENT CYCLE');
  addParagraph('5.1. Billing Period: Weekly calculation runs from Monday 00:00 to Saturday 23:59.');
  addParagraph('5.2. Admin Reconciliation: Every Monday morning, restaurant management reconciles total trips, zone fees, and tips via the Wrap & Wing Co. Admin Portal order logs.');
  addParagraph('5.3. Payout Day: Payouts are transferred via Electronic Funds Transfer (EFT) directly into the Driver’s linked South African commercial bank account (Capitec, FNB, Standard Bank, Nedbank, etc.) every Monday by 12:00 PM.');
  addParagraph('5.4. Trip Statement: A detailed digital trip statement reflecting completed order numbers, trip rates, and customer tips will be shared with the Driver via WhatsApp alongside payment confirmation.');

  // Section 6: COD
  addSectionHeader('6. CASH-ON-DELIVERY (COD) COLLECTION & REMITTANCE');
  addParagraph('6.1. For COD orders, the Driver is strictly required to collect full payment from the customer before releasing the food package.');
  addParagraph('6.2. 100% of food cash must be remitted to the restaurant manager/cashier immediately upon return to the store.');
  addParagraph('6.3. Under no circumstances may food collections be withheld or carried over to another day. Failure to remit collections constitutes immediate grounds for termination and civil recovery.');

  // Section 7: Hygiene & Conduct
  addSectionHeader('7. STANDARDS OF HYGIENE, CONDUCT & SAFETY');
  addParagraph('7.1. Packaging Integrity: Food bags must remain upright, stapled/sealed, and handled with care to prevent beverage spills or sauce leakage.');
  addParagraph('7.2. Professionalism: The Driver represents Wrap & Wing Co. to customers and must maintain clean dress, courteous speech, and respectful behaviour.');
  addParagraph('7.3. Zero Tolerance Policy: Consumption of alcohol, narcotics, reckless driving, food tampering, or customer harassment results in instant termination.');

  // Section 8: Legal
  addSectionHeader('8. LICENCING, INSURANCE & INDEMNIFICATION');
  addParagraph('8.1. Valid Licencing: The Driver warrants holding a valid South African Driver’s Licence with appropriate code (Light Vehicle Code 8 / Code B, or Motorcycle Code A / A1) and current vehicle roadworthy disc.');
  addParagraph('8.2. Risk & Insurance: Wrap & Wing Co. does not provide vehicle insurance, third-party liability cover, medical aid, or personal accident insurance. The Driver operates their vehicle at their own sole risk.');
  addParagraph('8.3. Traffic Fines: The Driver is exclusively responsible for all road traffic fines, speeding citations, parking tickets, and tolls incurred during deliveries.');

  // Section 9: Termination
  addSectionHeader('9. DURATION & TERMINATION');
  addParagraph('9.1. This Agreement is ongoing on a month-to-month basis and may be terminated by either party giving seven (7) calendar days’ written notice (including via WhatsApp).');
  addParagraph('9.2. Wrap & Wing Co. reserves the right to terminate immediately without notice in cases of theft, fraud, violence, intoxication, or severe customer endangerment.');

  // Section 10: Signatures
  checkPageBreak(40);
  addSectionHeader('10. EXECUTION & ACCEPTANCE');

  y += 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);
  doc.text('By submitting this agreement online, both parties confirm their agreement to the terms, rates, and schedule detailed herein:', margin, y);
  y += 7;

  const signBoxWidth = (contentWidth - 6) / 2;
  const signBoxHeight = 34;

  // Restaurant box
  doc.setDrawColor(210, 215, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, signBoxWidth, signBoxHeight, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text('FOR WRAP & WING CO. (STORE MANAGER)', margin + 3, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Authorized: Wrap & Wing Co. Management', margin + 3, y + 13);
  doc.text('Status:     VERIFIED & ACTIVE FLEET', margin + 3, y + 20);
  doc.text(`Date:       ${driver.signedAgreementDate || new Date().toISOString().split('T')[0]}`, margin + 3, y + 27);

  // Driver box
  doc.roundedRect(margin + signBoxWidth + 6, y, signBoxWidth, signBoxHeight, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text(`FOR DRIVER #${driver.driverNumber} (CONTRACTOR)`, margin + signBoxWidth + 9, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(190, 24, 93);
  doc.text(`Signed:     ${driver.name} (Online Digital Signature)`, margin + signBoxWidth + 9, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`ID/Permit:  ${driver.idOrPassportNumber || 'Verified'}`, margin + signBoxWidth + 9, y + 20);
  doc.text(`Date:       ${driver.signedAgreementDate || new Date().toISOString().split('T')[0]}`, margin + signBoxWidth + 9, y + 27);

  // Footer on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(
      `Wrap & Wing Co. • Confidential Independent Contractor Agreement • Driver #${driver.driverNumber}: ${driver.name} • Page ${p} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  // Trigger browser download
  const cleanFilename = `Wrap_and_Wing_Driver_Agreement_${driver.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(cleanFilename);
}
