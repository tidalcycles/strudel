import { Pattern, toMidi } from '@strudel.cycles/core';
import { samples } from '@strudel.cycles/webaudio';

export async function prebake({ isMock = false, baseDir = '.' } = {}) {
  samples(
    {
      piano: {
        A0: 'A0v8.mp3',
        C1: 'C1v8.mp3',
        Ds1: 'Ds1v8.mp3',
        Fs1: 'Fs1v8.mp3',
        A1: 'A1v8.mp3',
        C2: 'C2v8.mp3',
        Ds2: 'Ds2v8.mp3',
        Fs2: 'Fs2v8.mp3',
        A2: 'A2v8.mp3',
        C3: 'C3v8.mp3',
        Ds3: 'Ds3v8.mp3',
        Fs3: 'Fs3v8.mp3',
        A3: 'A3v8.mp3',
        C4: 'C4v8.mp3',
        Ds4: 'Ds4v8.mp3',
        Fs4: 'Fs4v8.mp3',
        A4: 'A4v8.mp3',
        C5: 'C5v8.mp3',
        Ds4: 'Ds4v8.mp3',
        Fs5: 'Fs5v8.mp3',
        A5: 'A5v8.mp3',
        C6: 'C6v8.mp3',
        Ds6: 'Ds6v8.mp3',
        Fs6: 'Fs6v8.mp3',
        A6: 'A6v8.mp3',
        C7: 'C7v8.mp3',
        Ds7: 'Ds7v8.mp3',
        Fs7: 'Fs7v8.mp3',
        A7: 'A7v8.mp3',
        C8: 'C8v8.mp3',
      },
    },
    // https://archive.org/details/SalamanderGrandPianoV3
    // License: CC-by http://creativecommons.org/licenses/by/3.0/ Author: Alexander Holm
    `${baseDir}/piano/`,
  );
  if (!isMock) {
    await fetch('EmuSP12.json')
      .then((res) => res.json())
      .then((json) => samples(json, `${baseDir}/EmuSP12/`));
  }
}

const maxPan = toMidi('C8');
const panwidth = (pan, width) => pan * width + (1 - width) / 2;

Pattern.prototype.piano = function () {
  return this.clip(1)
    .s('piano')
    .release(0.1)
    .fmap((value) => {
      const midi = typeof value.note === 'string' ? toMidi(value.note) : value.note;
      // pan by pitch
      const pan = panwidth(Math.min(midi / maxPan, 1), 0.5);
      return { ...value, pan: (value.pan || 1) * pan };
    });
};
