import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {}]
        ]
      }
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.webp', 'logo.svg'],
      manifest: {
        name: 'Честная Подписка',
        short_name: 'Подписка',
        description: 'Бесплатный ИИ-навигатор для возврата денег за подписки и онлайн-курсы',
        theme_color: '#05050A',
        background_color: '#05050A',
        display: 'standalone',
        start_url: '/?source=pwa',
        id: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/logo.webp',
            sizes: '192x192',
            type: 'image/webp',
            purpose: 'any'
          },
          {
            src: '/logo.webp',
            sizes: '192x192',
            type: 'image/webp',
            purpose: 'maskable'
          },
          {
            src: '/logo.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any'
          },
          {
            src: '/logo.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,webp,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/challenges\.cloudflare\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'turnstile-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 86400 },
            },
          },
        ],
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom', 'zustand'],
          'markdown': ['react-markdown', 'remark-gfm'],
          'docx': ['docx'],
        }
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
  }
});
