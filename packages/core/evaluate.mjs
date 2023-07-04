/*
evaluate.mjs - <short description TODO>
Copyright (C) 2022 Strudel contributors - see <https://github.com/tidalcycles/strudel/blob/main/packages/core/evaluate.mjs>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { isPattern } from './index.mjs';

export const evalScope = async (...args) => {
  const results = await Promise.allSettled(args);
  const modules = results.filter((result) => result.status === 'fulfilled').map((r) => r.value);
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.warn(`evalScope: module with index ${i} could not be loaded:`, result.reason);
    }
  });
  // Object.assign(globalThis, ...modules);
  // below is a fix for above commented out line
  // same error as https://github.com/vitest-dev/vitest/issues/1807 when running this on astro server
  modules.forEach((module) => {
    Object.entries(module).forEach(([name, value]) => {
      globalThis[name] = value;
    });
  });
};

function safeEval(str, options = {}) {
  const { wrapExpression = true, wrapAsync = true } = options;
  if (wrapExpression) {
    str = `{${str}}`;
  }
  if (wrapAsync) {
    str = `(async ()=>${str})()`;
  }
  const body = `"use strict";return (${str})`;
  return Function(body)();
}

export const evaluate = async (code, transpiler) => {
  let meta = {};
  if (transpiler) {
    // transform syntactically correct js code to semantically usable code
    const transpiled = transpiler(code);
    code = transpiled.output;
    meta = transpiled;
  }
  // if no transpiler is given, we expect a single instruction (!wrapExpression)
  const options = { wrapExpression: !!transpiler };
  let evaluated = await safeEval(code, options);
  if (!isPattern(evaluated)) {
    console.log('evaluated', evaluated);
    const message = `got "${typeof evaluated}" instead of pattern`;
    throw new Error(message + (typeof evaluated === 'function' ? ', did you forget to call a function?' : '.'));
  }
  return { mode: 'javascript', pattern: evaluated, meta };
};
