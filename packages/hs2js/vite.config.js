import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: resolve(__dirname, 'src', 'index.mjs'),
      name: 'hs2js',
      formats: ['es', 'iife'],
      fileName: (ext) => ({ es: 'index.mjs', iife: 'index.js' })[ext],
    },
    rollupOptions: {
      // external: [...Object.keys(dependencies)],
      plugins: [],
    },
    target: 'esnext',
  },
});
