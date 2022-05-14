import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
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
  plugins: [react(), mdx(options)],
});

// jsxRuntime:'classic' to prevent "jsxDevRuntime.exports.jsxDEV is not a function" for dev mode
// mode: 'development',
// react({ jsxRuntime: 'classic' }),