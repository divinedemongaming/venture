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
const { redisGet, redisSet } = require('../services/redis');
const prisma = new PrismaClient();

// ── GAME CATALOG ──────────────────────────────
router.get('/games', async (req, res) => {
  const { q, genre, platform, page = 1, limit = 20 } = req.query;
  const { skip, take } = paginate(null, page, limit);

  const where = {};
  if (q) where.name = { contains: q, mode: 'insensitive' };
  if (genre) where.genre = { has: genre };
  if (platform) where.platform = { has: platform };

  const [games, total] = await prisma.$transaction([
    prisma.game.findMany({
      where, skip, take,
      orderBy: [{ isPopular: 'desc' }, { viewerCount: 'desc' }]
    }),
    prisma.game.count({ where })
  ]);

  res.json(paginatedResponse(games, total, page, limit));
});

router.get('/games/trending', async (req, res) => {
  const cached = await redisGet('games:trending');
  if (cached) return res.json(JSON.parse(cached));

  const games = await prisma.game.findMany({
    orderBy: [{ streamCount: 'desc' }, { viewerCount: 'desc' }],
    take: 20
  });

  await redisSet('games:trending', JSON.stringify(games), { EX: 300 });
  res.json(games);
});

router.get('/games/:slug', optionalAuth, async (req, res) => {
  const game = await prisma.game.findUnique({
    where: { slug: req.params.slug },
    include: {
      _count: { select: { clips: true, lives: true, libraryEntries: true } }
    }
  });
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const liveStreams = await prisma.liveStream.findMany({
    where: { gameId: game.id, status: 'LIVE' },
    orderBy: { viewerCount: 'desc' },
    take: 6,
    include: { host: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } } }
  });

  const clips = await prisma.gameClip.findMany({
    where: { gameId: game.id, visibility: 'PUBLIC' },
    orderBy: { viewsCount: 'desc' },
    take: 12,
    include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }
  });

  res.json({ game, liveStreams, clips });
});

// ── CLIPS ─────────────────────────────────────
router.post('/clips', authenticate, async (req, res) => {
  const { gameId, videoUrl, thumbnailUrl, title, description, tags = [], visibility = 'PUBLIC', duration } = req.body;

  if (!gameId || !videoUrl || !title) {
    return res.status(400).json({ error: 'Game, video URL, and title are required' });
  }

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const clip = await prisma.gameClip.create({
    data: {
      authorId: req.user.id, gameId, videoUrl, thumbnailUrl,
      title, description, tags, visibility, duration: duration || 0
    },
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      game: { select: { id: true, name: true, coverUrl: true } }
    }
  });

  await prisma.game.update({ where: { id: gameId }, data: { clipCount: { increment: 1 } } });

  res.status(201).json(clip);
});

router.get('/clips', optionalAuth, async (req, res) => {
  const { gameId, userId, page = 1, limit = 20, sort = 'trending' } = req.query;
  const { skip, take } = paginate(null, page, limit);

  const where = { visibility: 'PUBLIC' };
  if (gameId) where.gameId = gameId;
  if (userId) where.authorId = userId;

  const orderBy = sort === 'new' ? { createdAt: 'desc' } :
                  sort === 'top' ? { likesCount: 'desc' } :
                  { viewsCount: 'desc' };

  const [clips, total] = await prisma.$transaction([
    prisma.gameClip.findMany({
      where, skip, take, orderBy,
      include: {
        author: { select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true } },
        game: { select: { id: true, name: true, slug: true, coverUrl: true } }
      }
    }),
    prisma.gameClip.count({ where })
  ]);

  res.json(paginatedResponse(clips, total, page, limit));
});

router.post('/clips/:clipId/like', authenticate, async (req, res) => {
  const clip = await prisma.gameClip.findUnique({ where: { id: req.params.clipId } });
  if (!clip) return res.status(404).json({ error: 'Clip not found' });

  const existing = await prisma.like.findUnique({
    where: { userId_clipId: { userId: req.user.id, clipId: clip.id } }
  });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    await prisma.gameClip.update({ where: { id: clip.id }, data: { likesCount: { decrement: 1 } } });
    return res.json({ liked: false });
  }

  await prisma.like.create({ data: { userId: req.user.id, clipId: clip.id } });
  await prisma.gameClip.update({ where: { id: clip.id }, data: { likesCount: { increment: 1 } } });
  res.json({ liked: true });
});

// ── GAMER PROFILE ────────────────────────────
router.get('/profile/:userId', optionalAuth, async (req, res) => {
  const profile = await prisma.gamerProfile.findUnique({
    where: { userId: req.params.userId },
    include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } }
  });
  if (!profile) return res.status(404).json({ error: 'Gamer profile not found' });

  const library = await prisma.gameLibraryEntry.findMany({
    where: { userId: req.params.userId },
    include: { game: true },
    orderBy: { addedAt: 'desc' },
    take: 20
  });

  const achievements = await prisma.userAchievement.findMany({
    where: { userId: req.params.userId },
    include: { achievement: { include: { game: { select: { name: true, coverUrl: true } } } } },
    orderBy: { earnedAt: 'desc' },
    take: 12
  });

  res.json({ profile, library, achievements });
});

router.patch('/profile', authenticate, async (req, res) => {
  const allowed = ['gamerTag', 'platforms', 'favoriteGames', 'steamId', 'psnId', 'xboxGamertag', 'riotId', 'battleNetTag', 'epicId'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const profile = await prisma.gamerProfile.upsert({
    where: { userId: req.user.id },
    update: updates,
    create: { userId: req.user.id, ...updates }
  });

  res.json(profile);
});

// ── GAME LIBRARY ─────────────────────────────
router.post('/library', authenticate, async (req, res) => {
  const { gameId, status = 'playing', hoursPlayed, rating, review } = req.body;
  if (!gameId) return res.status(400).json({ error: 'Game ID required' });

  const entry = await prisma.gameLibraryEntry.upsert({
    where: { userId_gameId: { userId: req.user.id, gameId } },
    create: { userId: req.user.id, gameId, status, hoursPlayed, rating, review },
    update: { status, hoursPlayed, rating, review },
    include: { game: true }
  });

  res.json(entry);
});

// ── TOURNAMENTS ───────────────────────────────
router.get('/tournaments', async (req, res) => {
  const { gameId, status = 'open' } = req.query;
  const where = { status };
  if (gameId) where.gameId = gameId;

  const tournaments = await prisma.tournament.findMany({
    where,
    orderBy: { startsAt: 'asc' },
    take: 20
  });

  res.json(tournaments);
});

router.post('/tournaments/:id/enter', authenticate, async (req, res) => {
  const { teamName } = req.body;
  const tournament = await prisma.tournament.findUnique({ where: { id: req.params.id } });
  if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
  if (tournament.status !== 'open') return res.status(400).json({ error: 'Registration closed' });

  const entriesCount = await prisma.tournamentEntry.count({ where: { tournamentId: tournament.id } });
  if (entriesCount >= tournament.maxEntrants) {
    return res.status(400).json({ error: 'Tournament is full' });
  }

  const entry = await prisma.tournamentEntry.upsert({
    where: { tournamentId_userId: { tournamentId: tournament.id, userId: req.user.id } },
    create: { tournamentId: tournament.id, userId: req.user.id, teamName },
    update: { teamName }
  });

  res.json(entry);
});

// ── LEADERBOARD ───────────────────────────────
router.get('/leaderboard', async (req, res) => {
  const cached = await redisGet('leaderboard:top');
  if (cached) return res.json(JSON.parse(cached));

  const top = await prisma.gamerProfile.findMany({
    orderBy: [{ level: 'desc' }, { xp: 'desc' }],
    take: 100,
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true, isVerified: true }
      }
    }
  });

  await redisSet('leaderboard:top', JSON.stringify(top), { EX: 600 });
  res.json(top);
});

module.exports = router;
