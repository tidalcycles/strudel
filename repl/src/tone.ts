import { Pattern as _Pattern } from '../../strudel.mjs';
import { AutoFilter, Destination, Filter, Gain, isNote, Synth, PolySynth } from 'tone';

const Pattern = _Pattern as any;

// with this function, you can play the pattern with any tone synth
Pattern.prototype.tone = function (instrument) {
  // instrument.toDestination();
  return this.fmap((value: any) => {
    value = typeof value !== 'object' && !Array.isArray(value) ? { value } : value;
    const onTrigger = (time, event) => {
      if (instrument.constructor.name === 'PluckSynth') {
        instrument.triggerAttack(value.value, time);
      } else if (instrument.constructor.name === 'NoiseSynth') {
        instrument.triggerAttackRelease(event.duration, time); // noise has no value
      } else {
        instrument.triggerAttackRelease(value.value, event.duration, time);
      }
    };
    return { ...value, instrument, onTrigger };
  });
};

Pattern.prototype.define('tone', (type, pat) => pat.tone(type), { composable: true, patternified: false });

// helpers

export const vol = (v) => new Gain(v);
export const lowpass = (v) => new Filter(v, 'lowpass');
export const highpass = (v) => new Filter(v, 'highpass');
export const adsr = (a, d = 0.1, s = 0.4, r = 0.01) => ({ envelope: { attack: a, decay: d, sustain: s, release: r } });
export const osc = (type) => ({ oscillator: { type } });
export const out = Destination;

/*

You are entering experimental zone

*/

// the following code is an attempt to minimize tonejs code.. it is still an experiment

const chainable = function (instr) {
  const _chain = instr.chain.bind(instr);
  let chained: any = [];
  instr.chain = (...args) => {
    chained = chained.concat(args);
    instr.disconnect(); // disconnect from destination / previous chain
    return _chain(...chained, Destination);
  };
  // shortcuts: chaining multiple won't work forn now.. like filter(1000).gain(0.5). use chain + native Tone calls instead
  instr.filter = (freq = 1000, type: BiquadFilterType = 'lowpass') =>
    instr.chain(
      new Filter(freq, type) // .Q.setValueAtTime(q, time);
    );
  instr.gain = (gain: number = 0.9) => instr.chain(new Gain(gain));
  return instr;
};

// helpers
export const poly = (type) => {
  const s: any = new PolySynth(Synth, { oscillator: { type } }).toDestination();
  return chainable(s);
};

Pattern.prototype._poly = function (type: any = 'triangle') {
  const instrumentConfig: any = {
    oscillator: { type },
    envelope: { attack: 0.01, decay: 0.01, sustain: 0.6, release: 0.01 },
  };
  if (!this.instrument) {
    // create only once to keep the js heap happy
    // this.instrument = new PolySynth(Synth, instrumentConfig).toDestination();
    this.instrument = poly(type);
  }
  return this.fmap((value: any) => {
    value = typeof value !== 'object' && !Array.isArray(value) ? { value } : value;
    const onTrigger = (time, event) => {
      this.instrument.set(instrumentConfig);
      this.instrument.triggerAttackRelease(value.value, event.duration, time);
    };
    return { ...value, instrumentConfig, onTrigger };
  });
};

Pattern.prototype.define('poly', (type, pat) => pat.poly(type), { composable: true, patternified: true });

/*

You are entering danger zone

*/

// everything below is nice in theory, but not healthy for the JS heap, as nodes get recreated on every call

const getTrigger = (getChain: any, value: any) => (time: number, event: any) => {
  const chain = getChain(); // make sure this returns a node that is connected toDestination // time
  if (!isNote(value)) {
    throw new Error('not a note: ' + value);
  }
  chain.triggerAttackRelease(value, event.duration, time);
  setTimeout(() => {
    // setTimeout is a little bit better compared to Transport.scheduleOnce
    chain.dispose(); // mark for garbage collection
  }, event.duration * 2000);
};

Pattern.prototype._synth = function (type: any = 'triangle') {
  return this.fmap((value: any) => {
    value = typeof value !== 'object' && !Array.isArray(value) ? { value } : value;
    const instrumentConfig: any = {
      oscillator: { type },
      envelope: { attack: 0.01, decay: 0.01, sustain: 0.6, release: 0.01 },
    };
    const getInstrument = () => {
      const instrument = new Synth();
      instrument.set(instrumentConfig);
      return instrument;
    };
    const onTrigger = getTrigger(() => getInstrument().toDestination(), value.value);
    return { ...value, getInstrument, instrumentConfig, onTrigger };
  });
};

Pattern.prototype.adsr = function (attack = 0.01, decay = 0.01, sustain = 0.6, release = 0.01) {
  return this.fmap((value: any) => {
    if (!value?.getInstrument) {
      throw new Error('cannot chain adsr: need instrument first (like synth)');
    }
    const instrumentConfig = { ...value.instrumentConfig, envelope: { attack, decay, sustain, release } };
    const getInstrument = () => {
      const instrument = value.getInstrument();
      instrument.set(instrumentConfig);
      return instrument;
    };
    const onTrigger = getTrigger(() => getInstrument().toDestination(), value.value);
    return { ...value, getInstrument, instrumentConfig, onTrigger };
  });
};

Pattern.prototype.chain = function (...effectGetters: any) {
  return this.fmap((value: any) => {
    if (!value?.getInstrument) {
      throw new Error('cannot chain: need instrument first (like synth)');
    }
    const chain = (value.chain || []).concat(effectGetters);
    const getChain = () => {
      const effects = chain.map((getEffect: any) => getEffect());
      return value.getInstrument().chain(...effects, Destination);
    };
    const onTrigger = getTrigger(getChain, value.value);
    return { ...value, getChain, onTrigger, chain };
  });
};

export const autofilter =
  (freq = 1) =>
  () =>
    new AutoFilter(freq).start();

export const filter =
  (freq = 1, q = 1, type: BiquadFilterType = 'lowpass') =>
  () =>
    new Filter(freq, type); // .Q.setValueAtTime(q, time);

export const gain =
  (gain: number = 0.9) =>
  () =>
    new Gain(gain);

Pattern.prototype._gain = function (g: number) {
  return this.chain(gain(g));
};
Pattern.prototype._filter = function (freq: number, q: number, type: BiquadFilterType = 'lowpass') {
  return this.chain(filter(freq, q, type));
};
Pattern.prototype.autofilter = function (g: number) {
  return this.chain(autofilter(g));
};

Pattern.prototype.define('synth', (type, pat) => pat.synth(type), { composable: true, patternified: true });
Pattern.prototype.define('gain', (gain, pat) => pat.synth(gain), { composable: true, patternified: true });
Pattern.prototype.define('filter', (cutoff, pat) => pat.filter(cutoff), { composable: true, patternified: true });
