/*
uniform.mjs - implements the `uniform` pattern function
Copyright (C) 2024 Strudel contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { register, logger } from '@strudel/core';
import { setUniform } from './shader.mjs';

export const uniform = register('uniform', (options, pat) => {
  // Keep track of the pitches value: Map String Int
  const pitches = { _count: 0 };

  return pat.onTrigger((time_deprecate, hap, currentTime, cps, targetTime) => {
    const instance = options.instance;

    const value = options.gain || 1.0;
    if (options.pitch !== undefined) {
      const note = hap.value.note || hap.value.s;
      if (pitches[note] === undefined) {
        // Assign new value, the first note gets 0, then 1, then 2, ...
        pitches[note] = Object.keys(pitches).length;
      }
      setUniform(instance, options.pitch, value, pitches[note]);
    } else if (options.seq !== undefined) {
      setUniform(instance, options.seq, value, pitches._count++);
    } else if (options.uniform !== undefined) {
      setUniform(instance, options.uniform, value);
    } else {
      console.error('Unknown shader options, need either pitch or uniform', options);
    }
  }, false);
});
