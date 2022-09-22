import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../out',
    sourcemap: false,
    rollupOptions: {
      plugins: [visualizer({ template: 'treemap' })],
    },
  },
});
