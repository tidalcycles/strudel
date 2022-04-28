/*
mini.test.mjs - <short description TODO>
Copyright (C) 2022 <author(s) TODO> and contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { strict as assert } from 'assert';
import { mini } from '../mini.mjs';
import '@strudel.cycles/core/euclid.mjs';

describe('mini', () => {
  const minV = (v) => mini(v)._firstCycleValues;
  const minS = (v) => mini(v)._showFirstCycle;
  it('supports single elements', () => {
    assert.deepStrictEqual(minV('a'), ['a']);
  });
  it('supports rest', () => {
    assert.deepStrictEqual(minV('~'), []);
  });
  it('supports cat', () => {
    assert.deepStrictEqual(minS('a b'), ['a: 0 - 1/2', 'b: 1/2 - 1']);
    assert.deepStrictEqual(minS('a b c'), ['a: 0 - 1/3', 'b: 1/3 - 2/3', 'c: 2/3 - 1']);
  });
  it('supports slowcat', () => {
    assert.deepStrictEqual(minV('<a b>'), ['a']);
  });
  it('supports division', () => {
    assert.deepStrictEqual(minS('a/2'), ['a: 0 - 2']);
    assert.deepStrictEqual(minS('[c3 d3]/2'), ['c3: 0 - 1']);
  });
  it('supports multiplication', () => {
    assert.deepStrictEqual(minS('c3*2'), ['c3: 0 - 1/2', 'c3: 1/2 - 1']);
    assert.deepStrictEqual(minV('[c3 d3]*2'), ['c3', 'd3', 'c3', 'd3']);
  });
  it('supports brackets', () => {
    assert.deepStrictEqual(minS('c3 [d3 e3]'), ['c3: 0 - 1/2', 'd3: 1/2 - 3/4', 'e3: 3/4 - 1']);
    assert.deepStrictEqual(minS('c3 [d3 [e3 f3]]'), ['c3: 0 - 1/2', 'd3: 1/2 - 3/4', 'e3: 3/4 - 7/8', 'f3: 7/8 - 1']);
  });
  it('supports commas', () => {
    assert.deepStrictEqual(minS('c3,e3,g3'), ['c3: 0 - 1', 'e3: 0 - 1', 'g3: 0 - 1']);
    assert.deepStrictEqual(minS('[c3,e3,g3] f3'), ['c3: 0 - 1/2', 'e3: 0 - 1/2', 'g3: 0 - 1/2', 'f3: 1/2 - 1']);
  });
  it('supports elongation', () => {
    assert.deepStrictEqual(minS('a@3 b'), ['a: 0 - 3/4', 'b: 3/4 - 1']);
    assert.deepStrictEqual(minS('a@2 b@3'), ['a: 0 - 2/5', 'b: 2/5 - 1']);
  });
  it('supports replication', () => {
    assert.deepStrictEqual(minS('a!3 b'), ['a: 0 - 1/4', 'a: 1/4 - 1/2', 'a: 1/2 - 3/4', 'b: 3/4 - 1']);
  });
  it('supports euclidean rhythms', () => {
    assert.deepStrictEqual(minS('a(3, 8)'), ['a: 0 - 1/8', 'a: 3/8 - 1/2', 'a: 3/4 - 7/8']);
  });
});
