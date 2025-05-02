import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import remarkToc from 'remark-toc';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeUrls from 'rehype-urls';
import bundleAudioWorkletPlugin from 'vite-plugin-bundle-audioworklet';

import tailwind from '@astrojs/tailwind';
import AstroPWA from '@vite-pwa/astro';

const site = `https://strudel.cc/`; // root url without a path
const base = '/'; // base path of the strudel site
const baseNoTrailing = base.endsWith('/') ? base.slice(0, -1) : base;

// this rehype plugin fixes relative links
// it works by prepending the base + page path to anchor links
// and by prepending the base path to other relative links starting with /
// this is necessary when using a base href like <base href={base} />
// examples with base as "mybase":
//   #gain -> /mybase/learn/effects/#gain
//   /some/page -> /mybase/some/page
function relativeURLFix() {
  return (tree, file) => {
    const chunks = file.history[0].split('/src/pages/'); // file.history[0] is the file path
    const path = chunks[chunks.length - 1].slice(0, -4); // only path inside src/pages, without .mdx
    return rehypeUrls((url) => {
      let newHref = baseNoTrailing;
      if (url.href.startsWith('#')) {
        // special case: a relative anchor link to the current page
        newHref += `/${path}/${url.href}`;
      } else if (url.href.startsWith('/')) {
        // any other relative url starting with /
        newHref += url.pathname;
        if (url.pathname.indexOf('.') == -1) {
          // append trailing slash to resource only if there is no file extension
          newHref += url.pathname.endsWith('/') ? '' : '/';
        }
        newHref += url.search || '';
        newHref += url.hash || '';
      } else {
        // leave this URL alone
        return;
      }
      // console.log(url.href + ' -> ', newHref);
      return newHref;
    })(tree);
  };
}
const options = {
  // See https://mdxjs.com/advanced/plugins
  remarkPlugins: [
    remarkToc,
    // E.g. `remark-frontmatter`
  ],
  rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'append' }], relativeURLFix],
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
        maximumFileSizeToCacheInBytes: 4194304, // 4MB
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,wav,mp3,ogg,ttf,woff2,TTF,otf}'],
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
        includeAssets: ['favicon.ico', 'icons/apple-icon-180.png'],
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
  base,
  vite: {
    plugins: [bundleAudioWorkletPlugin()],
    ssr: {
      // Example: Force a broken package to skip SSR processing, if needed
      // external: ['fraction.js'], // https://github.com/infusion/Fraction.js/issues/51
    },
  },
});
