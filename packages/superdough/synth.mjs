import { midiToFreq, noteToMidi } from './util.mjs';
import { registerSound } from './webaudio.mjs';
import { getOscillator, gainNode, getEnvelope } from './helpers.mjs';

export function registerSynthSounds() {
  ['sine', 'square', 'triangle', 'sawtooth'].forEach((wave) => {
    registerSound(
      wave,
      (t, value, onended) => {
        // destructure adsr here, because the default should be different for synths and samples
        const { attack = 0.001, decay = 0.05, sustain = 0.6, release = 0.01 } = value;
        let { n, note, freq } = value;
        // with synths, n and note are the same thing
        n = note || n || 36;
        if (typeof n === 'string') {
          n = noteToMidi(n); // e.g. c3 => 48
        }
        // get frequency
        if (!freq && typeof n === 'number') {
          freq = midiToFreq(n); // + 48);
        }
        // maybe pull out the above frequency resolution?? (there is also getFrequency but it has no default)
        // make oscillator
        const { node: o, stop } = getOscillator({ t, s: wave, freq });
        const g = gainNode(0.3);
        // envelope
        const { node: envelope, stop: releaseEnvelope } = getEnvelope(attack, decay, sustain, release, 1, t);
        o.onended = () => {
          o.disconnect();
          g.disconnect();
          onended();
        };
        return {
          node: o.connect(g).connect(envelope),
          stop: (releaseTime) => {
            releaseEnvelope(releaseTime);
            stop(releaseTime + release);
          },
        };
      },
      { type: 'synth', prebake: true },
    );
  });
}
