// Cloudflare Pages Function: Direct Hostinger SMTP Weekly Review Draw Notification
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
    const { id, fullName, phone, receiptNumber, googleReviewName, rating, comments, createdAt } = body;

    if (!fullName || !phone || !receiptNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required review draw fields' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanPhone = phone.replace(/\s+/g, '');
    const rawDigits = phone.replace(/[^0-9]/g, '');
    const cleanDigits = rawDigits.startsWith('0') ? `27${rawDigits.slice(1)}` : rawDigits;
    const submissionTime = createdAt ? new Date(createdAt).toLocaleString('en-ZA') : new Date().toLocaleString('en-ZA');
    const stars = '⭐'.repeat(Math.min(5, Math.max(1, rating || 5)));

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Weekly Meal Draw Entry - ${fullName}</title>
  <style>
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    @media only screen and (max-width: 480px) {
      .mobile-padding { padding: 12px 10px !important; }
      .mobile-label { width: 35% !important; font-size: 11px !important; padding: 8px 8px !important; }
      .mobile-value { font-size: 13px !important; padding: 8px 8px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 12px 4px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; overflow: hidden;">
    
    <!-- Top Accent Bar -->
    <tr>
      <td height="5" style="background: #f59e0b; line-height: 5px; font-size: 5px;">&nbsp;</td>
    </tr>

    <!-- Header Banner -->
    <tr>
      <td align="center" style="padding: 24px 16px 18px 16px; background-color: #121215; border-bottom: 1px solid #27272a;">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #f59e0b; margin-bottom: 6px;">
          🍗 WRAP &amp; WINGS CO.
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 22px; line-height: 28px; font-weight: 800; color: #ffffff;">
          🏆 New Weekly Meal Draw Entry!
        </h1>
        <div style="display: inline-block; background-color: #27272a; color: #fef3c7; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 9999px; border: 1px solid #f59e0b;">
          Entry ID: ${id || 'N/A'}
        </div>
      </td>
    </tr>

    <!-- Entry Details Table -->
    <tr>
      <td style="padding: 20px 16px;" class="mobile-padding">
        
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
          
          <!-- Customer Name -->
          <tr style="border-bottom: 1px solid #27272a; background-color: #1c1c20;">
            <td width="32%" style="padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              Customer Name
            </td>
            <td style="padding: 10px 12px; color: #ffffff; font-size: 15px; font-weight: 700;" class="mobile-value">
              ${fullName}
            </td>
          </tr>

          <!-- Phone Number -->
          <tr style="border-bottom: 1px solid #27272a; background-color: #18181b;">
            <td style="padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              WhatsApp / Cell
            </td>
            <td style="padding: 10px 12px; color: #ffffff; font-size: 14px;" class="mobile-value">
              <a href="tel:${cleanPhone}" style="color: #60a5fa; text-decoration: none; font-weight: 600;">${phone}</a>
              ${
                cleanDigits
                  ? ` &bull; <a href="https://wa.me/${cleanDigits}" style="color: #22c55e; text-decoration: none; font-size: 12px; font-weight: 700; background-color: #052e16; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-left: 4px;">💬 WhatsApp</a>`
                  : ''
              }
            </td>
          </tr>

          <!-- Receipt Number -->
          <tr style="border-bottom: 1px solid #27272a; background-color: #1c1c20;">
            <td style="padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              Order / Receipt #
            </td>
            <td style="padding: 10px 12px; color: #f59e0b; font-size: 14px; font-weight: 800;" class="mobile-value">
              ${receiptNumber}
            </td>
          </tr>

          <!-- Google Review Name -->
          <tr style="border-bottom: 1px solid #27272a; background-color: #18181b;">
            <td style="padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              Google Account
            </td>
            <td style="padding: 10px 12px; color: #e4e4e7; font-size: 14px;" class="mobile-value">
              ${googleReviewName || '<em style="color: #71717a;">Same as customer name</em>'}
            </td>
          </tr>

          <!-- Rating -->
          <tr style="border-bottom: 1px solid #27272a; background-color: #1c1c20;">
            <td style="padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              Review Rating
            </td>
            <td style="padding: 10px 12px; color: #ffffff; font-size: 14px;" class="mobile-value">
              <span style="font-size: 16px;">${stars}</span> <strong style="color: #f59e0b; margin-left: 6px;">(${rating || 5}/5)</strong>
            </td>
          </tr>

          <!-- Comments / Feedback -->
          ${
            comments
              ? `
          <tr style="background-color: #18181b;">
            <td style="padding: 10px 12px; color: #f59e0b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              Customer Feedback
            </td>
            <td style="padding: 12px; color: #fef3c7; font-size: 13px; font-style: italic; background-color: #27200d; line-height: 18px;" class="mobile-value">
              "${comments}"
            </td>
          </tr>
          `
              : ''
          }

        </table>

        <!-- Direct Verification Button -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
          <tr>
            <td align="center">
              <a href="https://maps.app.goo.gl/yQJ4Vq1z2z28Q2Rz6" style="display: inline-block; background-color: #f59e0b; color: #09090b; font-size: 13px; font-weight: 800; padding: 10px 20px; border-radius: 6px; text-decoration: none; text-transform: uppercase; letter-spacing: 0.5px;">
                ⭐ Open Google Reviews to Verify
              </a>
            </td>
          </tr>
        </table>

        <!-- Footer Notice -->
        <div style="text-align: center; font-size: 11px; color: #71717a; line-height: 16px; border-top: 1px solid #27272a; padding-top: 14px;">
          Submitted at: ${submissionTime} &bull; Wrap &amp; Wings Co. Google Review Campaign<br>
          Official Campaign Notification &bull; <a href="https://www.wrapandwings.co.za/#review" style="color: #a1a1aa; text-decoration: underline;">wrapandwings.co.za</a>
        </div>

      </td>
    </tr>

  </table>

</body>
</html>
    `;

    const subject = `🍗 [MEAL DRAW ENTRY] ${fullName} (Slip #${receiptNumber}) - ${rating || 5}★ Review`;

    await sendHostingerEmail(
      {
        fromName: 'Wrap & Wings Co',
        fromEmail: 'orders@wrapandwings.co.za',
        to: 'info@wrapandwings.co.za',
        replyTo: 'info@wrapandwings.co.za',
        subject,
        html: htmlContent,
      },
      context.env
    );

    return new Response(
      JSON.stringify({ success: true, message: 'Review entry email sent successfully via Hostinger SMTP' }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('Error sending review email via Hostinger SMTP:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to send review email' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
