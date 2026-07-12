/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * VENTURE Kids — Web App
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
    },
    headers: {
      'X-Owner':      'DivineDemonGaming Inc.',
      'X-Copyright':  '© 2024 DivineDemonGaming Inc. All Rights Reserved.',
      'X-Product':    'VENTURE Kids',
      'X-Robots-Tag': 'noindex, nofollow',
      // COPPA / child privacy headers
      'Permissions-Policy': 'interest-cohort=()',
      'Referrer-Policy':    'no-referrer',
    },
  },
  build: { outDir: 'dist' },
});
