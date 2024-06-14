import { queryCode, testCycles } from '../test/runtime.mjs';
import * as tunes from '../website/src/repl/tunes.mjs';
import { describe, bench } from 'vitest';
import { calculateTactus } from '../packages/core/index.mjs';

const tuneKeys = Object.keys(tunes);

describe('renders tunes', () => {
  tuneKeys.forEach((key) => {
    describe(key, () => {
      calculateTactus(true);
      bench(`+tactus`, async () => {
        await queryCode(tunes[key], testCycles[key] || 1);
      });
      calculateTactus(false);
      bench(`-tactus`, async () => {
        await queryCode(tunes[key], testCycles[key] || 1);
      });
      calculateTactus(true);
    });
  });
});
