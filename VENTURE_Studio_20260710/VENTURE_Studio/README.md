# VENTURE Studio

> © 2024 DivineDemonGaming Inc. All Rights Reserved.  
> Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform

A full YouTube Studio-style creator dashboard combined with an OBS-style live streaming studio, built in React + Vite.

---

## Quick Start

```bash
cd venture/studio

# Install dependencies (first time only)
bun install          # or: npm install

# Launch dev server on port 3001
bun run dev          # or: npm run dev
```

Open **http://localhost:3001** — click **Dev Mode (skip auth)** to enter without a backend.

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/dashboard` | Dashboard | Stats, views chart, top content, quick actions |
| `/upload` | Upload | Drag-and-drop video/image upload with metadata form |
| `/library` | Content Library | List/grid view, status filters, bulk actions |
| `/analytics` | Analytics | Views, revenue, traffic sources, content performance |
| `/monetize` | Monetization | Revenue overview, transactions, subscription tiers, payouts |
| `/comments` | Comments | Review queue, approve/reject/flag, bulk moderation |
| `/scheduler` | Scheduler | Monthly calendar with scheduled content drops |
| `/stream` | **Stream Studio** | OBS-style: scenes, sources, live WebRTC preview, live chat |
| `/settings` | Settings | Channel profile, stream key, notifications, security |

---

## Architecture

```
src/
├── App.jsx                    # Router + auth guard + layout wrapper
├── theme.js                   # Design tokens (C.*) + NAV_ITEMS
├── main.jsx                   # Entry point + console watermark
├── index.css                  # Global styles + animations
├── components/
│   └── layout/
│       ├── Sidebar.jsx        # Collapsible nav, LIVE badge, mobile switcher
│       └── TopBar.jsx         # Search, notifications, live status bar
├── pages/                     # One file per route (see table above)
├── store/
│   ├── authStore.js           # Zustand: login, logout, checkAuth, mock dev mode
│   └── streamStore.js         # Zustand: isLive, scenes, sources, chat, streams
├── services/
│   ├── api.js                 # Axios instance with auth interceptor + 401 redirect
│   └── socket.js              # Socket.io client (connect/disconnect helpers)
└── utils/
    └── ownership.js           # Ownership certificate + verifyOwnership()
```

---

## Auth

- **With backend:** sign in with email/password → JWT stored in `localStorage`
- **Dev mode:** click "Dev Mode (skip auth)" on the login screen → mock user seeded, persists across reloads

---

## Stream Studio

The `/stream` page is a full OBS-style studio:

- **Left panel:** Scenes (switch scenes) + Sources (toggle visibility/mute)
- **Center:** Live WebRTC preview via `getUserMedia` / `getDisplayMedia`, Go Live / End Stream controls
- **Right panel:** Live chat (auto-populates mock messages while live), stream key display

Go Live flow:
1. Click **Start Camera** → browser prompts for camera/mic access
2. Optionally click **Share Screen** for desktop capture
3. Click **Go Live** → timer starts, viewer counter and chat activate
4. Click **End Stream** → confirm prompt → all media tracks stopped

---

## App Switcher

- **Studio → Mobile:** Sidebar footer and Settings page both link `venture://` (opens mobile app if installed)
- **Mobile → Studio:** CreatorDashboard header "Studio" button opens `http://localhost:3001` (dev) or `https://studio.venture.app` (prod)

---

## Build for Production

```bash
bun run build       # outputs to dist/
bun run preview     # preview the production build locally
```

---

## Protection

All IP protection is documented in [LEGAL.md](./LEGAL.md).  
Verification: open browser DevTools console and run `window.__VENTURE_OWNERSHIP__`
