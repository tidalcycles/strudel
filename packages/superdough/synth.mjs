import { clamp, midiToFreq, noteToMidi } from './util.mjs';
import { registerSound, getAudioContext, getLfo } from './superdough.mjs';
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
function destroyAudioWorkletNode(node) {
  if (node == null) {
    return;
  }
  node.disconnect();
  node.parameters.get('end')?.setValueAtTime(0, 0);
}

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
          stop: (endTime) => {
            stop(endTime);
          },
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

      getParamADSR(envGain.gain, attack, decay, sustain, release, 0, 0.3 * gainAdjustment, begin, holdend, 'linear');

      let timeoutNode = webAudioTimeout(
        ac,
        () => {
          destroyAudioWorkletNode(o);
          envGain.disconnect();
          onended();
          fm?.stop();
          vibratoOscillator?.stop();
        },
        begin,
        end,
      );

      return {
        node: envGain,
        stop: (time) => {
          timeoutNode.stop(time);
        },
      };
    },
    { prebake: true, type: 'synth' },
  );

  registerSound(
    'bytebeat',
    (begin, value, onended) => {
      const defaultBeats = [
        '(t%255 >= t/255%255)*255',
        '(t*(t*8%60 <= 300)|(-t)*(t*4%512 < 256))+t/400',
        't',
        't*(t >> 10^t)',
        't&128',
        't&t>>8',
        '((t%255+t%128+t%64+t%32+t%16+t%127.8+t%64.8+t%32.8+t%16.8)/3)',
        '((t%64+t%63.8+t%64.15+t%64.35+t%63.5)/1.25)',
        '(t&(t>>7)-t)',
        '(sin(t*PI/128)*127+127)',
        '((t^t/2+t+64*(sin((t*PI/64)+(t*PI/32768))+64))%128*2)',
        '((t^t/2+t+64*(cos >> 0))%127.85*2)',
        '((t^t/2+t+64)%128*2)',
        '(((t * .25)^(t * .25)/100+(t * .25))%128)*2',
        '((t^t/2+t+64)%7 * 24)',
      ];
      const { n = 0 } = value;
      const frequency = getFrequencyFromValue(value);
      const { byteBeatExpression = defaultBeats[n % defaultBeats.length], byteBeatStartTime } = value;

      const ac = getAudioContext();

      let { duration } = value;
      const [attack, decay, sustain, release] = getADSRValues(
        [value.attack, value.decay, value.sustain, value.release],
        'linear',
        [0.001, 0.05, 0.6, 0.01],
      );
      const holdend = begin + duration;
      const end = holdend + release + 0.01;

      let o = getWorklet(
        ac,
        'byte-beat-processor',
        {
          frequency,
          begin,
          end,
        },
        {
          outputChannelCount: [2],
        },
      );

      o.port.postMessage({ codeText: byteBeatExpression, byteBeatStartTime, frequency });

      let envGain = gainNode(1);
      envGain = o.connect(envGain);

      getParamADSR(envGain.gain, attack, decay, sustain, release, 0, 1, begin, holdend, 'linear');

      let timeoutNode = webAudioTimeout(
        ac,
        () => {
          destroyAudioWorkletNode(o);
          envGain.disconnect();
          onended();
        },
        begin,
        end,
      );

      return {
        node: envGain,
        stop: (time) => {
          timeoutNode.stop(time);
        },
      };
    },
    { prebake: true, type: 'synth' },
  );

  registerSound(
    'pulse',
    (begin, value, onended) => {
      const ac = getAudioContext();
      let { pwrate, pwsweep } = value;
      if (pwsweep == null) {
        if (pwrate != null) {
          pwsweep = 0.3;
        } else {
          pwsweep = 0;
        }
      }

      if (pwrate == null && pwsweep != null) {
        pwrate = 1;
      }

      let { duration, pw: pulsewidth = 0.5 } = value;
      const frequency = getFrequencyFromValue(value);

      const [attack, decay, sustain, release] = getADSRValues(
        [value.attack, value.decay, value.sustain, value.release],
        'linear',
        [0.001, 0.05, 0.6, 0.01],
      );
      const holdend = begin + duration;
      const end = holdend + release + 0.01;
      let o = getWorklet(
        ac,
        'pulse-oscillator',
        {
          frequency,
          begin,
          end,
          pulsewidth,
        },
        {
          outputChannelCount: [2],
        },
      );

      getPitchEnvelope(o.parameters.get('detune'), value, begin, holdend);
      const vibratoOscillator = getVibratoOscillator(o.parameters.get('detune'), value, begin);
      const fm = applyFM(o.parameters.get('frequency'), value, begin);
      let envGain = gainNode(1);
      envGain = o.connect(envGain);

      getParamADSR(envGain.gain, attack, decay, sustain, release, 0, 1, begin, holdend, 'linear');
      let lfo;
      if (pwsweep != 0) {
        lfo = getLfo(ac, begin, end, { frequency: pwrate, depth: pwsweep });
        lfo.connect(o.parameters.get('pulsewidth'));
      }
      let timeoutNode = webAudioTimeout(
        ac,
        () => {
          destroyAudioWorkletNode(o);
          destroyAudioWorkletNode(lfo);
          envGain.disconnect();
          onended();
          fm?.stop();
          vibratoOscillator?.stop();
        },
        begin,
        end,
      );

      return {
        node: envGain,
        stop: (time) => {
          timeoutNode.stop(time);
        },
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
          stop: (endTime) => {
            stop(endTime);
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
