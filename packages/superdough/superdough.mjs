/*
superdough.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/superdough/superdough.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import './feedbackdelay.mjs';
import './reverb.mjs';
import './vowel.mjs';
import { clamp, nanFallback } from './util.mjs';
import workletsUrl from './worklets.mjs?url';
import { getFilter, gainNode } from './helpers.mjs';
import { map } from 'nanostores';
import { logger } from './logger.mjs';

export const soundMap = map();
export function registerSound(key, onTrigger, data = {}) {
  soundMap.setKey(key, { onTrigger, data });
}
export function getSound(s) {
  return soundMap.get()[s];
}
export const resetLoadedSounds = () => soundMap.set({});

let audioContext;
export const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
};

let destination;
const getDestination = () => {
  const ctx = getAudioContext();
  if (!destination) {
    destination = ctx.createGain();
    destination.connect(ctx.destination);
  }
  return destination;
};

export const panic = () => {
  getDestination().gain.linearRampToValueAtTime(0, getAudioContext().currentTime + 0.01);
  destination = null;
};

let workletsLoading;
function loadWorklets() {
  if (workletsLoading) {
    return workletsLoading;
  }
  workletsLoading = getAudioContext().audioWorklet.addModule(workletsUrl);
  return workletsLoading;
}

function getWorklet(ac, processor, params) {
  const node = new AudioWorkletNode(ac, processor);
  Object.entries(params).forEach(([key, value]) => {
    node.parameters.get(key).value = value;
  });
  return node;
}

// this function should be called on first user interaction (to avoid console warning)
export async function initAudio(options = {}) {
  const { disableWorklets = false } = options;
  if (typeof window !== 'undefined') {
    await getAudioContext().resume();
    if (!disableWorklets) {
      await loadWorklets().catch((err) => {
        console.warn('could not load AudioWorklet effects coarse, crush and shape', err);
      });
    } else {
      console.log('disableWorklets: AudioWorklet effects coarse, crush and shape are skipped!');
    }
  }
}

export async function initAudioOnFirstClick(options) {
  return new Promise((resolve) => {
    document.addEventListener('click', async function listener() {
      await initAudio(options);
      resolve();
      document.removeEventListener('click', listener);
    });
  });
}

let delays = {};
const maxfeedback = 0.98;
function getDelay(orbit, delaytime, delayfeedback, t) {
  if (delayfeedback > maxfeedback) {
    //logger(`delayfeedback was clamped to ${maxfeedback} to save your ears`);
  }
  delayfeedback = clamp(delayfeedback, 0, 0.98);
  if (!delays[orbit]) {
    const ac = getAudioContext();
    const dly = ac.createFeedbackDelay(1, delaytime, delayfeedback);
    dly.start?.(t); // for some reason, this throws when audion extension is installed..
    dly.connect(getDestination());
    delays[orbit] = dly;
  }
  delays[orbit].delayTime.value !== delaytime && delays[orbit].delayTime.setValueAtTime(delaytime, t);
  delays[orbit].feedback.value !== delayfeedback && delays[orbit].feedback.setValueAtTime(delayfeedback, t);
  return delays[orbit];
}

let reverbs = {};
function getReverb(orbit, duration = 2) {
  if (!reverbs[orbit]) {
    const ac = getAudioContext();
    const reverb = ac.createReverb(duration);
    reverb.connect(getDestination());
    reverbs[orbit] = reverb;
  }
  if (reverbs[orbit].duration !== duration) {
    reverbs[orbit] = reverbs[orbit].setDuration(duration);
    reverbs[orbit].duration = duration;
  }
  return reverbs[orbit];
}

function effectSend(input, effect, wet) {
  const send = gainNode(wet);
  input.connect(send);
  send.connect(effect);
  return send;
}

export const superdough = async (value, deadline, hapDuration) => {
  const ac = getAudioContext();
  if (typeof value !== 'object') {
    throw new Error(
      `expected hap.value to be an object, but got "${value}". Hint: append .note() or .s() to the end`,
      'error',
    );
  }

  // calculate absolute time
  let t = ac.currentTime + deadline;
  // destructure
  let {
    s = 'triangle',
    bank,
    source,
    gain = 0.8,
    // low pass
    cutoff,
    resonance = 1,
    // high pass
    hcutoff,
    hresonance = 1,
    // band pass
    bandf,
    bandq = 1,
    //
    coarse,
    crush,
    shape,
    pan,
    vowel,
    delay = 0,
    delayfeedback = 0.5,
    delaytime = 0.25,
    orbit = 1,
    room,
    size = 2,
    velocity = 1,
  } = value;
  gain = nanFallback(gain, 1);
  gain *= velocity; // legacy fix for velocity
  let toDisconnect = []; // audio nodes that will be disconnected when the source has ended
  const onended = () => {
    toDisconnect.forEach((n) => n?.disconnect());
  };
  if (bank && s) {
    s = `${bank}_${s}`;
  }
  // get source AudioNode
  let sourceNode;
  if (source) {
    sourceNode = source(t, value, hapDuration);
  } else if (getSound(s)) {
    const { onTrigger } = getSound(s);
    const soundHandle = await onTrigger(t, value, onended);
    if (soundHandle) {
      sourceNode = soundHandle.node;
      soundHandle.stop(t + hapDuration);
    }
  } else {
    throw new Error(`sound ${s} not found! Is it loaded?`);
  }
  if (!sourceNode) {
    // if onTrigger does not return anything, we will just silently skip
    // this can be used for things like speed(0) in the sampler
    return;
  }
  if (ac.currentTime > t) {
    logger('[webaudio] skip hap: still loading', ac.currentTime - t);
    return;
  }
  const chain = []; // audio nodes that will be connected to each other sequentially
  chain.push(sourceNode);

  // gain stage
  chain.push(gainNode(gain));

  // filters
  cutoff !== undefined && chain.push(getFilter('lowpass', cutoff, resonance));
  hcutoff !== undefined && chain.push(getFilter('highpass', hcutoff, hresonance));
  bandf !== undefined && chain.push(getFilter('bandpass', bandf, bandq));
  vowel !== undefined && chain.push(ac.createVowelFilter(vowel));

  // effects
  coarse !== undefined && chain.push(getWorklet(ac, 'coarse-processor', { coarse }));
  crush !== undefined && chain.push(getWorklet(ac, 'crush-processor', { crush }));
  shape !== undefined && chain.push(getWorklet(ac, 'shape-processor', { shape }));

  // panning
  if (pan !== undefined) {
    const panner = ac.createStereoPanner();
    panner.pan.value = 2 * pan - 1;
    chain.push(panner);
  }

  // last gain
  const post = gainNode(1);
  chain.push(post);
  post.connect(getDestination());

  // delay
  let delaySend;
  if (delay > 0 && delaytime > 0 && delayfeedback > 0) {
    const delyNode = getDelay(orbit, delaytime, delayfeedback, t);
    delaySend = effectSend(post, delyNode, delay);
  }
  // reverb
  let reverbSend;
  if (room > 0 && size > 0) {
    const reverbNode = getReverb(orbit, size);
    reverbSend = effectSend(post, reverbNode, room);
  }

  // connect chain elements together
  chain.slice(1).reduce((last, current) => last.connect(current), chain[0]);

  // toDisconnect = all the node that should be disconnected in onended callback
  // this is crucial for performance
  toDisconnect = chain.concat([delaySend, reverbSend]);
};

export const superdoughTrigger = (t, hap, ct, cps) => superdough(hap, t - ct, hap.duration / cps, cps);
