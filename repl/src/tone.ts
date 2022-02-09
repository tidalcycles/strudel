import { Pattern as _Pattern } from '../../strudel.mjs';
import { AutoFilter, Destination, Filter, Gain, isNote, Synth } from 'tone';

const Pattern = _Pattern as any;

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

Pattern.prototype.synth = function (type: any = 'triangle') {
  return this._patternify(Pattern.prototype._synth)(type);
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
Pattern.prototype.gain = function (g: number) {
  return this._patternify(Pattern.prototype._gain)(g);
};
Pattern.prototype._filter = function (freq: number, q: number, type: BiquadFilterType = 'lowpass') {
  return this.chain(filter(freq, q, type));
};
Pattern.prototype.filter = function (freq: number) {
  return this._patternify(Pattern.prototype._filter)(freq);
};

Pattern.prototype.autofilter = function (g: number) {
  return this.chain(autofilter(g));
};
