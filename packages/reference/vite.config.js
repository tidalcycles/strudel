import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: resolve(__dirname, 'index.mjs'),
      formats: ['es'],
      fileName: (ext) => ({ es: 'index.mjs' })[ext],
    },
    target: 'esnext',
  },
});
