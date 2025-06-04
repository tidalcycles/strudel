// this is dough, the superdough without dependencies

const ISR = 1 / sampleRate;
// https://garten.salat.dev/audio-DSP/oscillators.html
export class SineOsc {
  phase = 0;
  update(freq) {
    const value = Math.sin(this.phase * 2 * Math.PI);
    this.phase = (this.phase + freq / sampleRate) % 1;
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
    const dt = freq / sampleRate;
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

export class Lpf {
  s0 = 0;
  s1 = 0;
  update(s, cutoff, resonance = 0) {
    // Out of bound values can produce NaNs
    cutoff = Math.min(cutoff, 1);
    resonance = Math.max(resonance, 0);
    var c = Math.pow(0.5, (1 - cutoff) / 0.125);
    var r = Math.pow(0.5, (resonance + 0.125) / 0.125);
    var mrc = 1 - r * c;
    var v0 = this.s0;
    var v1 = this.s1;
    // Apply the filter to the sample
    v0 = mrc * v0 - c * v1 + c * s;
    v1 = mrc * v1 + c * v0;
    s = v1;
    this.s0 = v0;
    this.s1 = v1;
    return s;
  }
}

export class PulseOsc {
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

function lerp(x, y0, y1) {
  if (x >= 1) return y1;

  return y0 + x * (y1 - y0);
}

export class ADSR {
  state = 'off';
  startTime = 0;
  startVal = 0;

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
        return lerp(time / attack, this.startVal, 1);
      }
      case 'decay': {
        let time = curTime - this.startTime;
        let curVal = lerp(time / decay, 1, susVal);
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
        let curVal = lerp(time / release, this.startVal, 0);
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
  buffer = new Float32Array(MAX_DELAY_TIME * sampleRate); // .fill(0)
  write(s, delayTime) {
    this.writeIdx = (this.writeIdx + 1) % this.buffer.length;
    this.buffer[this.writeIdx] = s;
    // Calculate how far in the past to read
    let numSamples = Math.min(Math.floor(sampleRate * delayTime), this.buffer.length - 1);
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

export function _rangex(sig, min, max) {
  let logmin = Math.log(min);
  let range = Math.log(max) - logmin;
  const unipolar = (sig + 1) / 2;
  return Math.exp(unipolar * range + logmin);
}

// duplicate
export const getADSRValues = (params, curve = 'linear', defaultValues) => {
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
let oscillators = {
  sine: SineOsc,
  saw: SawOsc,
  zaw: ZawOsc,
  sawtooth: SawOsc,
  zawtooth: ZawOsc,
  tri: TriOsc,
  triangle: TriOsc,
  pulse: PulseOsc,
  dust: Dust,
  impulse: Impulse,
};

const defaultDefaultValues = {
  s: 'triangle',
  gain: 0.8,
  postgain: 1,
  density: '.03',
  ftype: '12db',
  fanchor: 0,
  resonance: 1,
  hresonance: 1,
  bandq: 1,
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
  velocity: 1,
  fft: 8,
  z: 'triangle',
};

let getDefaultValue = (key) => defaultDefaultValues[key];

export class Dough {
  init(value, sampleRate) {

    // params without defaults:
    /*
    bank,
    source,
    cutoff,
    lpenv,
    lpattack,
    lpdecay,
    lpsustain,
    lprelease,
    hpenv,
    hcutoff,
    hpattack,
    hpdecay,
    hpsustain,
    hprelease,
    bpenv,
    bandf,
    bpattack,
    bpdecay,
    bpsustain,
    bprelease,
    phaserrate,
    phasersweep,
    phasercenter,
    coarse,
    crush,
    shape,
    distort,
    pan,
    vowel,
    room,
    roomfade,
    roomlp,
    roomdim,
    roomsize,
    ir,
    analyze,
    */
    Object.assign(this, value);
    // params with defaults:
    this.s = this.s ?? getDefaultValue('s');
    this.gain = this.gain ?? getDefaultValue('gain');
    this.postgain = this.postgain ?? getDefaultValue('postgain');
    this.density = this.density ?? getDefaultValue('density');
    this.fanchor = this.fanchor ?? getDefaultValue('fanchor');
    this.drive = this.drive ?? 0.69;
    this.resonance = this.resonance ?? getDefaultValue('resonance');
    this.hresonance = this.hresonance ?? getDefaultValue('hresonance');
    this.bandq = this.bandq ?? getDefaultValue('bandq');
    this.phaserdepth = this.phaserdepth ?? getDefaultValue('phaserdepth');
    this.shapevol = this.shapevol ?? getDefaultValue('shapevol');
    this.distortvol = this.distortvol ?? getDefaultValue('distortvol');
    this.delay = this.delay ?? getDefaultValue('delay');
    this.delayfeedback = this.delayfeedback ?? getDefaultValue('delayfeedback');
    this.delaytime = this.delaytime ?? getDefaultValue('delaytime');
    this.orbit = this.orbit ?? getDefaultValue('orbit');
    this.i = this.i ?? getDefaultValue('i');
    this.velocity = this.velocity ?? getDefaultValue('velocity');
    this.fft = this.fft ?? getDefaultValue('fft');

    [this.attack, this.decay, this.sustain, this.release] = getADSRValues([
      this.attack,
      this.decay,
      this.sustain,
      this.release,
    ]);

    const SourceClass = oscillators[this.s] ?? TriOsc;
    this._sound = new SourceClass();
    this._lpf = this.cutoff ? new Lpf() : null;
    this._adsr = new ADSR();

    this.piOverSr = Math.PI / sampleRate;
    this.eighthOverLogHalf = 0.125 / Math.log(0.5);
  }
  // credits to pulu: https://github.com/felixroos/kabelsalat/issues/35
  freq2cutoff(freq) {
    const c = 2 * Math.sin(freq * this.piOverSr);
    return 1 - Math.log(c) * this.eighthOverLogHalf;
  }
  update(t) {
    if (!this._sound) {
      return 0;
    }
    // sound source
    let s = this._sound.update(this.freq);
    // lpf
    if (this._lpf) {
      const cutoff = this.freq2cutoff(this.cutoff);
      s = this._lpf ? this._lpf.update(s, cutoff, this.resonance) : s;
    }
    // not sure if gain is applied here
    s = s * this.gain;
    // envelope
    let gate = Number(t >= this._begin && t <= this._holdEnd);

    /* Math.random() > 0.99 && console.log('gate', gate); */
    const env = this._adsr.update(t, gate, this.attack, this.decay, this.sustain, this.release);
    s = s * env;

    s = s * this.postgain * .2
    return s;
  }
}
