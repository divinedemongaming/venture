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
require('dotenv').config();
require('express-async-errors');

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { initSocket } = require('./services/socket');
const { connectRedis } = require('./services/redis');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { securityMiddleware } = require('./middleware/security');
const { watermarkMiddleware } = require('./middleware/watermark');
const { kidsPrivacyGuard, kidsSocketBlock } = require('./middleware/kidsPrivacy');

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const postRoutes = require('./routes/posts');
const reelRoutes = require('./routes/reels');
const storyRoutes = require('./routes/stories');
const feedRoutes = require('./routes/feed');
const messageRoutes = require('./routes/messages');
const gamingRoutes = require('./routes/gaming');
const liveRoutes = require('./routes/live');
const monetizationRoutes = require('./routes/monetization');
const communityRoutes = require('./routes/communities');
const notificationRoutes = require('./routes/notifications');
const importRoutes = require('./routes/import');
const searchRoutes = require('./routes/search');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const ownershipRoutes = require('./routes/ownership');
const uploadRoutes = require('./routes/upload');
const webhookRoutes = require('./routes/webhooks');
const contentRoutes = require('./routes/content');

const app = express();
const server = http.createServer(app);

// ── SECURITY HEADERS ──────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'https:'],
      mediaSrc: ["'self'", 'https:'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// ── CORS ──────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:8081').split(',');
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Platform', 'X-Kids-Mode', 'X-Kids-Session', 'DNT', 'Sec-GPC'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
}));

// ── RATE LIMITING ─────────────────────────────
const createLimiter = (max, windowMin = 15) => rateLimit({
  windowMs: windowMin * 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip + ':' + (req.user?.id || 'anon'),
  handler: (req, res) => res.status(429).json({
    error: 'Rate limit exceeded. Please slow down.',
    retryAfter: Math.ceil(windowMin * 60)
  })
});

app.use('/api/', createLimiter(300));
app.use('/api/auth/', createLimiter(15, 15));
app.use('/api/upload/', createLimiter(30, 15));
app.use('/api/admin/', createLimiter(100, 15));

// ── BODY PARSING ──────────────────────────────
app.use(compression());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
// Raw body for Stripe webhooks BEFORE json parsing
app.use('/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── CUSTOM SECURITY MIDDLEWARE ─────────────────
app.use(watermarkMiddleware);
app.use(securityMiddleware);
// ── KIDS PRIVACY GUARD ────────────────────────────────────────
// Zero-profile, zero-contact, zero-track for children's sessions.
// Hard security boundary — must be before ALL route handlers.
app.use(kidsPrivacyGuard);

// ── STATIC FILES ──────────────────────────────
if (process.env.USE_LOCAL_STORAGE === 'true') {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    maxAge: '1d',
    etag: true
  }));
}

// ── HEALTH ────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({

// ── PUBLIC PAGES (Signup, Login) ──────────────
app.use(express.static(path.join(__dirname, '../public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/signup.html')));
app.get('/signup', (req, res) => res.sendFile(path.join(__dirname, '../public/signup.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));

    status: 'healthy',
    platform: 'VENTURE',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── API ROUTES ────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/reels', reelRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/gaming', gamingRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/monetization', monetizationRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/import', importRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/content', contentRoutes);
app.use('/ownership', ownershipRoutes);
app.use('/webhooks', webhookRoutes);

// ── 404 HANDLER ───────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── ERROR HANDLER ─────────────────────────────
app.use(errorHandler);

// ── SOCKET.IO ─────────────────────────────────
const socketServer = initSocket(server);
// Block Kids Mode sessions from Socket.IO — no persistent connection allowed
if (socketServer) socketServer.use(kidsSocketBlock);

// ── START ─────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 3000;

async function start() {
  try {
    await connectRedis();
    logger.info('✅ Redis connected');

    server.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 VENTURE API running on port ${PORT}`);
      logger.info(`🔒 Security: Production-grade`);
      logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});

start();
module.exports = { app, server };
