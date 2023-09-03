import { logger, parseNumeral, Pattern } from '@strudel.cycles/core';
import { Invoke } from './utils.mjs';

Pattern.prototype.osc = function () {
  return this.onTrigger(async (time, hap, currentTime, cps = 1) => {
    hap.ensureObjectValue();
    const cycle = hap.wholeOrPart().begin.valueOf();
    const delta = hap.duration.valueOf();
    const controls = Object.assign({}, { cps, cycle, delta }, hap.value);
    // make sure n and note are numbers
    controls.n && (controls.n = parseNumeral(controls.n));
    controls.note && (controls.note = parseNumeral(controls.note));

    const messagesfromjs = [];
    const params = [];
    const offset = Math.round((time - currentTime) * 1000 - 48);

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

    if (params.length) {
      messagesfromjs.push({ target: '/dirt/play', offset, params });
    }
    console.log(messagesfromjs);

    if (messagesfromjs.length) {
      setTimeout(() => {
        Invoke('sendosc', { messagesfromjs });
      });
    }
  });
};
