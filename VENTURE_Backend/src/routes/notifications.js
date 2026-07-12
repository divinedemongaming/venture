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
const { paginate, paginatedResponse } = require('../utils/pagination');
const prisma = new PrismaClient();

router.get('/', authenticate, async (req, res) => {
  const { page = 1, limit = 20, unreadOnly = false } = req.query;
  const { skip, take } = paginate(null, page, limit);
  const where = { userId: req.user.id };
  if (unreadOnly === 'true') where.isRead = false;

  const [notifications, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId: req.user.id, isRead: false } })
  ]);

  res.json({ ...paginatedResponse(notifications, total, page, limit), unreadCount });
});

router.post('/read-all', authenticate, async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
  res.json({ message: 'All notifications marked as read' });
});

router.patch('/:id/read', authenticate, async (req, res) => {
  await prisma.notification.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { isRead: true } });
  res.json({ read: true });
});

router.get('/preferences', authenticate, async (req, res) => {
  const prefs = await prisma.notificationPreference.findUnique({ where: { userId: req.user.id } });
  res.json(prefs || {});
});

router.patch('/preferences', authenticate, async (req, res) => {
  const allowed = ['likes','comments','follows','mentions','newSubscriber','tips','liveStart','newPost','achievements','push','email'];
  const updates = {};
  for (const key of allowed) { if (req.body[key] !== undefined) updates[key] = req.body[key]; }
  const prefs = await prisma.notificationPreference.upsert({
    where: { userId: req.user.id },
    create: { userId: req.user.id, ...updates },
    update: updates
  });
  res.json(prefs);
});

module.exports = router;
