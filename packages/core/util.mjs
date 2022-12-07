/*
util.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/util.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// returns true if the given string is a note
export const isNote = (name) => /^[a-gA-G][#bs]*[0-9]$/.test(name);
export const tokenizeNote = (note) => {
  if (typeof note !== 'string') {
    return [];
  }
  const [pc, acc = '', oct] = note.match(/^([a-gA-G])([#bs]*)([0-9])?$/)?.slice(1) || [];
  if (!pc) {
    return [];
  }
  return [pc, acc, oct ? Number(oct) : undefined];
};

// turns the given note into its midi number representation
export const toMidi = (note) => {
  const [pc, acc, oct] = tokenizeNote(note);
  if (!pc) {
    throw new Error('not a note: "' + note + '"');
  }
  const chroma = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 }[pc.toLowerCase()];
  const offset = acc?.split('').reduce((o, char) => o + { '#': 1, b: -1, s: 1 }[char], 0) || 0;
  return (Number(oct) + 1) * 12 + chroma + offset;
};
export const fromMidi = (n) => {
  return Math.pow(2, (n - 69) / 12) * 440;
};

/**
 * @deprecated does not appear to be referenced or invoked anywhere in the codebase
 */
export const getFreq = (noteOrMidi) => {
  if (typeof noteOrMidi === 'number') {
    return fromMidi(noteOrMidi);
  }
  return fromMidi(toMidi(noteOrMidi));
};

/**
 * @deprecated does not appear to be referenced or invoked anywhere in the codebase
 */
export const midi2note = (n) => {
  const oct = Math.floor(n / 12) - 1;
  const pc = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'][n % 12];
  return pc + oct;
};

// modulo that works with negative numbers e.g. _mod(-1, 3) = 2. Works on numbers (rather than patterns of numbers, as @mod@ from pattern.mjs does)
export const _mod = (n, m) => ((n % m) + m) % m;

export const getPlayableNoteValue = (hap) => {
  let { value, context } = hap;
  let note = value;
  if (typeof note === 'object' && !Array.isArray(note)) {
    note = note.note || note.n || note.value;
    if (note === undefined) {
      throw new Error(`cannot find a playable note for ${JSON.stringify(value)}`);
    }
  }
  // if value is number => interpret as midi number as long as its not marked as frequency
  if (typeof note === 'number' && context.type !== 'frequency') {
    note = fromMidi(hap.value);
  } else if (typeof note === 'number' && context.type === 'frequency') {
    note = hap.value; // legacy workaround.. will be removed in the future
  } else if (typeof note !== 'string' || !isNote(note)) {
    throw new Error('not a note: ' + JSON.stringify(note));
  }
  return note;
};

export const getFrequency = (hap) => {
  let { value, context } = hap;
  // if value is number => interpret as midi number as long as its not marked as frequency
  if (typeof value === 'object') {
    if (value.freq) {
      return value.freq;
    }
    return getFreq(value.note || value.n || value.value);
  }
  if (typeof value === 'number' && context.type !== 'frequency') {
    value = fromMidi(hap.value);
  } else if (typeof value === 'string' && isNote(value)) {
    value = fromMidi(toMidi(hap.value));
  } else if (typeof value !== 'number') {
    throw new Error('not a note or frequency: ' + value);
  }
  return value;
};

// rotate array by n steps (to the left)
export const rotate = (arr, n) => arr.slice(n).concat(arr.slice(0, n));

export const pipe = (...funcs) => {
  return funcs.reduce(
    (f, g) =>
      (...args) =>
        f(g(...args)),
    (x) => x,
  );
};

export const compose = (...funcs) => pipe(...funcs.reverse());

// Removes 'None' values from given list
export const removeUndefineds = (xs) => xs.filter((x) => x != undefined);

export const flatten = (arr) => [].concat(...arr);

export const id = (a) => a;
export const constant = (a, b) => a;

export const listRange = (min, max) => Array.from({ length: max - min + 1 }, (_, i) => i + min);

export function curry(func, overload) {
  const fn = function curried(...args) {
    if (args.length >= func.length) {
      return func.apply(this, args);
    } else {
      const partial = function (...args2) {
        return curried.apply(this, args.concat(args2));
      };
      if (overload) {
        overload(partial, args);
      }
      return partial;
    }
  };
  if (overload) {
    // overload function without args... needed for chordBass.transpose(2)
    overload(fn, []);
  }
  return fn;
}

export function parseNumeral(numOrString) {
  const asNumber = Number(numOrString);
  if (!isNaN(asNumber)) {
    return asNumber;
  }
  if (isNote(numOrString)) {
    return toMidi(numOrString);
  }
  throw new Error(`cannot parse as numeral: "${numOrString}"`);
}

export function mapArgs(fn, mapFn) {
  return (...args) => fn(...args.map(mapFn));
}

export function numeralArgs(fn) {
  return mapArgs(fn, parseNumeral);
}

export function parseFractional(numOrString) {
  const asNumber = Number(numOrString);
  if (!isNaN(asNumber)) {
    return asNumber;
  }
  const specialValue = {
    pi: Math.PI,
    w: 1,
    h: 0.5,
    q: 0.25,
    e: 0.125,
    s: 0.0625,
    t: 1 / 3,
    f: 0.2,
    x: 1 / 6,
  }[numOrString];
  if (typeof specialValue !== 'undefined') {
    return specialValue;
  }
  throw new Error(`cannot parse as fractional: "${numOrString}"`);
}

export const fractionalArgs = (fn) => mapArgs(fn, parseFractional);
