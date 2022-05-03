/*
evaluate.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/eval/evaluate.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import shapeshifter from './shapeshifter.mjs';
import * as strudel from '@strudel.cycles/core';

const { isPattern } = strudel;

export const extend = (...args) => {
  // TODO: find a way to make args available to eval without adding it to global scope...
  // sadly, "with" does not work in strict mode
  Object.assign(globalThis, ...args);
};

export const evaluate = async (code) => {
  const shapeshifted = shapeshifter(code); // transform syntactically correct js code to semantically usable code
  let evaluated = await eval(shapeshifted);
  if (!isPattern(evaluated)) {
    console.log('evaluated', evaluated);
    const message = `got "${typeof evaluated}" instead of pattern`;
    throw new Error(message + (typeof evaluated === 'function' ? ', did you forget to call a function?' : '.'));
  }
  return { mode: 'javascript', pattern: evaluated };
};
