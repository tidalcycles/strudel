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
