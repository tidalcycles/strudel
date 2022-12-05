/*
drawLine.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/test/drawLine.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import pattern from '../pattern.mjs';
const { fastcat, stack, slowcat, silence, pure } = pattern;
import { describe, it, expect } from 'vitest';
import drawLine from '../drawLine.mjs';

describe('drawLine', () => {
  it('supports equal lengths', () => {
    expect(drawLine(fastcat(0), 4)).toEqual('|0|0');
    expect(drawLine(fastcat(0, 1), 4)).toEqual('|01|01');
    expect(drawLine(fastcat(0, 1, 2), 6)).toEqual('|012|012');
  });
  it('supports unequal lengths', () => {
    expect(drawLine(fastcat(0, [1, 2]), 10)).toEqual('|0-12|0-12');
    expect(drawLine(fastcat(0, [1, 2, 3]), 10)).toEqual('|0--123|0--123');
    expect(drawLine(fastcat(0, 1, [2, 3]), 10)).toEqual('|0-1-23|0-1-23');
  });
  it('supports unequal silence', () => {
    expect(drawLine(fastcat(0, silence, [1, 2]), 10)).toEqual('|0-..12|0-..12');
  });
  it('supports polyrhythms', () => {
    // assert.equal(drawLine(fastcat(pure(0).fast(2), pure(1).fast(3)), 10), '|0--0--1-1-1-');
    expect(drawLine(fastcat(pure(0).fast(2), pure(1).fast(3)), 10)).toEqual('|0--0--1-1-1-');
  });
  it('supports multiple lines', () => {
    expect(drawLine(fastcat(0, stack(1, 2)), 10)).toEqual(`|01|01|01|01
|.2|.2|.2|.2`);

    expect(drawLine(fastcat(0, 1, stack(2, 3)), 10)).toEqual(`|012|012|012
|..3|..3|..3`);

    expect(drawLine(fastcat(0, stack(1, 2, 3)), 10)).toEqual(`|01|01|01|01
|.2|.2|.2|.2
|.3|.3|.3|.3`);
    expect(drawLine(fastcat(0, 1, stack(2, 3, 4)), 10)).toEqual(`|012|012|012
|..3|..3|..3
|..4|..4|..4`);
  });
  it('supports unequal cycle lengths', () => {
    expect(drawLine(slowcat(0, [1, 2]), 10)).toEqual(`|0|12|0|12`);
  });
});
