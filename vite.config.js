import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Use relative paths for assets
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
