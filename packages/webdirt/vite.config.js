import { defineConfig } from 'vite';
import { dependencies } from './package.json';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: resolve(__dirname, 'index.mjs'),
      formats: ['es', 'cjs'],
      fileName: (ext) => ({ es: 'index.mjs', cjs: 'index.js' }[ext]),
    },
    rollupOptions: {
      external: [...Object.keys(dependencies)],
    },
    target: 'esnext',
  },
});
