import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';

const enablePWA = process.env.PWA !== 'false'; // control via env var

export default defineConfig({
  plugins: [
    react(),
    ...(enablePWA
      ? [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icons/*.png', 'robots.txt'],
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
                { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
              ],
            },
            workbox: {
              globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
              navigateFallback: '/index.html',
              runtimeCaching: [
                // app shell / same-origin files
                {
                  urlPattern: ({ sameOrigin }) => sameOrigin,
                  handler: 'StaleWhileRevalidate',
                  options: { cacheName: 'app-shell' },
                },
              ],
            },
          }),
        ]
      : []),
  ],
});