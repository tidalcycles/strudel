import { getAudioContext } from './superdough.mjs';
import { clamp } from './util.mjs';

AudioParam.prototype.setRelease = function (startTime, endTime, endValue, curve = 'linear') {
  const ctx = getAudioContext();
  const ramp = curve === 'exponential' ? 'exponentialRampToValueAtTime' : 'linearRampToValueAtTime';
  const param = this;
  if (AudioParam.prototype.cancelAndHoldAtTime == null) {
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
    param.cancelAndHoldAtTime(startTime);
    //release
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
      gainNode.gain.setRelease(t, endTime, 0);
      // helps prevent pops from overlapping sounds
      return endTime - 0.01;
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

export const getParamADSR = (
  context,
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
  phase += Math.max(release, 0.1);
  param.setRelease(end, phase, min, curve);
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
const envmin = 0.001;
export const getADSRValues = (params, defaultValues = [envmin, envmin, 1, envmin]) => {
  const [a, d, s, r] = params;
  const [defA, defD, defS, defR] = defaultValues;
  if (a == null && d == null && s == null && r == null) {
    return defaultValues;
  }
  const sustain = s != null ? s : (a != null && d == null) || (a == null && d == null) ? defS : envmin;
  return [a ?? envmin, d ?? envmin, sustain, r ?? envmin];
};

export function createFilter(context, type, frequency, Q, att, dec, sus, rel, fenv, start, end, fanchor = 0.5) {
  const [attack, decay, sustain, release] = getADSRValues([att, dec, sus, rel], [0.01, 0.01, 1, 0.01]);
  const filter = context.createBiquadFilter();
  filter.type = type;
  filter.Q.value = Q;
  filter.frequency.value = frequency;

  // Apply ADSR to filter frequency
  if (!isNaN(fenv) && fenv !== 0) {
    const offset = fenv * fanchor;

    const min = clamp(2 ** -offset * frequency, 0, 20000);
    const max = clamp(2 ** (fenv - offset) * frequency, 0, 20000);

    getParamADSR(context, filter.frequency, attack, decay, sustain, release, min, max, start, end);
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
