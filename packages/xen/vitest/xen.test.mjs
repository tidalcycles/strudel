/*
xen.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/xen/test/xen.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { edo } from '../xen.mjs';
import { describe, it, expect } from 'vitest';

describe('xen', () => {
  it('edo', () => {
    expect(edo('3edo')).toEqual([1, Math.pow(2, 1 / 3), Math.pow(2, 2 / 3)]);
  });
});
