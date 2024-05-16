/*
tonleiter.test.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/tonal/test/tonleiter.test.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { describe, test, expect } from 'vitest';
import {
  Step,
  Note,
  transpose,
  pc2chroma,
  rotateChroma,
  chroma2pc,
  tokenizeChord,
  note2pc,
  note2oct,
  midi2note,
  renderVoicing,
  scaleStep,
  stepInNamedScale,
  nearestNumberIndex,
  note2midi,
} from '../tonleiter.mjs';

describe('tonleiter', () => {
  test('Step ', () => {
    expect(Step.tokenize('#11')).toEqual(['#', 11]);
    expect(Step.tokenize('b13')).toEqual(['b', 13]);
    expect(Step.tokenize('bb6')).toEqual(['bb', 6]);
    expect(Step.tokenize('b3')).toEqual(['b', 3]);
    expect(Step.tokenize('3')).toEqual(['', 3]);
    expect(Step.tokenize('10')).toEqual(['', 10]);
    // expect(Step.tokenize('asdasd')).toThrow();
    expect(Step.accidentals('b3')).toEqual(-1);
    expect(Step.accidentals('#11')).toEqual(1);
  });
  test('Note', () => {
    expect(Note.tokenize('C##')).toEqual(['C', '##']);
    expect(Note.tokenize('Bb')).toEqual(['B', 'b']);
    expect(Note.accidentals('C#')).toEqual(1);
    expect(Note.accidentals('C##')).toEqual(2);
    expect(Note.accidentals('Eb')).toEqual(-1);
    expect(Note.accidentals('Bbb')).toEqual(-2);
  });
  test('transpose', () => {
    expect(transpose('F#', '3')).toEqual('A#');
    expect(transpose('C', '3')).toEqual('E');
    expect(transpose('D', '3')).toEqual('F#');
    expect(transpose('E', '3')).toEqual('G#');
    expect(transpose('Eb', '3')).toEqual('G');
    expect(transpose('Ebb', '3')).toEqual('Gb');
  });
  test('pc2chroma', () => {
    expect(pc2chroma('C')).toBe(0);
    expect(pc2chroma('C#')).toBe(1);
    expect(pc2chroma('C##')).toBe(2);
    expect(pc2chroma('D')).toBe(2);
    expect(pc2chroma('Db')).toBe(1);
    expect(pc2chroma('Dbb')).toBe(0);
    expect(pc2chroma('bb')).toBe(10);
    expect(pc2chroma('f')).toBe(5);
    expect(pc2chroma('c')).toBe(0);
  });
  test('rotateChroma', () => {
    expect(rotateChroma(0, 1)).toBe(1);
    expect(rotateChroma(0, -1)).toBe(11);
    expect(rotateChroma(11, 1)).toBe(0);
    expect(rotateChroma(11, 13)).toBe(0);
  });
  test('chroma2pc', () => {
    expect(chroma2pc(0)).toBe('C');
    expect(chroma2pc(1)).toBe('Db');
    expect(chroma2pc(1, true)).toBe('C#');
    expect(chroma2pc(2)).toBe('D');
    expect(chroma2pc(3)).toBe('Eb');
  });
  test('tokenizeChord', () => {
    expect(tokenizeChord('Cm7')).toEqual(['C', 'm7', undefined]);
    expect(tokenizeChord('C#m7')).toEqual(['C#', 'm7', undefined]);
    expect(tokenizeChord('Bb^7')).toEqual(['Bb', '^7', undefined]);
    expect(tokenizeChord('Bb^7/F')).toEqual(['Bb', '^7', 'F']);
  });
  test('note2pc', () => {
    expect(note2pc('C5')).toBe('C');
    expect(note2pc('C52')).toBe('C');
    expect(note2pc('Bb3')).toBe('Bb');
    expect(note2pc('F')).toBe('F');
  });
  test('note2oct', () => {
    expect(note2oct('C5')).toBe(5);
    expect(note2oct('Bb3')).toBe(3);
    expect(note2oct('C7')).toBe(7);
    expect(note2oct('C10')).toBe(10);
  });
  test('midi2note', () => {
    expect(midi2note(60)).toBe('C4');
    expect(midi2note(61)).toBe('Db4');
    expect(midi2note(61, true)).toBe('C#4');
  });
  test('scaleStep', () => {
    expect(scaleStep([60, 63, 67], 0)).toBe(60);
    expect(scaleStep([60, 63, 67], 1)).toBe(63);
    expect(scaleStep([60, 63, 67], 2)).toBe(67);
    expect(scaleStep([60, 63, 67], 3)).toBe(72);
    expect(scaleStep([60, 63, 67], 4)).toBe(75);
    expect(scaleStep([60, 63, 67], -1)).toBe(55);
    expect(scaleStep([60, 63, 67], -2)).toBe(51);
    expect(scaleStep([60, 63, 67], -3)).toBe(48);
    expect(scaleStep([60, 63, 67], -4)).toBe(43);
  });
  test('renderVoicing', () => {
    const dictionary = {
      m7: [
        '3 7 10 14', // b3 5 b7 9
        '10 14 15 19', // b7 9 b3 5
      ],
    };
    expect(renderVoicing({ chord: 'Em7', anchor: 'Bb4', dictionary, mode: 'below' })).toEqual([
      'G3',
      'B3',
      'D4',
      'Gb4',
    ]);
    expect(renderVoicing({ chord: 'Cm7', anchor: 'D5', dictionary, mode: 'below' })).toEqual([
      'Eb4',
      'G4',
      'Bb4',
      'D5',
    ]);
    expect(renderVoicing({ chord: 'Cm7', anchor: 'G5', dictionary, mode: 'below' })).toEqual([
      'Bb4',
      'D5',
      'Eb5',
      'G5',
    ]);
    expect(renderVoicing({ chord: 'Cm7', anchor: 'g5', dictionary, mode: 'below' })).toEqual([
      'Bb4',
      'D5',
      'Eb5',
      'G5',
    ]);
    expect(renderVoicing({ chord: 'Cm7', anchor: 'g5', dictionary, mode: 'below', n: 0 })).toEqual([70]); // Bb4
    expect(renderVoicing({ chord: 'Cm7', anchor: 'g5', dictionary, mode: 'below', n: 1 })).toEqual([74]); // D5
    expect(renderVoicing({ chord: 'Cm7', anchor: 'g5', dictionary, mode: 'below', n: 4 })).toEqual([82]); // Bb5
    expect(renderVoicing({ chord: 'Cm7', anchor: 'g5', dictionary, mode: 'below', offset: 1 })).toEqual([
      'Eb5',
      'G5',
      'Bb5',
      'D6',
    ]);
    // expect(voiceBelow('G4', 'Cm7', voicingDictionary)).toEqual(['Bb3', 'D4', 'Eb4', 'G4']);
    // TODO: test with offset
  });
  test('nearestNumber', () => {
    expect(nearestNumberIndex(0, [0, 2, 4, 5])).toEqual(0);
    expect(nearestNumberIndex(1, [0, 2, 4, 5])).toEqual(0);
    expect(nearestNumberIndex(1, [0, 2, 4, 5], true)).toEqual(1);
    expect(nearestNumberIndex(2, [0, 2, 4, 5])).toEqual(1);
    expect(nearestNumberIndex(2, [0, 2, 4, 5]), true).toEqual(1);
    expect(nearestNumberIndex(3, [0, 2, 4, 5])).toEqual(1);
    expect(nearestNumberIndex(3, [0, 2, 4, 5], true)).toEqual(2);
    expect(nearestNumberIndex(4, [0, 2, 4, 5])).toEqual(2);
  });
  test('stepInNamedScale', () => {
    expect(stepInNamedScale(1, 'D major')).toEqual(note2midi('E3'));
    expect(stepInNamedScale(2, 'E major')).toEqual(note2midi('G#3'));
    expect(stepInNamedScale(0, 'D major', 'E3')).toEqual(note2midi('E3'));
    expect(stepInNamedScale(0, 'D major', 'E4')).toEqual(note2midi('E4'));
    expect(stepInNamedScale(0, 'D major', 'Eb4')).toEqual(note2midi('D4'));
    expect(stepInNamedScale(0, 'D major', 'F4')).toEqual(note2midi('E4'));
    expect(stepInNamedScale(0, 'D major', 'F#4')).toEqual(note2midi('F#4'));
    expect(stepInNamedScale(0, 'D major', 'G4')).toEqual(note2midi('G4'));

    expect(stepInNamedScale(0, 'F major', 'F4')).toEqual(note2midi('F4'));
    expect(stepInNamedScale(0, 'F major', 'G4')).toEqual(note2midi('G4'));
    expect(stepInNamedScale(0, 'F major', 'A4')).toEqual(note2midi('A4'));
    expect(stepInNamedScale(0, 'F major', 'Bb4')).toEqual(note2midi('Bb4'));
    expect(stepInNamedScale(0, 'F major', 'C4')).toEqual(note2midi('C4'));

    expect(stepInNamedScale(1, 'F major', 'C4')).toEqual(note2midi('D4'));
    expect(stepInNamedScale(1, 'F major', 'C3')).toEqual(note2midi('D3'));
    expect(stepInNamedScale(1, 'F minor', 'D4')).toEqual(note2midi('Eb4'));
  });
});
