import { midiToFreq, noteToMidi } from './util.mjs';
import { registerSound, getAudioContext } from './superdough.mjs';
import { getOscillator, gainNode, getEnvelope, getExpEnvelope } from './helpers.mjs';

const mod = (freq, range = 1, type = 'sine') => {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  osc.start();
  const g = new GainNode(ctx, { gain: range });
  osc.connect(g); // -range, range
  return { node: g, stop: (t) => osc.stop(t) };
};

const fm = (osc, harmonicityRatio, modulationIndex, wave = 'sine') => {
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
        let {
          attack = 0.001,
          decay = 0.05,
          sustain = 0.6,
          release = 0.01,
          fmh: fmHarmonicity = 1,
          fmi: fmModulationIndex,
          fmenv: fmEnvelopeType = 'linear',
          fmattack: fmAttack, // = 0.001,
          fmdecay: fmDecay, // = 0.2,
          fmsustain: fmSustain, // = 0.001,
          fmrelease: fmRelease, // = 0.1
          fmvelocity: fmVelocity, // = 1,
          fmwave: fmWaveform = 'sine',
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

        // FM + FM envelope
        let stopFm, fmEnvelope;
        if (fmModulationIndex) {
          const { node: modulator, stop } = fm(o, fmHarmonicity, fmModulationIndex, fmWaveform);
          if (![fmAttack, fmDecay, fmSustain, fmRelease, fmVelocity].find((v) => v !== undefined)) {
            // no envelope by default
            modulator.connect(o.frequency);
          } else {
            fmAttack = fmAttack ?? 0.001;
            fmDecay = fmDecay ?? 0.001;
            fmSustain = fmSustain ?? 1;
            fmRelease = fmRelease ?? 0.001;
            fmVelocity = fmVelocity ?? 1;
            fmEnvelope = getEnvelope(fmAttack, fmDecay, fmSustain, fmRelease, fmVelocity, t);
            if (fmEnvelopeType === 'exp') {
              fmEnvelope = getExpEnvelope(fmAttack, fmDecay, fmSustain, fmRelease, fmVelocity, t);
              fmEnvelope.node.maxValue = fmModulationIndex * 2;
              fmEnvelope.node.minValue = 0.00001;
            }
            modulator.connect(fmEnvelope.node);
            fmEnvelope.node.connect(o.frequency);
          }
          stopFm = stop;
        }

        // turn down
        const g = gainNode(0.3);

        // gain envelope
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
            fmEnvelope?.stop(releaseTime);
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
