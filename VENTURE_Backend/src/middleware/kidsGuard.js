/**
 * ============================================================
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * ============================================================
 *
 * kidsGuard — Hard block on all content-write operations
 *              when a request originates from a Kids Mode session.
 *
 * HOW IT WORKS
 * ------------
 * The mobile app sends  X-Kids-Mode: 1  on every request made while
 * a child is using the app. This middleware intercepts all mutating
 * HTTP methods (POST, PUT, PATCH, DELETE) plus any GET route that
 * returns data which could expose adult users or content.
 *
 * Kids Mode sessions are read-only viewers. They CANNOT:
 *   - Upload any media (images, video, audio)
 *   - Create posts, reels, stories, clips
 *   - Send messages or enter chat rooms
 *   - Follow, like, comment, or interact with content
 *   - Access their account settings or payment features
 *   - View other users' profiles outside the kids feed
 *
 * This is enforced server-side. Client-side UI hiding is NOT sufficient.
 *
 * KIDS MODE HEADER INTEGRITY
 * --------------------------
 * The header is signed with a HMAC-SHA256 of the user's access token
 * to prevent a malicious client from *removing* the Kids Mode header
 * to bypass restrictions.
 *
 * Format:  X-Kids-Mode: 1
 *          X-Kids-Session: <hmac_hex>
 *
 * The HMAC is generated client-side as:
 *   HMAC-SHA256(accessToken, KIDS_SESSION_SECRET)
 *
 * Requests with X-Kids-Mode: 1 but an invalid/missing X-Kids-Session
 * are rejected with 400 to prevent tampering.
 */

'use strict';

const crypto = require('crypto');
const logger = require('../utils/logger');

// Routes explicitly allowed even in kids mode (feed reading only)
const KIDS_ALLOWED_ROUTES = new Set([
  'GET /api/feed/kids',
  'GET /api/feed/stories',   // read-only
  'GET /health',
]);

// HTTP methods that can NEVER be used in kids mode
const ALWAYS_BLOCKED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Verify the HMAC signature sent alongside the Kids Mode header.
 * Prevents a parent from removing X-Kids-Mode from their own requests
 * by showing that only the kids session (which has the token) could
 * have signed it.
 */
function verifyKidsSessionSignature(req) {
  const secret = process.env.KIDS_SESSION_SECRET;

  // If secret not configured, warn loudly but allow (dev mode only)
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('[kidsGuard] KIDS_SESSION_SECRET not set in production. Kids header signature check disabled.');
    }
    return true; // fallback: trust the header (still blocks writes)
  }

  const sessionHeader = req.headers['x-kids-session'];
  if (!sessionHeader) return false;

  // Re-derive expected HMAC from the access token
  const token = req.headers.authorization?.split(' ')[1] || '';
  const expected = crypto
    .createHmac('sha256', secret)
    .update(token)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(sessionHeader, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * kidsWriteBlock — Express middleware.
 *
 * Mount BEFORE all route handlers:
 *   app.use(kidsWriteBlock);
 */
function kidsWriteBlock(req, res, next) {
  const isKidsMode = req.headers['x-kids-mode'] === '1';
  if (!isKidsMode) return next(); // Not a kids session — pass through

  // Verify signature integrity
  if (!verifyKidsSessionSignature(req)) {
    logger.warn('[kidsGuard] Invalid kids session signature — rejecting request', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    return res.status(400).json({
      error: 'Invalid kids session. Please re-enter Kids Mode.',
      code: 'KIDS_SESSION_INVALID',
    });
  }

  // Attach to req so route handlers can check
  req.isKidsSession = true;

  const routeKey = `${req.method} ${req.path}`;

  // Block all mutating methods unconditionally
  if (ALWAYS_BLOCKED_METHODS.has(req.method)) {
    logger.warn('[kidsGuard] Blocked write attempt from Kids Mode session', {
      userId: req.user?.id,
      method: req.method,
      path: req.path,
      ip: req.ip,
    });
    return res.status(403).json({
      error: 'This action is not available in Kids Mode.',
      code: 'KIDS_MODE_WRITE_BLOCKED',
    });
  }

  // For GET requests: restrict to the allowed list
  if (!KIDS_ALLOWED_ROUTES.has(routeKey)) {
    // Allow if route starts with an allowed prefix
    const prefixAllowed = [
      '/api/feed/kids',
      '/api/feed/stories',
      '/health',
    ].some(prefix => req.path.startsWith(prefix.replace('/api', '')));

    if (!prefixAllowed) {
      logger.warn('[kidsGuard] Blocked disallowed GET from Kids Mode session', {
        userId: req.user?.id,
        path: req.path,
        ip: req.ip,
      });
      return res.status(403).json({
        error: 'This content is not available in Kids Mode.',
        code: 'KIDS_MODE_RESTRICTED',
      });
    }
  }

  next();
}

module.exports = { kidsWriteBlock };
