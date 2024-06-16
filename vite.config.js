import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/share-spend/', // Ensure this is set correctly based on your deployment environment

  // Configure the build output directory
  build: {
    outDir: 'dist', // Specify the output directory for built files
    assetsDir: '', // Specify the assets directory (if needed)
    sourcemap: true, // Generate source maps for debugging
    // You can add other build options as needed
  },



});
