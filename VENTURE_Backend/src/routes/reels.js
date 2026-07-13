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
const { notifyUser } = require('../services/socket');
const prisma = new PrismaClient();

router.post('/', authenticate, async (req, res) => {
  const { videoUrl, thumbnailUrl, caption, audioTrack, audioName, duration, tags = [], gameTag, visibility = 'PUBLIC', isNSFW = false, isExclusive = false } = req.body;
  if (!videoUrl) return res.status(400).json({ error: 'Video URL required' });
  if (!duration || duration < 1 || duration > 600) return res.status(400).json({ error: 'Invalid duration (1-600 seconds)' });

  const reel = await prisma.reel.create({
    data: { authorId: req.user.id, videoUrl, thumbnailUrl, caption, audioTrack, audioName, duration, tags, gameTag, visibility, isNSFW, isExclusive },
    include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } } }
  });
  res.status(201).json(reel);
});

router.post('/:reelId/like', authenticate, async (req, res) => {
  const reel = await prisma.reel.findUnique({ where: { id: req.params.reelId } });
  if (!reel) return res.status(404).json({ error: 'Reel not found' });
  const existing = await prisma.like.findUnique({ where: { userId_reelId: { userId: req.user.id, reelId: reel.id } } });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    await prisma.reel.update({ where: { id: reel.id }, data: { likesCount: { decrement: 1 } } });
    return res.json({ liked: false });
  }
  await prisma.like.create({ data: { userId: req.user.id, reelId: reel.id } });
  await prisma.reel.update({ where: { id: reel.id }, data: { likesCount: { increment: 1 }, viewsCount: { increment: 1 } } });
  if (reel.authorId !== req.user.id) notifyUser(reel.authorId, 'notification:new', { type: 'like_reel' });
  res.json({ liked: true });
});

router.delete('/:reelId', authenticate, async (req, res) => {
  const reel = await prisma.reel.findUnique({ where: { id: req.params.reelId } });
  if (!reel) return res.status(404).json({ error: 'Not found' });
  if (reel.authorId !== req.user.id && req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Not authorized' });
  await prisma.reel.delete({ where: { id: reel.id } });
  res.json({ message: 'Reel deleted' });
});

module.exports = router;
