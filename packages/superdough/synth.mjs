import { midiToFreq, noteToMidi } from './util.mjs';
import { registerSound, getAudioContext } from './superdough.mjs';
import { gainNode, getADSRValues, getParamADSR } from './helpers.mjs';
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
        const [attack, decay, sustain, release] = getADSRValues([
          value.attack,
          value.decay,
          value.sustain,
          value.release,
        ]);

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

        const { duration } = value;

        o.onended = () => {
          o.disconnect();
          g.disconnect();
          onended();
        };

        const envGain = gainNode(1);
        let node = o.connect(g).connect(envGain);
        const holdEnd = t + duration;
        getParamADSR(node.gain, attack, decay, sustain, release, 0, 1, t, holdEnd, 'linear');
        const envEnd = holdEnd + release + 0.01;
        triggerRelease?.(envEnd);
        stop(envEnd);
        return {
          node,
          stop: (releaseTime) => {},
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
    duration,
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
  let stopFm;
  let envGain = ac.createGain();
  if (fmModulationIndex) {
    const { node: modulator, stop } = fm(o, fmHarmonicity, fmModulationIndex, fmWaveform);
    if (![fmAttack, fmDecay, fmSustain, fmRelease, fmVelocity].find((v) => v !== undefined)) {
      // no envelope by default
      modulator.connect(o.frequency);
    } else {
      const [attack, decay, sustain, release] = getADSRValues([fmAttack, fmDecay, fmSustain, fmRelease]);

      const holdEnd = t + duration;
      // let envEnd = holdEnd + release + 0.01;

      getParamADSR(
        envGain.gain,
        attack,
        decay,
        sustain,
        release,
        0,
        1,
        t,
        holdEnd,
        fmEnvelopeType === 'exp' ? 'exponential' : 'linear',
      );

      if (fmEnvelopeType === 'exp') {
        envGain.maxValue = fmModulationIndex * 2;
        envGain.minValue = 0.00001;
      }
      modulator.connect(envGain);
      envGain.connect(o.frequency);
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
      // envGain?.stop(time);
    },
  };
}
