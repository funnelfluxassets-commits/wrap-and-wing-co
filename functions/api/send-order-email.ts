// Cloudflare Pages Function: Direct Hostinger SMTP Order Email Notification
import { sendHostingerEmail } from '../utils/smtp';

export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    },
  });
}

export async function onRequestPost(context: any) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Content-Type': 'application/json',
  };

  try {
    const body = await context.request.json().catch(() => ({}));
    const { order } = body;

    if (!order || !order.orderId) {
      return new Response(JSON.stringify({ error: 'Invalid order data' }), {
        status: 400,
        headers: corsHeaders,
      });
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
        : order.paymentMethod || 'Paid';

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

    <!-- Customer & Order Specs Table -->
    <tr>
      <td style="padding: 16px;" class="mobile-padding">
        
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
          
          <!-- Customer Name -->
          <tr style="border-bottom: 1px solid #27272a; background-color: #1c1c20;">
            <td width="28%" style="padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              Customer
            </td>
            <td style="padding: 10px 12px; color: #ffffff; font-size: 14px; font-weight: 700;" class="mobile-value">
              ${customerName}
            </td>
          </tr>

          <!-- Contact Phone & WhatsApp Quick Link -->
          <tr style="border-bottom: 1px solid #27272a; background-color: #18181b;">
            <td style="padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              Phone
            </td>
            <td style="padding: 10px 12px; color: #ffffff; font-size: 14px;" class="mobile-value">
              <a href="tel:${customerPhone}" style="color: #60a5fa; text-decoration: none; font-weight: 600;">${customerPhone}</a>
              ${
                cleanDigits
                  ? ` &bull; <a href="https://wa.me/${cleanDigits}" style="color: #22c55e; text-decoration: none; font-size: 12px; font-weight: 700; background-color: #052e16; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-left: 4px;">💬 WhatsApp</a>`
                  : ''
              }
            </td>
          </tr>

          <!-- Order Type & Store -->
          <tr style="border-bottom: 1px solid #27272a; background-color: #1c1c20;">
            <td style="padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              Fulfillment
            </td>
            <td style="padding: 10px 12px; color: #ffffff; font-size: 14px;" class="mobile-value">
              <span style="display: inline-block; background-color: ${
                order.orderMode === 'collection' ? '#1e3a5f' : '#3f1f10'
              }; color: ${
      order.orderMode === 'collection' ? '#93c5fd' : '#fdba74'
    }; font-weight: 800; font-size: 11px; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; margin-right: 6px;">${orderMode}</span>
              ${preferredTime ? `<strong>Time:</strong> ${preferredTime}` : ''}
            </td>
          </tr>

          <!-- Address -->
          <tr style="border-bottom: 1px solid #27272a; background-color: #18181b;">
            <td style="padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              Address / Location
            </td>
            <td style="padding: 10px 12px; color: #e4e4e7; font-size: 13px; line-height: 18px;" class="mobile-value">
              ${address}
            </td>
          </tr>

          <!-- Payment Method -->
          <tr style="border-bottom: 1px solid #27272a; background-color: #1c1c20;">
            <td style="padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              Payment
            </td>
            <td style="padding: 10px 12px; color: #ffffff; font-size: 13px; font-weight: 700;" class="mobile-value">
              <span style="color: #22c55e;">${paymentLabel}</span>
            </td>
          </tr>

          ${
            notes
              ? `
          <!-- Customer Notes -->
          <tr style="background-color: #18181b;">
            <td style="padding: 10px 12px; color: #f59e0b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              Special Instructions
            </td>
            <td style="padding: 10px 12px; color: #fef3c7; font-size: 13px; font-style: italic; background-color: #27200d;" class="mobile-value">
              "${notes}"
            </td>
          </tr>
          `
              : ''
          }

        </table>

        <!-- Order Items Section Heading -->
        <div style="font-size: 12px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #ea580c; margin-bottom: 8px;">
          🛒 Order Items (${order.items?.length || 0})
        </div>

        <!-- Items Table -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; margin-bottom: 16px; background-color: #18181b;">
          
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

        <!-- Financial Breakdown -->
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

    const subject = `🌯 [NEW ORDER] #${orderId} - ${
      order.orderMode === 'collection' ? 'COLLECTION' : 'DELIVERY'
    } - ${customerName} (${grandTotal})`;

    await sendHostingerEmail(
      {
        fromName: 'Wrap & Wings Co Orders',
        fromEmail: 'orders@wrapandwings.co.za',
        to: 'orders@wrapandwings.co.za',
        replyTo: order.customer?.email || 'orders@wrapandwings.co.za',
        subject,
        html: htmlContent,
      },
      context.env
    );

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully via Hostinger SMTP' }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('Error sending order email via Hostinger SMTP:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to send email' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
