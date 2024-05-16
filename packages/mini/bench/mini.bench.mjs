import { describe, bench } from 'vitest';

import { calculateTactus } from '../../core/index.mjs';
import { mini } from '../index.mjs';

describe('mini', () => {
  calculateTactus(true);
  bench(
    '+tactus',
    () => {
      mini('a b c*3 [c d e, f g] <a b [c d?]>').fast(64).firstCycle();
    },
    { time: 1000 },
  );

  calculateTactus(false);
  bench(
    '-tactus',
    () => {
      mini('a b c*3 [c d e, f g] <a b [c d?]>').fast(64).firstCycle();
    },
    { time: 1000 },
  );
  calculateTactus(true);
});
