import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import gfm from 'remark-gfm';

const options = {
  // See https://mdxjs.com/advanced/plugins
  remarkPlugins: [gfm],
  rehypePlugins: [],
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mdx(options)],
});
