import { midiToFreq, noteToMidi } from './util.mjs';
import { registerSound, getAudioContext } from './superdough.mjs';
import { gainNode, getADSRValues, getEnvelope, getExpEnvelope } from './helpers.mjs';
import { getNoiseMix, getNoiseOscillator } from './noise.mjs';

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

const waveforms = ['sine', 'square', 'triangle', 'sawtooth'];
const noises = ['pink', 'white', 'brown', 'crackle'];

export function registerSynthSounds() {
  [...waveforms, ...noises].forEach((s) => {
    registerSound(
      s,
      (t, value, onended) => {
        const defaultADSRValues = [0.001, 0.05, 0.6, 0.01];
        const [attack, decay, sustain, release] = getADSRValues(
          [value.attack, value.decay, value.sustain, value.release],
          defaultADSRValues,
        );

        let sound;
        if (waveforms.includes(s)) {
          sound = getOscillator(s, t, value);
        } else {
          let { density } = value;
          sound = getNoiseOscillator(s, t, density);
        }

        let { node: o, stop, triggerRelease } = sound;

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
            const silentAt = releaseEnvelope(releaseTime);
            triggerRelease?.(releaseTime);
            stop(silentAt);
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

  const terms = {
    sawtooth: (n) => [0, -1 / n],
    square: (n) => [0, n % 2 === 0 ? 0 : 1 / n],
    triangle: (n) => [n % 2 === 0 ? 0 : 1 / (n * n), 0],
  };

  if (!terms[type]) {
    throw new Error(`unknown wave type ${type}`);
  }

  real[0] = 0; // dc offset
  imag[0] = 0;
  let n = 1;
  while (n <= partials) {
    const [r, i] = terms[type](n);
    real[n] = r;
    imag[n] = i;
    n++;
  }

  const wave = ac.createPeriodicWave(real, imag);
  osc.setPeriodicWave(wave);
  return osc;
}

// expects one of waveforms as s
export function getOscillator(
  s,
  t,
  {
    n: partials,
    note,
    freq,
    vib = 0,
    vibmod = 0.5,
    noise = 0,
    // fm
    fmh: fmHarmonicity = 1,
    fmi: fmModulationIndex,
    fmenv: fmEnvelopeType = 'lin',
    fmattack: fmAttack,
    fmdecay: fmDecay,
    fmsustain: fmSustain,
    fmrelease: fmRelease,
    fmvelocity: fmVelocity,
    fmwave: fmWaveform = 'sine',
  },
) {
  let ac = getAudioContext();
  let o;
  // If no partials are given, use stock waveforms
  if (!partials || s === 'sine') {
    o = getAudioContext().createOscillator();
    o.type = s || 'triangle';
  }
  // generate custom waveform if partials are given
  else {
    o = waveformN(partials, s);
  }

  // get frequency from note...
  note = note || 36;
  if (typeof note === 'string') {
    note = noteToMidi(note); // e.g. c3 => 48
  }
  // get frequency
  if (!freq && typeof note === 'number') {
    freq = midiToFreq(note); // + 48);
  }

  // set frequency
  o.frequency.value = Number(freq);
  o.start(t);

  // FM
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

  // Additional oscillator for vibrato effect
  let vibratoOscillator;
  if (vib > 0) {
    vibratoOscillator = getAudioContext().createOscillator();
    vibratoOscillator.frequency.value = vib;
    const gain = getAudioContext().createGain();
    // Vibmod is the amount of vibrato, in semitones
    gain.gain.value = vibmod * 100;
    vibratoOscillator.connect(gain);
    gain.connect(o.detune);
    vibratoOscillator.start(t);
  }

  let noiseMix;
  if (noise) {
    noiseMix = getNoiseMix(o, noise, t);
  }

  return {
    node: noiseMix?.node || o,
    stop: (time) => {
      vibratoOscillator?.stop(time);
      noiseMix?.stop(time);
      stopFm?.(time);
      o.stop(time);
    },
    triggerRelease: (time) => {
      fmEnvelope?.stop(time);
    },
  };
}
