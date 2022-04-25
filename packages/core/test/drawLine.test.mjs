import { fastcat, stack, slowcat, silence, pure } from '../pattern.mjs';
import { strict as assert } from 'assert';
import drawLine from '../drawLine.mjs';

describe('drawLine', () => {
  it('supports equal lengths', () => {
    assert.equal(drawLine(fastcat(0), 4), '|0|0');
    assert.equal(drawLine(fastcat(0, 1), 4), '|01|01');
    assert.equal(drawLine(fastcat(0, 1, 2), 6), '|012|012');
  });
  it('supports unequal lengths', () => {
    assert.equal(drawLine(fastcat(0, [1, 2]), 10), '|0-12|0-12');
    assert.equal(drawLine(fastcat(0, [1, 2, 3]), 10), '|0--123|0--123');
    assert.equal(drawLine(fastcat(0, 1, [2, 3]), 10), '|0-1-23|0-1-23');
  });
  it('supports unequal silence', () => {
    assert.equal(drawLine(fastcat(0, silence, [1, 2]), 10), '|0-..12|0-..12');
  });
  it('supports polyrhythms', () => {
    '0*2 1*3';
    assert.equal(drawLine(fastcat(pure(0).fast(2), pure(1).fast(3)), 10), '|0--0--1-1-1-');
  });
  it('supports multiple lines', () => {
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
  it('supports unequal cycle lengths', () => {
    assert.equal(drawLine(slowcat(0, [1, 2]), 10), `|0|12|0|12`);
  });
});
