/** @type {import("snowpack").SnowpackUserConfig } */
export default {
  workspaceRoot: '..',
  mount: {
    public: { url: '/', static: false },
    src: { url: '/dist' },
  },
  plugins: [
    '@snowpack/plugin-postcss',
    '@snowpack/plugin-react-refresh',
    '@snowpack/plugin-dotenv',
    [
      '@snowpack/plugin-typescript',
      {
        /* Yarn PnP workaround: see https://www.npmjs.com/package/@snowpack/plugin-typescript */
        ...(process.versions.pnp ? { tsc: 'yarn pnpify tsc' } : {}),
      },
    ],
  ],
  routes: [
    /* Enable an SPA Fallback in development: */
    // {"match": "routes", "src": ".*", "dest": "/index.html"},
  ],
  optimize: {
    /* Example: Bundle your final build: */
    // "bundle": true,
  },
  packageOptions: {
    /* ... */
    knownEntrypoints: ['fraction.js'],
  },
  devOptions: {
    tailwindConfig: './tailwind.config.js',
  },
  buildOptions: {
    /* ... */
    out: '../docs',
  },
};
