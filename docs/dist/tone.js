import {Pattern as _Pattern} from "../_snowpack/link/strudel.js";
import {
  AutoFilter,
  Destination,
  Filter,
  Gain,
  isNote,
  Synth,
  PolySynth,
  MembraneSynth,
  MetalSynth,
  MonoSynth,
  AMSynth,
  DuoSynth,
  FMSynth,
  NoiseSynth,
  PluckSynth,
  Sampler
} from "../_snowpack/pkg/tone.js";
const Pattern = _Pattern;
Pattern.prototype.tone = function(instrument) {
  return this.fmap((value) => {
    value = typeof value !== "object" && !Array.isArray(value) ? {value} : value;
    const onTrigger = (time, event) => {
      if (instrument.constructor.name === "PluckSynth") {
        instrument.triggerAttack(value.value, time);
      } else if (instrument.constructor.name === "NoiseSynth") {
        instrument.triggerAttackRelease(event.duration, time);
      } else {
        instrument.triggerAttackRelease(value.value, event.duration, time);
      }
    };
    return {...value, instrument, onTrigger};
  });
};
Pattern.prototype.define("tone", (type, pat) => pat.tone(type), {composable: true, patternified: false});
export const amsynth = (options) => new AMSynth(options);
export const duosynth = (options) => new DuoSynth(options);
export const fmsynth = (options) => new FMSynth(options);
export const membrane = (options) => new MembraneSynth(options);
export const metal = (options) => new MetalSynth(options);
export const monosynth = (options) => new MonoSynth(options);
export const noise = (options) => new NoiseSynth(options);
export const pluck = (options) => new PluckSynth(options);
export const polysynth = (options) => new PolySynth(options);
export const sampler = (options) => new Sampler(options);
export const synth = (options) => new Synth(options);
export const vol = (v) => new Gain(v);
export const lowpass = (v) => new Filter(v, "lowpass");
export const highpass = (v) => new Filter(v, "highpass");
export const adsr = (a, d = 0.1, s = 0.4, r = 0.01) => ({envelope: {attack: a, decay: d, sustain: s, release: r}});
export const osc = (type) => ({oscillator: {type}});
export const out = Destination;
const chainable = function(instr) {
  const _chain = instr.chain.bind(instr);
  let chained = [];
  instr.chain = (...args) => {
    chained = chained.concat(args);
    instr.disconnect();
    return _chain(...chained, Destination);
  };
  instr.filter = (freq = 1e3, type = "lowpass") => instr.chain(new Filter(freq, type));
  instr.gain = (gain2 = 0.9) => instr.chain(new Gain(gain2));
  return instr;
};
export const poly = (type) => {
  const s = new PolySynth(Synth, {oscillator: {type}}).toDestination();
  return chainable(s);
};
Pattern.prototype._poly = function(type = "triangle") {
  const instrumentConfig = {
    oscillator: {type},
    envelope: {attack: 0.01, decay: 0.01, sustain: 0.6, release: 0.01}
  };
  if (!this.instrument) {
    this.instrument = poly(type);
  }
  return this.fmap((value) => {
    value = typeof value !== "object" && !Array.isArray(value) ? {value} : value;
    const onTrigger = (time, event) => {
      this.instrument.set(instrumentConfig);
      this.instrument.triggerAttackRelease(value.value, event.duration, time);
    };
    return {...value, instrumentConfig, onTrigger};
  });
};
Pattern.prototype.define("poly", (type, pat) => pat.poly(type), {composable: true, patternified: true});
const getTrigger = (getChain, value) => (time, event) => {
  const chain = getChain();
  if (!isNote(value)) {
    throw new Error("not a note: " + value);
  }
  chain.triggerAttackRelease(value, event.duration, time);
  setTimeout(() => {
    chain.dispose();
  }, event.duration * 2e3);
};
Pattern.prototype._synth = function(type = "triangle") {
  return this.fmap((value) => {
    value = typeof value !== "object" && !Array.isArray(value) ? {value} : value;
    const instrumentConfig = {
      oscillator: {type},
      envelope: {attack: 0.01, decay: 0.01, sustain: 0.6, release: 0.01}
    };
    const getInstrument = () => {
      const instrument = new Synth();
      instrument.set(instrumentConfig);
      return instrument;
    };
    const onTrigger = getTrigger(() => getInstrument().toDestination(), value.value);
    return {...value, getInstrument, instrumentConfig, onTrigger};
  });
};
Pattern.prototype.adsr = function(attack = 0.01, decay = 0.01, sustain = 0.6, release = 0.01) {
  return this.fmap((value) => {
    if (!value?.getInstrument) {
      throw new Error("cannot chain adsr: need instrument first (like synth)");
    }
    const instrumentConfig = {...value.instrumentConfig, envelope: {attack, decay, sustain, release}};
    const getInstrument = () => {
      const instrument = value.getInstrument();
      instrument.set(instrumentConfig);
      return instrument;
    };
    const onTrigger = getTrigger(() => getInstrument().toDestination(), value.value);
    return {...value, getInstrument, instrumentConfig, onTrigger};
  });
};
Pattern.prototype.chain = function(...effectGetters) {
  return this.fmap((value) => {
    if (!value?.getInstrument) {
      throw new Error("cannot chain: need instrument first (like synth)");
    }
    const chain = (value.chain || []).concat(effectGetters);
    const getChain = () => {
      const effects = chain.map((getEffect) => getEffect());
      return value.getInstrument().chain(...effects, Destination);
    };
    const onTrigger = getTrigger(getChain, value.value);
    return {...value, getChain, onTrigger, chain};
  });
};
export const autofilter = (freq = 1) => () => new AutoFilter(freq).start();
export const filter = (freq = 1, q = 1, type = "lowpass") => () => new Filter(freq, type);
export const gain = (gain2 = 0.9) => () => new Gain(gain2);
Pattern.prototype._gain = function(g) {
  return this.chain(gain(g));
};
Pattern.prototype._filter = function(freq, q, type = "lowpass") {
  return this.chain(filter(freq, q, type));
};
Pattern.prototype._autofilter = function(g) {
  return this.chain(autofilter(g));
};
Pattern.prototype.define("synth", (type, pat) => pat.synth(type), {composable: true, patternified: true});
Pattern.prototype.define("gain", (gain2, pat) => pat.synth(gain2), {composable: true, patternified: true});
Pattern.prototype.define("filter", (cutoff, pat) => pat.filter(cutoff), {composable: true, patternified: true});
Pattern.prototype.define("autofilter", (cutoff, pat) => pat.filter(cutoff), {composable: true, patternified: true});
