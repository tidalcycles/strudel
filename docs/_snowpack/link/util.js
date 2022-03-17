export const isNote = (name) => /^[a-gA-G][#b]*[0-9]$/.test(name);
export const tokenizeNote = (note) => {
  if (typeof note !== "string") {
    return [];
  }
  const [pc, acc = "", oct] = note.match(/^([a-gA-G])([#b]*)([0-9])?$/)?.slice(1) || [];
  if (!pc) {
    return [];
  }
  return [pc, acc, oct ? Number(oct) : void 0];
};
export const toMidi = (note) => {
  const [pc, acc, oct] = tokenizeNote(note);
  if (!pc) {
    throw new Error('not a note: "' + note + '"');
  }
  const chroma = {c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11}[pc.toLowerCase()];
  const offset = acc?.split("").reduce((o, char) => o + {"#": 1, b: -1}[char], 0) || 0;
  return (Number(oct) + 1) * 12 + chroma + offset;
};
export const fromMidi = (n) => {
  return Math.pow(2, (n - 69) / 12) * 440;
};
export const mod = (n, m) => n < 0 ? mod(n + m, m) : n % m;
export const getPlayableNoteValue = (event) => {
  let {value: note, context} = event;
  if (typeof note === "number" && context.type !== "frequency") {
    note = fromMidi(event.value);
  } else if (typeof note === "string" && !isNote(note)) {
    throw new Error("not a note: " + note);
  }
  return note;
};
export const rotate = (arr, n) => arr.slice(n).concat(arr.slice(0, n));
