/*
euclid.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/euclid.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern, timeCat } from './pattern.mjs';
import bjork from 'bjork';
import { rotate } from './util.mjs';
import Fraction from './fraction.mjs';

const euclid = (pulses, steps, rotation = 0) => {
  const b = bjork(steps, pulses);
  if (rotation) {
    return rotate(b, -rotation);
  }
  return b;
};

Pattern.prototype.euclid = function (pulses, steps, rotation = 0) {
  return this.struct(euclid(pulses, steps, rotation));
};

Pattern.prototype.euclidLegato = function (pulses, steps, rotation = 0) {
  const bin_pat = euclid(pulses, steps, rotation);
  const firstOne = bin_pat.indexOf(1);
  const gapless = rotate(bin_pat, firstOne)
    .join('')
    .split('1')
    .slice(1)
    .map((s) => [s.length + 1, true]);
  return this.struct(timeCat(...gapless)).late(Fraction(firstOne).div(steps));
};

export default euclid;
