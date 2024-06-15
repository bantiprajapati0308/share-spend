import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure this is set correctly based on your deployment environment

  // Configure the build output directory
  build: {
    outDir: 'dist', // By default, Vite outputs the built files in the 'dist' directory
    assetsDir: 'assets', // Optional: directory for static assets (like images) within outDir
    sourcemap: true, // Optional: generate source maps for easier debugging
    // You can configure other build options as needed
  },

  // Configure server settings (optional)
  server: {
    port: 3000, // Default port for Vite development server
    open: true, // Whether to open the browser when server starts
    // Other server configurations
  },

  // Configure optimizations (optional)
  optimizeDeps: {
    include: [], // Specify dependencies that should be bundled (if needed)
    exclude: [], // Specify dependencies that should not be bundled
    // Other optimization options
  },

  // Optional: Configure CSS related options
  css: {
    modules: true, // Enable CSS modules for scoped styles
    // Other CSS configurations
  },

  // Optional: Configure TypeScript support (if using TypeScript)
  // plugins: [react(), typescript()]

  // Optional: Configure alias or custom path mappings
  resolve: {
    alias: {
      // Example alias
      '@components': '/src/components',
    },
  },

  // Optional: Configure proxy (if your app needs to proxy API requests during development)
  // proxy: {
  //   '/api': {
  //     target: 'http://localhost:3000',
  //     changeOrigin: true,
  //     rewrite: (path) => path.replace(/^\/api/, ''),
  //   },
  // },
});
