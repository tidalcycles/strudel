import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import react from '@astrojs/react';

import mdx from '@astrojs/mdx';

import remarkToc from 'remark-toc';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';

import tailwind from '@astrojs/tailwind';
// import { visualizer } from 'rollup-plugin-visualizer';

const options = {
  // See https://mdxjs.com/advanced/plugins
  remarkPlugins: [
    remarkToc,
    // E.g. `remark-frontmatter`
  ],
  rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
};

// https://astro.build/config
export default defineConfig({
  integrations: [
    // Enable Preact to support Preact JSX components.
    preact(),
    // Enable React for the Algolia search component.
    react(),
    mdx(options),
    tailwind(),
  ],
  site: `https://strudel.tidalcycles.org`,
  base: '/',
  vite: {
    ssr: {
      // Example: Force a broken package to skip SSR processing, if needed
      external: ['fraction.js'], // https://github.com/infusion/Fraction.js/issues/51
    },
  },
});

/*
  build: {
    outDir: '../out',
    sourcemap: true,
    rollupOptions: {
      plugins: [visualizer({ template: 'treemap' })],
    },
  },
  */
