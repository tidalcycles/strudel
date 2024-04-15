import { isNote, isNoteWithOctave, _mod, noteToMidi, tokenizeNote } from '@strudel/core';
import { Interval, Scale } from '@tonaljs/tonal';

// https://codesandbox.io/s/stateless-voicings-g2tmz0?file=/src/lib.js:0-2515

const flats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const pcs = ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'];
const sharps = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const accs = { b: -1, '#': 1 };

export const pc2chroma = (pc) => {
  const [letter, ...rest] = pc.split('');
  return pcs.indexOf(letter.toLowerCase()) + rest.reduce((sum, sign) => sum + accs[sign], 0);
};

export const rotateChroma = (chroma, steps) => (chroma + (steps % 12) + 12) % 12;

export const chroma2pc = (chroma, sharp = false) => {
  return (sharp ? sharps : flats)[chroma];
};

export function tokenizeChord(chord) {
  const match = (chord || '').match(/^([A-G][b#]*)([^/]*)[/]?([A-G][b#]*)?$/);
  if (!match) {
    // console.warn('could not tokenize chord', chord);
    return [];
  }
  return match.slice(1);
}
export const note2pc = (note) => note.match(/^[A-G][#b]?/i)[0];
export const note2oct = (note) => tokenizeNote(note)[2];
export const note2midi = noteToMidi;

export const note2chroma = (note) => {
  return pc2chroma(note2pc(note));
};

// TODO: test
export const midi2chroma = (midi) => midi % 12;

// TODO: test and use in voicing function
export const pitch2chroma = (x, defaultOctave) => {
  if (isNoteWithOctave(x)) {
    return note2chroma(x);
  }
  if (isNote(x)) {
    //pc
    return pc2chroma(x, defaultOctave);
  }
  if (typeof x === 'number') {
    // expect midi
    return midi2chroma(x);
  }
};

export const step2semitones = (x) => {
  let num = Number(x);
  if (!isNaN(num)) {
    return num;
  }
  return Interval.semitones(x);
};

export const x2midi = (x, defaultOctave) => {
  if (typeof x === 'number') {
    return x;
  }
  if (typeof x === 'string') {
    return noteToMidi(x, defaultOctave);
  }
};

// duplicate: util.mjs (does not support sharp flag)
export const midi2note = (midi, sharp = false) => {
  const oct = Math.floor(midi / 12) - 1;
  const pc = (sharp ? sharps : flats)[midi % 12];
  return pc + oct;
};

export function scaleStep(notes, offset, octaves = 1) {
  notes = notes.map((note) => (typeof note === 'string' ? noteToMidi(note) : note));
  const octOffset = Math.floor(offset / notes.length) * octaves * 12;
  offset = _mod(offset, notes.length);
  return notes[offset] + octOffset;
}

export function nearestNumberIndex(target, numbers, preferHigher) {
  let bestIndex = 0,
    bestDiff = Infinity;
  numbers.forEach((s, i) => {
    const diff = Math.abs(s - target);
    // preferHigher only works if numbers are sorted in ascending order!
    if ((!preferHigher && diff < bestDiff) || (preferHigher && diff <= bestDiff)) {
      bestIndex = i;
      bestDiff = diff;
    }
  });
  return bestIndex;
}

let scaleSteps = {}; // [scaleName]: semitones[]

export function stepInNamedScale(step, scale, anchor, preferHigher) {
  let [root, scaleName] = Scale.tokenize(scale);
  const rootMidi = x2midi(root);
  const rootChroma = midi2chroma(rootMidi);
  if (!scaleSteps[scaleName]) {
    let { intervals } = Scale.get(`C ${scaleName}`);
    // cache result
    scaleSteps[scaleName] = intervals.map(step2semitones);
  }
  const steps = scaleSteps[scaleName];
  if (!steps) {
    return null;
  }
  let transpose = rootMidi;
  if (anchor) {
    anchor = x2midi(anchor, 3);
    const anchorChroma = midi2chroma(anchor);
    const anchorDiff = _mod(anchorChroma - rootChroma, 12);
    const zeroIndex = nearestNumberIndex(anchorDiff, steps, preferHigher);
    step = step + zeroIndex;
    transpose = anchor - anchorDiff;
  }
  const octOffset = Math.floor(step / steps.length) * 12;
  step = _mod(step, steps.length);
  const targetMidi = steps[step] + transpose;
  return targetMidi + octOffset;
}

// different ways to resolve the note to compare the anchor to (see renderVoicing)
let modeTarget = {
  below: (v) => v.slice(-1)[0],
  duck: (v) => v.slice(-1)[0],
  above: (v) => v[0],
  root: (v) => v[0],
};

export function renderVoicing({ chord, dictionary, offset = 0, n, mode = 'below', anchor = 'c5', octaves = 1 }) {
  const [root, symbol] = tokenizeChord(chord);
  const rootChroma = pc2chroma(root);
  anchor = x2midi(anchor?.note || anchor, 4);
  const anchorChroma = midi2chroma(anchor);
  const voicings = dictionary[symbol].map((voicing) =>
    (typeof voicing === 'string' ? voicing.split(' ') : voicing).map(step2semitones),
  );

  let minDistance, bestIndex;
  // calculate distances up from voicing top notes
  let chromaDiffs = voicings.map((v, i) => {
    const targetStep = modeTarget[mode](v);
    const diff = _mod(anchorChroma - targetStep - rootChroma, 12);
    if (minDistance === undefined || diff < minDistance) {
      minDistance = diff;
      bestIndex = i;
    }
    return diff;
  });
  if (mode === 'root') {
    bestIndex = 0;
  }

  const octDiff = Math.ceil(offset / voicings.length) * 12;
  const indexWithOffset = _mod(bestIndex + offset, voicings.length);
  const voicing = voicings[indexWithOffset];
  const targetStep = modeTarget[mode](voicing);
  const anchorMidi = anchor - chromaDiffs[indexWithOffset] + octDiff;

  const voicingMidi = voicing.map((v) => anchorMidi - targetStep + v);
  let notes = voicingMidi.map((n) => midi2note(n));

  if (mode === 'duck') {
    notes = notes.filter((_, i) => voicingMidi[i] !== anchor);
  }
  if (n !== undefined) {
    return [scaleStep(notes, n, octaves)];
  }
  return notes;
}

// https://github.com/tidalcycles/strudel/blob/14184993d0ee7d69c47df57ac864a1a0f99a893f/packages/tonal/tonleiter.mjs
const steps = [1, 0, 2, 0, 3, 4, 0, 5, 0, 6, 0, 7];
const notes = ['C', '', 'D', '', 'E', 'F', '', 'G', '', 'A', '', 'B'];
const noteLetters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

export const accidentalOffset = (accidentals) => {
  return accidentals.split('#').length - accidentals.split('b').length;
};

const accidentalString = (offset) => {
  if (offset < 0) {
    return 'b'.repeat(-offset);
  }
  if (offset > 0) {
    return '#'.repeat(offset);
  }
  return '';
};

export const Step = {
  tokenize(step) {
    const matches = step.match(/^([#b]*)([1-9][0-9]*)$/);
    if (!matches) {
      throw new Error(`Step.tokenize: not a valid step: ${step}`);
    }
    const [accidentals, stepNumber] = matches.slice(1);
    return [accidentals, parseInt(stepNumber)];
  },
  accidentals(step) {
    return accidentalOffset(Step.tokenize(step)[0]);
  },
};

export const Note = {
  // TODO: support octave numbers
  tokenize(note) {
    return [note[0], note.slice(1)];
  },
  accidentals(note) {
    return accidentalOffset(this.tokenize(note)[1]);
  },
};

// TODO: support octave numbers
export function transpose(note, step) {
  // example: E, 3
  const stepNumber = Step.tokenize(step)[1]; // 3
  const noteLetter = Note.tokenize(note)[0]; // E
  const noteIndex = noteLetters.indexOf(noteLetter); // 2 "E is C+2"
  const targetNote = noteLetters[(noteIndex + stepNumber - 1) % 8]; // G "G is a third above E"
  const rootIndex = notes.indexOf(noteLetter); // 4 "E is 4 semitones above C"
  const targetIndex = notes.indexOf(targetNote); // 7 "G is 7 semitones above C"
  const indexOffset = targetIndex - rootIndex; // 3 (E to G is normally a 3 semitones)
  const stepIndex = steps.indexOf(stepNumber); // 4 ("3" is normally 4 semitones)
  const offsetAccidentals = accidentalString(Step.accidentals(step) + Note.accidentals(note) + stepIndex - indexOffset); // "we need to add a # to to the G to make it a major third from E"
  return [targetNote, offsetAccidentals].join('');
}

//Note("Bb3").transpose("c3")
