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
const { redisGet, redisSet } = require('../services/redis');
const prisma = new PrismaClient();

// ── ALGORITHM ─────────────────────────────────
// Score = (likes * 3) + (comments * 5) + (shares * 4) + (views * 0.1) - (hoursSincePost * 2)
const scoreFeedItem = (item, hoursAgo) => {
  const engagement = (item.likesCount * 3) + (item.commentsCount * 5) +
                     (item.sharesCount * 4) + (item.viewsCount * 0.1);
  const decay = Math.pow(0.95, hoursAgo);
  return engagement * decay;
};

// ── HOME FEED (personalized) ──────────────────
router.get('/home', authenticate, async (req, res) => {
  const { cursor, limit = 20 } = req.query;
  const take = Math.min(50, parseInt(limit));

  // Get who user follows
  const following = await prisma.follow.findMany({
    where: { followerId: req.user.id },
    select: { followingId: true }
  });
  const followingIds = following.map(f => f.followingId);

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000); // last 7 days

  const posts = await prisma.post.findMany({
    where: {
      OR: [
        { authorId: { in: followingIds } },
        { authorId: req.user.id }
      ],
      visibility: 'PUBLIC',
      createdAt: { gte: since },
      scheduledFor: null
    },
    orderBy: [{ createdAt: 'desc' }],
    take: take * 3, // fetch more to re-rank
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true, isLive: true }
      },
      _count: { select: { likes: true, comments: true } }
    }
  });

  // Get liked post IDs for this user
  const likedIds = new Set(
    (await prisma.like.findMany({
      where: { userId: req.user.id, postId: { in: posts.map(p => p.id) } },
      select: { postId: true }
    })).map(l => l.postId)
  );

  // Score and sort
  const scored = posts.map(post => {
    const hoursAgo = (Date.now() - post.createdAt.getTime()) / 3600000;
    return { ...post, score: scoreFeedItem(post, hoursAgo), liked: likedIds.has(post.id) };
  });

  scored.sort((a, b) => b.score - a.score);

  res.json({
    posts: scored.slice(0, take),
    hasMore: scored.length > take
  });
});

// ── EXPLORE / DISCOVER (trending + non-followed) ──
router.get('/explore', optionalAuth, async (req, res) => {
  const { page = 1, category, gameTag, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = Math.min(50, parseInt(limit));

  const where = {
    visibility: 'PUBLIC',
    isNSFW: false,
    scheduledFor: null,
    createdAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) }
  };

  if (category) where.type = category.toUpperCase();
  if (gameTag) where.gameTag = gameTag;

  const posts = await prisma.post.findMany({
    where,
    orderBy: [{ likesCount: 'desc' }, { viewsCount: 'desc' }, { createdAt: 'desc' }],
    skip, take,
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true }
      }
    }
  });

  res.json({ posts });
});

// ── REELS FEED (TikTok-style vertical scroll) ─
router.get('/reels', optionalAuth, async (req, res) => {
  const { cursor, limit = 10, gameTag } = req.query;
  const take = Math.min(20, parseInt(limit));

  const where = { visibility: 'PUBLIC' };
  if (gameTag) where.gameTag = gameTag;
  if (cursor) where.createdAt = { lt: new Date(parseInt(cursor)) };

  const reels = await prisma.reel.findMany({
    where,
    orderBy: [{ viewsCount: 'desc' }, { createdAt: 'desc' }],
    take,
    include: {
      author: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true, isLive: true }
      },
      _count: { select: { likes: true, comments: true } }
    }
  });

  const nextCursor = reels.length === take
    ? reels[reels.length - 1].createdAt.getTime().toString()
    : null;

  let likedIds = new Set();
  if (req.user) {
    const liked = await prisma.like.findMany({
      where: { userId: req.user.id, reelId: { in: reels.map(r => r.id) } },
      select: { reelId: true }
    });
    likedIds = new Set(liked.map(l => l.reelId));
  }

  res.json({
    reels: reels.map(r => ({ ...r, liked: likedIds.has(r.id) })),
    nextCursor,
    hasMore: !!nextCursor
  });
});

// ── TRENDING ──────────────────────────────────
router.get('/trending', optionalAuth, async (req, res) => {
  const cacheKey = 'trending:all';
  const cached = await redisGet(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const [topics, posts, creators, games] = await Promise.all([
    prisma.trendingTopic.findMany({
      orderBy: { score: 'desc' }, take: 20
    }),
    prisma.post.findMany({
      where: {
        visibility: 'PUBLIC',
        createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) }
      },
      orderBy: [{ likesCount: 'desc' }, { viewsCount: 'desc' }],
      take: 10,
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } }
      }
    }),
    prisma.user.findMany({
      where: { isCreator: true, status: 'ACTIVE' },
      orderBy: { followersCount: 'desc' },
      take: 8,
      select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true, followersCount: true, isLive: true }
    }),
    prisma.game.findMany({
      orderBy: { viewerCount: 'desc' },
      take: 10,
      select: { id: true, name: true, slug: true, coverUrl: true, genre: true, viewerCount: true, streamCount: true }
    })
  ]);

  const result = { topics, posts, creators, games };
  await redisSet(cacheKey, JSON.stringify(result), { EX: 300 }); // cache 5 min

  res.json(result);
});

// ── STORIES FEED ──────────────────────────────
router.get('/stories', authenticate, async (req, res) => {
  const following = await prisma.follow.findMany({
    where: { followerId: req.user.id },
    select: { followingId: true }
  });
  const followingIds = following.map(f => f.followingId);
  followingIds.push(req.user.id);

  const stories = await prisma.story.groupBy({
    by: ['authorId'],
    where: {
      authorId: { in: followingIds },
      expiresAt: { gte: new Date() }
    }
  });

  const authorIds = stories.map(s => s.authorId);
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true }
  });

  // Check which stories current user has seen
  const viewedStories = await prisma.storyView.findMany({
    where: { viewerId: req.user.id },
    select: { storyId: true }
  });
  const viewedIds = new Set(viewedStories.map(v => v.storyId));

  const storyGroups = await Promise.all(
    authorIds.map(async (authorId) => {
      const authorStories = await prisma.story.findMany({
        where: { authorId, expiresAt: { gte: new Date() } },
        orderBy: { createdAt: 'asc' }
      });
      const hasUnseen = authorStories.some(s => !viewedIds.has(s.id));
      const author = authors.find(a => a.id === authorId);
      return { author, stories: authorStories, hasUnseen };
    })
  );

  storyGroups.sort((a, b) => (b.hasUnseen ? 1 : 0) - (a.hasUnseen ? 1 : 0));
  res.json(storyGroups);
});

// ── LIVE FEED ─────────────────────────────────
router.get('/live', optionalAuth, async (req, res) => {
  const { gameId, limit = 20 } = req.query;

  const where = { status: 'LIVE', visibility: 'PUBLIC' };
  if (gameId) where.gameId = gameId;

  const streams = await prisma.liveStream.findMany({
    where,
    orderBy: { viewerCount: 'desc' },
    take: parseInt(limit),
    include: {
      host: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
      game: { select: { id: true, name: true, coverUrl: true } }
    }
  });

  res.json(streams);
});

module.exports = router;

// ── KIDS FEED ─────────────────────────────────────────────────────────────────
// Safe content only: madeForKids + !isNSFW + contentRating === EVERYONE.
// Filters by the categories the parent enabled (allowedCategories from JWT / query).
router.get('/kids', authenticate, async (req, res) => {
  const {
    categories,   // comma-separated list of allowed category keys (tags)
    cursor,       // last seen post id for pagination
    limit = 20,
  } = req.query;

  const allowedTags = categories
    ? categories.split(',').map(t => t.trim().toUpperCase())
    : null; // null = all kids categories

  // Base safety filter — non-negotiable
  const safetyWhere = {
    madeForKids: true,
    isNSFW: false,
    contentRating: 'EVERYONE',
  };

  // Tag filter only applied when parent restricted categories
  if (allowedTags && allowedTags.length > 0) {
    safetyWhere.tags = { hasSome: allowedTags };
  }

  // Cursor pagination
  const paginationArgs = cursor
    ? { cursor: { id: cursor }, skip: 1 }
    : {};

  try {
    const cacheKey = `kids_feed:${allowedTags ? allowedTags.join(',') : 'all'}:${cursor || 'start'}`;
    const cached = await redisGet(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const [posts, reels] = await Promise.all([
      prisma.post.findMany({
        where: safetyWhere,
        ...paginationArgs,
        take: Math.ceil(parseInt(limit) / 2),
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true, content: true, thumbnailUrl: true,
          mediaUrls: true, tags: true,
          likesCount: true, commentsCount: true, viewsCount: true, createdAt: true,
          author: {
            select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true }
          },
        },
      }),
      prisma.reel.findMany({
        where: safetyWhere,
        ...paginationArgs,
        take: Math.floor(parseInt(limit) / 2),
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true, caption: true, thumbnailUrl: true,
          videoUrl: true, duration: true, tags: true,
          likesCount: true, viewsCount: true, createdAt: true,
          author: {
            select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true }
          },
        },
      }),
    ]);

    // Interleave posts and reels, shape into a unified feed item
    const feedItems = [];
    const maxLen = Math.max(posts.length, reels.length);
    for (let i = 0; i < maxLen; i++) {
      if (posts[i]) {
        const p = posts[i];
        feedItems.push({
          id: p.id,
          type: 'POST',
          title: p.content?.slice(0, 100) || '',
          description: '',
          thumbnailUrl: p.thumbnailUrl || null,
          mediaUrl: (p.mediaUrls && p.mediaUrls[0]) || null,
          duration: null,
          tags: p.tags || [],
          creator: p.author,
          stats: {
            views: p.viewsCount || 0,
            likes: p.likesCount || 0,
            comments: p.commentsCount || 0,
          },
          createdAt: p.createdAt,
        });
      }
      if (reels[i]) {
        const r = reels[i];
        feedItems.push({
          id: r.id,
          type: 'REEL',
          title: r.caption || '',
          description: '',
          thumbnailUrl: r.thumbnailUrl || null,
          mediaUrl: r.videoUrl || null,
          duration: r.duration || null,
          tags: r.tags || [],
          creator: r.author,
          stats: {
            views: r.viewsCount || 0,
            likes: r.likesCount || 0,
            comments: 0,
          },
          createdAt: r.createdAt,
        });
      }
    }

    const result = {
      items: feedItems,
      nextCursor: feedItems.length > 0 ? feedItems[feedItems.length - 1].id : null,
      hasMore: feedItems.length >= parseInt(limit),
    };

    await redisSet(cacheKey, JSON.stringify(result), 120); // 2-min cache
    res.json(result);
  } catch (err) {
    console.error('[kids feed]', err);
    res.status(500).json({ error: 'Failed to load kids feed' });
  }
});


module.exports = router;
