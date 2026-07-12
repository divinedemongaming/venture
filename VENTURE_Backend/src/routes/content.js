/**
 *  VENTURE — Creator Platform
 *  © 2024 DivineDemonGaming Inc. All Rights Reserved.
 *
 *  Owner:    DivineDemonGaming Inc.
 *  Product:  VENTURE Creator Platform
 *  Contact:  legal@divinedemongaming.com
 */
const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

// ─── Get creator's content library ──────────────────────────────────────────
router.get('/library', authenticate, async (req, res) => {
  try {
    const { type = 'all', status = 'all', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const creatorId = req.user.id;

    const wherePost = { authorId: creatorId };
    const whereReel = { authorId: creatorId };

    if (status === 'scheduled') {
      wherePost.scheduledFor = { gt: new Date() };
      wherePost.isPublished = false;
      whereReel.scheduledFor = { gt: new Date() };
      whereReel.isPublished = false;
    } else if (status === 'published') {
      wherePost.isPublished = true;
      whereReel.isPublished = true;
    } else if (status === 'private') {
      wherePost.visibility = 'PRIVATE';
      whereReel.visibility = 'PRIVATE';
    }

    const [posts, reels] = await Promise.all([
      type !== 'reels' ? prisma.post.findMany({
        where: wherePost,
        orderBy: { createdAt: 'desc' },
        skip, take: parseInt(limit),
        select: { id: true, type: true, content: true, mediaUrls: true, thumbnailUrl: true, customThumbnail: true,
          visibility: true, isPublished: true, scheduledFor: true, contentRating: true,
          likesCount: true, commentsCount: true, viewsCount: true, createdAt: true,
          gameTag: true, featuredOnProfile: true, paidUnlockPrice: true }
      }) : [],
      type !== 'posts' ? prisma.reel.findMany({
        where: whereReel,
        orderBy: { createdAt: 'desc' },
        skip, take: parseInt(limit),
        select: { id: true, caption: true, thumbnailUrl: true, customThumbnail: true,
          visibility: true, isPublished: true, scheduledFor: true, contentRating: true,
          likesCount: true, commentsCount: true, viewsCount: true, createdAt: true,
          gameTag: true, featuredOnProfile: true, duration: true }
      }) : [],
    ]);

    const items = [
      ...posts.map(p => ({ ...p, contentType: 'post' })),
      ...reels.map(r => ({ ...r, contentType: 'reel' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ items, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    logger.error('content library error', err);
    res.status(500).json({ error: 'Failed to load content library' });
  }
});

// ─── Get scheduled drops calendar ────────────────────────────────────────────
router.get('/scheduled', authenticate, async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const drops = await prisma.scheduledDrop.findMany({
      where: {
        creatorId: req.user.id,
        scheduledFor: { gte: startDate, lte: endDate },
        status: 'pending',
      },
      orderBy: { scheduledFor: 'asc' },
    });

    // Also get posts/reels with scheduledFor in this range
    const [scheduledPosts, scheduledReels] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: req.user.id, scheduledFor: { gte: startDate, lte: endDate }, isPublished: false },
        select: { id: true, content: true, scheduledFor: true, gameTag: true, dropCountdownMsg: true }
      }),
      prisma.reel.findMany({
        where: { authorId: req.user.id, scheduledFor: { gte: startDate, lte: endDate }, isPublished: false },
        select: { id: true, caption: true, scheduledFor: true, gameTag: true }
      }),
    ]);

    res.json({
      drops,
      scheduledPosts: scheduledPosts.map(p => ({ ...p, contentType: 'post' })),
      scheduledReels: scheduledReels.map(r => ({ ...r, contentType: 'reel' })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load schedule' });
  }
});

// ─── Update post settings after publish ──────────────────────────────────────
router.patch('/posts/:id/settings', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post || post.authorId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const allowed = ['content', 'visibility', 'contentRating', 'commentsMode', 'tipsEnabled',
      'paidUnlockPrice', 'featuredOnProfile', 'allowDuet', 'allowRemix', 'callToAction',
      'customThumbnail', 'tags', 'gameTag', 'dropCountdownMsg', 'isPublished'];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Track edit history
    const editEntry = { editedAt: new Date().toISOString(), fields: Object.keys(updates) };
    const editHistory = Array.isArray(post.editHistory) ? [...post.editHistory, editEntry] : [editEntry];
    updates.editHistory = editHistory;

    const updated = await prisma.post.update({ where: { id }, data: updates });
    res.json({ post: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update post settings' });
  }
});

// ─── Update reel settings ─────────────────────────────────────────────────────
router.patch('/reels/:id/settings', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const reel = await prisma.reel.findUnique({ where: { id } });
    if (!reel || reel.authorId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const allowed = ['caption', 'visibility', 'contentRating', 'commentsMode', 'tipsEnabled',
      'featuredOnProfile', 'allowDuet', 'allowRemix', 'callToAction', 'customThumbnail', 'tags', 'gameTag', 'isPublished'];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updated = await prisma.reel.update({ where: { id }, data: updates });
    res.json({ reel: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update reel settings' });
  }
});

// ─── Schedule a drop ─────────────────────────────────────────────────────────
router.post('/schedule', authenticate, async (req, res) => {
  try {
    const { contentId, contentType, scheduledFor, timezone, title } = req.body;
    if (!contentId || !contentType || !scheduledFor) {
      return res.status(400).json({ error: 'contentId, contentType, scheduledFor required' });
    }

    // Verify ownership
    const model = contentType === 'post' ? prisma.post : contentType === 'reel' ? prisma.reel : prisma.story;
    const item = await model.findUnique({ where: { id: contentId } });
    if (!item || item.authorId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    // Update the content's scheduledFor and mark unpublished
    await model.update({
      where: { id: contentId },
      data: { scheduledFor: new Date(scheduledFor), isPublished: false }
    });

    const drop = await prisma.scheduledDrop.create({
      data: { creatorId: req.user.id, contentId, contentType, scheduledFor: new Date(scheduledFor), timezone: timezone || 'UTC', title, status: 'pending' }
    });

    res.json({ drop });
  } catch (err) {
    res.status(500).json({ error: 'Failed to schedule drop' });
  }
});

// ─── Cancel scheduled drop ────────────────────────────────────────────────────
router.delete('/schedule/:id', authenticate, async (req, res) => {
  try {
    const drop = await prisma.scheduledDrop.findUnique({ where: { id: req.params.id } });
    if (!drop || drop.creatorId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    await prisma.scheduledDrop.update({ where: { id: req.params.id }, data: { status: 'cancelled' } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel scheduled drop' });
  }
});

// ─── Collections ──────────────────────────────────────────────────────────────
router.get('/collections', authenticate, async (req, res) => {
  try {
    const collections = await prisma.collection.findMany({
      where: { creatorId: req.user.id },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ collections });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load collections' });
  }
});

router.post('/collections', authenticate, async (req, res) => {
  try {
    const { title, description, isPublic } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const collection = await prisma.collection.create({
      data: { creatorId: req.user.id, title, description, isPublic: isPublic ?? true }
    });
    res.json({ collection });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create collection' });
  }
});

// ─── Approve/reject pending comments ─────────────────────────────────────────
router.get('/comments/pending', authenticate, async (req, res) => {
  try {
    const pending = await prisma.pendingComment.findMany({
      where: { OR: [
        { post: { authorId: req.user.id } },
        { reel: { authorId: req.user.id } },
      ]},
      include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    res.json({ pending });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load pending comments' });
  }
});

router.post('/comments/pending/:id/approve', authenticate, async (req, res) => {
  try {
    const pending = await prisma.pendingComment.findUnique({ where: { id: req.params.id } });
    if (!pending) return res.status(404).json({ error: 'Not found' });

    // Move to real comments
    await prisma.comment.create({
      data: { authorId: pending.authorId, content: pending.content, postId: pending.postId, reelId: pending.reelId }
    });
    await prisma.pendingComment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve comment' });
  }
});

router.delete('/comments/pending/:id', authenticate, async (req, res) => {
  try {
    await prisma.pendingComment.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject comment' });
  }
});

// ─── Unpublish content (soft delete — keeps in DB) ────────────────────────────
router.patch('/posts/:id/unpublish', authenticate, async (req, res) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post || post.authorId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
    await prisma.post.update({ where: { id: req.params.id }, data: { isPublished: false } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unpublish' });
  }
});

// ── Creator: get ContentID match reports for their content ───────────────────
const { getMatchReport } = require('../services/contentID');

router.get('/matches/:contentId', authenticate, async (req, res) => {
  // Verify the requester owns this content (check post or reel)
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const post = await prisma.post.findFirst({
    where: { id: req.params.contentId, authorId: req.user.id }
  }).catch(() => null);
  const reel = !post ? await prisma.reel.findFirst({
    where: { id: req.params.contentId, authorId: req.user.id }
  }).catch(() => null) : null;

  // Admin can see any; creator can only see their own
  const isAdmin = ['ADMIN', 'STAFF'].includes(req.user?.role);
  if (!post && !reel && !isAdmin) {
    return res.status(403).json({ error: 'Not authorized to view matches for this content.' });
  }

  const matches = await getMatchReport(req.params.contentId);
  res.json({ contentId: req.params.contentId, matches, count: matches.length });
});

module.exports = router;
