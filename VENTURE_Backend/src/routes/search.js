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
const { optionalAuth } = require('../middleware/auth');
const { redisSet, redisGet } = require('../services/redis');
const prisma = new PrismaClient();

router.get('/', optionalAuth, async (req, res) => {
  const { q, type = 'all', page = 1, limit = 20 } = req.query;
  if (!q || q.trim().length < 2) return res.status(400).json({ error: 'Search query too short' });

  const query = q.trim().slice(0, 100); // Limit query length
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = Math.min(50, parseInt(limit));

  const results = {};

  if (type === 'all' || type === 'users') {
    results.users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } }
        ]
      },
      take, skip,
      select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true, isCreator: true, followersCount: true }
    });
  }

  if (type === 'all' || type === 'posts') {
    results.posts = await prisma.post.findMany({
      where: {
        visibility: 'PUBLIC',
        OR: [
          { content: { contains: query, mode: 'insensitive' } },
          { tags: { has: query.toLowerCase() } }
        ]
      },
      take, skip, orderBy: { likesCount: 'desc' },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }
    });
  }

  if (type === 'all' || type === 'games') {
    results.games = await prisma.game.findMany({
      where: { name: { contains: query, mode: 'insensitive' } },
      take, orderBy: { viewerCount: 'desc' }
    });
  }

  if (type === 'all' || type === 'communities') {
    results.communities = await prisma.community.findMany({
      where: {
        isPublic: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      take, skip
    });
  }

  if (type === 'all' || type === 'tags') {
    results.tags = await prisma.trendingTopic.findMany({
      where: { tag: { contains: query.toLowerCase(), mode: 'insensitive' } },
      take: 10, orderBy: { score: 'desc' }
    });
  }

  res.json(results);
});

// Trending searches (cached)
router.get('/trending-searches', async (req, res) => {
  const cached = await redisGet('trending:searches');
  if (cached) return res.json(JSON.parse(cached));

  const tags = await prisma.trendingTopic.findMany({
    orderBy: { score: 'desc' },
    take: 15,
    select: { tag: true, postCount: true }
  });

  await redisSet('trending:searches', JSON.stringify(tags), { EX: 600 });
  res.json(tags);
});

module.exports = router;
