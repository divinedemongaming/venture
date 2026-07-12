/*
 * © 2024 DivineDemonGaming Inc. All Rights Reserved.
 * Owner: DivineDemonGaming Inc. | Product: VENTURE Creator Platform
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
    /* Ownership + security HTTP headers in dev */
    headers: {
      'X-Owner':      'DivineDemonGaming Inc.',
      'X-Copyright':  '© 2024 DivineDemonGaming Inc. All Rights Reserved.',
      'X-Product':    'VENTURE Creator Platform',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  },

  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        /* Copyright banner on every generated JS chunk */
        banner: `/* © 2024 DivineDemonGaming Inc. All Rights Reserved. | VENTURE Creator Platform */`,

        /* Code-split heavy dependencies into separate chunks */
        manualChunks: {
          'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts':   ['recharts'],
          'vendor-ui':       ['lucide-react'],
          'vendor-state':    ['zustand', 'axios', 'socket.io-client'],
          'vendor-dnd':      ['@hello-pangea/dnd'],
        },
      },
    },
  },
});
