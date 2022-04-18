import { Pattern, getFrequency } from '@strudel.cycles/core';
import { Tone } from '@strudel.cycles/tone';

// let audioContext;
export const getAudioContext = () => {
  return Tone.getContext().rawContext;
  /* if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext; */
};

const lookahead = 0.2;

const adsr = (attack, decay, sustain, release, velocity, begin, end) => {
  const gainNode = getAudioContext().createGain();
  gainNode.gain.setValueAtTime(0, begin);
  gainNode.gain.linearRampToValueAtTime(velocity, begin + attack); // attack
  gainNode.gain.linearRampToValueAtTime(sustain * velocity, begin + attack + decay); // sustain start
  gainNode.gain.setValueAtTime(sustain * velocity, end); // sustain end
  gainNode.gain.linearRampToValueAtTime(0, end + release); // release
  // for some reason, using exponential ramping creates little cracklings
  return gainNode;
};

Pattern.prototype.withAudioNode = function (createAudioNode) {
  return this._withEvent((event) => {
    return event.setContext({
      ...event.context,
      createAudioNode: (t, e) => createAudioNode(t, e, event.context.createAudioNode?.(t, event)),
    });
  });
};

Pattern.prototype._wave = function (type) {
  return this.withAudioNode((t, e) => {
    const osc = getAudioContext().createOscillator();
    osc.type = type;
    const f = getFrequency(e);
    osc.frequency.value = f; // expects frequency..
    const begin = t ?? (e.whole.begin.valueOf() + lookahead);
    const end = begin + e.duration;
    osc.start(begin);
    osc.stop(end); // release?
    return osc;
  });
};
Pattern.prototype.adsr = function (a = 0.01, d = 0.05, s = 1, r = 0.01) {
  return this.withAudioNode((t, e, node) => {
    const velocity = e.context?.velocity || 1;
    const envelope = adsr(a, d, s, r, velocity, e.whole.begin.valueOf() + lookahead, e.whole.end.valueOf() + lookahead);
    node?.connect(envelope);
    return envelope;
  });
};
Pattern.prototype.filter = function (type = 'lowshelf', frequency = 1000, gain = 25) {
  return this.withAudioNode((t, e, node) => {
    const filter = getAudioContext().createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.gain.value = gain;
    node?.connect(filter);
    return filter;
  });
};

Pattern.prototype.out = function () {
  const master = getAudioContext().createGain();
  master.gain.value = 0.1;
  master.connect(getAudioContext().destination);
  return this.withAudioNode((t, e, node) => {
    if (!node) {
      console.warn('out: no source! call .osc() first');
    }
    node?.connect(master);
  })._withEvent((event) => {
    const onTrigger = (time, e) => e.context?.createAudioNode?.(time, e);
    return event.setContext({ ...event.context, onTrigger });
  });
};

Pattern.prototype.define('wave', (type, pat) => pat.wave(type), { patternified: true });
