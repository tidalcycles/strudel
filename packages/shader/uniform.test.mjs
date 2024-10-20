/*
uniform.test.mjs - <short description TODO>
Copyright (C) 2024 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/test/pattern.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { describe, it, expect } from 'vitest';
import { parseUniformDest } from './uniform.mjs';

describe('Uniform', () => {
  it('Parse simple', () => {
    expect(parseUniformDest('iColor')).toStrictEqual({ name: 'iColor' });
  });
  it('Parse param', () => {
    expect(parseUniformDest(['iColor', 'index', 2])).toStrictEqual({ name: 'iColor', position: 2 });
    expect(parseUniformDest(['iColor', 'index', 'seq'])).toStrictEqual({ name: 'iColor', position: null });
    expect(parseUniformDest(['iColor', 'gain', 3])).toStrictEqual({ name: 'iColor', gain: 3 });
  });
  it('Parse multi param', () => {
    expect(parseUniformDest(['iColor', 'index', 2, 'gain', 3])).toStrictEqual({ name: 'iColor', position: 2, gain: 3 });
  });
});
