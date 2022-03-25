import { Pattern as _Pattern } from '@strudel/core';
import * as _Tone from 'tone';

// import Tone from here, to make sure to get the same AudioContext
export const Tone = _Tone;

const {
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
  Sampler,
  getDestination,
  Players,
} = Tone;
import * as tonePiano from '@tonejs/piano';
const { Piano } = tonePiano;
import { getPlayableNoteValue } from '@strudel/core/util.mjs';

// "balanced" | "interactive" | "playback";
// Tone.setContext(new Tone.Context({ latencyHint: 'playback', lookAhead: 1 }));
export const defaultSynth = new PolySynth().chain(new Gain(0.5), getDestination());
defaultSynth.set({
  oscillator: { type: 'triangle' },
  envelope: {
    release: 0.01,
  },
});

// what about
// https://www.charlie-roberts.com/gibberish/playground/

const Pattern = _Pattern;

// with this function, you can play the pattern with any tone synth
Pattern.prototype.tone = function (instrument) {
  // instrument.toDestination();
  return this._withEvent((event) => {
    const onTrigger = (time, event) => {
      let note;
      let velocity = event.context?.velocity ?? 0.75;
      if (instrument instanceof PluckSynth) {
        note = getPlayableNoteValue(event);
        instrument.triggerAttack(note, time);
      } else if (instrument instanceof NoiseSynth) {
        instrument.triggerAttackRelease(event.duration, time); // noise has no value
      } else if (instrument instanceof Piano) {
        note = getPlayableNoteValue(event);
        instrument.keyDown({ note, time, velocity });
        instrument.keyUp({ note, time: time + event.duration, velocity });
      } else if (instrument instanceof Sampler) {
        note = getPlayableNoteValue(event);
        instrument.triggerAttackRelease(note, event.duration, time, velocity);
      } else if (instrument instanceof Players) {
        if (!instrument.has(event.value)) {
          throw new Error(`name "${event.value}" not defined for players`);
        }
        const player = instrument.player(event.value);
        // velocity ?
        player.start(time);
        player.stop(time + event.duration);
      } else {
        note = getPlayableNoteValue(event);
        instrument.triggerAttackRelease(note, event.duration, time, velocity);
      }
      /* switch (instrument.constructor.name) {
        case 'PluckSynth':
          note = getPlayableNoteValue(event);
          instrument.triggerAttack(note, time);
          break;
        case 'NoiseSynth':
          instrument.triggerAttackRelease(event.duration, time); // noise has no value
          break;
        case 'Piano':
          note = getPlayableNoteValue(event);
          instrument.keyDown({ note, time, velocity });
          instrument.keyUp({ note, time: time + event.duration, velocity });
          break;
        case 'Sampler':
          note = getPlayableNoteValue(event);
          instrument.triggerAttackRelease(note, event.duration, time, velocity);
          break;
        case 'Players':
          if (!instrument.has(event.value)) {
            throw new Error(`name "${event.value}" not defined for players`);
          }
          const player = instrument.player(event.value);
          // velocity ?
          player.start(time);
          player.stop(time + event.duration);
          break;
        default:
          note = getPlayableNoteValue(event);
          instrument.triggerAttackRelease(note, event.duration, time, velocity);
      } */
    };
    return event.setContext({ ...event.context, instrument, onTrigger });
  });
};

Pattern.prototype.define('tone', (type, pat) => pat.tone(type), { composable: true, patternified: false });

// synth helpers
export const amsynth = (options) => new AMSynth(options);
export const duosynth = (options) => new DuoSynth(options);
export const fmsynth = (options) => new FMSynth(options);
export const membrane = (options) => new MembraneSynth(options);
export const metal = (options) => new MetalSynth(options);
export const monosynth = (options) => new MonoSynth(options);
export const noise = (options) => new NoiseSynth(options);
export const pluck = (options) => new PluckSynth(options);
export const polysynth = (options) => new PolySynth(options);
export const sampler = (options, baseUrl) =>
  new Promise((resolve) => {
    const s = new Sampler(options, () => resolve(s), baseUrl);
  });
export const players = (options, baseUrl = '') => {
  options = !baseUrl
    ? options
    : Object.fromEntries(Object.entries(options).map(([key, value]) => [key, baseUrl + value]));
  return new Promise((resolve) => {
    const s = new Players(options, () => resolve(s));
  });
};
export const synth = (options) => new Synth(options);
export const piano = async (options = { velocities: 1 }) => {
  const p = new Piano(options);
  await p.load();
  return p;
};

// effect helpers
export const vol = (v) => new Gain(v);
export const lowpass = (v) => new Filter(v, 'lowpass');
export const highpass = (v) => new Filter(v, 'highpass');
export const adsr = (a, d = 0.1, s = 0.4, r = 0.01) => ({ envelope: { attack: a, decay: d, sustain: s, release: r } });
export const osc = (type) => ({ oscillator: { type } });
export const out = () => getDestination();

/*

You are entering experimental zone

*/

// the following code is an attempt to minimize tonejs code.. it is still an experiment

const chainable = function (instr) {
  const _chain = instr.chain.bind(instr);
  let chained = [];
  instr.chain = (...args) => {
    chained = chained.concat(args);
    instr.disconnect(); // disconnect from destination / previous chain
    return _chain(...chained, getDestination());
  };
  // shortcuts: chaining multiple won't work forn now.. like filter(1000).gain(0.5). use chain + native Tone calls instead
  // instr.filter = (freq = 1000, type: BiquadFilterType = 'lowpass') =>
  instr.filter = (freq = 1000, type = 'lowpass') =>
    instr.chain(
      new Filter(freq, type), // .Q.setValueAtTime(q, time);
    );
  instr.gain = (gain = 0.9) => instr.chain(new Gain(gain));
  return instr;
};

// helpers
export const poly = (type) => {
  const s = new PolySynth(Synth, { oscillator: { type } }).toDestination();
  return chainable(s);
};

Pattern.prototype._poly = function (type = 'triangle') {
  const instrumentConfig = {
    oscillator: { type },
    envelope: { attack: 0.01, decay: 0.01, sustain: 0.6, release: 0.01 },
  };
  if (!this.instrument) {
    // create only once to keep the js heap happy
    // this.instrument = new PolySynth(Synth, instrumentConfig).toDestination();
    this.instrument = poly(type);
  }
  return this._withEvent((event) => {
    const onTrigger = (time, event) => {
      this.instrument.set(instrumentConfig);
      this.instrument.triggerAttackRelease(event.value, event.duration, time);
    };
    return event.setContext({ ...event.context, instrumentConfig, onTrigger });
  });
};

Pattern.prototype.define('poly', (type, pat) => pat.poly(type), { composable: true, patternified: true });

/*

You are entering danger zone

*/

// everything below is nice in theory, but not healthy for the JS heap, as nodes get recreated on every call

const getTrigger = (getChain, value) => (time, event) => {
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

Pattern.prototype._synth = function (type = 'triangle') {
  return this._withEvent((event) => {
    const instrumentConfig = {
      oscillator: { type },
      envelope: { attack: 0.01, decay: 0.01, sustain: 0.6, release: 0.01 },
    };
    const getInstrument = () => {
      const instrument = new Synth();
      instrument.set(instrumentConfig);
      return instrument;
    };
    const onTrigger = getTrigger(() => getInstrument().toDestination(), event.value);
    return event.setContext({ ...event.context, getInstrument, instrumentConfig, onTrigger });
  });
};

Pattern.prototype.adsr = function (attack = 0.01, decay = 0.01, sustain = 0.6, release = 0.01) {
  return this._withEvent((event) => {
    if (!event.context.getInstrument) {
      throw new Error('cannot chain adsr: need instrument first (like synth)');
    }
    const instrumentConfig = { ...event.context.instrumentConfig, envelope: { attack, decay, sustain, release } };
    const getInstrument = () => {
      const instrument = event.context.getInstrument();
      instrument.set(instrumentConfig);
      return instrument;
    };
    const onTrigger = getTrigger(() => getInstrument().toDestination(), event.value);
    return event.setContext({ ...event.context, getInstrument, instrumentConfig, onTrigger });
  });
};

Pattern.prototype.chain = function (...effectGetters) {
  return this._withEvent((event) => {
    if (!event.context?.getInstrument) {
      throw new Error('cannot chain: need instrument first (like synth)');
    }
    const chain = (event.context.chain || []).concat(effectGetters);
    const getChain = () => {
      const effects = chain.map((getEffect) => getEffect());
      return event.context.getInstrument().chain(...effects, getDestination());
    };
    const onTrigger = getTrigger(getChain, event.value);
    return event.setContext({ ...event.context, getChain, onTrigger, chain });
  });
};

export const autofilter =
  (freq = 1) =>
  () =>
    new AutoFilter(freq).start();

export const filter =
  // (freq = 1, q = 1, type: BiquadFilterType = 'lowpass') =>


    (freq = 1, q = 1, type = 'lowpass') =>
    () =>
      new Filter(freq, type); // .Q.setValueAtTime(q, time);

export const gain =
  (gain = 0.9) =>
  () =>
    new Gain(gain);

Pattern.prototype._gain = function (g) {
  return this.chain(gain(g));
};
// Pattern.prototype._filter = function (freq: number, q: number, type: BiquadFilterType = 'lowpass') {
Pattern.prototype._filter = function (freq, q, type = 'lowpass') {
  return this.chain(filter(freq, q, type));
};
Pattern.prototype._autofilter = function (g) {
  return this.chain(autofilter(g));
};

Pattern.prototype.define('synth', (type, pat) => pat.synth(type), { composable: true, patternified: true });
Pattern.prototype.define('gain', (gain, pat) => pat.synth(gain), { composable: true, patternified: true });
Pattern.prototype.define('filter', (cutoff, pat) => pat.filter(cutoff), { composable: true, patternified: true });
Pattern.prototype.define('autofilter', (cutoff, pat) => pat.filter(cutoff), { composable: true, patternified: true });
