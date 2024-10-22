/*
uniform.mjs - implements the `uniform` pattern function
Copyright (C) 2024 Strudel contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { stack, reify, register, logger } from '@strudel/core';
import { setUniform } from './shader.mjs';

/**
 * Update a shader uniform value. A uniform name consists of
 *
 * - a name
 * - optional array position seperated by ':'. The position can be an index number, or 'seq' | 'random' to assign a different index per events.
 *
 * The uniform can also be configured with an object to pass extra options:
 *
 * @name uniform
 * @param {string} name: the uniform name and optional position.
 * @param {number} gain: the value multiplier - defaults to 1.
 * @param {number} slow: the value change rate, set to 1 for instant update - defaults to 10.
 * @param {boolean} onTrigger: update the uniform only when the pattern trigger. In that case, the uniform position is mapped to the event note/sound when it is not explicity set. onTrigger is automatically set when the pattern value is not a number.
 *
 * @example
 * pan(sine.uniform("iColor"))
 * @example
 * gain(".5 .3").uniform("mod:0 mod:1")
 * @example
 * dist("<.5 .3>".uniform("rotations:seq"))
 * @example
 * s("bd sd").uniform({name: 'rotations', gain: 0.2, slow: "<5 20>"})
 */
export const uniform = register('uniform', (options, pat) => {
  // The shader instance name
  const instance = options.instance || 'default';

  // Are the uniform updated on trigger
  const onTrigger = options.onTrigger || false;

  // Helper to assign uniform position
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
      logger('Invalid position' + dest, 'error');
    }
  };
  // Helper to decode the uniform position
  const getUniformPosition = (value, dest) => {
    if (typeof dest === 'string') {
      return [dest, 0];
    } else {
      return [dest[0], getPosition(value, dest[1])];
    }
  };

  // The option pattern context
  const setCtx = (uniformParam) => (ctx) => ({
    // The option name
    uniformParam,
    // Disable event trigger
    onTrigger: () => {},
    dominantTrigger: true,
    ...ctx,
  });

  // Collect the option patterns
  const optionsPats = [];
  if (Array.isArray(options) || typeof options === 'string')
    optionsPats.push(reify(options).withContext(setCtx('dest')));
  else {
    // dest was the initial name, that can be removed
    if (options.dest) optionsPats.push(reify(options.dest).withContext(setCtx('dest')));
    if (options.name) optionsPats.push(reify(options.name).withContext(setCtx('dest')));
    if (options.gain) optionsPats.push(reify(options.gain).withContext(setCtx('gain')));
    if (options.slow) optionsPats.push(reify(options.slow).withContext(setCtx('slow')));
  }

  // Run the base pattern along with all the options
  return stack(pat, ...optionsPats).withHaps((haps) => {
    // Collect the current options
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
      if (typeof source.value !== 'number' || onTrigger) {
        // Set the uniform when the source trigger
        source.context.onTrigger = (_, hap) => {
          const [uniform, position] = getUniformPosition(hap.value, dest);
          setUniform(instance, uniform, (hap.value.gain || 1) * gain, true, position, slow);
        };
        source.context.dominantTrigger = false;
      } else {
        // Set the uniform now.
        const [uniform, position] = getUniformPosition(source.value, dest);
        setUniform(instance, uniform, source.value * gain, false, position, slow);
      }
    }

    // The options haps are kept so that the current values are highlighted on screen
    return haps;
  });
});
