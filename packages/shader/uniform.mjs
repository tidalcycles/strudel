/*
uniform.mjs - implements the `uniform` pattern function
Copyright (C) 2024 Strudel contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { register, logger } from '@strudel/core';
import { setUniform } from './shader.mjs';

function parseUniformTarget(name) {
  if (typeof name === 'string') return { name, position: 0 };
  else if (name.length == 2) {
    let position = null;
    if (typeof name[1] === 'number') position = name[1];
    else if (name[1] == 'random') position = Math.floor(Math.random() * 1024);
    else if (name[1] != 'seq') throw 'Unknown mapping: ' + name[1];
    return { name: name[0], position };
  }
}

// Keep track of the pitches value per uniform
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
 * - optional array mapping, either a number or an assignment mode ('seq' or 'random')
 *
 * @name uniform
 * @example
 * pan(sine.uniform("iColor"))
 * @example
 * gain("<.5 .3>".uniform("rotations:seq"))
 */
export const uniform = register('uniform', (target, pat) => {
  // TODO: support multiple shader instance
  const instance = 'default';

  // Decode the uniform target defintion
  const uniformTarget = parseUniformTarget(target);

  return pat.withValue((v) => {
    // TODO: figure out why this is called repeatedly when changing values. For example, on first call, the last value is passed.
    if (typeof v === 'number') {
      const position =
        uniformTarget.position === null ? getNextPosition(uniformTarget.name, v) : uniformTarget.position;
      setUniform(instance, uniformTarget.name, v, position);
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
 * Update a shader with note-on event. The destination name consist of
 *
 * - the uniform name
 * - optional array position, default to randomly assigned position based on the note or sound.
 *
 * @name uniformTrigger
 * @example
 * pan(sine.uniform("iColor"))
 * @example
 * gain("<.5 .3>".uniform("rotations:seq"))
 */
export const uniformTrigger = register('uniformTrigger', (target, pat) => {
  // TODO: support multiple shader instance
  const instance = 'default';

  // Decode the uniform target defintion
  const uniformTarget = parseUniformTarget(target);

  return pat.onTrigger((time_deprecate, hap, currentTime, cps, targetTime) => {
    const position =
      uniformTarget.position === null ? getNotePosition(uniformTarget.name, hap.value) : uniformTarget.position;

    // TODO: support custom value
    const value = 1.0;

    // Update the uniform
    setUniform(instance, uniformTarget.name, value, position);
  }, false);
});
