import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

function emailTemplate(email: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to SASEFIED</title>
  <style>
    body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #05001b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(135deg, #070020 0%, #0a0920 100%); border-radius: 16px; box-shadow: 0 24px 80px rgba(6,5,30,0.35); }
    .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .logo { font-size: 28px; font-weight: 900; letter-spacing: -0.02em; color: #fff; margin-bottom: 8px; }
    .tagline { font-size: 20px; font-weight: 700; color: #fff; line-height: 1.3; margin: 0; }
    .body { padding: 32px 0; text-align: center; }
    .title { font-size: 24px; font-weight: 700; color: #fff; margin-bottom: 12px; }
    .message { font-size: 16px; color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 32px; }
    .cta { display: inline-block; background: #2ee4ff; color: #040018; font-weight: 700; font-size: 16px; padding: 12px 28px; border-radius: 9999px; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s; }
    .cta:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(46,228,255,0.3); }
    .footer { padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center; font-size: 13px; color: rgba(255,255,255,0.5); }
    .footer a { color: #2ee4ff; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">SASEFIED</div>
      <p class="tagline">Automate Sales On LinkedIn & Email</p>
    </div>

    <div class="body">
      <h1 class="title">You’re on the list!</h1>
      <p class="message">
        Thanks for subscribing to SASEFIED. We’ll keep you in the loop with product updates, tips, and exclusive offers.
      </p>
      <a href="https://sasefied.com" class="cta">Explore SASEFIED</a>
    </div>

    <div class="footer">
      <p>© 2025 SASEFIED. All Rights Reserved.</p>
      <p><a href="https://sasefied.com/unsubscribe?email=${encodeURIComponent(email)}">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    await transporter.sendMail({
      from: `"SASEFIED" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to SASEFIED!',
      html: emailTemplate(email),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Subscribe email error:', err);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
