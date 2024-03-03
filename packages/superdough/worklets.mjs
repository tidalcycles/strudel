const processSample = (inputs, outputs, processBlock) => {
  const input = inputs[0];
  const output = outputs[0];
  const blockSize = 128;
  if (input == null || output == null) {
    return false;
  }

  for (let n = 0; n < blockSize; n++) {
    input.forEach((inChannel, i) => {
      const outChannel = output[i % output.length];
      const block = inChannel[n];
      outChannel[n] = processBlock(block, n, inChannel, outChannel);
    });
  }
  return true;
};

// coarse, crush, and shape processors adapted from dktr0's webdirt: https://github.com/dktr0/WebDirt/blob/5ce3d698362c54d6e1b68acc47eb2955ac62c793/dist/AudioWorklets.js
// LICENSE GNU General Public License v3.0 see https://github.com/dktr0/WebDirt/blob/main/LICENSE
class CoarseProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'coarse', defaultValue: 1 }];
  }

  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    let coarse = parameters.coarse[0] ?? 0;
    coarse = Math.max(1, coarse);
    return processSample(inputs, outputs, (block, n, inChannel, outChannel) => {
      const value = n % coarse === 0 ? block : outChannel[n - 1];
      return value;
    });
  }
}

registerProcessor('coarse-processor', CoarseProcessor);

class CrushProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'crush', defaultValue: 0 }];
  }

  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    let crush = parameters.crush[0] ?? 8;
    crush = Math.max(1, crush);

    return processSample(inputs, outputs, (block) => {
      const x = Math.pow(2, crush - 1);
      return Math.round(block * x) / x;
    });
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
  }

  process(inputs, outputs, parameters) {
    let shape = parameters.shape[0];
    const postgain = Math.max(0.001, Math.min(1, parameters.postgain[0]));
    shape = shape < 1 ? shape : 1.0 - 4e-10;
    shape = (2.0 * shape) / (1.0 - shape);
    return processSample(inputs, outputs, (block) => {
      const val = ((1 + shape) * block) / (1 + shape * Math.abs(block));
      return val * postgain;
    });
  }
}

registerProcessor('shape-processor', ShapeProcessor);

class DistortProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'distort', defaultValue: 0 },
      { name: 'postgain', defaultValue: 1 },
    ];
  }

  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    let shape = parameters.distort[0];
    const postgain = Math.max(0.001, Math.min(1, parameters.postgain[0]));
    shape = Math.expm1(shape);
    return processSample(inputs, outputs, (block) => {
      const val = ((1 + shape) * block) / (1 + shape * Math.abs(block));
      return val * postgain;
    });
  }
}

registerProcessor('distort-processor', DistortProcessor);

const polyBlep = (t, dt) => {
  // 0 <= t < 1
  if (t < dt) {
    t /= dt;
    // 2 * (t - t^2/2 - 0.5)
    return t + t - t * t - 1;
  }

  // -1 < t < 0
  else if (t > 1 - dt) {
    t = (t - 1) / dt;
    // 2 * (t^2/2 + t + 0.5)
    return t * t + t + t + 1;
  }

  // 0 otherwise
  else {
    return 0;
  }
};

const polySaw = (t, dt) => {
  // Correct phase, so it would be in line with sin(2.*M_PI * t)
  t += 0.5;
  if (t >= 1) t -= 1;

  const naive_saw = 2 * t - 1;
  return naive_saw - polyBlep(t, dt);
  // return naive_saw;
};

class BetterOscillatorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phase = [];
    this.sync_phase = 0;
    this.prev_sync_phase = 0;
    this.freq = [];
    this.balance = [];
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
    ];
  }
  process(input, outputs, params) {
    if (currentTime <= params.begin[0]) {
      return true;
    }
    if (currentTime >= params.end[0]) {
      return false;
    }
    const frequency = params.frequency[0];

    const output = outputs[0];
    const numSaws = 7;
    const detune = 0.5;
    const spread = 0.6;

    for (let n = 0; n < numSaws; n++) {
      let adj = 0;
      const isOdd = n % 2 === 1;
      if (n > 0) {
        adj = isOdd ? n * detune : -((n - 1) * detune);
      }
      this.freq[n] = frequency + adj * 0.01 * frequency;
      this.balance[n] = isOdd ? 1 - spread : spread;

      // for (let i = 0; i < output[0].length; i++) {

      // }
    }

    for (let i = 0; i < output[0].length; i++) {
      let outL = 0;
      let outR = 0;
      for (let n = 0; n < numSaws; n++) {
        const dt = this.freq[n] / sampleRate;
        const osc = polySaw(this.phase[n], this.freq[n] / sampleRate);
        outL = outL + osc * (1 - this.balance[n]);
        outR = outR + osc * this.balance[n];
        this.phase[n] = this.phase[n] ?? Math.random();
        this.phase[n] += dt;

        if (this.phase[n] > 1.0) {
          this.phase[n] = this.phase[n] - 1;
        }
      }

      output[0][i] = outL;
      output[1][i] = outR;
    }
    return true;
  }
}

registerProcessor('better-oscillator', BetterOscillatorProcessor);
