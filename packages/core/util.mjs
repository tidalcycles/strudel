// returns true if the given string is a note
export const isNote = (name) => /^[a-gA-G][#b]*[0-9]$/.test(name);
export const tokenizeNote = (note) => {
  if (typeof note !== 'string') {
    return [];
  }
  const [pc, acc = '', oct] = note.match(/^([a-gA-G])([#b]*)([0-9])?$/)?.slice(1) || [];
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
  const offset = acc?.split('').reduce((o, char) => o + { '#': 1, b: -1 }[char], 0) || 0;
  return (Number(oct) + 1) * 12 + chroma + offset;
};
export const fromMidi = (n) => {
  return Math.pow(2, (n - 69) / 12) * 440;
};

// modulo that works with negative numbers e.g. mod(-1, 3) = 2
// const mod = (n: number, m: number): number => (n < 0 ? mod(n + m, m) : n % m);
export const mod = (n, m) => (n < 0 ? mod(n + m, m) : n % m);

export const getPlayableNoteValue = (event) => {
  let { value: note, context } = event;
  // if value is number => interpret as midi number as long as its not marked as frequency
  if (typeof note === 'number' && context.type !== 'frequency') {
    note = fromMidi(event.value);
  } else if (typeof note === 'string' && !isNote(note)) {
    throw new Error('not a note: ' + note);
  }
  return note;
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

// this functions just makes sure non objects values are wrapped in { value }
export function objectify(value) {
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value; // do nothing if its already an object
  }
  return { value };
}

// maybe move this to osc?
// turns value into object that is the right format superdirt osc
export function dirtify(val) {
  const obj = objectify(val);
  if (obj.n && typeof obj.n === 'string') {
    return { ...obj, ...objectify(obj.n) };
  }
  const { value, ...rest } = obj;
  if (typeof value === 'undefined') {
    return rest;
  }
  const isNumber = typeof value === 'number';
  const isMidi = typeof value === 'string' && isNote(value);
  if (isNumber || isMidi) {
    const numberOffset = -60; // tidal 0 = midi 60
    const n = (isNumber ? value : toMidi(value)) + numberOffset;
    if (rest.n) {
      console.warn(`dirtify: n is already defined as "${rest.n}", overwriting with value "${n}"`);
    }
    return { ...rest, n };
  }
  if (typeof value === 'string') {
    // not a note => should be a sound
    return { ...rest, s: value };
  }
  console.warn(`dirtify: ignored value "${value}"`);
  // what lands here?
  // throw new Error('cannot objectify: ' + value);
  return {};
}
