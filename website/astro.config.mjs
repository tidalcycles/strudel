import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';

import remarkToc from 'remark-toc';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeUrls from 'rehype-urls';

import tailwind from '@astrojs/tailwind';
import AstroPWA from '@vite-pwa/astro';
// import { visualizer } from 'rollup-plugin-visualizer';

const site = `https://strudel.cc/`; // root url without a path
const base = '/'; // base path of the strudel site
const baseNoTrailing = base.endsWith('/') ? base.slice(0, -1) : base;

// this rehype plugin converts relative anchor links to absolute ones
// it wokrs by prepending the absolute page path to anchor links
// example: #gain -> /learn/effects/#gain
// this is necessary when using a base href like <base href={base} />
// in this setup, relative anchor links will always link to base, instead of the current page
function absoluteAnchors() {
  return (tree, file) => {
    const chunks = file.history[0].split('/src/pages/'); // file.history[0] is the file path
    const path = chunks[chunks.length - 1].slice(0, -4); // only path inside src/pages, without .mdx
    return rehypeUrls((url) => {
      if (url.href.startsWith('/')) {
        const hrefWithTrailingSlash = url.href.endsWith('/') ? url.href : url.href + '/';
        return baseNoTrailing + hrefWithTrailingSlash;
      }
      if (url.href.startsWith('#')) {
        const absoluteUrl = `${baseNoTrailing}/${path}/${url.href}`;
        return absoluteUrl;
      }
      // console.log(url.href + ' -> ', absoluteUrl);
      return;
    })(tree);
  };
}
const options = {
  // See https://mdxjs.com/advanced/plugins
  remarkPlugins: [
    remarkToc,
    // E.g. `remark-frontmatter`
  ],
  rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'append' }], absoluteAnchors],
};

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    mdx(options),
    tailwind(),
    AstroPWA({
      experimental: { directoryAndTrailingSlashHandler: true },
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,wav,mp3,ogg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              [
                /^https:\/\/raw\.githubusercontent\.com\/.*/i,
                /^https:\/\/freesound\.org\/.*/i,
                /^https:\/\/cdn\.freesound\.org\/.*/i,
                /^https:\/\/shabda\.ndre\.gr\/.*/i,
              ].some((regex) => regex.test(url)),
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-samples',
              expiration: {
                maxEntries: 5000,
                maxAgeSeconds: 60 * 60 * 24 * 30, // <== 14 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
      manifest: {
        includeAssets: ['favicon.ico', 'icons/apple-icon-180.png', 'favicon.svg'],
        name: 'Strudel REPL',
        short_name: 'Strudel',
        description:
          'Strudel is a music live coding environment for the browser, porting the TidalCycles pattern language to JavaScript.',
        theme_color: '#222222',
        icons: [
          {
            src: 'icons/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  site,
  base: base,
  vite: {
    ssr: {
      // Example: Force a broken package to skip SSR processing, if needed
      external: ['fraction.js'], // https://github.com/infusion/Fraction.js/issues/51
    },
  },
});
