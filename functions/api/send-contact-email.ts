// Cloudflare Pages Function: Direct Hostinger SMTP Contact Form Email Notification
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
    const { title, firstName, lastName, email, telephone, message } = body;

    if (!firstName || !email || !telephone || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required contact form fields' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const fullName = `${title ? `${title} ` : ''}${firstName} ${lastName}`.trim();
    const cleanPhone = telephone.replace(/\s+/g, '');
    const rawDigits = telephone.replace(/[^0-9]/g, '');
    const cleanDigits = rawDigits.startsWith('0') ? `27${rawDigits.slice(1)}` : rawDigits;
    const sentTime = new Date().toLocaleString('en-ZA');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Website Contact Form Message - ${fullName}</title>
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
      <td height="4" style="background: #ea580c; line-height: 4px; font-size: 4px;">&nbsp;</td>
    </tr>

    <!-- Header Banner -->
    <tr>
      <td align="center" style="padding: 24px 16px 18px 16px; background-color: #121215; border-bottom: 1px solid #27272a;">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #f59e0b; margin-bottom: 6px;">
          ✉️ WRAP &amp; WINGS CO.
        </div>
        <h1 style="margin: 0 0 8px 0; font-size: 22px; line-height: 28px; font-weight: 800; color: #ffffff;">
          New Website Message!
        </h1>
        <div style="display: inline-block; background-color: #27272a; color: #fdba74; font-size: 12px; font-weight: 700; padding: 5px 14px; border-radius: 9999px; border: 1px solid #ea580c;">
          Customer Contact Inquiry
        </div>
      </td>
    </tr>

    <!-- Message Details Table -->
    <tr>
      <td style="padding: 20px 16px;" class="mobile-padding">
        
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
          
          <tr style="border-bottom: 1px solid #27272a; background-color: #1c1c20;">
            <td width="30%" style="padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              Sender Name
            </td>
            <td style="padding: 10px 12px; color: #ffffff; font-size: 15px; font-weight: 700;" class="mobile-value">
              ${fullName}
            </td>
          </tr>

          <tr style="border-bottom: 1px solid #27272a; background-color: #18181b;">
            <td style="padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              Email
            </td>
            <td style="padding: 10px 12px; color: #ffffff; font-size: 14px;" class="mobile-value">
              <a href="mailto:${email}" style="color: #60a5fa; text-decoration: none; font-weight: 600;">${email}</a>
            </td>
          </tr>

          <tr style="border-bottom: 1px solid #27272a; background-color: #1c1c20;">
            <td style="padding: 10px 12px; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              Telephone
            </td>
            <td style="padding: 10px 12px; color: #ffffff; font-size: 14px;" class="mobile-value">
              <a href="tel:${cleanPhone}" style="color: #60a5fa; text-decoration: none; font-weight: 600;">${telephone}</a>
              ${
                cleanDigits
                  ? ` &bull; <a href="https://wa.me/${cleanDigits}" style="color: #22c55e; text-decoration: none; font-size: 12px; font-weight: 700; background-color: #052e16; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-left: 4px;">💬 WhatsApp</a>`
                  : ''
              }
            </td>
          </tr>

          <tr style="background-color: #18181b;">
            <td style="padding: 10px 12px; color: #ea580c; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;" class="mobile-label">
              Message
            </td>
            <td style="padding: 12px; color: #f4f4f5; font-size: 13px; line-height: 18px; white-space: pre-wrap;" class="mobile-value">${message}</td>
          </tr>

        </table>

        <div style="text-align: center; font-size: 11px; color: #71717a; line-height: 16px; border-top: 1px solid #27272a; padding-top: 14px;">
          Received: ${sentTime} &bull; Wrap &amp; Wings Co. Website Contact<br>
          <a href="https://www.wrapandwings.co.za" style="color: #a1a1aa; text-decoration: underline;">wrapandwings.co.za</a>
        </div>

      </td>
    </tr>

  </table>

</body>
</html>
    `;

    const subject = `✉️ [NEW INQUIRY] ${fullName} - Website Contact Form`;

    await sendHostingerEmail(
      {
        fromName: 'Wrap & Wings Co Website',
        fromEmail: 'orders@wrapandwings.co.za',
        to: 'info@wrapandwings.co.za',
        replyTo: email,
        subject,
        html: htmlContent,
      },
      context.env
    );

    return new Response(
      JSON.stringify({ success: true, message: 'Contact email sent successfully via Hostinger SMTP' }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('Error sending contact email via Hostinger SMTP:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to send contact email' }),
      { status: 500, headers: corsHeaders }
    );
  }
}
