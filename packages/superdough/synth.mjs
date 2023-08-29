import { midiToFreq, noteToMidi } from './util.mjs';
import { registerSound, getAudioContext } from './superdough.mjs';
import { getOscillator, gainNode, getEnvelope } from './helpers.mjs';

const mod = (freq, range = 1, type) => {
	console.log(type)
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.start();
  const g = new GainNode(ctx, { gain: range });
  osc.connect(g); // -range, range
  return { node: g, stop: (t) => osc.stop(t) };
};

const fm = (osc, harmonicityRatio, modulationIndex, wave) => {
  const carrfreq = osc.frequency.value;
  const modfreq = carrfreq * harmonicityRatio;
  const modgain = modfreq * modulationIndex;
  return mod(modfreq, modgain, wave);
};

export function registerSynthSounds() {
  ['sine', 'square', 'triangle', 'sawtooth'].forEach((wave) => {
    registerSound(
      wave,
      (t, value, onended) => {
        // destructure adsr here, because the default should be different for synths and samples
        const {
          attack = 0.001,
          decay = 0.05,
          sustain = 0.6,
          release = 0.01,
          fmh: fmHarmonicity = 1,
          fmi: fmModulationIndex,
					fmwave: fmWaveform = 'sine'
        } = value;
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

        let stopFm;
        if (fmModulationIndex) {
          const { node: modulator, stop } = fm(
						o, fmHarmonicity, 
						fmModulationIndex, 
						fmWaveform
					);
          modulator.connect(o.frequency);
          stopFm = stop;
        }
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
            let end = releaseTime + release;
            stop(end);
            stopFm?.(end);
          },
        };
      },
      { type: 'synth', prebake: true },
    );
  });
}
