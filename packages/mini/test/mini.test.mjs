import { strict as assert } from 'assert';
import { mini } from '../mini.mjs';

describe('mini', () => {
  it('Should parse mini notation', () => {
    const min = (v) => mini(v)._firstCycleValues;

    assert.deepStrictEqual(min('c3'), ['c3']);
    assert.deepStrictEqual(min('c3 d3'), ['c3', 'd3']);
    assert.deepStrictEqual(min('<c3 d3>'), ['c3']);
  });
});
