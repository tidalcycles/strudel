/*
util.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/test/util.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { pure } from '../pattern.mjs';
import { isNote, tokenizeNote, toMidi, fromMidi, mod, compose, getFrequency } from '../util.mjs';
import { describe, it, expect } from 'vitest';

describe('isNote', () => {
  it('should recognize notes without accidentals', () => {
    'C3 D3 E3 F3 G3 A3 B3 C4 D5 c5 d5 e5'.split(' ').forEach((note) => {
      expect(isNote(note)).toBe(true);
    });
  });
  it('should recognize notes with accidentals', () => {
    'C#3 D##3 Eb3 Fbb3 Bb5'.split(' ').forEach((note) => {
      expect(isNote(note)).toBe(true);
    });
  });
  it('should not recognize invalid notes', () => {
    expect(isNote('H5')).toBe(false);
    expect(isNote('C')).toBe(false);
    expect(isNote('X')).toBe(false);
    expect(isNote(1)).toBe(false);
  });
});

describe('isNote', () => {
  it('should tokenize notes without accidentals', () => {
    expect(tokenizeNote('C3')).toStrictEqual(['C', '', 3]);
    expect(tokenizeNote('D3')).toStrictEqual(['D', '', 3]);
    expect(tokenizeNote('E3')).toStrictEqual(['E', '', 3]);
    expect(tokenizeNote('F3')).toStrictEqual(['F', '', 3]);
    expect(tokenizeNote('G3')).toStrictEqual(['G', '', 3]);
    expect(tokenizeNote('A3')).toStrictEqual(['A', '', 3]);
    expect(tokenizeNote('B3')).toStrictEqual(['B', '', 3]);
    expect(tokenizeNote('C4')).toStrictEqual(['C', '', 4]);
    expect(tokenizeNote('D5')).toStrictEqual(['D', '', 5]);
  });
  it('should tokenize notes with accidentals', () => {
    expect(tokenizeNote('C#3')).toStrictEqual(['C', '#', 3]);
    expect(tokenizeNote('D##3')).toStrictEqual(['D', '##', 3]);
    expect(tokenizeNote('Eb3')).toStrictEqual(['E', 'b', 3]);
    expect(tokenizeNote('Fbb3')).toStrictEqual(['F', 'bb', 3]);
    expect(tokenizeNote('Bb5')).toStrictEqual(['B', 'b', 5]);
  });
  it('should tokenize notes without octave', () => {
    expect(tokenizeNote('C')).toStrictEqual(['C', '', undefined]);
    expect(tokenizeNote('C#')).toStrictEqual(['C', '#', undefined]);
    expect(tokenizeNote('Bb')).toStrictEqual(['B', 'b', undefined]);
    expect(tokenizeNote('Bbb')).toStrictEqual(['B', 'bb', undefined]);
  });
  it('should not tokenize invalid notes', () => {
    expect(tokenizeNote('X')).toStrictEqual([]);
    expect(tokenizeNote('asfasf')).toStrictEqual([]);
    expect(tokenizeNote(123)).toStrictEqual([]);
  });
});
describe('toMidi', () => {
  it('should turn notes into midi', () => {
    expect(toMidi('A4')).toEqual(69);
    expect(toMidi('C4')).toEqual(60);
    expect(toMidi('Db4')).toEqual(61);
    expect(toMidi('C3')).toEqual(48);
    expect(toMidi('Cb3')).toEqual(47);
    expect(toMidi('Cbb3')).toEqual(46);
    expect(toMidi('C#3')).toEqual(49);
    expect(toMidi('C#3')).toEqual(49);
    expect(toMidi('C##3')).toEqual(50);
  });
});
describe('fromMidi', () => {
  it('should turn midi into frequency', () => {
    expect(fromMidi(69)).toEqual(440);
    expect(fromMidi(57)).toEqual(220);
  });
});
describe('getFrequency', () => {
  it('should turn midi into frequency', () => {
    const happify = (val, context = {}) => pure(val).firstCycle()[0].setContext(context);
    expect(getFrequency(happify('a4'))).toEqual(440);
    expect(getFrequency(happify('a3'))).toEqual(220);
    expect(getFrequency(happify(440, { type: 'frequency' }))).toEqual(440); // TODO: migrate when values are objects..
    expect(getFrequency(happify(432, { type: 'frequency' }))).toEqual(432);
  });
});

describe('mod', () => {
  it('should work like regular modulo with positive numbers', () => {
    expect(mod(0, 3)).toEqual(0);
    expect(mod(1, 3)).toEqual(1);
    expect(mod(2, 3)).toEqual(2);
    expect(mod(3, 3)).toEqual(0);
    expect(mod(4, 3)).toEqual(1);
    expect(mod(4, 2)).toEqual(0);
  });
  it('should work with negative numbers', () => {
    expect(mod(-1, 3)).toEqual(2);
    expect(mod(-2, 3)).toEqual(1);
    expect(mod(-3, 3)).toEqual(0);
    expect(mod(-4, 3)).toEqual(2);
    expect(mod(-5, 3)).toEqual(1);
    expect(mod(-3, 2)).toEqual(1);
  });
});

describe('compose', () => {
  const add1 = (a) => a + 1;
  it('should compose', () => {
    expect(compose(add1, add1)(0)).toEqual(2);
    expect(compose(add1)(0)).toEqual(1);
  });
  const addS = (s) => (a) => a + s;
  it('should compose left to right', () => {
    expect(compose(addS('a'), addS('b'))('')).toEqual('ab');
    expect(compose(addS('a'), addS('b'))('x')).toEqual('xab');
  });
});
