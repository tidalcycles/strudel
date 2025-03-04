// coarse, crush, and shape processors adapted from dktr0's webdirt: https://github.com/dktr0/WebDirt/blob/5ce3d698362c54d6e1b68acc47eb2955ac62c793/dist/AudioWorklets.js
// LICENSE GNU General Public License v3.0 see https://github.com/dktr0/WebDirt/blob/main/LICENSE
// TOFIX: THIS FILE DOES NOT SUPPORT IMPORTS ON DEPOLYMENT

import OLAProcessor from './ola-processor';
import FFT from './fft.js';

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const _mod = (n, m) => ((n % m) + m) % m;

const blockSize = 128;
// adjust waveshape to remove frequencies above nyquist to prevent aliasing
// referenced from https://www.kvraudio.com/forum/viewtopic.php?t=375517
function polyBlep(phase, dt) {
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
}

const waveshapes = {
  tri(phase, skew = 0.5) {
    const x = 1 - skew;
    if (phase >= skew) {
      return 1 / x - phase / x;
    }
    return phase / skew;
  },
  sine(phase) {
    return Math.sin(Math.PI * 2 * phase) * 0.5 + 0.5;
  },
  ramp(phase) {
    return phase;
  },
  saw(phase) {
    return 1 - phase;
  },

  square(phase, skew = 0.5) {
    if (phase >= skew) {
      return 0;
    }
    return 1;
  },
  custom(phase, values = [0, 1]) {
    const numParts = values.length - 1;
    const currPart = Math.floor(phase * numParts);

    const partLength = 1 / numParts;
    const startVal = clamp(values[currPart], 0, 1);
    const endVal = clamp(values[currPart + 1], 0, 1);
    const y2 = endVal;
    const y1 = startVal;
    const x1 = 0;
    const x2 = partLength;
    const slope = (y2 - y1) / (x2 - x1);
    return slope * (phase - partLength * currPart) + startVal;
  },
  sawblep(phase, dt) {
    const v = 2 * phase - 1;
    return v - polyBlep(phase, dt);
  },
};
function getParamValue(block, param) {
  if (param.length > 1) {
    return param[block];
  }
  return param[0];
}
const waveShapeNames = Object.keys(waveshapes);
class LFOProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'time', defaultValue: 0 },
      { name: 'end', defaultValue: 0 },
      { name: 'frequency', defaultValue: 0.5 },
      { name: 'skew', defaultValue: 0.5 },
      { name: 'depth', defaultValue: 1 },
      { name: 'phaseoffset', defaultValue: 0 },
      { name: 'shape', defaultValue: 0 },
      { name: 'dcoffset', defaultValue: 0 },
    ];
  }

  constructor() {
    super();
    this.phase;
  }

  incrementPhase(dt) {
    this.phase += dt;
    if (this.phase > 1.0) {
      this.phase = this.phase - 1;
    }
  }

  process(inputs, outputs, parameters) {
    // eslint-disable-next-line no-undef
    if (currentTime >= parameters.end[0]) {
      return false;
    }

    const output = outputs[0];
    const frequency = parameters['frequency'][0];

    const time = parameters['time'][0];
    const depth = parameters['depth'][0];
    const skew = parameters['skew'][0];
    const phaseoffset = parameters['phaseoffset'][0];

    const dcoffset = parameters['dcoffset'][0];
    const shape = waveShapeNames[parameters['shape'][0]];

    const blockSize = output[0].length ?? 0;

    if (this.phase == null) {
      this.phase = _mod(time * frequency + phaseoffset, 1);
    }
    // eslint-disable-next-line no-undef
    const dt = frequency / sampleRate;
    for (let n = 0; n < blockSize; n++) {
      for (let i = 0; i < output.length; i++) {
        const modval = (waveshapes[shape](this.phase, skew) + dcoffset) * depth;
        output[i][n] = modval;
      }
      this.incrementPhase(dt);
    }

    return true;
  }
}
registerProcessor('lfo-processor', LFOProcessor);

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
    // eslint-disable-next-line no-undef
    cutoff = (cutoff * 2 * _PI) / sampleRate;
    cutoff = cutoff > 1 ? 1 : cutoff;

    const k = Math.min(8, resonance * 0.4);
    //               drive makeup  * resonance volume loss makeup
    let makeupgain = (1 / drive) * Math.min(1.75, 1 + k);

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

// SUPERSAW
function lerp(a, b, n) {
  return n * (b - a) + a;
}

function getUnisonDetune(unison, detune, voiceIndex) {
  if (unison < 2) {
    return 0;
  }
  return lerp(-detune * 0.5, detune * 0.5, voiceIndex / (unison - 1));
}

function applySemitoneDetuneToFrequency(frequency, detune) {
  return frequency * Math.pow(2, detune / 12);
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
      const freq = applySemitoneDetuneToFrequency(frequency, getUnisonDetune(voices, freqspread, n));
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
        const v = waveshapes.sawblep(this.phase[n], dt);

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

// Phase Vocoder sourced from // sourced from https://github.com/olvb/phaze/tree/master?tab=readme-ov-file
const BUFFERED_BLOCK_SIZE = 2048;

function genHannWindow(length) {
  let win = new Float32Array(length);
  for (var i = 0; i < length; i++) {
    win[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / length));
  }
  return win;
}

class PhaseVocoderProcessor extends OLAProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'pitchFactor',
        defaultValue: 1.0,
      },
    ];
  }

  constructor(options) {
    options.processorOptions = {
      blockSize: BUFFERED_BLOCK_SIZE,
    };
    super(options);

    this.fftSize = this.blockSize;
    this.timeCursor = 0;

    this.hannWindow = genHannWindow(this.blockSize);
    // prepare FFT and pre-allocate buffers
    this.fft = new FFT(this.fftSize);
    this.freqComplexBuffer = this.fft.createComplexArray();
    this.freqComplexBufferShifted = this.fft.createComplexArray();
    this.timeComplexBuffer = this.fft.createComplexArray();
    this.magnitudes = new Float32Array(this.fftSize / 2 + 1);
    this.peakIndexes = new Int32Array(this.magnitudes.length);
    this.nbPeaks = 0;
  }

  processOLA(inputs, outputs, parameters) {
    // no automation, take last value

    let pitchFactor = parameters.pitchFactor[parameters.pitchFactor.length - 1];

    if (pitchFactor < 0) {
      pitchFactor = pitchFactor * 0.25;
    }
    pitchFactor = Math.max(0, pitchFactor + 1);

    for (var i = 0; i < this.nbInputs; i++) {
      for (var j = 0; j < inputs[i].length; j++) {
        // big assumption here: output is symetric to input
        var input = inputs[i][j];
        var output = outputs[i][j];

        this.applyHannWindow(input);

        this.fft.realTransform(this.freqComplexBuffer, input);

        this.computeMagnitudes();
        this.findPeaks();
        this.shiftPeaks(pitchFactor);

        this.fft.completeSpectrum(this.freqComplexBufferShifted);
        this.fft.inverseTransform(this.timeComplexBuffer, this.freqComplexBufferShifted);
        this.fft.fromComplexArray(this.timeComplexBuffer, output);
        this.applyHannWindow(output);
      }
    }

    this.timeCursor += this.hopSize;
  }

  /** Apply Hann window in-place */
  applyHannWindow(input) {
    for (var i = 0; i < this.blockSize; i++) {
      input[i] = input[i] * this.hannWindow[i] * 1.62;
    }
  }

  /** Compute squared magnitudes for peak finding **/
  computeMagnitudes() {
    var i = 0,
      j = 0;
    while (i < this.magnitudes.length) {
      let real = this.freqComplexBuffer[j];
      let imag = this.freqComplexBuffer[j + 1];
      // no need to sqrt for peak finding
      this.magnitudes[i] = real ** 2 + imag ** 2;
      i += 1;
      j += 2;
    }
  }

  /** Find peaks in spectrum magnitudes **/
  findPeaks() {
    this.nbPeaks = 0;
    var i = 2;
    let end = this.magnitudes.length - 2;

    while (i < end) {
      let mag = this.magnitudes[i];

      if (this.magnitudes[i - 1] >= mag || this.magnitudes[i - 2] >= mag) {
        i++;
        continue;
      }
      if (this.magnitudes[i + 1] >= mag || this.magnitudes[i + 2] >= mag) {
        i++;
        continue;
      }

      this.peakIndexes[this.nbPeaks] = i;
      this.nbPeaks++;
      i += 2;
    }
  }

  /** Shift peaks and regions of influence by pitchFactor into new specturm */
  shiftPeaks(pitchFactor) {
    // zero-fill new spectrum
    this.freqComplexBufferShifted.fill(0);

    for (var i = 0; i < this.nbPeaks; i++) {
      let peakIndex = this.peakIndexes[i];
      let peakIndexShifted = Math.round(peakIndex * pitchFactor);

      if (peakIndexShifted > this.magnitudes.length) {
        break;
      }

      // find region of influence
      var startIndex = 0;
      var endIndex = this.fftSize;
      if (i > 0) {
        let peakIndexBefore = this.peakIndexes[i - 1];
        startIndex = peakIndex - Math.floor((peakIndex - peakIndexBefore) / 2);
      }
      if (i < this.nbPeaks - 1) {
        let peakIndexAfter = this.peakIndexes[i + 1];
        endIndex = peakIndex + Math.ceil((peakIndexAfter - peakIndex) / 2);
      }

      // shift whole region of influence around peak to shifted peak
      let startOffset = startIndex - peakIndex;
      let endOffset = endIndex - peakIndex;
      for (var j = startOffset; j < endOffset; j++) {
        let binIndex = peakIndex + j;
        let binIndexShifted = peakIndexShifted + j;

        if (binIndexShifted >= this.magnitudes.length) {
          break;
        }

        // apply phase correction
        let omegaDelta = (2 * Math.PI * (binIndexShifted - binIndex)) / this.fftSize;
        let phaseShiftReal = Math.cos(omegaDelta * this.timeCursor);
        let phaseShiftImag = Math.sin(omegaDelta * this.timeCursor);

        let indexReal = binIndex * 2;
        let indexImag = indexReal + 1;
        let valueReal = this.freqComplexBuffer[indexReal];
        let valueImag = this.freqComplexBuffer[indexImag];

        let valueShiftedReal = valueReal * phaseShiftReal - valueImag * phaseShiftImag;
        let valueShiftedImag = valueReal * phaseShiftImag + valueImag * phaseShiftReal;

        let indexShiftedReal = binIndexShifted * 2;
        let indexShiftedImag = indexShiftedReal + 1;
        this.freqComplexBufferShifted[indexShiftedReal] += valueShiftedReal;
        this.freqComplexBufferShifted[indexShiftedImag] += valueShiftedImag;
      }
    }
  }
}

registerProcessor('phase-vocoder-processor', PhaseVocoderProcessor);

// Adapted from https://www.musicdsp.org/en/latest/Effects/221-band-limited-pwm-generator.html
class PulseOscillatorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.pi = _PI;
    this.phi = -this.pi; // phase
    this.Y0 = 0; // feedback memories
    this.Y1 = 0;
    this.PW = this.pi; // pulse width
    this.B = 2.3; // feedback coefficient
    this.dphif = 0; // filtered phase increment
    this.envf = 0; // filtered envelope
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
        name: 'detune',
        defaultValue: 0,
        min: Number.NEGATIVE_INFINITY,
        max: Number.POSITIVE_INFINITY,
      },
      {
        name: 'pulsewidth',
        defaultValue: 1,
        min: 0,
        max: Number.POSITIVE_INFINITY,
      },
    ];
  }

  process(inputs, outputs, params) {
    if (currentTime <= params.begin[0]) {
      return true;
    }
    if (currentTime >= params.end[0]) {
      return false;
    }
    const output = outputs[0];
    let env = 1,
      dphi;

    for (let i = 0; i < (output[0].length ?? 0); i++) {
      const pw = (1 - clamp(getParamValue(i, params.pulsewidth), -0.99, 0.99)) * this.pi;
      const detune = getParamValue(i, params.detune);
      const freq = applySemitoneDetuneToFrequency(getParamValue(i, params.frequency), detune / 100);

      dphi = freq * (this.pi / (sampleRate * 0.5)); // phase increment
      this.dphif += 0.1 * (dphi - this.dphif);

      env *= 0.9998; // exponential decay envelope
      this.envf += 0.1 * (env - this.envf);

      // Feedback coefficient control
      this.B = 2.3 * (1 - 0.0001 * freq); // feedback limitation
      if (this.B < 0) this.B = 0;

      // Waveform generation (half-Tomisawa oscillators)
      this.phi += this.dphif; // phase increment
      if (this.phi >= this.pi) this.phi -= 2 * this.pi; // phase wrapping

      // First half-Tomisawa generator
      let out0 = Math.cos(this.phi + this.B * this.Y0); // self-phase modulation
      this.Y0 = 0.5 * (out0 + this.Y0); // anti-hunting filter

      // Second half-Tomisawa generator (with phase offset for pulse width)
      let out1 = Math.cos(this.phi + this.B * this.Y1 + pw);
      this.Y1 = 0.5 * (out1 + this.Y1); // anti-hunting filter

      for (let o = 0; o < output.length; o++) {
        // Combination of both oscillators with envelope applied
        output[o][i] = 0.15 * (out0 - out1) * this.envf;
      }
    }

    return true; // keep the audio processing going
  }
}

registerProcessor('pulse-oscillator', PulseOscillatorProcessor);
