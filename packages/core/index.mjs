/*
index.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/index.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import Fraction from './fraction.mjs';

import drawLine from './drawLine.mjs';
import gist from './gist.js';
import { logger } from './logger.mjs';
// Fraction: Fraction, drawLine: drawline, gist: gist, logger: logger,

import controls from './controls.mjs';
import pattern from './pattern.mjs';

import * as draw from './draw.mjs';
import * as euclid from './euclid.mjs';
import * as evaluate from './evaluate.mjs';
import * as hap from './hap.mjs';
import * as repl from './repl.mjs';
import * as pianoroll from './pianoroll.mjs';
import * as signal from './signal.mjs';
import * as speak from './speak.mjs';
import * as state from './state.mjs';
import * as time from './time.mjs';
import * as timespan from './timespan.mjs';
import * as ui from './ui.mjs';
import * as util from './util.mjs';

const core = { ...controls, ...pattern, ...draw, ...euclid,
	       ...evaluate, ...hap, ...logger, ...repl, ...pianoroll, ...signal, ...speak,
	       ...state, ...time, ...timespan, ...ui, ...util
	     };
export default core;

// below won't work with runtime.mjs (json import fails)
/* import * as p from './package.json';
export const version = p.version; */
logger('🌀 @strudel.cycles/core loaded 🌀');
if (globalThis._strudelLoaded) {
  console.warn(
    `@strudel.cycles/core was loaded more than once...
This might happen when you have multiple versions of strudel installed. 
Please check with "npm ls @strudel.cycles/core".`,
  );
}
globalThis._strudelLoaded = true;
