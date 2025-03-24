import { queryCode, testCycles } from '../test/runtime.mjs';
import * as tunes from '../website/src/repl/tunes.mjs';
import { describe, bench } from 'vitest';
import { calculateSteps } from '../packages/core/index.mjs';

const tuneKeys = Object.keys(tunes);

describe('renders tunes', () => {
  tuneKeys.forEach((key) => {
    describe(key, () => {
      calculateSteps(true);
      bench(`+steps`, async () => {
        await queryCode(tunes[key], testCycles[key] || 1);
      });
      calculateSteps(false);
      bench(`-steps`, async () => {
        await queryCode(tunes[key], testCycles[key] || 1);
      });
      calculateSteps(true);
    });
  });
});
