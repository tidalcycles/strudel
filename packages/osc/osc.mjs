import OSC from './node_modules/osc-js/lib/osc.js';
import { Pattern, isPattern } from '@strudel.cycles/core/strudel.mjs';

const comm = new OSC();
comm.open();
const startTime = Date.now();
const latency = 0.1 * 1000;

Pattern.prototype.osc = function () {
  return this._withEvent((event) => {
    const onTrigger = (time, event) => {
      console.log(time);
      const keyvals = Object.entries(event.value).flat();
      const ts = startTime + (time*1000);
      const message = new OSC.Message('/dirt/play', ts, ...keyvals);
      comm.send(message);
    };
    return event.setContext({ ...event.context, onTrigger });
  });
};
