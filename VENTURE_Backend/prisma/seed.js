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
/**
 * VENTURE — Database Seed
 * Populates initial game catalog, admin account, and demo data
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const GAMES = [
  { name: 'Fortnite', slug: 'fortnite', genre: ['Battle Royale', 'Shooter'], platform: ['PC', 'PS5', 'Xbox', 'Mobile'], developer: 'Epic Games', isPopular: true },
  { name: 'Minecraft', slug: 'minecraft', genre: ['Sandbox', 'Survival'], platform: ['PC', 'PS5', 'Xbox', 'Switch', 'Mobile'], developer: 'Mojang', isPopular: true },
  { name: 'Call of Duty: Warzone', slug: 'warzone', genre: ['Battle Royale', 'FPS'], platform: ['PC', 'PS5', 'Xbox'], developer: 'Activision', isPopular: true },
  { name: 'Valorant', slug: 'valorant', genre: ['FPS', 'Tactical'], platform: ['PC'], developer: 'Riot Games', isPopular: true },
  { name: 'League of Legends', slug: 'league-of-legends', genre: ['MOBA'], platform: ['PC'], developer: 'Riot Games', isPopular: true },
  { name: 'Apex Legends', slug: 'apex-legends', genre: ['Battle Royale', 'FPS'], platform: ['PC', 'PS5', 'Xbox', 'Switch'], developer: 'Respawn Entertainment', isPopular: true },
  { name: 'GTA V', slug: 'gta-v', genre: ['Action', 'Open World'], platform: ['PC', 'PS5', 'Xbox'], developer: 'Rockstar Games', isPopular: true },
  { name: 'Elden Ring', slug: 'elden-ring', genre: ['RPG', 'Action'], platform: ['PC', 'PS5', 'Xbox'], developer: 'FromSoftware', isPopular: true },
  { name: 'FIFA 24', slug: 'fifa-24', genre: ['Sports'], platform: ['PC', 'PS5', 'Xbox', 'Switch'], developer: 'EA Sports', isPopular: true },
  { name: 'Rocket League', slug: 'rocket-league', genre: ['Sports', 'Racing'], platform: ['PC', 'PS5', 'Xbox', 'Switch'], developer: 'Psyonix', isPopular: true },
  { name: 'Among Us', slug: 'among-us', genre: ['Party', 'Social Deduction'], platform: ['PC', 'Mobile', 'Switch'], developer: 'Innersloth', isPopular: false },
  { name: 'Overwatch 2', slug: 'overwatch-2', genre: ['FPS', 'Hero Shooter'], platform: ['PC', 'PS5', 'Xbox', 'Switch'], developer: 'Blizzard', isPopular: true },
  { name: 'Diablo IV', slug: 'diablo-4', genre: ['RPG', 'Action'], platform: ['PC', 'PS5', 'Xbox'], developer: 'Blizzard', isPopular: true },
  { name: 'Baldur\'s Gate 3', slug: 'baldurs-gate-3', genre: ['RPG', 'Turn-based'], platform: ['PC', 'PS5'], developer: 'Larian Studios', isPopular: true },
  { name: 'Counter-Strike 2', slug: 'cs2', genre: ['FPS', 'Tactical'], platform: ['PC'], developer: 'Valve', isPopular: true },
  { name: 'Cyberpunk 2077', slug: 'cyberpunk-2077', genre: ['RPG', 'Action', 'Open World'], platform: ['PC', 'PS5', 'Xbox'], developer: 'CD Projekt Red', isPopular: true },
  { name: 'Hogwarts Legacy', slug: 'hogwarts-legacy', genre: ['RPG', 'Action'], platform: ['PC', 'PS5', 'Xbox', 'Switch'], developer: 'Avalanche Software', isPopular: false },
  { name: 'Starfield', slug: 'starfield', genre: ['RPG', 'Open World', 'Sci-Fi'], platform: ['PC', 'Xbox'], developer: 'Bethesda', isPopular: false },
  { name: 'The Last of Us Part I', slug: 'last-of-us-part-1', genre: ['Action', 'Survival'], platform: ['PC', 'PS5'], developer: 'Naughty Dog', isPopular: false },
  { name: 'Street Fighter 6', slug: 'street-fighter-6', genre: ['Fighting'], platform: ['PC', 'PS5', 'Xbox'], developer: 'Capcom', isPopular: false },
];

const TRENDING_TOPICS = [
  { tag: 'gaming', postCount: 15420 }, { tag: 'streamer', postCount: 8900 },
  { tag: 'fortnite', postCount: 7200 }, { tag: 'fps', postCount: 6100 },
  { tag: 'rpg', postCount: 5800 }, { tag: 'esports', postCount: 4900 },
  { tag: 'twitch', postCount: 4200 }, { tag: 'speedrun', postCount: 3800 },
  { tag: 'montage', postCount: 3200 }, { tag: 'cosplay', postCount: 2900 },
];

async function main() {
  console.log('🌱 Seeding VENTURE database...');

  // ── Admin account ──────────────────────────────
  const adminHash = await bcrypt.hash('VentureAdmin#2024!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@venture.gg' },
    update: {},
    create: {
      username: 'venture_admin',
      email: 'admin@venture.gg',
      displayName: 'VENTURE Admin',
      passwordHash: adminHash,
      role: 'ADMIN',
      accountType: 'ADMIN',
      isVerified: true,
      bio: 'Official VENTURE platform account',
      notifPrefs: { create: {} },
      gamerProfile: { create: {} },
    }
  });
  console.log('✅ Admin account:', admin.email);

  // ── Game catalog ───────────────────────────────
  let gamesCreated = 0;
  for (const game of GAMES) {
    await prisma.game.upsert({
      where: { slug: game.slug },
      update: { isPopular: game.isPopular },
      create: {
        ...game,
        description: `${game.name} — a popular ${game.genre[0]} game by ${game.developer}`,
        viewerCount: Math.floor(Math.random() * 50000),
        clipCount: Math.floor(Math.random() * 1000),
        streamCount: Math.floor(Math.random() * 200),
      }
    });
    gamesCreated++;
  }
  console.log(`✅ Games: ${gamesCreated} seeded`);

  // ── Trending topics ────────────────────────────
  for (const topic of TRENDING_TOPICS) {
    await prisma.trendingTopic.upsert({
      where: { tag: topic.tag },
      update: { postCount: topic.postCount, score: topic.postCount * 0.1 },
      create: { tag: topic.tag, postCount: topic.postCount, score: topic.postCount * 0.1 }
    });
  }
  console.log('✅ Trending topics seeded');

  // ── Demo creator account ───────────────────────
  const creatorHash = await bcrypt.hash('Creator#2024!', 12);
  const creator = await prisma.user.upsert({
    where: { email: 'demo_creator@venture.gg' },
    update: {},
    create: {
      username: 'venture_creator',
      email: 'demo_creator@venture.gg',
      displayName: 'VENTURE Creator',
      passwordHash: creatorHash,
      isCreator: true,
      isVerified: true,
      accountType: 'CREATOR',
      bio: 'Official VENTURE demo creator account. Follow to see platform features in action!',
      followersCount: 1000,
      notifPrefs: { create: {} },
      gamerProfile: { create: { level: 25, xp: 12500, rank: 'Diamond', platforms: ['PC', 'PS5'] } },
      creatorProfile: {
        create: {
          isMonetized: true,
          tagline: 'Building the future of gaming content',
          totalEarned: 5420.50,
          subscriptionTiers: {
            create: [
              { name: 'Fan', price: 4.99, description: 'Support the channel!', perks: ['Exclusive posts', 'Discord access'], color: '#7C3AED', sortOrder: 0 },
              { name: 'Super Fan', price: 9.99, description: 'Get more perks!', perks: ['Everything in Fan', 'Monthly Q&A', 'Behind the scenes'], color: '#F59E0B', sortOrder: 1 },
              { name: 'VIP', price: 24.99, description: 'VIP treatment!', perks: ['Everything above', '1-on-1 gaming session', 'Name in credits'], color: '#06B6D4', sortOrder: 2 },
            ]
          }
        }
      }
    }
  });
  console.log('✅ Demo creator:', creator.username);

  // ── Chat rooms ────────────────────────────────
  const { seedChatRooms } = require('../src/services/chatRooms');
  const chatCount = await seedChatRooms();
  console.log(`✅ Chat rooms: ${chatCount} total`);

  console.log('\n🚀 VENTURE seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin login:   admin@venture.gg / VentureAdmin#2024!');
  console.log('Creator login: demo_creator@venture.gg / Creator#2024!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
