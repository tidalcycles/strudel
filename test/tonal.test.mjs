import { strict as assert } from 'assert';
import { scaleTranspose } from '../repl/src/tonal.mjs';

describe('scaleTranspose', () => {
  it('should transpose inside scale', () => {
    assert.equal(scaleTranspose('C major', 1, 'C3'), 'D3');
    assert.equal(scaleTranspose('C major', 2, 'E3'), 'G3');
    assert.equal(scaleTranspose('C major', 1, 'E3'), 'F3');
    assert.equal(scaleTranspose('C major', 1, 'G3'), 'A3');
    assert.equal(scaleTranspose('C major', 1, 'C4'), 'D4');
  });
});
