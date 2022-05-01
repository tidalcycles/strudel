import { queryCode } from '../runtime.mjs';
import * as snaps from '../tunes.snapshot.mjs';
import * as tunes from '../tunes.mjs';
import { strict as assert } from 'assert';

describe('tunes', () => {
  it('renders tunes correctly', async () => {
    async function testTune(key) {
      const haps = await queryCode(tunes[key], 1);
      assert.deepStrictEqual(haps, snaps[key]);
    }
    await Promise.all(Object.keys(tunes).map(testTune));
  });
});
