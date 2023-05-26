import { Pattern, noteToMidi, valueToMidi } from '@strudel.cycles/core';
import { registerSynthSounds, samples } from '@strudel.cycles/webaudio';
import './piano.mjs';

export async function prebake() {
  // https://archive.org/details/SalamanderGrandPianoV3
  // License: CC-by http://creativecommons.org/licenses/by/3.0/ Author: Alexander Holm
  await Promise.all([
    registerSynthSounds(),
    //registerSoundfonts(),
    // need dynamic import here, because importing @strudel.cycles/soundfonts fails on server:
    // => getting "window is not defined", as soon as "@strudel.cycles/soundfonts" is imported statically
    // seems to be a problem with soundfont2
    import('@strudel.cycles/soundfonts').then(({ registerSoundfonts }) => registerSoundfonts()),
    samples(`./piano.json`, `./piano/`, { prebake: true }),
    // https://github.com/sgossner/VCSL/
    // https://api.github.com/repositories/126427031/contents/
    // LICENSE: CC0 general-purpose
    samples(`./vcsl.json`, 'github:sgossner/VCSL/master/', { prebake: true }),
    samples(`./tidal-drum-machines.json`, 'github:ritchse/tidal-drum-machines/main/machines/', {
      prebake: true,
      tag: 'drum-machines',
    }),
    samples(`./EmuSP12.json`, `./EmuSP12/`, { prebake: true, tag: 'drum-machines' }),
  ]);
  await samples('github:tidalcycles/Dirt-Samples/master');
}

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
