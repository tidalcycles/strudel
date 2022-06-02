import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import _mdx from 'vite-plugin-mdx';
/* import remarkToc from 'remark-toc';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings'; */

const mdx = _mdx.default || _mdx;
// `options` are passed to `@mdx-js/mdx`
const options = {
  // See https://mdxjs.com/advanced/plugins
  remarkPlugins: [
    // remarkToc,
    // E.g. `remark-frontmatter`
  ],
  rehypePlugins: [
    // rehypeSlug, rehypeAutolinkHeadings
  ],
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mdx(options)],
  build: {
    outDir: '../out/tutorial',
  },
  base: '/',
});

// jsxRuntime:'classic' to prevent "jsxDevRuntime.exports.jsxDEV is not a function" for dev mode
// mode: 'development',
// react({ jsxRuntime: 'classic' }),
