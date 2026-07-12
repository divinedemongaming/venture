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
const prisma = new PrismaClient();

router.post('/', authenticate, async (req, res) => {
  const { mediaUrl, mediaType = 'image', caption, duration = 5, visibility = 'PUBLIC', sticker, poll, link } = req.body;
  if (!mediaUrl) return res.status(400).json({ error: 'Media required' });
  const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);
  const story = await prisma.story.create({
    data: { authorId: req.user.id, mediaUrl, mediaType, caption, duration, visibility, sticker, poll, link, expiresAt },
    include: { author: { select: { id: true, username: true, avatarUrl: true, isVerified: true } } }
  });
  res.status(201).json(story);
});

router.post('/:storyId/view', authenticate, async (req, res) => {
  const story = await prisma.story.findUnique({ where: { id: req.params.storyId } });
  if (!story || story.expiresAt < new Date()) return res.status(404).json({ error: 'Story not found or expired' });
  await prisma.storyView.upsert({
    where: { storyId_viewerId: { storyId: story.id, viewerId: req.user.id } },
    create: { storyId: story.id, viewerId: req.user.id },
    update: {}
  });
  await prisma.story.update({ where: { id: story.id }, data: { viewsCount: { increment: 1 } } });
  res.json({ viewed: true });
});

router.get('/:storyId/views', authenticate, async (req, res) => {
  const story = await prisma.story.findUnique({ where: { id: req.params.storyId } });
  if (!story || story.authorId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  const views = await prisma.storyView.findMany({
    where: { storyId: story.id },
    orderBy: { viewedAt: 'desc' },
    take: 100,
    include: { story: false }
  });
  res.json({ views, count: story.viewsCount });
});

router.delete('/:storyId', authenticate, async (req, res) => {
  const story = await prisma.story.findUnique({ where: { id: req.params.storyId } });
  if (!story) return res.status(404).json({ error: 'Not found' });
  if (story.authorId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  await prisma.story.delete({ where: { id: story.id } });
  res.json({ message: 'Story deleted' });
});

module.exports = router;
