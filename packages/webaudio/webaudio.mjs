/*
webaudio.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/webaudio/webaudio.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// import { Pattern, getFrequency, patternify2 } from '@strudel.cycles/core';
import * as strudel from '@strudel.cycles/core';
import { Tone } from '@strudel.cycles/tone';
const { Pattern, getFrequency, patternify2 } = strudel;

let audioContext;
export const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
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
  return this._withHap((hap) => {
    return hap.setContext({
      ...hap.context,
      createAudioNode: (t, e) => createAudioNode(t, e, hap.context.createAudioNode?.(t, hap)),
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
    const end = begin + e.duration.valueOf();
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
  })._withHap((hap) => {
    const onTrigger = (time, e) => e.context?.createAudioNode?.(time, e);
    return hap.setContext({ ...hap.context, onTrigger });
  });
};

Pattern.prototype.define('wave', (type, pat) => pat.wave(type), { patternified: true });

/*

// TODO: throw all this away and use that:

stack(
  freq("55 [110,165] 110 [220,275]".mul("<1 <3/4 2/3>>").struct("x(3,8)")
       .layer(x=>x.mul("1.006,.995"))), // detune
  freq("440(5,8)".legato(.18).mul("<1 3/4 2 2/3>")).gain(perlin.range(.2,.8))
).s("<sawtooth square>/2")
  .cutoff(perlin.range(100,4000).slow(4))//.resonance(saw.range(0,15).slow(7))
  .jux(rev)
  .onTrigger((t,hap,ct) => {
  const ac = Tone.getContext().rawContext;
  // calculate correct time (tone.js workaround)
  t = ac.currentTime + t - ct;
  // destructure value
  const { freq, s, gain = 1, 
         cutoff, resonance = 1, 
         hcutoff, hresonance = 1,
         bandf, bandq = 1,
         pan
        } = hap.value;
  // TODO get frequency from n or note
  // oscillator
  const o = ac.createOscillator();
  o.type = s || 'triangle';
  o.frequency.value = Number(freq);
  o.start(t);
  o.stop(t + hap.duration);
  // chaining logic
  let last = o;
  const addToChain = (node) => {
    last.connect(node);
    last = node;
  }
  // filters
  const getFilter = (type, frequency, Q) => {
    const filter = ac.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = Q;
    return filter;
  }
  cutoff !== undefined && addToChain(getFilter('lowpass', cutoff, resonance));
  hcutoff !== undefined && addToChain(getFilter('highpass', hcutoff, hresonance));
  bandf !== undefined && addToChain(getFilter('bandpass', bandf, bandq));
  // TODO: vowel
  // TODO: delay / delaytime / delayfeedback
  // panning
  if(pan !== undefined) {
    const panner = ac.createStereoPanner();
    panner.pan.value = 2*pan-1;
    addToChain(panner);
  }
  // gain out
  const master = ac.createGain();
  master.gain.value = 0.1 * gain;
  master.connect(ac.destination);
  last.connect(master);
})
.stack(s("bd(3,8),hh*4,~ sd").webdirt())

*/
