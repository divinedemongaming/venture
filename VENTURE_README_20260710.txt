VENTURE Creator Platform — Source Code Backup
© 2024 DivineDemonGaming Inc. All Rights Reserved.

Generated: 2026-07-10 03:08

Contents:
  VENTURE_Mobile_20260710.zip   — React Native / Expo mobile app
                                      Run: cd VENTURE_Mobile && npx expo start
                                      Web: npx expo start --web → localhost:8081
                                      Requires: npx expo install react-native-web react-dom @expo/metro-runtime

  VENTURE_Studio_20260710.zip   — Creator dashboard web app (React + Vite)
                                      Run: cd VENTURE_Studio && npm install && npm run dev
                                      URL: localhost:3001

  VENTURE_Kids_20260710.zip     — Standalone kids web app (React + Vite)
                                      Run: cd VENTURE_Kids && npm install && npm run dev
                                      URL: localhost:3002

  VENTURE_Backend_20260710.zip  — Node.js / Express API server
                                      Run: cd VENTURE_Backend && npm install && npm run dev
                                      URL: localhost:4000
                                      First time: npx prisma migrate dev && npx prisma db seed

Startup order:
  1. Backend (required by all three frontends)
  2. Studio, Kids, Mobile — any order

Environment variables needed (create venture/backend/.env):
  DATABASE_URL          PostgreSQL connection string
  JWT_SECRET            Random 64-char string
  REFRESH_TOKEN_SECRET  Random 64-char string
  REDIS_URL             Redis connection string
  KIDS_SESSION_SECRET   Random 32-char string
  STRIPE_SECRET_KEY     From Stripe dashboard
  STRIPE_WEBHOOK_SECRET From Stripe dashboard (webhooks section)
  FRONTEND_URL          e.g. http://localhost:3001
  PORT                  4000

Contact: legal@divinedemongaming.com
