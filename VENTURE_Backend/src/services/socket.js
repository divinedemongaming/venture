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
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { redisSet, redisGet, redisDel } = require('./redis');
const logger = require('../utils/logger');

const prisma = new PrismaClient();
let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (process.env.CORS_ORIGINS || 'http://localhost:8081').split(','),
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6 // 1MB max message
  });

  // ── Auth middleware ─────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, displayName: true, avatarUrl: true, status: true }
      });

      if (!user || user.status === 'BANNED') return next(new Error('Access denied'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // ── Connection ──────────────────────────────
  io.on('connection', async (socket) => {
    const user = socket.user;
    logger.info(`Socket connected: ${user.username}`);

    // Track online status
    await redisSet(`online:${user.id}`, socket.id, { EX: 86400 });
    socket.join(`user:${user.id}`);

    // ── Messaging ──────────────────────────────
    socket.on('join:thread', (threadId) => {
      socket.join(`thread:${threadId}`);
    });

    socket.on('leave:thread', (threadId) => {
      socket.leave(`thread:${threadId}`);
    });

    socket.on('message:send', async (data) => {
      const { threadId, content, mediaUrl, mediaType, replyToId, type = 'TEXT' } = data;
      if (!content && !mediaUrl) return;

      try {
        // Verify user is member of thread
        const member = await prisma.threadMember.findUnique({
          where: { threadId_userId: { threadId, userId: user.id } }
        });
        if (!member) return socket.emit('error', { message: 'Not a member of this thread' });

        const message = await prisma.message.create({
          data: { threadId, senderId: user.id, content, mediaUrl, mediaType, type, replyToId },
          include: { sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }
        });

        // Update thread last activity
        await prisma.messageThread.update({
          where: { id: threadId },
          data: { lastMessage: content || '📎 Media', lastActivity: new Date() }
        });

        // Increment unread for all other members
        await prisma.threadMember.updateMany({
          where: { threadId, userId: { not: user.id } },
          data: { unreadCount: { increment: 1 } }
        });

        io.to(`thread:${threadId}`).emit('message:new', message);
      } catch (err) {
        logger.error('Socket message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('message:typing', ({ threadId, isTyping }) => {
      socket.to(`thread:${threadId}`).emit('message:typing', {
        userId: user.id, username: user.username, isTyping
      });
    });

    // ── Live stream chat ────────────────────────
    socket.on('live:join', async (streamId) => {
      socket.join(`live:${streamId}`);
      await prisma.liveStream.update({
        where: { id: streamId },
        data: { viewerCount: { increment: 1 } }
      }).catch(() => {});
      io.to(`live:${streamId}`).emit('live:viewerUpdate', {
        streamId, action: 'join', username: user.username
      });
    });

    socket.on('live:leave', async (streamId) => {
      socket.leave(`live:${streamId}`);
      await prisma.liveStream.update({
        where: { id: streamId },
        data: { viewerCount: { decrement: 1 } }
      }).catch(() => {});
    });

    socket.on('live:chat', async (data) => {
      const { streamId, message } = data;
      if (!message || message.length > 300) return;

      try {
        const chatMsg = await prisma.liveChatMessage.create({
          data: { streamId, userId: user.id, username: user.username, message }
        });
        io.to(`live:${streamId}`).emit('live:chat:new', chatMsg);
      } catch (err) {
        logger.error('Live chat error:', err);
      }
    });

    socket.on('live:superchat', async (data) => {
      const { streamId, message, amount, color } = data;
      try {
        const sc = await prisma.superChat.create({
          data: { streamId, senderId: user.id, message, amount, color }
        });
        io.to(`live:${streamId}`).emit('live:superchat:new', {
          ...sc, username: user.username, avatarUrl: user.avatarUrl
        });
      } catch (err) {
        logger.error('Superchat error:', err);
      }
    });

    // ── Notifications ───────────────────────────
    socket.on('notifications:mark_read', async ({ notificationIds }) => {
      if (!Array.isArray(notificationIds)) return;
      await prisma.notification.updateMany({
        where: { id: { in: notificationIds }, userId: user.id },
        data: { isRead: true }
      });
    });

    // ── Presence ────────────────────────────────
    socket.on('presence:update', async ({ status }) => {
      const validStatuses = ['online', 'away', 'busy', 'invisible'];
      if (validStatuses.includes(status)) {
        await redisSet(`presence:${user.id}`, status, { EX: 86400 });
      }
    });

    // ── Disconnect ──────────────────────────────
    socket.on('disconnect', async () => {
      await redisDel(`online:${user.id}`);
      logger.info(`Socket disconnected: ${user.username}`);
    });
  });

  return io;
};

const getIO = () => io;

// Send notification to specific user
const notifyUser = (userId, event, data) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
};

module.exports = { initSocket, getIO, notifyUser };

// ── COMMUNITY CHAT SOCKET HANDLERS ────────────
// Called from initSocket — attach to the io instance
const { moderateMessage, checkChatRateLimit, checkBan, checkMute, trackViolation } = require('./moderator');

const initChatHandlers = (io, socket) => {
  const user = socket.user;

  socket.on('chat:join', async (slug) => {
    try {
      const { PrismaClient } = require('@prisma/client');
      const db = new PrismaClient();
      const room = await db.chatRoom.findUnique({ where: { slug } });
      if (!room) return socket.emit('chat:error', { message: 'Room not found' });

      // Ban check
      const ban = await checkBan(user.id, room.id);
      if (ban.banned) return socket.emit('chat:error', { message: 'You are banned from this room', code: 'BANNED' });

      socket.join(`chat:${room.id}`);

      // Update online count
      await db.chatRoom.update({ where: { id: room.id }, data: { onlineCount: { increment: 1 } } });

      // Broadcast join to room
      socket.to(`chat:${room.id}`).emit('chat:user_joined', {
        roomId: room.id,
        username: user.username,
        displayName: user.displayName
      });

      socket.emit('chat:joined', { roomId: room.id, slug: room.slug, name: room.name });
    } catch (err) {
      socket.emit('chat:error', { message: 'Failed to join room' });
    }
  });

  socket.on('chat:leave', async (roomId) => {
    socket.leave(`chat:${roomId}`);
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();
    await db.chatRoom.update({
      where: { id: roomId },
      data: { onlineCount: { decrement: 1 } }
    }).catch(() => {});
  });

  socket.on('chat:message', async (data) => {
    const { roomId, content, replyToId } = data;
    if (!content?.trim() || !roomId) return;

    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();

    try {
      const room = await db.chatRoom.findUnique({ where: { id: roomId } });
      if (!room || room.isLocked) {
        return socket.emit('chat:error', { message: room?.isLocked ? 'This room is currently locked' : 'Room not found' });
      }

      // Ban / mute checks
      const [ban, mute, rateCheck] = await Promise.all([
        checkBan(user.id, room.id),
        checkMute(user.id, room.id),
        checkChatRateLimit(user.id, room.id, room.slowMode)
      ]);

      if (ban.banned) return socket.emit('chat:error', { message: 'You are banned from this room', code: 'BANNED' });
      if (mute.muted) return socket.emit('chat:error', { message: 'You are muted', expiresAt: mute.expiresAt, code: 'MUTED' });
      if (!rateCheck.allowed) return socket.emit('chat:error', { message: `Slow mode — wait ${Math.ceil(rateCheck.waitMs / 1000)}s`, code: 'SLOW_MODE' });

      // Moderate content
      const modResult = await moderateMessage(content, {
        userId: user.id, roomId: room.id, strictMode: true
      });

      if (!modResult.allowed) {
        const violation = await trackViolation(user.id, room.id);
        socket.emit('chat:blocked', {
          reason: modResult.reason,
          message: 'Message blocked. Keep the chat family-friendly! ⚠️',
          autoMuted: violation.autoMuted
        });
        if (violation.autoMuted) {
          socket.emit('chat:muted', { expiresAt: violation.expiresAt, reason: 'Repeated violations' });
        }
        return;
      }

      // Build badges
      const badges = [];
      if (user.isVerified) badges.push('verified');
      if (user.isCreator) badges.push('creator');
      if (user.role === 'ADMIN') badges.push('admin');
      const isMod = await db.chatRoomModerator.findUnique({
        where: { roomId_userId: { roomId: room.id, userId: user.id } }
      });
      if (isMod) badges.push('moderator');

      // Save message
      const message = await db.chatRoomMessage.create({
        data: {
          roomId: room.id,
          userId: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          content: modResult.censored,
          originalContent: modResult.wasCensored ? content : null,
          wasCensored: modResult.wasCensored,
          autoFlagged: modResult.autoFlagged,
          badges,
          replyToId: replyToId || null
        }
      });

      await db.chatRoom.update({ where: { id: room.id }, data: { messageCount: { increment: 1 } } });

      // Notify sender if censored
      if (modResult.wasCensored) {
        socket.emit('chat:censored', { messageId: message.id, message: 'Your message was modified to keep the chat family-friendly 👍' });
      }

      // Broadcast to all in room
      io.to(`chat:${room.id}`).emit('chat:message:new', message);

      // Auto-flag review queue notification to admins
      if (modResult.autoFlagged) {
        io.to('admin:room').emit('chat:flagged', { message, roomName: room.name });
      }
    } catch (err) {
      socket.emit('chat:error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('chat:typing', ({ roomId, isTyping }) => {
    socket.to(`chat:${roomId}`).emit('chat:typing', {
      userId: user.id, username: user.username, isTyping
    });
  });

  // Reaction
  socket.on('chat:react', async ({ messageId, emoji }) => {
    const ALLOWED = ['❤️', '🔥', '😂', '😮', '👏', '🎮', '⚡', '💯'];
    if (!ALLOWED.includes(emoji)) return;
    const { PrismaClient } = require('@prisma/client');
    const db = new PrismaClient();
    const msg = await db.chatRoomMessage.findUnique({ where: { id: messageId } });
    if (!msg) return;
    const reactions = JSON.parse(msg.reactions || '{}');
    reactions[emoji] = (reactions[emoji] || 0) + 1;
    await db.chatRoomMessage.update({ where: { id: messageId }, data: { reactions: JSON.stringify(reactions) } });
    io.to(`chat:${msg.roomId}`).emit('chat:reaction', { messageId, reactions, emoji, from: user.username });
  });
};

// Export the handler for use in initSocket
module.exports.initChatHandlers = initChatHandlers;
