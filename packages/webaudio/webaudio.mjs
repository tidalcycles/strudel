/*
webaudio.mjs - <short description TODO>
Copyright (C) 2022 <author(s) TODO> and contributors
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Pattern, getFrequency, patternify2 } from '@strudel.cycles/core';
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
    const begin = t ?? e.whole.begin.valueOf() + lookahead;
    const end = begin + e.valueOf();
    osc.start(begin);
    osc.stop(end); // release?
    return osc;
  });
};
Pattern.prototype.adsr = function (a = 0.01, d = 0.05, s = 1, r = 0.01) {
  return this.withAudioNode((t, e, node) => {
    const velocity = e.context?.velocity || 1;
    const begin = t ?? e.whole.begin.valueOf() + lookahead;
    const end = begin + e.duration.valueOf() + lookahead;
    const envelope = adsr(a, d, s, r, velocity, begin, end);
    node?.connect(envelope);
    return envelope;
  });
};
Pattern.prototype._filter = function (type = 'lowpass', frequency = 1000) {
  return this.withAudioNode((t, e, node) => {
    const filter = getAudioContext().createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    node?.connect(filter);
    return filter;
  });
};

Pattern.prototype.filter = function (type, frequency) {
  return patternify2(Pattern.prototype._filter)(reify(type), reify(frequency), this);
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
