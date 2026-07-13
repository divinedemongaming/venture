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
const { authenticate, requireAdmin } = require('../middleware/auth');
const { auditLog } = require('../middleware/security');
const { redisSet, redisDel } = require('../services/redis');
const prisma = new PrismaClient();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

router.get('/dashboard', async (req, res) => {
  const [users, posts, creators, activeStreams, reports] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.user.count({ where: { isCreator: true } }),
    prisma.liveStream.count({ where: { status: 'LIVE' } }),
    prisma.report.count({ where: { status: 'pending' } })
  ]);
  res.json({ users, posts, creators, activeStreams, pendingReports: reports });
});

router.get('/users', async (req, res) => {
  const { page = 1, limit = 20, q, status, role } = req.query;
  const where = {};
  if (q) where.OR = [{ username: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }];
  if (status) where.status = status;
  if (role) where.role = role;
  const users = await prisma.user.findMany({
    where, take: Math.min(50, parseInt(limit)), skip: (parseInt(page)-1)*parseInt(limit),
    orderBy: { createdAt: 'desc' },
    select: { id: true, username: true, email: true, displayName: true, status: true, role: true, isCreator: true, isVerified: true, createdAt: true, lastSeen: true }
  });
  res.json(users);
});

router.patch('/users/:userId', auditLog('ADMIN_USER_UPDATE'), async (req, res) => {
  const { status, role, isVerified } = req.body;
  const updates = {};
  if (status) updates.status = status;
  if (role) updates.role = role;
  if (isVerified !== undefined) updates.isVerified = isVerified;
  const user = await prisma.user.update({ where: { id: req.params.userId }, data: updates });
  if (status === 'BANNED') await redisSet(`blocked:ip_bypass:${user.id}`, '1', { EX: 365 * 24 * 3600 });
  res.json({ message: 'User updated', user: { id: user.id, username: user.username, status: user.status } });
});

router.get('/reports', async (req, res) => {
  const reports = await prisma.report.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'desc' }, take: 50,
    include: { reporter: { select: { id: true, username: true } }, reported: { select: { id: true, username: true } } }
  });
  res.json(reports);
});

router.patch('/reports/:reportId', auditLog('ADMIN_REPORT_ACTION'), async (req, res) => {
  const { status, action } = req.body;
  await prisma.report.update({ where: { id: req.params.reportId }, data: { status } });
  res.json({ message: 'Report updated' });
});

router.delete('/content/:type/:id', auditLog('ADMIN_CONTENT_DELETE'), async (req, res) => {
  const { type, id } = req.params;
  if (type === 'post') await prisma.post.delete({ where: { id } });
  else if (type === 'reel') await prisma.reel.delete({ where: { id } });
  else if (type === 'comment') await prisma.comment.delete({ where: { id } });
  else return res.status(400).json({ error: 'Invalid content type' });
  res.json({ message: 'Content deleted' });
});

router.post('/ip-block', auditLog('ADMIN_IP_BLOCK'), async (req, res) => {
  const { ip, duration = 86400, reason } = req.body;
  if (!ip) return res.status(400).json({ error: 'IP required' });
  await redisSet(`blocked:ip:${ip}`, reason || 'manual block', { EX: duration });
  res.json({ message: `IP ${ip} blocked for ${duration} seconds` });
});


// ── ContentID match reports (admin) ──────────────────────────────────────────
router.get('/content-id/matches/:contentId', async (req, res) => {
  const report = await getMatchReport(req.params.contentId);
  res.json({ contentId: req.params.contentId, matches: report, count: report.length });
});

// Manually trigger a ContentID scan for a specific content ID
router.post('/content-id/scan/:contentId', async (req, res) => {
  const { frameHashes = [], audioFPRaw } = req.body;
  const matches = await scanForMatches(req.params.contentId, audioFPRaw || null, frameHashes);
  res.json({ contentId: req.params.contentId, matches, count: matches.length });
});

module.exports = router;
