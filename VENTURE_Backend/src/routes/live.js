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
const { authenticate, optionalAuth, requireCreator } = require('../middleware/auth');
const { getIO } = require('../services/socket');
const { paginate } = require('../utils/pagination');
const prisma = new PrismaClient();

// ── CREATE / START STREAM ─────────────────────
router.post('/', authenticate, requireCreator, async (req, res) => {
  const { title, description, thumbnailUrl, gameId, tags = [], category, visibility = 'PUBLIC', isRecorded = true, scheduledFor } = req.body;

  if (!title) return res.status(400).json({ error: 'Stream title required' });

  const stream = await prisma.liveStream.create({
    data: {
      hostId: req.user.id, title, description, thumbnailUrl,
      gameId: gameId || null, tags, category, visibility, isRecorded,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      status: 'SCHEDULED'
    },
    include: {
      host: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      game: { select: { id: true, name: true, coverUrl: true } }
    }
  });

  res.status(201).json({
    stream,
    streamKey: stream.streamKey,
    rtmpUrl: `${process.env.RTMP_SERVER_URL}/${stream.streamKey}`,
    instructions: 'Use OBS or Streamlabs with the RTMP URL and stream key to go live'
  });
});

// ── GO LIVE (mark stream as live) ─────────────
router.post('/:streamId/start', authenticate, async (req, res) => {
  const stream = await prisma.liveStream.findUnique({ where: { id: req.params.streamId } });
  if (!stream) return res.status(404).json({ error: 'Stream not found' });
  if (stream.hostId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  const updated = await prisma.liveStream.update({
    where: { id: stream.id },
    data: { status: 'LIVE', startedAt: new Date() }
  });

  await prisma.user.update({ where: { id: req.user.id }, data: { isLive: true } });
  if (stream.gameId) {
    await prisma.game.update({ where: { id: stream.gameId }, data: { streamCount: { increment: 1 } } });
  }

  // Notify followers
  const followers = await prisma.follow.findMany({
    where: { followingId: req.user.id, notifyLive: true },
    select: { followerId: true }
  });

  const io = getIO();
  for (const { followerId } of followers) {
    await prisma.notification.create({
      data: {
        userId: followerId, type: 'live',
        title: `${req.user.displayName} is live!`,
        body: `"${stream.title}"`,
        data: JSON.stringify({ streamId: stream.id })
      }
    });
    if (io) io.to(`user:${followerId}`).emit('notification:new', {
      type: 'live', streamId: stream.id, hostName: req.user.displayName
    });
  }

  res.json(updated);
});

// ── END STREAM ────────────────────────────────
router.post('/:streamId/end', authenticate, async (req, res) => {
  const stream = await prisma.liveStream.findUnique({ where: { id: req.params.streamId } });
  if (!stream) return res.status(404).json({ error: 'Stream not found' });
  if (stream.hostId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  const duration = stream.startedAt
    ? Math.round((Date.now() - stream.startedAt.getTime()) / 1000)
    : 0;

  await prisma.liveStream.update({
    where: { id: stream.id },
    data: { status: 'ENDED', endedAt: new Date() }
  });

  await prisma.user.update({ where: { id: req.user.id }, data: { isLive: false } });

  const io = getIO();
  if (io) io.to(`live:${stream.id}`).emit('live:ended', { streamId: stream.id, duration });

  res.json({ message: 'Stream ended', duration });
});

// ── GET STREAM ────────────────────────────────
router.get('/:streamId', optionalAuth, async (req, res) => {
  const stream = await prisma.liveStream.findUnique({
    where: { id: req.params.streamId },
    include: {
      host: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true, followersCount: true } },
      game: true
    }
  });
  if (!stream) return res.status(404).json({ error: 'Stream not found' });

  let isFollowing = false;
  let isSubscribed = false;
  if (req.user) {
    isFollowing = !!(await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.user.id, followingId: stream.hostId } }
    }));
  }

  const recentChat = await prisma.liveChatMessage.findMany({
    where: { streamId: stream.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  res.json({ stream, recentChat: recentChat.reverse(), isFollowing, isSubscribed });
});

// ── LIST LIVE STREAMS ─────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  const { gameId, category, page = 1, limit = 20 } = req.query;
  const { skip, take } = paginate(null, page, limit);

  const where = { status: 'LIVE', visibility: 'PUBLIC' };
  if (gameId) where.gameId = gameId;
  if (category) where.category = category;

  const streams = await prisma.liveStream.findMany({
    where, skip, take,
    orderBy: { viewerCount: 'desc' },
    include: {
      host: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
      game: { select: { id: true, name: true, slug: true, coverUrl: true } }
    }
  });

  res.json(streams);
});

// ── HOST STREAM STATS ─────────────────────────
router.get('/:streamId/stats', authenticate, async (req, res) => {
  const stream = await prisma.liveStream.findUnique({ where: { id: req.params.streamId } });
  if (!stream) return res.status(404).json({ error: 'Not found' });
  if (stream.hostId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

  const superChatTotal = await prisma.superChat.aggregate({
    where: { streamId: stream.id },
    _sum: { amount: true },
    _count: true
  });

  res.json({
    viewerCount: stream.viewerCount,
    peakViewers: stream.peakViewers,
    totalViews: stream.totalViews,
    chatMessages: stream.chatCount,
    superChatRevenue: superChatTotal._sum.amount || 0,
    superChatCount: superChatTotal._count
  });
});

module.exports = router;
