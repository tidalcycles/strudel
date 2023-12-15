import { defineConfig } from 'vite';
import { dependencies } from './package.json';
import { resolve } from 'path';
// import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: resolve(__dirname, 'index.mjs'),
      name: 'strudel',
      formats: ['es', 'iife'],
      fileName: (ext) => ({ es: 'index.mjs', iife: 'index.js' }[ext]),
    },
    rollupOptions: {
      // external: [...Object.keys(dependencies)],
    },
    target: 'esnext',
  },
});
