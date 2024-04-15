/*
tune.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/xen/tune.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import Tune from './tunejs.js';
import { register } from '@strudel/core';

export const tune = register('tune', (scale, pat) => {
  const tune = new Tune();
  if (!tune.isValidScale(scale)) {
    throw new Error('not a valid tune.js scale name: "' + scale + '". See http://abbernie.github.io/tune/scales.html');
  }
  tune.loadScale(scale);
  tune.tonicize(1);
  return pat.withHap((hap) => {
    return hap.withValue(() => tune.note(hap.value));
  });
});
