import { queryCode, testCycles } from './runtime.mjs';
import * as tunes from '../website/src/repl/tunes.mjs';
import { describe, it } from 'vitest';

const tuneKeys = Object.keys(tunes);

describe('renders tunes', () => {
  tuneKeys.forEach((key) => {
    it(`tune: ${key}`, async ({ expect }) => {
      const haps = await queryCode(tunes[key], testCycles[key] || 1);
      expect(haps).toMatchSnapshot();
    });
  });
});
