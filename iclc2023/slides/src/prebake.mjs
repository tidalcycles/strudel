import { registerSynthSounds, samples } from '@strudel.cycles/webaudio';
import { registerSoundfonts } from '@strudel.cycles/soundfonts';

export async function prebake() {
  // https://archive.org/details/SalamanderGrandPianoV3
  // License: CC-by http://creativecommons.org/licenses/by/3.0/ Author: Alexander Holm
  await Promise.all([
    registerSynthSounds(),
    registerSoundfonts(`./samples/webaudiofontdata/sound/`),
    /* samples(`./piano.json`, `./piano/`, { prebake: true }),
    samples(`./vcsl.json`, 'github:sgossner/VCSL/master/', { prebake: true }),
    */
    //samples(`./tidal-drum-machines.json`, 'github:ritchse/tidal-drum-machines/main/machines/', {
    samples(`./tidal-drum-machines.json`, './samples/tidal-drum-machines/machines/', {
      prebake: true,
      tag: 'drum-machines',
    }) /*
    samples(`./EmuSP12.json`, `./EmuSP12/`, { prebake: true, tag: 'drum-machines' }), */,
    // samples('github:tidalcycles/Dirt-Samples/master'),
    samples('./Dirt-Samples.json', './samples/Dirt-Samples/'),
  ]);
}
