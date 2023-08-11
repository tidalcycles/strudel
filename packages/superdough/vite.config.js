import { defineConfig } from 'vite';
import { dependencies } from './package.json';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [],
  build: {
    lib: {
      entry: resolve(__dirname, 'superdough.mjs'),
      formats: ['es', 'cjs'],
      fileName: (ext) => ({ es: 'superdough.mjs', cjs: 'superdough.cjs' }[ext]),
    },
    rollupOptions: {
      external: [...Object.keys(dependencies)],
    },
    target: 'esnext',
  },
});
