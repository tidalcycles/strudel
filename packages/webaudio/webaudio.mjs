/*
webaudio.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/webaudio/webaudio.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import * as strudel from '@strudel/core';
import { superdough, getAudioContext, setLogger, doughTrigger } from 'superdough';
const { Pattern, logger, repl } = strudel;

setLogger(logger);

const hap2value = (hap) => {
  hap.ensureObjectValue();
  return hap.value;
};

export const webaudioOutputTrigger = (t, hap, ct, cps) => superdough(hap2value(hap), t - ct, hap.duration / cps, cps);
// uses more precise, absolute t if available, see https://github.com/tidalcycles/strudel/pull/1004
export const webaudioOutput = (hap, deadline, hapDuration, cps, t) =>
  superdough(hap2value(hap), t ? `=${t}` : deadline, hapDuration);

Pattern.prototype.webaudio = function () {
  return this.onTrigger(webaudioOutputTrigger);
};

export function webaudioRepl(options = {}) {
  options = {
    getTime: () => getAudioContext().currentTime,
    defaultOutput: webaudioOutput,
    ...options,
  };
  return repl(options);
}

Pattern.prototype.dough = function () {
  return this.onTrigger(doughTrigger, 1);
};
