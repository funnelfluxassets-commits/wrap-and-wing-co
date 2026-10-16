// Vercel Serverless Function: Direct Hostinger SMTP Contact Form Email Notification
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
    return res.status(500).json({ error: 'SMTP credentials not configured on server' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { title, firstName, lastName, email, telephone, message } = body;

    if (!firstName || !email || !telephone || !message) {
      return res.status(400).json({ error: 'Missing required contact form fields' });
    }

    const fullName = `${title ? `${title} ` : ''}${firstName} ${lastName}`.trim();
    const cleanPhone = telephone.replace(/\s+/g, '');
    const rawDigits = telephone.replace(/[^0-9]/g, '');
    const cleanDigits = rawDigits.startsWith('0') ? `27${rawDigits.slice(1)}` : rawDigits;
    const createdAt = new Date().toLocaleString('en-ZA');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>New Website Inquiry - ${fullName}</title>
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
          New Customer Message Received!
        </h1>
        <div style="display: inline-block; background-color: #27272a; color: #e4e4e7; font-size: 13px; font-weight: 700; padding: 5px 14px; border-radius: 9999px; border: 1px solid #3f3f46; white-space: nowrap;">
          Website Contact Form &bull; Pine Crest Centre
        </div>
      </td>
    </tr>

    <!-- Customer Specs Table -->
    <tr>
      <td style="padding: 16px;" class="mobile-padding">
        
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
          
          <!-- Customer Name -->
          <tr style="border-bottom: 1px solid #27272a;">
            <td class="mobile-label" style="width: 32%; padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">
              Customer:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; color: #ffffff; font-size: 14px; font-weight: 700; vertical-align: middle;">
              ${fullName}
            </td>
          </tr>

          <!-- Email -->
          <tr style="border-bottom: 1px solid #27272a;">
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">
              Email:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; vertical-align: middle;">
              <a href="mailto:${email}" style="color: #f59e0b; text-decoration: none; font-weight: 700; font-size: 14px;">${email}</a>
            </td>
          </tr>

          <!-- Phone & Quick Actions -->
          <tr style="border-bottom: 1px solid #27272a;">
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">
              Phone / Cell:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; vertical-align: middle;">
              <span style="font-size: 14px; font-weight: 700; color: #f59e0b; margin-right: 8px;">${telephone}</span>
              <div style="margin-top: 6px;">
                <a href="tel:${cleanPhone}" style="display: inline-block; background-color: #ea580c; color: #ffffff; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-decoration: none; margin-right: 6px;">
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

          <!-- Received Timestamp -->
          <tr>
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">
              Submitted:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; color: #d4d4d8; font-size: 13px; vertical-align: middle;">
              ${createdAt}
            </td>
          </tr>

        </table>

        <!-- Message Box Header -->
        <div style="font-size: 13px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #f59e0b; margin: 18px 0 10px 0;">
          💬 CUSTOMER MESSAGE:
        </div>

        <!-- Customer Message Box -->
        <div style="background-color: #202024; border: 1px solid #27272a; border-left: 4px solid #ea580c; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0; color: #f4f4f5; font-size: 14px; line-height: 22px; white-space: pre-wrap;">${message.replace(
            /</g,
            '&lt;'
          ).replace(/>/g, '&gt;')}</p>
        </div>

        <!-- Direct Reply Action Bar -->
        <div style="background-color: #121215; border: 1px solid #27272a; border-radius: 8px; padding: 14px; text-align: center; margin-bottom: 16px;">
          <p style="margin: 0 0 10px 0; font-size: 12px; color: #a1a1aa;">Ready to respond to this customer?</p>
          <a href="mailto:${email}?subject=Re:%20Your%20Wrap%20%26%20Wings%20Co%20Inquiry" style="display: inline-block; background-color: #ea580c; color: #ffffff; font-size: 13px; font-weight: 800; padding: 8px 18px; border-radius: 6px; text-decoration: none;">
            ✉️ Reply to ${firstName}
          </a>
        </div>

        <!-- Footer Note -->
        <div style="text-align: center; font-size: 11px; color: #71717a; line-height: 16px; padding-top: 4px;">
          Received via Wrap &amp; Wings Co. Website Contact Form<br>
          Delivered to info@wrapandwings.co.za
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

    const subject = `🌯 [NEW INQUIRY] ${fullName} - Website Contact Form`;

    await transporter.sendMail({
      from: `"Wrap & Wings Co Website" <${user}>`,
      to: 'info@wrapandwings.co.za',
      replyTo: email,
      subject,
      html: htmlContent,
    });

    return res.status(200).json({ success: true, message: 'Contact email sent successfully via Hostinger SMTP' });
  } catch (err: any) {
    console.error('Error sending contact email via Hostinger SMTP:', err);
    return res.status(500).json({ error: err.message || 'Failed to send contact email' });
  }
}
