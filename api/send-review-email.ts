// Vercel Serverless Function: Direct Hostinger SMTP Weekly Review Draw Notification
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

  // Read environment variables
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

  if (!pass) {
    if (process.env.Key === 'SMTP_PASS' && process.env.Value) {
      pass = process.env.Value;
    }
  }

  if (!pass) {
    return res.status(500).json({ error: 'SMTP credentials not configured on server' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { id, fullName, phone, receiptNumber, googleReviewName, rating, comments, createdAt } = body;

    if (!fullName || !phone || !receiptNumber) {
      return res.status(400).json({ error: 'Missing required review draw fields' });
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
      <td height="5" style="background: linear-align; background: #f59e0b; line-height: 5px; font-size: 5px;">&nbsp;</td>
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
      <td style="padding: 18px;" class="mobile-padding">
        
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #27272a; border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
          
          <!-- Customer Name -->
          <tr style="border-bottom: 1px solid #27272a;">
            <td class="mobile-label" style="width: 35%; padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; vertical-align: middle;">
              Customer Name:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; color: #ffffff; font-size: 15px; font-weight: 800; vertical-align: middle;">
              ${fullName}
            </td>
          </tr>

          <!-- Phone / WhatsApp -->
          <tr style="border-bottom: 1px solid #27272a;">
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; vertical-align: middle;">
              WhatsApp / Cell:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; vertical-align: middle;">
              <a href="https://wa.me/${cleanDigits}" style="color: #22c55e; text-decoration: none; font-weight: 700; font-size: 14px;">
                💬 ${phone}
              </a>
              &nbsp;&bull;&nbsp;
              <a href="tel:${cleanPhone}" style="color: #f59e0b; text-decoration: none; font-size: 13px;">
                📞 Call
              </a>
            </td>
          </tr>

          <!-- Receipt / Slip Number -->
          <tr style="border-bottom: 1px solid #27272a;">
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; vertical-align: middle;">
              Slip / Order #:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; color: #f59e0b; font-size: 14px; font-weight: 800; vertical-align: middle;">
              #${receiptNumber}
            </td>
          </tr>

          <!-- Google Account Name -->
          <tr style="border-bottom: 1px solid #27272a;">
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; vertical-align: middle;">
              Google Name:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; color: #ffffff; font-size: 14px; font-weight: 700; vertical-align: middle;">
              ${googleReviewName}
            </td>
          </tr>

          <!-- Star Rating -->
          <tr style="border-bottom: 1px solid #27272a;">
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; vertical-align: middle;">
              Experience Rating:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; color: #fbbf24; font-size: 14px; font-weight: 800; vertical-align: middle;">
              ${stars} (${rating || 5} / 5)
            </td>
          </tr>

          <!-- Comments -->
          <tr>
            <td class="mobile-label" style="padding: 10px 12px; background-color: #202024; color: #a1a1aa; font-size: 12px; font-weight: 700; text-transform: uppercase; vertical-align: top;">
              Feedback / Note:
            </td>
            <td class="mobile-value" style="padding: 10px 12px; background-color: #18181b; color: #d4d4d8; font-size: 13px; font-style: italic; line-height: 18px; vertical-align: top;">
              ${comments ? `"${comments}"` : '<em>No extra comments provided</em>'}
            </td>
          </tr>

        </table>

        <!-- WhatsApp Quick Chat Action -->
        <div style="background-color: #121215; border: 1px solid #27272a; border-radius: 8px; padding: 14px; text-align: center; margin-bottom: 16px;">
          <p style="margin: 0 0 10px 0; font-size: 12px; color: #a1a1aa;">Want to notify this customer or verify their slip?</p>
          <a href="https://wa.me/${cleanDigits}?text=Hi%20${encodeURIComponent(
            fullName
          )},%20thank%20you%20for%20entering%20the%20Wrap%20%26%20Wings%20Co%20Weekly%20Meal%20Draw!%20Your%20entry%20(Slip%20%23${encodeURIComponent(
            receiptNumber
          )})%20has%20been%20verified%20and%20entered%20into%20this%20week's%20draw.%20Best%20of%20luck!" style="display: inline-block; background-color: #22c55e; color: #ffffff; font-size: 13px; font-weight: 800; padding: 9px 20px; border-radius: 6px; text-decoration: none;">
            💬 WhatsApp ${fullName}
          </a>
        </div>

        <!-- Footer Note -->
        <div style="text-align: center; font-size: 11px; color: #71717a; line-height: 16px; padding-top: 4px;">
          Submitted: ${submissionTime} &bull; Wrap &amp; Wings Co. Pine Crest Centre<br>
          Sent directly to info@wrapandwings.co.za via Hostinger Mail Server
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

    const subject = `🍗 [MEAL DRAW ENTRY] ${fullName} (Slip #${receiptNumber}) - ${rating || 5}★ Review`;

    await transporter.sendMail({
      from: `"Wrap & Wings Co" <${user}>`,
      to: 'info@wrapandwings.co.za',
      replyTo: 'info@wrapandwings.co.za',
      subject,
      html: htmlContent,
    });

    return res.status(200).json({ success: true, message: 'Review draw email sent successfully via Hostinger SMTP' });
  } catch (err: any) {
    console.error('Error sending review draw email via Hostinger SMTP:', err);
    return res.status(500).json({ error: err.message || 'Failed to send review email' });
  }
}
