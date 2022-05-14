import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url'

import mdx from 'vite-plugin-mdx';

// `options` are passed to `@mdx-js/mdx`
const options = {
  // See https://mdxjs.com/advanced/plugins
  remarkPlugins: [
    // E.g. `remark-frontmatter`
  ],
  rehypePlugins: [],
};

// https://vitejs.dev/config/
export default defineConfig({
  input: {
    repl: fileURLToPath(new URL('./index.html', import.meta.url)),
    tutorial: fileURLToPath(new URL('./tutorial/index.html', import.meta.url)),
  },
  plugins: [react(), mdx(options)],
});
