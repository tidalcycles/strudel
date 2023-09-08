import { midiToFreq, noteToMidi } from './util.mjs';
import { registerSound, getAudioContext } from './superdough.mjs';
import { gainNode, getEnvelope, getExpEnvelope } from './helpers.mjs';

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
          fmenv: fmEnvelopeType = 'lin',
          fmattack: fmAttack,
          fmdecay: fmDecay,
          fmsustain: fmSustain,
          fmrelease: fmRelease,
          fmvelocity: fmVelocity,
          fmwave: fmWaveform = 'sine',
          vib = 0,
          vibmod = 1,
        } = value;
        let { n, note, freq } = value;
        // with synths, n and note are the same thing
        note = note || 36;
        if (typeof note === 'string') {
          note = noteToMidi(note); // e.g. c3 => 48
        }
        // get frequency
        if (!freq && typeof note === 'number') {
          freq = midiToFreq(note); // + 48);
        }
        // maybe pull out the above frequency resolution?? (there is also getFrequency but it has no default)
        // make oscillator
        const { node: o, stop } = getOscillator({
          t,
          s: wave,
          freq,
          vib,
          vibmod,
          partials: n,
        });

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

export function waveformN(partials, type) {
  const real = new Float32Array(partials + 1);
  const imag = new Float32Array(partials + 1);
  const ac = getAudioContext();
  const osc = ac.createOscillator();

  const amplitudes = {
    sawtooth: (n) => 1 / n,
    square: (n) => (n % 2 === 0 ? 0 : 1 / n),
    triangle: (n) => (n % 2 === 0 ? 0 : 1 / (n * n)),
  };

  if (!amplitudes[type]) {
    throw new Error(`unknown wave type ${type}`);
  }

  real[0] = 0; // dc offset
  imag[0] = 0;
  let n = 1;
  while (n <= partials) {
    real[n] = amplitudes[type](n);
    imag[n] = 0;
    n++;
  }

  const wave = ac.createPeriodicWave(real, imag);
  osc.setPeriodicWave(wave);
  return osc;
}

export function getOscillator({ s, freq, t, vib, vibmod, partials }) {
  // Additional oscillator for vibrato effect
  if (vib > 0) {
    var vibrato_oscillator = getAudioContext().createOscillator();
    vibrato_oscillator.frequency.value = vib;
  }

  // Make oscillator with partial count
  let o;
  if (!partials || s === 'sine') {
    o = getAudioContext().createOscillator();
    o.type = s || 'triangle';
  } else {
    o = waveformN(partials, s);
  }

  if (vib > 0) {
    o.frequency.value = Number(freq);
    var gain = getAudioContext().createGain();
    // Vibmod is the amount of vibrato, in semitones
    gain.gain.value = vibmod * freq;
    vibrato_oscillator.connect(gain);
    gain.connect(o.detune);
    vibrato_oscillator.start(t);
    o.start(t);
    return {
      node: o,
      stop: (time) => {
        vibrato_oscillator.stop(time);
        o.stop(time);
      },
    };
  } else {
    // Normal operation, without vibrato
    o.frequency.value = Number(freq);
    o.start(t);
    const stop = (time) => o.stop(time);
    return { node: o, stop };
  }
}
