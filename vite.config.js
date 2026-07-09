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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('core-js')) return 'vendor-polyfills';
          if (id.includes('firebase')) return 'vendor-firebase';
          if (
            id.includes('react-bootstrap') ||
            id.includes('bootstrap') ||
            id.includes('@restart') ||
            id.includes('@popperjs') ||
            id.includes('dom-helpers') ||
            id.includes('uncontrollable')
          ) return 'vendor-bootstrap';
          if (
            id.includes('react-select') ||
            id.includes('@emotion') ||
            id.includes('stylis') ||
            id.includes('@floating-ui') ||
            id.includes('memoize-one')
          ) return 'vendor-react-select';
          if (id.includes('date-fns') || id.includes('react-datepicker')) return 'vendor-date';
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'vendor-charts';
          if (id.includes('jspdf')) return 'vendor-jspdf';
          if (id.includes('html2canvas')) return 'vendor-html2canvas';
          if (id.includes('dompurify')) return 'vendor-dompurify';
          if (
            id.includes('canvg') ||
            id.includes('svg-pathdata') ||
            id.includes('rgbcolor') ||
            id.includes('fflate') ||
            id.includes('fast-png') ||
            id.includes('iobuffer') ||
            id.includes('pako') ||
            id.includes('stackblur-canvas')
          ) return 'vendor-pdf-deps';
          if (id.includes('xlsx')) return 'vendor-xlsx';
          if (
            id.includes('@reduxjs') ||
            id.includes('react-redux') ||
            id.includes('redux-persist') ||
            id.includes('use-sync-external-store')
          ) return 'vendor-redux';
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },
  css: {
    modules: {
      include: ['**/*.scss'],
      localsConvention: 'camelCaseOnly',
    },
  },
});
