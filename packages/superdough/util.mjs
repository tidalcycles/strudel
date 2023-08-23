// currently duplicate with core util.mjs to skip dependency
// TODO: add separate util module?

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
export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

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

export const getFrequency = (value) => {
  // if value is number => interpret as midi number as long as its not marked as frequency
  if (typeof value === 'object') {
    if (value.freq) {
      return value.freq;
    }
    return getFreq(value.note || value.n || value.value || 36);
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
