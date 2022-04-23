import { fastcat } from '../pattern.mjs';
import { strict as assert } from 'assert';
import drawLine from '../drawLine.mjs';

describe('drawLine', () => {
  it('should work', () => {
    assert.equal(drawLine(fastcat(0, [1, 2]), 10), '|0-12|0-12');
    assert.equal(drawLine(fastcat(0, [1, 2, 3]), 10), '|0--123|0--123');
    assert.equal(drawLine(fastcat(0, 1, [2, 3]), 10), '|0-1-23|0-1-23');
  });
});
