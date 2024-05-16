/*
index.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/index.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import * as controls from './controls.mjs'; // legacy
export * from './euclid.mjs';
import Fraction from './fraction.mjs';
import createClock from './zyklus.mjs';
import { logger } from './logger.mjs';
export { Fraction, controls, createClock };
export * from './controls.mjs';
export * from './hap.mjs';
export * from './pattern.mjs';
export * from './signal.mjs';
export * from './state.mjs';
export * from './timespan.mjs';
export * from './util.mjs';
export * from './speak.mjs';
export * from './evaluate.mjs';
export * from './repl.mjs';
export * from './cyclist.mjs';
export * from './logger.mjs';
export * from './time.mjs';
export * from './ui.mjs';
export { default as drawLine } from './drawLine.mjs';
// below won't work with runtime.mjs (json import fails)
/* import * as p from './package.json';
export const version = p.version; */
logger('🌀 @strudel/core loaded 🌀');
if (globalThis._strudelLoaded) {
  console.warn(
    `@strudel/core was loaded more than once...
This might happen when you have multiple versions of strudel installed. 
Please check with "npm ls @strudel/core".`,
  );
}
globalThis._strudelLoaded = true;
