import { strict as assert } from 'assert';
import { map, valued, mul } from '../value.mjs';

describe('Value', () => {
  it('unionWith', () => {
    const { value } = valued({ freq: 2000, distortion: 1.2 }).unionWith({ distortion: 2 }, mul);
    assert.deepStrictEqual(value, { freq: 2000, distortion: 2.4 });
  });

  it('experiments', () => {
    assert.equal(map(mul(5), valued(3)).value, 15);
    assert.equal(map(mul(null), valued(3)).value, 0);
    assert.equal(map(mul(3), valued(null)).value, null);
    assert.equal(valued(3).map(mul).ap(3).value, 9);
    assert.equal(valued(mul).ap(3).ap(3).value, 9);
    assert.equal(valued(3).mul(3).value, 9);
  });
});
