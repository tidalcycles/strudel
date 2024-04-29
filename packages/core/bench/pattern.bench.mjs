import { describe, bench } from 'vitest';

import { sequence } from '../index.mjs';

const pat64 = sequence(...Array(64).keys());

bench(
  'iter',
  () => {
    pat64.iter(64).fast(64).firstCycle();
  },
  { time: 1000 },
);
