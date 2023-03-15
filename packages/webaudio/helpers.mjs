import { getAudioContext } from './webaudio.mjs';

export function gainNode(value) {
  const node = getAudioContext().createGain();
  node.gain.value = value;
  return node;
}

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
      if (typeof gainNode.gain.cancelAndHoldAtTime === 'function') {
        gainNode.gain.cancelAndHoldAtTime(t);
      } else {
        // firefox: this will glitch when the sustain has not been reached yet at the time of release
        gainNode.gain.setValueAtTime(sustain * velocity, t);
      }
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
