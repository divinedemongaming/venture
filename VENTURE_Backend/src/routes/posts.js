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

const POST_INCLUDE = {
  author: {
    select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true, isCreator: true }
  },
  _count: { select: { likes: true, comments: true, bookmarks: true } }
};

// ── CREATE post ───────────────────────────────
router.post('/', authenticate, async (req, res) => {
  const {
    content, mediaUrls = [], mediaTypes = [], type = 'TEXT',
    visibility = 'PUBLIC', tags = [], gameTag, locationTag,
    isNSFW = false, isExclusive = false, tierRequired,
    communityId, scheduledFor
  } = req.body;

  if (!content && mediaUrls.length === 0) {
    return res.status(400).json({ error: 'Post must have content or media' });
  }
  if (content && content.length > 5000) {
    return res.status(400).json({ error: 'Post content too long (max 5000 chars)' });
  }
  if (mediaUrls.length > 10) {
    return res.status(400).json({ error: 'Maximum 10 media items per post' });
  }
  if (tags.length > 20) {
    return res.status(400).json({ error: 'Maximum 20 tags per post' });
  }

  const post = await prisma.post.create({
    data: {
      authorId: req.user.id,
      content, mediaUrls, mediaTypes, type,
      visibility, tags: tags.map(t => t.toLowerCase().replace(/[^a-z0-9]/g, '')),
      gameTag, locationTag, isNSFW, isExclusive,
      tierRequired: isExclusive ? tierRequired : null,
      communityId, scheduledFor: scheduledFor ? new Date(scheduledFor) : null
    },
    include: POST_INCLUDE
  });

  await prisma.user.update({
    where: { id: req.user.id },
    data: { postsCount: { increment: 1 } }
  });

  // Update trending tags
  for (const tag of tags) {
    const cleanTag = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanTag) {
      await prisma.trendingTopic.upsert({
        where: { tag: cleanTag },
        create: { tag: cleanTag, postCount: 1, score: 1 },
        update: { postCount: { increment: 1 }, score: { increment: 1 } }
      });
    }
  }

  res.status(201).json(post);
});

// ── GET single post ───────────────────────────
router.get('/:postId', optionalAuth, async (req, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.postId },
    include: {
      ...POST_INCLUDE,
      community: { select: { id: true, name: true, slug: true, avatarUrl: true } }
    }
  });

  if (!post) return res.status(404).json({ error: 'Post not found' });

  // Check visibility
  if (post.visibility === 'PRIVATE' && post.authorId !== req.user?.id) {
    return res.status(403).json({ error: 'This post is private' });
  }
  if (post.visibility === 'SUBSCRIBERS_ONLY' && req.user) {
    const sub = await prisma.subscription.findFirst({
      where: { subscriberId: req.user.id, creatorId: post.authorId, status: 'active' }
    });
    if (!sub && post.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Subscribers only', isLocked: true });
    }
  }

  // Increment view count
  await prisma.post.update({ where: { id: post.id }, data: { viewsCount: { increment: 1 } } });

  let liked = false, bookmarked = false;
  if (req.user) {
    liked = !!(await prisma.like.findUnique({
      where: { userId_postId: { userId: req.user.id, postId: post.id } }
    }));
    bookmarked = !!(await prisma.bookmark.findUnique({
      where: { userId_postId: { userId: req.user.id, postId: post.id } }
    }));
  }

  res.json({ ...post, liked, bookmarked });
});

// ── DELETE post ───────────────────────────────
router.delete('/:postId', authenticate, async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.postId } });
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.authorId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Not authorized' });
  }

  await prisma.post.delete({ where: { id: post.id } });
  await prisma.user.update({
    where: { id: req.user.id },
    data: { postsCount: { decrement: 1 } }
  });

  res.json({ message: 'Post deleted' });
});

// ── LIKE / UNLIKE ─────────────────────────────
router.post('/:postId/like', authenticate, async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.postId } });
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: req.user.id, postId: post.id } }
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    await prisma.post.update({ where: { id: post.id }, data: { likesCount: { decrement: 1 } } });
    return res.json({ liked: false, likesCount: post.likesCount - 1 });
  }

  await prisma.like.create({ data: { userId: req.user.id, postId: post.id } });
  await prisma.post.update({ where: { id: post.id }, data: { likesCount: { increment: 1 } } });

  // Notify post author
  if (post.authorId !== req.user.id) {
    await prisma.notification.create({
      data: {
        userId: post.authorId, type: 'like',
        title: 'New Like', body: `${req.user.displayName} liked your post`,
        data: JSON.stringify({ postId: post.id })
      }
    });
    notifyUser(post.authorId, 'notification:new', { type: 'like', postId: post.id });
  }

  res.json({ liked: true, likesCount: post.likesCount + 1 });
});

// ── COMMENTS ──────────────────────────────────
router.get('/:postId/comments', optionalAuth, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const { skip, take } = paginate(null, page, limit);

  const [comments, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where: { postId: req.params.postId, parentId: null },
      skip, take,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
        _count: { select: { likes: true, replies: true } }
      }
    }),
    prisma.comment.count({ where: { postId: req.params.postId, parentId: null } })
  ]);

  res.json(paginatedResponse(comments, total, page, limit));
});

router.post('/:postId/comments', authenticate, async (req, res) => {
  const { content, parentId, mediaUrl } = req.body;
  if (!content || content.length < 1) return res.status(400).json({ error: 'Comment cannot be empty' });
  if (content.length > 1000) return res.status(400).json({ error: 'Comment too long (max 1000 chars)' });

  const post = await prisma.post.findUnique({ where: { id: req.params.postId } });
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const comment = await prisma.comment.create({
    data: {
      authorId: req.user.id,
      postId: req.params.postId,
      content, parentId, mediaUrl
    },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } }
    }
  });

  await prisma.post.update({
    where: { id: req.params.postId },
    data: { commentsCount: { increment: 1 } }
  });

  if (parentId) {
    await prisma.comment.update({
      where: { id: parentId }, data: { repliesCount: { increment: 1 } }
    });
  }

  if (post.authorId !== req.user.id) {
    await prisma.notification.create({
      data: {
        userId: post.authorId, type: 'comment',
        title: 'New Comment', body: `${req.user.displayName} commented: "${content.slice(0, 50)}"`,
        data: JSON.stringify({ postId: post.id, commentId: comment.id })
      }
    });
    notifyUser(post.authorId, 'notification:new', { type: 'comment', postId: post.id });
  }

  res.status(201).json(comment);
});

// ── BOOKMARK ──────────────────────────────────
router.post('/:postId/bookmark', authenticate, async (req, res) => {
  const post = await prisma.post.findUnique({ where: { id: req.params.postId } });
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const existing = await prisma.bookmark.findUnique({
    where: { userId_postId: { userId: req.user.id, postId: post.id } }
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    await prisma.post.update({ where: { id: post.id }, data: { bookmarksCount: { decrement: 1 } } });
    return res.json({ bookmarked: false });
  }

  await prisma.bookmark.create({ data: { userId: req.user.id, postId: post.id } });
  await prisma.post.update({ where: { id: post.id }, data: { bookmarksCount: { increment: 1 } } });
  res.json({ bookmarked: true });
});

// ── USER'S POSTS ──────────────────────────────
router.get('/user/:userId', optionalAuth, async (req, res) => {
  const { page = 1, limit = 12, type } = req.query;
  const { skip, take } = paginate(null, page, limit);

  const where = { authorId: req.params.userId, visibility: 'PUBLIC' };
  if (type) where.type = type.toUpperCase();
  if (req.user?.id === req.params.userId) delete where.visibility;

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: POST_INCLUDE }),
    prisma.post.count({ where })
  ]);

  res.json(paginatedResponse(posts, total, page, limit));
});

module.exports = router;
