import { getAudioContext } from './superdough.mjs';
import { clamp } from './util.mjs';

const setRelease = (param, phase, sustain, startTime, endTime, endValue, curve = 'linear') => {
  const ctx = getAudioContext();
  const ramp = curve === 'exponential' ? 'exponentialRampToValueAtTime' : 'linearRampToValueAtTime';
  // if the decay stage is complete before the note event is done, we don't need to do anything special
  if (phase < startTime) {
    param.setValueAtTime(sustain, startTime);
    param[ramp](endValue, endTime);
  } else if (param.cancelAndHoldAtTime == null) {
    //this replicates cancelAndHoldAtTime behavior for Firefox
    setTimeout(() => {
      //sustain at current value
      const currValue = param.value;
      param.cancelScheduledValues(0);
      param.setValueAtTime(currValue, 0);
      //release
      param[ramp](endValue, endTime);
    }, (startTime - ctx.currentTime) * 1000);
  } else {
    //stop the envelope, hold the value, and then set the release stage
    param.cancelAndHoldAtTime(startTime);
    param[ramp](endValue, endTime);
  }
};

export function gainNode(value) {
  const node = getAudioContext().createGain();
  node.gain.value = value;
  return node;
}

// alternative to getADSR returning the gain node and a stop handle to trigger the release anytime in the future
export const getEnvelope = (attack, decay, sustain, release, velocity, begin) => {
  const gainNode = getAudioContext().createGain();
  let phase = begin;
  gainNode.gain.setValueAtTime(0, begin);
  phase += attack;
  gainNode.gain.linearRampToValueAtTime(velocity, phase); // attack
  phase += decay;
  let sustainLevel = sustain * velocity;
  gainNode.gain.linearRampToValueAtTime(sustainLevel, phase); // decay / sustain
  // sustain end
  return {
    node: gainNode,
    stop: (t) => {
      const endTime = t + release;
      setRelease(gainNode.gain, phase, sustain, t, endTime, 0);
      // helps prevent pops from overlapping sounds
      return endTime;
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

export const getParamADSR = (
  param,
  attack,
  decay,
  sustain,
  release,
  min,
  max,
  begin,
  end,
  //exponential works better for frequency modulations (such as filter cutoff) due to human ear perception
  curve = 'exponential',
) => {
  const ramp = curve === 'exponential' ? 'exponentialRampToValueAtTime' : 'linearRampToValueAtTime';
  let phase = begin;
  const range = max - min;
  const peak = min + range;

  param.setValueAtTime(min, begin);
  phase += attack;
  //attack
  param[ramp](peak, phase);
  phase += decay;
  const sustainLevel = min + sustain * range;

  //decay
  param[ramp](sustainLevel, phase);

  setRelease(param, phase, sustainLevel, end, end + release, min, curve);
};

export function getCompressor(ac, threshold, ratio, knee, attack, release) {
  const options = {
    threshold: threshold ?? -3,
    ratio: ratio ?? 10,
    knee: knee ?? 10,
    attack: attack ?? 0.005,
    release: release ?? 0.05,
  };
  return new DynamicsCompressorNode(ac, options);
}

// changes the default values of the envelope based on what parameters the user has defined
// so it behaves more like you would expect/familiar as other synthesis tools
// ex: sound(val).decay(val) will behave as a decay only envelope. sound(val).attack(val).decay(val) will behave like an "ad" env, etc.

export const getADSRValues = (params, curve = 'linear', defaultValues) => {
  const envmin = curve === 'exponential' ? 0.001 : 0;
  const releaseMin = 0.01;
  const envmax = 1;
  const [a, d, s, r] = params;
  if (a == null && d == null && s == null && r == null) {
    return defaultValues ?? [envmin, envmin, envmax, releaseMin];
  }
  const sustain = s != null ? s : (a != null && d == null) || (a == null && d == null) ? envmax : envmin;
  return [Math.max(a ?? 0, envmin), Math.max(d ?? 0, envmin), Math.min(sustain, envmax), Math.max(r ?? 0, releaseMin)];
};

export function createFilter(context, type, frequency, Q, att, dec, sus, rel, fenv, start, end, fanchor = 0.5) {
  const curve = 'exponential';
  const [attack, decay, sustain, release] = getADSRValues([att, dec, sus, rel], curve, [0.005, 0.14, 0, 0.1]);
  const filter = context.createBiquadFilter();

  filter.type = type;
  filter.Q.value = Q;
  filter.frequency.value = frequency;

  // Apply ADSR to filter frequency
  if (!isNaN(fenv) && fenv !== 0) {
    const offset = fenv * fanchor;

    const max = clamp(2 ** (fenv - offset) * frequency, 0, 20000);

    getParamADSR(filter.frequency, attack, decay, sustain, release, frequency, max, start, end, curve);
    return filter;
  }

  return filter;
}

// stays 1 until .5, then fades out
let wetfade = (d) => (d < 0.5 ? 1 : 1 - (d - 0.5) / 0.5);

// mix together dry and wet nodes. 0 = only dry 1 = only wet
// still not too sure about how this could be used more generally...
export function drywet(dry, wet, wetAmount = 0) {
  const ac = getAudioContext();
  if (!wetAmount) {
    return dry;
  }
  let dry_gain = ac.createGain();
  let wet_gain = ac.createGain();
  dry.connect(dry_gain);
  wet.connect(wet_gain);
  dry_gain.gain.value = wetfade(wetAmount);
  wet_gain.gain.value = wetfade(1 - wetAmount);
  let mix = ac.createGain();
  dry_gain.connect(mix);
  wet_gain.connect(mix);
  return mix;
}
