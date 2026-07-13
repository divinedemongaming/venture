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
const { authenticate, requireCreator } = require('../middleware/auth');
const prisma = new PrismaClient();

router.get('/overview', authenticate, requireCreator, async (req, res) => {
  const { period = '30d' } = req.query;
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);

  const [posts, totalLikes, totalViews, followers, newFollowers] = await Promise.all([
    prisma.post.count({ where: { authorId: req.user.id, createdAt: { gte: since } } }),
    prisma.post.aggregate({ where: { authorId: req.user.id }, _sum: { likesCount: true, viewsCount: true } }),
    prisma.post.aggregate({ where: { authorId: req.user.id, createdAt: { gte: since } }, _sum: { viewsCount: true } }),
    prisma.user.findUnique({ where: { id: req.user.id }, select: { followersCount: true } }),
    prisma.follow.count({ where: { followingId: req.user.id, createdAt: { gte: since } } })
  ]);

  res.json({
    period,
    posts: posts,
    totalLikes: totalLikes._sum.likesCount || 0,
    totalViews: totalViews._sum.viewsCount || 0,
    followers: followers?.followersCount || 0,
    newFollowers,
    engagementRate: followers?.followersCount
      ? ((totalLikes._sum.likesCount || 0) / Math.max(1, followers.followersCount) * 100).toFixed(2)
      : '0.00'
  });
});

router.post('/event', authenticate, async (req, res) => {
  const { event, properties, sessionId, platform } = req.body;
  if (!event) return res.status(400).json({ error: 'Event name required' });
  await prisma.analyticsEvent.create({
    data: { userId: req.user.id, event, properties: JSON.stringify(properties), sessionId, platform }
  });
  res.json({ recorded: true });
});

module.exports = router;
