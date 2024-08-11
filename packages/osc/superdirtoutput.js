import { oscTriggerTauri } from '../desktopbridge/oscbridge.mjs';
import { isTauri } from '../desktopbridge/utils.mjs';
import { getAudioContext } from '../superdough/superdough.mjs';
import { oscTrigger } from './osc.mjs';

const trigger = isTauri() ? oscTriggerTauri : oscTrigger;

export const superdirtOutput = (hap, deadline, hapDuration, cps, targetTime) => {
  const ctx = getAudioContext();
  const currentTime = ctx.currentTime;
  return trigger(null, hap, currentTime, cps, targetTime)
};
