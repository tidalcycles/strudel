/*
superdough.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/superdough/superdough.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import './feedbackdelay.mjs';
import './reverb.mjs';
import './vowel.mjs';
import { clamp } from './util.mjs';
import workletsUrl from './worklets.mjs?url';
import { createFilter, gainNode, getCompressor } from './helpers.mjs';
import { map } from 'nanostores';
import { logger } from './logger.mjs';
import { loadBuffer } from './sampler.mjs';

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

function getPhaser(speed = 1, depth = 0.5) {
  //gain
  const ac = getAudioContext();
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 2000;

  //lfo TODO: set the lfo phase relative to current cycle to create "free running" effect
  const lfo = ac.createOscillator();
  lfo.frequency.value = speed;
  lfo.type = 'sine';
  lfo.start();
  lfo.connect(lfoGain);

  //filters
  const numStages = 2; //num of filters in series
  let fOffset = 0;
  const filterChain = [];
  for (let i = 0; i < numStages; i++) {
    const filter = ac.createBiquadFilter();
    filter.type = 'notch';
    filter.gain.value = 1;
    filter.frequency.value = 1000 + fOffset;
    filter.Q.value = 2 - Math.min(Math.max(depth * 2, 0), 1.9);

    lfoGain.connect(filter.detune);
    fOffset += 282;
    if (i > 0) {
      filterChain[i - 1].connect(filter);
    }
    filterChain.push(filter);
  }
  return filterChain[filterChain.length - 1];
}

let reverbs = {};

let hasChanged = (now, before) => now !== undefined && now !== before;

function getReverb(orbit, duration, fade, lp, dim, ir) {
  // If no reverb has been created for a given orbit, create one
  if (!reverbs[orbit]) {
    const ac = getAudioContext();
    const reverb = ac.createReverb(duration, fade, lp, dim, ir);
    reverb.connect(getDestination());
    reverbs[orbit] = reverb;
  }
  if (
    hasChanged(duration, reverbs[orbit].duration) ||
    hasChanged(fade, reverbs[orbit].fade) ||
    hasChanged(lp, reverbs[orbit].lp) ||
    hasChanged(dim, reverbs[orbit].dim) ||
    reverbs[orbit].ir !== ir
  ) {
    // only regenerate when something has changed
    // avoids endless regeneration on things like
    // stack(s("a"), s("b").rsize(8)).room(.5)
    // this only works when args may stay undefined until here
    // setting default values breaks this
    reverbs[orbit].generate(duration, fade, lp, dim, ir);
  }
  return reverbs[orbit];
}

export let analyser, analyserData /* s = {} */;

export function getAnalyser(/* orbit,  */ fftSize = 2048) {
  if (!analyser /*s [orbit] */) {
    const analyserNode = getAudioContext().createAnalyser();
    analyserNode.fftSize = fftSize;
    // getDestination().connect(analyserNode);
    analyser /* s[orbit] */ = analyserNode;
    //analyserData = new Uint8Array(analyser.frequencyBinCount);
    analyserData = new Float32Array(analyser.frequencyBinCount);
  }
  if (analyser /* s[orbit] */.fftSize !== fftSize) {
    analyser /* s[orbit] */.fftSize = fftSize;
    //analyserData = new Uint8Array(analyser.frequencyBinCount);
    analyserData = new Float32Array(analyser.frequencyBinCount);
  }
  return analyser /* s[orbit] */;
}

export function getAnalyzerData(type = 'time') {
  const getter = {
    time: () => analyser?.getFloatTimeDomainData(analyserData),
    frequency: () => analyser?.getFloatFrequencyData(analyserData),
  }[type];
  if (!getter) {
    throw new Error(`getAnalyzerData: ${type} not supported. use one of ${Object.keys(getter).join(', ')}`);
  }
  getter();
  return analyserData;
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

  // duration is passed as value too..
  value.duration = hapDuration;
  // calculate absolute time
  let t = ac.currentTime + deadline;
  // destructure
  let {
    s = 'triangle',
    bank,
    source,
    gain = 0.8,
    postgain = 1,
    // filters
    ftype = '12db',
    fanchor = 0.5,
    // low pass
    cutoff,
    lpenv,
    lpattack = 0.01,
    lpdecay = 0.01,
    lpsustain = 1,
    lprelease = 0.01,
    resonance = 1,
    // high pass
    hpenv,
    hcutoff,
    hpattack = 0.01,
    hpdecay = 0.01,
    hpsustain = 1,
    hprelease = 0.01,
    hresonance = 1,
    // band pass
    bpenv,
    bandf,
    bpattack = 0.01,
    bpdecay = 0.01,
    bpsustain = 1,
    bprelease = 0.01,
    bandq = 1,

    //phaser
    phaser,
    phaserdepth = 0.75,
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
    roomfade,
    roomlp,
    roomdim,
    roomsize,
    ir,
    i = 0,
    velocity = 1,
    analyze, // analyser wet
    fft = 8, // fftSize 0 - 10
    compressor: compressorThreshold,
    compressorRatio,
    compressorKnee,
    compressorAttack,
    compressorRelease,
  } = value;
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

  if (cutoff !== undefined) {
    let lp = () =>
      createFilter(
        ac,
        'lowpass',
        cutoff,
        resonance,
        lpattack,
        lpdecay,
        lpsustain,
        lprelease,
        lpenv,
        t,
        t + hapDuration,
        fanchor,
      );
    chain.push(lp());
    if (ftype === '24db') {
      chain.push(lp());
    }
  }

  if (hcutoff !== undefined) {
    let hp = () =>
      createFilter(
        ac,
        'highpass',
        hcutoff,
        hresonance,
        hpattack,
        hpdecay,
        hpsustain,
        hprelease,
        hpenv,
        t,
        t + hapDuration,
        fanchor,
      );
    chain.push(hp());
    if (ftype === '24db') {
      chain.push(hp());
    }
  }

  if (bandf !== undefined) {
    let bp = () =>
      createFilter(
        ac,
        'bandpass',
        bandf,
        bandq,
        bpattack,
        bpdecay,
        bpsustain,
        bprelease,
        bpenv,
        t,
        t + hapDuration,
        fanchor,
      );
    chain.push(bp());
    if (ftype === '24db') {
      chain.push(bp());
    }
  }

  if (vowel !== undefined) {
    const vowelFilter = ac.createVowelFilter(vowel);
    chain.push(vowelFilter);
  }

  // effects
  coarse !== undefined && chain.push(getWorklet(ac, 'coarse-processor', { coarse }));
  crush !== undefined && chain.push(getWorklet(ac, 'crush-processor', { crush }));
  shape !== undefined && chain.push(getWorklet(ac, 'shape-processor', { shape }));
  // phaser !== undefined && chain.push(getWorklet(ac, 'phaser-processor', { phaser }));

  compressorThreshold !== undefined &&
    chain.push(
      getCompressor(ac, compressorThreshold, compressorRatio, compressorKnee, compressorAttack, compressorRelease),
    );

  // panning
  if (pan !== undefined) {
    const panner = ac.createStereoPanner();
    panner.pan.value = 2 * pan - 1;
    chain.push(panner);
  }
  // phaser
  if (phaser !== undefined && phaserdepth > 0) {
    const phaserFX = getPhaser(phaser, phaserdepth);
    chain.push(phaserFX);
  }

  // last gain
  const post = gainNode(postgain);
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
  if (room > 0) {
    let roomIR;
    if (ir !== undefined) {
      let url;
      let sample = getSound(ir);
      if (Array.isArray(sample)) {
        url = sample.data.samples[i % sample.data.samples.length];
      } else if (typeof sample === 'object') {
        url = Object.values(sample.data.samples).flat()[i % Object.values(sample.data.samples).length];
      }
      roomIR = await loadBuffer(url, ac, ir, 0);
    }
    const reverbNode = getReverb(orbit, roomsize, roomfade, roomlp, roomdim, roomIR);
    reverbSend = effectSend(post, reverbNode, room);
  }

  // analyser
  let analyserSend;
  if (analyze) {
    const analyserNode = getAnalyser(/* orbit,  */ 2 ** (fft + 5));
    analyserSend = effectSend(post, analyserNode, analyze);
  }

  // connect chain elements together
  chain.slice(1).reduce((last, current) => last.connect(current), chain[0]);

  // toDisconnect = all the node that should be disconnected in onended callback
  // this is crucial for performance
  toDisconnect = chain.concat([delaySend, reverbSend, analyserSend]);
};

export const superdoughTrigger = (t, hap, ct, cps) => superdough(hap, t - ct, hap.duration / cps, cps);
