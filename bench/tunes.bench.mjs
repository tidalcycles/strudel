import { queryCode, testCycles } from '../test/runtime.mjs';
import * as tunes from '../website/src/repl/tunes.mjs';
import { describe, bench } from 'vitest';

const tuneKeys = Object.keys(tunes);

describe('renders tunes', () => {
  calculateTactus(true);
  bench(`+tactus`, () => {
    tuneKeys.forEach((key) => {
      queryCode(tunes[key], testCycles[key] || 1);
    });
  });
  calculateTactus(false);
  bench(`-tactus`, () => {
    tuneKeys.forEach((key) => {
      queryCode(tunes[key], testCycles[key] || 1);
    });
  });
  calculateTactus(true);
});
