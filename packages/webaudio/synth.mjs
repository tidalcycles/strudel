import { fromMidi, toMidi } from '@strudel.cycles/core';
import { setSound } from './webaudio.mjs';
import { getOscillator, gainNode, getADSR } from './helpers.mjs';

export function registerSynthSounds() {
  ['sine', 'square', 'triangle', 'sawtooth'].forEach((wave) => {
    setSound(
      wave,
      ({ hap, duration, t }) => {
        // destructure adsr here, because the default should be different for synths and samples
        const { attack = 0.001, decay = 0.05, sustain = 0.6, release = 0.01 } = hap.value;
        let { n, note, freq } = hap.value;
        // with synths, n and note are the same thing
        n = note || n || 36;
        if (typeof n === 'string') {
          n = toMidi(n); // e.g. c3 => 48
        }
        // get frequency
        if (!freq && typeof n === 'number') {
          freq = fromMidi(n); // + 48);
        }
        // maybe pull out the above frequency resolution?? (there is also getFrequency but it has no default)
        // make oscillator
        const o = getOscillator({ t, s: wave, freq, duration, release });
        // chain.push(o);
        // level down oscillators as they are really loud compared to samples i've tested
        //chain.push(gainNode(0.3));
        const g = gainNode(0.3);
        // TODO: make adsr work with samples without pops
        // envelope
        const adsr = getADSR(attack, decay, sustain, release, 1, t, t + duration);
        //chain.push(adsr);
        return o.connect(g).connect(adsr);
      },
      { type: 'synth', prebake: true },
    );
  });
}
