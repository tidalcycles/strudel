/*
webaudio.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/webaudio/webaudio.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

// import { Pattern, getFrequency, patternify2 } from '@strudel.cycles/core';
import * as strudel from '@strudel.cycles/core';
import { fromMidi } from '@strudel.cycles/core';
import { loadBuffer } from './sampler.mjs';
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
  return this.onTrigger(async (t, hap, ct) => {
    const ac = getAudioContext();
    // calculate correct time (tone.js workaround)
    t = ac.currentTime + t - ct;
    // destructure value
    let {
      freq,
      s,
      n = 0,
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
      speed = 1, // sample playback speed
      begin = 0,
      end = 1,
    } = hap.value;
    // the chain will hold all audio nodes that connect to each other
    const chain = [];
    if (!s || ['sine', 'square', 'triangle', 'sawtooth'].includes(s)) {
      // get frequency
      if (!freq && typeof n === 'number') {
        freq = fromMidi(n); // + 48);
      }
      if (!freq && typeof n === 'string') {
        freq = fromMidi(toMidi(n));
      }
      // make oscillator
      const o = ac.createOscillator();
      o.type = s || 'triangle';
      o.frequency.value = Number(freq);
      o.start(t);
      o.stop(t + hap.duration + release);
      chain.push(o);
    } else {
      // load sample
      const samples = getLoadedSamples();
      if (!samples) {
        console.warn('no samples loaded');
        return;
      }
      const bank = samples?.[s];
      if (!bank) {
        console.warn('sample not found:', s, 'try one of ' + Object.keys(samples));
        return;
      } else {
        if (speed === 0) {
          // no playback
          return;
        }
        if (!s) {
          console.warn('no sample specified');
          return;
        }
        const bank = samples[s];
        const sampleUrl = bank[n % bank.length];
        let buffer = await loadBuffer(sampleUrl, ac);
        if (ac.currentTime > t) {
          console.warn('sample still loading:', s, n);
          return;
        }
        const src = ac.createBufferSource();
        src.buffer = buffer;
        let duration = src.buffer.duration;
        const offset = begin * duration;
        const sus = ((end - begin) * duration) / Math.abs(speed);
        src.playbackRate.value = Math.abs(speed);
        // TODO: nudge, unit, cut, loop
        src.start(t, offset, sus);
        src.stop(t + duration);
        chain.push(src);
      }
    }
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
    master.gain.value = 0.8 * gain;
    chain.push(master);
    chain.push(ac.destination);
    // connect chain elements together
    chain.slice(1).reduce((last, current) => last.connect(current), chain[0]);
  });
};
