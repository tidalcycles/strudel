/*
tonal.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/tonal/tonal.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Note, Interval, Scale } from '@tonaljs/tonal';
import { register, _mod } from '@strudel.cycles/core';

// transpose note inside scale by offset steps
// function scaleOffset(scale: string, offset: number, note: string) {
function scaleOffset(scale, offset, note) {
  let [tonic, scaleName] = Scale.tokenize(scale);
  let { notes } = Scale.get(`${tonic} ${scaleName}`);
  notes = notes.map((note) => Note.get(note).pc); // use only pc!
  offset = Number(offset);
  if (isNaN(offset)) {
    throw new Error(`scale offset "${offset}" not a number`);
  }
  const { pc: fromPc, oct = 3 } = Note.get(note);
  const noteIndex = notes.indexOf(fromPc);
  if (noteIndex === -1) {
    throw new Error(`note "${note}" is not in scale "${scale}"`);
  }
  let i = noteIndex,
    o = oct,
    n = fromPc;
  const direction = Math.sign(offset);
  // TODO: find way to do this smarter
  while (Math.abs(i - noteIndex) < Math.abs(offset)) {
    i += direction;
    const index = _mod(i, notes.length);
    if (direction < 0 && n[0] === 'C') {
      o += direction;
    }
    n = notes[index];
    if (direction > 0 && n[0] === 'C') {
      o += direction;
    }
  }
  return n + o;
}

// Pattern.prototype._transpose = function (intervalOrSemitones: string | number) {
/**
 * Change the pitch of each value by the given amount. Expects numbers or note strings as values.
 * The amount can be given as a number of semitones or as a string in interval short notation.
 * If you don't care about enharmonic correctness, just use numbers. Otherwise, pass the interval of
 * the form: ST where S is the degree number and T the type of interval with
 *
 * - M = major
 * - m = minor
 * - P = perfect
 * - A = augmented
 * - d = diminished
 *
 * Examples intervals:
 *
 * - 1P = unison
 * - 3M = major third
 * - 3m = minor third
 * - 4P = perfect fourth
 * - 4A = augmented fourth
 * - 5P = perfect fifth
 * - 5d = diminished fifth
 *
 * @param {string | number} amount Either number of semitones or interval string.
 * @returns Pattern
 * @memberof Pattern
 * @name transpose
 * @example
 * "c2 c3".fast(2).transpose("<0 -2 5 3>".slow(2)).note()
 * @example
 * "c2 c3".fast(2).transpose("<1P -2M 4P 3m>".slow(2)).note()
 */

export const transpose = register('transpose', function (intervalOrSemitones, pat) {
  return pat.withHap((hap) => {
    const interval = !isNaN(Number(intervalOrSemitones))
      ? Interval.fromSemitones(intervalOrSemitones /*  as number */)
      : String(intervalOrSemitones);
    if (typeof hap.value === 'number') {
      const semitones = typeof interval === 'string' ? Interval.semitones(interval) || 0 : interval;
      return hap.withValue(() => hap.value + semitones);
    }
    // TODO: move simplify to player to preserve enharmonics
    // tone.js doesn't understand multiple sharps flats e.g. F##3 has to be turned into G3
    return hap.withValue(() => Note.simplify(Note.transpose(hap.value, interval)));
  });
});

// example: transpose(3).late(0.2) will be equivalent to compose(transpose(3), late(0.2))
// e.g. `stack(c3).superimpose(transpose(slowcat(7, 5)))` or
// or even `stack(c3).superimpose(transpose.slowcat(7, 5))` or

/**
 * Transposes notes inside the scale by the number of steps.
 * Expected to be called on a Pattern which already has a {@link Pattern#scale}
 *
 * @memberof Pattern
 * @name scaleTranspose
 * @param {offset} offset number of steps inside the scale
 * @returns Pattern
 * @example
 * "-8 [2,4,6]"
 * .scale('C4 bebop major')
 * .scaleTranspose("<0 -1 -2 -3 -4 -5 -6 -4>")
 * .note()
 */

export const scaleTranspose = register('scaleTranspose', function (offset /* : number | string */, pat) {
  return pat.withHap((hap) => {
    if (!hap.context.scale) {
      throw new Error('can only use scaleTranspose after .scale');
    }
    if (typeof hap.value !== 'string') {
      throw new Error('can only use scaleTranspose with notes');
    }
    return hap.withValue(() => scaleOffset(hap.context.scale, Number(offset), hap.value));
  });
});

/**
 * Turns numbers into notes in the scale (zero indexed). Also sets scale for other scale operations, like {@link Pattern#scaleTranspose}.
 *
 * A scale consists of a root note (e.g. `c4`, `c`, `f#`, `bb4`) followed by semicolon (':') and then a [scale type](https://github.com/tonaljs/tonal/blob/main/packages/scale-type/data.ts).
 *
 * The root note defaults to octave 3, if no octave number is given.
 *
 * @memberof Pattern
 * @name scale
 * @param {string} scale Name of scale
 * @returns Pattern
 * @example
 * "0 2 4 6 4 2".scale("C2:major").note()
 * @example
 * "0 2 4 6 4 2"
 * .scale("C2:<major minor>")
 * .note()
 * @example
 * "0 1 2 3 4 5 6 7".rev().scale("C2:<major minor>").note()
 * .s("folkharp")
 */

export const scale = register('scale', function (scale, pat) {
  // Supports ':' list syntax in mininotation
  if (Array.isArray(scale)) {
    scale = scale.join(' ');
  }
  return pat.withHap((hap) => {
    const isObject = typeof hap.value === 'object';
    let note = isObject ? hap.value.n : hap.value;
    const asNumber = Number(note);
    if (!isNaN(asNumber)) {
      // TODO: worth keeping for supporting ':' in (non-mininotation) strings?
      scale = scale.replaceAll(':', ' ');
      scale = scale.replaceAll(',', ' ');
      let [tonic, scaleName] = Scale.tokenize(scale);
      const { pc, oct = 3 } = Note.get(tonic);
      note = scaleOffset(pc + ' ' + scaleName, asNumber, pc + oct);
    }
    return hap.withValue(() => (isObject ? { ...hap.value, note } : note)).setContext({ ...hap.context, scale });
  });
});
