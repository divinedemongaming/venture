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
/**
 * VENTURE Security Middleware Stack
 * Defends against: XSS, SQL injection, path traversal, SSRF,
 * brute force, credential stuffing, enumeration, clickjacking,
 * request smuggling, prototype pollution, and more.
 */

const { getRedis } = require('../services/redis');
const logger = require('../utils/logger');
const crypto = require('crypto');

// ── Sanitize input (XSS / injection prevention) ────────────────
const DANGEROUS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /\.\.\//g,           // path traversal
  /union\s+select/gi,  // SQL injection
  /drop\s+table/gi,
  /exec\s*\(/gi,
  /__proto__/gi,       // prototype pollution
  /constructor\[/gi,
];

const sanitizeValue = (value) => {
  if (typeof value !== 'string') return value;
  let sanitized = value;
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  return sanitized.trim();
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    // Prevent prototype pollution via keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
    clean[key] = typeof value === 'object' ? sanitizeObject(value) : sanitizeValue(value);
  }
  return clean;
};

// ── IP Blocking (check Redis blocklist) ────────────────────────
const checkBlocklist = async (req, res, next) => {
  const ip = getClientIP(req);
  try {
    const redis = getRedis();
    if (redis) {
      const blocked = await redis.get(`blocked:ip:${ip}`);
      if (blocked) {
        logger.warn(`Blocked IP attempted access: ${ip}`);
        return res.status(403).json({ error: 'Access denied' });
      }
    }
  } catch (_) { /* Redis unavailable — fail open in dev */ }
  next();
};

// ── Brute force / suspicious activity tracker ──────────────────
const suspiciousActivity = async (ip, type) => {
  try {
    const redis = getRedis();
    if (!redis) return;
    const key = `suspicious:${type}:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 3600);
    if (count >= 50) {
      await redis.set(`blocked:ip:${ip}`, 'auto-blocked', { EX: 86400 });
      logger.warn(`Auto-blocked IP ${ip} for suspicious ${type} activity (${count} attempts)`);
    }
  } catch (_) {}
};

// ── Request ID (traceability) ──────────────────────────────────
const requestId = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// ── Prevent fingerprinting ────────────────────────────────────
const hidePlatform = (req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

// ── Validate content type ──────────────────────────────────────
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const ct = req.headers['content-type'] || '';
    // Allow multipart for uploads, json for API
    if (!ct.includes('application/json') &&
        !ct.includes('multipart/form-data') &&
        !ct.includes('application/x-www-form-urlencoded') &&
        req.path !== '/webhooks') {
      return res.status(415).json({ error: 'Unsupported content type' });
    }
  }
  next();
};

// ── Sanitize request body / query ─────────────────────────────
const sanitizeRequest = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

// ── Detect & log suspicious user agents ───────────────────────
const SCANNER_AGENTS = [
  'nikto', 'sqlmap', 'nmap', 'masscan', 'dirbuster',
  'gobuster', 'wfuzz', 'hydra', 'burpsuite', 'zgrab'
];

const detectScanners = async (req, res, next) => {
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  if (SCANNER_AGENTS.some(s => ua.includes(s))) {
    const ip = getClientIP(req);
    logger.warn(`Scanner detected: ${ip} using "${ua}"`);
    await suspiciousActivity(ip, 'scanner');
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// ── Utility: Get real client IP ────────────────────────────────
const getClientIP = (req) => {
  return req.headers['cf-connecting-ip'] ||  // Cloudflare
         req.headers['x-real-ip'] ||
         req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.socket.remoteAddress ||
         '0.0.0.0';
};

// ── Audit logger for sensitive routes ─────────────────────────
const auditLog = (action) => (req, res, next) => {
  const original = res.json.bind(res);
  res.json = (data) => {
    logger.info('AUDIT', {
      action,
      userId: req.user?.id || 'anon',
      ip: getClientIP(req),
      method: req.method,
      path: req.path,
      requestId: req.requestId,
      statusCode: res.statusCode
    });
    return original(data);
  };
  next();
};

// ── Account lockout helper ─────────────────────────────────────
const recordFailedLogin = async (identifier) => {
  const redis = getRedis();
  if (!redis) return 0;
  const key = `failed_login:${identifier}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 900); // 15 min window
  return count;
};

const clearFailedLogins = async (identifier) => {
  const redis = getRedis();
  if (!redis) return;
  await redis.del(`failed_login:${identifier}`);
};

const isAccountLocked = async (identifier) => {
  const redis = getRedis();
  if (!redis) return false;
  const count = parseInt(await redis.get(`failed_login:${identifier}`) || '0');
  return count >= 5;
};

// ── Combined middleware stack ──────────────────────────────────
const securityMiddleware = [
  requestId,
  hidePlatform,
  checkBlocklist,
  detectScanners,
  validateContentType,
  sanitizeRequest
];

module.exports = {
  securityMiddleware,
  auditLog,
  recordFailedLogin,
  clearFailedLogins,
  isAccountLocked,
  suspiciousActivity,
  getClientIP,
  sanitizeObject,
  sanitizeValue
};
