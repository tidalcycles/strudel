/*
uniform.mjs - implements the `uniform` pattern function
Copyright (C) 2024 Strudel contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern, reify, register, logger } from '@strudel/core';
import { setUniform } from './shader.mjs';

/**
 * Update a shader.
 *
 * @name uniform
 * @example
 * pan(sine.uniform("iColor"))
 * @example
 * gain("<.5 .3>".uniform("rotations:seq"))
 * @example
 * s("bd sd").uniform({onTrigger: true, dest: "moveFWD"})
 */
export const uniform = register('uniform', (options, pat) => {
  // The shader instance name
  const instance = options.instance || 'default';

  // Are the uniform updated on trigger
  const onTrigger = options.onTrigger || false;

  const setCtx = (uniformParam) => (ctx) => ({
    uniformParam,
    onTrigger: () => {},
    dominantTrigger: true,
    ...ctx,
  });

  const pitches = { _count: 0 };
  const getPosition = (value, dest) => {
    if (typeof dest === 'number') return dest;
    else if (dest == 'seq') return pitches._count++;
    else if (dest == 'random') return Math.floor(Math.random() * 1024);
    else if (onTrigger) {
      const note = value.note || value.n || value.sound || value.s;
      if (pitches[note] === undefined) {
        // Assign new value, the first note gets 0, then 1, then 2, ...
        pitches[note] = Object.keys(pitches).length - 1;
      }
      return pitches[note];
    } else {
      throw 'Invalid position' + dest;
    }
  };
  const getUniformPosition = (value, dest) => {
    if (typeof dest === 'string') {
      return [dest, 0];
    } else {
      return [dest[0], getPosition(value, dest[1])];
    }
  };

  const optionsPats = [];
  if (Array.isArray(options) || typeof options === 'string')
    optionsPats.push(reify(options).withContext(setCtx('dest')));
  else {
    if (options.dest) optionsPats.push(reify(options.dest).withContext(setCtx('dest')));
    if (options.gain) optionsPats.push(reify(options.gain).withContext(setCtx('gain')));
    if (options.slow) optionsPats.push(reify(options.slow).withContext(setCtx('slow')));
  }
  return stack(pat, ...optionsPats).withHaps((haps) => {
    let dest;
    let gain = 1;
    let slow = 10;
    let source;
    haps.forEach((hap) => {
      if (hap.context.uniformParam == 'dest') {
        dest = hap.value;
      } else if (hap.context.uniformParam == 'gain') {
        gain = hap.value;
      } else if (hap.context.uniformParam == 'slow') {
        slow = hap.value;
      } else {
        source = hap;
      }
    });
    if (dest && source) {
      if (onTrigger) {
        source.context.onTrigger = (_, hap) => {
          const [uniform, position] = getUniformPosition(hap.value, dest);
          setUniform(instance, uniform, (hap.value.gain || 1) * gain, true, position, slow);
        };
        source.context.dominantTrigger = false;
      } else {
        const [uniform, position] = getUniformPosition(source.value, dest);
        setUniform(instance, uniform, source.value * gain, false, position, slow);
      }
    }
    return haps;
  });
});
