import { queryCode, testCycles } from '../runtime.mjs';
import * as snaps from '../tunes.snapshot.mjs';
import * as tunes from '../tunes.mjs';
import { describe, it, expect } from 'vitest';

const tuneKeys = Object.keys(tunes);

async function testTune(key) {
  const haps = await queryCode(tunes[key], testCycles[key] || 1);
  expect(haps).toEqual(snaps[key]);
}

describe.concurrent('renders tunes', () => {
  tuneKeys.slice(0, 40).forEach((key) => {
    it(`tune: ${key}`, async ({ expect }) => await testTune(key));
  });
});
