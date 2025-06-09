// this is dough, the superdough without dependencies
const SAMPLE_RATE = typeof sampleRate !== 'undefined' ? sampleRate : 48000;
const ISR = 1 / SAMPLE_RATE;
// https://garten.salat.dev/audio-DSP/oscillators.html
export class SineOsc {
  phase = 0;
  update(freq) {
    const value = Math.sin(this.phase * 2 * Math.PI);
    this.phase = (this.phase + freq / SAMPLE_RATE) % 1;
    return value;
  }
}

export class ZawOsc {
  phase = 0;
  update(freq) {
    this.phase += ISR * freq;
    return (this.phase % 1) * 2 - 1;
  }
}

function polyBlep(t, dt) {
  // 0 <= t < 1
  if (t < dt) {
    t /= dt;
    // 2 * (t - t^2/2 - 0.5)
    return t + t - t * t - 1;
  }
  // -1 < t < 0
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    // 2 * (t^2/2 + t + 0.5)
    return t * t + t + t + 1;
  }
  // 0 otherwise
  return 0;
}
export class SawOsc {
  //phase = Math.random();
  phase = 0;
  update(freq) {
    const dt = freq / SAMPLE_RATE;
    let p = polyBlep(this.phase, dt);
    let s = 2 * this.phase - 1 - p;
    this.phase += dt;
    if (this.phase > 1) {
      this.phase -= 1;
    }
    return s;
  }
}

export class TriOsc {
  phase = 0;
  update(freq) {
    this.phase += ISR * freq;
    let phase = this.phase % 1;
    let value = phase < 0.5 ? 2 * phase : 1 - 2 * (phase - 0.5);
    return value * 2 - 1;
  }
}

export class TwoPoleFilter {
  s0 = 0;
  s1 = 0;
  update(s, cutoff, resonance = 0) {
    // Out of bound values can produce NaNs
    cutoff = Math.min(cutoff, 1);
    resonance = Math.max(resonance, 0);
    var c = Math.pow(0.5, (1 - cutoff) / 0.125);
    var r = Math.pow(0.5, (resonance + 0.125) / 0.125);
    var mrc = 1 - r * c;

    this.s0 = mrc * this.s0 - c * this.s1 + c * s; // bpf
    this.s1 = mrc * this.s1 + c * this.s0; // lpf
    return this.s1; // return lpf by default
  }
}

class PulseOsc {
  constructor(phase = 0) {
    this.phase = phase;
  }
  saw(offset, dt) {
    let phase = (this.phase + offset) % 1;
    let p = polyBlep(phase, dt);
    return 2 * phase - 1 - p;
  }
  update(freq, pw = 0.5) {
    const dt = freq / sampleRate;
    let pulse = this.saw(0, dt) - this.saw(pw, dt);
    this.phase = (this.phase + dt) % 1;
    return pulse + pw * 2 - 1;
  }
}

// non bandlimited (has aliasing)
export class PulzeOsc {
  phase = 0;
  update(freq, duty = 0.5) {
    this.phase += ISR * freq;
    let cyclePos = this.phase % 1;
    return cyclePos < duty ? 1 : -1;
  }
}

export class Dust {
  update = (density) => (Math.random() < density * ISR ? Math.random() : 0);
}

export class WhiteNoise {
  update() {
    return Math.random() * 2 - 1;
  }
}

export class BrownNoise {
  constructor() {
    this.out = 0;
  }
  update() {
    let white = Math.random() * 2 - 1;
    this.out = (this.out + 0.02 * white) / 1.02;
    return this.out;
  }
}

export class PinkNoise {
  constructor() {
    this.b0 = 0;
    this.b1 = 0;
    this.b2 = 0;
    this.b3 = 0;
    this.b4 = 0;
    this.b5 = 0;
    this.b6 = 0;
  }

  update() {
    const white = Math.random() * 2 - 1;

    this.b0 = 0.99886 * this.b0 + white * 0.0555179;
    this.b1 = 0.99332 * this.b1 + white * 0.0750759;
    this.b2 = 0.969 * this.b2 + white * 0.153852;
    this.b3 = 0.8665 * this.b3 + white * 0.3104856;
    this.b4 = 0.55 * this.b4 + white * 0.5329522;
    this.b5 = -0.7616 * this.b5 - white * 0.016898;

    const pink = this.b0 + this.b1 + this.b2 + this.b3 + this.b4 + this.b5 + this.b6 + white * 0.5362;
    this.b6 = white * 0.115926;

    return pink * 0.11;
  }
}

export class Impulse {
  phase = 1;
  update(freq) {
    this.phase += ISR * freq;
    let v = this.phase >= 1 ? 1 : 0;
    this.phase = this.phase % 1;
    return v;
  }
}

export class ClockDiv {
  inSgn = true;
  outSgn = true;
  clockCnt = 0;
  update(clock, factor) {
    let curSgn = clock > 0;
    if (this.inSgn != curSgn) {
      this.clockCnt++;
      if (this.clockCnt >= factor) {
        this.clockCnt = 0;
        this.outSgn = !this.outSgn;
      }
    }

    this.inSgn = curSgn;
    return this.outSgn ? 1 : -1;
  }
}

export class Hold {
  value = 0;
  trigSgn = false;
  update(input, trig) {
    if (!this.trigSgn && trig > 0) this.value = input;
    this.trigSgn = trig > 0;
    return this.value;
  }
}

function lerp(x, y0, y1, exponent = 1) {
  if (x <= 0) return y0;
  if (x >= 1) return y1;

  let curvedX;

  if (exponent === 0) {
    curvedX = x; // linear
  } else if (exponent > 0) {
    curvedX = Math.pow(x, exponent); // ease-in
  } else {
    curvedX = 1 - Math.pow(1 - x, -exponent); // ease-out
  }

  return y0 + (y1 - y0) * curvedX;
}

export class ADSR {
  constructor(props = {}) {
    this.state = 'off';
    this.startTime = 0;
    this.startVal = 0;
    this.decayCurve = props.decayCurve ?? 1;
  }

  update(curTime, gate, attack, decay, susVal, release) {
    switch (this.state) {
      case 'off': {
        if (gate > 0) {
          this.state = 'attack';
          this.startTime = curTime;
          this.startVal = 0;
        }
        return 0;
      }
      case 'attack': {
        let time = curTime - this.startTime;
        if (time > attack) {
          this.state = 'decay';
          this.startTime = curTime;
          return 1;
        }
        return lerp(time / attack, this.startVal, 1, 1);
      }
      case 'decay': {
        let time = curTime - this.startTime;
        let curVal = lerp(time / decay, 1, susVal, -this.decayCurve);
        if (gate <= 0) {
          this.state = 'release';
          this.startTime = curTime;
          this.startVal = curVal;
          return curVal;
        }
        if (time > decay) {
          this.state = 'sustain';
          this.startTime = curTime;
          return susVal;
        }
        return curVal;
      }
      case 'sustain': {
        if (gate <= 0) {
          this.state = 'release';
          this.startTime = curTime;
          this.startVal = susVal;
        }
        return susVal;
      }
      case 'release': {
        let time = curTime - this.startTime;

        if (time > release) {
          this.state = 'off';
          return 0;
        }
        let curVal = lerp(time / release, this.startVal, 0, -this.decayCurve);
        if (gate > 0) {
          this.state = 'attack';
          this.startTime = curTime;
          this.startVal = curVal;
        }
        return curVal;
      }
    }
    throw 'invalid envelope state';
  }
}

/*
        impulse(1).ad(.1).mul(sine(200))
.add(x=>x.delay(.1).mul(.8))
.out()*/
const MAX_DELAY_TIME = 10;
export class Delay {
  writeIdx = 0;
  readIdx = 0;
  buffer = new Float32Array(MAX_DELAY_TIME * SAMPLE_RATE); //.fill(0)
  write(s, delayTime) {
    this.writeIdx = (this.writeIdx + 1) % this.buffer.length;
    this.buffer[this.writeIdx] = s;
    // Calculate how far in the past to read
    let numSamples = Math.min(Math.floor(SAMPLE_RATE * delayTime), this.buffer.length - 1);
    this.readIdx = this.writeIdx - numSamples;
    // If past the start of the buffer, wrap around
    if (this.readIdx < 0) this.readIdx += this.buffer.length;
  }
  update(input, delayTime) {
    this.write(input, delayTime);
    return this.buffer[this.readIdx];
  }
}

export class Fold {
  update(input = 0, rate = 0) {
    if (rate < 0) rate = 0;
    rate = rate + 1;
    input = input * rate;
    return 4 * (Math.abs(0.25 * input + 0.25 - Math.round(0.25 * input + 0.25)) - 0.25);
  }
}

export class Lag {
  lagUnit = 4410;
  s = 0;
  update(input, rate) {
    // Remap so the useful range is around [0, 1]
    rate = rate * this.lagUnit;
    if (rate < 1) rate = 1;
    this.s += (1 / rate) * (input - this.s);
    return this.s;
  }
}

export class Slew {
  last = 0;
  update(input, up, dn) {
    const upStep = up * ISR;
    const downStep = dn * ISR;
    let delta = input - this.last;
    if (delta > upStep) {
      delta = upStep;
    } else if (delta < -downStep) {
      delta = -downStep;
    }
    this.last += delta;
    return this.last;
  }
}

// overdrive style distortion (adapted from noisecraft) currently unused
export function applyDistortion(x, amount) {
  amount = Math.min(Math.max(amount, 0), 1);
  amount -= 0.01;
  var k = (2 * amount) / (1 - amount);
  var y = ((1 + k) * x) / (1 + k * Math.abs(x));
  return y;
}

export class Sequence {
  clockSgn = true;
  step = 0;
  first = true;
  update(clock, ...ins) {
    if (!this.clockSgn && clock > 0) {
      this.step = (this.step + 1) % ins.length;
      this.clockSgn = clock > 0;
      return 0; // set first sample to zero to retrigger gates on step change...
    }
    this.clockSgn = clock > 0;
    return ins[this.step];
  }
}

// sample rate bit crusher
export class Coarse {
  hold = 0;
  t = 0;
  update(input, coarse) {
    if (this.t++ % coarse === 0) {
      this.t = 0;
      this.hold = input;
    }
    return this.hold;
  }
}

// amplitude bit crusher
export class Crush {
  update(input, crush) {
    crush = Math.max(1, crush);
    const x = Math.pow(2, crush - 1);
    return Math.round(input * x) / x;
  }
}

// this is the distort from superdough
export class Distort {
  update(input, distort = 0, postgain = 1) {
    postgain = Math.max(0.001, Math.min(1, postgain));
    const shape = Math.expm1(distort);
    return (((1 + shape) * input) / (1 + shape * Math.abs(input))) * postgain;
  }
}
// distortion could be expressed as a function, because it's stateless

export class BufferPlayer {
  static samples = new Map(); // string -> { channels, sampleRate }
  buffer; // Float32Array
  sampleRate;
  pos = 0;
  sampleFreq = note2freq();
  constructor(buffer, sampleRate) {
    this.buffer = buffer;
    this.sampleRate = sampleRate;
  }
  update(freq) {
    if (this.pos >= this.buffer.length) {
      return 0;
    }
    const speed = ((freq / this.sampleFreq) * SAMPLE_RATE) / this.sampleRate;
    let s = this.buffer[Math.floor(this.pos)];
    this.pos = this.pos + speed;
    return s;
  }
}

export function _rangex(sig, min, max) {
  let logmin = Math.log(min);
  let range = Math.log(max) - logmin;
  const unipolar = (sig + 1) / 2;
  return Math.exp(unipolar * range + logmin);
}

// duplicate
export const getADSR = (params, curve = 'linear', defaultValues) => {
  const envmin = curve === 'exponential' ? 0.001 : 0.001;
  const releaseMin = 0.01;
  const envmax = 1;
  const [a, d, s, r] = params;
  if (a == null && d == null && s == null && r == null) {
    return defaultValues ?? [envmin, envmin, envmax, releaseMin];
  }
  const sustain = s != null ? s : (a != null && d == null) || (a == null && d == null) ? envmax : envmin;
  return [Math.max(a ?? 0, envmin), Math.max(d ?? 0, envmin), Math.min(sustain, envmax), Math.max(r ?? 0, releaseMin)];
};

let shapes = {
  sine: SineOsc,
  saw: SawOsc,
  zaw: ZawOsc,
  sawtooth: SawOsc,
  zawtooth: ZawOsc,
  tri: TriOsc,
  triangle: TriOsc,
  pulse: PulseOsc,
  square: PulseOsc,
  pulze: PulzeOsc,
  dust: Dust,
  crackle: Dust,
  impulse: Impulse,
  white: WhiteNoise,
  brown: BrownNoise,
  pink: PinkNoise,
};

const defaultDefaultValues = {
  note: 48,
  s: 'triangle',
  gain: 1,
  postgain: 1,
  velocity: 1,
  density: '.03',
  ftype: '12db',
  fanchor: 0,
  //resonance: 1, // superdough resonance is scaled differently
  resonance: 0,
  //hresonance: 1, // superdough resonance is scaled differently
  hresonance: 0,
  // bandq: 1,  // superdough resonance is scaled differently
  bandq: 0,
  channels: [1, 2],
  phaserdepth: 0.75,
  shapevol: 1,
  distortvol: 1,
  delay: 0,
  byteBeatExpression: '0',
  delayfeedback: 0.5,
  delaytime: 0.25,
  orbit: 1,
  i: 1,
  fft: 8,
  z: 'triangle',
  pan: 0.5,
  fmh: 1,
  fmenv: 0, // differs from superdough
};

let getDefaultValue = (key) => defaultDefaultValues[key];

const chromas = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const accs = { '#': 1, b: -1, s: 1, f: -1 };
const note2midi = (note, defaultOctave = 3) => {
  let [pc, acc = '', oct = ''] =
    String(note)
      .match(/^([a-gA-G])([#bsf]*)([0-9]*)$/)
      ?.slice(1) || [];
  if (!pc) {
    throw new Error('not a note: "' + note + '"');
  }
  const chroma = chromas[pc.toLowerCase()];
  const offset = acc?.split('').reduce((o, char) => o + accs[char], 0) || 0;
  oct = Number(oct || defaultOctave);
  return (oct + 1) * 12 + chroma + offset;
};
const midi2freq = (midi) => Math.pow(2, (midi - 69) / 12) * 440;
const note2freq = (note) => {
  note = note || getDefaultValue('note');
  if (typeof note === 'string') {
    note = note2midi(note, 3); // e.g. c3 => 48
  }
  return midi2freq(note);
};

export class DoughVoice {
  out = [0, 0];
  constructor(value) {
    value.freq ??= note2freq(value.note);
    let $ = this;
    Object.assign($, value);
    $.s = $.s ?? getDefaultValue('s');
    $.gain = $.gain ?? getDefaultValue('gain');
    $.velocity = $.velocity ?? getDefaultValue('velocity');
    $.postgain = $.postgain ?? getDefaultValue('postgain');
    $.density = $.density ?? getDefaultValue('density');
    $.fanchor = $.fanchor ?? getDefaultValue('fanchor');
    $.drive = $.drive ?? 0.69;
    $.phaserdepth = $.phaserdepth ?? getDefaultValue('phaserdepth');
    $.shapevol = $.shapevol ?? getDefaultValue('shapevol');
    $.distortvol = $.distortvol ?? getDefaultValue('distortvol');
    $.i = $.i ?? getDefaultValue('i');
    $.fft = $.fft ?? getDefaultValue('fft');
    $.pan = $.pan ?? getDefaultValue('pan');
    $.orbit = $.orbit ?? getDefaultValue('orbit');
    $.fmenv = $.fmenv ?? getDefaultValue('fmenv');
    $.resonance = $.resonance ?? getDefaultValue('resonance');
    $.hresonance = $.hresonance ?? getDefaultValue('hresonance');
    $.bandq = $.bandq ?? getDefaultValue('bandq');

    [$.attack, $.decay, $.sustain, $.release] = getADSR([$.attack, $.decay, $.sustain, $.release]);

    $._holdEnd = $._begin + $._duration; // needed for gate
    $._end = $._holdEnd + $.release + 0.01; // needed for despawn

    $.s ??= 'triangle';
    if ($.s === 'saw' || $.s === 'sawtooth') {
      $.s = 'zaw'; // polyblepped saw when fm is applied
    }

    if (shapes[$.s]) {
      const SourceClass = shapes[$.s];
      $._sound = new SourceClass();
      $._channels = 1;
    } else if (BufferPlayer.samples.has($.s)) {
      const sample = BufferPlayer.samples.get($.s);
      $._buffers = [];
      $._channels = sample.channels.length;
      for (let i = 0; i < $._channels; i++) {
        $._buffers.push(new BufferPlayer(sample.channels[i], sample.sampleRate));
      }
    } else {
      console.warn('sound not found', $.s);
    }

    if ($.penv) {
      $._penv = new ADSR({ decayCurve: 4 });
      [$.pattack, $.pdecay, $.psustain, $.prelease] = getADSR([$.pattack, $.pdecay, $.psustain, $.prelease]);
    }

    if ($.fmi) {
      $._fm = new SineOsc();
      $.fmh = $.fmh ?? getDefaultValue('fmh');
      if ($.fmenv) {
        $._fmenv = new ADSR({ decayCurve: 2 });
        [$.fmattack, $.fmdecay, $.fmsustain, $.fmrelease] = getADSR([$.fmattack, $.fmdecay, $.fmsustain, $.fmrelease]);
      }
    }

    // gain envelope
    $._adsr = new ADSR({ decayCurve: 2 });
    // delay
    $.delay = $.delay ?? getDefaultValue('delay');
    $.delayfeedback = $.delayfeedback ?? getDefaultValue('delayfeedback');
    $.delaytime = $.delaytime ?? getDefaultValue('delaytime');

    // precalculated values
    $.piOverSr = Math.PI / value.sampleRate;
    $.eighthOverLogHalf = 0.125 / Math.log(0.5);

    // filter setup
    if ($.lpenv) {
      $._lpenv = new ADSR({ decayCurve: 4 });
      [$.lpattack, $.lpdecay, $.lpsustain, $.lprelease] = getADSR([$.lpattack, $.lpdecay, $.lpsustain, $.lprelease]);
    }
    if ($.hpenv) {
      $._hpenv = new ADSR({ decayCurve: 4 });
      [$.hpattack, $.hpdecay, $.hpsustain, $.hprelease] = getADSR([$.hpattack, $.hpdecay, $.hpsustain, $.hprelease]);
    }
    if ($.bpenv) {
      $._bpenv = new ADSR({ decayCurve: 4 });
      [$.bpattack, $.bpdecay, $.bpsustain, $.bprelease] = getADSR([$.bpattack, $.bpdecay, $.bpsustain, $.bprelease]);
    }

    // channelwise effects setup
    $._lpf = $.cutoff ? [] : null;
    $._hpf = $.hcutoff ? [] : null;
    $._bpf = $.bandf ? [] : null;
    $._coarse = $.coarse ? [] : null;
    $._crush = $.crush ? [] : null;
    $._distort = $.distort ? [] : null;
    for (let i = 0; i < this._channels; i++) {
      $._lpf?.push(new TwoPoleFilter());
      $._hpf?.push(new TwoPoleFilter());
      $._bpf?.push(new TwoPoleFilter());
      $._coarse?.push(new Coarse());
      $._crush?.push(new Crush());
      $._distort?.push(new Distort());
    }
  }
  // credits to pulu: https://github.com/felixroos/kabelsalat/issues/35
  freq2cutoff(freq) {
    const c = 2 * Math.sin(freq * this.piOverSr);
    return 1 - Math.log(c) * this.eighthOverLogHalf;
  }
  update(t) {
    if (!this._sound && !this._buffers) {
      return 0;
    }
    let gate = Number(t >= this._begin && t <= this._holdEnd);

    let freq = this.freq;
    // frequency modulation
    if (this._fm) {
      let fmi = this.fmi;
      if (this._fmenv) {
        const env = this._fmenv.update(t, gate, this.fmattack, this.fmdecay, this.fmsustain, this.fmrelease);
        fmi = this.fmenv * env * fmi;
      }
      const modfreq = freq * this.fmh;
      const modgain = modfreq * fmi;
      freq = freq + this._fm.update(modfreq) * modgain;
    }

    // pitch envelope
    if (this._penv) {
      const env = this._penv.update(t, gate, this.pattack, this.pdecay, this.psustain, this.prelease);
      freq = freq + env * this.penv;
    }

    // filters
    let lpf = this.cutoff;
    if (this._lpf) {
      if (this._lpenv) {
        const env = this._lpenv.update(t, gate, this.lpattack, this.lpdecay, this.lpsustain, this.lprelease);
        lpf = this.lpenv * env * lpf + lpf;
      }
      lpf = this.freq2cutoff(lpf);
    }
    let hpf = this.hcutoff;
    if (this._hpf) {
      if (this._hpenv) {
        const env = this._hpenv.update(t, gate, this.hpattack, this.hpdecay, this.hpsustain, this.hprelease);
        hpf = 2 ** this.hpenv * env * hpf + hpf;
      }
      hpf = this.freq2cutoff(hpf);
    }
    let bpf = this.bandf;
    if (this._bpf) {
      if (this._bpenv) {
        const env = this._bpenv.update(t, gate, this.bpattack, this.bpdecay, this.bpsustain, this.bprelease);
        bpf = 2 ** this.bpenv * env * bpf + bpf;
      }
      bpf = this.freq2cutoff(bpf);
    }
    // gain envelope
    const env = this._adsr.update(t, gate, this.attack, this.decay, this.sustain, this.release);

    // channelwise dsp
    for (let i = 0; i < this._channels; i++) {
      // sound source
      if (this._sound && this.s === 'pulse') {
        this.out[i] = this._sound.update(freq, this.pw ?? 0.5);
      } else if (this._sound) {
        this.out[i] = this._sound.update(freq);
      } else if (this._buffers) {
        this.out[i] = this._buffers[i].update(freq);
      }
      this.out[i] = this.out[i] * this.gain * this.velocity;

      if (this._lpf) {
        this._lpf[i].update(this.out[i], lpf, this.resonance);
        this.out[i] = this._lpf[i].s1;
      }
      if (this._hpf) {
        this._hpf[i].update(this.out[i], hpf, this.hresonance);
        this.out[i] = this.out[i] - this._hpf[i].s1;
      }
      if (this._bpf) {
        this._bpf[i].update(this.out[i], bpf, this.bandq);
        this.out[i] = this._bpf[i].s0;
      }
      if (this._coarse) {
        this.out[i] = this._coarse[i].update(this.out[i], this.coarse);
      }
      if (this._crush) {
        this.out[i] = this._crush[i].update(this.out[i], this.crush);
      }
      if (this._distort) {
        this.out[i] = this._distort[i].update(this.out[i], this.distort, this.distortvol);
      }
      this.out[i] = this.out[i] * env;
      this.out[i] = this.out[i] * this.postgain;
      if (!this._buffers) {
        this.out[i] = this.out[i] * 0.2; // turn down waveform
      }
    }
    if (this._channels === 1) {
      this.out[1] = this.out[0];
    }
    if (this.pan !== 0.5) {
      const panpos = (this.pan * Math.PI) / 2;
      this.out[0] = this.out[0] * Math.cos(panpos);
      this.out[1] = this.out[1] * Math.sin(panpos);
    }
  }
}

// this class is the interface to the "outer world"
// it handles spawning and despawning of DoughVoice's
export class Dough {
  voices = []; // DoughVoice[]
  vid = 0;
  q = [];
  out = [0, 0];
  delaysend = [0, 0];
  delaytime = getDefaultValue('delaytime');
  delayfeedback = getDefaultValue('delayfeedback');
  t = 0;
  // sampleRate: number, currentTime: number (seconds)
  constructor(sampleRate = 48000, currentTime = 0) {
    this.sampleRate = sampleRate;
    this.t = Math.floor(currentTime * sampleRate); // samples
    // console.log('init dough', this.sampleRate, this.t);
    this._delayL = new Delay();
    this._delayR = new Delay();
  }
  loadSample(name, channels, sampleRate) {
    BufferPlayer.samples.set(name, { channels, sampleRate });
  }
  scheduleSpawn(value) {
    if (value._begin === undefined) {
      throw new Error('[dough]: scheduleSpawn expected _begin to be set');
    }
    if (value._duration === undefined) {
      throw new Error('[dough]: scheduleSpawn expected _duration to be set');
    }
    value.sampleRate = this.sampleRate;
    // convert seconds to samples
    const time = Math.floor(value._begin * this.sampleRate); // set from supradough.mjs
    this.schedule({ time, type: 'spawn', arg: value });
  }
  spawn(value) {
    value.id = this.vid++;
    const voice = new DoughVoice(value);
    this.voices.push(voice);
    // console.log('spawn', voice.id, 'voices:', this.voices.length);
    // schedule removal
    const endTime = Math.ceil(voice._end * this.sampleRate);
    this.schedule({ time: endTime /* + 48000 */, type: 'despawn', arg: voice.id });
  }
  despawn(vid) {
    this.voices = this.voices.filter((v) => v.id !== vid);
    // console.log('despawn', vid, 'voices:', this.voices.length);
  }
  // schedules a function call with a single argument
  // msg = {time:number,type:string, arg: any}
  // the Dough method "type" will be called with "arg" at "time"
  schedule(msg) {
    if (!this.q.length) {
      // if empty, just push
      this.q.push(msg);
      return;
    }
    // not empty
    // find index where msg.time fits in
    let i = 0;
    while (i < this.q.length && this.q[i].time < msg.time) {
      i++;
    }
    // this ensures q stays sorted by time, so we only need to check q[0]
    this.q.splice(i, 0, msg);
  }
  // maybe update should be called once per block instead for perf reasons?
  update() {
    // go over q
    while (this.q.length > 0 && this.q[0].time <= this.t) {
      // console.log('schedule', this.q[0]);
      // trigger due messages. q is sorted, so we only need to check q[0]
      this[this.q[0].type](this.q[0].arg); // type is expected to be a Dough method
      this.q.shift();
    }
    // add active voices
    this.out[0] = 0;
    this.out[1] = 0;
    for (let v = 0; v < this.voices.length; v++) {
      this.voices[v].update(this.t / this.sampleRate);
      this.out[0] += this.voices[v].out[0];
      this.out[1] += this.voices[v].out[1];
      if (this.voices[v].delay) {
        this.delaysend[0] += this.voices[v].out[0] * this.voices[v].delay;
        this.delaysend[1] += this.voices[v].out[1] * this.voices[v].delay;
        this.delaytime = this.voices[v].delaytime; // we trust that these are initialized in the voice
        this.delayfeedback = this.voices[v].delayfeedback;
      }
    }
    // todo: how to change delaytime / delayfeedback from a voice?
    const delayL = this._delayL.update(this.delaysend[0], this.delaytime);
    const delayR = this._delayR.update(this.delaysend[1], this.delaytime);
    this.delaysend[0] = delayL * this.delayfeedback;
    this.delaysend[1] = delayR * this.delayfeedback;
    this.out[0] += delayL;
    this.out[1] += delayR;
    this.t++;
  }
}
