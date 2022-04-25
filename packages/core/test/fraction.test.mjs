import Fraction, { gcd } from '../fraction.mjs';
import { strict as assert } from 'assert';

describe('gcd', () => {
  it('should work', () => {
    const F = Fraction._original;
    assert.equal(gcd(F(1 / 6), F(1 / 4)).toFraction(), '1/12');
  });
});
