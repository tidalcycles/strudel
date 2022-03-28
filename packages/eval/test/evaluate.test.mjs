import { strict as assert } from 'assert';
import { evaluate, extend } from '../evaluate.mjs';
import { mini } from '@strudel.cycles/mini';
import * as strudel from '@strudel.cycles/core';

const { cat } = strudel;

extend({ mini }, strudel);

describe('evaluate', () => {
  const ev = async (code) => (await evaluate(code)).pattern._firstCycleValues;
  it('Should evaluate strudel functions', async () => {
    assert.deepStrictEqual(await ev("pure('c3')"), ['c3']);
    assert.deepStrictEqual(await ev('cat(c3)'), ['c3']);
    assert.deepStrictEqual(await ev('cat(c3, d3)'), ['c3', 'd3']);
    assert.deepStrictEqual(await ev('slowcat(c3, d3)'), ['c3']);
  });
  it('Should be extendable', async () => {
    extend({ myFunction: (...x) => cat(...x) });
    assert.deepStrictEqual(await ev('myFunction(c3, d3)'), ['c3', 'd3']);
  });
  it('Should evaluate simple double quoted mini notation', async () => {
    assert.deepStrictEqual(await ev('"c3"'), ['c3']);
    assert.deepStrictEqual(await ev('"c3 d3"'), ['c3', 'd3']);
    assert.deepStrictEqual(await ev('"<c3 d3>"'), ['c3']);
  });
});
