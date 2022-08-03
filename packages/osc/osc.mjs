/*
osc.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/osc/osc.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import OSC from 'osc-js';
import { Pattern, objectify } from '@strudel.cycles/core';

const comm = new OSC();
comm.open();
const latency = 0.1;
let startedAt = -1;

/**
 *
 * Sends each hap as an OSC message, which can be picked up by SuperCollider or any other OSC-enabled software.
 *
 * @name osc
 * @memberof Pattern
 * @returns Pattern
 */
Pattern.prototype.osc = function () {
  return this._withHap((hap) => {
    const onTrigger = (time, hap, currentTime, cps) => {
      const cycle = hap.wholeOrPart().begin.valueOf();
      const delta = hap.duration.valueOf();
      // time should be audio time of onset
      // currentTime should be current time of audio context (slightly before time)
      if (startedAt < 0) {
        startedAt = Date.now() - currentTime * 1000;
      }
      const controls = Object.assign({}, { cps, cycle, delta }, objectify(hap.value));
      const keyvals = Object.entries(controls).flat();
      const ts = Math.floor(startedAt + (time + latency) * 1000);
      const message = new OSC.Message('/dirt/play', ...keyvals);
      const bundle = new OSC.Bundle([message], ts);
      bundle.timestamp(ts); // workaround for https://github.com/adzialocha/osc-js/issues/60
      comm.send(bundle);
    };
    return hap.setContext({ ...hap.context, onTrigger });
  });
};

Pattern.prototype.superdirt = function () {
  return this.withValue(dirtify).osc();
};
