import { getAudioContext } from './superdough.mjs';
import { clamp, nanFallback } from './util.mjs';

export function gainNode(value) {
  const node = getAudioContext().createGain();
  node.gain.value = value;
  return node;
}

const getSlope = (y1, y2, x1, x2) => {
  const denom = x2 - x1;
  if (denom === 0) {
    return 0;
  }
  return (y2 - y1) / (x2 - x1);
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
  attack = nanFallback(attack);
  decay = nanFallback(decay);
  sustain = nanFallback(sustain);
  release = nanFallback(release);

  const ramp = curve === 'exponential' ? 'exponentialRampToValueAtTime' : 'linearRampToValueAtTime';
  if (curve === 'exponential') {
    min = Math.max(0.0001, min);
  }
  const range = max - min;
  const peak = max;
  const sustainVal = min + sustain * range;
  const duration = end - begin;

  const envValAtTime = (time) => {
    if (attack > time) {
      let slope = getSlope(min, peak, 0, attack);
      return time * slope + (min > peak ? min : 0);
    } else {
      return (time - attack) * getSlope(peak, sustainVal, 0, decay) + peak;
    }
  };

  param.setValueAtTime(min, begin);
  if (attack > duration) {
    //attack
    param[ramp](envValAtTime(duration), end);
  } else if (attack + decay > duration) {
    //attack
    param[ramp](envValAtTime(attack), begin + attack);
    //decay
    param[ramp](envValAtTime(duration), end);
  } else {
    //attack
    param[ramp](envValAtTime(attack), begin + attack);
    //decay
    param[ramp](envValAtTime(attack + decay), begin + attack + decay);
    //sustain
    param.setValueAtTime(sustainVal, end);
  }
  //release
  param[ramp](min, end + release);
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
  const envmin = curve === 'exponential' ? 0.001 : 0.001;
  const releaseMin = 0.01;
  const envmax = 1;
  const [a, d, s, r] = params;
  if (a == null && d == null && s == null && r == null) {
    return defaultValues ?? [envmin, envmin, envmax, releaseMin];
  }
  const sustain = s != null ? s : (a != null && d == null) || (a == null && d == null) ? envmax : envmin;
  return [Math.max(a ?? 0, envmin), Math.max(d ?? 0, envmin), Math.min(sustain, envmax), Math.max(r ?? 0, releaseMin)];
};

export function createFilter(context, type, frequency, Q, att, dec, sus, rel, fenv, start, end, fanchor) {
  const curve = 'exponential';
  const [attack, decay, sustain, release] = getADSRValues([att, dec, sus, rel], curve, [0.005, 0.14, 0, 0.1]);
  const filter = context.createBiquadFilter();

  filter.type = type;
  filter.Q.value = Q;
  filter.frequency.value = frequency;
  // envelope is active when any of these values is set
  const hasEnvelope = att ?? dec ?? sus ?? rel ?? fenv;
  // Apply ADSR to filter frequency
  if (hasEnvelope !== undefined) {
    fenv = nanFallback(fenv, 1, true);
    fanchor = nanFallback(fanchor, 0, true);
    const fenvAbs = Math.abs(fenv);
    const offset = fenvAbs * fanchor;
    let min = clamp(2 ** -offset * frequency, 0, 20000);
    let max = clamp(2 ** (fenvAbs - offset) * frequency, 0, 20000);
    if (fenv < 0) [min, max] = [max, min];
    getParamADSR(filter.frequency, attack, decay, sustain, release, min, max, start, end, curve);
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

export function getPitchEnvelope(param, value, t, holdEnd) {
  if (value.penv) {
    let [pattack, pdecay, psustain, prelease] = getADSRValues([
      value.pattack,
      value.pdecay,
      value.psustain,
      value.prelease,
    ]);
    const cents = value.penv * 100;
    getParamADSR(param, pattack, pdecay, psustain, prelease, 0, cents, t, holdEnd, 'linear');
  }
}
