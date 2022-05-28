import { fastcat, stack, slowcat, silence, pure } from '../pattern.mjs';
import { strict as assert } from 'assert';
import splitLanes from '../splitLanes.mjs';

describe('splitLanes', () => {
  it('should split', () => {
    const haps = fastcat(0, stack(1, 2))._firstCycleValues;

    assert.deepStrictEqual(haps, [0, 1, 2]);
    assert.deepStrictEqual(splitLanes([0, 1, 2]), [[0, 1, 2]]);
  });
});
