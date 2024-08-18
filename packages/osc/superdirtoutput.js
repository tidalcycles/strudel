import { oscTriggerTauri } from '../desktopbridge/oscbridge.mjs';
import { isTauri } from '../desktopbridge/utils.mjs';
import { oscTrigger } from './osc.mjs';

const trigger = isTauri() ? oscTriggerTauri : oscTrigger;

export const superdirtOutput = (hap, deadline, hapDuration, cps, targetTime) => {
  const currentTime = performance.now() / 1000;
  return trigger(null, hap, currentTime, cps, targetTime);
};
