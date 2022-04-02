import OSC from './node_modules/osc-js/lib/osc.js';
import { Pattern } from '@strudel.cycles/core/strudel.mjs';

const comm = new OSC();
comm.open();
const latency = 0.1;

Pattern.prototype.osc = function () {
  return this._withEvent((event) => {
    const onTrigger = (time, event, startedAt) => {
      const keyvals = Object.entries(event.value).flat();
      const ts = Math.floor(startedAt + (time + latency) * 1000);
      const message = new OSC.Message('/dirt/play', ...keyvals);
      const bundle = new OSC.Bundle([message], ts);
      bundle.timestamp(ts); // workaround for https://github.com/adzialocha/osc-js/issues/60
      comm.send(bundle);
    };
    return event.setContext({ ...event.context, onTrigger });
  });
};
