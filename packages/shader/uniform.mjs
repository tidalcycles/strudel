/*
uniform.mjs - implements the `uniform` pattern function
Copyright (C) 2024 Strudel contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { register, logger } from '@strudel/core';
import { setUniform } from './shader.mjs';

/**
 * Update a shader. The destination name consist of
 *
 * - the uniform name
 * - optional array mapping, either a number or an assignment mode ('seq' or 'pitch')
 *
 * @name uniform
 * @example
 * s("bd").uniform("iColor")
 * @example
 * s("bd").uniform("iColors:seq")
 * @example
 * note("c3 e3").uniform("iMorph:pitch")
 */
function parseUniformTarget(name) {
  if (typeof name === 'string') return { name, mapping: 'single', position: 0 };
  else if (name.length == 2) {
    const mapping = typeof name[1] === 'string' ? name[1] : 'single';
    const position = typeof name[1] === 'string' ? null : name[1];
    return {
      name: name[0],
      mapping,
      position,
    };
  }
}

// Keep track of the pitches value per uniform
let _pitches = {};
export const uniform = register('uniform', (target, pat) => {
  // TODO: support multiple shader instance
  const instance = 'default';

  // Decode the uniform defintion
  const uniformTarget = parseUniformTarget(target);

  // Get the pitches
  if (!_pitches[uniformTarget.name]) _pitches[uniformTarget.name] = { _count: 0 };
  const pitches = _pitches[uniformTarget.name];

  return pat.onTrigger((time_deprecate, hap, currentTime, cps, targetTime) => {
    // TODO: figure out how to get the desired value, e.g. is this pattern for pan, gain, velocity, ...
    const value = hap.value ? hap.value.gain || 1.0 : 1.0;

    // Get the uniform mapping position
    let position = null;
    if (uniformTarget.mapping == 'pitch') {
      // Assign one position per pitch
      const note = hap.value.note || hap.value.s;
      if (pitches[note] === undefined) {
        // Assign new value, the first note gets 0, then 1, then 2, ...
        pitches[note] = Object.keys(pitches).length;
      }
      position = pitches[note];
    } else if (uniformTarget.mapping == 'seq') {
      console.log('HERE', pitches);
      // Assign a new position per event
      position = pitches._count++;
    } else if (uniformTarget.mapping == 'single') {
      // Assign a fixed position
      position = uniformTarget.position;
    } else {
      console.error('Unknown uniform target', uniformTarget);
    }

    // Update the uniform
    if (position !== null) setUniform(instance, uniformTarget.name, value, position);
  }, false);
});
