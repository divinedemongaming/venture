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
const { authenticate } = require('../middleware/auth');
const { paginate, paginatedResponse } = require('../utils/pagination');
const prisma = new PrismaClient();

// ── GET all threads ────────────────────────────
router.get('/threads', authenticate, async (req, res) => {
  const threads = await prisma.threadMember.findMany({
    where: { userId: req.user.id },
    orderBy: { thread: { lastActivity: 'desc' } },
    include: {
      thread: {
        include: {
          members: {
            where: { userId: { not: req.user.id } },
            include: {
              user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } }
            }
          }
        }
      }
    }
  });

  res.json(threads.map(t => ({
    ...t.thread,
    unreadCount: t.unreadCount,
    otherMembers: t.thread.members.map(m => m.user)
  })));
});

// ── CREATE thread ─────────────────────────────
router.post('/threads', authenticate, async (req, res) => {
  const { userIds, name, isGroup = false } = req.body;
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'At least one recipient required' });
  }
  if (userIds.includes(req.user.id)) {
    return res.status(400).json({ error: "Can't message yourself" });
  }

  // For DMs, check if thread already exists
  if (!isGroup && userIds.length === 1) {
    const existing = await prisma.messageThread.findFirst({
      where: {
        isGroup: false,
        members: { every: { userId: { in: [req.user.id, userIds[0]] } } }
      },
      include: { members: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } } }
    });
    if (existing) return res.json(existing);
  }

  const thread = await prisma.messageThread.create({
    data: {
      name: isGroup ? name : null,
      isGroup,
      members: {
        create: [
          { userId: req.user.id, role: 'admin' },
          ...userIds.map(id => ({ userId: id }))
        ]
      }
    },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }
      }
    }
  });

  res.status(201).json(thread);
});

// ── GET messages in thread ─────────────────────
router.get('/threads/:threadId', authenticate, async (req, res) => {
  const member = await prisma.threadMember.findUnique({
    where: { threadId_userId: { threadId: req.params.threadId, userId: req.user.id } }
  });
  if (!member) return res.status(403).json({ error: 'Not a member of this thread' });

  const { before, limit = 50 } = req.query;
  const take = Math.min(100, parseInt(limit));
  const where = { threadId: req.params.threadId, isDeleted: false };
  if (before) where.createdAt = { lt: new Date(before) };

  const messages = await prisma.message.findMany({
    where, take, orderBy: { createdAt: 'desc' },
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      replyTo: {
        include: { sender: { select: { id: true, username: true } } }
      }
    }
  });

  // Mark as read
  await prisma.threadMember.update({
    where: { threadId_userId: { threadId: req.params.threadId, userId: req.user.id } },
    data: { unreadCount: 0, lastRead: new Date() }
  });

  const thread = await prisma.messageThread.findUnique({
    where: { id: req.params.threadId },
    include: {
      members: {
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } } }
      }
    }
  });

  res.json({ thread, messages: messages.reverse(), hasMore: messages.length === take });
});

// ── SEND message to thread ──────────────────────
router.post('/threads/:threadId', authenticate, async (req, res) => {
  const { content, mediaUrls = [], replyToId } = req.body;
  const { threadId } = req.params;
  if (!content?.trim() && !mediaUrls.length) {
    return res.status(400).json({ error: 'Message content required' });
  }
  const membership = await prisma.threadMember.findFirst({
    where: { threadId, userId: req.user.id },
  });
  if (!membership) return res.status(403).json({ error: 'Not a member of this thread' });

  const message = await prisma.message.create({
    data: {
      threadId,
      senderId: req.user.id,
      content: content?.trim(),
      mediaUrls,
      replyToId: replyToId || null,
    },
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      replyTo: { select: { id: true, content: true, sender: { select: { username: true } } } },
    },
  });

  await prisma.messageThread.update({
    where: { id: threadId },
    data: { lastMessageAt: new Date() },
  });

  res.status(201).json({ message });
});

// ── DELETE message ─────────────────────────────
router.delete('/messages/:messageId', authenticate, async (req, res) => {

// ── DELETE message ─────────────────────────────
router.delete('/messages/:messageId', authenticate, async (req, res) => {
  const message = await prisma.message.findUnique({ where: { id: req.params.messageId } });
  if (!message) return res.status(404).json({ error: 'Message not found' });
  if (message.senderId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  await prisma.message.update({ where: { id: message.id }, data: { isDeleted: true, content: null } });
  res.json({ deleted: true });
});

module.exports = router;
