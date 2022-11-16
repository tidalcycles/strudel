import { Pattern, toMidi } from '@strudel.cycles/core';
import { samples } from '@strudel.cycles/webaudio';

export async function prebake({ isMock = false, baseDir = '.' } = {}) {
  if (!isMock) {
    // https://archive.org/details/SalamanderGrandPianoV3
    // License: CC-by http://creativecommons.org/licenses/by/3.0/ Author: Alexander Holm
    return await Promise.all([
      samples('piano.json', `${baseDir}/piano/`),
      // https://github.com/sgossner/VCSL/
      // https://api.github.com/repositories/126427031/contents/
      // LICENSE: CC0 general-purpose
      samples('vcsl.json', 'github:sgossner/VCSL/master/'),
      samples('tidal-drum-machines.json', 'github:ritchse/tidal-drum-machines/main/machines/'),
      samples('EmuSP12.json', `${baseDir}/EmuSP12/`),
    ]);
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
