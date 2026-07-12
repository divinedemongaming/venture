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
const { paginate, paginatedResponse } = require('../utils/pagination');
const { notifyUser } = require('../services/socket');
const prisma = new PrismaClient();

const USER_SELECT = {
  id: true, username: true, displayName: true, avatarUrl: true,
  bannerUrl: true, bio: true, pronouns: true, website: true,
  location: true, isCreator: true, isVerified: true, isGamingCreator: true,
  isLive: true, accountType: true, profileTheme: true, profileLayout: true,
  accentColor: true, followersCount: true, followingCount: true,
  postsCount: true, createdAt: true
};

// ── GET profile ───────────────────────────────
router.get('/:username', optionalAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { username: req.params.username.toLowerCase() },
    select: {
      ...USER_SELECT,
      gamerProfile: { select: { level: true, xp: true, rank: true, platforms: true, favoriteGames: true } },
      creatorProfile: { select: { isMonetized: true, tagline: true, goalAmount: true, goalCurrent: true, goalDescription: true } },
      _count: { select: { followers: true, following: true, posts: true, reels: true, clips: true } }
    }
  });

  if (!user) return res.status(404).json({ error: 'User not found' });

  // Check if requesting user follows this user
  let isFollowing = false;
  let isSubscribed = false;
  if (req.user) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: req.user.id, followingId: user.id } }
    });
    isFollowing = !!follow;

    if (user.isCreator) {
      const sub = await prisma.subscription.findFirst({
        where: { subscriberId: req.user.id, creatorId: user.id, status: 'active' }
      });
      isSubscribed = !!sub;
    }
  }

  res.json({ ...user, isFollowing, isSubscribed });
});

// ── UPDATE profile ────────────────────────────
router.patch('/me/profile', authenticate, async (req, res) => {
  const allowed = ['displayName', 'bio', 'pronouns', 'website', 'location',
                   'avatarUrl', 'bannerUrl', 'profileTheme', 'profileLayout', 'accentColor'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (updates.displayName && (updates.displayName.length < 1 || updates.displayName.length > 50)) {
    return res.status(400).json({ error: 'Display name must be 1-50 characters' });
  }
  if (updates.bio && updates.bio.length > 500) {
    return res.status(400).json({ error: 'Bio must be under 500 characters' });
  }
  if (updates.website && !/^https?:\/\//.test(updates.website)) {
    return res.status(400).json({ error: 'Website must be a valid URL' });
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: updates,
    select: USER_SELECT
  });
  res.json(user);
});

// ── FOLLOW ────────────────────────────────────
router.post('/:userId/follow', authenticate, async (req, res) => {
  if (req.params.userId === req.user.id) {
    return res.status(400).json({ error: "You can't follow yourself" });
  }

  const target = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!target) return res.status(404).json({ error: 'User not found' });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: req.user.id, followingId: req.params.userId } }
  });

  if (existing) {
    // Unfollow
    await prisma.follow.delete({ where: { id: existing.id } });
    await prisma.user.update({
      where: { id: req.user.id }, data: { followingCount: { decrement: 1 } }
    });
    await prisma.user.update({
      where: { id: req.params.userId }, data: { followersCount: { decrement: 1 } }
    });
    return res.json({ following: false });
  }

  await prisma.follow.create({
    data: { followerId: req.user.id, followingId: req.params.userId }
  });
  await prisma.user.update({
    where: { id: req.user.id }, data: { followingCount: { increment: 1 } }
  });
  await prisma.user.update({
    where: { id: req.params.userId }, data: { followersCount: { increment: 1 } }
  });

  // Send notification
  await prisma.notification.create({
    data: {
      userId: req.params.userId, type: 'follow',
      title: 'New Follower', body: `${req.user.displayName} started following you`,
      data: JSON.stringify({ followerId: req.user.id, followerUsername: req.user.username })
    }
  });
  notifyUser(req.params.userId, 'notification:new', {
    type: 'follow', fromUser: req.user.username
  });

  res.json({ following: true });
});

// ── FOLLOWERS list ────────────────────────────
router.get('/:userId/followers', optionalAuth, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { skip, take } = paginate(null, page, limit);

  const [followers, total] = await prisma.$transaction([
    prisma.follow.findMany({
      where: { followingId: req.params.userId },
      skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        follower: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } }
      }
    }),
    prisma.follow.count({ where: { followingId: req.params.userId } })
  ]);

  res.json(paginatedResponse(followers.map(f => f.follower), total, page, limit));
});

// ── FOLLOWING list ────────────────────────────
router.get('/:userId/following', optionalAuth, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { skip, take } = paginate(null, page, limit);

  const [following, total] = await prisma.$transaction([
    prisma.follow.findMany({
      where: { followerId: req.params.userId },
      skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        following: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } }
      }
    }),
    prisma.follow.count({ where: { followerId: req.params.userId } })
  ]);

  res.json(paginatedResponse(following.map(f => f.following), total, page, limit));
});

// ── BLOCK user ────────────────────────────────
router.post('/:userId/block', authenticate, async (req, res) => {
  if (req.params.userId === req.user.id) return res.status(400).json({ error: "Can't block yourself" });

  // Remove follow in both directions
  await prisma.follow.deleteMany({
    where: {
      OR: [
        { followerId: req.user.id, followingId: req.params.userId },
        { followerId: req.params.userId, followingId: req.user.id }
      ]
    }
  });

  // Store block in Redis for quick lookup
  const { redisSet } = require('../services/redis');
  await redisSet(`block:${req.user.id}:${req.params.userId}`, '1', { EX: 365 * 24 * 3600 });

  res.json({ blocked: true });
});

// ── SUGGEST users ─────────────────────────────
router.get('/discover/suggested', authenticate, async (req, res) => {
  const following = await prisma.follow.findMany({
    where: { followerId: req.user.id },
    select: { followingId: true }
  });
  const followingIds = following.map(f => f.followingId);
  followingIds.push(req.user.id);

  const suggested = await prisma.user.findMany({
    where: {
      id: { notIn: followingIds },
      status: 'ACTIVE'
    },
    orderBy: [{ followersCount: 'desc' }, { isVerified: 'desc' }],
    take: 10,
    select: {
      id: true, username: true, displayName: true, avatarUrl: true,
      isVerified: true, isCreator: true, followersCount: true, bio: true
    }
  });

  res.json(suggested);
});

// ── REPORT user ───────────────────────────────
router.post('/:userId/report', authenticate, async (req, res) => {
  const { reason, details, contentType = 'user', contentId } = req.body;
  if (!reason) return res.status(400).json({ error: 'Reason required' });

  await prisma.report.create({
    data: {
      reporterId: req.user.id,
      reportedId: req.params.userId,
      contentType, contentId: contentId || req.params.userId,
      reason, details
    }
  });

  res.json({ message: 'Report submitted. Our team will review it.' });
});


// ── PUT /users/me/push-token ────────────────────────────────────────────────
// Register or update the user's Expo push token for notification delivery.
// Hard-blocked from Kids Mode sessions by kidsPrivacyGuard middleware.
router.post('/me/push-token', authenticate, async (req, res) => {
  const { token } = req.body;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ error: 'Valid push token required' });
  }

  // Validate Expo push token format
  const isExpoToken = token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken[');
  if (!isExpoToken) {
    return res.status(400).json({ error: 'Invalid push token format' });
  }

  await prisma.user.update({
    where: { id: req.user.id },
    data: { pushToken: token, pushTokenUpdatedAt: new Date() },
  });

  res.json({ registered: true });
});

module.exports = router;
