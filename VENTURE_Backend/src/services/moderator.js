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
 * VENTURE Content Moderation Engine
 * 
 * Three-layer approach:
 * 1. Static blocklist — immediate hard block
 * 2. Pattern matching — catches obfuscation (h3ll0, h.e.l.l.o)
 * 3. Context scoring — flags borderline content for human review
 */

const { PrismaClient } = require('@prisma/client');
const { redisGet, redisSet } = require('./redis');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

// ── Tier 1: Absolute block — never allowed ─────
// These are kept minimal — actual word list is in DB and can be managed by admin
const HARD_BLOCKED = new Set([
  // Severe profanity (abbreviated — real list in DB)
  'fuck', 'shit', 'ass', 'bitch', 'cunt', 'dick', 'cock', 'pussy',
  'nigger', 'nigga', 'faggot', 'retard', 'whore', 'slut',
  // Hate speech
  'kike', 'spic', 'chink', 'gook', 'wetback', 'tranny',
  // Self-harm / dangerous
  'kill yourself', 'kys', 'go die', 'end yourself',
]);

// ── Tier 2: Soft block — warn + censor ────────
const SOFT_BLOCKED = new Set([
  'damn', 'hell', 'crap', 'sucks', 'wtf', 'stfu', 'gtfo',
  'idiot', 'stupid', 'dumb', 'moron', 'loser', 'ugly',
  'hate you', 'shut up',
]);

// ── Obfuscation patterns (l33t speak, dots, etc.) ──
const buildObfuscationPattern = (word) => {
  const charMap = {
    'a': '[a@4]', 'e': '[e3]', 'i': '[i1!]', 'o': '[o0]',
    's': '[s$5]', 't': '[t7]', 'l': '[l1]', 'g': '[g9]'
  };
  let pattern = '';
  for (const char of word.toLowerCase()) {
    pattern += (charMap[char] || char) + '[\\s\\._\\-\\*]*';
  }
  return new RegExp(pattern, 'gi');
};

// ── Spam patterns ──────────────────────────────
const SPAM_PATTERNS = [
  /(.)\1{4,}/,                          // repeated chars: aaaaa
  /https?:\/\/[^\s]+/gi,                // URLs (configurable per room)
  /discord\.gg\/\S+/gi,                  // Discord invites
  /t\.me\/\S+/gi,                        // Telegram links
  /\b(\w+\s+){0,3}\1\b/,               // repeated phrases
];

// ── Load extra words from DB (cached in Redis) ──
const getBlocklist = async () => {
  try {
    const cached = await redisGet('moderation:blocklist');
    if (cached) return JSON.parse(cached);

    const words = await prisma.profanityWord.findMany({ select: { word: true, severity: true } });
    const list = words.reduce((acc, w) => { acc[w.word.toLowerCase()] = w.severity; return acc; }, {});
    await redisSet('moderation:blocklist', JSON.stringify(list), { EX: 600 }); // cache 10 min
    return list;
  } catch { return {}; }
};

// ── Main moderation function ───────────────────
const moderateMessage = async (content, options = {}) => {
  const {
    allowLinks = false,
    strictMode = true,   // family-friendly = strict
    userId = null,
    roomId = null
  } = options;

  if (!content || typeof content !== 'string') {
    return { allowed: false, reason: 'empty', censored: '' };
  }

  // Length check
  if (content.length > 500) {
    return { allowed: false, reason: 'too_long', censored: '' };
  }

  const lower = content.toLowerCase().replace(/\s+/g, ' ').trim();

  // ── Layer 1: Hard block ──────────────────────
  for (const word of HARD_BLOCKED) {
    const pattern = buildObfuscationPattern(word);
    if (pattern.test(lower)) {
      logger.warn(`Hard blocked word detected from user ${userId}: "${word}"`);
      return { allowed: false, reason: 'hate_speech_profanity', censored: null, flaggedWord: word };
    }
  }

  // ── Layer 2: DB blocklist ────────────────────
  const dbBlocklist = await getBlocklist();
  for (const [word, severity] of Object.entries(dbBlocklist)) {
    if (severity >= 3) {
      const pattern = buildObfuscationPattern(word);
      if (pattern.test(lower)) {
        return { allowed: false, reason: 'blocked_word', censored: null };
      }
    }
  }

  // ── Layer 3: Soft block / censor ────────────
  let censored = content;
  let wasCensored = false;

  // Soft profanity — replace with asterisks
  for (const word of SOFT_BLOCKED) {
    const pattern = buildObfuscationPattern(word);
    if (pattern.test(censored)) {
      censored = censored.replace(new RegExp(word, 'gi'), '*'.repeat(word.length));
      wasCensored = true;
    }
  }

  // DB soft words (severity 1-2)
  for (const [word, severity] of Object.entries(dbBlocklist)) {
    if (severity <= 2) {
      const pattern = new RegExp(`\\b${word}\\b`, 'gi');
      if (pattern.test(censored)) {
        censored = censored.replace(pattern, '*'.repeat(word.length));
        wasCensored = true;
      }
    }
  }

  // ── Layer 4: Spam / links ────────────────────
  if (!allowLinks) {
    if (/https?:\/\/[^\s]+/gi.test(content)) {
      censored = censored.replace(/https?:\/\/[^\s]+/gi, '[link removed]');
      wasCensored = true;
    }
    if (/discord\.gg\//gi.test(content)) {
      censored = censored.replace(/discord\.gg\/\S+/gi, '[invite removed]');
      wasCensored = true;
    }
  }

  // ── Layer 5: ALL CAPS spam ───────────────────
  if (content.length > 20 && content === content.toUpperCase() && /[A-Z]/.test(content)) {
    censored = censored.charAt(0).toUpperCase() + censored.slice(1).toLowerCase();
  }

  // ── Layer 6: Repeated character spam ─────────
  censored = censored.replace(/(.)\1{4,}/g, (match, char) => char.repeat(3));

  // ── Layer 7: Phone numbers / personal info ───
  if (strictMode) {
    // Mask phone numbers
    censored = censored.replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[phone removed]');
    // Mask emails
    censored = censored.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email removed]');
    // Mask SSN-like patterns
    censored = censored.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[info removed]');
  }

  // ── Auto-flag for human review ────────────────
  const autoFlagged =
    wasCensored ||
    /\b(address|location|where do you live|meet up|snap|instagram|cash app|venmo|paypal)\b/gi.test(censored);

  return {
    allowed: true,
    censored: censored.trim(),
    original: content,
    wasCensored,
    autoFlagged,
    reason: null
  };
};

// ── Rate limiting per user per room ───────────
const checkChatRateLimit = async (userId, roomId, slowModeSeconds = 0) => {
  try {
    const key = `chat:rate:${roomId}:${userId}`;
    const lastMsg = await redisGet(key);
    if (lastMsg) {
      const elapsed = Date.now() - parseInt(lastMsg);
      const cooldown = slowModeSeconds > 0 ? slowModeSeconds * 1000 : 1000; // 1 second default
      if (elapsed < cooldown) {
        return { allowed: false, waitMs: cooldown - elapsed };
      }
    }
    const { redisSet } = require('./redis');
    await redisSet(key, Date.now().toString(), { EX: Math.max(slowModeSeconds + 5, 10) });
    return { allowed: true };
  } catch { return { allowed: true }; }
};

// ── Check if user is banned from room ─────────
const checkBan = async (userId, roomId) => {
  const ban = await prisma.chatRoomBan.findUnique({
    where: { roomId_userId: { roomId, userId } }
  });
  if (!ban) return { banned: false };
  if (ban.expiresAt && ban.expiresAt < new Date()) {
    await prisma.chatRoomBan.delete({ where: { id: ban.id } });
    return { banned: false };
  }
  return { banned: true, reason: ban.reason, expiresAt: ban.expiresAt };
};

// ── Mute check ─────────────────────────────────
const checkMute = async (userId, roomId) => {
  const member = await prisma.chatRoomMember.findUnique({
    where: { roomId_userId: { roomId, userId } }
  });
  if (!member || !member.isMuted) return { muted: false };
  if (member.muteExpiry && member.muteExpiry < new Date()) {
    await prisma.chatRoomMember.update({
      where: { roomId_userId: { roomId, userId } },
      data: { isMuted: false, muteExpiry: null }
    });
    return { muted: false };
  }
  return { muted: true, expiresAt: member.muteExpiry };
};

// ── Auto-escalate repeat offenders ────────────
const trackViolation = async (userId, roomId) => {
  const key = `violations:${roomId}:${userId}`;
  const { redisIncr, redisExpire, redisGet } = require('./redis');
  const count = await redisIncr(key);
  if (count === 1) await redisExpire(key, 3600); // 1 hour window

  if (count >= 5) {
    // Auto-mute for 10 minutes
    const muteExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.chatRoomMember.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: { roomId, userId, isMuted: true, muteExpiry },
      update: { isMuted: true, muteExpiry }
    });
    logger.info(`Auto-muted user ${userId} in room ${roomId} for ${count} violations`);
    return { autoMuted: true, expiresAt: muteExpiry };
  }
  return { autoMuted: false, violationCount: count };
};

// ── Invalidate blocklist cache (called after admin update) ──
const invalidateBlocklistCache = async () => {
  const { redisDel } = require('./redis');
  await redisDel('moderation:blocklist');
};

module.exports = {
  moderateMessage,
  checkChatRateLimit,
  checkBan,
  checkMute,
  trackViolation,
  invalidateBlocklistCache
};
