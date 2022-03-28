
import OSC from './node_modules/osc-js/lib/osc.js';
import { Pattern, isPattern } from '@strudel.cycles/core/strudel.mjs';
//import {OSC} from 'osc-js';

const comm = new OSC();
comm.open();

Pattern.prototype.osc = function () {
    return this._withEvent((event) => {
        const onTrigger = (time, event) => {
            //const keyvals = Object.entries(event.value).flat();
            //const message = new OSC.Message("/dirt/play", ...keyvals);   
            const message = new OSC.Message(
                '/dirt/play',
                ...['_id_', '1', 'cps', 0.5625, 'cycle', 412.3333435058594, 'delta', 0.592592716217041, 'orbit', 0, 's', 'hh'],
              );
            comm.send(message);
        };
        return event.setContext({ ...event.context, onTrigger });
    });
};
