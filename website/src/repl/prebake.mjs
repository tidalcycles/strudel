import { Pattern, toMidi, valueToMidi } from '@strudel.cycles/core';
import { samples } from '@strudel.cycles/webaudio';

export async function prebake() {
  const { BASE_URL = '/' } = import.meta.env;
  // https://archive.org/details/SalamanderGrandPianoV3
  // License: CC-by http://creativecommons.org/licenses/by/3.0/ Author: Alexander Holm
  return await Promise.all([
    samples(`${BASE_URL}piano.json`, `${BASE_URL}piano/`),
    // https://github.com/sgossner/VCSL/
    // https://api.github.com/repositories/126427031/contents/
    // LICENSE: CC0 general-purpose
    samples(`${BASE_URL}vcsl.json`, 'github:sgossner/VCSL/master/'),
    samples(`${BASE_URL}tidal-drum-machines.json`, 'github:ritchse/tidal-drum-machines/main/machines/'),
    samples(`${BASE_URL}EmuSP12.json`, `${BASE_URL}EmuSP12/`),
    // samples('github:tidalcycles/Dirt-Samples/master'),
  ]);
}

const maxPan = toMidi('C8');
const panwidth = (pan, width) => pan * width + (1 - width) / 2;

Pattern.prototype.piano = function () {
  return this.clip(1)
    .s('piano')
    .release(0.1)
    .fmap((value) => {
      const midi = valueToMidi(value);
      // pan by pitch
      const pan = panwidth(Math.min(Math.round(midi) / maxPan, 1), 0.5);
      return { ...value, pan: (value.pan || 1) * pan };
    });
};
