import { describe, bench } from 'vitest';

import { calculateTactus, sequence, stack } from '../index.mjs';

const pat64 = sequence(...Array(64).keys());

describe('tactus', () => {
  calculateTactus(true);
  bench(
    '+tactus',
    () => {
      pat64.iter(64).fast(64).firstCycle();
    },
    { time: 1000 },
  );

  calculateTactus(false);
  bench(
    '-tactus',
    () => {
      pat64.iter(64).fast(64).firstCycle();
    },
    { time: 1000 },
  );
});

describe('stack', () => {
  calculateTactus(true);
  bench(
    '+tactus',
    () => {
      stack(pat64, pat64, pat64, pat64, pat64, pat64, pat64, pat64).fast(64).firstCycle();
    },
    { time: 1000 },
  );

  calculateTactus(false);
  bench(
    '-tactus',
    () => {
      stack(pat64, pat64, pat64, pat64, pat64, pat64, pat64, pat64).fast(64).firstCycle();
    },
    { time: 1000 },
  );
});
calculateTactus(true);
