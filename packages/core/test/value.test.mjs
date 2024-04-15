/*
value.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/test/value.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { describe, it, expect } from 'vitest';
import { map, valued, mul } from '../value.mjs';
import { n } from '../controls.mjs';

describe('Value', () => {
  it('unionWith', () => {
    const { value } = valued({ freq: 2000, distortion: 1.2 }).unionWith({ distortion: 2 }, mul);
    expect(value).toStrictEqual({ freq: 2000, distortion: 2.4 });
  });

  it('experiments', () => {
    expect(map(mul(5), valued(3)).value).toEqual(15);
    expect(map(mul(null), valued(3)).value).toEqual(0);
    expect(map(mul(3), valued(null)).value).toEqual(null);
    expect(valued(3).map(mul).ap(3).value).toEqual(9);
    expect(valued(mul).ap(3).ap(3).value).toEqual(9);
    expect(valued(3).mul(3).value).toEqual(9);
  });
});
