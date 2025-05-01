import { defineConfig } from 'vite';
import { dependencies } from './package.json';
import { resolve } from 'path';
import replace from '@rollup/plugin-replace';
import bundleAudioWorkletPlugin from 'vite-plugin-bundle-audioworklet';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [bundleAudioWorkletPlugin()],
  build: {
    lib: {
      entry: resolve(__dirname, 'web.mjs'),
      name: 'strudel',
      formats: ['es', 'iife'],
      fileName: (ext) => ({ es: 'index.mjs', iife: 'index.js' })[ext],
    },
    rollupOptions: {
      // external: [...Object.keys(dependencies)],
      plugins: [
        replace({
          'process.env.NODE_ENV': JSON.stringify('production'),
          preventAssignment: true,
        }),
      ],
    },
    target: 'esnext',
  },
});
