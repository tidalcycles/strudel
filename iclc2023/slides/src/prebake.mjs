import { Pattern, noteToMidi, valueToMidi } from '@strudel.cycles/core';
import { registerSynthSounds, samples } from '@strudel.cycles/webaudio';

export async function prebake() {
  // https://archive.org/details/SalamanderGrandPianoV3
  // License: CC-by http://creativecommons.org/licenses/by/3.0/ Author: Alexander Holm
  registerSynthSounds();
  //registerSoundfonts();
  await Promise.all([
    /* samples(`./piano.json`, `./piano/`, { prebake: true }),
    samples(`./vcsl.json`, 'github:sgossner/VCSL/master/', { prebake: true }),
    samples(`./tidal-drum-machines.json`, 'github:ritchse/tidal-drum-machines/main/machines/', {
      prebake: true,
      tag: 'drum-machines',
    }),
    samples(`./EmuSP12.json`, `./EmuSP12/`, { prebake: true, tag: 'drum-machines' }), */
    // samples('github:tidalcycles/Dirt-Samples/master'),
    samples('github:tidalcycles/Dirt-Samples/master'),
  ]);
}
/*
const maxPan = noteToMidi('C8');
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
*/
