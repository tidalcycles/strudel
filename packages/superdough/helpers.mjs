import { getAudioContext } from './superdough.mjs';
import { ZZFX } from 'zzfx';

export function gainNode(value) {
  const node = getAudioContext().createGain();
  node.gain.value = value;
  return node;
}

export const getZZFX = (value, t, duration) => {
  let {
    s,
    note = 36,
    freq,
    //
    randomness = 0,
    attack = 0,
    decay = 0,
    sustain = 0.8,
    release = 0.1,
    shapeCurve = 1,
    slide = 0,
    deltaSlide = 0,
    pitchJump = 0,
    pitchJumpTime = 0,
    repeatTime = 0,
    noise = 0,
    modulation = 0,
    bitCrush = 0,
    delay = 0,
    tremolo = 0,
  } = value;
  if (typeof note === 'string') {
    note = noteToMidi(note); // e.g. c3 => 48
  }
  // get frequency
  if (!freq && typeof n === 'number') {
    freq = midiToFreq(n);
  }
  const shape = ['zsine', 'ztri', 'zsaw', 'ztan', 'znoise'].indexOf(s) || 0;

  const params = [
    1, // volume
    randomness, // randomness
    freq,
    attack,
    duration, // sustain time
    release,
    shape,
    shapeCurve,
    slide,
    deltaSlide,
    pitchJump,
    pitchJumpTime,
    repeatTime,
    noise,
    modulation,
    bitCrush,
    delay,
    sustain, // sustain volume!
    decay,
    tremolo,
  ];
  const paramOrder = [
    'volume',
    'randomness',
    'frequency',
    'attack',
    'sustain',
    'release',
    'shape',
    'shapeCurve',
    'slide',
    'deltaSlide',
    'pitchJump',
    'pitchJumpTime',
    'repeatTime',
    'noise',
    'modulation',
    'bitCrush',
    'delay',
    'sustainVolume',
    'decay',
    'tremolo',
  ];

  const readableParams = Object.fromEntries(paramOrder.map((param, i) => [param, params[i]]));
  console.log(readableParams);

  const samples = ZZFX.buildSamples(...params);
  const context = getAudioContext();
  const buffer = context.createBuffer(1, samples.length, context.sampleRate);
  buffer.getChannelData(0).set(samples);
  const source = getAudioContext().createBufferSource();
  source.buffer = buffer;
  source.start(t);
  return {
    node: source,
  };
};

export const getOscillator = ({ s, freq, t }) => {
  // make oscillator
  const o = getAudioContext().createOscillator();
  o.type = s || 'triangle';
  o.frequency.value = Number(freq);
  o.start(t);
  //o.stop(t + duration + release);
  const stop = (time) => o.stop(time);
  return { node: o, stop };
};

// alternative to getADSR returning the gain node and a stop handle to trigger the release anytime in the future
export const getEnvelope = (attack, decay, sustain, release, velocity, begin) => {
  const gainNode = getAudioContext().createGain();
  gainNode.gain.setValueAtTime(0, begin);
  gainNode.gain.linearRampToValueAtTime(velocity, begin + attack); // attack
  gainNode.gain.linearRampToValueAtTime(sustain * velocity, begin + attack + decay); // sustain start
  // sustain end
  return {
    node: gainNode,
    stop: (t) => {
      //if (typeof gainNode.gain.cancelAndHoldAtTime === 'function') {
      // gainNode.gain.cancelAndHoldAtTime(t); // this seems to release instantly....
      // see https://discord.com/channels/779427371270275082/937365093082079272/1086053607360712735
      //} else {
      // firefox: this will glitch when the sustain has not been reached yet at the time of release
      gainNode.gain.setValueAtTime(sustain * velocity, t);
      //}
      gainNode.gain.linearRampToValueAtTime(0, t + release);
    },
  };
};

export const getADSR = (attack, decay, sustain, release, velocity, begin, end) => {
  const gainNode = getAudioContext().createGain();
  gainNode.gain.setValueAtTime(0, begin);
  gainNode.gain.linearRampToValueAtTime(velocity, begin + attack); // attack
  gainNode.gain.linearRampToValueAtTime(sustain * velocity, begin + attack + decay); // sustain start
  gainNode.gain.setValueAtTime(sustain * velocity, end); // sustain end
  gainNode.gain.linearRampToValueAtTime(0, end + release); // release
  // for some reason, using exponential ramping creates little cracklings
  /* let t = begin;
  gainNode.gain.setValueAtTime(0, t);
  gainNode.gain.exponentialRampToValueAtTime(velocity, (t += attack));
  const sustainGain = Math.max(sustain * velocity, 0.001);
  gainNode.gain.exponentialRampToValueAtTime(sustainGain, (t += decay));
  if (end - begin < attack + decay) {
    gainNode.gain.cancelAndHoldAtTime(end);
  } else {
    gainNode.gain.setValueAtTime(sustainGain, end);
  }
  gainNode.gain.exponentialRampToValueAtTime(0.001, end + release); // release */
  return gainNode;
};

export const getFilter = (type, frequency, Q) => {
  const filter = getAudioContext().createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.Q.value = Q;
  return filter;
};
