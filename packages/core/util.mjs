/*
util.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/util.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { logger } from './logger.mjs';

// returns true if the given string is a note
export const isNoteWithOctave = (name) => /^[a-gA-G][#bs]*[0-9]$/.test(name);
export const isNote = (name) => /^[a-gA-G][#bsf]*[0-9]?$/.test(name);
export const tokenizeNote = (note) => {
  if (typeof note !== 'string') {
    return [];
  }
  const [pc, acc = '', oct] = note.match(/^([a-gA-G])([#bsf]*)([0-9]*)$/)?.slice(1) || [];
  if (!pc) {
    return [];
  }
  return [pc, acc, oct ? Number(oct) : undefined];
};

const chromas = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const accs = { '#': 1, b: -1, s: 1, f: -1 };

// turns the given note into its midi number representation
export const noteToMidi = (note, defaultOctave = 3) => {
  const [pc, acc, oct = defaultOctave] = tokenizeNote(note);
  if (!pc) {
    throw new Error('not a note: "' + note + '"');
  }
  const chroma = chromas[pc.toLowerCase()];
  const offset = acc?.split('').reduce((o, char) => o + accs[char], 0) || 0;
  return (Number(oct) + 1) * 12 + chroma + offset;
};
export const midiToFreq = (n) => {
  return Math.pow(2, (n - 69) / 12) * 440;
};

export const freqToMidi = (freq) => {
  return (12 * Math.log(freq / 440)) / Math.LN2 + 69;
};

export const valueToMidi = (value, fallbackValue) => {
  if (typeof value !== 'object') {
    throw new Error('valueToMidi: expected object value');
  }
  let { freq, note } = value;
  if (typeof freq === 'number') {
    return freqToMidi(freq);
  }
  if (typeof note === 'string') {
    return noteToMidi(note);
  }
  if (typeof note === 'number') {
    return note;
  }
  if (!fallbackValue) {
    throw new Error('valueToMidi: expected freq or note to be set');
  }
  return fallbackValue;
};

// used to schedule external event like midi and osc out
export const getEventOffsetMs = (targetTimeSeconds, currentTimeSeconds) => {
  return (targetTimeSeconds - currentTimeSeconds) * 1000;
};

/**
 * @deprecated does not appear to be referenced or invoked anywhere in the codebase
 * @noAutocomplete
 */
export const getFreq = (noteOrMidi) => {
  if (typeof noteOrMidi === 'number') {
    return midiToFreq(noteOrMidi);
  }
  return midiToFreq(noteToMidi(noteOrMidi));
};

const pcs = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
/**
 * @deprecated only used in workshop (first-notes)
 * @noAutocomplete
 */
export const midi2note = (n) => {
  const oct = Math.floor(n / 12) - 1;
  const pc = pcs[n % 12];
  return pc + oct;
};

// modulo that works with negative numbers e.g. _mod(-1, 3) = 2. Works on numbers (rather than patterns of numbers, as @mod@ from pattern.mjs does)
export const _mod = (n, m) => ((n % m) + m) % m;

// average numbers in an array
export const averageArray = (arr) => arr.reduce((a, b) => a + b) / arr.length;

export function nanFallback(value, fallback = 0) {
  if (isNaN(Number(value))) {
    logger(`"${value}" is not a number, falling back to ${fallback}`, 'warning');
    return fallback;
  }
  return value;
}
// round to nearest int, negative numbers will output a subtracted index
export const getSoundIndex = (n, numSounds) => {
  return _mod(Math.round(nanFallback(n ?? 0, 0)), numSounds);
};

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
    note = midiToFreq(hap.value);
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
    value = midiToFreq(hap.value);
  } else if (typeof value === 'string' && isNote(value)) {
    value = midiToFreq(noteToMidi(hap.value));
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

export function curry(func, overload, arity = func.length) {
  const fn = function curried(...args) {
    if (args.length >= arity) {
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
    return noteToMidi(numOrString);
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

export const splitAt = function (index, value) {
  return [value.slice(0, index), value.slice(index)];
};

export const zipWith = (f, xs, ys) => xs.map((n, i) => f(n, ys[i]));

export const pairs = function (xs) {
  const result = [];
  for (let i = 0; i < xs.length - 1; ++i) {
    result.push([xs[i], xs[i + 1]]);
  }
  return result;
};

export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

/* solmization, not used yet */
const solfeggio = ['Do', 'Reb', 'Re', 'Mib', 'Mi', 'Fa', 'Solb', 'Sol', 'Lab', 'La', 'Sib', 'Si']; /*solffegio notes*/
const indian = [
  'Sa',
  'Re',
  'Ga',
  'Ma',
  'Pa',
  'Dha',
  'Ni',
]; /*indian musical notes,  seems like they do not use flats or sharps*/
const german = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Hb', 'H']; /*german & dutch musical notes*/
const byzantine = [
  'Ni',
  'Pab',
  'Pa',
  'Voub',
  'Vou',
  'Ga',
  'Dib',
  'Di',
  'Keb',
  'Ke',
  'Zob',
  'Zo',
]; /*byzantine musical notes*/
const japanese = [
  'I',
  'Ro',
  'Ha',
  'Ni',
  'Ho',
  'He',
  'To',
]; /*traditional japanese musical notes, seems like they do not use falts or sharps*/

const english = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export const sol2note = (n, notation = 'letters') => {
  const pc =
    notation === 'solfeggio'
      ? solfeggio /*check if its is any of the following*/
      : notation === 'indian'
        ? indian
        : notation === 'german'
          ? german
          : notation === 'byzantine'
            ? byzantine
            : notation === 'japanese'
              ? japanese
              : english; /*if not use standard version*/
  const note = pc[n % 12]; /*calculating the midi value to the note*/
  const oct = Math.floor(n / 12) - 1;
  return note + oct;
};

// Remove duplicates from list
export function uniq(a) {
  var seen = {};
  return a.filter(function (item) {
    return seen.hasOwn(item) ? false : (seen[item] = true);
  });
}

// Remove duplicates from list, sorting in the process. Mutates argument!
export function uniqsort(a) {
  return a.sort().filter(function (item, pos, ary) {
    return !pos || item != ary[pos - 1];
  });
}

// rational version
export function uniqsortr(a) {
  return a
    .sort((x, y) => x.compare(y))
    .filter(function (item, pos, ary) {
      return !pos || item.ne(ary[pos - 1]);
    });
}

// code hashing helpers

export function unicodeToBase64(text) {
  const utf8Bytes = new TextEncoder().encode(text);
  const base64String = btoa(String.fromCharCode(...utf8Bytes));
  return base64String;
}

export function base64ToUnicode(base64String) {
  const utf8Bytes = new Uint8Array(
    atob(base64String)
      .split('')
      .map((char) => char.charCodeAt(0)),
  );
  const decodedText = new TextDecoder().decode(utf8Bytes);
  return decodedText;
}

export function code2hash(code) {
  return encodeURIComponent(unicodeToBase64(code));
  //return '#' + encodeURIComponent(btoa(code));
}

export function hash2code(hash) {
  return base64ToUnicode(decodeURIComponent(hash));
  //return atob(decodeURIComponent(codeParam || ''));
}

export function objectMap(obj, fn) {
  if (Array.isArray(obj)) {
    return obj.map(fn);
  }
  return Object.fromEntries(Object.entries(obj).map(([k, v], i) => [k, fn(v, k, i)]));
}
export function cycleToSeconds(cycle, cps) {
  return cycle / cps;
}

// utility for averaging two clocks together to account for drift
export class ClockCollator {
  constructor({
    getTargetClockTime = getUnixTimeSeconds,
    weight = 16,
    offsetDelta = 0.005,
    checkAfterTime = 2,
    resetAfterTime = 8,
  }) {
    this.offsetTime;
    this.timeAtPrevOffsetSample;
    this.prevOffsetTimes = [];
    this.getTargetClockTime = getTargetClockTime;
    this.weight = weight;
    this.offsetDelta = offsetDelta;
    this.checkAfterTime = checkAfterTime;
    this.resetAfterTime = resetAfterTime;
    this.reset = () => {
      this.prevOffsetTimes = [];
      this.offsetTime = null;
      this.timeAtPrevOffsetSample = null;
    };
  }
  calculateOffset(currentTime) {
    const targetClockTime = this.getTargetClockTime();
    const diffBetweenTimeSamples = targetClockTime - this.timeAtPrevOffsetSample;
    const newOffsetTime = targetClockTime - currentTime;
    // recalcuate the diff from scratch if the clock has been paused for some time.
    if (diffBetweenTimeSamples > this.resetAfterTime) {
      this.reset();
    }

    if (this.offsetTime == null) {
      this.offsetTime = newOffsetTime;
    }
    this.prevOffsetTimes.push(newOffsetTime);
    if (this.prevOffsetTimes.length > this.weight) {
      this.prevOffsetTimes.shift();
    }

    // after X time has passed, the average of the previous weight offset times is calculated and used as a stable reference
    // for calculating the timestamp
    if (this.timeAtPrevOffsetSample == null || diffBetweenTimeSamples > this.checkAfterTime) {
      this.timeAtPrevOffsetSample = targetClockTime;
      const rollingOffsetTime = averageArray(this.prevOffsetTimes);
      //when the clock offsets surpass the delta, set the new reference time
      if (Math.abs(rollingOffsetTime - this.offsetTime) > this.offsetDelta) {
        this.offsetTime = rollingOffsetTime;
      }
    }

    return this.offsetTime;
  }

  calculateTimestamp(currentTime, targetTime) {
    return this.calculateOffset(currentTime) + targetTime;
  }
}

export function getPerformanceTimeSeconds() {
  return performance.now() * 0.001;
}

function getUnixTimeSeconds() {
  return Date.now() * 0.001;
}

// Floating point versions, see Fraction for rational versions
// // greatest common divisor
// export const gcd = function (x, y, ...z) {
//   if (!y && z.length > 0) {
//     return gcd(x, ...z);
//   }
//   if (!y) {
//     return x;
//   }
//   return gcd(y, x % y, ...z);
// };

// // lowest common multiple
// export const lcm = function (x, y, ...z) {
//   if (z.length == 0) {
//     return (x * y) / gcd(x, y);
//   }
//   return lcm((x * y) / gcd(x, y), ...z);
// };
