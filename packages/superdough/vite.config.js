import { defineConfig } from 'vite';
import { dependencies } from './package.json';
import { resolve } from 'path';
import bundleAudioWorkletPlugin from 'vite-plugin-bundle-audioworklet';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [bundleAudioWorkletPlugin()],
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
