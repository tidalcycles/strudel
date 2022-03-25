import { strict as assert } from 'assert';
import { edo } from '../xen.mjs';

describe('xen', () => {
  it('edo', () => {
    assert.deepStrictEqual(edo('3edo'), [1, Math.pow(2, 1 / 3), Math.pow(2, 2 / 3)]);
  });
});
