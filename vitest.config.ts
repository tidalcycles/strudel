import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'repl/src/test/*'],
    environment: 'happy-dom', // or 'jsdom', 'node' // https://vitest.dev/guide/features.html#chai-and-jest-expect-compatibility
    // environment: 'happy-dom', // or 'jsdom', 'node' // https://vitest.dev/guide/features.html#chai-and-jest-expect-compatibility
  },
});
