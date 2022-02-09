import {Pattern as _Pattern} from "../_snowpack/link/strudel.js";
import {AutoFilter, Destination, Filter, Gain, isNote, Synth} from "../_snowpack/pkg/tone.js";
const Pattern = _Pattern;
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
Pattern.prototype.synth = function(type = "triangle") {
  return this._patternify(Pattern.prototype._synth)(type);
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
Pattern.prototype.gain = function(g) {
  return this._patternify(Pattern.prototype._gain)(g);
};
Pattern.prototype._filter = function(freq, q, type = "lowpass") {
  return this.chain(filter(freq, q, type));
};
Pattern.prototype.filter = function(freq) {
  return this._patternify(Pattern.prototype._filter)(freq);
};
Pattern.prototype.autofilter = function(g) {
  return this.chain(autofilter(g));
};
