import { clamp, midiToFreq, noteToMidi } from './util.mjs';
import { registerSound, getAudioContext } from './superdough.mjs';
import {
  applyFM,
  gainNode,
  getADSRValues,
  getParamADSR,
  getPitchEnvelope,
  getVibratoOscillator,
  webAudioTimeout,
  getWorklet,
} from './helpers.mjs';
import { getNoiseMix, getNoiseOscillator } from './noise.mjs';

const getFrequencyFromValue = (value) => {
  let { note, freq } = value;
  note = note || 36;
  if (typeof note === 'string') {
    note = noteToMidi(note); // e.g. c3 => 48
  }
  // get frequency
  if (!freq && typeof note === 'number') {
    freq = midiToFreq(note); // + 48);
  }

  return Number(freq);
};

const waveforms = ['triangle', 'square', 'sawtooth', 'sine'];
const noises = ['pink', 'white', 'brown', 'crackle'];

export function registerSynthSounds() {
  [...waveforms].forEach((s) => {
    registerSound(
      s,
      (t, value, onended) => {
        const [attack, decay, sustain, release] = getADSRValues(
          [value.attack, value.decay, value.sustain, value.release],
          'linear',
          [0.001, 0.05, 0.6, 0.01],
        );

        let sound = getOscillator(s, t, value);
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
  registerSound(
    'supersaw',
    (begin, value, onended) => {
      const ac = getAudioContext();
      let { duration, n, unison = 5, spread = 0.6, detune } = value;
      detune = detune ?? n ?? 0.18;
      const frequency = getFrequencyFromValue(value);

      const [attack, decay, sustain, release] = getADSRValues(
        [value.attack, value.decay, value.sustain, value.release],
        'linear',
        [0.001, 0.05, 0.6, 0.01],
      );

      const holdend = begin + duration;
      const end = holdend + release + 0.01;
      const voices = clamp(unison, 1, 100);
      let panspread = voices > 1 ? clamp(spread, 0, 1) : 0;
      let o = getWorklet(
        ac,
        'supersaw-oscillator',
        {
          frequency,
          begin,
          end,
          freqspread: detune,
          voices,
          panspread,
        },
        {
          outputChannelCount: [2],
        },
      );

      const gainAdjustment = 1 / Math.sqrt(voices);
      getPitchEnvelope(o.parameters.get('detune'), value, begin, holdend);
      const vibratoOscillator = getVibratoOscillator(o.parameters.get('detune'), value, begin);
      const fm = applyFM(o.parameters.get('frequency'), value, begin);
      let envGain = gainNode(1);
      envGain = o.connect(envGain);

      webAudioTimeout(
        ac,
        () => {
          o.disconnect();
          envGain.disconnect();
          onended();
          fm?.stop();
          vibratoOscillator?.stop();
        },
        begin,
        end,
      );

      getParamADSR(envGain.gain, attack, decay, sustain, release, 0, 0.3 * gainAdjustment, begin, holdend, 'linear');

      return {
        node: envGain,
        stop: (time) => {},
      };
    },
    { prebake: true, type: 'synth' },
  );

  [...noises].forEach((s) => {
    registerSound(
      s,
      (t, value, onended) => {
        const [attack, decay, sustain, release] = getADSRValues(
          [value.attack, value.decay, value.sustain, value.release],
          'linear',
          [0.001, 0.05, 0.6, 0.01],
        );

        let sound;

        let { density } = value;
        sound = getNoiseOscillator(s, t, density);

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
export function getOscillator(s, t, value) {
  let { n: partials, duration, noise = 0 } = value;
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
  // set frequency
  o.frequency.value = getFrequencyFromValue(value);
  o.start(t);

  let vibratoOscillator = getVibratoOscillator(o.detune, value, t);

  // pitch envelope
  getPitchEnvelope(o.detune, value, t, t + duration);
  const fmModulator = applyFM(o.frequency, value, t);

  let noiseMix;
  if (noise) {
    noiseMix = getNoiseMix(o, noise, t);
  }

  return {
    node: noiseMix?.node || o,
    stop: (time) => {
      fmModulator.stop(time);
      vibratoOscillator?.stop(time);
      noiseMix?.stop(time);
      o.stop(time);
    },
    triggerRelease: (time) => {
      // envGain?.stop(time);
    },
  };
}
