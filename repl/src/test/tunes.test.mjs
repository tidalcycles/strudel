import { queryCode, testCycles } from '../runtime.mjs';
import * as snaps from '../tunes.snapshot.mjs';
import * as tunes from '../tunes.mjs';
import { describe, it } from 'vitest';

const tuneKeys = Object.keys(tunes);

async function testTune(key, expect) {
  const haps = await queryCode(tunes[key], testCycles[key] || 1);
  expect(haps).toEqual(snaps[key]);
}

describe.concurrent('renders tunes', () => {
  tuneKeys.forEach((key) => {
    it(`tune: ${key}`, async ({ expect }) => await testTune(key, expect));
  });
});
