import { getAudioContext } from './superdough.mjs';
import { clamp } from './util.mjs';

export function gainNode(value) {
  const node = getAudioContext().createGain();
  node.gain.value = value;
  return node;
}

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

export const getExpEnvelope = (attack, decay, sustain, release, velocity, begin) => {
  sustain = Math.max(0.001, sustain);
  velocity = Math.max(0.001, velocity);
  const gainNode = getAudioContext().createGain();
  gainNode.gain.setValueAtTime(0.0001, begin);
  gainNode.gain.exponentialRampToValueAtTime(velocity, begin + attack);
  gainNode.gain.exponentialRampToValueAtTime(sustain * velocity, begin + attack + decay);
  return {
    node: gainNode,
    stop: (t) => {
      // similar to getEnvelope, this will glitch if sustain level has not been reached
      gainNode.gain.exponentialRampToValueAtTime(0.0001, t + release);
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

export const getParamADSR = (param, attack, decay, sustain, release, min, max, begin, end) => {
  const range = max - min;
  const peak = min + range;
  const sustainLevel = min + sustain * range;
  param.setValueAtTime(min, begin);
  param.linearRampToValueAtTime(peak, begin + attack);
  param.linearRampToValueAtTime(sustainLevel, begin + attack + decay);
  param.setValueAtTime(sustainLevel, end);
  param.linearRampToValueAtTime(min, end + Math.max(release, 0.1));
};

export function createFilter(context, type, frequency, Q, attack, decay, sustain, release, fenv, start, end) {
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.Q.value = Q;
  frequency = Math.max(frequency, 20);
  filter.frequency.value = frequency;

  // Apply ADSR to filter frequency
  if (fenv !== 0) {
    let anchor = 0.5;
    let offset = fenv * anchor;
    let min = 2 ** -offset;
    let max = 2 ** (fenv - offset);
    min *= frequency;
    max *= frequency;

    //console.log('min', min, 'max', max);

    min = clamp(min + frequency, 0, 20000);
    max = clamp(max + frequency, 0, 20000);
    getParamADSR(filter.frequency, attack, decay, sustain, release, min, max, start, end);
    return filter;
  }

  return filter;
}
