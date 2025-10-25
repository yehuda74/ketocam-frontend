import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'KetoCam AI',
        short_name: 'KetoCam',
        description: 'Snap a meal photo and get instant keto analysis.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0b1020',
        theme_color: '#0b1020',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },

      // ✅ Fix B: no "self" usage — safe for TypeScript
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // app shell / same-origin files
            urlPattern: ({ sameOrigin }) => sameOrigin,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'app-shell' },
          },
          {
            // cache external API (your ngrok/n8n endpoint)
            urlPattern: ({ url }) =>
              url.origin.includes('ngrok-free.dev') ||
              url.origin.includes('vercel.app') ||
              url.origin.includes('netlify.app'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
});