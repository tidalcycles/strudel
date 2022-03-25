import { strict as assert } from 'assert';
import '../tonal.mjs'; // need to import this to add prototypes
import { pure } from '@strudel/core/strudel.mjs';

describe('tonal', () => {
  it('Should run tonal functions ', () => {
    assert.deepStrictEqual(pure('c3').scale('C major').scaleTranspose(1)._firstCycleValues, ['D3']);
  });
});
