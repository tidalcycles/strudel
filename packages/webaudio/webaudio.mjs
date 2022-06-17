/*
webaudio.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/webaudio/webaudio.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// import { Pattern, getFrequency, patternify2 } from '@strudel.cycles/core';
import * as strudel from '@strudel.cycles/core';
import { fromMidi } from '@strudel.cycles/core';
const { Pattern } = strudel;

// export const getAudioContext = () => Tone.getContext().rawContext;

let audioContext;
export const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

const getFilter = (type, frequency, Q) => {
  const filter = getAudioContext().createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = Q;
  return filter;
};

const getADSR = (attack, decay, sustain, release, velocity, begin, end) => {
  const gainNode = getAudioContext().createGain();
  gainNode.gain.setValueAtTime(0, begin);
  gainNode.gain.linearRampToValueAtTime(velocity, begin + attack); // attack
  gainNode.gain.linearRampToValueAtTime(sustain * velocity, begin + attack + decay); // sustain start
  gainNode.gain.setValueAtTime(sustain * velocity, end); // sustain end
  gainNode.gain.linearRampToValueAtTime(0, end + release); // release
  // for some reason, using exponential ramping creates little cracklings
  return gainNode;
};

Pattern.prototype.out = function () {
  return this.onTrigger((t, hap, ct) => {
    const ac = getAudioContext();
    // calculate correct time (tone.js workaround)
    t = ac.currentTime + t - ct;
    // destructure value
    let {
      freq,
      s,
      n,
      gain = 1,
      cutoff,
      resonance = 1,
      hcutoff,
      hresonance = 1,
      bandf,
      bandq = 1,
      pan,
      attack = 0.001,
      decay = 0,
      sustain = 1,
      release = 0.001,
    } = hap.value;
    if (!n && !freq) {
      console.warn('unplayable value:', hap.value);
      return;
    }
    // get frequency
    if (!freq && typeof n === 'number') {
      freq = fromMidi(n); // + 48);
    }
    if (!freq && typeof n === 'string') {
      freq = fromMidi(toMidi(n));
    }
    // the chain will hold all audio nodes that connect to each other
    const chain = [];
    // make oscillator
    const o = ac.createOscillator();
    o.type = s || 'triangle';
    o.frequency.value = Number(freq);
    o.start(t);
    o.stop(t + hap.duration + release);
    chain.push(o);
    // envelope
    const adsr = getADSR(attack, decay, sustain, release, 1, t, t + hap.duration);
    chain.push(adsr);
    // filters
    cutoff !== undefined && chain.push(getFilter('lowpass', cutoff, resonance));
    hcutoff !== undefined && chain.push(getFilter('highpass', hcutoff, hresonance));
    bandf !== undefined && chain.push(getFilter('bandpass', bandf, bandq));
    // TODO vowel
    // TODO delay / delaytime / delayfeedback
    // panning
    if (pan !== undefined) {
      const panner = ac.createStereoPanner();
      panner.pan.value = 2 * pan - 1;
      chain.push(panner);
    }
    // master out
    const master = ac.createGain();
    master.gain.value = 0.1 * gain;
    chain.push(master);
    chain.push(ac.destination);
    // connect chain elements together
    chain.slice(1).reduce((last, current) => last.connect(current), chain[0]);
  });
};
