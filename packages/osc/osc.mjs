import OSC from './lib/osc-js.js';
import { Pattern } from '@strudel.cycles/core/strudel.mjs';

const comm = new OSC();
comm.open();
const latency = 0.1;

Pattern.prototype.osc = function () {
  return this._withEvent((event) => {
    const onTrigger = (time, event, currentTime) => {
      // time should be audio time of onset
      // currentTime should be current time of audio context (slightly before time)
      const keyvals = Object.entries(event.value).flat();
      const offset = (time - currentTime + latency) * 1000;
      const ts = Math.floor(Date.now() + offset);
      const message = new OSC.Message('/dirt/play', ...keyvals);
      const bundle = new OSC.Bundle([message], ts);
      bundle.timestamp(ts); // workaround for https://github.com/adzialocha/osc-js/issues/60
      comm.send(bundle);
    };
    return event.setContext({ ...event.context, onTrigger });
  });
};
