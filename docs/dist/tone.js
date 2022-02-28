import {Pattern as _Pattern} from "../_snowpack/link/strudel.js";
import {
  AutoFilter,
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
  Sampler,
  getDestination
} from "../_snowpack/pkg/tone.js";
import {Piano} from "../_snowpack/pkg/@tonejs/piano.js";
const Pattern = _Pattern;
Pattern.prototype.tone = function(instrument) {
  return this._withEvent((event) => {
    const onTrigger = (time, event2) => {
      if (instrument.constructor.name === "PluckSynth") {
        instrument.triggerAttack(event2.value, time);
      } else if (instrument.constructor.name === "NoiseSynth") {
        instrument.triggerAttackRelease(event2.duration, time);
      } else if (instrument.constructor.name === "Piano") {
        instrument.keyDown({note: event2.value, time, velocity: 0.5});
        instrument.keyUp({note: event2.value, time: time + event2.duration});
      } else {
        instrument.triggerAttackRelease(event2.value, event2.duration, time);
      }
    };
    return event.setContext({...event.context, instrument, onTrigger});
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
export const piano = async (options = {velocities: 1}) => {
  const p = new Piano(options);
  await p.load();
  return p;
};
export const vol = (v) => new Gain(v);
export const lowpass = (v) => new Filter(v, "lowpass");
export const highpass = (v) => new Filter(v, "highpass");
export const adsr = (a, d = 0.1, s = 0.4, r = 0.01) => ({envelope: {attack: a, decay: d, sustain: s, release: r}});
export const osc = (type) => ({oscillator: {type}});
export const out = () => getDestination();
const chainable = function(instr) {
  const _chain = instr.chain.bind(instr);
  let chained = [];
  instr.chain = (...args) => {
    chained = chained.concat(args);
    instr.disconnect();
    return _chain(...chained, getDestination());
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
  return this._withEvent((event) => {
    const onTrigger = (time, event2) => {
      this.instrument.set(instrumentConfig);
      this.instrument.triggerAttackRelease(event2.value, event2.duration, time);
    };
    return event.setContext({...event.context, instrumentConfig, onTrigger});
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
  return this._withEvent((event) => {
    const instrumentConfig = {
      oscillator: {type},
      envelope: {attack: 0.01, decay: 0.01, sustain: 0.6, release: 0.01}
    };
    const getInstrument = () => {
      const instrument = new Synth();
      instrument.set(instrumentConfig);
      return instrument;
    };
    const onTrigger = getTrigger(() => getInstrument().toDestination(), event.value);
    return event.setContext({...event.context, getInstrument, instrumentConfig, onTrigger});
  });
};
Pattern.prototype.adsr = function(attack = 0.01, decay = 0.01, sustain = 0.6, release = 0.01) {
  return this._withEvent((event) => {
    if (!event.context.getInstrument) {
      throw new Error("cannot chain adsr: need instrument first (like synth)");
    }
    const instrumentConfig = {...event.context.instrumentConfig, envelope: {attack, decay, sustain, release}};
    const getInstrument = () => {
      const instrument = event.context.getInstrument();
      instrument.set(instrumentConfig);
      return instrument;
    };
    const onTrigger = getTrigger(() => getInstrument().toDestination(), event.value);
    return event.setContext({...event.context, getInstrument, instrumentConfig, onTrigger});
  });
};
Pattern.prototype.chain = function(...effectGetters) {
  return this._withEvent((event) => {
    if (!event.context?.getInstrument) {
      throw new Error("cannot chain: need instrument first (like synth)");
    }
    const chain = (event.context.chain || []).concat(effectGetters);
    const getChain = () => {
      const effects = chain.map((getEffect) => getEffect());
      return event.context.getInstrument().chain(...effects, getDestination());
    };
    const onTrigger = getTrigger(getChain, event.value);
    return event.setContext({...event.context, getChain, onTrigger, chain});
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
