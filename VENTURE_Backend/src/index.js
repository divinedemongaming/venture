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
          <a href="/signup" class="btn-primary">
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

// ── SIGNUP PAGE ────────────────────────────────
app.get('/signup', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Sign Up - VENTURE</title>
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
          max-width: 500px;
          width: 100%;
        }
        .card {
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(124, 58, 237, 0.2);
          border-radius: 16px;
          padding: 40px;
        }
        .logo {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #7C3AED, #06B6D4);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 800;
          margin: 0 auto 24px;
        }
        h1 {
          font-size: 24px;
          text-align: center;
          margin-bottom: 8px;
        }
        .subtitle {
          text-align: center;
          color: #94A3B8;
          margin-bottom: 32px;
          font-size: 14px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          font-size: 14px;
          color: #E2E8F0;
        }
        input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #374151;
          border-radius: 8px;
          background: rgba(15, 23, 42, 0.8);
          color: #fff;
          font-size: 14px;
          transition: all 0.3s;
        }
        input:focus {
          outline: none;
          border-color: #7C3AED;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }
        .password-requirements {
          font-size: 12px;
          color: #94A3B8;
          margin-top: 8px;
          line-height: 1.6;
        }
        button {
          width: 100%;
          padding: 12px;
          margin-top: 24px;
          background: linear-gradient(135deg, #7C3AED, #06B6D4);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
        }
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(124, 58, 237, 0.3);
        }
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
        .link {
          text-align: center;
          margin-top: 20px;
          color: #94A3B8;
          font-size: 14px;
        }
        .link a {
          color: #7C3AED;
          text-decoration: none;
          font-weight: 600;
        }
        .link a:hover {
          text-decoration: underline;
        }
        .error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid #EF4444;
          color: #FECACA;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          display: none;
        }
        .success {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid #22C55E;
          color: #86EFAC;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <div class="logo">V</div>
          <h1>Create Account</h1>
          <p class="subtitle">Join VENTURE and start creating</p>
          
          <div id="error" class="error"></div>
          <div id="success" class="success"></div>
          
          <form id="signupForm">
            <div class="form-group">
              <label for="displayName">Display Name</label>
              <input type="text" id="displayName" name="displayName" placeholder="John Creator" required>
            </div>
            
            <div class="form-group">
              <label for="username">Username</label>
              <input type="text" id="username" name="username" placeholder="johncreator" required pattern="[a-zA-Z0-9_]+" title="Letters, numbers, and underscores only">
            </div>
            
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" placeholder="you@example.com" required>
            </div>
            
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" placeholder="••••••••" required minlength="8">
              <div class="password-requirements">
                • At least 8 characters<br>
                • 1 uppercase letter<br>
                • 1 lowercase letter<br>
                • 1 number<br>
                • 1 special character (@\$!%*?&_#)
              </div>
            </div>
            
            <button type="submit">Sign Up</button>
          </form>
          
          <div class="link">
            Already have an account? <a href="/">Back to Home</a>
          </div>
        </div>
      </div>
      
      <script>
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const displayName = document.getElementById('displayName').value;
          const username = document.getElementById('username').value;
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          
          const errorDiv = document.getElementById('error');
          const successDiv = document.getElementById('success');
          const button = e.target.querySelector('button');
          
          errorDiv.style.display = 'none';
          successDiv.style.display = 'none';
          button.disabled = true;
          button.textContent = 'Creating Account...';
          
          try {
            const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ displayName, username, email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.error || data.errors?.[0]?.msg || 'Sign up failed');
            }
            
            successDiv.textContent = '✓ Account created! Welcome to VENTURE.';
            successDiv.style.display = 'block';
            document.getElementById('signupForm').reset();
            
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          } catch (err) {
            errorDiv.textContent = '✗ ' + err.message;
            errorDiv.style.display = 'block';
          } finally {
            button.disabled = false;
            button.textContent = 'Sign Up';
          }
        });
      </script>
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

