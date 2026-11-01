// Cloudflare Pages / Workers Native SMTP Client using cloudflare:sockets
// Connects directly via TLS (port 465) to smtp.hostinger.com without external npm dependencies.

import { connect } from 'cloudflare:sockets';

export interface SmtpOptions {
  host?: string;
  port?: number;
  user?: string;
  pass?: string;
  fromName: string;
  fromEmail?: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
}

export async function sendHostingerEmail(options: SmtpOptions, env?: any): Promise<void> {
  const host = options.host || env?.SMTP_HOST || env?.VITE_SMTP_HOST || 'smtp.hostinger.com';
  const port = options.port || Number(env?.SMTP_PORT || env?.VITE_SMTP_PORT || 465);
  const user = options.user || env?.SMTP_USER || env?.VITE_SMTP_USER || 'orders@wrapandwings.co.za';
  const pass =
    options.pass ||
    env?.SMTP_PASS ||
    env?.SMTP_PASSWORD ||
    env?.ORDERS_PASSWORD ||
    env?.VITE_SMTP_PASS ||
    'Orders_3858-!';

  const socket = connect({ hostname: host, port }, { secureTransport: 'on' });
  const writer = socket.writable.getWriter();
  const reader = socket.readable.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  let unconsumed = '';

  async function readLine(): Promise<string> {
    while (true) {
      const idx = unconsumed.indexOf('\r\n');
      if (idx !== -1) {
        const line = unconsumed.slice(0, idx);
        unconsumed = unconsumed.slice(idx + 2);
        return line;
      }
      const { value, done } = await reader.read();
      if (done) {
        const remaining = unconsumed;
        unconsumed = '';
        return remaining;
      }
      unconsumed += decoder.decode(value, { stream: true });
    }
  }

  async function readReply(): Promise<{ code: number; text: string }> {
    let fullText = '';
    while (true) {
      const line = await readLine();
      fullText += line + '\n';
      // Terminal SMTP response line has 3 digits followed by a space (not a hyphen)
      if (/^\d{3}\s/.test(line)) {
        return { code: parseInt(line.slice(0, 3), 10), text: fullText };
      }
    }
  }

  async function sendCmd(cmd: string, expectedCode?: number): Promise<{ code: number; text: string }> {
    await writer.write(encoder.encode(cmd + '\r\n'));
    const reply = await readReply();
    if (expectedCode && reply.code !== expectedCode) {
      throw new Error(`SMTP Error [${cmd.slice(0, 20)}]: expected ${expectedCode}, got ${reply.code} (${reply.text.trim()})`);
    }
    return reply;
  }

  try {
    // 1. Initial greeting (220)
    const greeting = await readReply();
    if (greeting.code !== 220) {
      throw new Error(`SMTP server greeting failed: ${greeting.text.trim()}`);
    }

    // 2. EHLO
    await sendCmd('EHLO wrapandwings.co.za', 250);

    // 3. AUTH LOGIN
    await sendCmd('AUTH LOGIN', 334);
    await sendCmd(btoa(user), 334);
    await sendCmd(btoa(pass), 235);

    // 4. MAIL FROM
    await sendCmd(`MAIL FROM:<${user}>`, 250);

    // 5. RCPT TO
    await sendCmd(`RCPT TO:<${options.to}>`, 250);

    // 6. DATA
    await sendCmd('DATA', 354);

    // Encode Subject in RFC2047 UTF-8 Base64
    const utf8Subject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(options.subject)))}?=`;

    // Construct MIME Email Message
    const emailData = [
      `From: "${options.fromName.replace(/"/g, '')}" <${options.fromEmail || user}>`,
      `To: <${options.to}>`,
      options.replyTo ? `Reply-To: <${options.replyTo}>` : '',
      `Subject: ${utf8Subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      options.html,
      `.`
    ]
      .filter((line, i) => i !== 2 || options.replyTo)
      .join('\r\n');

    await sendCmd(emailData, 250);

    // 7. QUIT
    await sendCmd('QUIT', 221);
  } finally {
    try {
      writer.releaseLock();
      reader.releaseLock();
      socket.close();
    } catch {}
  }
}
