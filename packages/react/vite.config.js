import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { peerDependencies, dependencies } from './package.json';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src', 'index.js'),
      formats: ['es', 'cjs'],
      fileName: (ext) => `index.${ext}.js`,
      // for UMD name: 'GlobalName'
    },
    rollupOptions: {
      external: [
        ...Object.keys(peerDependencies),
        ...Object.keys(dependencies),
        // TODO: find out which of below names are obsolete now
        '@strudel.cycles/tone',
        '@strudel.cycles/eval',
        '@strudel.cycles/core',
        '@strudel.cycles/core/util.mjs',
        '@strudel.cycles/mini',
        '@strudel.cycles/tonal',
        '@strudel.cycles/midi',
        '@strudel.cycles/xen',
        '@strudel.cycles/serial',
        '@strudel.cycles/webaudio',
        '@codemirror/view',
        '@codemirror/highlight',
        '@codemirror/state'
      ],
    },
    target: 'esnext',
  },
});
