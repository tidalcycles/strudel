export const isNote = (name) => /^[a-gA-G][#b]*[0-9]$/.test(name);
export const tokenizeNote = (note) =>
  typeof note === 'string'
    ? note
        .match(/^([a-gA-G])([#b]*)([0-9])?$/)
        ?.slice(1)
        ?.map((x) => (x === undefined ? '' : x)) || []
    : [];
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
