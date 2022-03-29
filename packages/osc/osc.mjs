import OSC from './node_modules/osc-js/lib/osc.js';
import { Pattern, isPattern } from '@strudel.cycles/core/strudel.mjs';
//import {OSC} from 'osc-js';

const comm = new OSC();
comm.open();

Pattern.prototype.osc = function () {
  return this._withEvent((event) => {
    const onTrigger = (time, event) => {
      const keyvals = Object.entries(event.value).flat();
      const message = new OSC.Message('/dirt/play', ...keyvals);
      comm.send(message);
    };
    return event.setContext({ ...event.context, onTrigger });
  });
};
