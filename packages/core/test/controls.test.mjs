/*
controls.test.mjs - <short description TODO>
Copyright (C) 2023 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/test/controls.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { s, pan } from '../controls.mjs';
import { mini } from '../../mini/mini.mjs';
import { describe, it, expect } from 'vitest';
import Fraction from '../fraction.mjs';

describe('controls', () => {
  it('should support controls', () => {
    expect(s('bd').firstCycleValues).toEqual([{ s: 'bd' }]);
  });
  it('should support compound controls', () => {
    expect(s(mini('bd:3')).firstCycleValues).toEqual([{ s: 'bd', n: 3 }]);
    expect(s(mini('bd:3 sd:4:1.4')).firstCycleValues).toEqual([
      { s: 'bd', n: 3 },
      { s: 'sd', n: 4, gain: 1.4 },
    ]);
  });
  it('should support ignore extra elements in compound controls', () => {
    expect(s(mini('bd:3:0.4 sd:4:0.5:3:17')).firstCycleValues).toEqual([
      { s: 'bd', n: 3, gain: 0.4 },
      { s: 'sd', n: 4, gain: 0.5 },
    ]);
  });
  it('should support nested controls', () => {
    expect(s(mini('bd').pan(1)).firstCycleValues).toEqual([{ s: 'bd', pan: 1 }]);
    expect(s(mini('bd:1').pan(1)).firstCycleValues).toEqual([{ s: 'bd', n: 1, pan: 1 }]);
  });
  it('preserves tactus of the left pattern', () => {
    expect(s(mini('bd cp mt').pan(mini('1 2 3 4'))).tactus).toEqual(Fraction(3));
  });
  it('preserves tactus of the right pattern for .out', () => {
    expect(s(mini('bd cp mt').set.out(pan(mini('1 2 3 4')))).tactus).toEqual(Fraction(4));
  });
  it('combines tactus of the pattern for .mix as lcm', () => {
    expect(s(mini('bd cp mt').set.mix(pan(mini('1 2 3 4')))).tactus).toEqual(Fraction(12));
  });
});
