import { defineConfig } from 'vite';
import { dependencies } from './package.json';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: resolve(__dirname, 'osc.mjs'),
      formats: ['es'],
      fileName: (ext) => ({ es: 'index.mjs' })[ext],
    },
    rollupOptions: {
      external: [...Object.keys(dependencies)],
    },
    target: 'esnext',
  },
});
