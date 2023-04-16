import { registerSoundfonts } from '@strudel.cycles/soundfonts';
import { registerSynthSounds, samples } from '@strudel.cycles/webaudio';
import './piano.mjs';

export async function prebake() {
  // https://archive.org/details/SalamanderGrandPianoV3
  // License: CC-by http://creativecommons.org/licenses/by/3.0/ Author: Alexander Holm
  await Promise.all([
    registerSynthSounds(),
    registerSoundfonts(),
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
    // samples('github:tidalcycles/Dirt-Samples/master'),
  ]);
}
