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
const { generateSlug } = require('../utils/tokens');
const { paginate, paginatedResponse } = require('../utils/pagination');
const prisma = new PrismaClient();

router.post('/', authenticate, async (req, res) => {
  const { name, description, avatarUrl, bannerUrl, isPublic = true, gameId, tags = [], rules = [] } = req.body;
  if (!name) return res.status(400).json({ error: 'Community name required' });
  const slug = generateSlug(name) + '-' + Math.random().toString(36).slice(2, 6);
  const community = await prisma.community.create({
    data: {
      ownerId: req.user.id, name, slug, description, avatarUrl, bannerUrl, isPublic, gameId, tags, rules, memberCount: 1,
      members: { create: { userId: req.user.id, role: 'owner' } }
    }
  });
  res.status(201).json(community);
});

router.get('/:slug', optionalAuth, async (req, res) => {
  const community = await prisma.community.findUnique({
    where: { slug: req.params.slug },
    include: { owner: { select: { id: true, username: true, displayName: true, avatarUrl: true } }, _count: { select: { members: true, posts: true } } }
  });
  if (!community) return res.status(404).json({ error: 'Community not found' });
  let isMember = false;
  if (req.user) {
    isMember = !!(await prisma.communityMember.findUnique({ where: { communityId_userId: { communityId: community.id, userId: req.user.id } } }));
  }
  res.json({ ...community, isMember });
});

router.post('/:communityId/join', authenticate, async (req, res) => {
  const community = await prisma.community.findUnique({ where: { id: req.params.communityId } });
  if (!community) return res.status(404).json({ error: 'Community not found' });
  const existing = await prisma.communityMember.findUnique({ where: { communityId_userId: { communityId: community.id, userId: req.user.id } } });
  if (existing) {
    await prisma.communityMember.delete({ where: { id: existing.id } });
    await prisma.community.update({ where: { id: community.id }, data: { memberCount: { decrement: 1 } } });
    return res.json({ joined: false });
  }
  await prisma.communityMember.create({ data: { communityId: community.id, userId: req.user.id } });
  await prisma.community.update({ where: { id: community.id }, data: { memberCount: { increment: 1 } } });
  res.json({ joined: true });
});

router.get('/:communityId/posts', optionalAuth, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { skip, take } = paginate(null, page, limit);
  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where: { communityId: req.params.communityId, visibility: 'PUBLIC' }, skip, take,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } } }
    }),
    prisma.post.count({ where: { communityId: req.params.communityId } })
  ]);
  res.json(paginatedResponse(posts, total, page, limit));
});

module.exports = router;
