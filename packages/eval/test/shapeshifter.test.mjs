import { strict as assert } from 'assert';
import shapeshifter from '../shapeshifter.mjs';

describe('shapeshifter', () => {
  it('Should shift simple double quote string', () => {
    assert.equal(shapeshifter('"c3"'), '(async()=>{return mini("c3").withMiniLocation([1,0,15],[1,4,19])})()');
  });
});
