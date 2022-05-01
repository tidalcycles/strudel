import { queryCode, testCycles } from '../runtime.mjs';
import * as snaps from '../tunes.snapshot.mjs';
import * as tunes from '../tunes.mjs';
import { strict as assert } from 'assert';

async function testTune(key) {
  // console.log('test tune', key);
  const haps = await queryCode(tunes[key], testCycles[key] || 1);
  assert.deepStrictEqual(haps, snaps[key]);
}

describe('renders tunes', () => {
  Object.keys(tunes).forEach((key) => {
    it(`tune: ${key}`, async () => {
      await testTune(key);
    });
  });
});
