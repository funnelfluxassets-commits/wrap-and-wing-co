import { jsPDF } from 'jspdf';
import fs from 'fs';

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

// -------------------------------------------------------------
// COVER / HEADER BANNER (Page 1)
// -------------------------------------------------------------
doc.setFillColor(18, 18, 24); // Dark charcoal
doc.rect(margin, y, contentWidth, 24, 'F');

doc.setFont('helvetica', 'bold');
doc.setFontSize(15);
doc.setTextColor(255, 255, 255);
doc.text('WRAP & WING CO.', margin + 6, y + 9);

doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(225, 29, 72); // W&W Flame Red
doc.text('INDEPENDENT CONTRACTOR DELIVERY SERVICE AGREEMENT', margin + 6, y + 16);

doc.setFontSize(7.5);
doc.setTextColor(180, 180, 190);
doc.text('Shop 1, Uniland Centre, 24 Anderson Rd, Pinetown | Tel: +27 68 886 3892 | wrapandwings.co.za', margin + 6, y + 21);

y += 30;

// Subtitle
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.setTextColor(30, 30, 30);
doc.text('CONTRACT REFERENCE: W&W-DRV-2026', margin, y);
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
  'This Independent Contractor Agreement ("Agreement") is made between Wrap & Wing Co. ("The Restaurant") and the Independent Driver ("Contractor") identified below for the provision of on-demand customer food delivery services.',
  contentWidth
);
doc.text(intro, margin, y);
y += intro.length * 4.2 + 2;

// -------------------------------------------------------------
// PARTIES DETAILS BOX
// -------------------------------------------------------------
doc.setFillColor(248, 249, 250);
doc.setDrawColor(220, 224, 230);
doc.roundedRect(margin, y, contentWidth, 54, 2, 2, 'FD');

doc.setFont('helvetica', 'bold');
doc.setFontSize(9);
doc.setTextColor(20, 20, 20);
doc.text('1. CONTRACTOR & VEHICLE PARTICULARS', margin + 4, y + 6);

const leftColX = margin + 4;
const midColX = margin + (contentWidth / 2) + 2;
let fieldY = y + 13;

doc.setFontSize(8);
const fields = [
  { label: 'Full Legal Name:', line: true },
  { label: 'SA ID / Passport / Permit No:', line: true },
  { label: 'Mobile / WhatsApp No:', line: true },
  { label: 'Residential Address:', line: true },
];

const fieldsRight = [
  { label: 'Vehicle Make, Model & Colour:', line: true },
  { label: 'Registration No & Licence Code:', line: true },
  { label: 'Bank Name & Account No:', line: true },
  { label: 'Account Holder & Branch Code:', line: true },
];

for (let i = 0; i < fields.length; i++) {
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(70, 70, 80);
  doc.text(fields[i].label, leftColX, fieldY);
  doc.setFont('helvetica', 'normal');
  doc.setDrawColor(180, 180, 180);
  doc.line(leftColX + 38, fieldY, leftColX + (contentWidth / 2) - 6, fieldY);

  doc.setFont('helvetica', 'bold');
  doc.text(fieldsRight[i].label, midColX, fieldY);
  doc.setFont('helvetica', 'normal');
  doc.line(midColX + 44, fieldY, pageWidth - margin - 4, fieldY);

  fieldY += 9.5;
}

y += 59;

// -------------------------------------------------------------
// SECTION HELPERS
// -------------------------------------------------------------
function addSectionHeader(title) {
  checkPageBreak(18);
  doc.setFillColor(242, 244, 247);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(20, 20, 30);
  doc.text(title, margin + 3, y + 4.3);
  y += 9;
}

function addParagraph(text, spaceAfter = 3) {
  const lines = doc.splitTextToSize(text, contentWidth);
  checkPageBreak(lines.length * 3.8 + spaceAfter);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(45, 45, 50);
  doc.text(lines, margin, y);
  y += lines.length * 3.8 + spaceAfter;
}

// -------------------------------------------------------------
// SECTION 2: STATUS
// -------------------------------------------------------------
addSectionHeader('2. STATUS AS INDEPENDENT CONTRACTOR');
addParagraph('2.1. The Driver is engaged strictly as an Independent Contractor and not as an employee, agent, or representative of Wrap & Wing Co.');
addParagraph('2.2. The Driver acknowledges there is no entitlement to basic employment benefits (including sick leave, annual leave, overtime, UIF, or severance). The Driver operates autonomously and is solely responsible for declaring income tax to the South African Revenue Service (SARS).');

// -------------------------------------------------------------
// SECTION 3: VEHICLE & EQUIPMENT
// -------------------------------------------------------------
addSectionHeader('3. VEHICLE, FUEL, PHONE & EQUIPMENT REQUIREMENTS');
addParagraph('3.1. Vehicle & Maintenance: The Driver provides their own motorcycle, scooter, or vehicle at their own expense. All fuel, tyre repairs, servicing, and roadworthiness compliance are the Driver’s sole responsibility.');
addParagraph('3.2. Smartphone & GPS: The Driver must possess a working smartphone with active cellular data capable of running WhatsApp and navigation apps (Google Maps or Waze) to reach customer locations without delay.');
addParagraph('3.3. Thermal Delivery Box/Bag: Food orders must always be transported in a clean, insulated thermal bag/box to preserve food temperature, hygiene, and presentation.');

// -------------------------------------------------------------
// SECTION 4: DELIVERY FEES & DISTANCE BANDS (TABLE)
// -------------------------------------------------------------
checkPageBreak(50);
addSectionHeader('4. REMUNERATION: ZONE-BASED DELIVERY RATES & TIPS');
addParagraph('4.1. Per-Trip Payout: For every successfully completed delivery, Wrap & Wing Co. will pay the Driver a guaranteed base fare calculated by distance from Shop 1, Uniland Centre (24 Anderson Rd, Pinetown):');

y += 1;
// Table Header
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
  doc.setTextColor(190, 24, 93); // Rose accent
  doc.text(row[2], tableX + colWidths[0] + colWidths[1] + 3, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(row[3], tableX + colWidths[0] + colWidths[1] + colWidths[2] + 3, y + 4.5);

  y += 6.5;
});

y += 3;
addParagraph('4.2. 100% Customer Tips: The Driver retains 100% of all customer tips. Digital tips received via the website payment gateway (PayFast/Card) are recorded in full and remitted to the Driver without any platform deduction.');

// -------------------------------------------------------------
// SECTION 5: PAYMENT SCHEDULE
// -------------------------------------------------------------
addSectionHeader('5. PAYMENT SCHEDULE & BANK SETTLEMENT CYCLE');
addParagraph('5.1. Billing Period: Weekly calculation runs from Monday 00:00 to Saturday 23:59.');
addParagraph('5.2. Admin Reconciliation: Every Monday morning, restaurant management reconciles total trips, zone fees, and tips via the Wrap & Wing Co. Admin Portal order logs.');
addParagraph('5.3. Payout Day: Payouts are transferred via Electronic Funds Transfer (EFT) directly into the Driver’s linked South African commercial bank account (Capitec, FNB, Standard Bank, Nedbank, etc.) every Monday by 12:00 PM.');
addParagraph('5.4. Trip Statement: A detailed digital trip statement reflecting completed order numbers, trip rates, and customer tips will be shared with the Driver via WhatsApp alongside payment confirmation.');

// -------------------------------------------------------------
// SECTION 6: COD
// -------------------------------------------------------------
addSectionHeader('6. CASH-ON-DELIVERY (COD) COLLECTION & REMITTANCE');
addParagraph('6.1. For COD orders, the Driver is strictly required to collect full payment from the customer before releasing the food package.');
addParagraph('6.2. 100% of food cash must be remitted to the restaurant manager/cashier immediately upon return to the store.');
addParagraph('6.3. Under no circumstances may food collections be withheld or carried over to another day. Failure to remit collections constitutes immediate grounds for termination and civil recovery.');

// -------------------------------------------------------------
// SECTION 7: HYGIENE & CONDUCT
// -------------------------------------------------------------
addSectionHeader('7. STANDARDS OF HYGIENE, CONDUCT & SAFETY');
addParagraph('7.1. Packaging Integrity: Food bags must remain upright, stapled/sealed, and handled with care to prevent beverage spills or sauce leakage.');
addParagraph('7.2. Professionalism: The Driver represents Wrap & Wing Co. to customers and must maintain clean dress, courteous speech, and respectful behaviour.');
addParagraph('7.3. Zero Tolerance Policy: Consumption of alcohol, narcotics, reckless driving, food tampering, or customer harassment results in instant termination.');

// -------------------------------------------------------------
// SECTION 8: LEGAL & LIABILITY
// -------------------------------------------------------------
addSectionHeader('8. LICENCING, INSURANCE & INDEMNIFICATION');
addParagraph('8.1. Valid Licencing: The Driver warrants holding a valid South African Driver’s Licence with appropriate code (Light Vehicle Code 8 / Code B, or Motorcycle Code A / A1) and current vehicle roadworthy disc.');
addParagraph('8.2. Risk & Insurance: Wrap & Wing Co. does not provide vehicle insurance, third-party liability cover, medical aid, or personal accident insurance. The Driver operates their vehicle at their own sole risk.');
addParagraph('8.3. Traffic Fines: The Driver is exclusively responsible for all road traffic fines, speeding citations, parking tickets, and tolls incurred during deliveries.');

// -------------------------------------------------------------
// SECTION 9: TERMINATION
// -------------------------------------------------------------
addSectionHeader('9. DURATION & TERMINATION');
addParagraph('9.1. This Agreement is ongoing on a month-to-month basis and may be terminated by either party giving seven (7) calendar days’ written notice (including via WhatsApp).');
addParagraph('9.2. Wrap & Wing Co. reserves the right to terminate immediately without notice in cases of theft, fraud, violence, intoxication, or severe customer endangerment.');

// -------------------------------------------------------------
// SECTION 10: SIGNATURES
// -------------------------------------------------------------
checkPageBreak(40);
addSectionHeader('10. EXECUTION & ACCEPTANCE');

y += 2;
doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(40, 40, 40);
doc.text('By signing below, both parties confirm their agreement to the terms, rates, and schedule detailed herein:', margin, y);
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
doc.text('Signature: ____________________________________', margin + 3, y + 13);
doc.text('Full Name: ____________________________________', margin + 3, y + 20);
doc.text('Date:       ____________________________________', margin + 3, y + 27);

// Driver box
doc.roundedRect(margin + signBoxWidth + 6, y, signBoxWidth, signBoxHeight, 2, 2, 'D');

doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.setTextColor(20, 20, 20);
doc.text('FOR THE INDEPENDENT DRIVER', margin + signBoxWidth + 9, y + 5);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(80, 80, 80);
doc.text('Signature: ____________________________________', margin + signBoxWidth + 9, y + 13);
doc.text('Full Name: ____________________________________', margin + signBoxWidth + 9, y + 20);
doc.text('Date:       ____________________________________', margin + signBoxWidth + 9, y + 27);

// Page Numbers Footer on all pages
const totalPages = doc.internal.getNumberOfPages();
for (let p = 1; p <= totalPages; p++) {
  doc.setPage(p);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text(
    `Wrap & Wing Co. • Confidential Independent Contractor Agreement • Page ${p} of ${totalPages}`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );
}

const workspaceTarget = '/Volumes/WDB-2TB-B/App Projects/Wrap and Wing Co/Wrap_and_Wing_Co_Driver_Agreement.pdf';
const artifactTarget = '/Users/brettmommsen/.gemini/antigravity/brain/f2cca1bd-8299-408d-be76-be7ddcbba937/Wrap_and_Wing_Co_Driver_Agreement.pdf';

const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(workspaceTarget, pdfBuffer);
fs.writeFileSync(artifactTarget, pdfBuffer);

console.log('PDF successfully generated at:', workspaceTarget);
console.log('Artifact PDF generated at:', artifactTarget);
