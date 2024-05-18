// coarse, crush, and shape processors adapted from dktr0's webdirt: https://github.com/dktr0/WebDirt/blob/5ce3d698362c54d6e1b68acc47eb2955ac62c793/dist/AudioWorklets.js
// LICENSE GNU General Public License v3.0 see https://github.com/dktr0/WebDirt/blob/main/LICENSE
import { clamp } from './util.mjs';
const blockSize = 128;
class CoarseProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'coarse', defaultValue: 1 }];
  }

  constructor() {
    super();
    this.started = false;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    const hasInput = !(input[0] === undefined);
    if (this.started && !hasInput) {
      return false;
    }
    this.started = hasInput;

    let coarse = parameters.coarse[0] ?? 0;
    coarse = Math.max(1, coarse);
    for (let n = 0; n < blockSize; n++) {
      for (let i = 0; i < input.length; i++) {
        output[i][n] = n % coarse === 0 ? input[i][n] : output[i][n - 1];
      }
    }
    return true;
  }
}
registerProcessor('coarse-processor', CoarseProcessor);

class CrushProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'crush', defaultValue: 0 }];
  }

  constructor() {
    super();
    this.started = false;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    const hasInput = !(input[0] === undefined);
    if (this.started && !hasInput) {
      return false;
    }
    this.started = hasInput;

    let crush = parameters.crush[0] ?? 8;
    crush = Math.max(1, crush);

    for (let n = 0; n < blockSize; n++) {
      for (let i = 0; i < input.length; i++) {
        const x = Math.pow(2, crush - 1);
        output[i][n] = Math.round(input[i][n] * x) / x;
      }
    }
    return true;
  }
}
registerProcessor('crush-processor', CrushProcessor);

class ShapeProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'shape', defaultValue: 0 },
      { name: 'postgain', defaultValue: 1 },
    ];
  }

  constructor() {
    super();
    this.started = false;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    const hasInput = !(input[0] === undefined);
    if (this.started && !hasInput) {
      return false;
    }
    this.started = hasInput;

    let shape = parameters.shape[0];
    shape = shape < 1 ? shape : 1.0 - 4e-10;
    shape = (2.0 * shape) / (1.0 - shape);
    const postgain = Math.max(0.001, Math.min(1, parameters.postgain[0]));

    for (let n = 0; n < blockSize; n++) {
      for (let i = 0; i < input.length; i++) {
        output[i][n] = (((1 + shape) * input[i][n]) / (1 + shape * Math.abs(input[i][n]))) * postgain;
      }
    }
    return true;
  }
}
registerProcessor('shape-processor', ShapeProcessor);

function fast_tanh(x) {
  const x2 = x * x;
  return (x * (27.0 + x2)) / (27.0 + 9.0 * x2);
}
const _PI = 3.14159265359;
//adapted from https://github.com/TheBouteillacBear/webaudioworklet-wasm?tab=MIT-1-ov-file
class LadderProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 500 },
      { name: 'q', defaultValue: 1 },
      { name: 'drive', defaultValue: 0.69 },
    ];
  }

  constructor() {
    super();
    this.started = false;
    this.p0 = [0, 0];
    this.p1 = [0, 0];
    this.p2 = [0, 0];
    this.p3 = [0, 0];
    this.p32 = [0, 0];
    this.p33 = [0, 0];
    this.p34 = [0, 0];
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    const hasInput = !(input[0] === undefined);
    if (this.started && !hasInput) {
      return false;
    }

    this.started = hasInput;

    const resonance = parameters.q[0];
    const drive = clamp(Math.exp(parameters.drive[0]), 0.1, 2000);
    let cutoff = parameters.frequency[0];
    cutoff = (cutoff * 2 * _PI) / sampleRate;
    cutoff = cutoff > 1 ? 1 : cutoff;

    const k = Math.min(8, resonance * 2);
    //               drive makeup  * resonance volume loss makeup
    const makeupgain = (1 / drive) * Math.min(1.75, 1 + k);

    for (let n = 0; n < blockSize; n++) {
      for (let i = 0; i < input.length; i++) {
        const out = this.p3[i] * 0.360891 + this.p32[i] * 0.41729 + this.p33[i] * 0.177896 + this.p34[i] * 0.0439725;

        this.p34[i] = this.p33[i];
        this.p33[i] = this.p32[i];
        this.p32[i] = this.p3[i];

        this.p0[i] += (fast_tanh(input[i][n] * drive - k * out) - fast_tanh(this.p0[i])) * cutoff;
        this.p1[i] += (fast_tanh(this.p0[i]) - fast_tanh(this.p1[i])) * cutoff;
        this.p2[i] += (fast_tanh(this.p1[i]) - fast_tanh(this.p2[i])) * cutoff;
        this.p3[i] += (fast_tanh(this.p2[i]) - fast_tanh(this.p3[i])) * cutoff;

        output[i][n] = out * makeupgain;
      }
    }
    return true;
  }
}
registerProcessor('ladder-processor', LadderProcessor);

class DistortProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'distort', defaultValue: 0 },
      { name: 'postgain', defaultValue: 1 },
    ];
  }

  constructor() {
    super();
    this.started = false;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    const hasInput = !(input[0] === undefined);
    if (this.started && !hasInput) {
      return false;
    }
    this.started = hasInput;

    const shape = Math.expm1(parameters.distort[0]);
    const postgain = Math.max(0.001, Math.min(1, parameters.postgain[0]));

    for (let n = 0; n < blockSize; n++) {
      for (let i = 0; i < input.length; i++) {
        output[i][n] = (((1 + shape) * input[i][n]) / (1 + shape * Math.abs(input[i][n]))) * postgain;
      }
    }
    return true;
  }
}
registerProcessor('distort-processor', DistortProcessor);

// adjust waveshape to remove frequencies above nyquist to prevent aliasing
// referenced from https://www.kvraudio.com/forum/viewtopic.php?t=375517
const polyBlep = (phase, dt) => {
  // 0 <= phase < 1
  if (phase < dt) {
    phase /= dt;
    // 2 * (phase - phase^2/2 - 0.5)
    return phase + phase - phase * phase - 1;
  }

  // -1 < phase < 0
  else if (phase > 1 - dt) {
    phase = (phase - 1) / dt;
    // 2 * (phase^2/2 + phase + 0.5)
    return phase * phase + phase + phase + 1;
  }

  // 0 otherwise
  else {
    return 0;
  }
};

const saw = (phase, dt) => {
  const v = 2 * phase - 1;
  return v - polyBlep(phase, dt);
};

function lerp(a, b, n) {
  return n * (b - a) + a;
}

function getUnisonDetune(unison, detune, voiceIndex) {
  if (unison < 2) {
    return 0;
  }
  return lerp(-detune * 0.5, detune * 0.5, voiceIndex / (unison - 1));
}
class SuperSawOscillatorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phase = [];
  }
  static get parameterDescriptors() {
    return [
      {
        name: 'begin',
        defaultValue: 0,
        max: Number.POSITIVE_INFINITY,
        min: 0,
      },

      {
        name: 'end',
        defaultValue: 0,
        max: Number.POSITIVE_INFINITY,
        min: 0,
      },

      {
        name: 'frequency',
        defaultValue: 440,
        min: Number.EPSILON,
      },

      {
        name: 'panspread',
        defaultValue: 0.4,
        min: 0,
        max: 1,
      },
      {
        name: 'freqspread',
        defaultValue: 0.2,
        min: 0,
      },
      {
        name: 'detune',
        defaultValue: 0,
        min: 0,
      },

      {
        name: 'voices',
        defaultValue: 5,
        min: 1,
      },
    ];
  }
  process(input, outputs, params) {
    // eslint-disable-next-line no-undef
    if (currentTime <= params.begin[0]) {
      return true;
    }
    // eslint-disable-next-line no-undef
    if (currentTime >= params.end[0]) {
      // this.port.postMessage({ type: 'onended' });
      return false;
    }
    let frequency = params.frequency[0];
    //apply detune in cents
    frequency = frequency * Math.pow(2, params.detune[0] / 1200);

    const output = outputs[0];
    const voices = params.voices[0];
    const freqspread = params.freqspread[0];
    const panspread = params.panspread[0] * 0.5 + 0.5;
    const gain1 = Math.sqrt(1 - panspread);
    const gain2 = Math.sqrt(panspread);

    for (let n = 0; n < voices; n++) {
      const isOdd = (n & 1) == 1;

      //applies unison "spread" detune in semitones
      const freq = frequency * Math.pow(2, getUnisonDetune(voices, freqspread, n) / 12);
      let gainL = gain1;
      let gainR = gain2;
      // invert right and left gain
      if (isOdd) {
        gainL = gain2;
        gainR = gain1;
      }
      // eslint-disable-next-line no-undef
      const dt = freq / sampleRate;

      for (let i = 0; i < output[0].length; i++) {
        this.phase[n] = this.phase[n] ?? Math.random();
        const v = saw(this.phase[n], dt);

        output[0][i] = output[0][i] + v * gainL;
        output[1][i] = output[1][i] + v * gainR;

        this.phase[n] += dt;

        if (this.phase[n] > 1.0) {
          this.phase[n] = this.phase[n] - 1;
        }
      }
    }
    return true;
  }
}

registerProcessor('supersaw-oscillator', SuperSawOscillatorProcessor);
