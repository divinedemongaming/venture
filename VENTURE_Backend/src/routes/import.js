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
const { authenticate } = require('../middleware/auth');
const { redisSet, redisGet } = require('../services/redis');
const logger = require('../utils/logger');
const prisma = new PrismaClient();

const SUPPORTED_PLATFORMS = ['youtube', 'twitter', 'instagram', 'twitch', 'tiktok'];

// ── START IMPORT JOB ──────────────────────────
router.post('/start', authenticate, async (req, res) => {
  const { platform, config = {} } = req.body;
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    return res.status(400).json({ error: `Unsupported platform. Supported: ${SUPPORTED_PLATFORMS.join(', ')}` });
  }

  // Check for active import
  const activeJob = await prisma.importJob.findFirst({
    where: { userId: req.user.id, status: { in: ['pending', 'processing'] } }
  });
  if (activeJob) {
    return res.status(409).json({ error: 'An import is already in progress', jobId: activeJob.id });
  }

  const job = await prisma.importJob.create({
    data: { userId: req.user.id, platform, config: JSON.stringify(config), status: 'pending' }
  });

  // Queue the job (in production, use a real job queue like Bull/BullMQ)
  processImport(job.id, req.user.id, platform, config).catch(err => {
    logger.error('Import job failed:', err);
  });

  res.status(201).json({
    jobId: job.id,
    platform,
    status: 'pending',
    message: `Starting import from ${platform}. This may take a few minutes.`
  });
});

// ── GET JOB STATUS ────────────────────────────
router.get('/status/:jobId', authenticate, async (req, res) => {
  const job = await prisma.importJob.findUnique({ where: { id: req.params.jobId } });
  if (!job) return res.status(404).json({ error: 'Import job not found' });
  if (job.userId !== req.user.id) return res.status(403).json({ error: 'Not authorized' });
  res.json(job);
});

// ── GET ALL JOBS ──────────────────────────────
router.get('/history', authenticate, async (req, res) => {
  const jobs = await prisma.importJob.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  res.json(jobs);
});

// ── IMPORT FOLLOWERS (CSV/JSON upload) ───────
router.post('/followers', authenticate, async (req, res) => {
  const { followers = [], platform } = req.body;
  if (!Array.isArray(followers) || followers.length === 0) {
    return res.status(400).json({ error: 'Followers list required' });
  }
  if (followers.length > 10000) {
    return res.status(400).json({ error: 'Maximum 10,000 followers per import' });
  }
  if (!platform) return res.status(400).json({ error: 'Platform required' });

  // Store the invite list for notification when users join VENTURE
  const pendingInvites = followers.map(f => ({
    inviterId: req.user.id,
    platform,
    externalId: f.id || f.username,
    externalUsername: f.username || f.name,
    email: f.email
  }));

  // Cache for 30 days
  await redisSet(
    `pending_invites:${req.user.id}:${platform}`,
    JSON.stringify(pendingInvites),
    { EX: 30 * 24 * 3600 }
  );

  res.json({
    message: `${followers.length} followers queued. They'll be notified to follow you when they join VENTURE.`,
    count: followers.length
  });
});

// ── IMPORT CONTENT (posts, videos) ───────────
router.post('/content', authenticate, async (req, res) => {
  const { items = [], platform, type } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Content items required' });
  }
  if (items.length > 500) {
    return res.status(400).json({ error: 'Maximum 500 items per import batch' });
  }

  let imported = 0;
  for (const item of items) {
    try {
      if (type === 'post' || type === 'tweet' || type === 'photo') {
        await prisma.post.create({
          data: {
            authorId: req.user.id,
            content: item.text || item.caption || '',
            mediaUrls: item.mediaUrls || [],
            mediaTypes: item.mediaTypes || [],
            type: item.videoUrl ? 'VIDEO' : item.mediaUrls?.length ? 'IMAGE' : 'TEXT',
            tags: item.tags || [],
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date()
          }
        });
        imported++;
      }
    } catch (err) {
      logger.warn(`Failed to import item from ${platform}:`, err.message);
    }
  }

  res.json({
    message: `Imported ${imported} of ${items.length} items from ${platform}`,
    imported, total: items.length
  });
});

// ── PLATFORM CONNECT (OAuth for importing) ───
router.get('/platforms', authenticate, async (req, res) => {
  res.json({
    platforms: [
      { id: 'youtube', name: 'YouTube', icon: 'youtube', supported: ['videos', 'subscribers', 'playlists'] },
      { id: 'twitch', name: 'Twitch', icon: 'twitch', supported: ['followers', 'clips', 'vods'] },
      { id: 'twitter', name: 'Twitter/X', icon: 'twitter', supported: ['tweets', 'followers', 'media'] },
      { id: 'instagram', name: 'Instagram', icon: 'instagram', supported: ['posts', 'reels', 'followers'] },
      { id: 'tiktok', name: 'TikTok', icon: 'tiktok', supported: ['videos', 'followers'] }
    ]
  });
});

// ── Background import processor ───────────────
async function processImport(jobId, userId, platform, config) {
  await prisma.importJob.update({ where: { id: jobId }, data: { status: 'processing', progress: 0 } });

  try {
    // Simulate processing stages
    await new Promise(resolve => setTimeout(resolve, 2000));
    await prisma.importJob.update({ where: { id: jobId }, data: { progress: 25 } });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await prisma.importJob.update({ where: { id: jobId }, data: { progress: 50 } });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await prisma.importJob.update({ where: { id: jobId }, data: { progress: 75 } });
    await new Promise(resolve => setTimeout(resolve, 2000));

    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'complete', progress: 100, completedAt: new Date() }
    });

    logger.info(`Import job ${jobId} completed for user ${userId} from ${platform}`);
  } catch (err) {
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'failed', errorMessage: err.message }
    });
  }
}

module.exports = router;
