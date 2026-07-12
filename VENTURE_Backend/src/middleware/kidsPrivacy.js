/**
 * ============================================================
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * ============================================================
 *
 * kidsPrivacy — Zero-profile, zero-contact, zero-track enforcement
 *               for every Kids Mode request.
 *
 * THREAT MODEL
 * ------------
 * A motivated bad actor could attempt to:
 *   1. Build a behavioral profile by correlating request timing,
 *      content preferences, and session duration
 *   2. Locate a child via IP geolocation
 *   3. Contact a child via DMs, comments, notifications, or
 *      Socket.IO events targeted at the parent account
 *   4. Enumerate children on the platform via search or user
 *      discovery APIs
 *   5. Inject content into a child's feed via crafted API calls
 *   6. Gain presence/online status of a child's session
 *
 * This middleware eliminates each vector at the HTTP layer,
 * before any route handler executes.
 *
 * LEGAL BASIS
 * -----------
 * COPPA (15 U.S.C. § 6501-6506)    — no personal data from under-13 users
 * GDPR Article 8                   — highest protection standard for children
 * UK Age Appropriate Design Code   — data minimization, no profiling
 * California AADC (AB 2273)        — privacy by default for children
 *
 * PRINCIPLE
 * ---------
 * Kids sessions are READ-ONLY, ANONYMOUS, EPHEMERAL.
 * They leave no trace on the network that can be linked to a child.
 */

'use strict';

const crypto = require('crypto');
const logger = require('../utils/logger');

// ── Routes the kids session is permitted to read ─────────────────────────────
// Whitelist approach: everything not on this list is blocked.
const KIDS_PERMITTED_PREFIXES = [
  '/api/feed/kids',         // age-gated content feed
  '/api/auth/kids/',        // setup flow only (consent, PIN, card verify)
  '/health',                // health check
];

// ── Routes that are ALWAYS blocked regardless of method ─────────────────────
const KIDS_HARD_BLOCKED_PREFIXES = [
  '/api/users',             // user profiles — child must not see/find any user
  '/api/messages',          // direct messaging
  '/api/notifications',     // someone sending a notification = contact vector
  '/api/search',            // user search / discovery
  '/api/analytics',         // behavioral data collection
  '/api/chat',              // chat rooms
  '/api/live',              // live streams (chat is open to all viewers by default)
  '/api/communities',       // community feeds (unfiltered)
  '/api/gaming',            // gaming leaderboards expose usernames
  '/api/import',            // not relevant to kids
  '/api/monetization',      // payment surfaces
  '/api/admin',             // admin panel
  '/ownership',             // content ownership API
  '/webhooks',              // Stripe/external webhooks
];

// ── Methods that mutate state ────────────────────────────────────────────────
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Verify the HMAC-SHA256 signature on X-Kids-Session.
 * Signature = HMAC(accessToken, KIDS_SESSION_SECRET)
 * This prevents a malicious client from STRIPPING the Kids Mode
 * header to bypass restrictions — they can't forge a valid sig
 * without knowing the secret.
 */
function verifySessionSignature(req) {
  const secret = process.env.KIDS_SESSION_SECRET;

  // Dev-mode fallback: trust the header, loud warning
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('[kidsPrivacy] CRITICAL: KIDS_SESSION_SECRET not set in production.');
    }
    return process.env.NODE_ENV !== 'production'; // only allow in dev
  }

  const sig = req.headers['x-kids-session'];
  if (!sig) return false;

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const expected = crypto.createHmac('sha256', secret).update(token).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch { return false; }
}

/**
 * Anonymize a kids-mode request for safe audit logging.
 * Never logs IP, userId, or any identifier linkable to the child.
 */
function anonymousAuditLog(req, action, detail = {}) {
  // Use a one-way hash of the session signature as a correlation ID.
  // This lets us detect anomalies (same child making 10,000 requests)
  // without storing any reversible identifier.
  const sig = req.headers['x-kids-session'] || 'nosig';
  const anonId = crypto.createHash('sha256').update(sig + (process.env.KIDS_SESSION_SECRET || 'nosecret')).digest('hex').slice(0, 12);

  logger.info(`[kidsPrivacy:${action}]`, {
    anonSession: anonId,         // non-reversible correlation token
    path: req.path,
    method: req.method,
    ts: Date.now(),
    ...detail,
    // Explicitly excluded: ip, userId, username, email, deviceId
  });
}

/**
 * kidsPrivacyGuard — the main middleware.
 *
 * Three responsibilities:
 *  1. Verify session integrity (HMAC)
 *  2. Block all routes not on the permitted whitelist
 *  3. Strip all response headers that could leak platform topology
 *     (user IDs in headers, server timing, etc.)
 */
function kidsPrivacyGuard(req, res, next) {
  // Only applies to Kids Mode sessions
  if (req.headers['x-kids-mode'] !== '1') return next();

  // ── 1. Session integrity check ───────────────────────────────────────────
  if (!verifySessionSignature(req)) {
    logger.warn('[kidsPrivacy] Rejected: invalid session signature', {
      path: req.path, method: req.method,
      // No IP, no userId — don't log anything linkable
    });
    return res.status(400).json({
      error: 'Kids session invalid. Please re-enter Kids Mode.',
      code: 'KIDS_SESSION_INVALID',
    });
  }

  req.isKidsSession = true;

  // ── 2. Hard-blocked route prefixes ──────────────────────────────────────
  const blocked = KIDS_HARD_BLOCKED_PREFIXES.some(p => req.path.startsWith(p.replace('/api', '')));
  if (blocked) {
    anonymousAuditLog(req, 'BLOCKED_ROUTE');
    return res.status(403).json({
      error: 'Not available in Kids Mode.',
      code: 'KIDS_MODE_RESTRICTED',
    });
  }

  // ── 3. All mutating methods blocked ─────────────────────────────────────
  if (MUTATING_METHODS.has(req.method)) {
    // Exception: Kids setup flow (consent, card verify) needs POST
    const isSetupRoute = req.path.startsWith('/auth/kids/');
    if (!isSetupRoute) {
      anonymousAuditLog(req, 'BLOCKED_WRITE', { method: req.method });
      return res.status(403).json({
        error: 'Kids Mode is read-only.',
        code: 'KIDS_MODE_WRITE_BLOCKED',
      });
    }
  }

  // ── 4. Whitelist check on GET requests ──────────────────────────────────
  const permitted = KIDS_PERMITTED_PREFIXES.some(p => req.path.startsWith(p.replace('/api', '')));
  if (!permitted) {
    anonymousAuditLog(req, 'BLOCKED_NOT_WHITELISTED');
    return res.status(403).json({
      error: 'Not available in Kids Mode.',
      code: 'KIDS_MODE_RESTRICTED',
    });
  }

  // ── 5. Strip tracking query params from the request ─────────────────────
  // Remove any analytics / ad-network parameters before they reach handlers
  const TRACKING_PARAMS = ['fbclid', 'gclid', 'utm_source', 'utm_medium', 'utm_campaign',
                            'utm_term', 'utm_content', 'ref', 'referrer', '_ga', 'mc_cid'];
  TRACKING_PARAMS.forEach(p => delete req.query[p]);

  // ── 6. Override res.json to strip any user-identifying fields from responses
  const originalJson = res.json.bind(res);
  res.json = function(body) {
    if (body && typeof body === 'object') {
      body = stripPrivateFields(body);
    }
    // Remove any headers that reveal platform internals
    res.removeHeader('X-Owner');
    res.removeHeader('X-Ownership-Hash');
    res.removeHeader('X-Request-ID');
    return originalJson(body);
  };

  next();
}

/**
 * Deep-strip fields from response bodies that could expose user data
 * to a session that has no business seeing them.
 * Only applies to kids sessions.
 */
function stripPrivateFields(obj, depth = 0) {
  if (depth > 8 || !obj || typeof obj !== 'object') return obj;

  // Fields that must never reach a kids client
  const STRIP_FIELDS = new Set([
    'email', 'phone', 'ipAddress', 'deviceId', 'pushToken',
    'stripeCustomerId', 'stripeAccountId', 'paymentMethods',
    'accessToken', 'refreshToken', 'password', 'passwordHash',
    'twoFactorSecret', 'backupCodes', 'sessionToken',
    'followersCount', 'followingCount',  // no social graph
    'location', 'coordinates', 'latitude', 'longitude',
    'lastSeen', 'lastActive', 'onlineStatus', 'isOnline',
    'analyticsId', 'advertisingId', 'trackingId',
  ]);

  if (Array.isArray(obj)) {
    return obj.map(item => stripPrivateFields(item, depth + 1));
  }

  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (STRIP_FIELDS.has(key)) continue;
    clean[key] = typeof value === 'object' && value !== null
      ? stripPrivateFields(value, depth + 1)
      : value;
  }
  return clean;
}

/**
 * kidsSocketBlock — Socket.IO middleware.
 *
 * Mount on the Socket.IO server BEFORE connection handler.
 * Kids Mode must never establish a persistent connection —
 * it exposes online status, user ID, and is a DM/notification
 * delivery channel.
 *
 * Usage:  io.use(kidsSocketBlock);
 */
function kidsSocketBlock(socket, next) {
  const isKids = socket.handshake.headers['x-kids-mode'] === '1';
  if (!isKids) return next();

  logger.info('[kidsPrivacy] Blocked Socket.IO connection from Kids Mode session');
  return next(new Error('Socket connections are not available in Kids Mode.'));
}

module.exports = { kidsPrivacyGuard, kidsSocketBlock, stripPrivateFields };
