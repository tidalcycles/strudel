import { strict as assert } from 'assert';
import { scaleTranspose, scaleOffset } from '../repl/src/tonal.mjs';

describe('scaleOffset', () => {
  it('should transpose positive numbers', () => {
    const c3Minor = ['C3', 'D3', 'Eb3', 'F3', 'G3', 'Ab3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4'];
    c3Minor.forEach((n, i) => {
      assert.equal(scaleOffset('C minor', i), n);
    });
    const gMinor = ['G3', 'A3', 'Bb3', 'C4', 'D4', 'Eb4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'Eb5', 'F5', 'G5'];
    gMinor.forEach((n, i) => {
      assert.equal(scaleOffset('G minor', i), n);
    });
  });
  it('should transpose negative numbers', () => {
    const c3MinorDown = ['C3', 'Bb2', 'Ab2', 'G2', 'F2', 'Eb2', 'D2', 'C2'];
    c3MinorDown.forEach((n, i) => {
      assert.equal(scaleOffset('C minor', -i), n);
    });
  });
  it('should transpose scales with octave', () => {
    const c4Minor = ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5', 'D5', 'Eb5', 'F5', 'G5', 'Ab5', 'Bb5'];
    c4Minor.forEach((n, i) => {
      assert.equal(scaleOffset('C4 minor', i), n);
    });
  });
});

describe('scaleTranspose', () => {
  it('should transpose inside scale', () => {
    scaleTranspose('C minor', 0, 'C3');
    scaleTranspose('C minor', 1, 'D3');
    scaleTranspose('C minor', -1, 'Bb2');
    scaleTranspose('C minor', 8, 'C4');
    scaleTranspose('C4 minor', 8, 'C5');
  });
});

// TODO: test tonal Pattern methods
