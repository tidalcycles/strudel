const steps = [1, 0, 2, 0, 3, 4, 0, 5, 0, 6, 0, 7];
const notes = ['C', '', 'D', '', 'E', 'F', '', 'G', '', 'A', '', 'B'];
const noteLetters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

const accidentalOffset = (accidentals) => {
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
    const [accidentals, stepNumber] = step.match(/^([#b]*)([1-9]+)$/).slice(1);
    return [accidentals, parseInt(stepNumber)];
  },
  accidentals(step) {
    return accidentalOffset(Step.tokenize(step)[0]);
  },
};

Step.tokenize('#11');
Step.tokenize('b13');
Step.tokenize('bb6');
Step.accidentals('3');
Step.accidentals('b3');

export const Note = {
  // TODO: support octave numbers
  tokenize(note) {
    return [note[0], note.slice(1)];
  },
  accidentals(note) {
    return accidentalOffset(this.tokenize(note)[1]);
  },
};

Note.tokenize('C##');
Note.accidentals('C#');
Note.accidentals('C##');
Note.accidentals('Eb');
Note.accidentals('Bbb');

// TODO: support octave numbers
function transpose(note, step) {
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

transpose('F#', '3');
transpose('C', '3');
transpose('D', '3');
transpose('E', '3');
transpose('Eb', '3');
transpose('Ebb', '3');
