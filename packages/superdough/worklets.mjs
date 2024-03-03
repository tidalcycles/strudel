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
    this.phase = 0;
    this.sync_phase = 0;
    this.prev_sync_phase = 0;
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
        name: 'phase',
        defaultValue: 0,
        max: 1,
        min: 0,
      },

      {
        name: 'duty',
        defaultValue: 0.5,
        min: 0,
        max: 1,
      },
      {
        name: 'frequency',
        defaultValue: 440,
        min: Number.EPSILON,
      },
      {
        name: 'wave',
        defaultValue: 3,
        min: 0,
        max: 3,
      },
      {
        name: 'sync',
        defaultValue: 0,
        min: 0,
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
    const dt = frequency / sampleRate;
    const output = outputs[0];

    for (let i = 0; i < output[0].length; i++) {
      const out = polySaw(this.phase, frequency / sampleRate);
      output[0][i] = out;

      this.phase += dt;

      if (this.phase > 1.0) {
        this.phase = this.phase - 1;
      }
    }
    return true;

    // for (let z = 0; z < outputs.length; z++) {
    //   const out = outputs[z][0];
    //   const outlen = out.length;
    //   const freq = params.frequency.length === 1;
    //   const phase = params.phase.length === 1;
    //   const wave = params.wave.length === 1;
    //   const duty = params.duty.length === 1;
    //   const sync = params.sync.length === 1;

    //   let back = 0;
    //   for (let x = 0; x < outlen; x++) {
    //     this.sync_phase = this.prev_sync_phase % (params.sync[sync ? 0 : x] / sampleRate);
    //     if (params.sync[sync ? 0 : x] !== 0 && this.prev_sync_phase >= params.sync[sync ? 0 : x] / sampleRate) {
    //       this.phase = 0;
    //       back = x;
    //     }
    //     this.prev_sync_phase = this.sync_phase;
    //     const main = (params.frequency[freq ? 0 : x] * (x - back)) / sampleRate;
    //     // noise
    //     if (params.wave[wave ? 0 : x] >= 4) {
    //       out[x] = Math.random() * 2 - 1;
    //     } else if (params.wave[wave ? 0 : x] >= 3) {
    //       // sine wave made using bulit-in Math.sin
    //       out[x] = Math.sin((main + this.phase + params.phase[phase ? 0 : x]) * 2 * Math.PI);
    //       // sawtooth wave using linear piecewise floor
    //     } else if (params.wave[wave ? 0 : x] >= 2) {
    //       // out[x] = polySaw(this.phase, main);
    //       const dt = main + params.phase[phase ? 0 : x];
    //       out[x] = 2 * saw(this.phase + dt) - 1;
    //       console.log(polyBlep(this.phase, dt));
    //       // pulse wave using difference of phase shifted saws and variable DC threshold
    //     } else if (params.wave[wave ? 0 : x] >= 1) {
    //       const temp = main + this.phase + params.phase[phase ? 0 : x];
    //       out[x] = saw(temp) - saw(temp + params.duty[duty ? 0 : x]) > 0 ? 1 : -1;
    //       // triangle wave using absolute value of amplitude shifted sawtooth wave
    //     } else if (params.wave[wave ? 0 : x] >= 0) {
    //       out[x] = 4 * Math.abs(saw(main + this.phase + params.phase[phase ? 0 : x]) - 1 / 2) - 1;
    //     }
    //     this.prev_sync_phase += 1 / sampleRate;
    //   }
    //   this.phase += (params.frequency[freq ? 0 : outlen - 1] * outlen) / sampleRate;
    //   this.phase %= sampleRate;
    //   return true;
    // }
  }
}

registerProcessor('better-oscillator', BetterOscillatorProcessor);
