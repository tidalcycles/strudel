/*
uniform.mjs - implements the `uniform` pattern function
Copyright (C) 2024 Strudel contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { register, logger } from '@strudel/core';
import { setUniform } from './shader.mjs';

// Parse a destination from the mini notation, e.g. `name` or `name:attr:value`
export function parseUniformDest(dest) {
  let result = {};
  if (typeof dest === 'string') result.name = dest;
  else if (dest.length >= 2) {
    result.name = dest[0];
    // Parse the attr:value pairs
    for (let i = 1; i < dest.length; i += 2) {
      const k = dest[i];
      const v = dest[i + 1];
      const isNum = typeof v === 'number';
      if (k == 'index' && isNum) result.position = v;
      else if (k == 'index' && v == 'random') result.position = Math.floor(Math.random() * 1024);
      else if (k == 'index' && v == 'seq') result.position = null;
      else if (k == 'gain' && isNum) result.gain = v;
      else if (k == 'slow' && isNum) result.slow = v;
      else throw 'Bad uniform param ' + k + ':' + v;
    }
  }
  return result;
}

// Keep track of the last uniforms' array position
let _uniforms = {};
function getNextPosition(name, value) {
  // Initialize uniform state
  if (!_uniforms[name]) _uniforms[name] = { _count: 0 };
  const uniform = _uniforms[name];

  // Set a new position when the value changes
  if (uniform._last != value) {
    uniform._last = value;
    uniform._count++;
  }
  return uniform._count;
}

/**
 * Update a shader. The destination name consist of
 *
 * - the uniform name
 * - optional 'index' to set array position, either a number or an assignment mode ('seq' or 'random')
 * - optional 'gain' to adjust the value: 0 to silence, 2 to double
 * - optional 'slow' to adjust the change speed: 1 for instant, 50 for slow changes, default to 10
 *
 * @name uniform
 * @example
 * pan(sine.uniform("iColor"))
 * @example
 * gain("<.5 .3>".uniform("rotations:index:seq"))
 */
export const uniform = register('uniform', (target, pat) => {
  // TODO: support multiple shader instance
  const instance = 'default';

  // Decode the uniform target defintion
  const uniformDest = parseUniformDest(target);
  // Set the first value by default
  if (uniformDest.position === undefined) uniformDest.position = 0;

  return pat.withValue((v) => {
    // TODO: figure out why this is called repeatedly when changing values. For example, on first call, the last value is passed.
    if (typeof v === 'number') {
      const position = uniformDest.position === null ? getNextPosition(uniformDest.name, v) : uniformDest.position;
      const value = v * (uniformDest.gain || 1);
      setUniform(instance, uniformDest.name, value, false, position, uniformDest.slow || 10);
    } else {
      console.error('Uniform applied to a non number pattern');
    }
    return v;
  });
});

function getNotePosition(name, value) {
  // Initialize uniform state
  if (!_uniforms[name]) _uniforms[name] = {};
  const uniform = _uniforms[name];

  const note = value.note || value.n || value.sound || value.s;
  if (uniform[note] === undefined) {
    // Assign new value, the first note gets 0, then 1, then 2, ...
    uniform[note] = Object.keys(uniform).length;
  }
  return uniform[note];
}

/**
 * Update a shader with note-on event. See the 'uniform' doc.
 *
 * @name uniformTrigger
 * @example
 * s("bd sd").uniformTrigger("iColors:gain:2"))
 */
export const uniformTrigger = register('uniformTrigger', (target, pat) => {
  // TODO: support multiple shader instance
  const instance = 'default';

  // Decode the uniform target defintion
  const uniformDest = parseUniformDest(target);
  // Assign pitch position by default
  if (uniformDest.position === undefined) uniformDest.position = null;

  return pat.onTrigger((time_deprecate, hap, currentTime, cps, targetTime) => {
    const position =
      uniformDest.position === null ? getNotePosition(uniformDest.name, hap.value) : uniformDest.position;

    const value = (hap.value.gain || 1) * (uniformDest.gain || 1);

    // Update the uniform
    setUniform(instance, uniformDest.name, value, true, position, uniformDest.slow || 10);
  }, false);
});
