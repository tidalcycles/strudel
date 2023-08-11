/*
webaudio.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/webaudio/webaudio.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import * as strudel from '@strudel.cycles/core';
import { superdough, getAudioContext } from 'superdough';
const { Pattern, logger } = strudel;

const hap2value = (hap) => {
  hap.ensureObjectValue();
  return { ...hap.value, velocity: hap.context.velocity };
};

// TODO: bind logger
export const webaudioOutputTrigger = (t, hap, ct, cps) => superdough(hap2value(hap), t - ct, hap.duration / cps, cps);
export const webaudioOutput = (hap, deadline, hapDuration) => superdough(hap2value(hap), deadline, hapDuration);

Pattern.prototype.webaudio = function () {
  return this.onTrigger(webaudioOutputTrigger);
};

export function webaudioScheduler(options = {}) {
  options = {
    getTime: () => getAudioContext().currentTime,
    defaultOutput: webaudioOutput,
    ...options,
  };
  const { defaultOutput, getTime } = options;
  return new strudel.Cyclist({
    ...options,
    onTrigger: strudel.getTrigger({ defaultOutput, getTime }),
  });
}
