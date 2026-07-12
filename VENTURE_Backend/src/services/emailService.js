/**
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 *
 * emailService — Nodemailer transport for transactional emails.
 * Configure via env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || 'apikey',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM = process.env.EMAIL_FROM || 'VENTURE <noreply@venture.gg>';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// ── Parental consent verification email ───────────────────────────────────────
async function sendParentalConsentEmail({ to, childName, verifyToken }) {
  const verifyUrl = `${BACKEND_URL}/api/auth/kids/verify/${verifyToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>VENTURE Kids — Parental Consent</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #0F1420; color: #fff; margin: 0; padding: 0; }
    .wrap { max-width: 520px; margin: 48px auto; padding: 0 24px; }
    .card { background: #1A2035; border-radius: 20px; padding: 36px; border: 1px solid rgba(255,255,255,0.08); }
    .logo { font-size: 24px; font-weight: 800; color: #FF6B35; margin-bottom: 24px; text-align: center; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; color: #fff; }
    p { font-size: 15px; color: #94A3B8; line-height: 1.6; margin: 0 0 20px; }
    .name { color: #FF6B35; font-weight: 600; }
    .btn { display: block; background: #FF6B35; color: #fff; text-decoration: none;
           font-weight: 700; font-size: 16px; text-align: center;
           padding: 16px 32px; border-radius: 14px; margin: 28px 0; }
    .fine { font-size: 12px; color: #64748B; line-height: 1.5; }
    .link { color: #64748B; word-break: break-all; }
    hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 24px 0; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="logo">VENTURE Kids 🌟</div>
      <h1>Parental Consent Required</h1>
      <p>
        Someone is setting up a <strong>VENTURE Kids</strong> account for
        <span class="name">${escapeHtml(childName)}</span>.
      </p>
      <p>
        As the parent or guardian, you must confirm your consent before the
        account becomes active. This keeps your child safe and ensures VENTURE
        complies with COPPA.
      </p>
      <p><strong style="color:#fff">If you initiated this setup</strong>, tap the button below to confirm consent.
      Your child's profile will activate immediately.</p>
      <a href="${verifyUrl}" class="btn">✅ I Confirm — Activate Kids Account</a>
      <hr>
      <p class="fine">
        If you did <strong>not</strong> initiate this setup, ignore this email — no account will be created.
        This link expires in 24 hours.
      </p>
      <p class="fine">
        Can't tap the button? Copy this link into your browser:<br>
        <span class="link">${verifyUrl}</span>
      </p>
      <p class="fine">
        Questions? Contact <a href="mailto:privacy@divinedemongaming.com" style="color:#FF6B35">privacy@divinedemongaming.com</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = [
    'VENTURE Kids — Parental Consent Required',
    '',
    `Someone is setting up a VENTURE Kids account for ${childName}.`,
    '',
    'As the parent or guardian, you must confirm consent before the account becomes active.',
    '',
    `Confirm here: ${verifyUrl}`,
    '',
    'If you did not initiate this setup, ignore this email — no account will be created.',
    'This link expires in 24 hours.',
    '',
    'Questions? privacy@divinedemongaming.com',
  ].join('\n');

  try {
    await transport.sendMail({ from: FROM, to, subject: 'Action Required: VENTURE Kids Parental Consent', html, text });
    logger.info(`Parental consent email sent to ${to}`);
  } catch (err) {
    logger.error('Failed to send parental consent email:', err.message);
    throw err;
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { sendParentalConsentEmail };
