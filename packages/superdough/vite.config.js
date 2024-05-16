import { defineConfig } from 'vite';
import { dependencies } from './package.json';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: resolve(__dirname, 'index.mjs'),
      formats: ['es'],
      fileName: (ext) => ({ es: 'index.mjs', cjs: 'index.cjs' })[ext],
    },
    rollupOptions: {
      external: [...Object.keys(dependencies)],
    },
    target: 'esnext',
  },
});
