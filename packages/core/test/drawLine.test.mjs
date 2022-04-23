import { fastcat, stack } from '../pattern.mjs';
import { strict as assert } from 'assert';
import drawLine from '../drawLine.mjs';

describe('drawLine', () => {
  it('should work', () => {
    assert.equal(drawLine(fastcat(0, [1, 2]), 10), '|0-12|0-12');
    assert.equal(drawLine(fastcat(0, [1, 2, 3]), 10), '|0--123|0--123');
    assert.equal(drawLine(fastcat(0, 1, [2, 3]), 10), '|0-1-23|0-1-23');
    assert.equal(
      drawLine(fastcat(0, stack(1, 2)), 10),
      `|01|01|01|01
|.2|.2|.2|.2`,
    );
    assert.equal(
      drawLine(fastcat(0, 1, stack(2, 3)), 10),
      `|012|012|012
|..3|..3|..3`,
    );
    assert.equal(
      drawLine(fastcat(0, stack(1, 2, 3)), 10),
      `|01|01|01|01
|.2|.2|.2|.2
|.3|.3|.3|.3`,
    );
    assert.equal(
      drawLine(fastcat(0, 1, stack(2, 3, 4)), 10),
      `|012|012|012
|..3|..3|..3
|..4|..4|..4`,
    );
  });
});
