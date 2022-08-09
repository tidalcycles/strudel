import { configDefaults, defineConfig } from 'vitest/config';

/// <reference types="vitest" />
export default defineConfig({
  test: {
    // ...
    deps: {
      registerNodeLoader: true,
    },
    threads: false,
    reporters: 'verbose',
    isolate: false,
    silent: true,
  },
});
