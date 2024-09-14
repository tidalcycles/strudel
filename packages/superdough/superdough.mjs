/*
superdough.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/superdough/superdough.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import './feedbackdelay.mjs';
import './reverb.mjs';
import './vowel.mjs';
import { clamp, nanFallback, _mod } from './util.mjs';
import workletsUrl from './worklets.mjs?worker&url';
import { createFilter, gainNode, getCompressor, getWorklet } from './helpers.mjs';
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

const defaultDefaultValues = {
  s: 'triangle',
  gain: 0.8,
  postgain: 1,
  density: '.03',
  ftype: '12db',
  fanchor: 0,
  resonance: 1,
  hresonance: 1,
  bandq: 1,
  channels: [1, 2],
  phaserdepth: 0.75,
  shapevol: 1,
  distortvol: 1,
  delay: 0,
  delayfeedback: 0.5,
  delaytime: 0.25,
  orbit: 1,
  i: 1,
  velocity: 1,
  fft: 8,
};

let defaultControls = new Map(Object.entries(defaultDefaultValues));

export function setDefaultValue(key, value) {
  defaultControls.set(key, value);
}
export function getDefaultValue(key) {
  return defaultControls.get(key);
}
export function setDefaultValues(defaultsobj) {
  Object.keys(defaultsobj).forEach((key) => {
    setDefaultValue(key, defaultsobj[key]);
  });
}
export function resetDefaultValues() {
  defaultControls = new Map(Object.entries(defaultDefaultValues));
}
export function setVersionDefaults(version) {
  resetDefaultValues();
  if (version === '1.0') {
    setDefaultValue('fanchor', 0.5);
  }
}

export const resetLoadedSounds = () => soundMap.set({});

let audioContext;

export const setDefaultAudioContext = () => {
  audioContext = new AudioContext();
  return audioContext;
};

export const getAudioContext = () => {
  if (!audioContext) {
    return setDefaultAudioContext();
  }

  return audioContext;
};

export function getAudioContextCurrentTime() {
  return getAudioContext().currentTime;
}

let workletsLoading;
function loadWorklets() {
  if (!workletsLoading) {
    workletsLoading = getAudioContext().audioWorklet.addModule(workletsUrl);
  }
  return workletsLoading;
}

// this function should be called on first user interaction (to avoid console warning)
export async function initAudio(options = {}) {
  const { disableWorklets = false } = options;
  if (typeof window === 'undefined') {
    return;
  }
  await getAudioContext().resume();
  if (disableWorklets) {
    logger('[superdough]: AudioWorklets disabled with disableWorklets');
    return;
  }
  try {
    await loadWorklets();
    logger('[superdough] AudioWorklets loaded');
  } catch (err) {
    console.warn('could not load AudioWorklet effects', err);
  }
  logger('[superdough] ready');
}
let audioReady;
export async function initAudioOnFirstClick(options) {
  if (!audioReady) {
    audioReady = new Promise((resolve) => {
      document.addEventListener('click', async function listener() {
        document.removeEventListener('click', listener);
        await initAudio(options);
        resolve();
      });
    });
  }
  return audioReady;
}

let delays = {};
const maxfeedback = 0.98;

let channelMerger, destinationGain;
//update the output channel configuration to match user's audio device
export function initializeAudioOutput() {
  const audioContext = getAudioContext();
  const maxChannelCount = audioContext.destination.maxChannelCount;
  audioContext.destination.channelCount = maxChannelCount;
  channelMerger = new ChannelMergerNode(audioContext, { numberOfInputs: audioContext.destination.channelCount });
  destinationGain = new GainNode(audioContext);
  channelMerger.connect(destinationGain);
  destinationGain.connect(audioContext.destination);
}

// input: AudioNode, channels: ?Array<int>
export const connectToDestination = (input, channels = [0, 1]) => {
  const ctx = getAudioContext();
  if (channelMerger == null) {
    initializeAudioOutput();
  }
  //This upmix can be removed if correct channel counts are set throughout the app,
  // and then strudel could theoretically support surround sound audio files
  const stereoMix = new StereoPannerNode(ctx);
  input.connect(stereoMix);

  const splitter = new ChannelSplitterNode(ctx, {
    numberOfOutputs: stereoMix.channelCount,
  });
  stereoMix.connect(splitter);
  channels.forEach((ch, i) => {
    splitter.connect(channelMerger, i % stereoMix.channelCount, clamp(ch, 0, ctx.destination.channelCount - 1));
  });
};

export const panic = () => {
  if (destinationGain == null) {
    return;
  }
  destinationGain.gain.linearRampToValueAtTime(0, getAudioContext().currentTime + 0.01);
  destinationGain = null;
  channelMerger == null;
};

function getDelay(orbit, delaytime, delayfeedback, t) {
  if (delayfeedback > maxfeedback) {
    //logger(`delayfeedback was clamped to ${maxfeedback} to save your ears`);
  }
  delayfeedback = clamp(delayfeedback, 0, 0.98);
  if (!delays[orbit]) {
    const ac = getAudioContext();
    const dly = ac.createFeedbackDelay(1, delaytime, delayfeedback);
    dly.start?.(t); // for some reason, this throws when audion extension is installed..
    connectToDestination(dly, [0, 1]);
    delays[orbit] = dly;
  }
  delays[orbit].delayTime.value !== delaytime && delays[orbit].delayTime.setValueAtTime(delaytime, t);
  delays[orbit].feedback.value !== delayfeedback && delays[orbit].feedback.setValueAtTime(delayfeedback, t);
  return delays[orbit];
}

function getPhaser(time, end, frequency = 1, depth = 0.5, centerFrequency = 1000, sweep = 2000) {
  //gain
  const ac = getAudioContext();
  const lfoGain = ac.createGain();
  lfoGain.gain.value = sweep * 2;
  // centerFrequency = centerFrequency * 2;
  // sweep = sweep * 1.5;

  const lfo = getWorklet(ac, 'lfo-processor', {
    frequency,
    depth: 1,
    skew: 0,
    phaseoffset: 0,
    time,
    end,
    shape: 1,
    dcoffset: -0.5,
  });
  lfo.connect(lfoGain);

  //filters
  const numStages = 2; //num of filters in series
  let fOffset = 0;
  const filterChain = [];
  for (let i = 0; i < numStages; i++) {
    const filter = ac.createBiquadFilter();
    filter.type = 'notch';
    filter.gain.value = 1;
    filter.frequency.value = centerFrequency + fOffset;
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

function getFilterType(ftype) {
  ftype = ftype ?? 0;
  const filterTypes = ['12db', 'ladder', '24db'];
  return typeof ftype === 'number' ? filterTypes[Math.floor(_mod(ftype, filterTypes.length))] : ftype;
}

let reverbs = {};
let hasChanged = (now, before) => now !== undefined && now !== before;
function getReverb(orbit, duration, fade, lp, dim, ir) {
  // If no reverb has been created for a given orbit, create one
  if (!reverbs[orbit]) {
    const ac = getAudioContext();
    const reverb = ac.createReverb(duration, fade, lp, dim, ir);
    connectToDestination(reverb, [0, 1]);
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

export let analysers = {},
  analysersData = {};

export function getAnalyserById(id, fftSize = 1024) {
  if (!analysers[id]) {
    // make sure this doesn't happen too often as it piles up garbage
    const analyserNode = getAudioContext().createAnalyser();
    analyserNode.fftSize = fftSize;
    // getDestination().connect(analyserNode);
    analysers[id] = analyserNode;
    analysersData[id] = new Float32Array(analysers[id].frequencyBinCount);
  }
  if (analysers[id].fftSize !== fftSize) {
    analysers[id].fftSize = fftSize;
    analysersData[id] = new Float32Array(analysers[id].frequencyBinCount);
  }
  return analysers[id];
}

export function getAnalyzerData(type = 'time', id = 1) {
  const getter = {
    time: () => analysers[id]?.getFloatTimeDomainData(analysersData[id]),
    frequency: () => analysers[id]?.getFloatFrequencyData(analysersData[id]),
  }[type];
  if (!getter) {
    throw new Error(`getAnalyzerData: ${type} not supported. use one of ${Object.keys(getter).join(', ')}`);
  }
  getter();
  return analysersData[id];
}

function effectSend(input, effect, wet) {
  const send = gainNode(wet);
  input.connect(send);
  send.connect(effect);
  return send;
}

export function resetGlobalEffects() {
  delays = {};
  reverbs = {};
  analysers = {};
  analysersData = {};
}

export const superdough = async (value, t, hapDuration) => {
  t = typeof t === 'string' && t.startsWith('=') ? Number(t.slice(1)) : ac.currentTime + t;
  let { stretch } = value;
  if (stretch != null) {
    //account for phase vocoder latency
    const latency = 0.04;
    t = t - latency;
  }
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

  if (t < ac.currentTime) {
    console.warn(
      `[superdough]: cannot schedule sounds in the past (target: ${t.toFixed(2)}, now: ${ac.currentTime.toFixed(2)})`,
    );
    return;
  }
  // destructure
  let {
    s = getDefaultValue('s'),
    bank,
    source,
    gain = getDefaultValue('gain'),
    postgain = getDefaultValue('postgain'),
    density = getDefaultValue('density'),
    // filters
    fanchor = getDefaultValue('fanchor'),
    drive = 0.69,
    // low pass
    cutoff,
    lpenv,
    lpattack,
    lpdecay,
    lpsustain,
    lprelease,
    resonance = getDefaultValue('resonance'),
    // high pass
    hpenv,
    hcutoff,
    hpattack,
    hpdecay,
    hpsustain,
    hprelease,
    hresonance = getDefaultValue('hresonance'),
    // band pass
    bpenv,
    bandf,
    bpattack,
    bpdecay,
    bpsustain,
    bprelease,
    bandq = getDefaultValue('bandq'),
    channels = getDefaultValue('channels'),
    //phaser
    phaserrate: phaser,
    phaserdepth = getDefaultValue('phaserdepth'),
    phasersweep,
    phasercenter,
    //
    coarse,
    crush,
    shape,
    shapevol = getDefaultValue('shapevol'),
    distort,
    distortvol = getDefaultValue('distortvol'),
    pan,
    vowel,
    delay = getDefaultValue('delay'),
    delayfeedback = getDefaultValue('delayfeedback'),
    delaytime = getDefaultValue('delaytime'),
    orbit = getDefaultValue('orbit'),
    room,
    roomfade,
    roomlp,
    roomdim,
    roomsize,
    ir,
    i = getDefaultValue('i'),
    velocity = getDefaultValue('velocity'),
    analyze, // analyser wet
    fft = getDefaultValue('fft'), // fftSize 0 - 10
    compressor: compressorThreshold,
    compressorRatio,
    compressorKnee,
    compressorAttack,
    compressorRelease,
  } = value;

  gain = nanFallback(gain, 1);

  //music programs/audio gear usually increments inputs/outputs from 1, so imitate that behavior
  channels = (Array.isArray(channels) ? channels : [channels]).map((ch) => ch - 1);

  gain *= velocity; // velocity currently only multiplies with gain. it might do other things in the future
  let toDisconnect = []; // audio nodes that will be disconnected when the source has ended
  const onended = () => {
    toDisconnect.forEach((n) => n?.disconnect());
  };
  if (bank && s) {
    s = `${bank}_${s}`;
    value.s = s;
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
  stretch !== undefined && chain.push(getWorklet(ac, 'phase-vocoder-processor', { pitchFactor: stretch }));

  // gain stage
  chain.push(gainNode(gain));

  //filter
  const ftype = getFilterType(value.ftype);
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
        ftype,
        drive,
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
  shape !== undefined && chain.push(getWorklet(ac, 'shape-processor', { shape, postgain: shapevol }));
  distort !== undefined && chain.push(getWorklet(ac, 'distort-processor', { distort, postgain: distortvol }));

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
    const phaserFX = getPhaser(t, t + hapDuration, phaser, phaserdepth, phasercenter, phasersweep);
    chain.push(phaserFX);
  }

  // last gain
  const post = new GainNode(ac, { gain: postgain });
  chain.push(post);
  connectToDestination(post, channels);

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
    const analyserNode = getAnalyserById(analyze, 2 ** (fft + 5));
    analyserSend = effectSend(post, analyserNode, 1);
  }

  // connect chain elements together
  chain.slice(1).reduce((last, current) => last.connect(current), chain[0]);

  // toDisconnect = all the node that should be disconnected in onended callback
  // this is crucial for performance
  toDisconnect = chain.concat([delaySend, reverbSend, analyserSend]);
};

export const superdoughTrigger = (t, hap, ct, cps) => {
  superdough(hap, t - ct, hap.duration / cps, cps);
};
