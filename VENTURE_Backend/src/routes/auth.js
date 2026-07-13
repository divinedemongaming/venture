/**
 * ============================================================
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  This software is the exclusive intellectual property of
 *  DivineDemonGaming Inc. Unauthorized copying, distribution,
 *  modification, or use of this software, in whole or in part,
 *  is strictly prohibited without written permission from
 *  DivineDemonGaming Inc.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 * ============================================================
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { body, validationResult } = require('express-validator');
const {
  generateAccessToken, generateRefreshToken, generateSlug
} = require('../utils/tokens');
const {
  recordFailedLogin, clearFailedLogins, isAccountLocked,
  auditLog, getClientIP
} = require('../middleware/security');
const { authenticate } = require('../middleware/auth');
const { redisSet, redisGet, redisDel } = require('../services/redis');
const { notifyUser } = require('../services/socket');
const logger = require('../utils/logger');
const speakeasy = require('speakeasy');

const prisma = new PrismaClient();

// ── Validation rules ──────────────────────────
const registerRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username: 3-30 chars, letters/numbers/underscore only')
    .toLowerCase(),
  body('email').isEmail().normalizeEmail(),
  body('displayName').trim().isLength({ min: 1, max: 50 }).escape(),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#])[A-Za-z\d@$!%*?&_#]/)
    .withMessage('Password must be 8+ chars with uppercase, lowercase, number, and special character')
];

const loginRules = [
  body('identifier').trim().notEmpty(),
  body('password').notEmpty()
];

// ── REGISTER ──────────────────────────────────
router.post('/register', registerRules, auditLog('REGISTER'), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, displayName, password, isCreator = false } = req.body;

  // Check availability
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] }
  });
  // Always return same message to prevent enumeration attacks
  if (existing) {
    return res.status(409).json({ error: 'Account already exists with that username or email' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      displayName,
      passwordHash,
      isCreator,
      accountType: isCreator ? 'CREATOR' : 'STANDARD',
      notifPrefs: { create: {} },
      gamerProfile: { create: {} }
    },
    select: {
      id: true, username: true, displayName: true, email: true,
      avatarUrl: true, isCreator: true, accountType: true
    }
  });

  if (isCreator) {
    await prisma.creatorProfile.create({ data: { userId: user.id } });
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token
  await redisSet(`refresh:${user.id}`, refreshToken, { EX: 30 * 24 * 3600 });

  logger.info(`New user registered: ${username} (${user.id})`);

  res.status(201).json({
    message: 'Welcome to VENTURE!',
    user,
    accessToken,
    refreshToken
  });
});

// ── LOGIN ─────────────────────────────────────
router.post('/login', loginRules, auditLog('LOGIN'), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  const { identifier, password, totpCode } = req.body;
  const ip = getClientIP(req);

  // Check lockout
  if (await isAccountLocked(identifier) || await isAccountLocked(ip)) {
    return res.status(423).json({
      error: 'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.',
      code: 'ACCOUNT_LOCKED'
    });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() }
      ]
    }
  });

  // Generic error — don't reveal whether email or password is wrong
  const GENERIC_ERROR = 'Invalid credentials';

  if (!user || !user.passwordHash) {
    await recordFailedLogin(identifier);
    await recordFailedLogin(ip);
    return res.status(401).json({ error: GENERIC_ERROR });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const failCount = await recordFailedLogin(identifier);
    await recordFailedLogin(ip);
    const remaining = Math.max(0, 5 - failCount);
    return res.status(401).json({
      error: GENERIC_ERROR,
      attemptsRemaining: remaining > 0 ? remaining : undefined
    });
  }

  if (user.status === 'BANNED') {
    return res.status(403).json({ error: 'This account has been banned', code: 'BANNED' });
  }
  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Account suspended', code: 'SUSPENDED' });
  }

  // 2FA check (if enabled — stored in Redis as setup flag for now)
  const twoFASecret = await redisGet(`2fa:${user.id}`);
  if (twoFASecret) {
    if (!totpCode) {
      return res.status(200).json({ requires2FA: true, userId: user.id });
    }
    const valid2FA = speakeasy.totp.verify({
      secret: twoFASecret,
      encoding: 'base32',
      token: totpCode,
      window: 1
    });
    if (!valid2FA) {
      await recordFailedLogin(identifier);
      return res.status(401).json({ error: 'Invalid 2FA code' });
    }
  }

  await clearFailedLogins(identifier);
  await clearFailedLogins(ip);

  // Update last seen
  await prisma.user.update({
    where: { id: user.id },
    data: { lastSeen: new Date() }
  });

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  await redisSet(`refresh:${user.id}`, refreshToken, { EX: 30 * 24 * 3600 });

  const safeUser = {
    id: user.id, username: user.username, displayName: user.displayName,
    email: user.email, avatarUrl: user.avatarUrl, bannerUrl: user.bannerUrl,
    isCreator: user.isCreator, isVerified: user.isVerified,
    accountType: user.accountType, role: user.role
  };

  res.json({ user: safeUser, accessToken, refreshToken });
});

// ── REFRESH TOKEN ─────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
    );

    const stored = await redisGet(`refresh:${decoded.userId}`);
    if (stored !== refreshToken) {
      // Token reuse detected — invalidate all tokens for this user
      await redisDel(`refresh:${decoded.userId}`);
      logger.warn(`Token reuse detected for user ${decoded.userId}`);
      return res.status(401).json({ error: 'Token reuse detected. Please log in again.' });
    }

    const newAccessToken = generateAccessToken(decoded.userId);
    const newRefreshToken = generateRefreshToken(decoded.userId);
    await redisSet(`refresh:${decoded.userId}`, newRefreshToken, { EX: 30 * 24 * 3600 });

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// ── LOGOUT ────────────────────────────────────
router.post('/logout', authenticate, async (req, res) => {
  await redisDel(`refresh:${req.user.id}`);
  await redisDel(`online:${req.user.id}`);
  res.json({ message: 'Logged out successfully' });
});

// ── ME (current user) ─────────────────────────
router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      creatorProfile: { select: { isMonetized: true, stripeOnboarded: true, totalEarned: true } },
      gamerProfile: { select: { level: true, xp: true, rank: true, platforms: true } },
      notifPrefs: true,
      _count: {
        select: { followers: true, following: true, posts: true, subscribers: true }
      }
    }
  });

  const twoFAEnabled = !!(await redisGet(`2fa:${req.user.id}`));

  res.json({ ...user, passwordHash: undefined, twoFAEnabled });
});

// ── 2FA SETUP ─────────────────────────────────
router.post('/2fa/setup', authenticate, async (req, res) => {
  const secret = speakeasy.generateSecret({
    name: `VENTURE:${req.user.username}`,
    length: 32
  });

  // Store temporarily until verified
  await redisSet(`2fa:pending:${req.user.id}`, secret.base32, { EX: 600 });

  res.json({
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(secret.otpauth_url)}`
  });
});

router.post('/2fa/verify', authenticate, async (req, res) => {
  const { code } = req.body;
  const pendingSecret = await redisGet(`2fa:pending:${req.user.id}`);

  if (!pendingSecret) {
    return res.status(400).json({ error: '2FA setup session expired. Please restart.' });
  }

  const valid = speakeasy.totp.verify({
    secret: pendingSecret, encoding: 'base32', token: code, window: 1
  });

  if (!valid) return res.status(400).json({ error: 'Invalid code' });

  await redisSet(`2fa:${req.user.id}`, pendingSecret, { EX: 365 * 24 * 3600 * 10 });
  await redisDel(`2fa:pending:${req.user.id}`);

  res.json({ message: '2FA enabled successfully' });
});

router.post('/2fa/disable', authenticate, async (req, res) => {
  const { password } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid password' });

  await redisDel(`2fa:${req.user.id}`);
  res.json({ message: '2FA disabled' });
});

// ── PASSWORD CHANGE ───────────────────────────
router.post('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash: hash } });

  // Invalidate all sessions
  await redisDel(`refresh:${req.user.id}`);

  res.json({ message: 'Password changed. Please log in again.' });
});

// ── OAUTH CALLBACK HANDLER ────────────────────
router.post('/oauth/callback', async (req, res) => {
  const { provider, providerId, email, displayName, avatarUrl, accessToken: providerToken } = req.body;

  const VALID_PROVIDERS = ['google', 'twitch', 'discord', 'twitter'];
  if (!VALID_PROVIDERS.includes(provider)) {
    return res.status(400).json({ error: 'Invalid OAuth provider' });
  }

  try {
    // Find or create user via OAuth
    let oauthRecord = await prisma.oAuthProvider.findUnique({
      where: { provider_providerId: { provider, providerId } },
      include: { user: true }
    });

    let user;

    if (oauthRecord) {
      user = oauthRecord.user;
      await prisma.oAuthProvider.update({
        where: { id: oauthRecord.id },
        data: { accessToken: providerToken }
      });
    } else {
      // Check if email already exists
      const existingUser = email ? await prisma.user.findUnique({ where: { email } }) : null;

      if (existingUser) {
        // Link provider to existing account
        await prisma.oAuthProvider.create({
          data: { userId: existingUser.id, provider, providerId, accessToken: providerToken }
        });
        user = existingUser;
      } else {
        // Create new user
        const baseUsername = (displayName || email?.split('@')[0] || 'user')
          .replace(/[^a-zA-Z0-9_]/g, '_')
          .toLowerCase()
          .slice(0, 25);
        let username = baseUsername;
        let counter = 1;
        while (await prisma.user.findUnique({ where: { username } })) {
          username = `${baseUsername}${counter++}`;
        }

        user = await prisma.user.create({
          data: {
            username,
            email: email || `${username}@venture.gg`,
            displayName: displayName || username,
            avatarUrl,
            gamerProfile: { create: {} },
            notifPrefs: { create: {} },
            oauthProviders: {
              create: { provider, providerId, accessToken: providerToken }
            }
          }
        });
      }
    }

    if (user.status === 'BANNED') return res.status(403).json({ error: 'Account banned' });

    await prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date() } });

    const token = generateAccessToken(user.id);
    const refresh = generateRefreshToken(user.id);
    await redisSet(`refresh:${user.id}`, refresh, { EX: 30 * 24 * 3600 });

    res.json({
      user: {
        id: user.id, username: user.username, displayName: user.displayName,
        email: user.email, avatarUrl: user.avatarUrl, isCreator: user.isCreator,
        accountType: user.accountType
      },
      accessToken: token,
      refreshToken: refresh,
      isNewUser: !oauthRecord
    });
  } catch (err) {
    logger.error('OAuth callback error:', err);
    res.status(500).json({ error: 'OAuth authentication failed' });
  }
});

// ── KIDS CARD VERIFICATION ───────────────────────────────────────────────────
// Creates a $0.30 manual-capture PaymentIntent (never actually charged).
// The authorization proves a real adult's payment method — once we confirm it's
// authorized, we immediately cancel it. Parent sees a brief $0.30 pending that
// disappears. Net charge to parent: $0.

const getStripe = () => {
  if (process.env.STRIPE_SECRET_KEY) return require('stripe')(process.env.STRIPE_SECRET_KEY);
  return null;
};

// POST /auth/kids/card-verify/create — authenticated parent requests verify intent
router.post('/kids/card-verify/create', authenticate, async (req, res) => {
  const s = getStripe();
  if (!s) return res.status(503).json({ error: 'Payment verification temporarily unavailable.' });

  try {
    const intent = await s.paymentIntents.create({
      amount: 30,             // $0.30 in cents
      currency: 'usd',
      capture_method: 'manual', // authorize only — never captured, then cancelled
      description: 'VENTURE Kids parental age verification (not charged)',
      metadata: {
        purpose: 'parental_age_verification',
        userId: req.user.id,
      },
      setup_future_usage: undefined,
    });

    // Store the intent ID so the complete step can verify ownership
    await redisSet(`kids_card_verify:${req.user.id}`, intent.id, { EX: 3600 });

    res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (err) {
    logger.error('Card verify create error:', err.message);
    res.status(500).json({ error: 'Could not create verification. Please try again.' });
  }
});

// POST /auth/kids/card-verify/complete — called after Payment Sheet succeeds on mobile
router.post('/kids/card-verify/complete', authenticate, async (req, res) => {
  const s = getStripe();
  if (!s) return res.status(503).json({ error: 'Payment verification temporarily unavailable.' });

  const storedIntentId = await redisGet(`kids_card_verify:${req.user.id}`);
  if (!storedIntentId) return res.status(400).json({ error: 'No pending card verification found.' });

  try {
    const intent = await s.paymentIntents.retrieve(storedIntentId);

    // Must be authorized (requires_capture) to be valid
    if (intent.status !== 'requires_capture') {
      return res.status(400).json({ error: `Unexpected payment status: ${intent.status}. Please retry.` });
    }

    // Cancel immediately — releases the authorization, parent is not charged
    await s.paymentIntents.cancel(storedIntentId);
    await redisDel(`kids_card_verify:${req.user.id}`);

    // Mark user record so Kids setup knows card is verified
    await redisSet(`kids_card_verified:${req.user.id}`, '1', { EX: 3600 });

    res.json({ verified: true });
  } catch (err) {
    logger.error('Card verify complete error:', err.message);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// ── KIDS CONSENT ─────────────────────────────────────────────────────────────
// POST /auth/kids/request-consent — authenticated parent sends consent email
// GET  /auth/kids/consent-status/:consentId — mobile polls for verified status
// GET  /auth/kids/verify/:token   — link from email; marks verified, serves HTML

const { v4: uuidv4 } = require('uuid');
const { sendParentalConsentEmail } = require('../services/emailService');
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const CONSENT_TTL = 24 * 3600; // 24 hours in seconds

// Rate-limit: 3 consent emails per authenticated user per hour
const consentRateLimit = {};
function checkConsentRate(userId) {
  const now = Date.now();
  const window = 60 * 60 * 1000; // 1 hour
  if (!consentRateLimit[userId]) consentRateLimit[userId] = [];
  consentRateLimit[userId] = consentRateLimit[userId].filter(t => now - t < window);
  if (consentRateLimit[userId].length >= 3) return false;
  consentRateLimit[userId].push(now);
  return true;
}

router.post('/kids/request-consent', authenticate, async (req, res) => {
  const { parentEmail, childName } = req.body;
  if (!parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
    return res.status(400).json({ error: 'Valid parent email required.' });
  }
  if (!childName || childName.trim().length < 2) {
    return res.status(400).json({ error: 'Child name required.' });
  }
  if (!checkConsentRate(req.user.id)) {
    return res.status(429).json({ error: 'Too many consent requests. Try again in an hour.' });
  }

  const consentId = uuidv4();
  // JWT token embedded in the email link — contains consentId, expires in 24h
  const jwt = require('jsonwebtoken');
  const verifyToken = jwt.sign(
    { consentId, userId: req.user.id },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  // Store consent record in Redis
  await redisSet(`kids_consent:${consentId}`, JSON.stringify({
    consentId,
    userId: req.user.id,
    parentEmail,
    childName: childName.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  }), { EX: CONSENT_TTL });

  try {
    await sendParentalConsentEmail({ to: parentEmail, childName: childName.trim(), verifyToken });
  } catch (err) {
    // Log but don't expose email failure details to client
    logger.error('Consent email failed:', err.message);
    return res.status(500).json({ error: 'Failed to send consent email. Check the address and try again.' });
  }

  res.json({ consentId, message: 'Consent email sent.' });
});

router.get('/kids/consent-status/:consentId', authenticate, async (req, res) => {
  const { consentId } = req.params;
  const raw = await redisGet(`kids_consent:${consentId}`);
  if (!raw) return res.json({ status: 'expired' });

  const record = JSON.parse(raw);
  // Ensure the requesting user owns this consent record
  if (record.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  res.json({ status: record.status }); // 'pending' | 'verified'
});

// Public — link from email opens here in a browser
router.get('/kids/verify/:token', async (req, res) => {
  const jwt = require('jsonwebtoken');
  const ok = (msg, sub = '') => res.send(successPage(msg, sub));
  const fail = (msg) => res.status(400).send(errorPage(msg));

  let payload;
  try {
    payload = jwt.verify(req.params.token, process.env.JWT_SECRET);
  } catch (err) {
    return fail('This link has expired or is invalid. Please restart the Kids account setup in the app.');
  }

  const { consentId } = payload;
  const raw = await redisGet(`kids_consent:${consentId}`);
  if (!raw) return fail('This consent link has already been used or has expired (24-hour limit).');

  const record = JSON.parse(raw);
  if (record.status === 'verified') return ok('Already confirmed!', 'This consent was already verified. You can return to the app.');

  // Mark as verified — keep in Redis so mobile polling detects it, bump TTL to 10 min
  record.status = 'verified';
  record.verifiedAt = new Date().toISOString();
  await redisSet(`kids_consent:${consentId}`, JSON.stringify(record), { EX: 600 });

  return ok(
    `Consent confirmed for ${record.childName}! 🌟`,
    'You can close this tab and return to the VENTURE app. The Kids account will activate automatically.'
  );
});

function successPage(title, subtitle) {
  return htmlPage('#3ECFB0', '✅', title, subtitle);
}
function errorPage(msg) {
  return htmlPage('#FF4D4D', '❌', 'Link Invalid', msg);
}
function htmlPage(color, icon, title, body) {
  return `<!DOCTYPE html><html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>VENTURE Kids</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
       background:#0F1420;color:#fff;display:flex;align-items:center;
       justify-content:center;min-height:100vh;margin:0;padding:24px;box-sizing:border-box;}
  .card{background:#1A2035;border-radius:20px;padding:40px 32px;max-width:440px;
        width:100%;text-align:center;border:1px solid rgba(255,255,255,0.08);}
  .icon{font-size:56px;margin-bottom:16px;}
  h1{font-size:22px;font-weight:700;margin:0 0 12px;color:${color};}
  p{font-size:15px;color:#94A3B8;line-height:1.6;margin:0;}
  .logo{font-size:13px;color:#64748B;margin-top:24px;font-weight:600;}
</style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p>${body}</p>
    <div class="logo">VENTURE Kids — DivineDemonGaming Inc.</div>
  </div>
</body>
</html>`;
}

module.exports = router;
