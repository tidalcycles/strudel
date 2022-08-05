/*
fraction.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/test/fraction.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import Fraction, { gcd } from '../fraction.mjs';
import { describe, it, expect } from 'vitest';

describe('gcd', () => {
  it('should work', () => {
    const F = Fraction._original;
    expect(gcd(F(1 / 6), F(1 / 4)).toFraction()).toEqual('1/12');
  });
});
