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

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const logger = require('./utils/logger');

const app = express();
const server = http.createServer(app);

// ── SECURITY HEADERS ──────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
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
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining']
}));

// ── BODY PARSING ──────────────────────────────
app.use(compression());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── HOME PAGE ──────────────────────────────────
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>VENTURE - Creator Platform</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #0A0A0F 0%, #1a1a2e 100%);
          color: #fff;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          text-align: center;
        }
        .logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #7C3AED, #06B6D4);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          font-weight: 800;
          margin: 0 auto 30px;
        }
        h1 {
          font-size: 32px;
          margin-bottom: 10px;
        }
        p {
          color: #94A3B8;
          font-size: 16px;
          margin-bottom: 40px;
          line-height: 1.5;
        }
        .links {
          display: flex;
          gap: 15px;
          justify-content: center;
          flex-wrap: wrap;
        }
        a {
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.3s;
          display: inline-block;
        }
        .btn-primary {
          background: linear-gradient(135deg, #7C3AED, #06B6D4);
          color: #fff;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(124, 58, 237, 0.3);
        }
        .btn-secondary {
          border: 2px solid #374151;
          color: #94A3B8;
        }
        .btn-secondary:hover {
          border-color: #7C3AED;
          color: #fff;
        }
        .status {
          margin-top: 50px;
          padding: 20px;
          background: rgba(34, 197, 94, 0.1);
          border-left: 4px solid #22C55E;
          border-radius: 8px;
          text-align: left;
        }
        .status-title {
          color: #22C55E;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .status-text {
          color: #86EFAC;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">V</div>
        <h1>VENTURE</h1>
        <p>Creator Platform for Gaming, Content, & Community</p>
        
        <div class="links">
          <a href="https://venture-studio-production.up.railway.app/signup" class="btn-primary">
            Join as Creator
          </a>
          <a href="https://venture-kids-production.up.railway.app" class="btn-primary">
            Watch on Kids
          </a>
          <a href="/api/auth/register" class="btn-secondary">
            API Register
          </a>
        </div>

        <div class="status">
          <div class="status-title">✓ System Online</div>
          <div class="status-text">Backend API is running and accepting connections</div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// ── HEALTH ────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'VENTURE',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── AUTH API (MINIMAL) ─────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { username, email, password, displayName } = req.body;
  
  // Minimal validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }
  
  // TODO: Connect to database when available
  // For now, just return success to unblock frontend
  res.status(201).json({
    success: true,
    message: 'Account creation queued - database integration coming soon',
    user: {
      id: 'temp-' + Date.now(),
      username: username.toLowerCase(),
      email,
      displayName
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  // TODO: Connect to database when available
  res.status(200).json({
    success: true,
    message: 'Login coming soon - database integration in progress',
    token: 'temp-token-' + Date.now()
  });
});

// ── 404 ───────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// ── ERROR HANDLER ─────────────────────────────
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── START ─────────────────────────────────────
const PORT = parseInt(process.env.PORT) || 3000;

try {
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 VENTURE API running on port ${PORT}`);
    logger.info(`📡 Minimal mode - full database features coming soon`);
  });
} catch (err) {
  logger.error('Failed to start server', err);
  process.exit(1);
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

module.exports = { app, server };

