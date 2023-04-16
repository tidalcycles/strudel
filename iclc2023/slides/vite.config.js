import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import gfm from 'remark-gfm';
import topLevelAwait from 'vite-plugin-top-level-await';

const options = {
  // See https://mdxjs.com/advanced/plugins
  remarkPlugins: [gfm],
  rehypePlugins: [],
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    mdx(options),
    topLevelAwait({
      // The export name of top-level await promise for each chunk module
      promiseExportName: '__tla',
      // The function to generate import names of top-level await promise in each chunk module
      promiseImportName: (i) => `__tla_${i}`,
    }),
  ],
  build: {
    target: 'esnext', //browsers can handle the latest ES features
  },
});
