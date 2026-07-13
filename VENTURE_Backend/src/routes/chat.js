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
const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { moderateMessage, checkChatRateLimit, checkBan, checkMute, trackViolation } = require('../services/moderator');
const { paginate } = require('../utils/pagination');
const prisma = new PrismaClient();

// ── GET all rooms (world + countries + area codes) ──
router.get('/rooms', optionalAuth, async (req, res) => {
  const { type, country, search } = req.query;

  const where = { isActive: true };
  if (type) where.type = type.toUpperCase();
  if (country) where.countryCode = country.toUpperCase();
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { regionCode: { contains: search, mode: 'insensitive' } },
      { regionName: { contains: search, mode: 'insensitive' } }
    ];
  }

  const rooms = await prisma.chatRoom.findMany({
    where,
    orderBy: [{ type: 'asc' }, { onlineCount: 'desc' }, { name: 'asc' }],
    take: 200,
    select: {
      id: true, type: true, name: true, slug: true, description: true,
      regionCode: true, regionName: true, countryCode: true, flagEmoji: true,
      language: true, memberCount: true, onlineCount: true, slowMode: true, isLocked: true
    }
  });

  // Group by type
  const grouped = {
    world: rooms.filter(r => r.type === 'WORLD'),
    countries: rooms.filter(r => r.type === 'COUNTRY'),
    areaCodes: rooms.filter(r => r.type === 'AREA_CODE'),
    cities: rooms.filter(r => r.type === 'CITY'),
  };

  res.json(grouped);
});

// ── GET single room ────────────────────────────
router.get('/rooms/:slug', optionalAuth, async (req, res) => {
  const room = await prisma.chatRoom.findUnique({
    where: { slug: req.params.slug },
    include: {
      _count: { select: { members: true, messages: true } },
      moderators: {
        include: { room: false },
        take: 20
      }
    }
  });
  if (!room) return res.status(404).json({ error: 'Chat room not found' });

  let isMember = false, isModerator = false, isBanned = false;
  if (req.user) {
    isMember = !!(await prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId: req.user.id } }
    }));
    isModerator = !!(await prisma.chatRoomModerator.findUnique({
      where: { roomId_userId: { roomId: room.id, userId: req.user.id } }
    }));
    const banCheck = await checkBan(req.user.id, room.id);
    isBanned = banCheck.banned;
  }

  res.json({ ...room, isMember, isModerator, isBanned });
});

// ── GET message history ────────────────────────
router.get('/rooms/:slug/messages', optionalAuth, async (req, res) => {
  const room = await prisma.chatRoom.findUnique({ where: { slug: req.params.slug } });
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { before, limit = 50 } = req.query;
  const take = Math.min(100, parseInt(limit));
  const where = { roomId: room.id, isDeleted: false };
  if (before) where.createdAt = { lt: new Date(before) };

  const messages = await prisma.chatRoomMessage.findMany({
    where, take, orderBy: { createdAt: 'desc' }
  });

  res.json({ messages: messages.reverse(), hasMore: messages.length === take });
});

// ── JOIN room ──────────────────────────────────
router.post('/rooms/:slug/join', authenticate, async (req, res) => {
  const room = await prisma.chatRoom.findUnique({ where: { slug: req.params.slug } });
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const ban = await checkBan(req.user.id, room.id);
  if (ban.banned) return res.status(403).json({ error: 'You are banned from this room', reason: ban.reason });

  await prisma.chatRoomMember.upsert({
    where: { roomId_userId: { roomId: room.id, userId: req.user.id } },
    create: { roomId: room.id, userId: req.user.id },
    update: { lastSeen: new Date() }
  });

  await prisma.chatRoom.update({
    where: { id: room.id },
    data: { memberCount: { increment: 1 } }
  }).catch(() => {});

  res.json({ joined: true, room: { id: room.id, name: room.name, slug: room.slug } });
});

// ── POST message (REST fallback — Socket.io preferred) ──
router.post('/rooms/:slug/messages', authenticate, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Message content required' });

  const room = await prisma.chatRoom.findUnique({ where: { slug: req.params.slug } });
  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (room.isLocked) return res.status(403).json({ error: 'Room is locked by admin' });

  // Ban check
  const ban = await checkBan(req.user.id, room.id);
  if (ban.banned) return res.status(403).json({ error: 'You are banned from this room' });

  // Mute check
  const mute = await checkMute(req.user.id, room.id);
  if (mute.muted) return res.status(403).json({ error: 'You are muted in this room', expiresAt: mute.expiresAt });

  // Rate limit
  const rateCheck = await checkChatRateLimit(req.user.id, room.id, room.slowMode);
  if (!rateCheck.allowed) {
    return res.status(429).json({ error: `Slow down! Wait ${Math.ceil(rateCheck.waitMs / 1000)} seconds.` });
  }

  // Moderate
  const modResult = await moderateMessage(content, { userId: req.user.id, roomId: room.id, strictMode: true });

  if (!modResult.allowed) {
    await trackViolation(req.user.id, room.id);
    return res.status(400).json({ error: 'Message blocked by content filter', reason: modResult.reason });
  }

  // Build badges
  const badges = [];
  if (req.user.isVerified) badges.push('verified');
  if (req.user.isCreator) badges.push('creator');
  const isMod = await prisma.chatRoomModerator.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: req.user.id } }
  });
  if (isMod) badges.push('moderator');
  if (req.user.role === 'ADMIN') badges.push('admin');

  const message = await prisma.chatRoomMessage.create({
    data: {
      roomId: room.id,
      userId: req.user.id,
      username: req.user.username,
      displayName: req.user.displayName,
      avatarUrl: req.user.avatarUrl,
      content: modResult.censored,
      originalContent: modResult.wasCensored ? content : null,
      wasCensored: modResult.wasCensored,
      autoFlagged: modResult.autoFlagged,
      badges
    }
  });

  await prisma.chatRoom.update({
    where: { id: room.id },
    data: { messageCount: { increment: 1 } }
  });

  res.status(201).json(message);
});

// ── REPORT message ─────────────────────────────
router.post('/messages/:messageId/report', authenticate, async (req, res) => {
  const { reason, details } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason required' });

  await prisma.chatMessageReport.create({
    data: { messageId: req.params.messageId, reporterId: req.user.id, reason, details }
  });
  await prisma.chatRoomMessage.update({
    where: { id: req.params.messageId },
    data: { reportCount: { increment: 1 } }
  });

  res.json({ message: 'Report submitted. Moderators will review.' });
});

// ── REACT to message ───────────────────────────
router.post('/messages/:messageId/react', authenticate, async (req, res) => {
  const { emoji } = req.body;
  const ALLOWED_REACTIONS = ['❤️', '🔥', '😂', '😮', '👏', '🎮', '⚡', '💯'];
  if (!ALLOWED_REACTIONS.includes(emoji)) return res.status(400).json({ error: 'Invalid reaction' });

  const msg = await prisma.chatRoomMessage.findUnique({ where: { id: req.params.messageId } });
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  const reactions = JSON.parse(msg.reactions || '{}');
  reactions[emoji] = (reactions[emoji] || 0) + 1;

  await prisma.chatRoomMessage.update({
    where: { id: msg.id },
    data: { reactions: JSON.stringify(reactions) }
  });

  res.json({ reactions });
});

// ── MOD: Delete message ────────────────────────
router.delete('/messages/:messageId', authenticate, async (req, res) => {
  const msg = await prisma.chatRoomMessage.findUnique({ where: { id: req.params.messageId } });
  if (!msg) return res.status(404).json({ error: 'Not found' });

  // Check mod permission
  const isMod = await prisma.chatRoomModerator.findUnique({
    where: { roomId_userId: { roomId: msg.roomId, userId: req.user.id } }
  });
  const isAdmin = ['ADMIN', 'STAFF'].includes(req.user.role);
  const isOwn = msg.userId === req.user.id;

  if (!isMod && !isAdmin && !isOwn) return res.status(403).json({ error: 'Not authorized' });

  await prisma.chatRoomMessage.update({
    where: { id: msg.id },
    data: { isDeleted: true, deletedBy: req.user.id, deleteReason: req.body.reason }
  });

  res.json({ deleted: true });
});

// ── MOD: Mute user ─────────────────────────────
router.post('/rooms/:slug/mute/:userId', authenticate, async (req, res) => {
  const room = await prisma.chatRoom.findUnique({ where: { slug: req.params.slug } });
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const isMod = await prisma.chatRoomModerator.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: req.user.id } }
  });
  if (!isMod && !['ADMIN', 'STAFF'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Moderator access required' });
  }

  const { duration = 600, reason } = req.body; // default 10 min
  const muteExpiry = new Date(Date.now() + duration * 1000);

  await prisma.chatRoomMember.upsert({
    where: { roomId_userId: { roomId: room.id, userId: req.params.userId } },
    create: { roomId: room.id, userId: req.params.userId, isMuted: true, muteExpiry },
    update: { isMuted: true, muteExpiry }
  });

  res.json({ muted: true, expiresAt: muteExpiry, reason });
});

// ── MOD: Ban user from room ────────────────────
router.post('/rooms/:slug/ban/:userId', authenticate, async (req, res) => {
  const room = await prisma.chatRoom.findUnique({ where: { slug: req.params.slug } });
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const isMod = await prisma.chatRoomModerator.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: req.user.id } }
  });
  if (!isMod && !['ADMIN', 'STAFF'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Moderator access required' });
  }

  const { reason, duration } = req.body;
  const expiresAt = duration ? new Date(Date.now() + duration * 1000) : null;

  await prisma.chatRoomBan.upsert({
    where: { roomId_userId: { roomId: room.id, userId: req.params.userId } },
    create: { roomId: room.id, userId: req.params.userId, bannedBy: req.user.id, reason, expiresAt },
    update: { bannedBy: req.user.id, reason, expiresAt, bannedAt: new Date() }
  });

  res.json({ banned: true, expiresAt, reason });
});

// ── ADMIN: Add moderator ───────────────────────
router.post('/rooms/:slug/moderators', authenticate, async (req, res) => {
  if (!['ADMIN', 'STAFF'].includes(req.user.role)) return res.status(403).json({ error: 'Admin only' });

  const room = await prisma.chatRoom.findUnique({ where: { slug: req.params.slug } });
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const { userId } = req.body;
  await prisma.chatRoomModerator.upsert({
    where: { roomId_userId: { roomId: room.id, userId } },
    create: { roomId: room.id, userId, addedBy: req.user.id },
    update: { addedBy: req.user.id }
  });

  res.json({ message: 'Moderator added' });
});

// ── ADMIN: Lock / unlock room ──────────────────
router.patch('/rooms/:slug/lock', authenticate, async (req, res) => {
  if (!['ADMIN', 'STAFF'].includes(req.user.role)) return res.status(403).json({ error: 'Admin only' });

  const { isLocked } = req.body;
  const room = await prisma.chatRoom.update({
    where: { slug: req.params.slug },
    data: { isLocked }
  });

  res.json({ isLocked: room.isLocked, name: room.name });
});

// ── ADMIN: Manage profanity list ───────────────
router.get('/moderation/blocklist', authenticate, async (req, res) => {
  if (!['ADMIN', 'STAFF'].includes(req.user.role)) return res.status(403).json({ error: 'Admin only' });
  const words = await prisma.profanityWord.findMany({ orderBy: { severity: 'desc' } });
  res.json(words);
});

router.post('/moderation/blocklist', authenticate, async (req, res) => {
  if (!['ADMIN', 'STAFF'].includes(req.user.role)) return res.status(403).json({ error: 'Admin only' });
  const { word, severity = 2 } = req.body;
  if (!word) return res.status(400).json({ error: 'Word required' });

  const entry = await prisma.profanityWord.upsert({
    where: { word: word.toLowerCase() },
    create: { word: word.toLowerCase(), severity, addedBy: req.user.id },
    update: { severity, addedBy: req.user.id }
  });

  const { invalidateBlocklistCache } = require('../services/moderator');
  await invalidateBlocklistCache();

  res.json(entry);
});

router.delete('/moderation/blocklist/:word', authenticate, async (req, res) => {
  if (!['ADMIN', 'STAFF'].includes(req.user.role)) return res.status(403).json({ error: 'Admin only' });
  await prisma.profanityWord.delete({ where: { word: req.params.word } });
  const { invalidateBlocklistCache } = require('../services/moderator');
  await invalidateBlocklistCache();
  res.json({ removed: true });
});

// ── ADMIN: Flagged messages queue ─────────────
router.get('/moderation/flagged', authenticate, async (req, res) => {
  if (!['ADMIN', 'STAFF'].includes(req.user.role)) return res.status(403).json({ error: 'Admin only' });

  const flagged = await prisma.chatRoomMessage.findMany({
    where: {
      OR: [{ autoFlagged: true }, { reportCount: { gte: 2 } }],
      isDeleted: false
    },
    orderBy: [{ reportCount: 'desc' }, { createdAt: 'desc' }],
    take: 100,
    include: { room: { select: { name: true, slug: true } }, reports: { where: { status: 'pending' } } }
  });

  res.json(flagged);
});

module.exports = router;
