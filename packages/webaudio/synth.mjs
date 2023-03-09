import { fromMidi, toMidi } from '@strudel.cycles/core';
import { setSound } from './webaudio.mjs';
import { getOscillator, gainNode, getEnvelope } from './helpers.mjs';

export function registerSynthSounds() {
  ['sine', 'square', 'triangle', 'sawtooth'].forEach((wave) => {
    setSound(
      wave,
      (t, value) => {
        // destructure adsr here, because the default should be different for synths and samples
        const { attack = 0.001, decay = 0.05, sustain = 0.6, release = 0.01 } = value;
        let { n, note, freq } = value;
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
        const { node: o, stop } = getOscillator({ t, s: wave, freq });
        const g = gainNode(0.3);
        // envelope
        const { node: envelope, stop: releaseEnvelope } = getEnvelope(attack, decay, sustain, release, 1, t);
        return {
          node: o.connect(g).connect(envelope),
          stop: (t) => {
            releaseEnvelope(t);
            stop(t + release);
          },
        };
      },
      { type: 'synth', prebake: true },
    );
  });
}
