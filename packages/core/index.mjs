/*
index.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/index.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

export * from './controls.mjs';
export * from './euclid.mjs';
import Fraction from './fraction.mjs';
export { Fraction };
export * from './hap.mjs';
export * from './pattern.mjs';
export * from './signal.mjs';
export * from './state.mjs';
export * from './timespan.mjs';
export * from './util.mjs';
export * from './speak.mjs';
export { default as gist } from './gist.js';
import * as p from './package.json';
export const version = p.version;
console.log(
  '%c 🌀 @strudel.cycles/core version ' + version + ' 🌀',
  'background-color: black;color:white;padding:4px;border-radius:15px',
);
if (window._strudelLoaded) {
  console.warn(
    `@strudel.cycles/core was loaded more than once...
This might happen when you have multiple versions of strudel installed. 
Please check with "npm ls @strudel.cycles/core".`,
  );
}
window._strudelLoaded = true;
