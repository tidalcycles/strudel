/*
mini.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/mini/test/mini.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { mini } from '../mini.mjs';
import '@strudel.cycles/core/euclid.mjs';
import { describe, it, expect } from 'vitest';

describe('mini', () => {
  const minV = (v) => mini(v)._firstCycleValues;
  const minS = (v) => mini(v)._showFirstCycle;
  it('supports single elements', () => {
    expect(minV('a')).toEqual(['a']);
  });
  it('supports rest', () => {
    expect(minV('~')).toEqual([]);
  });
  it('supports cat', () => {
    expect(minS('a b')).toEqual(['a: 0 - 1/2', 'b: 1/2 - 1']);
    expect(minS('a b c')).toEqual(['a: 0 - 1/3', 'b: 1/3 - 2/3', 'c: 2/3 - 1']);
  });
  it('supports slowcat', () => {
    expect(minV('<a b>')).toEqual(['a']);
  });
  it('supports division', () => {
    expect(minS('a/2')).toEqual(['a: 0 - 2']);
    expect(minS('[c3 d3]/2')).toEqual(['c3: 0 - 1']);
  });
  it('supports multiplication', () => {
    expect(minS('c3*2')).toEqual(['c3: 0 - 1/2', 'c3: 1/2 - 1']);
    expect(minV('[c3 d3]*2')).toEqual(['c3', 'd3', 'c3', 'd3']);
  });
  it('supports brackets', () => {
    expect(minS('c3 [d3 e3]')).toEqual(['c3: 0 - 1/2', 'd3: 1/2 - 3/4', 'e3: 3/4 - 1']);
    expect(minS('c3 [d3 [e3 f3]]')).toEqual(['c3: 0 - 1/2', 'd3: 1/2 - 3/4', 'e3: 3/4 - 7/8', 'f3: 7/8 - 1']);
  });
  it('supports commas', () => {
    expect(minS('c3,e3,g3')).toEqual(['c3: 0 - 1', 'e3: 0 - 1', 'g3: 0 - 1']);
    expect(minS('[c3,e3,g3] f3')).toEqual(['c3: 0 - 1/2', 'e3: 0 - 1/2', 'g3: 0 - 1/2', 'f3: 1/2 - 1']);
  });
  it('supports elongation', () => {
    expect(minS('a@3 b')).toEqual(['a: 0 - 3/4', 'b: 3/4 - 1']);
    expect(minS('a@2 b@3')).toEqual(['a: 0 - 2/5', 'b: 2/5 - 1']);
  });
  it('supports replication', () => {
    expect(minS('a!3 b')).toEqual(['a: 0 - 1/4', 'a: 1/4 - 1/2', 'a: 1/2 - 3/4', 'b: 3/4 - 1']);
  });
  it('supports euclidean rhythms', () => {
    expect(minS('a(3, 8)')).toEqual(['a: 0 - 1/8', 'a: 3/8 - 1/2', 'a: 3/4 - 7/8']);
  });
});
