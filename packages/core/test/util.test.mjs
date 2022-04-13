import { strict as assert } from 'assert';
import { isNote, tokenizeNote, toMidi, mod, compose } from '../util.mjs';

describe('isNote', () => {
  it('should recognize notes without accidentals', () => {
    'C3 D3 E3 F3 G3 A3 B3 C4 D5 c5 d5 e5'.split(' ').forEach((note) => {
      assert.equal(isNote(note), true);
    });
  });
  it('should recognize notes with accidentals', () => {
    'C#3 D##3 Eb3 Fbb3 Bb5'.split(' ').forEach((note) => {
      assert.equal(isNote(note), true);
    });
  });
  it('should not recognize invalid notes', () => {
    assert.equal(isNote('H5'), false);
    assert.equal(isNote('C'), false);
    assert.equal(isNote('X'), false);
    assert.equal(isNote(1), false);
  });
});

describe('isNote', () => {
  it('should tokenize notes without accidentals', () => {
    assert.deepStrictEqual(tokenizeNote('C3'), ['C', '', 3]);
    assert.deepStrictEqual(tokenizeNote('D3'), ['D', '', 3]);
    assert.deepStrictEqual(tokenizeNote('E3'), ['E', '', 3]);
    assert.deepStrictEqual(tokenizeNote('F3'), ['F', '', 3]);
    assert.deepStrictEqual(tokenizeNote('G3'), ['G', '', 3]);
    assert.deepStrictEqual(tokenizeNote('A3'), ['A', '', 3]);
    assert.deepStrictEqual(tokenizeNote('B3'), ['B', '', 3]);
    assert.deepStrictEqual(tokenizeNote('C4'), ['C', '', 4]);
    assert.deepStrictEqual(tokenizeNote('D5'), ['D', '', 5]);
  });
  it('should tokenize notes with accidentals', () => {
    assert.deepStrictEqual(tokenizeNote('C#3'), ['C', '#', 3]);
    assert.deepStrictEqual(tokenizeNote('D##3'), ['D', '##', 3]);
    assert.deepStrictEqual(tokenizeNote('Eb3'), ['E', 'b', 3]);
    assert.deepStrictEqual(tokenizeNote('Fbb3'), ['F', 'bb', 3]);
    assert.deepStrictEqual(tokenizeNote('Bb5'), ['B', 'b', 5]);
  });
  it('should tokenize notes without octave', () => {
    assert.deepStrictEqual(tokenizeNote('C'), ['C', '', undefined]);
    assert.deepStrictEqual(tokenizeNote('C#'), ['C', '#', undefined]);
    assert.deepStrictEqual(tokenizeNote('Bb'), ['B', 'b', undefined]);
    assert.deepStrictEqual(tokenizeNote('Bbb'), ['B', 'bb', undefined]);
  });
  it('should not tokenize invalid notes', () => {
    assert.deepStrictEqual(tokenizeNote('X'), []);
    assert.deepStrictEqual(tokenizeNote('asfasf'), []);
    assert.deepStrictEqual(tokenizeNote(123), []);
  });
});
describe('toMidi', () => {
  it('should turn notes into midi', () => {
    assert.equal(toMidi('A4'), 69);
    assert.equal(toMidi('C4'), 60);
    assert.equal(toMidi('Db4'), 61);
    assert.equal(toMidi('C3'), 48);
    assert.equal(toMidi('Cb3'), 47);
    assert.equal(toMidi('Cbb3'), 46);
    assert.equal(toMidi('C#3'), 49);
    assert.equal(toMidi('C#3'), 49);
    assert.equal(toMidi('C##3'), 50);
  });
});

describe('mod', () => {
  it('should work like regular modulo with positive numbers', () => {
    assert.equal(mod(0, 3), 0);
    assert.equal(mod(1, 3), 1);
    assert.equal(mod(2, 3), 2);
    assert.equal(mod(3, 3), 0);
    assert.equal(mod(4, 3), 1);
    assert.equal(mod(4, 2), 0);
  });
  it('should work with negative numbers', () => {
    assert.equal(mod(-1, 3), 2);
    assert.equal(mod(-2, 3), 1);
    assert.equal(mod(-3, 3), 0);
    assert.equal(mod(-4, 3), 2);
    assert.equal(mod(-5, 3), 1);
    assert.equal(mod(-3, 2), 1);
  });
});

describe('compose', () => {
  const add1 = (a) => a + 1;
  it('should compose', () => {
    assert.equal(compose(add1, add1)(0), 2);
    assert.equal(compose(add1)(0), 1);
  });
  const addS = (s) => (a) => a + s;
  it('should compose left to right', () => {
    assert.equal(compose(addS('a'), addS('b'))(''), 'ab');
    assert.equal(compose(addS('a'), addS('b'))('x'), 'xab');
  });
});
