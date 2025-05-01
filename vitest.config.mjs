import { defineConfig } from 'vitest/config';
import bundleAudioWorkletPlugin from 'vite-plugin-bundle-audioworklet';

/// <reference types="vitest" />
export default defineConfig({
  plugins: [bundleAudioWorkletPlugin()],
  test: {
    reporters: 'verbose',
    isolate: false,
    silent: true,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress}.config.*',
      '**/shared.test.mjs',
    ],
  },
});
