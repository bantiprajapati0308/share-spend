import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Automatically install the new SW and reload the page on update.
      registerType: 'autoUpdate',
      // Let the plugin inject the SW registration script into the built HTML.
      injectRegister: 'auto',
      // We manage the manifest file ourselves (public/manifest.json).
      manifest: false,
      workbox: {
        // New SW takes control immediately without waiting for tabs to close.
        skipWaiting: true,
        // New SW claims all open clients so they get fresh assets right away.
        clientsClaim: true,
        // Delete caches left by previous SW versions on activation.
        cleanupOutdatedCaches: true,
        // Precache all static assets produced by the Vite build.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Return index.html for any navigation request (SPA routing).
        navigateFallback: '/index.html',
        // Do not intercept requests to the backend API.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  base: '/',
  build: {
    outDir: 'dist',
    // Default assetsDir:'assets' keeps hashed chunks in dist/assets/
    // so Vercel cache headers can target them precisely.
    sourcemap: true,
  },
  css: {
    modules: {
      include: ['**/*.scss'],
      localsConvention: 'camelCaseOnly',
    },
  },
});
