// Vercel Serverless Function: Direct Hostinger SMTP Email Notification
import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Read environment variables INSIDE handler execution
  const host = process.env.SMTP_HOST || process.env.VITE_SMTP_HOST || 'smtp.hostinger.com';
  const port = Number(process.env.SMTP_PORT || process.env.VITE_SMTP_PORT || 465);
  const user = process.env.SMTP_USER || process.env.VITE_SMTP_USER || 'orders@wrapandwings.co.za';
  let pass =
    process.env.SMTP_PASS ||
    process.env.SMTP_PASSWORD ||
    process.env.ORDERS_PASSWORD ||
    process.env.ORDERS_EMAIL_PASSWORD ||
    process.env.EMAIL_PASSWORD ||
    process.env.VITE_SMTP_PASS ||
    process.env.VITE_SMTP_PASSWORD ||
    process.env.VITE_ORDERS_PASSWORD ||
    process.env.VITE_ORDERS_PASS ||
    process.env.VITE_EMAIL_PASSWORD;

  // Fallback if Vercel saved as Key/Value
  if (!pass) {
    if (process.env.Value && (process.env.Value.startsWith('Orders_') || process.env.Key === 'SMTP_PASS')) {
      pass = process.env.Value;
    } else if (process.env.Key && process.env.Key.startsWith('Orders_')) {
      pass = process.env.Key;
    }
  }

  if (!pass) {
    const allKeys = Object.keys(process.env).filter(
      (k) => !k.startsWith('npm_') && !k.startsWith('_') && k !== 'PATH'
    );
    return res.status(500).json({
      error: 'SMTP credentials not configured on server',
      availableEnvKeys: allKeys,
      keyDebug: {
        KeyName: process.env.Key ? 'Present' : 'Missing',
        ValueName: process.env.Value ? 'Present' : 'Missing',
        KeyPreview: (process.env.Key || '').slice(0, 6),
        ValuePreview: (process.env.Value || '').slice(0, 6),
      },
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { order } = body;

    if (!order || !order.orderId) {
      return res.status(400).json({ error: 'Invalid order data' });
    }

    const orderId = order.orderId;
    const customerName = order.customer?.customerName || 'Customer';
    const customerPhone = order.customer?.phone || 'Not provided';
    const rawDigits = customerPhone.replace(/[^0-9]/g, '');
    const cleanDigits = rawDigits.startsWith('0') ? `27${rawDigits.slice(1)}` : rawDigits;

    const orderMode = order.orderMode === 'collection' ? 'Collection' : 'Delivery';
    const preferredTime = order.preferredTime || 'ASAP';
    const storeName = order.store?.name || 'Wrap & Wings Co - Pinetown Flagship';
    const address =
      order.orderMode === 'delivery'
        ? `${order.customer?.address || ''}, ${order.customer?.suburb || 'Pinetown'}${
            order.customer?.complexOrUnit ? ` (${order.customer.complexOrUnit})` : ''
          }${order.customer?.gateCode ? ` [Gate: ${order.customer.gateCode}]` : ''}`
        : 'Store Collection (Pine Crest Centre, Pinetown)';
    const notes = order.customer?.notes || '';
    const createdAt = order.createdAt || new Date().toLocaleString('en-ZA');

    const paymentLabel =
      order.paymentMethod === 'payfast'
        ? 'PayFast Online (Confirmed Paid)'
        : order.paymentMethod === 'whatsapp'
        ? 'WhatsApp Order'
        : order.paymentMethod === 'cod'
        ? order.orderMode === 'collection'
          ? 'Pay on Collection (Card / Cash)'
          : 'Pay on Delivery (Card / Cash)'
        : (order.paymentMethod || 'Paid');

    // Build items HTML table rows
    const itemsRows = (order.items || [])
      .map((item: any, idx: number) => {
        const details: string[] = [];
        if (item.customization?.flavour) {
          details.push(`Flavour: <strong style="color: #f59e0b;">${item.customization.flavour}</strong>`);
        }
        if (item.customization?.side) {
          details.push(`Side: <strong style="color: #e4e4e7;">${item.customization.side}</strong>`);
        }
        if (item.customization?.extras && item.customization.extras.length > 0) {
          details.push(`Extras: <em>${item.customization.extras.map((e: any) => e.name).join(', ')}</em>`);
        }
        if (item.customization?.notes) {
          details.push(`Note: <em>${item.customization.notes}</em>`);
        }
        const detailsHtml =
          details.length > 0
            ? `<div style="font-size: 12px; color: #a1a1aa; margin-top: 3px; line-height: 16px;">${details.join(
                ' &bull; '
              )}</div>`
            : '';

        const isLast = idx === (order.items?.length || 1) - 1;
        const borderStyle = isLast ? '' : 'border-bottom: 1px solid #27272a;';

        return `
        <tr style="${borderStyle}">
          <td style="padding: 10px 8px; text-align: center; vertical-align: top;">
            <span style="display: inline-block; background-color: #27272a; color: #f59e0b; font-weight: 800; font-size: 12px; padding: 2px 7px; border-radius: 4px;">${
              item.quantity || 1
            }x</span>
          </td>
          <td style="padding: 10px 10px; vertical-align: top;">
            <div style="color: #ffffff; font-size: 14px; font-weight: 700; line-height: 18px;">
              ${item.menuItem?.name || 'Meal'}
            </div>
            ${detailsHtml}
          </td>
          <td style="padding: 10px 10px; text-align: right; vertical-align: top; color: #ffffff; font-size: 14px; font-weight: 700; white-space: nowrap;">
            R${(item.itemTotal || 0).toFixed(2)}
          </td>
        </tr>
      `;
      })
      .join('');

    const subtotal = `R${(order.subtotal || 0).toFixed(2)}`;
    const deliveryFee = `R${(order.deliveryFee || 0).toFixed(2)}`;
    const tip = `R${(order.tip || 0).toFixed(2)}`;
    const grandTotal = `R${(order.grandTotal || 0).toFixed(2)}`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>New Order #${orderId}</title>
  <style>
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }
    @media only screen and (max-width: 480px) {
      .mobile-padding {
        padding: 12px 10px !important;
      }
      .mobile-label {
        width: 32% !important;
        font-size: 11px !important;
        padding: 8px 8px !important;
      }
      .mobile-value {
        font-size: 13px !important;
        padding: 8px 8px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 10px 4px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
    
    <!-- Top Accent Bar -->
    <tr>
      <td height="4" style="background: #ea580c; line-height: 4px; font-size: 4px;">&nbsp;</td>
    </tr>

    <!-- Header Banner -->
    <tr>
      <td align="center" style="padding: 22px 16px 18px 16px; background-color: #121215; border-bottom: 1px solid #27272a;">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #f59e0b; margin-bottom: 6px;">
          🌯 WRAP &amp; WINGS CO.
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 21px; line-height: 26px; font-weight: 800; color: #ffffff;">
          Someone just submitted their order!
        </h1>
        <div style="display: inline-block; background-color: #27272a; color: #e4e4e7; font-size: 13px; font-weight: 700; padding: 5px 14px; border-radius: 9999px; border: 1px solid #3f3f46; white-space: nowrap;">
          Order #${orderId} - ${orderMode}
        </div>
      </td>
    </tr>

    <!-- Customer & Order Specs Table (FormSubmit-Inspired Full Width Grid) -->
    <tr>
      <td style="padding: 16px;" class="mobile-padding">
        
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
          
          <!-- Customer Name -->
          <tr style="border-bottom: 1px solid #27272a;">
            <td class="mobile-label" style="width: 32%; padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">
              Customer:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; color: #ffffff; font-size: 14px; font-weight: 700; vertical-align: middle;">
              ${customerName}
            </td>
          </tr>

          <!-- Phone & Quick Actions -->
          <tr style="border-bottom: 1px solid #27272a;">
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">
              Phone / Cell:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; vertical-align: middle;">
              <span style="font-size: 14px; font-weight: 700; color: #f59e0b; margin-right: 8px;">${customerPhone}</span>
              <div style="margin-top: 6px;">
                <a href="tel:${customerPhone}" style="display: inline-block; background-color: #ea580c; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-decoration: none; margin-right: 6px;">
                  📞 Call
                </a>
                ${
                  cleanDigits
                    ? `<a href="https://wa.me/${cleanDigits}" style="display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-decoration: none;">
                  💬 WhatsApp
                </a>`
                    : ''
                }
              </div>
            </td>
          </tr>

          <!-- Order Type -->
          <tr style="border-bottom: 1px solid #27272a;">
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">
              Order Type:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; color: #ffffff; font-size: 13px; font-weight: 700; vertical-align: middle;">
              ${orderMode}
            </td>
          </tr>

          <!-- Preferred Time -->
          <tr style="border-bottom: 1px solid #27272a;">
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">
              Ready Time:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; color: #ffffff; font-size: 13px; font-weight: 700; vertical-align: middle;">
              ${preferredTime}
            </td>
          </tr>

          <!-- Location -->
          <tr style="border-bottom: 1px solid #27272a;">
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">
              Store Branch:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; color: #d4d4d8; font-size: 13px; vertical-align: middle;">
              ${storeName}
            </td>
          </tr>

          <!-- Pickup / Delivery Address -->
          <tr style="border-bottom: 1px solid #27272a;">
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">
              Pickup / Drop:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; color: #d4d4d8; font-size: 13px; vertical-align: middle;">
              ${address}
            </td>
          </tr>

          <!-- Payment Method -->
          <tr style="border-bottom: 1px solid #27272a;">
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">
              Payment Mode:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; color: #ffffff; font-size: 13px; vertical-align: middle;">
              ${paymentLabel}
            </td>
          </tr>

          <!-- Payment Status -->
          <tr ${notes ? 'style="border-bottom: 1px solid #27272a;"' : ''}>
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">
              Payment Status:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; vertical-align: middle;">
              <span style="display: inline-block; background-color: #14532d; color: #4ade80; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 6px; border: 1px solid #166534;">
                ✓ PAID (Payment Received)
              </span>
            </td>
          </tr>

          ${
            notes
              ? `
          <tr>
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">
              Special Notes:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; color: #f59e0b; font-size: 13px; font-style: italic; vertical-align: middle;">
              ${notes}
            </td>
          </tr>
          `
              : ''
          }

        </table>

        <!-- Order Items Section Header -->
        <div style="font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #f59e0b; margin: 18px 0 10px 0;">
          🌯 ORDER ITEMS (${grandTotal})
        </div>

        <!-- Order Items Table -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
          
          <thead>
            <tr style="background-color: #202024; border-bottom: 1px solid #27272a;">
              <th width="42" style="padding: 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a1a1aa; text-align: center;">Qty</th>
              <th style="padding: 8px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a1a1aa; text-align: left;">Meal / Item</th>
              <th width="75" style="padding: 8px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #a1a1aa; text-align: right;">Total</th>
            </tr>
          </thead>

          <tbody>
            ${itemsRows}
          </tbody>

        </table>

        <!-- Financial Breakdown (Subtotal / Delivery / Tip) -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 12px;">
          <tr>
            <td style="padding: 6px 4px; color: #a1a1aa; font-size: 13px;">Subtotal:</td>
            <td align="right" style="padding: 6px 4px; color: #ffffff; font-size: 13px; font-weight: 600;">${subtotal}</td>
          </tr>
          ${
            order.orderMode === 'delivery'
              ? `
          <tr>
            <td style="padding: 6px 4px; color: #a1a1aa; font-size: 13px;">Delivery Fee:</td>
            <td align="right" style="padding: 6px 4px; color: #ffffff; font-size: 13px; font-weight: 600;">${deliveryFee}</td>
          </tr>
          `
              : ''
          }
          ${
            order.tip
              ? `
          <tr>
            <td style="padding: 6px 4px; color: #a1a1aa; font-size: 13px;">Driver Tip:</td>
            <td align="right" style="padding: 6px 4px; color: #ffffff; font-size: 13px; font-weight: 600;">${tip}</td>
          </tr>
          `
              : ''
          }
        </table>

        <!-- Grand Total Banner -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background-color: #121215; border: 1px solid #ea580c; border-radius: 8px; overflow: hidden; margin-bottom: 16px;">
          <tr>
            <td style="padding: 12px 14px; color: #e4e4e7; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">
              GRAND TOTAL:
            </td>
            <td align="right" style="padding: 12px 14px; color: #ea580c; font-size: 22px; font-weight: 900; white-space: nowrap;">
              ${grandTotal}
            </td>
          </tr>
        </table>

        <!-- Footer Note -->
        <div style="text-align: center; font-size: 11px; color: #71717a; line-height: 16px; padding-top: 4px;">
          Order Placed: ${createdAt} &bull; Wrap &amp; Wings Co. Pine Crest Centre<br>
          Internal Staff &amp; Kitchen Notification
        </div>

      </td>
    </tr>

  </table>

</body>
</html>
    `;

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const subject = `🌯 [NEW ORDER] #${orderId} - ${
      order.orderMode === 'collection' ? 'COLLECTION' : 'DELIVERY'
    } - ${customerName} (${grandTotal})`;

    await transporter.sendMail({
      from: `"Wrap & Wings Co Orders" <${user}>`,
      to: 'orders@wrapandwings.co.za',
      replyTo: order.customer?.email || 'info@wrapandwings.co.za',
      subject,
      html: htmlContent,
    });

    return res.status(200).json({ success: true, message: 'Email sent successfully via Hostinger SMTP' });
  } catch (err: any) {
    console.error('Error sending order email via Hostinger SMTP:', err);
    return res.status(500).json({ error: err.message || 'Failed to send email' });
  }
}
