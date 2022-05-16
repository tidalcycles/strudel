/*
evaluate.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/eval/evaluate.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import shapeshifter from './shapeshifter.mjs';
import * as strudel from '@strudel.cycles/core';

const { isPattern, Pattern } = strudel;

export const extend = (...args) => {
  console.warn('@strudel.cycles/eval extend is deprecated, please use evalScopep instead');
  Object.assign(globalThis, ...args);
};

let scoped = false;
export const evalScope = async (...args) => {
  if (scoped) {
    console.warn('@strudel.cycles/eval evalScope was called more than once.');
  }
  scoped = true;
  const modules = await Promise.all(args);
  Object.assign(globalThis, ...modules, Pattern.prototype.bootstrap());
};

function safeEval(str) {
  return Function('"use strict";return (' + str + ')')();
}

export const evaluate = async (code) => {
  if (!scoped) {
    await evalScope(); // at least scope Pattern.prototype.boostrap
  }
  const shapeshifted = shapeshifter(code); // transform syntactically correct js code to semantically usable code
  let evaluated = await safeEval(shapeshifted);
  if (!isPattern(evaluated)) {
    console.log('evaluated', evaluated);
    const message = `got "${typeof evaluated}" instead of pattern`;
    throw new Error(message + (typeof evaluated === 'function' ? ', did you forget to call a function?' : '.'));
  }
  return { mode: 'javascript', pattern: evaluated };
};
