const express = require('express');
const router = express.Router();
const { prisma } = require('../services/redis');
const { authenticate } = require('../middleware/auth');

// ── GET threads for current user ─────────────────────────────
router.get('/threads', authenticate, async (req, res) => {
  const threads = await prisma.messageThread.findMany({
    where: {
      members: {
        some: { userId: req.user.id }
      }
    },
    include: {
      members: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
      messages: { take: 1, orderBy: { createdAt: 'desc' } }
    },
    orderBy: { lastMessageAt: 'desc' }
  });
  res.json(threads);
});

// ── GET messages for a thread ─────────────────────────────
router.get('/threads/:threadId/messages', authenticate, async (req, res) => {
  const { threadId } = req.params;
  const { page = 1 } = req.query;
  const limit = 50;
  const skip = (page - 1) * limit;

  // Verify user is in thread
  const member = await prisma.threadMember.findUnique({
    where: { userId_threadId: { userId: req.user.id, threadId } }
  });
  if (!member) return res.status(403).json({ error: 'Not authorized' });

  const messages = await prisma.message.findMany({
    where: { threadId },
    include: { sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip
  });

  res.json(messages.reverse());
});

// ── POST message ─────────────────────────────
router.post('/threads/:threadId/messages', authenticate, async (req, res) => {
  const { threadId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) return res.status(400).json({ error: 'Content required' });

  // Verify user is in thread
  const member = await prisma.threadMember.findUnique({
    where: { userId_threadId: { userId: req.user.id, threadId } }
  });
  if (!member) return res.status(403).json({ error: 'Not authorized' });

  const message = await prisma.message.create({
    data: {
      content,
      threadId,
      senderId: req.user.id
    },
    include: { sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }
  });

  // Update thread lastMessageAt
  await prisma.messageThread.update({
    where: { id: threadId },
    data: { lastMessageAt: new Date() }
  });

  res.status(201).json({ message });
});

// ── DELETE message ─────────────────────────────
router.delete('/messages/:messageId', authenticate, async (req, res) => {
  const message = await prisma.message.findUnique({ where: { id: req.params.messageId } });
  if (!message) return res.status(404).json({ error: 'Message not found' });
  if (message.senderId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  
  await prisma.message.update({ 
    where: { id: message.id }, 
    data: { isDeleted: true, content: null } 
  });
  
  res.json({ deleted: true });
});

module.exports = router;

