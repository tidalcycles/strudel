/*
tune.mjs - <short description TODO>
Copyright (C) 2022 <author(s) TODO> and contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import Tune from './tunejs.js';
import { Pattern } from '@strudel.cycles/core';

Pattern.prototype._tune = function (scale, tonic = 220) {
  const tune = new Tune();
  if (!tune.isValidScale(scale)) {
    throw new Error('not a valid tune.js scale name: "' + scale + '". See http://abbernie.github.io/tune/scales.html');
  }
  tune.loadScale(scale);
  tune.tonicize(tonic);
  return this._asNumber()._withEvent((event) => {
    return event.withValue(() => tune.note(event.value)).setContext({ ...event.context, type: 'frequency' });
  });
};

Pattern.prototype.define('tune', (scale, pat) => pat.tune(scale), { composable: true, patternified: true });
