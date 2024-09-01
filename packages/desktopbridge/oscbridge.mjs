import { Pattern, ClockCollator } from '@strudel/core';
import { parseControlsFromHap } from 'node_modules/@strudel/osc/osc.mjs';
import { Invoke } from './utils.mjs';

const collator = new ClockCollator({});

export async function oscTriggerTauri(t_deprecate, hap, currentTime, cps = 1, targetTime) {
  const controls = parseControlsFromHap(hap, cps);
  const params = [];
  const timestamp = collator.calculateTimestamp(currentTime, targetTime);

  Object.keys(controls).forEach((key) => {
    const val = controls[key];
    const value = typeof val === 'number' ? val.toString() : val;

    if (value == null) {
      return;
    }
    params.push({
      name: key,
      value,
      valueisnumber: typeof val === 'number',
    });
  });

  if (params.length === 0) {
    return;
  }
  const message = { target: '/dirt/play', timestamp, params };
  setTimeout(() => {
    Invoke('sendosc', { messagesfromjs: [message] });
  });
}
Pattern.prototype.osc = function () {
  return this.onTrigger(oscTriggerTauri);
};
